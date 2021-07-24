import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'build',
    format: 'cjs',
    sourcemap: true,
  },
  plugins: [
    typescript(),
    nodeResolve({ dedupe: ['@fluss/core'], resolveOnly: [/@fluss\/core/] }),
    terser(),
  ],
  external: [
    'fs',
    'path',
    'sass',
    'chalk',
    'cssnano',
    'postcss',
    'autoprefixer',
    '@fullhuman/postcss-purgecss',
  ],
};
