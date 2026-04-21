import type { AuthSession, CurrentUser } from "./session";

export type LoginResponse = AuthSession;

export type RegisterResponse = {
  accountCreated: boolean;
  message?: string;
  user?: Pick<CurrentUser, "username" | "email">;
};