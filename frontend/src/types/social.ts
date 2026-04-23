import type { CurrentUser } from "./session";

export type SocialStatus = "online" | "offline" | "away";

export type SocialUser = {
  id: string;
  username: string;
  avatarUrl: string | null;
  status?: SocialStatus;
};

export type SocialGroup = {
  id: string;
  name: string;
  role: string;
  memberCount?: number;
};

export type SocialOverview = {
  friends: SocialUser[];
  groups: SocialGroup[];
};

export type SocialApiPayload =
  | {
      ok: true;
      friends?: unknown[];
      groups?: unknown[];
    }
  | {
      ok: false;
      error: string;
    };

export type SocialApiSuccessPayload = Extract<SocialApiPayload, { ok: true }>;

export type SocialOverviewResponse =
  | {
      ok: true;
      user: CurrentUser;
      friends: SocialUser[];
      groups: SocialGroup[];
    }
  | {
      ok: false;
      unauthorized: boolean;
      message: string;
    };

export type Friend = {
  id: string;
  username: string;
  status?: string;
};

export type Group = {
  id: string;
  name: string;
  role: string;
  memberCount?: number;
};

export type SocialState = {
  userName: string;
  friends: Friend[];
  groups: Group[];
  unauthorized: boolean;
  message: string | null;
};
