import { A } from "@solidjs/router";
import "../utils/homePage.css";

export default function HomePage() {
  return (
    <main class="home-page">
      <section class="home-card">
        <p class="home-kicker">Yap</p>
        <h2>HOME PAGE</h2>
        <A class="home-button" href="/auth">
          Go to auth page
        </A>
      </section>
    </main>
  );
}
