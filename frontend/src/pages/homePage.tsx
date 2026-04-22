import { A } from "@solidjs/router";
import "../utils/homePage.css";
import { useIsAuthenticated } from "../utils/useAuth";

export default function HomePage() {

  const isAuthenticated = useIsAuthenticated();

  return (
    <main class="home-page">
      <section class="home-card">
        <p class="home-kicker">Yap</p>
        <h2>HOME PAGE</h2>
        {
          !isAuthenticated && (
            <A class="home-button" href="/auth">
              Login
            </A>
          )
        }
      </section>
    </main>
  );
}
