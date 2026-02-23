"use client";

import { useEffect, useMemo, useState } from "react";
import {
  clearAnalyticsDebugLogs,
  flushAnalyticsEvents,
  getAnalyticsDebugSnapshot,
  subscribeAnalyticsDebug,
} from "@/lib/analytics";

function formatTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString();
  } catch {
    return iso;
  }
}

export default function AnalyticsDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [snapshot, setSnapshot] = useState(() => getAnalyticsDebugSnapshot());

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return undefined;
    return subscribeAnalyticsDebug(setSnapshot);
  }, []);

  const visibleLogs = useMemo(() => snapshot.recentLogs.slice(0, 12), [snapshot.recentLogs]);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[min(92vw,24rem)]">
      <div className="overflow-hidden rounded-xl border border-steel-300 bg-white/95 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-steel-900"
        >
          <span>Analytics Debug</span>
          <span className="text-[11px] text-steel-600">
            q:{snapshot.queueSize} sent:{snapshot.stats.sentEvents}
            {snapshot.isFlushing ? " • flushing" : ""}
          </span>
        </button>

        {isOpen ? (
          <div className="border-t border-steel-200 p-3">
            <div className="mb-3 grid grid-cols-2 gap-2 text-[11px] text-steel-700">
              <div className="rounded-md bg-steel-50 px-2 py-1">Queued total: {snapshot.stats.queued}</div>
              <div className="rounded-md bg-steel-50 px-2 py-1">Sent batches: {snapshot.stats.sentBatches}</div>
              <div className="rounded-md bg-steel-50 px-2 py-1">Sent events: {snapshot.stats.sentEvents}</div>
              <div className="rounded-md bg-steel-50 px-2 py-1">Failed flushes: {snapshot.stats.failedFlushes}</div>
            </div>

            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => flushAnalyticsEvents()}
                className="rounded-md border border-steel-300 px-2 py-1 text-xs font-medium text-steel-800 hover:bg-steel-50"
              >
                Flush Now
              </button>
              <button
                type="button"
                onClick={clearAnalyticsDebugLogs}
                className="rounded-md border border-steel-300 px-2 py-1 text-xs font-medium text-steel-800 hover:bg-steel-50"
              >
                Clear Logs
              </button>
            </div>

            {snapshot.queuePreview.length ? (
              <div className="mb-3 rounded-md border border-steel-200 bg-steel-50 p-2">
                <div className="mb-1 text-[11px] font-semibold text-steel-700">Queue Preview</div>
                <div className="space-y-1 text-[11px] text-steel-700">
                  {snapshot.queuePreview.map((item, index) => (
                    <div key={`${item.event_time}-${item.event_name}-${index}`} className="truncate">
                      {item.event_name} • {item.page_path}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {visibleLogs.length ? (
                visibleLogs.map((log) => (
                  <div key={log.id} className="rounded-md border border-steel-200 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-steel-600">
                        {log.type}
                      </span>
                      <span className="text-[10px] text-steel-500">{formatTime(log.time)}</span>
                    </div>
                    <div className="mt-1 text-xs text-steel-900">{log.message}</div>
                    {log.details ? (
                      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-[10px] text-steel-600">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="text-xs text-steel-500">No analytics logs yet.</div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
