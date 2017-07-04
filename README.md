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
| <b>width</b>([<i>px</i>]) | Getter/setter for the canvas width. | &lt;window width&gt; |
| <b>height</b>([<i>px</i>]) | Getter/setter for the canvas height. | &lt;window height&gt; |
| <b>graphData</b>([<i>data</i>]) | Getter/setter for graph data structure (see below for syntax details). Can also be used to apply [incremental updates](https://bl.ocks.org/vasturiano/2f602ea6c51c664c29ec56cbe2d6a5f6). | { nodes: [], links: [] } |
| <b>jsonUrl</b>([<i>url</i>]) | URL of JSON file to load graph data directly from, as an alternative to specifying <i>graphData</i> directly. ||
| <b>numDimensions</b>([<i>int</i>]) | Getter/setter for number of dimensions to run the force simulation on (1, 2 or 3). | 3 |
| <b>nodeRelSize</b>([<i>num</i>]) | Getter/setter for the ratio of node sphere volume (cubic px) per value unit. | 4 |
| <b>nodeResolution</b>([<i>num</i>]) | Getter/setter for the geometric resolution of each node, expressed in how many slice segments to divide the circumference. Higher values yield smoother spheres. | 8 |
| <b>lineOpacity</b>([<i>num</i>]) | Getter/setter for line opacity of links, between [0,1]. | 0.2 |
| <b>autoColorBy</b>([<i>str</i>]) | Node object accessor attribute to automatically group colors by, only affects nodes without a color attribute. ||
| <b>idField</b>([<i>str</i>]) | Node object accessor attribute for unique node id (used in link objects source/target). | id |
| <b>valField</b>([<i>str</i>]) | Node object accessor attribute for node numeric value (affects sphere volume). | val |
| <b>nameField</b>([<i>str</i>]) | Node object accessor attribute for name (shown in label). | name |
| <b>colorField</b>([<i>str</i>]) | Node object accessor attribute for node color (affects sphere color). | color |
| <b>linkSourceField</b>([<i>str</i>]) | Link object accessor attribute referring to id of source node. | source |
| <b>linkTargetField</b>([<i>str</i>]) | Link object accessor attribute referring to id of target node. | target |
| <b>forceEngine</b>([<i>str</i>]) | Getter/setter for which force-simulation engine to use ([*d3*](https://github.com/vasturiano/d3-force-3d) or [*ngraph*](https://github.com/anvaka/ngraph.forcelayout)). | d3 |
| <b>warmupTicks</b>([<i>int</i>]) | Getter/setter for number of layout engine cycles to dry-run at ignition before starting to render. | 0 |
| <b>cooldownTicks</b>([<i>int</i>]) | Getter/setter for how many build-in frames to render before stopping and freezing the layout engine. | Infinity |
| <b>cooldownTime</b>([<i>num</i>]) | Getter/setter for how long (ms) to render for before stopping and freezing the layout engine. | 15000 |
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

## Local development

```
npm install
npm run watch
```
