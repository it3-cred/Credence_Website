const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;

export const API_ENDPOINTS = {
  contentNews: "/api/content/news",
  contentAchievements: "/api/content/achievements",
  powerSources: "/api/power-sources",
  products: "/api/products",
};

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}
