import { createReadStream, readJSONSync } from 'fs-extra';
import * as google from 'googleapis';
import { escape } from 'querystring';

import { Bucket } from './models/bucket';
import { StorageObject } from './models/storage-object';
import { FunctionObject } from './models/function-object';

const FUNCTION_VERSION = 'v1beta2';
const STORAGE_VERSION = 'v1';

export class GoogleProvider {
  private _authClient;

  constructor(private credentials: string) {

  }

  async getBucket(bucket: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const auth = await this.getAuthlient();

      const storage = google.storage(STORAGE_VERSION);
      const request = {
        auth,
        bucket
      };

      storage.buckets.get(request, (err, response) => {
        if (err) {
          if (err.code === 404)
            return resolve();

          return reject(err);
        }

        resolve(response);
      });
    });

  }

  async insertBucket(bucket: Bucket): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const auth = await this.getAuthlient();

      const storage = google.storage(STORAGE_VERSION);
      const request = {
        auth,
        project: bucket.project,
        resource: {
          name: bucket.name,
          location: bucket.location,
          storageClass: bucket.storageClass
        }
      };

      storage.buckets.insert(request, (err, response) => {
        if (err) {
          if (err.code === 404)
            return resolve();

          return reject(err);
        }

        resolve(response);
      });
    });
  }

  async getStorageObject(storageObject: StorageObject): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const auth = await this.getAuthlient();

      const storage = google.storage(STORAGE_VERSION);
      const request = {
        auth,
        bucket: storageObject.bucket,
        object: escape(storageObject.name)
      };

      storage.objects.get(request, (err, response, incommingMessage) => {
        if (err) {
          if (err.code === 404)
            return resolve();

          return reject(err);
        }

        if (incommingMessage.statusCode === 404)
          return resolve();

        resolve(response);
      });
    });
  }

  async insertStorageObject(storageObject: StorageObject, zipFilePath: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const auth = await this.getAuthlient();

      const storage = google.storage(STORAGE_VERSION);
      const request = {
        auth,
        bucket: storageObject.bucket,
        resource: {
          name: storageObject.name,
          mineType: 'application/zip'
        },
        media: {
          mimeType: 'application/zip',
          body: createReadStream(zipFilePath)
        }
      };

      storage.objects.insert(request, (err, response) => {
        if (err)
          return reject(err);

        resolve(response);
      });
    });
  }

  async getFunction(name: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const auth = await this.getAuthlient();

      const cloudfunctions = google.cloudfunctions(FUNCTION_VERSION);
      const request = {
        auth,
        name
      };

      cloudfunctions.projects.locations.functions.get(request, (err, response) => {
        if (err) {
          if (err.code === 404)
            return resolve();

          return reject(err);
        }

        resolve(response);
      });
    });
  }

  async createFunction(functionObject: FunctionObject): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const auth = await this.getAuthlient();

      const cloudfunctions = google.cloudfunctions(FUNCTION_VERSION);
      const request = {
        auth,
        location: functionObject.location,
        resource: {
          name: functionObject.name,
          // description: options.func.description,
          entryPoint: functionObject.entryPoint,
          timeout: functionObject.timeout,
          availableMemoryMb: functionObject.availableMemoryMb,
          // updateTime: options.func.updateTime,
          // versionId: pkgJson.version,
          // labels: options.func.labels,
          sourceArchiveUrl: functionObject.sourceArchiveUrl,
          httpsTrigger: functionObject.trigger
        }
      };

      cloudfunctions.projects.locations.functions.create(request, (err, response, incommingMessage) => {
        if (err)
          return reject(err);

        resolve(response);
      });
    });
  }

  async updateFunction(functionObject: FunctionObject): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const auth = await this.getAuthlient();

      const cloudfunctions = google.cloudfunctions(FUNCTION_VERSION);
      const request = {
        auth,
        name: functionObject.name,
        resource: {
          name: functionObject.name,
          // description: options.func.description,
          entryPoint: functionObject.entryPoint,
          timeout: functionObject.timeout,
          availableMemoryMb: functionObject.availableMemoryMb,
          // updateTime: options.func.updateTime,
          // versionId: pkgJson.version,
          // labels: options.func.labels,
          sourceArchiveUrl: functionObject.sourceArchiveUrl,
          httpsTrigger: functionObject.trigger
        }
      };

      cloudfunctions.projects.locations.functions.update(request, (err, response, incommingMessage) => {
        if (err)
          return reject(err);

        resolve(response);
      });
    });
  }

  async getOperation(name: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const auth = await this.getAuthlient();

      const cloudfunctions = google.cloudfunctions(FUNCTION_VERSION);

      const request = {
        auth,
        name
      };
      cloudfunctions.operations.get(request, (err, response, incommingMessage) => {
        if (err)
          return reject(err);

        resolve(response);
      });
    });
  }

  private async getAuthlient(): Promise<any> {
    if (this._authClient)
      return Promise.resolve(this._authClient);

    return new Promise((resolve, reject) => {
      const keyFile = readJSONSync(this.credentials);
      this._authClient = new google.auth
        .JWT(keyFile.client_email,
          undefined,
          keyFile.private_key,
          ['https://www.googleapis.com/auth/cloud-platform']
        );

      this._authClient.authorize((err, tokens) => {
        if (err)
          return reject(err);

        return resolve(this._authClient);
      });
    });
  }
}
