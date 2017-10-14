import './3d-force-graph.css';

import './threeGlobal';
import 'three/examples/js/controls/TrackBallControls';
import qwest from 'qwest';

import * as d3 from 'd3-force-3d';
import graph from 'ngraph.graph';
import forcelayout from 'ngraph.forcelayout';
import forcelayout3d from 'ngraph.forcelayout3d';
const ngraph = { graph, forcelayout, forcelayout3d };

import Kapsule from 'kapsule';

//

const CAMERA_DISTANCE2NODES_FACTOR = 150;

export default Kapsule({

    props: {
        width: { default: window.innerWidth },
        height: { default: window.innerHeight },
        jsonUrl: {},
        graphData: {
            default: {
                nodes: [],
                links: []
            },
            onChange(_, state) { state.onFrame = null; } // Pause simulation
        },
        numDimensions: { default: 3 },
        nodeRelSize: { default: 4 }, // volume per val unit
        nodeResolution: { default: 8 }, // how many slice segments in the sphere's circumference
        onNodeClick: {},
        lineOpacity: { default: 0.2 },
        autoColorBy: {},
        idField: { default: 'id' },
        valField: { default: 'val' },
        nameField: { default: 'name' },
        colorField: { default: 'color' },
        linkSourceField: { default: 'source' },
        linkTargetField: { default: 'target' },
        forceEngine: { default: 'd3' }, // d3 or ngraph
        warmupTicks: { default: 0 }, // how many times to tick the force engine at init before starting to render
        cooldownTicks: { default: Infinity },
        cooldownTime: { default: 15000 } // ms
    },

    init: function(domNode, state) {
        // Wipe DOM
        domNode.innerHTML = '';

        // Add nav info section
        let navInfo;
        domNode.appendChild(navInfo = document.createElement('div'));
        navInfo.className = 'graph-nav-info';
        navInfo.textContent = "MOVE mouse & press LEFT/A: rotate, MIDDLE/S: zoom, RIGHT/D: pan";

        // Add info space
        domNode.appendChild(state.infoElem = document.createElement('div'));
        state.infoElem.className = 'graph-info-msg';
        state.infoElem.textContent = '';

        // Setup tooltip
        const toolTipElem = document.createElement('div');
        toolTipElem.classList.add('graph-tooltip');
        domNode.appendChild(toolTipElem);

        // Capture mouse coords on move
        const raycaster = new THREE.Raycaster();
        const mousePos = new THREE.Vector2();
        mousePos.x = -2; // Initialize off canvas
        mousePos.y = -2;
        domNode.addEventListener("mousemove", ev => {
            // update the mouse pos
            const offset = getOffset(domNode),
                relPos = {
                    x: ev.pageX - offset.left,
                    y: ev.pageY - offset.top
                };
            mousePos.x = (relPos.x / state.width) * 2 - 1;
            mousePos.y = -(relPos.y / state.height) * 2 + 1;

            // Move tooltip
            toolTipElem.style.top = (relPos.y - 40) + 'px';
            toolTipElem.style.left = (relPos.x - 20) + 'px';

            function getOffset(el) {
                const rect = el.getBoundingClientRect(),
                    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
                    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
            }
        }, false);

        // Handle click events on nodes
        domNode.addEventListener("click", ev => {
            if (state.onNodeClick) {
                raycaster.setFromCamera(mousePos, state.camera);
                const intersects = raycaster.intersectObjects(state.graphScene.children)
                    .filter(o => o.object.__data); // Check only objects with data (nodes)
                if (intersects.length) {
                    state.onNodeClick(intersects[0].object.__data);
                }
            }
        }, false);

        // Setup renderer
        state.renderer = new THREE.WebGLRenderer();
        domNode.appendChild(state.renderer.domElement);

        // Setup scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000011);
        scene.add(state.graphScene = new THREE.Group());

        // Add lights
        scene.add(new THREE.AmbientLight(0xbbbbbb));
        scene.add(new THREE.DirectionalLight(0xffffff, 0.6));

        // Setup camera
        state.camera = new THREE.PerspectiveCamera();
        state.camera.far = 20000;

        // Add camera interaction
        const tbControls = new THREE.TrackballControls(state.camera, state.renderer.domElement);

        // Add D3 force-directed layout
        this.d3ForceLayout = state.d3ForceLayout = d3.forceSimulation()
            .force('link', d3.forceLink())
            .force('charge', d3.forceManyBody())
            .force('center', d3.forceCenter())
            .stop();

        //

        // Kick-off renderer
        (function animate() { // IIFE
            if(state.onFrame) state.onFrame();

            // Update tooltip
            raycaster.setFromCamera(mousePos, state.camera);
            const intersects = raycaster.intersectObjects(state.graphScene.children)
                .filter(o => o.object.name); // Check only objects with labels
            toolTipElem.textContent = intersects.length ? intersects[0].object.name : '';

            // Frame cycle
            tbControls.update();
            state.renderer.render(scene, state.camera);
            requestAnimationFrame(animate);
        })();
    },

    update: function updateFn(state) {
        resizeCanvas();

        state.onFrame = null; // Pause simulation
        state.infoElem.textContent = 'Loading...';

        if (state.graphData.nodes.length || state.graphData.links.length) {
            console.info('3d-force-graph loading', state.graphData.nodes.length + ' nodes', state.graphData.links.length + ' links');
        }

        if (!state.fetchingJson && state.jsonUrl && !state.graphData.nodes.length && !state.graphData.links.length) {
            // (Re-)load data
            state.fetchingJson = true;
            qwest.get(state.jsonUrl).then((_, json) => {
                state.fetchingJson = false;
                state.graphData = json;
                updateFn(state);  // Force re-update
            });
        }

        // Auto add color to uncolored nodes
        autoColorNodes(state.graphData.nodes, state.autoColorBy, state.colorField);

        // parse links
        state.graphData.links.forEach(link => {
            link.source = link[state.linkSourceField];
            link.target = link[state.linkTargetField];
        });

        // Add WebGL objects
        while (state.graphScene.children.length) { state.graphScene.remove(state.graphScene.children[0]) } // Clear the place

        let sphereGeometries = {}; // indexed by node value
        let sphereMaterials = {}; // indexed by color
        state.graphData.nodes.forEach(node => {
            const val = node[state.valField] || 1;
            if (!sphereGeometries.hasOwnProperty(val)) {
                sphereGeometries[val] = new THREE.SphereGeometry(Math.cbrt(val) * state.nodeRelSize, state.nodeResolution, state.nodeResolution);
            }

            const color = node[state.colorField] || 0xffffaa;
            if (!sphereMaterials.hasOwnProperty(color)) {
                sphereMaterials[color] = new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.75 });
            }

            const sphere = new THREE.Mesh(sphereGeometries[val], sphereMaterials[color]);

            sphere.name = node[state.nameField]; // Add label
            sphere.__data = node; // Attach node data

            state.graphScene.add(node.__sphere = sphere);
        });

        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xf0f0f0, transparent: true, opacity: state.lineOpacity });
        state.graphData.links.forEach(link => {
            const geometry = new THREE.BufferGeometry();
            geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(2 * 3), 3));
            const line = new THREE.Line(geometry, lineMaterial);

            line.renderOrder = 10; // Prevent visual glitches of dark lines on top of spheres by rendering them last

            state.graphScene.add(link.__line = line);
        });

        if (state.camera.position.x === 0 && state.camera.position.y === 0) {
            // If camera still in default position (not user modified)
            state.camera.lookAt(state.graphScene.position);
            state.camera.position.z = Math.cbrt(state.graphData.nodes.length) * CAMERA_DISTANCE2NODES_FACTOR;
        }

        // Feed data to force-directed layout
        const isD3Sim = state.forceEngine !== 'ngraph';
        let layout;
        if (isD3Sim) {
            // D3-force
            (layout = state.d3ForceLayout)
                .stop()
                .alpha(1)// re-heat the simulation
                .numDimensions(state.numDimensions)
                .nodes(state.graphData.nodes)
                .force('link')
                    .id(d => d[state.idField])
                    .links(state.graphData.links);
        } else {
            // ngraph
            const graph = ngraph.graph();
            state.graphData.nodes.forEach(node => { graph.addNode(node[state.idField]); });
            state.graphData.links.forEach(link => { graph.addLink(link.source, link.target); });
            layout = ngraph['forcelayout' + (state.numDimensions === 2 ? '' : '3d')](graph);
            layout.graph = graph; // Attach graph reference to layout
        }

        for (let i=0; i<state.warmupTicks; i++) { layout[isD3Sim?'tick':'step'](); } // Initial ticks before starting to render

        let cntTicks = 0;
        const startTickTime = new Date();
        state.onFrame = layoutTick;
        state.infoElem.textContent = '';

        //

        function resizeCanvas() {
            if (state.width && state.height) {
                state.renderer.setSize(state.width, state.height);
                state.camera.aspect = state.width/state.height;
                state.camera.updateProjectionMatrix();
            }
        }

        function layoutTick() {
            if (cntTicks++ > state.cooldownTicks || (new Date()) - startTickTime > state.cooldownTime) {
                state.onFrame = null; // Stop ticking graph
            }

            layout[isD3Sim?'tick':'step'](); // Tick it

            // Update nodes position
            state.graphData.nodes.forEach(node => {
                const sphere = node.__sphere;
                if (!sphere) return;

                const pos = isD3Sim ? node : layout.getNodePosition(node[state.idField]);

                sphere.position.x = pos.x;
                sphere.position.y = pos.y || 0;
                sphere.position.z = pos.z || 0;
            });

            // Update links position
            state.graphData.links.forEach(link => {
                const line = link.__line;
                if (!line) return;

                const pos = isD3Sim
                        ? link
                        : layout.getLinkPosition(layout.graph.getLink(link.source, link.target).id),
                    start = pos[isD3Sim ? 'source' : 'from'],
                    end = pos[isD3Sim ? 'target' : 'to'],
                    linePos = line.geometry.attributes.position;

                linePos.array[0] = start.x;
                linePos.array[1] = start.y || 0;
                linePos.array[2] = start.z || 0;
                linePos.array[3] = end.x;
                linePos.array[4] = end.y || 0;
                linePos.array[5] = end.z || 0;

                linePos.needsUpdate = true;
                line.geometry.computeBoundingSphere();
            });
        }

        function autoColorNodes(nodes, colorBy, colorField) {
            if (!colorBy) return;

            // Color brewer paired set
            const colors = ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928'];

            const uncoloredNodes = nodes.filter(node => !node[colorField]),
                nodeGroups = {};

            uncoloredNodes.forEach(node => { nodeGroups[node[colorBy]] = null });
            Object.keys(nodeGroups).forEach((group, idx) => { nodeGroups[group] = idx });

            uncoloredNodes.forEach(node => {
                node[colorField] = parseInt(colors[nodeGroups[node[colorBy]] % colors.length].slice(1), 16);
            });
        }
    }
});

