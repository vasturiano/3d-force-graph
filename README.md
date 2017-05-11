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
| width(<px>) | Getter/setter for canvas width | <window width> |
| height(<px>) | Getter/setter for canvas height | <window height> |
| jsonUrl(<url>) | URL of JSON file to load graph data directly from, as an alternative to specifying graphData directly ||
| graphData(<data>) | Getter/setter for graph data structure (see below for syntax details) | { node: [], links: [] } |
| numDimensions(<int>) | Getter/setter for number of dimensions to run the force simulation, between [1,3] | 3 |
| nodeRelSize(<num>) | Getter/setter for ratio of the node sphere volume (cubic px) per value unit | 4 |
| lineOpacity(<num>) | Getter/setter for line opacity of links, between [0,1] | 0.2 |
| autoColorBy(<str>) | Node object accessor attribute to automatically color group nodes by, only affects nodes without a color field ||
| idField(<str>) | Node object accessor attribute for node id | 'id' |
| valField(<str>) | Node object accessor attribute for node numeric value (translates to sphere volume) | 'val' |
| nameField(<str>) | Node object accessor attribute for node name used in label | 'name' |
| colorField(<str>) | Node object accessor attribute for node color | 'color' |
| linkSourceField(<str>) | Link object accessor attribute for source node | 'source' |
| linkTargetField(<str>) | Link object accessor attribute for target node | 'target' |
| forceEngine(<str>) | Getter/setter for which force-simulation engine to use: 'd3' or 'ngraph' | 'd3' |
| warmupTicks(<int>) | Getter/setter for the number of layout engine cycles to dry-run before start rendering | 0 |
| cooldownTicks(<int>) | Getter/setter for how many build-in frames to render before stopping the layout engine iteration | Infinity |
| cooldownTime(<num>) | Getter/setter for how long (ms) to render before stopping the layout engine iteration | 15000 |
| resetProps() | Reset all component properties to their default value ||

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
