import { createEffect, onCleanup } from "solid-js";

import type { CurrentUser } from "../types/session";
import {
  clearAuthState,
  getAuthApiBaseUrl,
  loadAuthSession,
  loadCurrentUser,
  saveCurrentUser,
} from "./session";
import { useIsAuthenticated } from "./useAuth";

const HEARTBEAT_INTERVAL_MS = 30_000;

async function loadOrFetchCurrentUser(): Promise<CurrentUser | null> {
  const cachedUser = loadCurrentUser();
  if (cachedUser) {
    return cachedUser;
  }

  const session = loadAuthSession();
  if (!session?.access_token) {
    return null;
  }

  const response = await fetch(`${getAuthApiBaseUrl()}/me`, {
    headers: {
      authorization: `Bearer ${session.access_token}`,
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; user?: CurrentUser; error?: string }
    | null;

  if (!response.ok || !payload || payload.ok === false || !payload.user) {
    if (response.status === 401) {
      clearAuthState();
    }

    return null;
  }

  saveCurrentUser(payload.user);
  return payload.user;
}

export function usePresenceHeartbeat() {
  const isAuthenticated = useIsAuthenticated();

  createEffect(() => {
    if (!isAuthenticated()) {
      return undefined;
    }

    let stopped = false;
    let heartbeatTimer: number | undefined;

    const sendHeartbeat = async () => {
      const session = loadAuthSession();
      if (!session?.access_token || stopped) {
        return;
      }

      const currentUser = await loadOrFetchCurrentUser();
      if (!currentUser || stopped) {
        return;
      }

      const response = await fetch(`${getAuthApiBaseUrl()}/presence/heartbeat`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.status === 401) {
        clearAuthState();
      }
    };

    void sendHeartbeat();
    heartbeatTimer = window.setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    onCleanup(() => {
      stopped = true;
      if (heartbeatTimer) {
        window.clearInterval(heartbeatTimer);
      }
    });
  });
}