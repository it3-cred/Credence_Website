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

function normalizeImageList(raw, selectedType) {
  const fromArray = Array.isArray(raw?.image_urls) ? raw.image_urls.map(withMediaBase).filter(Boolean) : [];

  if (fromArray.length > 0) {
    return fromArray;
  }

  const fallbackSingle =
    selectedType === "achievement" ? withMediaBase(raw?.image_url) : withMediaBase(raw?.cover_image_url);

  return fallbackSingle ? [fallbackSingle] : [];
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [pauseAutoplay, setPauseAutoplay] = useState(false);

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

        const mapped = {
          id: raw.id,
          title: raw.title || "",
          summary: raw.summary || "",
          content: raw.content || "",
          year: raw.year,
          created_at: raw.created_at,
          image_urls: normalizeImageList(raw, selectedType),
        };

        setItem(mapped);
        setCurrentImageIndex(0);

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

  useEffect(() => {
    const imagesCount = item?.image_urls?.length || 0;
    if (imagesCount <= 1 || pauseAutoplay) return undefined;

    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imagesCount);
    }, 2500);

    return () => clearInterval(timer);
  }, [item, pauseAutoplay]);

  const canSlideImages = (item?.image_urls?.length || 0) > 1;
  const goToPreviousImage = () => {
    if (!item?.image_urls?.length) return;
    setCurrentImageIndex((prev) => (prev === 0 ? item.image_urls.length - 1 : prev - 1));
  };
  const goToNextImage = () => {
    if (!item?.image_urls?.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % item.image_urls.length);
  };

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
                {item.image_urls.length > 0 ? (
                  <div
                    className="relative p-2"
                    onMouseEnter={() => setPauseAutoplay(true)}
                    onMouseLeave={() => setPauseAutoplay(false)}
                    onTouchStart={() => setPauseAutoplay(true)}
                    onTouchEnd={() => setPauseAutoplay(false)}
                  >
                    <div className="overflow-hidden rounded-lg">
                      <div
                        className="flex transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                      >
                        {item.image_urls.map((imageUrl, index) => (
                          <img
                            key={`${item.id}-image-${index}`}
                            src={imageUrl}
                            alt={`${item.title} image ${index + 1}`}
                            className="h-64 w-full shrink-0 object-cover sm:h-80"
                            loading="lazy"
                          />
                        ))}
                      </div>
                    </div>

                    {canSlideImages ? (
                      <>
                        <button
                          type="button"
                          onClick={goToPreviousImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-black/40 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/55"
                          aria-label="Previous image"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          onClick={goToNextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-black/40 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/55"
                          aria-label="Next image"
                        >
                          Next
                        </button>

                        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 backdrop-blur-sm">
                          {item.image_urls.map((_, dotIndex) => (
                            <button
                              key={`dot-${dotIndex}`}
                              type="button"
                              onClick={() => setCurrentImageIndex(dotIndex)}
                              className={`h-2.5 w-2.5 rounded-full transition ${
                                currentImageIndex === dotIndex ? "bg-white" : "bg-white/45 hover:bg-white/70"
                              }`}
                              aria-label={`Go to image ${dotIndex + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>
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
