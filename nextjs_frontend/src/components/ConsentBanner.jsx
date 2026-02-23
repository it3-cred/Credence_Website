"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getConsentPreferences,
  hasPendingOptionalConsentChoices,
  setConsentPreferences,
  subscribeConsentPreferences,
} from "@/lib/analytics";

function normalizeDraft(prefs) {
  return {
    analytics: prefs?.analytics !== false,
    preferences: prefs?.preferences === true,
    marketing: prefs?.marketing === true,
  };
}

export default function ConsentBanner() {
  const [isMounted, setIsMounted] = useState(false);
  const [consent, setConsent] = useState(() => ({
    necessary: true,
    analytics: null,
    preferences: null,
    marketing: null,
  }));
  const [draft, setDraft] = useState(() =>
    normalizeDraft({
      necessary: true,
      analytics: null,
      preferences: null,
      marketing: null,
    })
  );

  useEffect(() => {
    setIsMounted(true);
    const initial = getConsentPreferences();
    setConsent(initial);
    setDraft(normalizeDraft(initial));
    const unsubscribe = subscribeConsentPreferences((prefs) => {
      setConsent(prefs);
      setDraft(normalizeDraft(prefs));
    });
    return unsubscribe;
  }, []);

  const shouldShow = useMemo(() => {
    if (!isMounted) return false;
    return hasPendingOptionalConsentChoices();
  }, [consent, isMounted]);

  if (!isMounted || !shouldShow) {
    return null;
  }

  const toggle = (key) => {
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-[9998] mx-auto w-auto max-w-4xl rounded-xl border border-steel-300 bg-white/95 shadow-lg backdrop-blur">
      <div className="p-4">
        <div className="mb-3">
          <p className="text-sm font-semibold text-steel-900">Privacy Preferences</p>
          <p className="mt-1 text-xs leading-5 text-steel-700">
            Necessary tracking stays enabled for site functionality. You can enable optional categories for analytics,
            preferences, and future marketing integrations.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-steel-200 bg-steel-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-steel-900">Necessary</span>
              <span className="rounded bg-steel-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-steel-700">
                Always On
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-4 text-steel-600">Auth, security, forms, and essential site operations.</p>
          </div>

          <button
            type="button"
            onClick={() => toggle("analytics")}
            className={`rounded-lg border p-3 text-left ${
              draft.analytics ? "border-brand-300 bg-brand-50" : "border-steel-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-steel-900">Analytics</span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  draft.analytics ? "bg-brand-100 text-brand-700" : "bg-steel-100 text-steel-600"
                }`}
              >
                {draft.analytics ? "On" : "Off"}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-4 text-steel-600">
              Product clicks, filters, engagement time, and document interactions.
            </p>
          </button>

          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => toggle("preferences")}
              className={`rounded-lg border p-3 text-left ${
                draft.preferences ? "border-brand-300 bg-brand-50" : "border-steel-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-steel-900">Preferences</span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    draft.preferences ? "bg-brand-100 text-brand-700" : "bg-steel-100 text-steel-600"
                  }`}
                >
                  {draft.preferences ? "On" : "Off"}
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-4 text-steel-600">Remember UI choices and future convenience settings.</p>
            </button>

            <button
              type="button"
              onClick={() => toggle("marketing")}
              className={`rounded-lg border p-3 text-left ${
                draft.marketing ? "border-brand-300 bg-brand-50" : "border-steel-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-steel-900">Marketing</span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    draft.marketing ? "bg-brand-100 text-brand-700" : "bg-steel-100 text-steel-600"
                  }`}
                >
                  {draft.marketing ? "On" : "Off"}
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-4 text-steel-600">Campaign attribution and ad/retargeting integrations (future).</p>
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setConsentPreferences({ analytics: false, preferences: false, marketing: false })}
            className="rounded-md border border-steel-300 px-3 py-2 text-xs font-semibold text-steel-800 hover:bg-steel-50"
          >
            Reject Optional
          </button>
          <button
            type="button"
            onClick={() =>
              setConsentPreferences({
                analytics: draft.analytics,
                preferences: draft.preferences,
                marketing: draft.marketing,
              })
            }
            className="rounded-md border border-brand-300 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50"
          >
            Save Preferences
          </button>
          <button
            type="button"
            onClick={() => setConsentPreferences({ analytics: true, preferences: true, marketing: true })}
            className="rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
