export const PLUGIN_NAME = 'Styles';

/** Match stylesheet link and get URL of file from HTML. */
export const STYLESHEET_LINK_REGEXP = /<link\s+[^>]*href="([^"]+\.(?:css|scss|sass))"[^>]*>/g;

export const DEFAULT_STYLES_DIRECTORY = 'styles';
export const DEFAULT_SOURCE_DIRECTORY = 'src';

export const UP_LEVEL_GLOB = '..';
export const URL_DELIMITER = '/';