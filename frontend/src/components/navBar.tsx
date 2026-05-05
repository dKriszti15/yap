import { A, useLocation } from "@solidjs/router";
import { createEffect, createSignal } from "solid-js";
import "../utils/navBar.css";
import { useIsAuthenticated } from "../utils/useAuth";
import { applyTheme, loadTheme, saveTheme, toggleTheme, type ThemeName } from "../utils/theme";

function isActive(pathname: string, href: string) {
	if (href === "/") return pathname === "/";
	return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavBar() {
	const location = useLocation();
	const isAuthenticated = useIsAuthenticated();
	const [theme, setTheme] = createSignal<ThemeName>(loadTheme());

	createEffect(() => {
		const currentTheme = theme();
		applyTheme(currentTheme);
		saveTheme(currentTheme);
	});

	const cycleTheme = () => {
		setTheme((currentTheme) => toggleTheme(currentTheme));
	};

	return (
		<header class="app-nav-shell">
			<nav class="app-nav" aria-label="Primary">
				<A class="app-nav-brand" href="/">
					yap <span class="app-nav-dot" aria-hidden="true" />
				</A>

				<div class="app-nav-actions">
					<div class="app-nav-links">
					<A
						href="/"
						end
						class={`app-nav-link ${isActive(location.pathname, "/") ? "active" : ""}`}
					>
						Home
					</A>
					{!isAuthenticated() && (
						<A
							href="/auth"
							class={`app-nav-link ${isActive(location.pathname, "/auth") ? "active" : ""}`}
						>
							Auth
						</A>
					)}

					{
						isAuthenticated() && (
							<A
								href="/social"
								class={`app-nav-link ${isActive(location.pathname, "/social") ? "active" : ""}`}
							>
								Social
							</A>
						)
					}

					<A
						href="/profile"
						class={`app-nav-link ${isActive(location.pathname, "/profile") ? "active" : ""}`}
					>
						Profile
					</A>
					</div>

					<button
						type="button"
						class="app-theme-toggle"
						onClick={cycleTheme}
						aria-label={`Switch to ${theme() === "dark" ? "light" : "dark"} theme`}
					>
						<span class="app-theme-toggle-state" aria-hidden="true">
							{theme() === "dark" ? "☀" : "☾"}
						</span>
					</button>
				</div>
			</nav>
		</header>
	);
}
