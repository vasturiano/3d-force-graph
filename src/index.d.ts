import { Scene, Camera, WebGLRenderer, WebGLRendererParameters } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ThreeForceGraphGeneric } from 'three-forcegraph';

export interface ConfigOptions {
  controlType?: 'trackball' | 'orbit' | 'fly'
  rendererConfig?: WebGLRendererParameters
}

type Accessor<In, Out> = Out | string | ((obj: In) => Out);
type ObjAccessor<T> = Accessor<object, T>;

type Coords = { x: number; y: number; z: number; };

// don't surface these internal props from inner ThreeForceGraph
type ExcludedInnerProps = 'onLoading' | 'onFinishLoading' | 'onUpdate' | 'onFinishUpdate' | 'tickFrame' | 'd3AlphaTarget';

export interface ForceGraph3DGenericInstance<ChainableInstance>
    extends Omit<ThreeForceGraphGeneric<ChainableInstance>, ExcludedInnerProps> {
  (element: HTMLElement): ChainableInstance;
  _destructor(): void;

  // Container layout
  width(): number;
  width(width: number): ChainableInstance;
  height(): number;
  height(height: number): ChainableInstance;
  backgroundColor(): string;
  backgroundColor(color: string): ChainableInstance;
  showNavInfo(): boolean;
  showNavInfo(enabled: boolean): ChainableInstance;

  // Labels
  nodeLabel(): ObjAccessor<string>;
  nodeLabel(textAccessor: ObjAccessor<string>): ChainableInstance;
  linkLabel(): ObjAccessor<string>;
  linkLabel(textAccessor: ObjAccessor<string>): ChainableInstance;

  // Interaction
  onNodeClick(callback: (node: object, event: MouseEvent) => void): ChainableInstance;
  onNodeRightClick(callback: (node: object, event: MouseEvent) => void): ChainableInstance;
  onNodeHover(callback: (node: object | null, previousNode: object | null) => void): ChainableInstance;
  onNodeDrag(callback: (node: object, translate: Coords) => void): ChainableInstance;
  onNodeDragEnd(callback: (node: object, translate: Coords) => void): ChainableInstance;
  onLinkClick(callback: (link: object, event: MouseEvent) => void): ChainableInstance;
  onLinkRightClick(callback: (link: object, event: MouseEvent) => void): ChainableInstance;
  onLinkHover(callback: (link: object | null, previousLink: object | null) => void): ChainableInstance;
  onBackgroundClick(callback: (event: MouseEvent) => void): ChainableInstance;
  onBackgroundRightClick(callback: (event: MouseEvent) => void): ChainableInstance;
  linkHoverPrecision(): number;
  linkHoverPrecision(precision: number): ChainableInstance;
  enablePointerInteraction(): boolean;
  enablePointerInteraction(enable: boolean): ChainableInstance;
  enableNodeDrag(): boolean;
  enableNodeDrag(enable: boolean): ChainableInstance;
  enableNavigationControls(): boolean;
  enableNavigationControls(enable: boolean): ChainableInstance;

  // Render control
  pauseAnimation(): ChainableInstance;
  resumeAnimation(): ChainableInstance;
  cameraPosition(): Coords;
  cameraPosition(position: Partial<Coords>, lookAt?: Coords, transitionMs?: number): ChainableInstance;
  zoomToFit(durationMs?: number, padding?: number, nodeFilter?: (node: object) => boolean): ChainableInstance;
  postProcessingComposer(): EffectComposer;
  scene(): Scene;
  camera(): Camera;
  renderer(): WebGLRenderer;
  controls(): object;

  // Utility
  graph2ScreenCoords(x: number, y: number, z: number): Coords;
}

export type ForceGraph3DInstance = ForceGraph3DGenericInstance<ForceGraph3DInstance>;

declare function ForceGraph3D(configOptions?: ConfigOptions): ForceGraph3DInstance;

export default ForceGraph3D;
