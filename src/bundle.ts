import { promises } from 'fs';
import { join, resolve, dirname } from 'path';

import { rip } from './rip';
import { compile } from './compile';
import { pathStats } from './paths_stats';
import { normalize } from './normalize';
import { makeDirectories } from './mkdir';
import { done, oops, start } from './pretty';
import { StylesPluginOptions } from './types';
import { STYLESHEET_LINK_REGEXP } from './constants';

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
      start(`Start compiling "${publicSourcePathToStyle}" stylesheet.`);

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
          oops
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

        done('Public URLs of compiled styles were injected into HTML');

        return htmlWithStyles;
      },
      (error) => (oops(error), html)
    );
