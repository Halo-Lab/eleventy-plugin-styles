import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'build',
    format: 'cjs',
    sourcemap: true,
    preserveModules: true,
    preserveModulesRoot: 'src',
  },
  plugins: [typescript(), terser()],
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
