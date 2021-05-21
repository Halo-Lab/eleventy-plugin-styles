import { join } from 'path';

import { bundle } from './bundle';
import { StylesPluginOptions } from './types';
import {
  DEFAULT_SOURCE_DIRECTORY,
  DEFAULT_STYLES_DIRECTORY,
} from './constants';

/**
 * Plugin that searches for links to stylesheets inside HTML,
 * compiles, normalizes and mificates them. After that - writes
 * to the _output_ directory.
 */
export const styles = (
  config: Record<string, Function>,
  {
    sassOptions = {},
    inputDirectory = join(DEFAULT_SOURCE_DIRECTORY, DEFAULT_STYLES_DIRECTORY),
    cssnanoOptions = {},
    addWatchTarget = true,
    postcssPlugins = [],
    purgeCSSOptions = {},
    publicDirectory = '',
  }: StylesPluginOptions = {}
) => {
  config.addTransform(
    'styles',
    async function (
      this: Record<string, string>,
      content: string,
      outputPath: string
    ) {
      if (outputPath.endsWith('html')) {
        return bundle(content, this.inputPath, outputPath, {
          sassOptions,
          inputDirectory,
          cssnanoOptions,
          postcssPlugins,
          purgeCSSOptions,
          publicDirectory,
        });
      }

      return content;
    }
  );

  if (addWatchTarget) {
    config.addWatchTarget(inputDirectory);
  }
};

export { StylesPluginOptions };
