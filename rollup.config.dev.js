import buildConfig from './rollup.config.js';

// use first output of first config block for dev
const config = Array.isArray(buildConfig) ? buildConfig[0] : buildConfig;
Array.isArray(config.output) && (config.output = config.output[0]);

export default config;