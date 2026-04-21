import { render } from "solid-js/web";
import { Route, Router } from "@solidjs/router";
import AuthPage from "./pages/authPage.jsx";
import HomePage from "./pages/homePage.jsx";
import NavBar from "./components/navBar.jsx";
import ProfilePage from "./pages/profilePage.jsx";
import type { AppLayoutProps } from "./types/app";

function AppLayout(props: AppLayoutProps) {
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
        <Route path="profile" component={ProfilePage} />
      </Route>
    </Router>
  );
}

render(() => <App />, document.getElementById("root")!);
