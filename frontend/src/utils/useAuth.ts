import { createMemo, createSignal, onCleanup } from "solid-js";
import { loadAuthSession, onAuthStateChange } from "./session";

export function useIsAuthenticated() {
  const [authVersion, setAuthVersion] = createSignal(0);

  const unsubscribe = onAuthStateChange(() => {
    setAuthVersion((version) => version + 1);
  });

  onCleanup(unsubscribe);

  return createMemo(() => {
    authVersion();
    return Boolean(loadAuthSession());
  });
}
