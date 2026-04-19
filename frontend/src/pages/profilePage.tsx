import { createResource, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";

import { clearAuthSession, getAuthApiBaseUrl, loadAuthSession } from "../utils/session";

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

async function fetchMe() {
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
      clearAuthSession();
      return null;
    }

    throw new Error(errorMessage);
  }

  return payload.user;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [me] = createResource(fetchMe);

  function signOut() {
    clearAuthSession();
    navigate("/auth", { replace: true });
  }

  return (
    <main class="home-page">
      <section class="home-card">
        <p class="home-kicker">Yap</p>
        <h2>PROFILE</h2>

        <Show
          when={me()}
          fallback={<p>Sign in first to load your Keycloak user.</p>}
        >
          <p>
            <strong>{me()?.username}</strong> is signed in.
          </p>
          <p>{me()?.email}</p>
          <p>{me()?.sub}</p>
          <button class="btn" type="button" onClick={signOut}>
            <span class="btn-text">Sign out</span>
          </button>
        </Show>
      </section>
    </main>
  );
}