export type AuthSession = {
  access_token: string;
  expires_in: number;
  refresh_expires_in?: number;
  refresh_token?: string;
  token_type: string;
  scope?: string;
  id_token?: string;
};

export type CurrentUser = {
  id: string;
  sub: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StoredAuthSession = AuthSession & {
  stored_at: number;
};