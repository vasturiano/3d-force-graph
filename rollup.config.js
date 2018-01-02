import resolve from 'rollup-plugin-node-resolve';
import commonJs from 'rollup-plugin-commonjs';
import postCss from 'rollup-plugin-postcss';
import postCssSimpleVars from 'postcss-simple-vars';
import postCssNested from 'postcss-nested';
import babel from 'rollup-plugin-babel';
import { name, homepage, version } from './package.json';

export default {
  input: 'src/index.js',
  output: [
    {
      format: 'umd',
      name: 'ForceGraph3D',
      file: `dist/${name}.js`,
      sourcemap: true,
      banner: `// Version ${version} ${name} - ${homepage}`
    }
  ],
  plugins: [
    postCss({
      plugins: [
        postCssSimpleVars(),
        postCssNested()
      ]
    }),
    babel({ exclude: 'node_modules/**' }),
    resolve(),
    commonJs()
  ]
};