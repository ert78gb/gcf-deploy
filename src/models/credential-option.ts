export type CredentialType = 'file' | 'env';

export interface CredentialOption {
  type: CredentialType;
  filePath?: string;
  env?: {
    clientEmail: string;
    privateKey: string;
  };
}
