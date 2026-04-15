export type KeycloakClaims = {
  sub: string;
  preferred_username?: string;
  name?: string;
  email?: string;
  picture?: string;
};

export type LoginRequestBody = {
  username?: string;
  password?: string;
};

export type RegisterRequestBody = {
  username?: string;
  email?: string;
  password?: string;
};