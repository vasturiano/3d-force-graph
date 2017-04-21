import './3d-force-graph.css';

import './threeGlobal';
import 'three/examples/js/controls/TrackBallControls';

import graph from 'ngraph.graph';
import forcelayout3d from 'ngraph.forcelayout3d';
const ngraph = { graph, forcelayout3d };

import * as SWC from 'swc';

//

const CAMERA_DISTANCE2NODES_FACTOR = 150;

export default SWC.createComponent({

	props: [
		new SWC.Prop('width', window.innerWidth),
		new SWC.Prop('height', window.innerHeight),
		new SWC.Prop('graphData', {
			nodes: {},
			links: [] // [from, to]
		}),
		new SWC.Prop('nodeRelSize', 4), // volume per val unit
		new SWC.Prop('lineOpacity', 0.2),
		new SWC.Prop('valAccessor', node => node.val),
		new SWC.Prop('nameAccessor', node => node.name),
		new SWC.Prop('colorAccessor', node => node.color),
		new SWC.Prop('warmUpTicks', 0), // how many times to tick the force engine at init before starting to render
		new SWC.Prop('coolDownTicks', Infinity),
		new SWC.Prop('coolDownTime', 15000) // ms
	],

	init: (domNode, state) => {
		// Init state
		state.onFrame = (() => {});

		// Wipe DOM
		domNode.innerHTML = '';

		// Add nav info section
		const navInfo = document.createElement('div');
		navInfo.classList.add('graph-nav-info');
		navInfo.innerHTML = "MOVE mouse &amp; press LEFT/A: rotate, MIDDLE/S: zoom, RIGHT/D: pan";
		domNode.appendChild(navInfo);

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

		// Setup camera
		state.camera = new THREE.PerspectiveCamera();
		state.camera.far = 20000;
		state.camera.position.z = 1000;

		// Setup scene
		state.scene = new THREE.Scene();

		// Setup renderer
		state.renderer = new THREE.WebGLRenderer();
		domNode.appendChild(state.renderer.domElement);

		// Add camera interaction
		const tbControls = new THREE.TrackballControls(state.camera, state.renderer.domElement);

		//

		// Kick-off renderer
		(function animate() { // IIFE
			state.onFrame();

			// Update tooltip
			raycaster.setFromCamera(mousePos, state.camera);
			const intersects = raycaster.intersectObjects(state.scene.children);
			toolTipElem.innerHTML = intersects.length ? intersects[0].object.name || '' : '';

			// Frame cycle
			tbControls.update();
			state.renderer.render(state.scene, state.camera);
			requestAnimationFrame(animate);
		})();
	},

	update: state => {
		resizeCanvas();

		state.onFrame = ()=>{}; // Clear previous frame hook
		state.scene = new THREE.Scene(); // Clear the place

		// Build graph with data
		const graph = ngraph.graph();
		for (let nodeId in state.graphData.nodes) {
			graph.addNode(nodeId, state.graphData.nodes[nodeId]);
		}
		for (let link of state.graphData.links) {
			graph.addLink(...link, {});
		}

		// Add WebGL objects
		graph.forEachNode(node => {
			const nodeMaterial = new THREE.MeshBasicMaterial({ color: state.colorAccessor(node.data) || 0xffffaa, transparent: true });
			nodeMaterial.opacity = 0.75;

			const sphere = new THREE.Mesh(
				new THREE.SphereGeometry(Math.cbrt(state.valAccessor(node.data) || 1) * state.nodeRelSize, 8, 8),
				nodeMaterial
			);
			sphere.name = state.nameAccessor(node.data) || '';

			state.scene.add(node.data.sphere = sphere)
		});

		const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xf0f0f0, transparent: true });
		lineMaterial.opacity = state.lineOpacity;
		graph.forEachLink(link => {
			const line = new THREE.Line(new THREE.Geometry(), lineMaterial),
				fromName = getNodeName(link.fromId),
				toName = getNodeName(link.toId);
			if (fromName && toName) { line.name = `${fromName} > ${toName}`; }

			state.scene.add(link.data.line = line);

			function getNodeName(nodeId) {
				return state.nameAccessor(graph.getNode(nodeId).data);
			}
		});

		state.camera.lookAt(state.scene.position);
		state.camera.position.z = Math.cbrt(Object.keys(state.graphData.nodes).length) * CAMERA_DISTANCE2NODES_FACTOR;

		// Add force-directed layout
		const layout = ngraph.forcelayout3d(graph);

		for (let i=0; i<state.warmUpTicks; i++) { layout.step(); } // Initial ticks before starting to render

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
			if (cntTicks++ > state.coolDownTicks || (new Date()) - startTickTime > state.coolDownTime) {
				state.onFrame = ()=>{}; // Stop ticking graph
			}

			layout.step(); // Tick it

			// Update nodes position
			graph.forEachNode(node => {
				const sphere = node.data.sphere,
					pos = layout.getNodePosition(node.id);

				sphere.position.x = pos.x;
				sphere.position.y = pos.y;
				sphere.position.z = pos.z;
			});

			// Update links position
			graph.forEachLink(link => {
				const line = link.data.line,
					pos = layout.getLinkPosition(link.id);

				line.geometry.vertices = [
					new THREE.Vector3(pos.from.x, pos.from.y, pos.from.z),
					new THREE.Vector3(pos.to.x, pos.to.y, pos.to.z)
				];

				line.geometry.verticesNeedUpdate = true;
				line.geometry.computeBoundingSphere();
			});
		}
	}
});

