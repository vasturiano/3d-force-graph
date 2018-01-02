import tinyColor from 'tinycolor2';

export default str => isNaN(str) ? parseInt(tinyColor(str).toHex(), 16) : str;
