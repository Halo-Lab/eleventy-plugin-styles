import { promises } from 'fs';
import { join, resolve, dirname } from 'path';

import { rip } from './rip';
import { compile } from './compile';
import { normalize } from './normalize';
import { makeDirectories } from './mkdir';
import { done, oops, start } from './pretty';
import { StylesPluginOptions } from './types';
import { STYLESHEET_LINK_REGEXP } from './constants';
import { buildOutputUrl, pathStats, resolveFile } from './url';

type BundleOptions = Required<Omit<StylesPluginOptions, 'addWatchTarget'>>;

const findAndProcessFiles = (
  html: string,
  inputPath: string,
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

      const absolutePathToStyle = resolveFile(
        publicSourcePathToStyle,
        inputDirectory,
        dirname(inputPath)
      );
      const publicOutputPathToStyle = buildOutputUrl(
        publicSourcePathToStyle,
        publicDirectory
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
              publicOutputPathToStyle
            )}"`
          )
        )
        .then(
          () => ({
            input: publicSourcePathToStyle,
            output: join(
              ...nestedHTMLPath.map(() => '..'),
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
  inputPath: string,
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
    findAndProcessFiles(html, inputPath, outputPath, {
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

        if (validUrls.length > 0) {
          done('Public URLs of compiled styles were injected into HTML');
        }

        return htmlWithStyles;
      },
      (error) => (oops(error), html)
    );
