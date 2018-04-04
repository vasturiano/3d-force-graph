import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  AmbientLight,
  DirectionalLight,
  Raycaster,
  Vector2,
  Vector3,
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
    Vector3,
    Color
  };

import ThreeTrackballControls from 'three-trackballcontrols';
import ThreeDragControls from 'three-dragcontrols';
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
  'linkDirectionalParticleColor',
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
    enablePointerInteraction: { default: true, onChange(_, state) { state.hoverObj = null; }, triggerUpdate: false },
    enableNodeDrag: { default: true, triggerUpdate: false },
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
    cameraPosition: function(state, position, lookAt) {
      // Setter
      if (position && state.initialised) {
        const { x, y, z } = position;
        if (x !== undefined) state.camera.position.x = x;
        if (y !== undefined) state.camera.position.y = y;
        if (z !== undefined) state.camera.position.z = z;

        state.tbControls.target = lookAt
          ? new three.Vector3(lookAt.x, lookAt.y, lookAt.z)
          : state.forceGraph.position.clone();

        return this;
      }

      // Getter
      const curLookAt = (new three.Vector3(0, 0, -1000))
        .applyQuaternion(state.camera.quaternion)
        .add(state.camera.position);

      return Object.assign({},
        state.camera.position,
        { lookAt: Object.assign({}, curLookAt) }
      );
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

    // Add relative container
    domNode.appendChild(state.container = document.createElement('div'));
    state.container.style.position = 'relative';

    // Add nav info section
    state.container.appendChild(state.navInfo = document.createElement('div'));
    state.navInfo.className = 'graph-nav-info';
    state.navInfo.textContent = "MOVE mouse & press LEFT/A: rotate, MIDDLE/S: zoom, RIGHT/D: pan";

    // Add info space
    let infoElem;
    state.container.appendChild(infoElem = document.createElement('div'));
    infoElem.className = 'graph-info-msg';
    infoElem.textContent = '';
    state.forceGraph.onLoading(() => { infoElem.textContent = 'Loading...' });
    state.forceGraph.onFinishLoading(() => {
      infoElem.textContent = '';

      // sync graph data structures
      state.graphData = state.forceGraph.graphData();

      // re-aim camera, if still in default position (not user modified)
      if (state.camera.position.x === 0 && state.camera.position.y === 0 && state.camera.position.z === state.lastSetCameraZ) {
        state.camera.lookAt(state.forceGraph.position);
        state.lastSetCameraZ = state.camera.position.z = Math.cbrt(state.graphData.nodes.length) * CAMERA_DISTANCE2NODES_FACTOR;
      }

      // Setup node drag interaction
      if (state.enableNodeDrag && state.enablePointerInteraction && state.forceEngine === 'd3') { // Can't access node positions programatically in ngraph
        const dragControls = new ThreeDragControls(
          state.graphData.nodes.map(node => node.__threeObj),
          state.camera,
          state.renderer.domElement
        );

        dragControls.addEventListener('dragstart', function (event) {
          state.tbControls.enabled = false; // Disable trackball controls while dragging

          const node = event.object.__data;
          node.__initialFixedPos = {fx: node.fx, fy: node.fy, fz: node.fz};

          // lock node
          ['x', 'y', 'z'].forEach(c => node[`f${c}`] = node[c]);

          // keep engine running at low intensity throughout drag
          state.forceGraph.d3AlphaTarget(0.3);

          // drag cursor
          state.renderer.domElement.classList.add('grabbable');
        });

        dragControls.addEventListener('drag', function (event) {
          state.ignoreOneClick = true; // Don't click the node if it's being dragged

          const node = event.object.__data;

          // Move fx/fy/fz (and x/y/z) of nodes based on object new position
          ['x', 'y', 'z'].forEach(c => node[`f${c}`] = node[c] = event.object.position[c]);

          // prevent freeze while dragging
          state.forceGraph.resetCountdown();
        });

        dragControls.addEventListener('dragend', function (event) {
          const node = event.object.__data;
          const initPos = node.__initialFixedPos;

          if (initPos) {
            ['x', 'y', 'z'].forEach(c => {
              const fc = `f${c}`;
              if (initPos[fc] === undefined) {
                node[fc] = undefined
              }
            });
            delete(node.__initialFixedPos);
          }

          state.forceGraph
            .d3AlphaTarget(0)   // release engine low intensity
            .resetCountdown();  // let the engine readjust after releasing fixed nodes

          state.tbControls.enabled = true; // Re-enable trackball controls

          // clear cursor
          state.renderer.domElement.classList.remove('grabbable');
        });
      }
    });

    // Setup tooltip
    const toolTipElem = document.createElement('div');
    toolTipElem.classList.add('graph-tooltip');
    state.container.appendChild(toolTipElem);

    // Capture mouse coords on move
    const raycaster = new three.Raycaster();
    const mousePos = new three.Vector2();
    mousePos.x = -2; // Initialize off canvas
    mousePos.y = -2;
    state.container.addEventListener("mousemove", ev => {
      // update the mouse pos
      const offset = getOffset(state.container),
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
    state.container.addEventListener("click", ev => {
      if (state.ignoreOneClick) {
        // f.e. because of dragend event
        state.ignoreOneClick = false;
        return;
      }

      if (state.hoverObj) {
        state[`on${state.hoverObj.__graphObjType === 'node' ? 'Node' : 'Link'}Click`](state.hoverObj.__data);
      }
    }, false);

    // Setup renderer, camera and controls
    state.container.appendChild(state.renderer.domElement);
    state.tbControls = new ThreeTrackballControls(state.camera, state.renderer.domElement);
    state.tbControls.minDistance = 0.1;
    state.tbControls.maxDistance = 20000;

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
        const recurseObjTree = !!state.nodeThreeObject; // Only need to recurse if there's custom node objects
        const intersects = raycaster.intersectObjects(state.forceGraph.children, recurseObjTree)
          .map(({ object }) => {
            let obj = object;
            // recurse up object chain until finding the graph object
            while(recurseObjTree && obj && !obj.hasOwnProperty('__graphObjType')) { obj = obj.parent; }
            return obj;
          })
          .filter(o => o && ['node', 'link'].indexOf(o.__graphObjType) !== -1) // Check only node/link objects
          .sort((a, b) => { // Prioritize nodes over links
            const isNode = o => o.__graphObjType === 'node';
            return isNode(b) - isNode(a);
          });

        const topObject = intersects.length ? intersects[0] : null;

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

        // reset canvas cursor (override dragControls cursor)
        state.renderer.domElement.style.cursor = null;
      }

      // Frame cycle
      state.forceGraph.tickFrame();
      state.tbControls.update();
      state.renderer.render(state.scene, state.camera);
      state.animationFrameRequestId = requestAnimationFrame(animate);
    })();
  },

  update: function updateFn(state) {
    // resize canvas
    if (state.width && state.height) {
      state.container.style.width = state.width;
      state.container.style.height = state.height;
      state.renderer.setSize(state.width, state.height);
      state.camera.aspect = state.width/state.height;
      state.camera.updateProjectionMatrix();
    }

    state.navInfo.style.display = state.showNavInfo ? null : 'none';
  }

});
