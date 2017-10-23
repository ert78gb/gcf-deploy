import { copySync, createWriteStream, emptyDir, pathExistsSync, readJSONSync } from 'fs-extra';
import * as archiver from 'archiver';
import * as path from 'path';
import { execSync } from 'child_process';

import { DEFAULT_OPTIONS, Options } from './models/options';
import { GoogleProvider } from './google-provider';
import { Bucket } from './models/bucket';
import { FunctionObject } from './models/function-object';
import { getGlobFiles, wait } from './util';

export { Options } from './models/options';

export async function deploy(options: Options): Promise<void> {
  const _options: Options = { ...DEFAULT_OPTIONS, ...options } as any;
  const destination = path.resolve(_options.cwd, options.distDirectory);
  const zipFilePath = path.join(destination, '../package.zip');
  let pkgJson;

  await emptyDir(destination);
  const globs = getAllGlob(_options);
  copyFiles(globs, _options);
  pruneNodePackages(destination);
  await zipPackage(destination, zipFilePath);
  pkgJson = readJSONSync(path.join(destination, 'package.json'));
  if (!_options.artifact)
    _options.artifact = `${pkgJson.name}/${pkgJson.name}-${pkgJson.version}.zip`;

  const googleProvider = new GoogleProvider(_options.credentials);
  let bucket = await googleProvider.getBucket(_options.bucket);
  if (!bucket) {
    const newBucket: Bucket = {
      project: _options.projectId,
      name: _options.bucket,
      location: _options.location || 'us-central1',
      storageClass: 'REGIONAL'
    };
    bucket = await googleProvider.insertBucket(newBucket);
  }

  const storage = {
    bucket: _options.bucket,
    name: _options.artifact
  };

  let storageObject = await googleProvider.getStorageObject(storage);

  if (storageObject && !_options.overwrite)
    return Promise.reject(new Error('The function with this version already exists'));

  storageObject = await googleProvider.insertStorageObject(storage, zipFilePath);

  const functionName = `projects/${_options.projectId}/locations/${_options.location}/functions/${pkgJson.name}`;

  const func = await googleProvider.getFunction(functionName);
  const newFunction: FunctionObject = {
    location: `projects/${_options.projectId}/locations/${_options.location}`,
    trigger: {},
    name: functionName,
    sourceArchiveUrl: `gs://${storageObject.bucket}/${storageObject.name}`,
    ..._options.func
  } as any;

  const operation = func
    ? await googleProvider.updateFunction(newFunction)
    : await googleProvider.createFunction(newFunction);

  while (true) {
    const response = await googleProvider.getOperation(operation.name);
    if (response.done) {
      if (response.error)
        return Promise.reject(response.error);

      return Promise.resolve();
    }
    await wait(2000);
  }

}

function getAllGlob(options: Options): Array<string> {
  const result = options.globs.slice(0);
  const extras = ['package.json'];

  for (const extra of extras)
    if (result.indexOf(extra) === -1)
      result.push(extra);

  return result;
}

function copyFiles(globs: Array<string>, options: Options): void {
  const files = getGlobFiles(globs, { cwd: options.cwd });
  for (const file of files) {
    const source = path.resolve(options.cwd, file);
    const destination = path.resolve(options.cwd, options.distDirectory, file);
    if (!pathExistsSync(destination))
      copySync(source, destination);
  }
}

function pruneNodePackages(distFolder: string): void {
  const options = {
    cwd: distFolder
  };

  execSync('npm prune --production', options);
}

function zipPackage(distDirectory: string, zipFilePath: string): Promise<void> {
  // return new Promise((resolve, reject) => {
  const output = createWriteStream(zipFilePath);
  const archive = archiver.create('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  // archive.on('error', (err) => {
  //   reject(err);
  // });
  //
  // archive.on('close', () => {
  //   resolve();
  // });

  archive.pipe(output);

  archive.directory(distDirectory, '');

  return archive.finalize();
  // .then(resolve)
  // .catch(reject);
  // });
}
