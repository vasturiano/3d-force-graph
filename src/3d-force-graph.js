import { AmbientLight, DirectionalLight } from 'three';

const three = window.THREE
  ? window.THREE // Prefer consumption from global THREE, if exists
  : { AmbientLight, DirectionalLight };

import ThreeDragControls from 'three-dragcontrols';
import ThreeForceGraph from 'three-forcegraph';
import ThreeRenderObjects from 'three-render-objects';

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
  'linkCurvature',
  'linkCurveRotation',
  'linkMaterial',
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

// Expose config from renderObjs
const bindRenderObjs = linkKapsule('renderObjs', ThreeRenderObjects);
const linkedRenderObjsProps = Object.assign(...[
  'width',
  'height',
  'backgroundColor',
  'showNavInfo',
  'enablePointerInteraction'
].map(p => ({ [p]: bindRenderObjs.linkProp(p)})));
const linkedRenderObjsMethods = Object.assign(...[
  'cameraPosition'
].map(p => ({ [p]: bindRenderObjs.linkMethod(p)})));

//

export default Kapsule({

  props: {
    nodeLabel: { default: 'name', triggerUpdate: false },
    linkLabel: { default: 'name', triggerUpdate: false },
    linkHoverPrecision: { default: 1, onChange: (p, state) => state.renderObjs.lineHoverPrecision(p), triggerUpdate: false },
    enableNodeDrag: { default: true, triggerUpdate: false },
    onNodeClick: { default: () => {}, triggerUpdate: false },
    onNodeHover: { default: () => {}, triggerUpdate: false },
    onLinkClick: { default: () => {}, triggerUpdate: false },
    onLinkHover: { default: () => {}, triggerUpdate: false },
    ...linkedFGProps,
    ...linkedRenderObjsProps
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
    stopAnimation: function(state) {
      if (state.animationFrameRequestId) {
        cancelAnimationFrame(state.animationFrameRequestId);
      }
      return this;
    },
    scene: state => state.renderObjs.scene(), // Expose scene
    ...linkedFGMethods,
    ...linkedRenderObjsMethods
  },

  stateInit: () => ({
    forceGraph: new ThreeForceGraph(),
    renderObjs: ThreeRenderObjects()
  }),

  init: function(domNode, state) {
    // Wipe DOM
    domNode.innerHTML = '';

    // Add relative container
    domNode.appendChild(state.container = document.createElement('div'));
    state.container.style.position = 'relative';

    // Add renderObjs
    const roDomNode = document.createElement('div');
    state.container.appendChild(roDomNode);
    state.renderObjs(roDomNode);
    const camera = state.renderObjs.camera();
    const renderer = state.renderObjs.renderer();
    const tbControls = state.renderObjs.tbControls();
    state.lastSetCameraZ = camera.position.z;

    // Add info space
    let infoElem;
    state.container.appendChild(infoElem = document.createElement('div'));
    infoElem.className = 'graph-info-msg';
    infoElem.textContent = '';

    // config forcegraph
    state.forceGraph.onLoading(() => { infoElem.textContent = 'Loading...' });
    state.forceGraph.onFinishLoading(() => {
      infoElem.textContent = '';

      // sync graph data structures
      state.graphData = state.forceGraph.graphData();

      // re-aim camera, if still in default position (not user modified)
      if (camera.position.x === 0 && camera.position.y === 0 && camera.position.z === state.lastSetCameraZ) {
        camera.lookAt(state.forceGraph.position);
        state.lastSetCameraZ = camera.position.z = Math.cbrt(state.graphData.nodes.length) * CAMERA_DISTANCE2NODES_FACTOR;
      }

      // Setup node drag interaction
      if (state.enableNodeDrag && state.enablePointerInteraction && state.forceEngine === 'd3') { // Can't access node positions programatically in ngraph
        const dragControls = new ThreeDragControls(
          state.graphData.nodes.map(node => node.__threeObj),
          camera,
          renderer.domElement
        );

        dragControls.addEventListener('dragstart', function (event) {
          tbControls.enabled = false; // Disable trackball controls while dragging

          const node = event.object.__data;
          node.__initialFixedPos = {fx: node.fx, fy: node.fy, fz: node.fz};

          // lock node
          ['x', 'y', 'z'].forEach(c => node[`f${c}`] = node[c]);

          // keep engine running at low intensity throughout drag
          state.forceGraph.d3AlphaTarget(0.3);

          // drag cursor
          renderer.domElement.classList.add('grabbable');
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

          tbControls.enabled = true; // Re-enable trackball controls

          // clear cursor
          renderer.domElement.classList.remove('grabbable');
        });
      }
    });

    // config renderObjs
    const getGraphObj = object => {
      let obj = object;
      // recurse up object chain until finding the graph object (only if using custom nodes)
      while (state.nodeThreeObject && obj && !obj.hasOwnProperty('__graphObjType')) {
        obj = obj.parent;
      }
      return obj;
    };

    state.renderObjs
      .objects([ // Populate scene
        new three.AmbientLight(0xbbbbbb),
        new three.DirectionalLight(0xffffff, 0.6),
        state.forceGraph
      ])
      .hoverOrderComparator((a, b) => {
        // Prioritize graph objects
        const aObj = getGraphObj(a);
        if (!aObj) return 1;
        const bObj = getGraphObj(b);
        if (!bObj) return -1;

        // Prioritize nodes over links
        const isNode = o => o.__graphObjType === 'node';
        return isNode(bObj) - isNode(aObj);
      })
      .tooltipContent(obj => {
        const graphObj = getGraphObj(obj);
        return graphObj ? accessorFn(state[`${graphObj.__graphObjType}Label`])(graphObj.__data) || '' : '';
      })
      .onHover(obj => {
        // Update tooltip and trigger onHover events
        const hoverObj = getGraphObj(obj);

        if (hoverObj !== state.hoverObj) {
          const prevObjType = state.hoverObj ? state.hoverObj.__graphObjType : null;
          const prevObjData = state.hoverObj ? state.hoverObj.__data : null;
          const objType = hoverObj ? hoverObj.__graphObjType : null;
          const objData = hoverObj ? hoverObj.__data : null;
          if (prevObjType && prevObjType !== objType) {
            // Hover out
            state[`on${prevObjType === 'node' ? 'Node' : 'Link'}Hover`](null, prevObjData);
          }
          if (objType) {
            // Hover in
            state[`on${objType === 'node' ? 'Node' : 'Link'}Hover`](objData, prevObjType === objType ? prevObjData : null);
          }

          state.hoverObj = hoverObj;
        }
      })
      .onClick(obj => {
        // Handle click events on objects
        if (state.ignoreOneClick) {
          // f.e. because of dragend event
          state.ignoreOneClick = false;
          return;
        }

        const graphObj = getGraphObj(obj);
        if (graphObj) {
          state[`on${graphObj.__graphObjType === 'node' ? 'Node' : 'Link'}Click`](graphObj.__data);
        }
      });

    //

    // Kick-off renderer
    (function animate() { // IIFE
      if (state.enablePointerInteraction) {
        // reset canvas cursor (override dragControls cursor)
        renderer.domElement.style.cursor = null;
      }

      // Frame cycle
      state.forceGraph.tickFrame();
      state.renderObjs.tick();
      state.animationFrameRequestId = requestAnimationFrame(animate);
    })();
  }
});
