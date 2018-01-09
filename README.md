# 3D Force-Directed Graph

[![NPM](https://nodei.co/npm/3d-force-graph.png?compact=true)](https://nodei.co/npm/3d-force-graph/)

<p align="center">
     <a href="http://bl.ocks.org/vasturiano/02affe306ce445e423f992faeea13521"><img width="80%" src="http://gist.github.com/vasturiano/02affe306ce445e423f992faeea13521/raw/preview.png"></a>
</p>

A web component to represent a graph data structure in a 3-dimensional space using a force-directed iterative layout.
Uses [ThreeJS](https://github.com/mrdoob/three.js/)/WebGL for 3D rendering and either [d3-force-3d](https://github.com/vasturiano/d3-force-3d) or [anvaka](https://github.com/anvaka)'s [ngraph](https://github.com/anvaka/ngraph.forcelayout3d) for the underlying physics engine.

See also the [VR version](https://github.com/vasturiano/3d-force-graph-vr).

Live example: http://bl.ocks.org/vasturiano/02affe306ce445e423f992faeea13521

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
| <b>nodeRelSize</b>([<i>num</i>]) | Getter/setter for the ratio of node sphere volume (cubic px) per value unit. | 4 |
| <b>nodeId</b>([<i>str</i>]) <br/><sub>(alias: <i>idField</i>)</sub> | Node object accessor attribute for unique node id (used in link objects source/target). | `id` |
| <b>nodeLabel</b>([<i>str</i> or <i>fn</i>]) <br/><sub>(alias: <i>nameField</i>)</sub> | Node object accessor function or attribute for name (shown in label). | `name` |
| <b>nodeVal</b>([<i>num</i>, <i>str</i> or <i>fn</i>]) <br/><sub>(alias: <i>valField</i>)</sub> | Node object accessor function, attribute or a numeric constant for the node numeric value (affects sphere volume). | `val` |
| <b>nodeResolution</b>([<i>num</i>]) | Getter/setter for the geometric resolution of each node, expressed in how many slice segments to divide the circumference. Higher values yield smoother spheres. | 8 |
| <b>nodeColor</b>([<i>str</i> or <i>fn</i>]) <br/><sub>(alias: <i>colorField</i>)</sub> | Node object accessor function or attribute for node color (affects sphere color). | `color` |
| <b>nodeAutoColorBy</b>([<i>str</i> or <i>fn</i>]) <br/><sub>(alias: <i>autoColorBy</i>)</sub> | Node object accessor function (`fn(node)`) or attribute (e.g. `'type'`) to automatically group colors by. Only affects nodes without a color attribute. | |
| <b>nodeThreeObject</b>([<i>Object3d</i>, <i>str</i> or <i>fn</i>]) | Node object accessor function or attribute for generating a custom 3d object to render as graph nodes. Should return an instance of [ThreeJS Object3d](https://threejs.org/docs/index.html#api/core/Object3D). If a <i>falsy</i> value is returned, the default 3d object type will be used instead for that node.  | *default node object is a sphere, sized according to `val` and styled according to `color`.* |
| <b>linkSource</b>([<i>str</i>]) <br/><sub>(alias: <i>linkSourceField</i>)</sub> | Link object accessor attribute referring to id of source node. | `source` |
| <b>linkTarget</b>([<i>str</i>]) <br/><sub>(alias: <i>linkTargetField</i>)</sub> | Link object accessor attribute referring to id of target node. | `target` |
| <b>linkLabel</b>([<i>str</i> or <i>fn</i>]) | Link object accessor function or attribute for name (shown in label). | `name` |
| <b>linkHoverPrecision</b>([<i>int</i>]) | Whether to display the link label when gazing the link closely (low value) or from far away (high value). | 1 |
| <b>linkColor</b>([<i>str</i> or <i>fn</i>]) <br/><sub>(alias: <i>linkColorField</i>)</sub> | Link object accessor function or attribute for line color. | `color` |
| <b>linkAutoColorBy</b>([<i>str</i> or <i>fn</i>]) | Link object accessor function (`fn(link)`) or attribute (e.g. `'type'`) to automatically group colors by. Only affects links without a color attribute. | |
| <b>linkOpacity</b>([<i>num</i>]) <br/><sub>(alias: <i>lineOpacity</i>)</sub> | Getter/setter for line opacity of links, between [0,1]. | 0.2 |
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
| <b>onLinkHover</b>(<i>fn</i>) | Callback function for link mouse over events. The link object (or `null` if there's no node under the mouse line of sight) is included as the first argument, and the previous link object (or null) as second argument: `onLinkHover(link, prevLink)`. | - |
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
