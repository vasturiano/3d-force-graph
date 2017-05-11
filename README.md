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
<script src="//unpkg.com/3d-force-graph/dist/3d-force-graph.js"></script>
```
then
```
var myGraph = ForceGraph3D();
myGraph(<myDOMElement>);
```

## API reference

```
ForceGraph3D()
     .width(<px>)
     .height(<px>)
     .jsonUrl(<URL of JSON file to load graph data directly from, as an alternative to specifying graphData directly>)
     .graphData(<data>)
     .numDimensions(<number of dimensions, between [1,3]. default: 3>)
     .nodeRelSize(<(number) node volume per value unit>)
     .lineOpacity(<between [0,1]>)
     .autoColorBy(<node object accessor property name, only affects nodes without a color field>)
     .idField(<node object accessor property name. default: 'id'>)
     .valField(<node object accessor property name. default: 'val'>)
     .nameField(<node object accessor property name. default: 'name'>)
     .colorField(<node object accessor property name. default: 'color'>)
     .linkSourceField(<link object accessor property name. default: 'source'>)
     .linkTargetField(<link object accessor property name. default: 'target'>)
     .forceEngine(<which force-simulation engine to use: 'd3' (default) or 'ngraph'>)
     .warmupTicks(<number of layout engine cycles to run before start rendering. default: 0>)
     .cooldownTicks(<# frames to stop engine. default: Infinity>)
     .cooldownTime(<ms to stop engine. default: 15000>)
     .resetProps()
```

## Input graphData syntax

```
{
    nodes: [ 
        { 
          id: 'id1',
          name: "name1",
          val: 1 
        },
        { 
          id: 'id2',
          name: "name2",
          val: 10 
        },
        (...)
    ],
    links: [
        {
            source: 'id1',
            target: 'id2'
        },
        (...)
    ]
}
```
