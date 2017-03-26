import './3d-force-graph.css';

import * as THREE from 'three';
import TrackballControls from 'three-trackballcontrols';

import graph from 'ngraph.graph';
import forcelayout3d from 'ngraph.forcelayout3d';
const ngraph = { graph, forcelayout3d };

export default function() {

	const CAMERA_DISTANCE2NODES_FACTOR = 150;

	class CompProp {
		constructor(name, initVal = null, redigest = true, onChange = newVal => {}) {
			this.name = name;
			this.initVal = initVal;
			this.redigest = redigest;
			this.onChange = onChange;
		}
	}

	const env = { // Holds component state
		initialised: false,
		onFrame: () => {}
	};

	const exposeProps = [
		new CompProp('width', window.innerWidth),
		new CompProp('height', window.innerHeight),
		new CompProp('graphData', {
			nodes: { 1: { name: 'mock', val: 1 } },
			links: [[1, 1]] // [from, to]
		}),
		new CompProp('nodeRelSize', 4), // volume per val unit
		new CompProp('lineOpacity', 0.2),
		new CompProp('valAccessor', node => node.val),
		new CompProp('nameAccessor', node => node.name),
		new CompProp('colorAccessor', node => node.color),
		new CompProp('initialEngineTicks', 0), // how many times to tick the force engine at init before starting to render
		new CompProp('maxConvergeTime', 15000), // ms
		new CompProp('maxConvergeFrames', 300)
	];

	function initStatic() {
		// Wipe DOM
		env.domNode.innerHTML = '';

		// Add nav info section
		const navInfo = document.createElement('div');
		navInfo.classList.add('graph-nav-info');
		navInfo.innerHTML = "MOVE mouse &amp; press LEFT/A: rotate, MIDDLE/S: zoom, RIGHT/D: pan";
		env.domNode.appendChild(navInfo);

		// Setup tooltip
		env.toolTipElem = document.createElement('div');
		env.toolTipElem.classList.add('graph-tooltip');
		env.domNode.appendChild(env.toolTipElem);

		// Capture mouse coords on move
		env.raycaster = new THREE.Raycaster();
		env.mouse = new THREE.Vector2();
		env.mouse.x = -2; // Initialize off canvas
		env.mouse.y = -2;
		env.domNode.addEventListener("mousemove", ev => {
			// update the mouse pos
			const offset = getOffset(env.domNode),
				relPos = {
					x: ev.pageX - offset.left,
					y: ev.pageY - offset.top
				};
			env.mouse.x = (relPos.x / env.width) * 2 - 1;
			env.mouse.y = -(relPos.y / env.height) * 2 + 1;

			// Move tooltip
			env.toolTipElem.style.top = (relPos.y - 40) + 'px';
			env.toolTipElem.style.left = (relPos.x - 20) + 'px';

			function getOffset(el) {
				const rect = el.getBoundingClientRect(),
					scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
					scrollTop = window.pageYOffset || document.documentElement.scrollTop;
				return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
			}
		}, false);

		// Setup camera
		env.camera = new THREE.PerspectiveCamera();
		env.camera.far = 20000;
		env.camera.position.z = 1000;

		// Setup scene
		env.scene = new THREE.Scene();

		// Setup renderer
		env.renderer = new THREE.WebGLRenderer();
		env.domNode.appendChild(env.renderer.domElement);

		// Add camera interaction
		env.controls = new TrackballControls(env.camera, env.renderer.domElement);


		env.initialised = true;

		//

		// Kick-off renderer
		(function animate() { // IIFE
			env.onFrame();

			// Update tooltip
			env.raycaster.setFromCamera(env.mouse, env.camera);
			const intersects = env.raycaster.intersectObjects(env.scene.children);
			env.toolTipElem.innerHTML = intersects.length ? intersects[0].object.name || '' : '';

			// Frame cycle
			env.controls.update();
			env.renderer.render(env.scene, env.camera);
			requestAnimationFrame(animate);
		})()
	}

	function digest() {
		if (!env.initialised) { return }

		resizeCanvas();

		env.onFrame = ()=>{}; // Clear previous frame hook
		env.scene = new THREE.Scene(); // Clear the place

		// Build graph with data
		const graph = ngraph.graph();
		for (let nodeId in env.graphData.nodes) {
			graph.addNode(nodeId, env.graphData.nodes[nodeId]);
		}
		for (let link of env.graphData.links) {
			graph.addLink(...link, {});
		}

		// Add WebGL objects
		graph.forEachNode(node => {
			const nodeMaterial = new THREE.MeshBasicMaterial({ color: env.colorAccessor(node.data) || 0xffffaa, transparent: true });
			nodeMaterial.opacity = 0.75;

			const sphere = new THREE.Mesh(
				new THREE.SphereGeometry(Math.cbrt(env.valAccessor(node.data) || 1) * env.nodeRelSize),
				nodeMaterial
			);
			sphere.name = env.nameAccessor(node.data) || '';

			env.scene.add(node.data.sphere = sphere)
		});

		const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xf0f0f0, transparent: true });
		lineMaterial.opacity = env.lineOpacity;
		graph.forEachLink(link => {
			const line = new THREE.Line(new THREE.Geometry(), lineMaterial);
			line.name = `${getNodeName(link.fromId)} > ${getNodeName(link.toId)}`;

			env.scene.add(link.data.line = line)

			function getNodeName(nodeId) {
				return env.nameAccessor(graph.getNode(nodeId).data);
			}
		});

		env.camera.lookAt(env.scene.position);
		env.camera.position.z = Math.cbrt(Object.keys(env.graphData.nodes).length) * CAMERA_DISTANCE2NODES_FACTOR;

		// Add force-directed layout
		const layout = ngraph.forcelayout3d(graph);

		for (let i=0; i<env.initialEngineTicks; i++) { layout.step(); } // Initial ticks before starting to render

		let cntTicks = 0;
		const startTickTime = new Date();
		env.onFrame = layoutTick;

		//

		function resizeCanvas() {
			if (env.width && env.height) {
				env.renderer.setSize(env.width, env.height);
				env.camera.aspect = env.width/env.height;
				env.camera.updateProjectionMatrix();
			}
		}

		function layoutTick() {
			if (cntTicks++ > env.maxConvergeFrames || (new Date()) - startTickTime > env.maxConvergeTime) {
				env.onFrame = ()=>{}; // Stop ticking graph
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

	// Component constructor
	function chart(nodeElement) {
		env.domNode = nodeElement;

		initStatic();
		digest();

		return chart;
	}

	// Getter/setter methods
	exposeProps.forEach(prop => {
		chart[prop.name] = getSetEnv(prop.name, prop.redigest, prop.onChange);
		env[prop.name] = prop.initVal;
		prop.onChange(prop.initVal);

		function getSetEnv(prop, redigest = false,  onChange = newVal => {}) {
			return _ => {
				if (!arguments.length) { return env[prop] }
				env[prop] = _;
				onChange(_);
				if (redigest) { digest() }
				return chart;
			}
		}
	});

	// Reset to default state
	chart.resetState = function() {
		this.graphData({nodes: [], links: []})
			.nodeRelSize(4)
			.lineOpacity(0.2)
			.valAccessor(node => node.val)
			.nameAccessor(node => node.name)
			.colorAccessor(node => node.color)
			.initialEngineTicks(0)
			.maxConvergeTime(15000) // ms
			.maxConvergeFrames(300);

		return this;
	};

	chart.resetState(); // Set defaults at instantiation

	return chart;
};
