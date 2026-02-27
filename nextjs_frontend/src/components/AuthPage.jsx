"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS, apiUrl } from "@/lib/api";

const MIN_PASSWORD_LENGTH = 10;
const WEAK_PASSWORDS = new Set([
  "password",
  "password123",
  "admin123",
  "qwerty123",
  "12345678",
  "123456789",
  "1234567890",
]);

function randomBetween(min, max, decimals = 1) {
  return (Math.random() * (max - min) + min).toFixed(decimals);
}

function getPasswordScore(value) {
  let score = 0;
  if (value.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9\s]/.test(value)) score += 1;
  return score;
}

function validateStrongPassword(password, { name = "", email = "" } = {}) {
  const value = String(password || "");
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (/\s/.test(value)) {
    return "Password cannot contain spaces.";
  }
  if (!/[a-z]/.test(value)) {
    return "Password must include at least one lowercase letter.";
  }
  if (!/[A-Z]/.test(value)) {
    return "Password must include at least one uppercase letter.";
  }
  if (!/[0-9]/.test(value)) {
    return "Password must include at least one number.";
  }
  if (!/[^A-Za-z0-9\s]/.test(value)) {
    return "Password must include at least one special character.";
  }

  const loweredPassword = value.toLowerCase();
  if (WEAK_PASSWORDS.has(loweredPassword)) {
    return "This password is too common. Please choose a stronger password.";
  }

  const emailLocal = String(email || "").split("@")[0].toLowerCase();
  if (emailLocal && emailLocal.length >= 3 && loweredPassword.includes(emailLocal)) {
    return "Password should not contain your email username.";
  }

  const compactName = String(name || "").toLowerCase().replace(/\s+/g, "");
  if (compactName && compactName.length >= 3 && loweredPassword.includes(compactName)) {
    return "Password should not contain your name.";
  }

  return "";
}

function parseBackendError(payload, fallbackMessage) {
  if (!payload || !payload.error) return fallbackMessage;
  const fieldErrors = payload.error.errors || {};
  const firstField = Object.keys(fieldErrors)[0];
  if (firstField && Array.isArray(fieldErrors[firstField]) && fieldErrors[firstField][0]) {
    return fieldErrors[firstField][0];
  }
  return payload.error.message || fallbackMessage;
}

