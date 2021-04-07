import { promises } from 'fs';
import { join, resolve, dirname } from 'path';

import { rip } from './rip';
import { compile } from './compile';
import { pathStats } from './paths_stats';
import { normalize } from './normalize';
import { makeDirectories } from './mkdir';
import { done, oops, start } from './pretty';
import { StylesPluginOptions } from './types';
import { PLUGIN_NAME, STYLESHEET_LINK_REGEXP } from './constants';

type BundleOptions = Required<Omit<StylesPluginOptions, 'addWatchTarget'>>;

const findAndProcessFiles = (
  html: string,
  outputPath: string,
  {
    sassOptions,
    cssnanoOptions,
    postcssPlugins,
    inputDirectory,
    purgeCSSOptions,
    publicDirectory,
  }: BundleOptions
) => {
  const [buildDirectory, ...nestedHTMLPath] = pathStats(outputPath).directories;

  return rip(html, STYLESHEET_LINK_REGEXP).map(
    async (publicSourcePathToStyle) => {
      start(
        PLUGIN_NAME,
        `Start compiling "${publicSourcePathToStyle}" stylesheet.`
      );

      const absolutePathToStyle = resolve(
        inputDirectory,
        publicSourcePathToStyle
      );
      const publicOutputPathToStyle = publicSourcePathToStyle.replace(
        /(sa|sc)ss$/,
        'css'
      );

      const { css } = compile(absolutePathToStyle, sassOptions);

      return normalize({
        html,
        css,
        url: absolutePathToStyle,
        cssnanoOptions,
        purgeCSSOptions,
        postcssPlugins,
      })
        .then(async ({ css }) => {
          const pathToOutputFile = resolve(
            buildDirectory,
            publicDirectory,
            publicOutputPathToStyle
          );

          return makeDirectories(dirname(pathToOutputFile)).then(() =>
            promises.writeFile(pathToOutputFile, css, { encoding: 'utf-8' })
          );
        })
        .then(() =>
          done(
            PLUGIN_NAME,
            `Compiled CSS was written to "${join(
              buildDirectory,
              publicDirectory,
              publicOutputPathToStyle
            )}"`
          )
        )
        .then(
          () => ({
            input: publicSourcePathToStyle,
            output: join(
              ...nestedHTMLPath.map(() => '..'),
              publicDirectory,
              publicOutputPathToStyle
            ),
          }),
          (error) => oops(PLUGIN_NAME, error)
        );
    }
  );
};

export const bundle = async (
  html: string,
  outputPath: string,
  {
    sassOptions,
    cssnanoOptions,
    postcssPlugins,
    inputDirectory,
    purgeCSSOptions,
    publicDirectory,
  }: BundleOptions
) =>
  Promise.all(
    findAndProcessFiles(html, outputPath, {
      sassOptions,
      cssnanoOptions,
      postcssPlugins,
      inputDirectory,
      purgeCSSOptions,
      publicDirectory,
    })
  )
    .then(
      (array) =>
        array.filter(Boolean) as ReadonlyArray<{
          input: string;
          output: string;
        }>
    )
    .then(
      (validUrls) => {
        const htmlWithStyles = validUrls.reduce(
          (text, { input, output }) => text.replace(input, output),
          html
        );

        done(
          PLUGIN_NAME,
          'Public URLs of compiled styles were injected into HTML'
        );

        return htmlWithStyles;
      },
      (error) => (oops(PLUGIN_NAME, error), html)
    );
