export interface ApiKeyResponse {
  api_key: string;
  expires_at: string;
}

export interface ApiKeyPayload {
  userId: string;
  apiKeyId: string;
  permissions: string[];
}
