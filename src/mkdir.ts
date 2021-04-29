import { existsSync, promises } from 'fs';

/** Recursively creates directories. */
export const makeDirectories = async (path: string) =>
  void (existsSync(path) || (await promises.mkdir(path, { recursive: true })));
