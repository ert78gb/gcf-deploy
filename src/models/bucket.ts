import { Locations } from './locations';

export interface Bucket {
  project: string;
  name: string;
  location: Locations;
  storageClass: string;
}
