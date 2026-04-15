export type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_expires_in?: number;
  refresh_token?: string;
  token_type: string;
  scope?: string;
  id_token?: string;
};

export type AdminUserPayload = {
  username: string;
  email: string;
  password: string;
};

export type RegisterResult = {
  created: true;
  username: string;
  email: string;
};

export type KeycloakAdminUser = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};