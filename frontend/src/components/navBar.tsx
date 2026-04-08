import { A, useLocation } from "@solidjs/router";
import "../utils/navBar.css";

type NavItem = {
	href: string;
	label: string;
};

const navItems: NavItem[] = [
	{ href: "/", label: "Home" },
	{ href: "/auth", label: "Auth" },
];

function isActive(pathname: string, href: string) {
	if (href === "/") return pathname === "/";
	return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavBar() {
	const location = useLocation();

	return (
		<header class="app-nav-shell">
			<nav class="app-nav" aria-label="Primary">
				<A class="app-nav-brand" href="/">
					yap <span class="app-nav-dot" aria-hidden="true" />
				</A>

				<div class="app-nav-links">
					{navItems.map((item) => (
						<A
							href={item.href}
							class={`app-nav-link ${isActive(location.pathname, item.href) ? "active" : ""}`}
						>
							{item.label}
						</A>
					))}
				</div>
			</nav>
		</header>
	);
}
