import { Show, createMemo, createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import "../utils/authForm.css";

import {
  clearAuthSession,
  getAuthApiBaseUrl,
  saveAuthSession,
} from "../utils/session";

type Tab = "login" | "register";
type FieldName =
  | "lUsername"
  | "lPassword"
  | "rUsername"
  | "rEmail"
  | "rPassword"
  | "rConfirm";

type Values = Record<FieldName, string>;
type Touched = Record<FieldName, boolean>;

const defaultValues: Values = {
  lUsername: "",
  lPassword: "",
  rUsername: "",
  rEmail: "",
  rPassword: "",
  rConfirm: "",
};

const defaultTouched: Touched = {
  lUsername: false,
  lPassword: false,
  rUsername: false,
  rEmail: false,
  rPassword: false,
  rConfirm: false,
};

function usernameError(value: string, touched: boolean): string {
  const trimmed = value.trim();
  if (!trimmed) return touched ? "Username is required" : "";
  return "";
}

function emailError(value: string, touched: boolean): string {
  const trimmed = value.trim();
  if (!trimmed) return touched ? "Email is required" : "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    ? ""
    : "That doesn't look like an email";
}

function passwordError(value: string, touched: boolean): string {
  if (!value) return touched ? "Password is required" : "";
  if (value.length < 8) return "At least 8 characters";
  return "";
}

function confirmError(value: string, password: string, touched: boolean): string {
  if (!value) return touched ? "Please confirm your password" : "";
  if (value !== password) return "Passwords don't match";
  return "";
}

function getStrength(password: string) {
  if (!password) {
    return {
      score: 0,
      color: "var(--muted)",
      label: "Enter a password",
    };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  const normalized = Math.min(4, Math.ceil((score * 4) / 5));

  const colors = ["", "#e53935", "#ff9800", "#ffd600", "#00b67a"];
  const labels = ["", "Too weak", "Could be better", "Almost there", "Strong"];

  return {
    score: normalized,
    color: colors[normalized] || "var(--muted)",
    label: labels[normalized] || "Enter a password",
  };
}

function inputClass(error: string, value: string): string {
  if (!value && !error) return "";
  return error ? "invalid" : "valid";
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  );
}

function CelebrationIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}

function authErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Authentication failed";
}

async function postAuth<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${getAuthApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as {
    ok?: boolean;
    error?: string;
  } | null;

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error ?? `Request failed with status ${response.status}`);
  }

  return payload as T;
}

