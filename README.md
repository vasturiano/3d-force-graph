# 3D Force-Directed Graph

[![NPM](https://nodei.co/npm/3d-force-graph.png?compact=true)](https://nodei.co/npm/3d-force-graph/)

<p align="center">
     <a href="http://bl.ocks.org/vasturiano/02affe306ce445e423f992faeea13521"><img width="80%" src="http://gist.github.com/vasturiano/02affe306ce445e423f992faeea13521/raw/preview.png"></a>
</p>

A web component to represent a graph data structure in a 3-dimensional space using a force-directed iterative layout.
Uses [ThreeJS](https://github.com/mrdoob/three.js/)/WebGL for 3D rendering and either [d3-force-3d](https://github.com/vasturiano/d3-force-3d) or [ngraph](https://github.com/anvaka/ngraph.forcelayout3d) for the underlying physics engine.

Check out the examples:
* [Basic](https://vasturiano.github.io/3d-force-graph/example/basic/) ([source](https://github.com/vasturiano/3d-force-graph/blob/master/example/basic/index.html))
* [Asynchronous load](https://vasturiano.github.io/3d-force-graph/example/async-load/) ([source](https://github.com/vasturiano/3d-force-graph/blob/master/example/async-load/index.html))
* [Directional links](https://vasturiano.github.io/3d-force-graph/example/directional-links/) ([source](https://github.com/vasturiano/3d-force-graph/blob/master/example/directional-links/index.html))
* [Auto-colored nodes/links](https://vasturiano.github.io/3d-force-graph/example/auto-colored/) ([source](https://github.com/vasturiano/3d-force-graph/blob/master/example/auto-colored/index.html))
* [Text as nodes](https://vasturiano.github.io/3d-force-graph/example/text-nodes/) ([source](https://github.com/vasturiano/3d-force-graph/blob/master/example/text-nodes/index.html))
* [Custom node geometries](https://vasturiano.github.io/3d-force-graph/example/custom-node-geometry/) ([source](https://github.com/vasturiano/3d-force-graph/blob/master/example/custom-node-geometry/index.html))
* [Camera automatic orbitting](https://vasturiano.github.io/3d-force-graph/example/camera-auto-orbit/) ([source](https://github.com/vasturiano/3d-force-graph/blob/master/example/camera-auto-orbit/index.html))
* [Click to focus on node](https://vasturiano.github.io/3d-force-graph/example/click-to-focus/) ([source](https://github.com/vasturiano/3d-force-graph/blob/master/example/click-to-focus/index.html))
* [Dynamic data changes](https://vasturiano.github.io/3d-force-graph/example/dynamic/) ([source](https://github.com/vasturiano/3d-force-graph/blob/master/example/dynamic/index.html))
* [Node collision detection](https://vasturiano.github.io/3d-force-graph/example/collision-detection/) ([source](https://github.com/vasturiano/3d-force-graph/blob/master/example/collision-detection/index.html))

See also the [VR version](https://github.com/vasturiano/3d-force-graph-vr) and the [2D canvas version](https://github.com/vasturiano/force-graph).

## Quick start

```
import ForceGraph3D from '3d-force-graph';
```
or
```
var ForceGraph3D = require('3d-force-graph');
```
or even
```
<script src="//unpkg.com/3d-force-graph"></script>
```
then
```
var myGraph = ForceGraph3D();
myGraph(<myDOMElement>)
    .graphData(<myData>);
```

## API reference

| Method | Description | Default |
| --- | --- | :--: |
| <b>width</b>([<i>px</i>]) | Getter/setter for the canvas width. | *&lt;window width&gt;* |
| <b>height</b>([<i>px</i>]) | Getter/setter for the canvas height. | *&lt;window height&gt;* |
| <b>graphData</b>([<i>data</i>]) | Getter/setter for graph data structure (see below for syntax details). Can also be used to apply [incremental updates](https://bl.ocks.org/vasturiano/2f602ea6c51c664c29ec56cbe2d6a5f6). | `{ nodes: [], links: [] }` |
| <b>jsonUrl</b>([<i>url</i>]) | URL of JSON file to load graph data directly from, as an alternative to specifying <i>graphData</i> directly. | |
| <b>numDimensions</b>([<i>int</i>]) | Getter/setter for number of dimensions to run the force simulation on (1, 2 or 3). | 3 |
| <b>backgroundColor</b>([<i>str</i>]) | Getter/setter for the chart background color. | `#000011` |
| <b>showNavInfo</b>([<i>boolean</i>]) | Getter/setter for whether to show the navigation controls footer info. | `true` |
| <b>nodeRelSize</b>([<i>num</i>]) | Getter/setter for the ratio of node sphere volume (cubic px) per value unit. | 4 |
| <b>nodeId</b>([<i>str</i>]) <br/><sub>(alias: <i>idField</i>)</sub> | Node object accessor attribute for unique node id (used in link objects source/target). | `id` |
| <b>nodeLabel</b>([<i>str</i> or <i>fn</i>]) <br/><sub>(alias: <i>nameField</i>)</sub> | Node object accessor function or attribute for name (shown in label). Supports plain text or HTML content. | `name` |
| <b>nodeVal</b>([<i>num</i>, <i>str</i> or <i>fn</i>]) <br/><sub>(alias: <i>valField</i>)</sub> | Node object accessor function, attribute or a numeric constant for the node numeric value (affects sphere volume). | `val` |
| <b>nodeResolution</b>([<i>num</i>]) | Getter/setter for the geometric resolution of each node, expressed in how many slice segments to divide the circumference. Higher values yield smoother spheres. | 8 |
| <b>nodeColor</b>([<i>str</i> or <i>fn</i>]) <br/><sub>(alias: <i>colorField</i>)</sub> | Node object accessor function or attribute for node color (affects sphere color). | `color` |
| <b>nodeAutoColorBy</b>([<i>str</i> or <i>fn</i>]) <br/><sub>(alias: <i>autoColorBy</i>)</sub> | Node object accessor function (`fn(node)`) or attribute (e.g. `'type'`) to automatically group colors by. Only affects nodes without a color attribute. | |
| <b>nodeOpacity</b>([<i>num</i>]) | Getter/setter for the nodes sphere opacity, between [0,1]. | 0.75   |
| <b>nodeThreeObject</b>([<i>Object3d</i>, <i>str</i> or <i>fn</i>]) | Node object accessor function or attribute for generating a custom 3d object to render as graph nodes. Should return an instance of [ThreeJS Object3d](https://threejs.org/docs/index.html#api/core/Object3D). If a <i>falsy</i> value is returned, the default 3d object type will be used instead for that node.  | *default node object is a sphere, sized according to `val` and styled according to `color`.* |
| <b>linkSource</b>([<i>str</i>]) <br/><sub>(alias: <i>linkSourceField</i>)</sub> | Link object accessor attribute referring to id of source node. | `source` |
| <b>linkTarget</b>([<i>str</i>]) <br/><sub>(alias: <i>linkTargetField</i>)</sub> | Link object accessor attribute referring to id of target node. | `target` |
| <b>linkLabel</b>([<i>str</i> or <i>fn</i>]) | Link object accessor function or attribute for name (shown in label). Supports plain text or HTML content. | `name` |
| <b>linkHoverPrecision</b>([<i>int</i>]) | Whether to display the link label when gazing the link closely (low value) or from far away (high value). | 1 |
| <b>linkColor</b>([<i>str</i> or <i>fn</i>]) <br/><sub>(alias: <i>linkColorField</i>)</sub> | Link object accessor function or attribute for line color. | `color` |
| <b>linkAutoColorBy</b>([<i>str</i> or <i>fn</i>]) | Link object accessor function (`fn(link)`) or attribute (e.g. `'type'`) to automatically group colors by. Only affects links without a color attribute. | |
| <b>linkOpacity</b>([<i>num</i>]) <br/><sub>(alias: <i>lineOpacity</i>)</sub> | Getter/setter for line opacity of links, between [0,1]. | 0.2 |
| <b>linkWidth</b>([<i>num</i>, <i>str</i> or <i>fn</i>]) | Link object accessor function, attribute or a numeric constant for the link line width. A value of zero will render a [ThreeJS Line](https://threejs.org/docs/#api/objects/Line) whose width is constant (`1px`) regardless of distance. Values are rounded to the nearest decimal for indexing purposes. | 0 |
| <b>linkResolution</b>([<i>num</i>]) | Getter/setter for the geometric resolution of each link, expressed in how many radial segments to divide the cylinder. Higher values yield smoother cylinders. Applicable only to links with positive width. | 6 |
| <b>linkDirectionalParticles</b>([<i>num</i>, <i>str</i> or <i>fn</i>]) | Link object accessor function, attribute or a numeric constant for the number of particles (small spheres) to display over the link line. The particles are distributed equi-spaced along the line, travel in the direction `source` > `target`, and can be used to indicate link directionality. | 0 |
| <b>linkDirectionalParticleSpeed</b>([<i>num</i>, <i>str</i> or <i>fn</i>]) | Link object accessor function, attribute or a numeric constant for the directional particles speed, expressed as the ratio of the link length to travel per frame. Values above `0.5` are discouraged. | 0.01 |
| <b>linkDirectionalParticleWidth</b>([<i>num</i>, <i>str</i> or <i>fn</i>]) | Link object accessor function, attribute or a numeric constant for the directional particles width. Values are rounded to the nearest decimal for indexing purposes. | 0.5 |
| <b>linkDirectionalParticleColor</b>([<i>str</i> or <i>fn</i>]) | Link object accessor function or attribute for the directional particles color. | `color` |
| <b>linkDirectionalParticleResolution</b>([<i>num</i>]) | Getter/setter for the geometric resolution of each directional particle, expressed in how many slice segments to divide the circumference. Higher values yield smoother particles. | 4 |
| <b>forceEngine</b>([<i>str</i>]) | Getter/setter for which force-simulation engine to use ([*d3*](https://github.com/vasturiano/d3-force-3d) or [*ngraph*](https://github.com/anvaka/ngraph.forcelayout)). | `d3` |
| <b>d3AlphaDecay</b>([<i>num</i>]) | Getter/setter for the [simulation intensity decay](https://github.com/vasturiano/d3-force-3d#simulation_alphaDecay) parameter, only applicable if using the d3 simulation engine. | `0.0228` |
| <b>d3VelocityDecay</b>([<i>num</i>]) | Getter/setter for the nodes' [velocity decay](https://github.com/vasturiano/d3-force-3d#simulation_velocityDecay) that simulates the medium resistance, only applicable if using the d3 simulation engine. | `0.4` |
| <b>d3Force</b>(<i>str</i>, [<i>fn</i>]) | Getter/setter for the internal forces that control the d3 simulation engine. Follows the same interface as `d3-force-3d`'s [simulation.force](https://github.com/vasturiano/d3-force-3d#simulation_force). Three forces are included by default: `'link'` (based on [forceLink](https://github.com/vasturiano/d3-force-3d#forceLink)), `'charge'` (based on [forceManyBody](https://github.com/vasturiano/d3-force-3d#forceManyBody)) and `'center'` (based on [forceCenter](https://github.com/vasturiano/d3-force-3d#forceCenter)). Each of these forces can be reconfigured, or new forces can be added to the system. This method is only applicable if using the d3 simulation engine. | |
| <b>warmupTicks</b>([<i>int</i>]) | Getter/setter for number of layout engine cycles to dry-run at ignition before starting to render. | 0 |
| <b>cooldownTicks</b>([<i>int</i>]) | Getter/setter for how many build-in frames to render before stopping and freezing the layout engine. | Infinity |
| <b>cooldownTime</b>([<i>num</i>]) | Getter/setter for how long (ms) to render for before stopping and freezing the layout engine. | 15000 |
| <b>onNodeClick</b>(<i>fn</i>) | Callback function for node clicks. The node object is included as single argument `onNodeClick(node)`. | - |
| <b>onLinkClick</b>(<i>fn</i>) | Callback function for link clicks. The link object is included as single argument `onLinkClick(node)`. | - |
| <b>onNodeHover</b>(<i>fn</i>) | Callback function for node mouse over events. The node object (or `null` if there's no node under the mouse line of sight) is included as the first argument, and the previous node object (or null) as second argument: `onNodeHover(node, prevNode)`. | - |
| <b>onLinkHover</b>(<i>fn</i>) | Callback function for link mouse over events. The link object (or `null` if there's no link under the mouse line of sight) is included as the first argument, and the previous link object (or null) as second argument: `onLinkHover(link, prevLink)`. | - |
| <b>cameraPosition</b>([<i>{x,y,z}</i>],[<i>lookAt</i>]) | Getter/setter for the camera position, in terms of `x`, `y`, `z` coordinates. Each of the coordinates is optional, allowing for motion in just some dimensions. An optional second argument can be used to define the direction that the camera should aim at, in terms of an `{x,y,z}` point in the 3D space. | By default the camera will face the center of the graph at a `z` distance proportional to the amount of nodes in the system. |
| <b>enablePointerInteraction() | Getter/setter for whether to enable the mouse tracking events. This activates an internal tracker of the canvas mouse position and enables the functionality of object hover/click and tooltip labels, at the cost of performance. If you're looking for maximum gain in your graph performance it's recommended to switch off this property. | `true` |
| <b>stopAnimation() | Stops the rendering cycle of the component, effectively freezing the current view and canceling all future user interaction. This method can be used to save performance in circumstances when a static image is sufficient. ||
| <b>resetProps() | Reset all component properties to their default value. ||

### Input JSON syntax

```
{
    "nodes": [ 
        { 
          "id": "id1",
          "name": "name1",
          "val": 1 
        },
        { 
          "id": "id2",
          "name": "name2",
          "val": 10 
        },
        (...)
    ],
    "links": [
        {
            "source": "id1",
            "target": "id2"
        },
        (...)
    ]
}
```
