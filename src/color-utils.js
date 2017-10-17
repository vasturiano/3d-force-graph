import { schemePaired } from 'd3-scale-chromatic';
import tinyColor from 'tinycolor2';

const colorStr2Hex = str => isNaN(str) ? parseInt(tinyColor(str).toHex(), 16) : str;

function autoColorNodes(nodes, colorByAccessor, colorField) {
    if (!colorByAccessor || typeof colorField !== 'string') return;

    const colors = schemePaired; // Paired color set from color brewer

    const uncoloredNodes = nodes.filter(node => !node[colorField]);
    const nodeGroups = {};

    uncoloredNodes.forEach(node => { nodeGroups[colorByAccessor(node)] = null });
    Object.keys(nodeGroups).forEach((group, idx) => { nodeGroups[group] = idx });

    uncoloredNodes.forEach(node => {
        node[colorField] = colors[nodeGroups[colorByAccessor(node)] % colors.length];
    });
}

export { autoColorNodes, colorStr2Hex };