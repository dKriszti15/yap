import { createEffect, createResource, createSignal, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";

import {
  clearAuthState,
  CurrentUser,
  getAuthApiBaseUrl,
  loadAuthSession,
  loadCurrentUser,
  saveCurrentUser,
} from "../utils/session";

type MeResponse =
  | {
      ok: true;
      user: {
        id: string;
        sub: string;
        username: string;
        email: string;
        avatarUrl: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }
  | {
      ok: false;
      error: string;
    };

async function fetchMe(): Promise<CurrentUser | null> {
  const session = loadAuthSession();
  if (!session?.access_token) {
    return null;
  }

  const response = await fetch(`${getAuthApiBaseUrl()}/me`, {
    headers: {
      authorization: `Bearer ${session.access_token}`,
    },
  });

  const payload = (await response.json().catch(() => null)) as MeResponse | null;

  if (!response.ok || !payload || payload.ok === false) {
    const errorMessage = payload?.ok === false ? payload.error : "Failed to load profile";

    if (response.status === 401) {
      clearAuthState();
      return null;
    }

    throw new Error(errorMessage);
  }

  return payload.user;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [cachedUser, setCachedUser] = createSignal<CurrentUser | null>(loadCurrentUser());
  const [me] = createResource(fetchMe);

  const currentUser = () => me() ?? cachedUser();

  createEffect(() => {
    const user = me();

    if (user) {
      setCachedUser(user);
      saveCurrentUser(user);
    }
  });

  function signOut() {
    clearAuthState();
    setCachedUser(null);
    navigate("/auth", { replace: true });
  }

  const profileError = () => {
    const error = me.error;
    if (!error) {
      return null;
    }

    return error instanceof Error ? error.message : "Failed to load profile";
  };

  return (
    <main class="home-page">
      <section class="home-card">
        <p class="home-kicker">Yap</p>
        <h2>PROFILE</h2>

        <Show when={!me.loading} fallback={<p>Loading your profile...</p>}>
          <Show when={currentUser()} fallback={<p>{profileError() ?? "Sign in first to load your Keycloak user."}</p>}>
            <p>
              <strong>{currentUser()?.username}</strong> is signed in.
            </p>
            <p>{currentUser()?.email}</p>
            <p>{currentUser()?.sub}</p>
            <button class="btn" type="button" onClick={signOut}>
              <span class="btn-text">Sign out</span>
            </button>
          </Show>
        </Show>
      </section>
    </main>
  );
}