async function apiPost(path, body, { timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(apiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok || (payload && payload.ok === false)) {
    const message = parseBackendError(payload, "Request failed. Please try again.");
    throw new Error(message);
  }

  return payload;
}

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login");
  const [loginMethod, setLoginMethod] = useState("password");
  const [signupMethod, setSignupMethod] = useState("password");

  const [telemetry, setTelemetry] = useState({
    pressure: "0.0",
    stroke: "0",
    temperature: "0",
  });

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    otp: "",
  });

  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    company_name: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });

  const [loginAlert, setLoginAlert] = useState({ type: "", message: "" });
  const [signupAlert, setSignupAlert] = useState({ type: "", message: "" });
  const [forgotAlert, setForgotAlert] = useState({ type: "", message: "" });
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  const [isSendingLoginOtp, setIsSendingLoginOtp] = useState(false);
  const [isSendingSignupOtp, setIsSendingSignupOtp] = useState(false);
  const [isSendingForgotOtp, setIsSendingForgotOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotForm, setForgotForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const tick = () => {
      setTelemetry({
        pressure: randomBetween(4.1, 8.8, 1),
        stroke: randomBetween(35, 85, 0),
        temperature: randomBetween(41, 69, 0),
      });
    };

    tick();
    const timer = window.setInterval(tick, 2400);
    return () => window.clearInterval(timer);
  }, []);

  const passwordScore = useMemo(() => getPasswordScore(signupForm.password), [signupForm.password]);
  const forgotPasswordScore = useMemo(() => getPasswordScore(forgotForm.newPassword), [forgotForm.newPassword]);

  const tabButtonClass = (tab) =>
    `relative pb-3 text-sm font-medium transition ${
      activeTab === tab ? "text-steel-900" : "text-steel-400 hover:text-steel-600"
    }`;

  const methodButtonClass = (isActive) =>
    `rounded-sm border px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] transition ${
      isActive ? "border-brand-500 bg-brand-50 text-brand-700" : "border-steel-200 text-steel-600 hover:bg-steel-50"
    }`;

  const strengthClassForScore = (score) => {
    if (score <= 2) return "bg-orange-500";
    if (score === 3) return "bg-yellow-500";
    return "bg-emerald-600";
  };

  const segmentClass = (score, index) => `h-1 flex-1 rounded-sm ${score > index ? strengthClassForScore(score) : "bg-steel-200"}`;

  const alertClass = (type) =>
    type === "success"
      ? "mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
      : "mb-4 rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700";

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginAlert({ type: "", message: "" });

    if (!loginForm.email) {
      setLoginAlert({ type: "error", message: "Email is required." });
      return;
    }
    if (loginMethod === "password" && !loginForm.password) {
      setLoginAlert({ type: "error", message: "Password is required." });
      return;
    }
    if (loginMethod === "otp" && !loginForm.otp) {
      setLoginAlert({ type: "error", message: "OTP is required." });
      return;
    }

    setIsLoginLoading(true);
    try {
      const payload =
        loginMethod === "password"
          ? { email: loginForm.email, password: loginForm.password }
          : { email: loginForm.email, otp: loginForm.otp };

      await apiPost(API_ENDPOINTS.authLogin, payload);
      setLoginAlert({ type: "success", message: "Signed in successfully." });
      window.dispatchEvent(new Event("auth-changed"));
      window.setTimeout(() => router.push("/"), 500);
    } catch (error) {
      setLoginAlert({ type: "error", message: error.message });
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();
    setSignupAlert({ type: "", message: "" });

    if (!signupForm.name || !signupForm.email || !signupForm.company_name) {
      setSignupAlert({ type: "error", message: "Name, email, and company name are required." });
      return;
    }

    if (signupMethod === "password") {
      if (!signupForm.password) {
        setSignupAlert({ type: "error", message: "Password is required." });
        return;
      }
      const passwordValidationError = validateStrongPassword(signupForm.password, {
        name: signupForm.name,
        email: signupForm.email,
      });
      if (passwordValidationError) {
        setSignupAlert({ type: "error", message: passwordValidationError });
        return;
      }
      if (signupForm.password !== signupForm.confirmPassword) {
        setSignupAlert({ type: "error", message: "Passwords do not match." });
        return;
      }
    } else if (!signupForm.otp) {
      setSignupAlert({ type: "error", message: "OTP is required." });
      return;
    }

    setIsSignupLoading(true);
    try {
      const payload =
        signupMethod === "password"
          ? {
              name: signupForm.name,
              email: signupForm.email,
              company_name: signupForm.company_name,
              password: signupForm.password,
            }
          : {
              name: signupForm.name,
              email: signupForm.email,
              company_name: signupForm.company_name,
              otp: signupForm.otp,
            };

      await apiPost(API_ENDPOINTS.authSignup, payload);
      setSignupAlert({ type: "success", message: "Account created successfully." });
      window.dispatchEvent(new Event("auth-changed"));
      window.setTimeout(() => router.push("/"), 500);
    } catch (error) {
      setSignupAlert({ type: "error", message: error.message });
    } finally {
      setIsSignupLoading(false);
    }
  };

  const handleSendOtp = async (purpose) => {
    if (purpose === "LOGIN") {
      setLoginAlert({ type: "", message: "" });
      if (!loginForm.email) {
        setLoginAlert({ type: "error", message: "Enter email before requesting OTP." });
        return;
      }
      setIsSendingLoginOtp(true);
      try {
        const result = await apiPost(API_ENDPOINTS.authOtpSend, { email: loginForm.email, purpose: "LOGIN" });
        const debugOtp = result?.data?.otp_debug ? ` (OTP: ${result.data.otp_debug})` : "";
        setLoginAlert({ type: "success", message: `OTP sent to your email.${debugOtp}` });
      } catch (error) {
        setLoginAlert({ type: "error", message: error.message });
      } finally {
        setIsSendingLoginOtp(false);
      }
      return;
    }

    setSignupAlert({ type: "", message: "" });
    if (!signupForm.email) {
      setSignupAlert({ type: "error", message: "Enter email before requesting OTP." });
      return;
    }
    setIsSendingSignupOtp(true);
    try {
      const result = await apiPost(API_ENDPOINTS.authOtpSend, { email: signupForm.email, purpose: "SIGNUP" });
      const debugOtp = result?.data?.otp_debug ? ` (OTP: ${result.data.otp_debug})` : "";
      setSignupAlert({ type: "success", message: `OTP sent to your email.${debugOtp}` });
    } catch (error) {
      setSignupAlert({ type: "error", message: error.message });
    } finally {
      setIsSendingSignupOtp(false);
    }
  };

  const handleSendForgotOtp = async () => {
    setForgotAlert({ type: "", message: "" });
    if (!forgotForm.email) {
      setForgotAlert({ type: "error", message: "Enter email before requesting OTP." });
      return;
    }

    setIsSendingForgotOtp(true);
    try {
      const result = await apiPost(API_ENDPOINTS.authPasswordForgot, { email: forgotForm.email });
      const debugOtp = result?.data?.otp_debug ? ` (OTP: ${result.data.otp_debug})` : "";
      setForgotAlert({ type: "success", message: `Password reset OTP sent.${debugOtp}` });
    } catch (error) {
      setForgotAlert({ type: "error", message: error.message });
    } finally {
      setIsSendingForgotOtp(false);
    }
  };

  const handleResetPasswordSubmit = async (event) => {
    event.preventDefault();
    setForgotAlert({ type: "", message: "" });

    if (!forgotForm.email || !forgotForm.otp || !forgotForm.newPassword) {
      setForgotAlert({ type: "error", message: "Email, OTP, and new password are required." });
      return;
    }

    const passwordValidationError = validateStrongPassword(forgotForm.newPassword, {
      email: forgotForm.email,
    });
    if (passwordValidationError) {
      setForgotAlert({ type: "error", message: passwordValidationError });
      return;
    }

    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setForgotAlert({ type: "error", message: "Passwords do not match." });
      return;
    }

    setIsResettingPassword(true);
    try {
      await apiPost(API_ENDPOINTS.authPasswordReset, {
        email: forgotForm.email,
        otp: forgotForm.otp,
        new_password: forgotForm.newPassword,
      });
      setForgotAlert({ type: "success", message: "Password updated successfully. Please sign in." });
      setLoginMethod("password");
      setLoginForm((prev) => ({ ...prev, email: forgotForm.email, password: "", otp: "" }));
      setForgotForm((prev) => ({ ...prev, otp: "", newPassword: "", confirmPassword: "" }));
      window.setTimeout(() => setShowForgotPassword(false), 900);
    } catch (error) {
      setForgotAlert({ type: "error", message: error.message });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <>
      <main className="bg-steel-50">
        <section className="mx-auto grid min-h-[calc(100vh-74px)] max-w-375 grid-cols-1 xl:grid-cols-2">
          <div className="relative hidden overflow-hidden bg-linear-to-br from-steel-900 via-steel-800 to-brand-900 px-12 py-10 xl:flex xl:flex-col xl:justify-between">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />

            <div className="relative z-10">
              <p className="font-serif text-3xl text-white">Credence</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                Automation and Control Systems Pvt Ltd
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="h-42.5 w-60">
                <svg viewBox="0 0 220 160" width="220" height="160" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="18" y="44" width="14" height="72" rx="2" fill="#2a2926" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <circle cx="25" cy="57" r="4" fill="#1a1916" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <circle cx="25" cy="103" r="4" fill="#1a1916" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <rect x="30" y="52" width="80" height="56" rx="3" fill="#232220" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
                  <rect x="36" y="60" width="12" height="40" rx="2" fill="#181716" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  <rect x="52" y="60" width="12" height="40" rx="2" fill="#181716" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  <rect x="68" y="60" width="12" height="40" rx="2" fill="#181716" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  <rect x="108" y="58" width="10" height="44" rx="2" fill="#2e2c29" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />

                  <g>
                    <rect x="116" y="73" width="60" height="14" rx="2" fill="#3a3835" stroke="rgba(255,255,255,0.14)" strokeWidth="1">
                      <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0 0;18 0;18 0;0 0"
                        keyTimes="0;0.45;0.55;1"
                        dur="2.6s"
                        repeatCount="indefinite"
                      />
                    </rect>
                    <circle cx="180" cy="80" r="9" fill="#2a2926" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5">
                      <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0 0;18 0;18 0;0 0"
                        keyTimes="0;0.45;0.55;1"
                        dur="2.6s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>

                  <circle cx="110" cy="80" r="30" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="5 4">
                    <animateTransform attributeName="transform" type="rotate" from="0 110 80" to="360 110 80" dur="7s" repeatCount="indefinite" />
                  </circle>

                  <circle cx="110" cy="80" r="18" stroke="rgba(255,255,255,0.07)" strokeWidth="1" fill="none">
                    <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2.6s" repeatCount="indefinite" />
                  </circle>

                  <circle cx="80" cy="48" r="3.5" fill="#4ade80">
                    <animate attributeName="opacity" values="1;0.15;1" dur="1.9s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="90" cy="48" r="3.5" fill="#f97316" opacity="0.65" />
                  <circle cx="100" cy="48" r="3.5" fill="rgba(255,255,255,0.12)" />

                  <rect x="30" y="112" width="80" height="2" rx="1" fill="rgba(255,255,255,0.06)" />
                  <rect x="30" y="112" height="2" rx="1" fill="rgba(255,255,255,0.32)">
                    <animate attributeName="width" values="28;60;54;28" dur="4.2s" repeatCount="indefinite" />
                  </rect>
                </svg>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 border-t border-white/10 pt-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Pressure</p>
                <p className="mt-1 font-mono text-lg text-white/85">{telemetry.pressure} bar</p>
              </div>
              <div className="border-l border-white/10 pl-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Stroke</p>
                <p className="mt-1 font-mono text-lg text-white/85">{telemetry.stroke} %</p>
              </div>
              <div className="border-l border-white/10 pl-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Temp</p>
                <p className="mt-1 font-mono text-lg text-white/85">{telemetry.temperature} C</p>
              </div>
            </div>
          </div>

          <div className="relative bg-white px-6 py-10 sm:px-10 lg:px-14">
            <div className="mx-auto mt-2 w-full max-w-135">
              <div className="mb-8 flex border-b border-steel-200">
                <button
                  type="button"
                  className={tabButtonClass("login")}
                  onClick={() => {
                    setActiveTab("login");
                    setShowForgotPassword(false);
                    setLoginAlert({ type: "", message: "" });
                    setSignupAlert({ type: "", message: "" });
                    setForgotAlert({ type: "", message: "" });
                  }}
                >
                  Sign in
                  <span
                    className={`absolute bottom-px left-0 h-0.5 w-full bg-brand-500 transition ${
                      activeTab === "login" ? "scale-x-100" : "scale-x-0"
                    } origin-left`}
                  />
                </button>
                <button
                  type="button"
                  className={`${tabButtonClass("signup")} ml-8`}
                  onClick={() => {
                    setActiveTab("signup");
                    setShowForgotPassword(false);
                    setLoginAlert({ type: "", message: "" });
                    setSignupAlert({ type: "", message: "" });
                    setForgotAlert({ type: "", message: "" });
                  }}
                >
                  Create account
                  <span
                    className={`absolute bottom-px left-0 h-0.5 w-full bg-brand-500 transition ${
                      activeTab === "signup" ? "scale-x-100" : "scale-x-0"
                    } origin-left`}
                  />
                </button>
              </div>

              {activeTab === "login" ? (
                showForgotPassword ? (
                  <form onSubmit={handleResetPasswordSubmit}>
                    <div className="mb-6">
                      <h1 className="font-serif text-5xl leading-none text-steel-900">Reset password.</h1>
                      <p className="mt-3 text-sm text-steel-600">Request OTP on email, then set a new password.</p>
                    </div>

                    {forgotAlert.message ? <div className={alertClass(forgotAlert.type)}>{forgotAlert.message}</div> : null}

                    <div className="mb-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-steel-600">Email</label>
                      <input
                        type="email"
                        className="w-full rounded-sm border border-steel-200 bg-steel-50 px-3 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                        placeholder="you@company.com"
                        value={forgotForm.email}
                        onChange={(event) => setForgotForm((prev) => ({ ...prev, email: event.target.value }))}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-steel-600">OTP</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="w-full rounded-sm border border-steel-200 bg-steel-50 px-3 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                          placeholder="6-digit OTP"
                          value={forgotForm.otp}
                          onChange={(event) => setForgotForm((prev) => ({ ...prev, otp: event.target.value }))}
                        />
                        <button
                          type="button"
                          onClick={handleSendForgotOtp}
                          disabled={isSendingForgotOtp}
                          className={`rounded-sm px-4 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-white transition ${
                            isSendingForgotOtp ? "cursor-not-allowed bg-brand-400" : "bg-brand-500 hover:bg-brand-600"
                          }`}
                        >
                          {isSendingForgotOtp ? "Sending..." : "Send OTP"}
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-steel-600">New password</label>
                      <input
                        type="password"
                        className="w-full rounded-sm border border-steel-200 bg-steel-50 px-3 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                        placeholder={`Min. ${MIN_PASSWORD_LENGTH} chars, mixed case, number, special char`}
                        value={forgotForm.newPassword}
                        onChange={(event) => setForgotForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                      />
                      <div className="mt-2 flex gap-1">
                        {[0, 1, 2, 3].map((index) => (
                          <span key={`forgot-pass-${index}`} className={segmentClass(forgotPasswordScore, index)} />
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-steel-600">Confirm new password</label>
                      <input
                        type="password"
                        className="w-full rounded-sm border border-steel-200 bg-steel-50 px-3 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                        placeholder="Repeat password"
                        value={forgotForm.confirmPassword}
                        onChange={(event) => setForgotForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isResettingPassword}
                      className={`w-full rounded-sm px-4 py-3 text-sm font-semibold text-white transition ${
                        isResettingPassword ? "cursor-not-allowed bg-brand-400" : "bg-brand-500 hover:bg-brand-600"
                      }`}
                    >
                      {isResettingPassword ? "Updating..." : "Update password"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotAlert({ type: "", message: "" });
                      }}
                      className="mt-3 w-full rounded-sm border border-steel-300 px-4 py-3 text-sm font-semibold text-steel-700 transition hover:bg-steel-50"
                    >
                      Back to sign in
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleLoginSubmit}>
                    <div className="mb-6">
                      <h1 className="font-serif text-5xl leading-none text-steel-900">Welcome back.</h1>
                      <p className="mt-3 text-sm text-steel-600">Use the login method you selected during signup.</p>
                    </div>

                    {loginAlert.message ? <div className={alertClass(loginAlert.type)}>{loginAlert.message}</div> : null}

                    <div className="mb-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-steel-600">Email</label>
                      <input
                        type="email"
                        className="w-full rounded-sm border border-steel-200 bg-steel-50 px-3 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                        placeholder="you@company.com"
                        value={loginForm.email}
                        onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                      />
                    </div>

                    <div className="mb-4 flex gap-2">
                      <button type="button" className={methodButtonClass(loginMethod === "password")} onClick={() => setLoginMethod("password")}>
                        Password
                      </button>
                      <button type="button" className={methodButtonClass(loginMethod === "otp")} onClick={() => setLoginMethod("otp")}>
                        OTP
                      </button>
                    </div>

                    {loginMethod === "password" ? (
                      <>
                        <div className="mb-2">
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-steel-600">Password</label>
                          <input
                            type="password"
                            className="w-full rounded-sm border border-steel-200 bg-steel-50 px-3 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                            placeholder="********"
                            value={loginForm.password}
                            onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                          />
                        </div>
                        <div className="mb-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setShowForgotPassword(true);
                              setForgotAlert({ type: "", message: "" });
                              setForgotForm((prev) => ({ ...prev, email: loginForm.email || prev.email }));
                            }}
                            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                          >
                            Forgot password?
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="mb-4">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-steel-600">OTP</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="w-full rounded-sm border border-steel-200 bg-steel-50 px-3 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                            placeholder="6-digit OTP"
                            value={loginForm.otp}
                            onChange={(event) => setLoginForm((prev) => ({ ...prev, otp: event.target.value }))}
                          />
                          <button
                            type="button"
                            onClick={() => handleSendOtp("LOGIN")}
                            disabled={isSendingLoginOtp}
                            className={`rounded-sm px-4 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-white transition ${
                              isSendingLoginOtp ? "cursor-not-allowed bg-brand-400" : "bg-brand-500 hover:bg-brand-600"
                            }`}
                          >
                            {isSendingLoginOtp ? "Sending..." : "Send OTP"}
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoginLoading}
                      className={`w-full rounded-sm px-4 py-3 text-sm font-semibold text-white transition ${
                        isLoginLoading ? "cursor-not-allowed bg-brand-400" : "bg-brand-500 hover:bg-brand-600"
                      }`}
                    >
                      {isLoginLoading ? "Signing in..." : "Sign in"}
                    </button>
                  </form>
                )
              ) : (
                <form onSubmit={handleSignupSubmit}>
                  <div className="mb-6">
                    <h1 className="font-serif text-5xl leading-none text-steel-900">Create an account.</h1>
                    <p className="mt-3 text-sm text-steel-600">
                      Required fields: name, email, company name. Then signup via password or OTP.
                    </p>
                  </div>

                  {signupAlert.message ? <div className={alertClass(signupAlert.type)}>{signupAlert.message}</div> : null}

                  <div className="mb-4">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-steel-600">Full name</label>
                    <input
                      type="text"
                      className="w-full rounded-sm border border-steel-200 bg-steel-50 px-3 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                      placeholder="John Doe"
                      value={signupForm.name}
                      onChange={(event) => setSignupForm((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-steel-600">Email</label>
                    <input
                      type="email"
                      className="w-full rounded-sm border border-steel-200 bg-steel-50 px-3 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                      placeholder="you@company.com"
                      value={signupForm.email}
                      onChange={(event) => setSignupForm((prev) => ({ ...prev, email: event.target.value }))}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-steel-600">Company name</label>
                    <input
                      type="text"
                      className="w-full rounded-sm border border-steel-200 bg-steel-50 px-3 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                      placeholder="Your company"
                      value={signupForm.company_name}
                      onChange={(event) => setSignupForm((prev) => ({ ...prev, company_name: event.target.value }))}
                    />
                  </div>

                  <div className="mb-4 flex gap-2">
                    <button type="button" className={methodButtonClass(signupMethod === "password")} onClick={() => setSignupMethod("password")}>
                      Password
                    </button>
                    <button type="button" className={methodButtonClass(signupMethod === "otp")} onClick={() => setSignupMethod("otp")}>
                      OTP
                    </button>
                  </div>

                  {signupMethod === "password" ? (
                    <>
                      <div className="mb-4">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-steel-600">Password</label>
                        <input
                          type="password"
                          className="w-full rounded-sm border border-steel-200 bg-steel-50 px-3 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                          placeholder={`Min. ${MIN_PASSWORD_LENGTH} chars, mixed case, number, special char`}
                          value={signupForm.password}
                          onChange={(event) => setSignupForm((prev) => ({ ...prev, password: event.target.value }))}
                        />
                        <div className="mt-2 flex gap-1">
                          {[0, 1, 2, 3].map((index) => (
                            <span key={index} className={segmentClass(passwordScore, index)} />
                          ))}
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-steel-600">
                          Use at least {MIN_PASSWORD_LENGTH} characters with uppercase, lowercase, number and special
                          character. Avoid name/email in password.
                        </p>
                      </div>

                      <div className="mb-4">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-steel-600">Confirm password</label>
                        <input
                          type="password"
                          className="w-full rounded-sm border border-steel-200 bg-steel-50 px-3 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                          placeholder="Repeat password"
                          value={signupForm.confirmPassword}
                          onChange={(event) => setSignupForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="mb-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-steel-600">OTP</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="w-full rounded-sm border border-steel-200 bg-steel-50 px-3 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                          placeholder="6-digit OTP"
                          value={signupForm.otp}
                          onChange={(event) => setSignupForm((prev) => ({ ...prev, otp: event.target.value }))}
                        />
                        <button
                          type="button"
                          onClick={() => handleSendOtp("SIGNUP")}
                          disabled={isSendingSignupOtp}
                          className={`rounded-sm px-4 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-white transition ${
                            isSendingSignupOtp ? "cursor-not-allowed bg-brand-400" : "bg-brand-500 hover:bg-brand-600"
                          }`}
                        >
                          {isSendingSignupOtp ? "Sending..." : "Send OTP"}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSignupLoading}
                    className={`w-full rounded-sm px-4 py-3 text-sm font-semibold text-white transition ${
                      isSignupLoading ? "cursor-not-allowed bg-brand-400" : "bg-brand-500 hover:bg-brand-600"
                    }`}
                  >
                    {isSignupLoading ? "Creating account..." : "Create account"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
