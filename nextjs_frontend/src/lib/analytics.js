"use client";

import { API_ENDPOINTS, apiUrl } from "@/lib/api";

const ANON_ID_KEY = "cred_anon_id";
const SESSION_ID_KEY = "cred_session_id";
const CONSENT_PREFERENCES_KEY = "cred_consent_preferences";
const ANALYTICS_CONSENT_KEY = "cred_analytics_consent";
const MAX_BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 5000;

let eventQueue = [];
let flushTimer = null;
let isInitialized = false;
let isFlushing = false;
let lastInternalPath = "";
let debugSequence = 0;
let debugLogs = [];
let debugStats = {
  queued: 0,
  sentBatches: 0,
  sentEvents: 0,
  failedFlushes: 0,
};
const debugSubscribers = new Set();
const consentSubscribers = new Set();
const MAX_DEBUG_LOGS = 80;
const CONSENT_CATEGORIES = ["necessary", "analytics", "preferences", "marketing"];
const DEFAULT_CONSENT_PREFERENCES = {
  necessary: true,
  analytics: null,
  preferences: null,
  marketing: null,
};

function hasWindow() {
  return typeof window !== "undefined";
}

function normalizeConsentPreferences(input = {}) {
  return {
    necessary: true,
    analytics: typeof input.analytics === "boolean" ? input.analytics : null,
    preferences: typeof input.preferences === "boolean" ? input.preferences : null,
    marketing: typeof input.marketing === "boolean" ? input.marketing : null,
  };
}

function readConsentPreferences() {
  if (!hasWindow()) return DEFAULT_CONSENT_PREFERENCES;

  const raw = window.localStorage.getItem(CONSENT_PREFERENCES_KEY);
  if (raw) {
    try {
      return normalizeConsentPreferences(JSON.parse(raw));
    } catch {
      // Fall through to legacy key migration.
    }
  }

  const legacyAnalytics = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
  if (legacyAnalytics === "granted" || legacyAnalytics === "denied") {
    return normalizeConsentPreferences({
      analytics: legacyAnalytics === "granted",
    });
  }

  return DEFAULT_CONSENT_PREFERENCES;
}

function writeConsentPreferences(preferences) {
  if (!hasWindow()) return;
  const normalized = normalizeConsentPreferences(preferences);
  window.localStorage.setItem(CONSENT_PREFERENCES_KEY, JSON.stringify(normalized));
  window.localStorage.setItem(ANALYTICS_CONSENT_KEY, normalized.analytics ? "granted" : "denied");
}

function randomId(prefix) {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}

export function getAnonId() {
  if (!hasWindow()) return "";
  let value = window.localStorage.getItem(ANON_ID_KEY);
  if (!value) {
    value = randomId("anon");
    window.localStorage.setItem(ANON_ID_KEY, value);
  }
  return value;
}

export function getSessionId() {
  if (!hasWindow()) return "";
  let value = window.sessionStorage.getItem(SESSION_ID_KEY);
  if (!value) {
    value = randomId("sess");
    window.sessionStorage.setItem(SESSION_ID_KEY, value);
  }
  return value;
}

function getCurrentPath() {
  if (!hasWindow()) return "";
  return `${window.location.pathname}${window.location.search}`;
}

function getReferrerPath() {
  if (!hasWindow()) return null;
  if (lastInternalPath) return lastInternalPath;
  const ref = document.referrer || "";
  if (!ref) return null;
  try {
    const refUrl = new URL(ref);
    if (refUrl.origin === window.location.origin) {
      return `${refUrl.pathname}${refUrl.search}`;
    }
    return ref;
  } catch {
    return ref;
  }
}

function setLastInternalPath(path) {
  lastInternalPath = path || "";
}

function notifyConsentSubscribers() {
  if (!consentSubscribers.size) return;
  const value = getConsentPreferences();
  consentSubscribers.forEach((listener) => {
    try {
      listener(value);
    } catch {
      // Ignore subscriber errors.
    }
  });
}

function notifyDebugSubscribers() {
  if (!debugSubscribers.size) return;
  const snapshot = getAnalyticsDebugSnapshot();
  debugSubscribers.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
      // Ignore debug subscriber errors.
    }
  });
}

function addDebugLog(type, message, details = null) {
  debugSequence += 1;
  debugLogs.unshift({
    id: debugSequence,
    time: new Date().toISOString(),
    type,
    message,
    details,
  });
  if (debugLogs.length > MAX_DEBUG_LOGS) {
    debugLogs = debugLogs.slice(0, MAX_DEBUG_LOGS);
  }
  notifyDebugSubscribers();
}

function eventPreview(event) {
  return {
    event_name: event.event_name,
    page_path: event.page_path,
    properties: event.properties,
    event_time: event.event_time,
  };
}

