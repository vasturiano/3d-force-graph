import commonJs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import postCss from 'rollup-plugin-postcss';
import postCssSimpleVars from 'postcss-simple-vars';
import postCssNested from 'postcss-nested';
import babel from 'rollup-plugin-babel';

export default {
    input: 'src/index.js',
    plugins: [
        commonJs(),
        nodeResolve(),
        postCss({
            plugins: [
                postCssSimpleVars(),
                postCssNested()
            ]
        }),
        babel({
            presets: [
                ["es2015", { "modules": false }]
            ],
            plugins: ["external-helpers"],
            babelrc: false
        })
    ],
    output: [
        {
            format: 'umd',
            name: 'ForceGraph3D',
            file: 'dist/3d-force-graph.js',
            sourcemap: true
        },
        {
            format: 'es',
            file: 'dist/3d-force-graph.mjs'
        }
    ]
};