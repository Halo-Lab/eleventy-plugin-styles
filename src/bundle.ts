import { promises } from 'fs';
import { join, resolve, dirname } from 'path';

import { bold } from 'chalk';
import { memoize } from '@fluss/core';

import { rip } from './rip';
import { compile } from './compile';
import { normalize } from './normalize';
import { makeDirectories } from './mkdir';
import { done, oops, start } from './pretty';
import { StylesPluginOptions } from './types';
import { STYLESHEET_LINK_REGEXP } from './constants';
import { buildOutputUrl, pathStats, resolveFile } from './url';

type BundleOptions = Required<Omit<StylesPluginOptions, 'addWatchTarget'>>;

interface TransformParameters extends BundleOptions {
  readonly html: string;
  readonly inputPath: string;
  readonly nestedHTMLPath: ReadonlyArray<string>;
  readonly buildDirectory: string;
  readonly publicSourcePathToStyle: string;
}

export const transformStylesheet = memoize(
  async ({
    html,
    inputPath,
    sassOptions,
    inputDirectory,
    publicDirectory,
    cssnanoOptions,
    purgeCSSOptions,
    postcssPlugins,
    buildDirectory,
    nestedHTMLPath,
    publicSourcePathToStyle,
  }: TransformParameters) => {
    start(`Start compiling ${bold(publicSourcePathToStyle)}.`);

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
          `Compiled ${bold(publicSourcePathToStyle)} was written to ${bold(
            join(buildDirectory, publicOutputPathToStyle)
          )}`
        )
      )
      .then(
        // Creates public path.
        () => join(...nestedHTMLPath.map(() => '..'), publicOutputPathToStyle),
        oops
      );
  },
  ({ publicSourcePathToStyle }) => publicSourcePathToStyle
);

const findAndProcessFiles = (
  html: string,
  inputPath: string,
  outputPath: string,
  options: BundleOptions
) => {
  const [buildDirectory, ...nestedHTMLPath] = pathStats(outputPath).directories;

  return rip(html, STYLESHEET_LINK_REGEXP).map((link) =>
    transformStylesheet({
      html,
      inputPath,
      buildDirectory,
      nestedHTMLPath,
      publicSourcePathToStyle: link,
      ...options,
    }).then((output) => ({
      input: link,
      output,
    }))
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

        return [htmlWithStyles, validUrls] as const;
      },
      (error) => (oops(error), [html, []] as const)
    )
    .then(([html, urls]) => {
      if (urls.length > 0) {
        done(
          `${bold(
            '[' + urls.map(({ output }) => output).join(', ') + ']'
          )} URLs were injected into ${bold(outputPath)}`
        );
      }

      return html;
    });
