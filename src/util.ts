import { IOptions, sync } from 'glob';

export async function wait(ms: number): Promise<any> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getGlobFiles(globs: Array<string>, options: IOptions): Array<string> {
  const negativeGlobs = [];
  const positiveGlobs = [];

  for (const glob of globs)
    if (glob.substr(0, 1) === '!')
      negativeGlobs.push(glob.substr(1));
    else
      positiveGlobs.push(glob);

  const negativeFiles = new Map<string, string>();
  const positiveFiles = new Map<string, string>();

  for (const glob of negativeGlobs) {
    const result = sync(glob, options);

    for (const path of result)
      if (!negativeFiles.has(path))
        negativeFiles.set(path, path);
  }

  for (const glob of positiveGlobs) {
    const result = sync(glob, options);

    for (const path of result)
      if (!negativeFiles.has(path) && !positiveFiles.has(path))
        positiveFiles.set(path, path);
  }

  return Array.from(positiveFiles.values());
}
