import { SassCompilerOptions } from './compile';
import { NormalizeStepOptions } from './normalize';

export type StylesPluginOptions = {
  /**
   * Path to directory with all styles.
   * Should be relative to _current working directory_.
   */
  inputDirectory?: string;
  /**
   * Directory inside _output_ folder to be used as
   * warehouse for all compiled styles. Will be
   * prepended to public style urls in HTML.
   */
  publicDirectory?: string;
  /**
   * Options that can be passed to [`sass`](https://www.npmjs.com/package/sass)
   * module.
   */
  sassOptions?: SassCompilerOptions;
  /**
   * Indicates whether should Eleventy watch on files
   * under _inputDirectory_ or not.
   */
  addWatchTarget?: boolean;
} & Pick<
  NormalizeStepOptions,
  'cssnanoOptions' | 'postcssPlugins' | 'purgeCSSOptions'
>;
