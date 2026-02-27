"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { API_ENDPOINTS, apiUrl } from "@/lib/api";

function withMediaBase(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return url.startsWith("/") ? apiUrl(url) : apiUrl(`/${url}`);
}

function normalizeImageList(raw) {
  const imageUrls = Array.isArray(raw?.image_urls)
    ? raw.image_urls.map(withMediaBase).filter(Boolean)
    : [];

  if (imageUrls.length > 0) return imageUrls;

  const cover = withMediaBase(raw?.cover_image_url);
  return cover ? [cover] : [];
}

export default function NewsCatalog() {
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function loadCatalogue() {
      setLoading(true);
      setError("");

      try {
        const [newsResponse, achievementsResponse] = await Promise.all([
          fetch(apiUrl(API_ENDPOINTS.contentNews), { signal: controller.signal }),
          fetch(apiUrl(API_ENDPOINTS.contentAchievements), { signal: controller.signal }),
        ]);

        if (!newsResponse.ok || !achievementsResponse.ok) {
          throw new Error("Failed to fetch catalogue.");
        }

        const [newsData, achievementsData] = await Promise.all([
          newsResponse.json(),
          achievementsResponse.json(),
        ]);

        const newsRows = Array.isArray(newsData?.results) ? newsData.results : [];
        const achievementRows = Array.isArray(achievementsData?.results)
          ? achievementsData.results
          : [];

        if (!mounted) return;

        const mappedNews = newsRows
          .filter((item) => Boolean(item.is_visible))
          .map((item) => ({
            id: item.id,
            model: "news",
            category: "News",
            title: item.title || "",
            summary: item.summary || "",
            createdAt: item.created_at,
            imageUrls: normalizeImageList(item),
          }));

        const mappedAchievements = achievementRows
          .filter((item) => Boolean(item.is_visible))
          .map((item) => ({
            id: item.id,
            model: "achievement",
            category: "Achievement",
            title: item.title || "",
            summary: item.summary || "",
            createdAt: item.created_at,
            imageUrls: Array.isArray(item?.image_urls)
              ? item.image_urls.map(withMediaBase).filter(Boolean)
              : item?.image_url
                ? [withMediaBase(item.image_url)]
                : [],
          }));

        const merged = [...mappedNews, ...mappedAchievements].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setCatalogItems(merged);
      } catch (err) {
        if (err.name !== "AbortError" && mounted) {
          setError("Unable to load catalogue right now.");
          setCatalogItems([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCatalogue();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const hasItems = useMemo(() => catalogItems.length > 0, [catalogItems.length]);
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let items = [...catalogItems];

    if (activeType !== "all") {
      items = items.filter((item) => item.model === activeType);
    }

    if (query) {
      items = items.filter((item) => {
        const title = (item.title || "").toLowerCase();
        const summary = (item.summary || "").toLowerCase();
        const category = (item.category || "").toLowerCase();
        return title.includes(query) || summary.includes(query) || category.includes(query);
      });
    }

    if (sortBy === "oldest") {
      items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return items;
  }, [catalogItems, activeType, searchQuery, sortBy]);

  const categoryCounts = useMemo(() => {
    const counts = { all: catalogItems.length, news: 0, achievement: 0 };
    catalogItems.forEach((item) => {
      if (item.model === "news") counts.news += 1;
      if (item.model === "achievement") counts.achievement += 1;
    });
    return counts;
  }, [catalogItems]);

  return (
    <>
      <main className="bg-steel-50">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="border-b border-steel-200 pb-4 sm:pb-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
                  Catalogue
                </p>
                <h1 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight text-steel-900 sm:text-4xl">
                  News & Achievements
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel-600">
                  Browse latest company updates, achievements, and announcements in one place.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex h-10 items-center rounded-md border border-steel-300 bg-white px-4 text-xs font-semibold uppercase tracking-[0.12em] text-steel-700 transition hover:border-steel-400 hover:bg-steel-50"
              >
                Back To Home
              </Link>
            </div>

            <div className="mt-4 grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "all", label: "All", count: categoryCounts.all },
                  { key: "news", label: "News", count: categoryCounts.news },
                  { key: "achievement", label: "Achievements", count: categoryCounts.achievement },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveType(tab.key)}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                      activeType === tab.key
                        ? "border-brand-300 bg-brand-50 text-brand-700"
                        : "border-steel-300 bg-white text-steel-600 hover:border-steel-400 hover:bg-steel-50 hover:text-steel-800"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-sm px-1.5 py-0.5 text-[10px] leading-none ${
                        activeType === tab.key
                          ? "bg-white text-brand-700"
                          : "bg-steel-50 text-steel-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex h-10 items-center gap-2 rounded-md border border-steel-300 bg-white px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition focus-within:border-brand-400">
                  <svg
                    className="h-4 w-4 text-steel-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search updates"
                    className="w-full min-w-44 bg-transparent text-sm text-steel-800 outline-none placeholder:text-steel-400"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="h-10 rounded-md border border-steel-300 bg-white px-3 text-sm font-medium text-steel-700 outline-none transition hover:border-steel-400 focus:border-brand-400"
                >
                  <option value="latest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {(activeType !== "all" || searchQuery.trim()) && !loading ? (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setActiveType("all");
                  setSearchQuery("");
                }}
                className="rounded-full border border-steel-200 bg-white px-3 py-1 text-xs font-medium text-steel-600 transition hover:border-brand-200 hover:text-brand-700"
              >
                Reset Filters
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`catalog-skeleton-${index}`} className="overflow-hidden rounded-2xl border border-steel-200 bg-white">
                  <div className="products-skeleton-shimmer h-52 w-full bg-steel-100 sm:h-56" />
                  <div className="space-y-2 p-5">
                    <div className="products-skeleton-shimmer h-3 w-24 rounded bg-steel-100" />
                    <div className="products-skeleton-shimmer h-5 w-5/6 rounded bg-steel-100" />
                    <div className="products-skeleton-shimmer h-4 w-full rounded bg-steel-100" />
                    <div className="products-skeleton-shimmer h-4 w-4/5 rounded bg-steel-100" />
                    <div className="products-skeleton-shimmer mt-3 h-8 w-full rounded bg-steel-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!loading && error ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          {!loading && !error && !hasItems ? (
            <div className="mt-5 rounded-xl border border-brand-200 bg-white p-4 text-sm font-medium text-steel-700">
              No visible news or achievements found.
            </div>
          ) : null}

          {!loading && !error && hasItems && filteredItems.length === 0 ? (
            <div className="mt-5 rounded-xl border border-steel-200 bg-white p-4 text-sm font-medium text-steel-700">
              No catalogue items match the current search or category filter.
            </div>
          ) : null}

          {!loading && !error && filteredItems.length > 0 ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => {
                const coverImage = item.imageUrls[0] || "";
                return (
                  <article
                    key={`${item.model}-${item.id}`}
                    className="news-catalog-card group overflow-hidden rounded-2xl border border-steel-200 bg-white"
                  >
                    <div className="relative h-52 w-full overflow-hidden bg-steel-100 sm:h-56">
                      {coverImage ? (
                        <Image
                          src={coverImage}
                          alt={item.title}
                          fill
                          unoptimized
                          sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="news-catalog-card-image h-full w-full object-cover"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-linear-to-t from-steel-950/35 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                    </div>

                    <div className="flex min-h-60 flex-col p-5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                          {item.category}
                        </p>
                        <span className="text-[11px] text-steel-500">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <h2 className="catalog-title-clamp mt-2 text-xl font-bold leading-tight tracking-tight text-steel-900">
                        {item.title}
                      </h2>
                      <p className="catalog-summary-clamp mt-2 text-sm leading-relaxed text-steel-600">
                        {item.summary}
                      </p>

                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-steel-100 pt-4">
                        <Link
                          href={`/content?type=${encodeURIComponent(item.model)}&id=${encodeURIComponent(item.id)}`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition hover:text-brand-900"
                        >
                          <span>Read More</span>
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <path d="M5 12h14" />
                            <path d="m13 5 7 7-7 7" />
                          </svg>
                        </Link>
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-steel-200 text-steel-500 transition group-hover:border-brand-200 group-hover:text-brand-600">
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <path d="M5 12h14" />
                            <path d="m13 5 7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      </main>
    </>
  );
}
