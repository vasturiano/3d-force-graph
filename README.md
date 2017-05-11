# 3D Force-Directed Graph

<p align="center">
     <a href="http://bl.ocks.org/vasturiano/02affe306ce445e423f992faeea13521"><img width="80%" src="http://gist.github.com/vasturiano/02affe306ce445e423f992faeea13521/raw/preview.png"></a>
</p>

A web component to represent a graph data structure in a 3-dimensional space using a force-directed iterative layout.
Uses [ThreeJS](https://github.com/mrdoob/three.js/)/WebGL for 3D rendering and either [d3-force-3d](https://github.com/vasturiano/d3-force-3d) or [anvaka](https://github.com/anvaka)'s [ngraph](https://github.com/anvaka/ngraph.forcelayout3d) for the underlying physics engine.

See also the [VR version](https://github.com/vasturiano/3d-force-graph-vr).

Live example: http://bl.ocks.org/vasturiano/02affe306ce445e423f992faeea13521

[![NPM](https://nodei.co/npm/3d-force-graph.png?compact=true)](https://nodei.co/npm/3d-force-graph/)

## Quick start

```
npm install
npm run build
```

### How to instantiate

```
import { default as ForceGraph3D } from '3d-force-graph';
```
or
```
var ForceGraph3D = require('3d-force-graph');
```
or even
```
<script src="//unpkg.com/3d-force-graph/dist/3d-force-graph.min.js"></script>
```
then
```
var myGraph = ForceGraph3D();
myGraph(<myDOMElement>)
    .graphData(<myData>);
```

## API reference

| Method | Description | Default |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------- |
| <b>width</b>([<i>px</i>]) | Getter/setter for canvas width | &lt;window width&gt; |
| <b>height</b>([<i>px</i>]) | Getter/setter for canvas height | &lt;window height&gt; |
| <b>jsonUrl</b>([<i>url</i>]) | URL of JSON file to load graph data directly from, as an alternative to specifying graphData directly ||
| <b>graphData</b>([<i>data</i>]) | Getter/setter for graph data structure (see below for syntax details) | { nodes: [], links: [] } |
| <b>numDimensions</b>([<i>int</i>]) | Getter/setter for number of dimensions to run the force simulation, between [1,3] | 3 |
| <b>nodeRelSize</b>([<i>num</i>]) | Getter/setter for ratio of the node sphere volume (cubic px) per value unit | 4 |
| <b>lineOpacity</b>([<i>num</i>]) | Getter/setter for line opacity of links, between [0,1] | 0.2 |
| <b>autoColorBy</b>([<i>str</i>]) | Node object accessor attribute to automatically color group nodes by, only affects nodes without a color field ||
| <b>idField</b>([<i>str</i>]) | Node object accessor attribute for node id | id |
| <b>valField</b>([<i>str</i>]) | Node object accessor attribute for node numeric value (translates to sphere volume) | val |
| <b>nameField</b>([<i>str</i>]) | Node object accessor attribute for node name used in label | name |
| <b>colorField</b>([<i>str</i>]) | Node object accessor attribute for node color | color |
| <b>linkSourceField</b>([<i>str</i>]) | Link object accessor attribute for source node | source |
| <b>linkTargetField</b>([<i>str</i>]) | Link object accessor attribute for target node | target |
| <b>forceEngine</b>([<i>str</i>]) | Getter/setter for which force-simulation engine to use: 'd3' or 'ngraph' | d3 |
| <b>warmupTicks</b>([<i>int</i>]) | Getter/setter for the number of layout engine cycles to dry-run before start rendering | 0 |
| <b>cooldownTicks</b>([<i>int</i>]) | Getter/setter for how many build-in frames to render before stopping the layout engine iteration | Infinity |
| <b>cooldownTime</b>([<i>num</i>]) | Getter/setter for how long (ms) to render before stopping the layout engine iteration | 15000 |
| <b>resetProps() | Reset all component properties to their default value ||

## Input JSON syntax

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