export default function AuthForm() {
  const navigate = useNavigate();
  const [tab, setTab] = createSignal<Tab>("login");
  const [values, setValues] = createSignal<Values>(defaultValues);
  const [touched, setTouched] = createSignal<Touched>(defaultTouched);
  const [showLoginPassword, setShowLoginPassword] = createSignal(false);
  const [showRegisterPassword, setShowRegisterPassword] = createSignal(false);
  const [loading, setLoading] = createSignal<Tab | null>(null);
  const [shake, setShake] = createSignal(false);
  const [success, setSuccess] = createSignal<{ title: string; subtitle: string } | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const errors = createMemo(() => {
    const currentValues = values();
    const currentTouched = touched();

    return {
      lUsername: usernameError(currentValues.lUsername, currentTouched.lUsername),
      lPassword: passwordError(currentValues.lPassword, currentTouched.lPassword),
      rUsername: usernameError(currentValues.rUsername, currentTouched.rUsername),
      rEmail: emailError(currentValues.rEmail, currentTouched.rEmail),
      rPassword: passwordError(currentValues.rPassword, currentTouched.rPassword),
      rConfirm: confirmError(currentValues.rConfirm, currentValues.rPassword, currentTouched.rConfirm),
    };
  });

  const strength = createMemo(() => getStrength(values().rPassword));

  function setField(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function blurField(name: FieldName) {
    setTouched((current) => ({ ...current, [name]: true }));
  }

  function triggerShake() {
    setShake(false);
    setTimeout(() => setShake(true), 0);
    setTimeout(() => setShake(false), 450);
  }

  async function submitLogin() {
    setTouched((current) => ({ ...current, lUsername: true, lPassword: true }));
    const currentErrors = errors();

    if (currentErrors.lUsername || currentErrors.lPassword) {
      triggerShake();
      return;
    }

    setLoading("login");
    setError(null);

    try {
      const result = await postAuth<{
        access_token: string;
        refresh_token?: string;
        id_token?: string;
        expires_in: number;
        refresh_expires_in?: number;
        token_type: string;
        scope?: string;
      }>("/login", {
        username: values().lUsername.trim(),
        password: values().lPassword,
      });

      saveAuthSession(result);
      setSuccess({
        title: "Welcome back!",
        subtitle: `You're signed in as @${values().lUsername.trim()}.`,
      });

      setTimeout(() => {
        navigate("/profile", { replace: true });
      }, 700);
    } catch (authError) {
      clearAuthSession();
      setError(authErrorMessage(authError));
      triggerShake();
    } finally {
      setLoading(null);
    }
  }

  async function submitRegister() {
    setTouched((current) => ({
      ...current,
      rUsername: true,
      rEmail: true,
      rPassword: true,
      rConfirm: true,
    }));

    const currentErrors = errors();
    if (currentErrors.rUsername || currentErrors.rEmail || currentErrors.rPassword || currentErrors.rConfirm) {
      triggerShake();
      return;
    }

    setLoading("register");
    setError(null);

    try {
      const result = await postAuth<{
        accountCreated: boolean;
        message?: string;
        user?: {
          username: string;
          email: string;
        };
      }>("/register", {
        username: values().rUsername.trim(),
        email: values().rEmail.trim(),
        password: values().rPassword,
      });

      const registeredUsername = result.user?.username ?? values().rUsername.trim();

      setSuccess({
        title: "Account created",
        subtitle: result.message ?? `Now sign in as @${registeredUsername}.`,
      });

      setValues((current) => ({
        ...current,
        lUsername: registeredUsername,
        lPassword: "",
        rPassword: "",
        rConfirm: "",
      }));
      setTouched((current) => ({
        ...current,
        lUsername: false,
        lPassword: false,
      }));

      setTimeout(() => {
        setSuccess(null);
        setTab("login");
      }, 1000);
    } catch (authError) {
      clearAuthSession();
      setError(authErrorMessage(authError));
      triggerShake();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div class="auth-page">
      <div class={`card ${shake() ? "shake" : ""}`}>
        <Show
          when={!success()}
          fallback={
            <div class="success-state show">
              <div class="success-circle"><CelebrationIcon /></div>
              <div class="success-title">{success()?.title}</div>
              <p class="success-sub">{success()?.subtitle}</p>
            </div>
          }
        >
          <div>
            <div class="logo">
              yap <span class="logo-dot" />
            </div>

            <div class="tabs">
              <button
                class={`tab ${tab() === "login" ? "active" : ""}`}
                type="button"
                onClick={() => {
                  setTab("login");
                  setError(null);
                }}
              >
                Sign in
              </button>
              <button
                class={`tab ${tab() === "register" ? "active" : ""}`}
                type="button"
                onClick={() => {
                  setTab("register");
                  setError(null);
                }}
              >
                Create account
              </button>
            </div>

            <Show
              when={tab() === "login"}
              fallback={
                <div>
                  <div class="field" style={{ "animation-delay": "0.05s" }}>
                    <label for="r-username">Username</label>
                    <div class="input-wrap">
                      <input
                        id="r-username"
                        type="text"
                        placeholder="pick something fun"
                        value={values().rUsername}
                        class={inputClass(errors().rUsername, values().rUsername)}
                        onInput={(event) => setField("rUsername", event.currentTarget.value)}
                        onBlur={() => blurField("rUsername")}
                      />
                      <span class="input-icon ok"><CheckIcon /></span>
                      <span class="input-icon err"><ErrorIcon /></span>
                    </div>
                    <div class={`field-error ${errors().rUsername ? "show" : ""}`}>{errors().rUsername}</div>
                  </div>

                  <div class="field" style={{ "animation-delay": "0.1s" }}>
                    <label for="r-email">Email</label>
                    <div class="input-wrap">
                      <input
                        id="r-email"
                        type="email"
                        placeholder="you@example.com"
                        value={values().rEmail}
                        class={inputClass(errors().rEmail, values().rEmail)}
                        onInput={(event) => setField("rEmail", event.currentTarget.value)}
                        onBlur={() => blurField("rEmail")}
                      />
                      <span class="input-icon ok"><CheckIcon /></span>
                      <span class="input-icon err"><ErrorIcon /></span>
                    </div>
                    <div class={`field-error ${errors().rEmail ? "show" : ""}`}>{errors().rEmail}</div>
                  </div>

                  <div class="field" style={{ "animation-delay": "0.15s" }}>
                    <label for="r-password">Password</label>
                    <div class="input-wrap">
                      <input
                        id="r-password"
                        type={showRegisterPassword() ? "text" : "password"}
                        placeholder="make it spicy"
                        value={values().rPassword}
                        class={inputClass(errors().rPassword, values().rPassword)}
                        onInput={(event) => setField("rPassword", event.currentTarget.value)}
                        onBlur={() => blurField("rPassword")}
                      />
                      <button
                        class="pw-toggle"
                        type="button"
                        onClick={() => setShowRegisterPassword((current) => !current)}
                        tabindex="-1"
                        aria-label={showRegisterPassword() ? "Hide password" : "Show password"}
                      >
                        {showRegisterPassword() ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    <div class={`field-error ${errors().rPassword ? "show" : ""}`}>{errors().rPassword}</div>

                    <div class={`strength-wrap ${values().rPassword ? "show" : ""}`}>
                      <div class="strength-bars">
                        <div class="strength-bar" style={{ background: strength().score >= 1 ? strength().color : "var(--border)" }} />
                        <div class="strength-bar" style={{ background: strength().score >= 2 ? strength().color : "var(--border)" }} />
                        <div class="strength-bar" style={{ background: strength().score >= 3 ? strength().color : "var(--border)" }} />
                        <div class="strength-bar" style={{ background: strength().score >= 4 ? strength().color : "var(--border)" }} />
                      </div>
                      <div class="strength-label" style={{ color: strength().color }}>{strength().label}</div>
                    </div>
                  </div>

                  <div class="field" style={{ "animation-delay": "0.2s" }}>
                    <label for="r-confirm">Confirm Password</label>
                    <div class="input-wrap">
                      <input
                        id="r-confirm"
                        type="password"
                        placeholder="same thing again"
                        value={values().rConfirm}
                        class={inputClass(errors().rConfirm, values().rConfirm)}
                        onInput={(event) => setField("rConfirm", event.currentTarget.value)}
                        onBlur={() => blurField("rConfirm")}
                      />
                      <span class="input-icon ok"><CheckIcon /></span>
                      <span class="input-icon err"><ErrorIcon /></span>
                    </div>
                    <div class={`field-error ${errors().rConfirm ? "show" : ""}`}>{errors().rConfirm}</div>
                  </div>

                  {error() ? <div class="field-error show">{error()}</div> : null}

                  <button
                    class={`btn ${loading() === "register" ? "loading" : ""}`}
                    type="button"
                    onClick={submitRegister}
                  >
                    <span class="btn-text">Start yapping →</span>
                    <span class="btn-spinner">
                      <span class="spinner-ring" />
                    </span>
                  </button>
                </div>
              }
            >
              <div>
                <div class="field" style={{ "animation-delay": "0.05s" }}>
                  <label for="l-username">Username</label>
                  <div class="input-wrap">
                    <input
                      id="l-username"
                      type="text"
                      placeholder="your username"
                      value={values().lUsername}
                      class={inputClass(errors().lUsername, values().lUsername)}
                      onInput={(event) => setField("lUsername", event.currentTarget.value)}
                      onBlur={() => blurField("lUsername")}
                    />
                    <span class="input-icon ok"><CheckIcon /></span>
                    <span class="input-icon err"><ErrorIcon /></span>
                  </div>
                  <div class={`field-error ${errors().lUsername ? "show" : ""}`}>{errors().lUsername}</div>
                </div>

                <div class="field" style={{ "animation-delay": "0.1s" }}>
                  <label for="l-password">Password</label>
                  <div class="input-wrap">
                    <input
                      id="l-password"
                      type={showLoginPassword() ? "text" : "password"}
                      placeholder="your password"
                      value={values().lPassword}
                      class={inputClass(errors().lPassword, values().lPassword)}
                      onInput={(event) => setField("lPassword", event.currentTarget.value)}
                      onBlur={() => blurField("lPassword")}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          void submitLogin();
                        }
                      }}
                    />
                    <button
                      class="pw-toggle"
                      type="button"
                      onClick={() => setShowLoginPassword((current) => !current)}
                      tabindex="-1"
                      aria-label={showLoginPassword() ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword() ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  <div class={`field-error ${errors().lPassword ? "show" : ""}`}>{errors().lPassword}</div>
                </div>

                {error() ? <div class="field-error show">{error()}</div> : null}

                <button
                  class={`btn ${loading() === "login" ? "loading" : ""}`}
                  type="button"
                  onClick={submitLogin}
                >
                  <span class="btn-text">Sign in →</span>
                  <span class="btn-spinner">
                    <span class="spinner-ring" />
                  </span>
                </button>
              </div>
            </Show>

            <p class="card-footer">
              <Show
                when={tab() === "login"}
                fallback={
                  <>
                    Already have an account?{" "}
                    <a
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setTab("login");
                      }}
                    >
                      Sign in
                    </a>
                  </>
                }
              >
                New here?{" "}
                <a
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    setTab("register");
                  }}
                >
                  Create account
                </a>
              </Show>
            </p>
          </div>
        </Show>
      </div>
    </div>
  );
}