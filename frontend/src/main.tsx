import { render } from "solid-js/web";
import { Route, Router } from "@solidjs/router";
import AuthPage from "./pages/authPage.jsx";
import HomePage from "./pages/homePage.jsx";

function App() {
  return (
    <Router>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
    </Router>
  );
}

render(() => <App />, document.getElementById("root")!);
