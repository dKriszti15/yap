import { For, Show, createResource } from "solid-js";
import { A } from "@solidjs/router";

import "../utils/socialPage.css";
import {
    clearAuthState,
    getAuthApiBaseUrl,
    loadAuthSession,
    loadCurrentUser,
} from "../utils/session";
import type { Friend, Group, SocialState } from "../types/social";

function parseFriend(item: unknown): Friend | null {
    if (!item || typeof item !== "object") return null;
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.username !== "string") return null;

    return {
        id: record.id,
        username: record.username,
        status: typeof record.status === "string" ? record.status : undefined,
    };
}

function parseGroup(item: unknown): Group | null {
    if (!item || typeof item !== "object") return null;
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.name !== "string") return null;

    return {
        id: record.id,
        name: record.name,
        role: typeof record.role === "string" ? record.role : "member",
        memberCount: typeof record.memberCount === "number" ? record.memberCount : undefined,
    };
}

async function fetchSocialPanel(): Promise<SocialState> {
    const session = loadAuthSession();
    const cachedUser = loadCurrentUser();
    const userName = cachedUser?.username ?? "you";

    if (!session?.access_token) {
        return {
            userName,
            friends: [],
            groups: [],
            unauthorized: true,
            message: "Sign in to view your social panel.",
        };
    }

    try {
        const response = await fetch(`${getAuthApiBaseUrl()}/social/overview`, {
            headers: {
                authorization: `Bearer ${session.access_token}`,
            },
        });

        if (response.status === 404) {
            return {
                userName,
                friends: [],
                groups: [],
                unauthorized: false,
                message: null,
            };
        }

        const payload = (await response.json().catch(() => null)) as
            | { ok?: boolean; error?: string; friends?: unknown[]; groups?: unknown[] }
            | null;

        if (!response.ok || !payload || payload.ok === false) {
            if (response.status === 401) {
                clearAuthState();
                return {
                    userName,
                    friends: [],
                    groups: [],
                    unauthorized: true,
                    message: "Session expired. Please sign in again.",
                };
            }

            return {
                userName,
                friends: [],
                groups: [],
                unauthorized: false,
                message: payload?.error ?? "Failed to load social data.",
            };
        }

        const friends = (payload.friends ?? [])
            .map((item) => parseFriend(item))
            .filter((item): item is Friend => item !== null);
        const groups = (payload.groups ?? [])
            .map((item) => parseGroup(item))
            .filter((item): item is Group => item !== null);

        return {
            userName,
            friends,
            groups,
            unauthorized: false,
            message: null,
        };
    } catch {
        return {
            userName,
            friends: [],
            groups: [],
            unauthorized: false,
            message: "Failed to load social data.",
        };
    }
}

export default function SocialPage() {
    const [social] = createResource(fetchSocialPanel);

    return (
        <main class="home-page">
            <section class="social-shell">
                <p class="social-kicker">Yap</p>
                <h2>SOCIAL PANEL</h2>

                <Show when={!social.loading} fallback={<p class="social-note">Loading your social panel...</p>}>
                    <Show when={!social()?.message} fallback={<div class="social-message"><p>{social()?.message}</p></div>}>
                        <div class="social-header">
                            <div>
                                <p class="social-user">@{social()?.userName}</p>
                                <p class="social-note">Friends and groups linked to your account</p>
                            </div>
                            <div class="social-metrics">
                                <span>{social()?.friends.length ?? 0} friends</span>
                                <span>{social()?.groups.length ?? 0} groups</span>
                            </div>
                        </div>

                        <div class="social-grid">
                            <article class="social-card">
                                <h3>Friendlist</h3>
                                <Show when={(social()?.friends.length ?? 0) > 0} fallback={<p class="social-empty">No friends yet.</p>}>
                                    <ul class="social-list">
                                        <For each={social()?.friends}>
                                            {(friend) => (
                                                <li class="social-row">
                                                    <div class="social-avatar" aria-hidden="true">
                                                        {friend.username.slice(0, 1).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p class="social-name">{friend.username}</p>
                                                        <p class="social-sub">{friend.status ?? "offline"}</p>
                                                    </div>
                                                </li>
                                            )}
                                        </For>
                                    </ul>
                                </Show>
                            </article>

                            <article class="social-card">
                                <h3>Groups</h3>
                                <Show when={(social()?.groups.length ?? 0) > 0} fallback={<p class="social-empty">No groups joined yet.</p>}>
                                    <ul class="social-list">
                                        <For each={social()?.groups}>
                                            {(group) => (
                                                <li class="social-row group-row">
                                                    <div>
                                                        <p class="social-name">{group.name}</p>
                                                        <p class="social-sub">Role: {group.role}</p>
                                                    </div>
                                                    <span class="social-pill">{group.memberCount ?? 0} members</span>
                                                </li>
                                            )}
                                        </For>
                                    </ul>
                                </Show>
                            </article>
                        </div>
                    </Show>

                    <Show when={social()?.unauthorized}>
                        <A class="social-action" href="/auth">
                            Go to sign in
                        </A>
                    </Show>
                </Show>
            </section>
        </main>
    );
}