"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { API_BASE_URL, API_ENDPOINTS, apiUrl } from "@/lib/api";

function normalizeType(type) {
  return type === "achievement" ? "achievement" : "news";
}

function withMediaBase(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
}

async function fetchItemById(endpointPath, targetId, signal) {
  const expectedId = String(targetId);
  let nextUrl = apiUrl(endpointPath);
  let pageGuard = 0;

  while (nextUrl && pageGuard < 30) {
    const res = await fetch(nextUrl, { signal });
    if (!res.ok) {
      throw new Error("Failed to fetch content.");
    }

    const data = await res.json();
    const records = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
    const found = records.find((item) => String(item.id) === expectedId);
    if (found) return found;

    nextUrl = data?.next || null;
    pageGuard += 1;
  }

  return null;
}

async function fetchAllItems(endpointPath, signal) {
  let nextUrl = apiUrl(endpointPath);
  let pageGuard = 0;
  const all = [];

  while (nextUrl && pageGuard < 30) {
    const res = await fetch(nextUrl, { signal });
    if (!res.ok) {
      throw new Error("Failed to fetch related content.");
    }

    const data = await res.json();
    const records = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
    all.push(...records);
    nextUrl = data?.next || null;
    pageGuard += 1;
  }

  return all;
}

export default function ContentTemplate({ type = "news", id = "1" }) {
  const selectedType = useMemo(() => normalizeType(type), [type]);

  const [item, setItem] = useState(null);
  const [moreItems, setMoreItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    async function loadContent() {
      setLoading(true);
      setError("");
      setItem(null);
      setMoreItems([]);

      try {
        const endpoint =
          selectedType === "achievement"
            ? API_ENDPOINTS.contentAchievements
            : API_ENDPOINTS.contentNews;

        const [raw, allItems] = await Promise.all([
          fetchItemById(endpoint, id, controller.signal),
          fetchAllItems(endpoint, controller.signal),
        ]);
        if (!mounted) return;

        if (!raw) {
          setError("Requested content was not found.");
          return;
        }

        const mapped =
          selectedType === "achievement"
            ? {
                id: raw.id,
                title: raw.title || "",
                summary: raw.summary || "",
                content: raw.content || "",
                year: raw.year,
                created_at: raw.created_at,
                image_url: withMediaBase(raw.image_url),
              }
            : {
                id: raw.id,
                title: raw.title || "",
                summary: raw.summary || "",
                content: raw.content || "",
                created_at: raw.created_at,
                image_url: withMediaBase(raw.cover_image_url),
              };

        setItem(mapped);

        const mappedMore = allItems
          .filter((record) => Boolean(record.is_visible) && String(record.id) !== String(id))
          .map((record) => ({
            id: record.id,
            model: selectedType,
            category: selectedType === "achievement" ? "Achievement" : "News",
            title: record.title || "",
            summary: record.summary || "",
          }))
          .slice(0, 6);

        setMoreItems(mappedMore);
      } catch (err) {
        if (err.name !== "AbortError" && mounted) {
          setError("Unable to load content right now.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadContent();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [id, selectedType]);

  return (
    <>
      <Navbar />
      <main className="bg-steel-50">
        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            {selectedType === "achievement" ? "Achievement" : "News"}
          </p>

          {loading ? (
            <div className="mt-4 rounded-xl border border-brand-200 bg-white p-6">
              <p className="text-sm font-medium text-steel-700">Loading content...</p>
            </div>
          ) : null}

          {!loading && error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-6">
              <h1 className="text-2xl font-extrabold text-steel-900">Content Unavailable</h1>
              <p className="mt-2 text-sm text-red-700">{error}</p>
            </div>
          ) : null}

          {!loading && !error && item ? (
            <>
              <h1 className="mt-2 text-3xl font-extrabold leading-tight text-steel-900 sm:text-4xl">
                {item.title}
              </h1>
              <p className="mt-3 max-w-3xl text-base text-steel-700">{item.summary}</p>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-steel-600">
                <span className="rounded-full border border-brand-200 bg-white px-3 py-1">
                  {selectedType.toUpperCase()}
                </span>
                {item.year ? (
                  <span className="rounded-full border border-brand-200 bg-white px-3 py-1">
                    Year: {item.year}
                  </span>
                ) : null}
                {item.created_at ? (
                  <span className="rounded-full border border-brand-200 bg-white px-3 py-1">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                ) : null}
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-brand-200 bg-white">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-64 w-full object-cover sm:h-80"
                    loading="lazy"
                  />
                ) : null}
                <div className="p-6">
                  <p className="whitespace-pre-line leading-relaxed text-steel-800">{item.content}</p>
                </div>
              </div>

              {moreItems.length > 0 ? (
                <div className="mt-10">
                  <h2 className="text-2xl font-extrabold text-steel-900 sm:text-3xl">
                    Check Out More {selectedType === "achievement" ? "Achievements" : "News"}
                  </h2>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {moreItems.map((entry) => (
                      <article
                        key={`${entry.model}-${entry.id}`}
                        className="rounded-xl border border-brand-200 bg-white p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                          {entry.category}
                        </p>
                        <h3 className="news-summary-clamp mt-2 text-lg font-bold leading-tight text-steel-900">
                          {entry.title}
                        </h3>
                        <p className="news-content-clamp mt-2 text-sm leading-snug text-steel-700">
                          {entry.summary}
                        </p>
                        <a
                          href={`/content?type=${encodeURIComponent(entry.model)}&id=${encodeURIComponent(entry.id)}`}
                          className="mt-3 inline-block text-sm font-medium text-brand-700 transition hover:text-brand-900"
                        >
                          Read More -{">"}
                        </a>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      </main>
      <div className="-mt-16">
        <Footer />
      </div>
    </>
  );
}
