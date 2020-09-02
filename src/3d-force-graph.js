import { AmbientLight, DirectionalLight, Vector3 } from 'three';

const three = window.THREE
  ? window.THREE // Prefer consumption from global THREE, if exists
  : { AmbientLight, DirectionalLight, Vector3 };

import { DragControls as ThreeDragControls } from 'three/examples/jsm/controls/DragControls.js';

import ThreeForceGraph from 'three-forcegraph';
import ThreeRenderObjects from 'three-render-objects';

import accessorFn from 'accessor-fn';
import Kapsule from 'kapsule';

import linkKapsule from './kapsule-link.js';

//

const CAMERA_DISTANCE2NODES_FACTOR = 170;

//

// Expose config from forceGraph
const bindFG = linkKapsule('forceGraph', ThreeForceGraph);
const linkedFGProps = Object.assign(...[
  'jsonUrl',
  'graphData',
  'numDimensions',
  'dagMode',
  'dagLevelDistance',
  'dagNodeFilter',
  'onDagError',
  'nodeRelSize',
  'nodeId',
  'nodeVal',
  'nodeResolution',
  'nodeColor',
  'nodeAutoColorBy',
  'nodeOpacity',
  'nodeVisibility',
  'nodeThreeObject',
  'nodeThreeObjectExtend',
  'linkSource',
  'linkTarget',
  'linkVisibility',
  'linkColor',
  'linkAutoColorBy',
  'linkOpacity',
  'linkWidth',
  'linkResolution',
  'linkCurvature',
  'linkCurveRotation',
  'linkMaterial',
  'linkThreeObject',
  'linkThreeObjectExtend',
  'linkPositionUpdate',
  'linkDirectionalArrowLength',
  'linkDirectionalArrowColor',
  'linkDirectionalArrowRelPos',
  'linkDirectionalArrowResolution',
  'linkDirectionalParticles',
  'linkDirectionalParticleSpeed',
  'linkDirectionalParticleWidth',
  'linkDirectionalParticleColor',
  'linkDirectionalParticleResolution',
  'forceEngine',
  'd3AlphaDecay',
  'd3VelocityDecay',
  'd3AlphaMin',
  'ngraphPhysics',
  'warmupTicks',
  'cooldownTicks',
  'cooldownTime',
  'onEngineTick',
  'onEngineStop'
].map(p => ({ [p]: bindFG.linkProp(p)})));
const linkedFGMethods = Object.assign(...[
  'refresh',
  'getGraphBbox',
  'd3Force',
  'd3ReheatSimulation',
  'emitParticle'
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
const linkedRenderObjsMethods = Object.assign(
  ...[
    'cameraPosition',
    'postProcessingComposer'
  ].map(p => ({ [p]: bindRenderObjs.linkMethod(p)})),
  {
    graph2ScreenCoords: bindRenderObjs.linkMethod('getScreenCoords')
  }
);

//

export default Kapsule({

  props: {
    nodeLabel: { default: 'name', triggerUpdate: false },
    linkLabel: { default: 'name', triggerUpdate: false },
    linkHoverPrecision: { default: 1, onChange: (p, state) => state.renderObjs.lineHoverPrecision(p), triggerUpdate: false },
    enableNavigationControls: {
      default: true,
      onChange(enable, state) {
        const controls = state.renderObjs.controls();
        if (controls) {
          controls.enabled = enable;
        }
      },
      triggerUpdate: false
    },
    enableNodeDrag: { default: true, triggerUpdate: false },
    onNodeDrag: { default: () => {}, triggerUpdate: false },
    onNodeDragEnd: { default: () => {}, triggerUpdate: false },
    onNodeClick: { default: () => {}, triggerUpdate: false },
    onNodeRightClick: { default: () => {}, triggerUpdate: false },
    onNodeHover: { default: () => {}, triggerUpdate: false },
    onLinkClick: { default: () => {}, triggerUpdate: false },
    onLinkRightClick: { default: () => {}, triggerUpdate: false },
    onLinkHover: { default: () => {}, triggerUpdate: false },
    onBackgroundClick: { default: () => {}, triggerUpdate: false },
    onBackgroundRightClick: { default: () => {}, triggerUpdate: false },
    ...linkedFGProps,
    ...linkedRenderObjsProps
  },

  methods: {
    zoomToFit: function(state, transitionDuration, padding, ...bboxArgs) {
      state.renderObjs.fitToBbox(
        state.forceGraph.getGraphBbox(...bboxArgs),
        transitionDuration,
        padding
      );
      return this;
    },
    pauseAnimation: function(state) {
      if (state.animationFrameRequestId !== null) {
        cancelAnimationFrame(state.animationFrameRequestId);
        state.animationFrameRequestId = null;
      }
      return this;
    },

    resumeAnimation: function(state) {
      if (state.animationFrameRequestId === null) {
        this._animationCycle();
      }
      return this;
    },
    _animationCycle(state) {
      if (state.enablePointerInteraction) {
        // reset canvas cursor (override dragControls cursor)
        this.renderer().domElement.style.cursor = null;
      }

      // Frame cycle
      state.forceGraph.tickFrame();
      state.renderObjs.tick();
      state.animationFrameRequestId = requestAnimationFrame(this._animationCycle);
    },
    scene: state => state.renderObjs.scene(), // Expose scene
    camera: state => state.renderObjs.camera(), // Expose camera
    renderer: state => state.renderObjs.renderer(), // Expose renderer
    controls: state => state.renderObjs.controls(), // Expose controls
    tbControls: state => state.renderObjs.tbControls(), // To be deprecated
    _destructor: function() {
      this.pauseAnimation();
      this.graphData({ nodes: [], links: []});
    },
    ...linkedFGMethods,
    ...linkedRenderObjsMethods
  },

  stateInit: ({ controlType, rendererConfig }) => ({
    forceGraph: new ThreeForceGraph(),
    renderObjs: ThreeRenderObjects({ controlType, rendererConfig })
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
    const controls = state.renderObjs.controls();
    controls.enabled = !!state.enableNavigationControls;
    state.lastSetCameraZ = camera.position.z;

    // Add info space
    let infoElem;
    state.container.appendChild(infoElem = document.createElement('div'));
    infoElem.className = 'graph-info-msg';
    infoElem.textContent = '';

    // config forcegraph
    state.forceGraph
      .onLoading(() => { infoElem.textContent = 'Loading...' })
      .onFinishLoading(() => { infoElem.textContent = '' })
      .onUpdate(() => {
        // sync graph data structures
        state.graphData = state.forceGraph.graphData();

        // re-aim camera, if still in default position (not user modified)
        if (camera.position.x === 0 && camera.position.y === 0 && camera.position.z === state.lastSetCameraZ && state.graphData.nodes.length) {
          camera.lookAt(state.forceGraph.position);
          state.lastSetCameraZ = camera.position.z = Math.cbrt(state.graphData.nodes.length) * CAMERA_DISTANCE2NODES_FACTOR;
        }
      })
      .onFinishUpdate(() => {
        // Setup node drag interaction
        if (state._dragControls) {
          const curNodeDrag = state.graphData.nodes.find(node => node.__initialFixedPos && !node.__disposeControlsAfterDrag); // detect if there's a node being dragged using the existing drag controls
          if (curNodeDrag) {
            curNodeDrag.__disposeControlsAfterDrag = true; // postpone previous controls disposal until drag ends
          } else {
            state._dragControls.dispose(); // cancel previous drag controls
          }

          state._dragControls = undefined;
        }

        if (state.enableNodeDrag && state.enablePointerInteraction && state.forceEngine === 'd3') { // Can't access node positions programatically in ngraph
          const dragControls = state._dragControls = new ThreeDragControls(
            state.graphData.nodes.map(node => node.__threeObj).filter(obj => obj),
            camera,
            renderer.domElement
          );

          dragControls.addEventListener('dragstart', function (event) {
            controls.enabled = false; // Disable controls while dragging

            const node = event.object.__data;
            !node.__initialFixedPos && (node.__initialFixedPos = {fx: node.fx, fy: node.fy, fz: node.fz});
            !node.__initialPos && (node.__initialPos = {x: node.x, y: node.y, z: node.z});

            // lock node
            ['x', 'y', 'z'].forEach(c => node[`f${c}`] = node[c]);

            // drag cursor
            renderer.domElement.classList.add('grabbable');
          });

          dragControls.addEventListener('drag', function (event) {
            const node = event.object.__data;
            const newPos = event.object.position;
            const translate = {x: newPos.x - node.x, y: newPos.y - node.y, z: newPos.z - node.z};
            // Move fx/fy/fz (and x/y/z) of nodes based on object new position
            ['x', 'y', 'z'].forEach(c => node[`f${c}`] = node[c] = newPos[c]);

            state.forceGraph
              .d3AlphaTarget(0.3) // keep engine running at low intensity throughout drag
              .resetCountdown();  // prevent freeze while dragging

            node.__dragged = true;
            state.onNodeDrag(node, translate);
          });

          dragControls.addEventListener('dragend', function (event) {
            const node = event.object.__data;

            // dispose previous controls if needed
            if (node.__disposeControlsAfterDrag) {
              dragControls.dispose();
              delete(node.__disposeControlsAfterDrag);
            }

            const initFixedPos = node.__initialFixedPos;
            const initPos = node.__initialPos;
            const translate = {x: initPos.x - node.x, y: initPos.y - node.y, z: initPos.z - node.z};
            if (initFixedPos) {
              ['x', 'y', 'z'].forEach(c => {
                const fc = `f${c}`;
                if (initFixedPos[fc] === undefined) {
                  delete(node[fc])
                }
              });
              delete(node.__initialFixedPos);
              delete(node.__initialPos);
              if (node.__dragged) {
                delete(node.__dragged);
                state.onNodeDragEnd(node, translate);
              }
            }

            state.forceGraph
              .d3AlphaTarget(0)   // release engine low intensity
              .resetCountdown();  // let the engine readjust after releasing fixed nodes

            if (state.enableNavigationControls) {
              controls.enabled = true; // Re-enable controls
            }

            // clear cursor
            renderer.domElement.classList.remove('grabbable');
          });
        }
      });

    // config renderObjs
    const getGraphObj = object => {
      let obj = object;
      // recurse up object chain until finding the graph object
      while (obj && !obj.hasOwnProperty('__graphObjType')) {
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
      .hoverDuringDrag(false)
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
      .clickAfterDrag(false)
      .onClick((obj, ev) => {
        const graphObj = getGraphObj(obj);
        if (graphObj) {
          state[`on${graphObj.__graphObjType === 'node' ? 'Node' : 'Link'}Click`](graphObj.__data, ev);
        } else {
          state.onBackgroundClick(ev);
        }
      })
      .onRightClick((obj, ev) => {
        // Handle right-click events
        const graphObj = getGraphObj(obj);
        if (graphObj) {
          state[`on${graphObj.__graphObjType === 'node' ? 'Node' : 'Link'}RightClick`](graphObj.__data, ev);
        } else {
          state.onBackgroundRightClick(ev);
        }
      });

    //

    // Kick-off renderer
    this._animationCycle();
  }
});