async function flushEvents() {
  if (!hasWindow() || isFlushing || eventQueue.length === 0) return;
  if (!hasAnalyticsConsent()) return;
  isFlushing = true;
  const batch = eventQueue.slice(0, MAX_BATCH_SIZE);
  addDebugLog("flush", `Flushing ${batch.length} event(s)`, {
    batch: batch.map(eventPreview),
  });
  try {
    const response = await fetch(apiUrl(API_ENDPOINTS.analyticsEvents), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });
    if (!response.ok) {
      throw new Error(`Analytics ingest failed (${response.status})`);
    }
    eventQueue = eventQueue.slice(batch.length);
    debugStats.sentBatches += 1;
    debugStats.sentEvents += batch.length;
    addDebugLog("success", `Sent ${batch.length} event(s)`, {
      status: response.status,
      remainingQueue: eventQueue.length,
    });
  } catch {
    debugStats.failedFlushes += 1;
    addDebugLog("error", `Failed to send ${batch.length} event(s)`, {
      remainingQueue: eventQueue.length,
    });
    // Keep events in memory and retry on next flush.
  } finally {
    isFlushing = false;
    notifyDebugSubscribers();
  }
}

function scheduleFlush() {
  if (!hasWindow() || flushTimer) return;
  flushTimer = window.setInterval(() => {
    flushEvents();
  }, FLUSH_INTERVAL_MS);
}

function initializeAnalytics() {
  if (!hasWindow() || isInitialized) return;
  isInitialized = true;
  scheduleFlush();
  setLastInternalPath(getCurrentPath());

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushEvents();
      setLastInternalPath(getCurrentPath());
    }
  });

  window.addEventListener("pagehide", () => {
    flushEvents();
    setLastInternalPath(getCurrentPath());
  });
}

export function trackEvent(eventName, properties = {}, options = {}) {
  if (!hasWindow()) return;
  const category = options.category || "analytics";
  if (!hasConsent(category)) {
    addDebugLog("skip", `Skipped ${eventName} (no ${category} consent)`);
    return;
  }
  initializeAnalytics();

  const pagePath = getCurrentPath();
  const payload = {
    event_name: eventName,
    event_time: new Date().toISOString(),
    session_id: getSessionId(),
    anon_id: getAnonId(),
    page_path: pagePath,
    page_title: document.title || "",
    referrer: getReferrerPath(),
    properties,
  };

  eventQueue.push(payload);
  debugStats.queued += 1;
  addDebugLog("track", `Queued ${eventName}`, {
    category,
    ...eventPreview(payload),
  });
  if (eventQueue.length >= MAX_BATCH_SIZE) {
    flushEvents();
  }
  setLastInternalPath(pagePath);
}

export function flushAnalyticsEvents() {
  return flushEvents();
}

export function getAnalyticsDebugSnapshot() {
  return {
    queueSize: eventQueue.length,
    isFlushing,
    stats: { ...debugStats },
    queuePreview: eventQueue.slice(0, 10).map(eventPreview),
    recentLogs: [...debugLogs],
  };
}

export function subscribeAnalyticsDebug(listener) {
  if (typeof listener !== "function") return () => {};
  debugSubscribers.add(listener);
  listener(getAnalyticsDebugSnapshot());
  return () => {
    debugSubscribers.delete(listener);
  };
}

export function clearAnalyticsDebugLogs() {
  debugLogs = [];
  notifyDebugSubscribers();
}

export function getConsentPreferences() {
  return readConsentPreferences();
}

export function hasConsent(category) {
  if (category === "necessary") return true;
  const prefs = getConsentPreferences();
  return Boolean(prefs?.[category] === true);
}

export function getAnalyticsConsent() {
  const prefs = getConsentPreferences();
  if (prefs.analytics === true) return "granted";
  if (prefs.analytics === false) return "denied";
  return "unknown";
}

export function hasAnalyticsConsent() {
  return hasConsent("analytics");
}

export function hasPendingOptionalConsentChoices() {
  const prefs = getConsentPreferences();
  return ["analytics", "preferences", "marketing"].some((key) => prefs[key] === null);
}

export function setConsentPreferences(nextPreferences) {
  if (!hasWindow()) return;
  const current = getConsentPreferences();
  const merged = normalizeConsentPreferences({
    ...current,
    ...nextPreferences,
  });
  writeConsentPreferences(merged);

  if (!merged.analytics) {
    eventQueue = [];
    notifyDebugSubscribers();
  } else {
    initializeAnalytics();
  }

  addDebugLog("consent", "Consent preferences updated", merged);
  notifyConsentSubscribers();
}

export function setAnalyticsConsent(value) {
  setConsentPreferences({
    analytics: value === "granted",
  });
}

export function subscribeAnalyticsConsent(listener) {
  if (typeof listener !== "function") return () => {};
  const wrapped = (prefs) => listener(prefs.analytics === true ? "granted" : prefs.analytics === false ? "denied" : "unknown");
  consentSubscribers.add(wrapped);
  wrapped(getConsentPreferences());
  return () => {
    consentSubscribers.delete(wrapped);
  };
}

export function subscribeConsentPreferences(listener) {
  if (typeof listener !== "function") return () => {};
  consentSubscribers.add(listener);
  listener(getConsentPreferences());
  return () => {
    consentSubscribers.delete(listener);
  };
}

export function getConsentCategories() {
  return [...CONSENT_CATEGORIES];
}
