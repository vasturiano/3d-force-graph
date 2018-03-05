import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  AmbientLight,
  DirectionalLight,
  Raycaster,
  Vector2,
  Color
} from 'three';

import tinycolor from 'tinycolor2';

const three = window.THREE
  ? window.THREE // Prefer consumption from global THREE, if exists
  : {
    WebGLRenderer,
    Scene,
    PerspectiveCamera,
    AmbientLight,
    DirectionalLight,
    Raycaster,
    Vector2,
    Color
  };

import ThreeTrackballControls from 'three-trackballcontrols';
import ThreeForceGraph from 'three-forcegraph';

import accessorFn from 'accessor-fn';
import Kapsule from 'kapsule';

import linkKapsule from './kapsule-link.js';

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
  'nodeId',
  'nodeVal',
  'nodeResolution',
  'nodeColor',
  'nodeAutoColorBy',
  'nodeOpacity',
  'nodeThreeObject',
  'linkSource',
  'linkTarget',
  'linkColor',
  'linkAutoColorBy',
  'linkOpacity',
  'linkWidth',
  'linkResolution',
  'linkDirectionalParticles',
  'linkDirectionalParticleSpeed',
  'linkDirectionalParticleWidth',
  'linkDirectionalParticleResolution',
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
      onChange(bckgColor, state) {
        const alpha = tinycolor(bckgColor).getAlpha();
        state.renderer.setClearColor(new three.Color(bckgColor), alpha);
      },
      triggerUpdate: false
    },
    showNavInfo: { default: true },
    nodeLabel: { default: 'name', triggerUpdate: false },
    linkLabel: { default: 'name', triggerUpdate: false },
    linkHoverPrecision: { default: 1, triggerUpdate: false },
    enablePointerInteraction: { default: true, onChange(_, state) { state.onHover = null; }, triggerUpdate: false },
    onNodeClick: { default: () => {}, triggerUpdate: false },
    onNodeHover: { default: () => {}, triggerUpdate: false },
    onLinkClick: { default: () => {}, triggerUpdate: false },
    onLinkHover: { default: () => {}, triggerUpdate: false },
    ...linkedFGProps
  },

  aliases: { // Prop names supported for backwards compatibility
    nameField: 'nodeLabel',
    idField: 'nodeId',
    valField: 'nodeVal',
    colorField: 'nodeColor',
    autoColorBy: 'nodeAutoColorBy',
    linkSourceField: 'linkSource',
    linkTargetField: 'linkTarget',
    linkColorField: 'linkColor',
    lineOpacity: 'linkOpacity'
  },

  methods: {
    cameraPosition: function(state, position) {
      // Setter
      if (position) {
        const { x, y, z } = position;
        if (x !== undefined) state.camera.position.x = x;
        if (y !== undefined) state.camera.position.y = y;
        if (z !== undefined) state.camera.position.z = z;
        state.camera.lookAt(state.forceGraph.position);
        return this;
      }

      // Getter
      return state.camera.position;
    },
    stopAnimation: function(state) {
      if (state.animationFrameRequestId) {
        cancelAnimationFrame(state.animationFrameRequestId);
      }
      return this;
    },
    ...linkedFGMethods
  },

  stateInit: () => ({
    renderer: new three.WebGLRenderer({ alpha: true }),
    scene: new three.Scene(),
    camera: new three.PerspectiveCamera(),
    lastSetCameraZ: 0,
    forceGraph: new ThreeForceGraph()
  }),

  init: function(domNode, state) {
    // Wipe DOM
    domNode.innerHTML = '';

    // Add nav info section
    domNode.appendChild(state.navInfo = document.createElement('div'));
    state.navInfo.className = 'graph-nav-info';
    state.navInfo.textContent = "MOVE mouse & press LEFT/A: rotate, MIDDLE/S: zoom, RIGHT/D: pan";

    // Add info space
    let infoElem;
    domNode.appendChild(infoElem = document.createElement('div'));
    infoElem.className = 'graph-info-msg';
    infoElem.textContent = '';
    state.forceGraph.onLoading(() => { infoElem.textContent = 'Loading...' });
    state.forceGraph.onFinishLoading(() => {
      infoElem.textContent = '';

      // re-aim camera, if still in default position (not user modified)
      if (state.camera.position.x === 0 && state.camera.position.y === 0 && state.camera.position.z === state.lastSetCameraZ) {
        state.camera.lookAt(state.forceGraph.position);
        state.lastSetCameraZ = state.camera.position.z = Math.cbrt(state.forceGraph.graphData().nodes.length) * CAMERA_DISTANCE2NODES_FACTOR;
      }
    });

    // Setup tooltip
    const toolTipElem = document.createElement('div');
    toolTipElem.classList.add('graph-tooltip');
    domNode.appendChild(toolTipElem);

    // Capture mouse coords on move
    const raycaster = new three.Raycaster();
    const mousePos = new three.Vector2();
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
      toolTipElem.style.top = `${relPos.y}px`;
      toolTipElem.style.left = `${relPos.x}px`;

      function getOffset(el) {
        const rect = el.getBoundingClientRect(),
          scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
          scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
      }
    }, false);

    // Handle click events on nodes
    domNode.addEventListener("click", ev => {
      if (state.hoverObj) {
        state[`on${state.hoverObj.__graphObjType === 'node' ? 'Node' : 'Link'}Click`](state.hoverObj.__data);
      }
    }, false);

    // Setup renderer, camera and controls
    domNode.appendChild(state.renderer.domElement);
    const tbControls = new ThreeTrackballControls(state.camera, state.renderer.domElement);

    state.renderer.setSize(state.width, state.height);
    state.camera.far = 20000;

    // Populate scene
    state.scene.add(state.forceGraph);
    state.scene.add(new three.AmbientLight(0xbbbbbb));
    state.scene.add(new three.DirectionalLight(0xffffff, 0.6));

    //

    // Kick-off renderer
    (function animate() { // IIFE
      if (state.enablePointerInteraction) {
        // Update tooltip and trigger onHover events
        raycaster.linePrecision = state.linkHoverPrecision;

        raycaster.setFromCamera(mousePos, state.camera);
        const intersects = raycaster.intersectObjects(state.forceGraph.children)
          .filter(o => ['node', 'link'].indexOf(o.object.__graphObjType) !== -1) // Check only node/link objects
          .sort((a, b) => { // Prioritize nodes over links
            const isNode = o => o.object.__graphObjType === 'node';
            return isNode(b) - isNode(a);
          });

        const topObject = intersects.length ? intersects[0].object : null;

        if (topObject !== state.hoverObj) {
          const prevObjType = state.hoverObj ? state.hoverObj.__graphObjType : null;
          const prevObjData = state.hoverObj ? state.hoverObj.__data : null;
          const objType = topObject ? topObject.__graphObjType : null;
          const objData = topObject ? topObject.__data : null;
          if (prevObjType && prevObjType !== objType) {
            // Hover out
            state[`on${prevObjType === 'node' ? 'Node' : 'Link'}Hover`](null, prevObjData);
          }
          if (objType) {
            // Hover in
            state[`on${objType === 'node' ? 'Node' : 'Link'}Hover`](objData, prevObjType === objType ? prevObjData : null);
          }

          toolTipElem.innerHTML = topObject ? accessorFn(state[`${objType}Label`])(objData) || '' : '';

          state.hoverObj = topObject;
        }
      }

      // Frame cycle
      state.forceGraph.tickFrame();
      tbControls.update();
      state.renderer.render(state.scene, state.camera);
      state.animationFrameRequestId = requestAnimationFrame(animate);
    })();
  },

  update: function updateFn(state) {
    // resize canvas
    if (state.width && state.height) {
      state.renderer.setSize(state.width, state.height);
      state.camera.aspect = state.width/state.height;
      state.camera.updateProjectionMatrix();
    }

    state.navInfo.style.display = state.showNavInfo ? null : 'none';
  }

});
