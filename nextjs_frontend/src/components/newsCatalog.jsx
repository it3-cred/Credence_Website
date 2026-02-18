"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { API_BASE_URL, API_ENDPOINTS, apiUrl } from "@/lib/api";

function withMediaBase(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
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

  return (
    <>
      <Navbar />
      <main className="bg-steel-50">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
                Catalogue
              </p>
              <h1 className="mt-1 text-3xl font-extrabold leading-tight text-steel-900 sm:text-4xl">
                News & Achievements
              </h1>
            </div>
            <Link
              href="/"
              className="rounded-md border border-brand-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-700 transition hover:bg-brand-500 hover:text-white"
            >
              Back To Home
            </Link>
          </div>

          {loading ? (
            <div className="mt-5 rounded-xl border border-brand-200 bg-white p-4 text-sm font-medium text-steel-700">
              Loading catalogue...
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

          {!loading && !error && hasItems ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {catalogItems.map((item) => {
                const coverImage = item.imageUrls[0] || "";
                return (
                  <article
                    key={`${item.model}-${item.id}`}
                    className="overflow-hidden rounded-2xl border border-brand-200 bg-white"
                  >
                    <div className="relative h-52 w-full bg-steel-100 sm:h-56">
                      {coverImage ? (
                        <Image
                          src={coverImage}
                          alt={item.title}
                          fill
                          unoptimized
                          sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                        {item.category}
                      </p>
                      <h2 className="catalog-title-clamp mt-2 text-xl font-bold leading-tight text-steel-900">
                        {item.title}
                      </h2>
                      <p className="catalog-summary-clamp mt-2 text-sm leading-snug text-steel-700">
                        {item.summary}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-xs text-steel-500">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString()
                            : ""}
                        </span>
                        <Link
                          href={`/content?type=${encodeURIComponent(item.model)}&id=${encodeURIComponent(item.id)}`}
                          className="text-sm font-semibold text-brand-700 transition hover:text-brand-900"
                        >
                          Read More -{">"}
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      </main>
      <div className="-mt-16">
        <Footer />
      </div>
    </>
  );
}
