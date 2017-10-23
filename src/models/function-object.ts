export interface FunctionObject {
  location?: string;
  name?: string;
  description?: string;
  entryPoint: string;
  timeout?: string;
  availableMemoryMb?: number;
  serviceAccountEmail?: string;
  updateTime?: Date;
  versionId?: string;
  labels?: {
    string: string
  };
  sourceArchiveUrl?: string;
  trigger?: any;
}
