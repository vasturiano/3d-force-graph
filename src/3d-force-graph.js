import {
  WebGLRenderer as ThreeWebGLRenderer,
  Scene as ThreeScene,
  PerspectiveCamera as ThreePerspectiveCamera,
  AmbientLight as ThreeAmbientLight,
  DirectionalLight as ThreeDirectionalLight,
  Raycaster as ThreeRaycaster,
  Vector2 as ThreeVector2,
  Color as ThreeColor
} from 'three';
import ThreeTrackballControls from 'three-trackballcontrols';
import ThreeForceGraph from 'three-forcegraph';

import accessorFn from 'accessor-fn';
import Kapsule from 'kapsule';

import linkKapsule from './kapsule-link.js';
import colorStr2Hex from './color2hex.js';

//

const CAMERA_DISTANCE2NODES_FACTOR = 150;

//

// Expose config from forceGraph
const bindFG = linkKapsule('forceGraph', ThreeForceGraph);
const linkedFGProps = Object.assign(...[
  'jsonUrl',
  'graphData',
  'numDimensions',
  'nodeRelSize',
  'autoColorBy',
  'nodeId',
  'nodeVal',
  'nodeResolution',
  'nodeColor',
  'nodeThreeObject',
  'linkSource',
  'linkTarget',
  'linkColor',
  'linkOpacity',
  'forceEngine',
  'd3AlphaDecay',
  'd3VelocityDecay',
  'warmupTicks',
  'cooldownTicks',
  'cooldownTime'
].map(p => ({ [p]: bindFG.linkProp(p)})));
const linkedFGMethods = Object.assign(...[
  'd3Force'
].map(p => ({ [p]: bindFG.linkMethod(p)})));

//

export default Kapsule({

  props: {
    width: { default: window.innerWidth },
    height: { default: window.innerHeight },
    backgroundColor: {
      default: '#000011',
      onChange(bckgColor, state) { state.scene.background = new ThreeColor(colorStr2Hex(bckgColor)); },
      triggerUpdate: false
    },
    nodeLabel: { default: 'name', triggerUpdate: false },
    onNodeClick: { triggerUpdate: false },
    onNodeHover: { default: () => {}, triggerUpdate: false },
    ...linkedFGProps
  },

  aliases: { // Prop names supported for backwards compatibility
    nameField: 'nodeLabel',
    idField: 'nodeId',
    valField: 'nodeVal',
    colorField: 'nodeColor',
    linkSourceField: 'linkSource',
    linkTargetField: 'linkTarget',
    linkColorField: 'linkColor',
    lineOpacity: 'linkOpacity'
},

  methods: {
    ...linkedFGMethods
  },

  stateInit: () => ({
    renderer: new ThreeWebGLRenderer(),
    scene: new ThreeScene(),
    camera: new ThreePerspectiveCamera(),
    forceGraph: new ThreeForceGraph()
  }),

  init: function(domNode, state) {
    // Wipe DOM
    domNode.innerHTML = '';

    // Add nav info section
    let navInfo;
    domNode.appendChild(navInfo = document.createElement('div'));
    navInfo.className = 'graph-nav-info';
    navInfo.textContent = "MOVE mouse & press LEFT/A: rotate, MIDDLE/S: zoom, RIGHT/D: pan";

    // Add info space
    let infoElem;
    domNode.appendChild(infoElem = document.createElement('div'));
    infoElem.className = 'graph-info-msg';
    infoElem.textContent = '';
    state.forceGraph.onLoading(() => { infoElem.textContent = 'Loading...' });
    state.forceGraph.onFinishLoading(() => {
      infoElem.textContent = '';

      // re-aim camera, if still in default position (not user modified)
      if (state.camera.position.x === 0 && state.camera.position.y === 0) {
        state.camera.lookAt(state.forceGraph.position);
        state.camera.position.z = Math.cbrt(state.forceGraph.graphData().nodes.length) * CAMERA_DISTANCE2NODES_FACTOR;
      }
    });

    // Setup tooltip
    const toolTipElem = document.createElement('div');
    toolTipElem.classList.add('graph-tooltip');
    domNode.appendChild(toolTipElem);

    // Capture mouse coords on move
    const raycaster = new ThreeRaycaster();
    const mousePos = new ThreeVector2();
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
      if (state.onNodeClick && state.hoverNode) {
        state.onNodeClick(state.hoverNode);
      }
    }, false);

    // Setup renderer, camera and controls
    domNode.appendChild(state.renderer.domElement);
    const tbControls = new ThreeTrackballControls(state.camera, state.renderer.domElement);

    state.renderer.setSize(state.width, state.height);
    state.camera.far = 20000;

    // Populate scene
    state.scene.add(state.forceGraph);
    state.scene.add(new ThreeAmbientLight(0xbbbbbb));
    state.scene.add(new ThreeDirectionalLight(0xffffff, 0.6));

    //

    // Kick-off renderer
    (function animate() { // IIFE
      // Update tooltip and trigger onHover events
      raycaster.setFromCamera(mousePos, state.camera);
      const intersects = raycaster.intersectObjects(state.forceGraph.children)
        .filter(o => o.object.__graphObjType === 'node'); // Check only node objects

      const topObject = intersects.length ? intersects[0].object : null;

      const hoverNode = topObject ? topObject.__data : null;
      if (state.hoverNode !== hoverNode) {
        state.hoverNode = hoverNode;
        state.onNodeHover(hoverNode);

        toolTipElem.textContent = hoverNode ? accessorFn(state.nodeLabel)(hoverNode) : '';
      }

      // Frame cycle
      state.forceGraph.tickFrame();
      tbControls.update();
      state.renderer.render(state.scene, state.camera);
      requestAnimationFrame(animate);
    })();
  },

  update: function updateFn(state) {
    // resize canvas
    if (state.width && state.height) {
      state.renderer.setSize(state.width, state.height);
      state.camera.aspect = state.width/state.height;
      state.camera.updateProjectionMatrix();
    }
  }

});
