import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';

export default {
    entry: 'src/tree.js',
    dest: 'dist/inspire-tree.js',
    format: 'umd',
    moduleName: 'InspireTree',
    plugins: [
        babel({
            exclude: 'node_modules/**'
        }),
        nodeResolve({
            jsnext: true,
            skip: ['lodash'],
            browser: true
        }),
        commonjs({
            sourceMap: false,
            namedExports: {
                'es6-promise': ['Promise'],
                eventemitter2: ['EventEmitter2'],
                inferno: ['render']
            }
        }),
        // uglify()
    ]
};
