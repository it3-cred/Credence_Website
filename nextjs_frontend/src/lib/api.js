const FALLBACK_API_PORT = "8000";

function inferApiBaseUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${FALLBACK_API_PORT}`;
  }
  return `http://127.0.0.1:${FALLBACK_API_PORT}`;
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || inferApiBaseUrl();

export const API_ENDPOINTS = {
  contentNews: "/api/content/news",
  contentAchievements: "/api/content/achievements",
  powerSources: "/api/power-sources",
  industries: "/api/industries",
  products: "/api/products",
  catalogueEmailRequest: "/api/leads/catalogue-email-request",
  requestQuote: "/api/leads/request-quote",
};

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export function productDetailPath(slug, id) {
  const safeSlug = encodeURIComponent(slug || "product");
  return `/api/products/${safeSlug}-${encodeURIComponent(id)}`;
}
