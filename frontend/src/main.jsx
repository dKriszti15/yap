import { render } from "solid-js/web";
function App() {
    return (<main style={{ padding: "2rem", "font-family": "system-ui, sans-serif" }}>
      <h1>Yap</h1>
      <p>Frontend shell is running. Next step: app layout and auth flow.</p>
    </main>);
}
render(() => <App />, document.getElementById("root"));
