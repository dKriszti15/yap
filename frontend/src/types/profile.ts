import type { CurrentUser } from "./session";

export type MeResponse =
  | {
      ok: true;
      user: CurrentUser;
    }
  | {
      ok: false;
      error: string;
    };