const DEFAULT_API_BASE_URL = "http://localhost:8000";
const DEFAULT_API_PORT = process.env.NEXT_PUBLIC_API_PORT || "8000";

function normalizeBaseUrl(url) {
  return String(url || "").replace(/\/+$/, "");
}

function resolveRuntimeApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${DEFAULT_API_PORT}`;
  }
  return DEFAULT_API_BASE_URL;
}

export const API_BASE_URL = resolveRuntimeApiBaseUrl();

export const API_ENDPOINTS = {
  authMe: "/api/auth/me",
  authLogout: "/api/auth/logout",
  authOtpSend: "/api/auth/otp/send",
  authSignup: "/api/auth/signup",
  authLogin: "/api/auth/login",
  authPasswordForgot: "/api/auth/password/forgot",
  authPasswordReset: "/api/auth/password/reset",
  search: "/api/search",
  contentAnnouncementRibbon: "/api/content/announcement-ribbon",
  contentNews: "/api/content/news",
  contentAchievements: "/api/content/achievements",
  powerSources: "/api/power-sources",
  industries: "/api/industries",
  products: "/api/products",
  catalogueEmailRequest: "/api/leads/catalogue-email-request",
  requestQuote: "/api/leads/request-quote",
  analyticsEvents: "/api/analytics/events",
};

export function apiUrl(path) {
  return `${resolveRuntimeApiBaseUrl()}${path}`;
}

export function productDetailPath(slug, id) {
  const safeSlug = encodeURIComponent(slug || "product");
  return `/api/products/${safeSlug}-${encodeURIComponent(id)}`;
}
