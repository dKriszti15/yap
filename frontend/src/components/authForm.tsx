import { Show, createMemo, createSignal } from "solid-js";
import "../utils/authForm.css";

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
  const v = value.trim();
  if (!v) return touched ? "Username is required" : "";
  if (v.length < 3) return "At least 3 characters";
  if (!/^[a-zA-Z0-9_]+$/.test(v)) return "Letters, numbers and _ only";
  return "";
}

function emailError(value: string, touched: boolean): string {
  const v = value.trim();
  if (!v) return touched ? "Email is required" : "";
  return (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) ? "That doesn't look like an email" : "";
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

export default function AuthForm() {
  const [tab, setTab] = createSignal<Tab>("login");
  const [values, setValues] = createSignal<Values>(defaultValues);
  const [touched, setTouched] = createSignal<Touched>(defaultTouched);
  const [showLoginPassword, setShowLoginPassword] = createSignal(false);
  const [showRegisterPassword, setShowRegisterPassword] = createSignal(false);
  const [loading, setLoading] = createSignal<Tab | null>(null);
  const [shake, setShake] = createSignal(false);
  const [success, setSuccess] = createSignal<{ title: string; subtitle: string } | null>(null);

  const errors = createMemo(() => {
    const v = values();
    const t = touched();
    return {
      lUsername: usernameError(v.lUsername, t.lUsername),
      lPassword: !v.lPassword ? (t.lPassword ? "Password is required" : "") : "",
      rUsername: usernameError(v.rUsername, t.rUsername),
      rEmail: emailError(v.rEmail, t.rEmail),
      rPassword: passwordError(v.rPassword, t.rPassword),
      rConfirm: confirmError(v.rConfirm, v.rPassword, t.rConfirm),
    };
  });

  const strength = createMemo(() => getStrength(values().rPassword));

  function setField(name: FieldName, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function blurField(name: FieldName) {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }

  function triggerShake() {
    setShake(false);
    setTimeout(() => setShake(true), 0);
    setTimeout(() => setShake(false), 450);
  }

  function submitLogin() {
    setTouched((prev) => ({ ...prev, lUsername: true, lPassword: true }));
    const e = errors();
    if (e.lUsername || e.lPassword) {
      triggerShake();
      return;
    }

    setLoading("login");
    setTimeout(() => {
      setLoading(null);
      const username = values().lUsername.trim();
      setSuccess({
        title: "Welcome back!",
        subtitle: `Good to see you again, @${username}.`,
      });
    }, 1200);
  }

  function submitRegister() {
    setTouched((prev) => ({
      ...prev,
      rUsername: true,
      rEmail: true,
      rPassword: true,
      rConfirm: true,
    }));
    const e = errors();
    if (e.rUsername || e.rEmail || e.rPassword || e.rConfirm) {
      triggerShake();
      return;
    }

    setLoading("register");
    setTimeout(() => {
      setLoading(null);
      const username = values().rUsername.trim();
      setSuccess({
        title: "You're in!",
        subtitle: `Welcome to Yap, @${username}. Time to make some noise.`,
      });
    }, 1200);
  }

  return (
    <div class="auth-page">
      <div class={`card ${shake() ? "shake" : ""}`}>
        <Show when={!success()} fallback={
          <div class="success-state show">
            <div class="success-circle"><CelebrationIcon /></div>
            <div class="success-title">{success()?.title}</div>
            <p class="success-sub">{success()?.subtitle}</p>
          </div>
        }>
          <div>
            <div class="logo">
              yap <span class="logo-dot" />
            </div>

            <div class="tabs">
              <button
                class={`tab ${tab() === "login" ? "active" : ""}`}
                type="button"
                onClick={() => setTab("login")}
              >
                Sign in
              </button>
              <button
                class={`tab ${tab() === "register" ? "active" : ""}`}
                type="button"
                onClick={() => setTab("register")}
              >
                Create account
              </button>
            </div>

            <Show when={tab() === "login"} fallback={
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
                      onInput={(e) => setField("rUsername", e.currentTarget.value)}
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
                      onInput={(e) => setField("rEmail", e.currentTarget.value)}
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
                      onInput={(e) => setField("rPassword", e.currentTarget.value)}
                      onBlur={() => blurField("rPassword")}
                    />
                    <button
                      class="pw-toggle"
                      type="button"
                      onClick={() => setShowRegisterPassword((prev) => !prev)}
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
                      onInput={(e) => setField("rConfirm", e.currentTarget.value)}
                      onBlur={() => blurField("rConfirm")}
                    />
                    <span class="input-icon ok"><CheckIcon /></span>
                    <span class="input-icon err"><ErrorIcon /></span>
                  </div>
                  <div class={`field-error ${errors().rConfirm ? "show" : ""}`}>{errors().rConfirm}</div>
                </div>

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
            }>
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
                      onInput={(e) => setField("lUsername", e.currentTarget.value)}
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
                      onInput={(e) => setField("lPassword", e.currentTarget.value)}
                      onBlur={() => blurField("lPassword")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitLogin();
                      }}
                    />
                    <button
                      class="pw-toggle"
                      type="button"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      tabindex="-1"
                      aria-label={showLoginPassword() ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword() ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  <div class={`field-error ${errors().lPassword ? "show" : ""}`}>{errors().lPassword}</div>
                </div>

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
                      onClick={(e) => {
                        e.preventDefault();
                        setTab("login");
                      }}
                    >
                      Sign in
                    </a>
                  </>
                }
              >
                <>
                  Don't have an account?{" "}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setTab("register");
                    }}
                  >
                    Join Yap
                  </a>
                </>
              </Show>
            </p>
          </div>
        </Show>
      </div>
    </div>
  );
}