import { Locations } from './locations';
import { FunctionObject } from './function-object';
import { CredentialOption } from './credential-option';

export interface Options {
  projectId: string;
  credentials: CredentialOption;
  location?: Locations;
  distDirectory: string;
  globs?: Array<string>;
  cwd?: string;
  bucket?: string;
  artifact?: string;
  func: FunctionObject;
  overwrite: boolean;
}

export const DEFAULT_OPTIONS = {
  location: 'us-central1',
  globs: [],
  cwd: process.cwd(),
  overwrite: false
};
