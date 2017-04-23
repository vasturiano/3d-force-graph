# 3D Force-Directed Graph

<p align="center">
     <a href="http://bl.ocks.org/vasturiano/02affe306ce445e423f992faeea13521"><img width="80%" src="http://gist.github.com/vasturiano/02affe306ce445e423f992faeea13521/raw/preview.png"></a>
</p>

A web component to represent a graph data structure in a 3-dimensional space using a force-directed iterative layout.
Uses ThreeJS/WebGL for 3D rendering.
A shout-out to [anvaka's](https://github.com/anvaka) [ngraph](https://github.com/anvaka/ngraph) for the [layout physics engine](https://github.com/anvaka/ngraph.forcelayout3d).

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
<script src="/path/to/dist/3d-force-graph.js"></script>
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
     .graphData(<data>)
     .nodeRelSize(<(number) node volume per value unit>)
     .lineOpacity(<between [0,1]>)
     .valAccessor(<function(node) to extract numeric value. default: node.val>)
     .nameAccessor(<function(node) to extract name string. default: node.name>)
     .colorAccessor(<function(node) to extract color hex number. default: node.color>)
     .warmUpTicks(<number of layout engine cycles to run before start rendering. default: 0>)
     .coolDownTicks(<# frames to stop engine. default: Infinity>)
     .coolDownTime(<ms to stop engine. default: 15000>)
     .resetProps()
```

## Data syntax

```
{
    nodes: { 
        id1: { 
          name: "name1",
          val: 1 
        },
        id2: { 
          name: "name2",
          val: 10 
        },
        (...)
    },
    links: [
        ['id1', 'id2'], // [from, to]
        (...)
    ]
}
```