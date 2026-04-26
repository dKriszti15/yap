import { A, useLocation } from "@solidjs/router";
import "../utils/navBar.css";
import { useIsAuthenticated } from "../utils/useAuth";

function isActive(pathname: string, href: string) {
	if (href === "/") return pathname === "/";
	return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavBar() {
	const location = useLocation();
	const isAuthenticated = useIsAuthenticated();

	return (
		<header class="app-nav-shell">
			<nav class="app-nav" aria-label="Primary">
				<A class="app-nav-brand" href="/">
					yap <span class="app-nav-dot" aria-hidden="true" />
				</A>

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
			</nav>
		</header>
	);
}
