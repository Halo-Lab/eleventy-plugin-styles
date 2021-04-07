import { existsSync, promises } from 'fs';

/** Recursively creates directories. */
export const makeDirectories = async (path: string) => {
  if (!existsSync(path)) {
    await promises.mkdir(path, { recursive: true });
  }
};
