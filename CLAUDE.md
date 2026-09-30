# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a 3D Force-Directed Graph visualization library that creates interactive 3D network graphs using WebGL and ThreeJS. It provides a web component for representing graph data structures in 3D space using force-directed layout algorithms.

## Development Commands

- `yarn build` - Production build (creates UMD, ES modules, and TypeScript declarations in `/dist`)
- `yarn dev` - Development mode with file watching (uses first UMD output only)

## Architecture

### Core Structure
- **Main entry**: `src/index.js` (imports CSS and exports the main component)
- **Core implementation**: `src/3d-force-graph.js` (main component logic)
- **TypeScript definitions**: `src/index.d.ts` (comprehensive type definitions)
- **Styling**: `src/3d-force-graph.css`
- **Utilities**: `src/kapsule-link.js` (Kapsule integration helpers)

### Build System
- **Bundler**: Rollup with three output formats:
  - UMD: `/dist/3d-force-graph.js` (and minified version)
  - ES Module: `/dist/3d-force-graph.mjs`
  - TypeScript declarations: `/dist/3d-force-graph.d.ts`
- **Development**: Uses first UMD configuration from main rollup config
- Uses Babel for transpilation, PostCSS for styling, and terser for minification

### Dependencies & Architecture
- **ThreeJS**: 3D rendering engine (WebGL)
- **Kapsule**: Component framework for chainable APIs
- **three-forcegraph**: Core force graph engine
- **three-render-objects**: 3D object rendering utilities
- **Physics engines**: d3-force-3d (default) or ngraph for force simulation

### Component Pattern
Uses Kapsule framework to create a chainable API component. The main class extends ThreeForceGraphGeneric and adds 3D-specific functionality like camera controls, container layout, and advanced interaction handling.

## Examples Structure

Extensive examples in `/example/` directory demonstrate:
- Basic usage patterns
- Custom node/link styling
- Interactive features (click, hover, drag)
- Advanced rendering effects (bloom, particles)
- DAG layouts and force configurations
- Performance optimizations

Each example is a standalone HTML file that can be opened directly in a browser. Examples use either the CDN version or can be modified to use local build (`../../dist/3d-force-graph.js`).

## Key Features

### Force Simulation
- Supports d3-force-3d and ngraph physics engines
- DAG (Directed Acyclic Graph) layout constraints
- Configurable force parameters and simulation control

### Rendering & Interaction
- Multiple camera control types (trackball, orbit, fly)
- Custom node geometries and link materials
- Mouse interaction (click, hover, drag) with performance controls
- Post-processing effects support

### Data Format
Expects graph data as `{ nodes: [...], links: [...] }` where:
- Nodes have unique `id` field
- Links reference nodes via `source` and `target` fields

## Performance Considerations
- `enablePointerInteraction` can be disabled for performance
- Warmup/cooldown tick controls for simulation optimization
- Animation pause/resume functionality available