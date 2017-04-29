import './3d-force-graph.css';

import './threeGlobal';
import 'three/examples/js/controls/TrackBallControls';

import graph from 'ngraph.graph';
import forcelayout from 'ngraph.forcelayout';
import forcelayout3d from 'ngraph.forcelayout3d';
const ngraph = { graph, forcelayout, forcelayout3d };

import * as SWC from 'swc';

//

const CAMERA_DISTANCE2NODES_FACTOR = 150;

export default SWC.createComponent({

	props: [
		new SWC.Prop('width', window.innerWidth),
		new SWC.Prop('height', window.innerHeight),
		new SWC.Prop('jsonUrl'),
		new SWC.Prop('graphData', {
			nodes: [],
			links: []
		}),
		new SWC.Prop('numDimensions', 3),
		new SWC.Prop('nodeRelSize', 4), // volume per val unit
		new SWC.Prop('lineOpacity', 0.2),
		new SWC.Prop('autoColorBy'),
		new SWC.Prop('idField', 'id'),
		new SWC.Prop('valField', 'val'),
		new SWC.Prop('nameField', 'name'),
		new SWC.Prop('colorField', 'color'),
		new SWC.Prop('linkSourceField', 'source'),
		new SWC.Prop('linkTargetField', 'target'),
		new SWC.Prop('warmupTicks', 0), // how many times to tick the force engine at init before starting to render
		new SWC.Prop('cooldownTicks', Infinity),
		new SWC.Prop('cooldownTime', 15000) // ms
	],

	init: (domNode, state) => {
		// Wipe DOM
		domNode.innerHTML = '';

		// Add nav info section
		let navInfo;
		domNode.appendChild(navInfo = document.createElement('div'));
		navInfo.className = 'graph-nav-info';
		navInfo.textContent = "MOVE mouse & press LEFT/A: rotate, MIDDLE/S: zoom, RIGHT/D: pan";

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

		// Setup renderer
		state.renderer = new THREE.WebGLRenderer();
		domNode.appendChild(state.renderer.domElement);

		// Setup scene
		const scene = new THREE.Scene();
		scene.add(state.graphScene = new THREE.Group());

		// Setup camera
		state.camera = new THREE.PerspectiveCamera();
		state.camera.far = 20000;

		// Add camera interaction
		const tbControls = new THREE.TrackballControls(state.camera, state.renderer.domElement);

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

	update: state => {
		resizeCanvas();

		state.onFrame = null; // Pause simulation

		if (state.jsonUrl && !state.graphData.nodes.length && !state.graphData.links.length) {
			// (Re-)load data
			qwest.get(state.jsonUrl).then((_, json) => {
				state.graphData = json;
				this.update(state);  // Force re-update
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

		state.graphData.nodes.forEach(node => {
			const nodeMaterial = new THREE.MeshBasicMaterial({ color: node[state.colorField] || 0xffffaa, transparent: true });
			nodeMaterial.opacity = 0.75;

			const sphere = new THREE.Mesh(
				new THREE.SphereGeometry(Math.cbrt(node[state.valField] || 1) * state.nodeRelSize, 8, 8),
				nodeMaterial
			);

			sphere.name = node[state.nameField]; // Add label

			state.graphScene.add(node.__sphere = sphere);
		});

		const lineMaterial = new THREE.LineBasicMaterial({ color: 0xf0f0f0, transparent: true });
		lineMaterial.opacity = state.lineOpacity;

		state.graphData.links.forEach(link => {
			const line = new THREE.Line(new THREE.Geometry(), lineMaterial);
			line.geometry.vertices=[new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0)];

			state.graphScene.add(link.__line = line);
		});

		state.camera.lookAt(state.graphScene.position);
		state.camera.position.z = Math.cbrt(state.graphData.nodes.length) * CAMERA_DISTANCE2NODES_FACTOR;

		// Add force-directed layout
		const graph = ngraph.graph();
		state.graphData.nodes.forEach(node => { graph.addNode(node[state.idField]); });
		state.graphData.links.forEach(link => { graph.addLink(link.source, link.target); });
		const layout = ngraph['forcelayout' + (state.numDimensions === 2 ? '' : '3d')](graph);

		for (let i=0; i<state.warmupTicks; i++) { layout.step(); } // Initial ticks before starting to render

		let cntTicks = 0;
		const startTickTime = new Date();
		state.onFrame = layoutTick;

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

			layout.step(); // Tick it

			// Update nodes position
			state.graphData.nodes.forEach(node => {
				const sphere = node.__sphere,
					pos = layout.getNodePosition(node[state.idField]);
				sphere.position.x = pos.x;
				sphere.position.y = pos.y || 0;
				sphere.position.z = pos.z || 0;
			});

			// Update links position
			state.graphData.links.forEach(link => {
				const line = link.__line,
					pos = layout.getLinkPosition(graph.getLink(link.source, link.target).id);

				line.geometry.vertices = [
					new THREE.Vector3(pos.from.x, pos.from.y || 0, pos.from.z || 0),
					new THREE.Vector3(pos.to.x, pos.to.y || 0, pos.to.z || 0)
				];

				line.geometry.verticesNeedUpdate = true;
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

