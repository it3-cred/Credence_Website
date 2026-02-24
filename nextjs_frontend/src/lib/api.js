const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

function resolveRuntimeApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return DEFAULT_API_BASE_URL;
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;

export const API_ENDPOINTS = {
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
