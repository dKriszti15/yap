import { render } from "solid-js/web";
import { Route, Router } from "@solidjs/router";
import "./utils/theme.css";
import AuthPage from "./pages/authPage";
import HomePage from "./pages/homePage";
import NavBar from "./components/navBar";
import ProfilePage from "./pages/profilePage";
import type { AppLayoutProps } from "./types/app";
import SocialPage from "./pages/socialPage";
import { applyTheme, loadTheme } from "./utils/theme";
import { usePresenceHeartbeat } from "./utils/usePresenceHeartbeat";

applyTheme(loadTheme());

function AppLayout(props: AppLayoutProps) {
  usePresenceHeartbeat();

  return (
    <>
      <NavBar />
      {props.children}
    </>
  );
}

function App() {
  return (
    <Router>
      <Route path="/" component={AppLayout}>
        <Route path="" component={HomePage} />
        <Route path="auth" component={AuthPage} />
        <Route path="social" component={SocialPage} />
        <Route path="profile" component={ProfilePage} />
      </Route>
    </Router>
  );
}

render(() => <App />, document.getElementById("root")!);
