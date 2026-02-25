"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { API_ENDPOINTS, apiUrl } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import Link from "next/link";
import Image from "next/image";


const partnerCompanies = [
  "Tata Steel Limited",
  "Reliance Industries Limited",
  "Larsen and Toubro Limited",
  "Adani Power Limited",
  "J S W Steel Limited",
  "Thermax Limited",
  "Sankey Controls Pvt. Ltd.",
  "Bhushan Steel & Power Limited",
  "Emerson Fisher - Chennai India",
  "Hindustan Petroleum Corp. Ltd.",
  "Indian Oil Corporation Limited",
  "VSSC Limited",
];

function chunkItems(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export default function LandingPage() {
  const [updates, setUpdates] = useState([]);
  const [updatesLoading, setUpdatesLoading] = useState(true);
  const [updatesError, setUpdatesError] = useState("");
  const [powerSources, setPowerSources] = useState([]);
  const [powerSourcesError, setPowerSourcesError] = useState("");
  const [industries, setIndustries] = useState([]);
  const [industriesError, setIndustriesError] = useState("");

  const visibleUpdates = useMemo(() => updates.filter((item) => item.is_visible), [updates]);

  const [itemsPerSlide, setItemsPerSlide] = useState(3);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isIndustryPaused, setIsIndustryPaused] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchContentUpdates() {
      setUpdatesLoading(true);
      setUpdatesError("");

      try {
        const [newsRes, achievementsRes] = await Promise.all([
          fetch(apiUrl(API_ENDPOINTS.contentNews), { signal: controller.signal }),
          fetch(apiUrl(API_ENDPOINTS.contentAchievements), { signal: controller.signal }),
        ]);

        if (!newsRes.ok || !achievementsRes.ok) {
          throw new Error("Failed to fetch content updates.");
        }

        const [newsJson, achievementsJson] = await Promise.all([newsRes.json(), achievementsRes.json()]);

        const mappedNews = (newsJson.results || []).map((item) => ({
          id: item.id,
          model: "news",
          category: "News",
          title: item.title || "",
          slug: item.slug,
          summary: item.summary || "",
          is_visible: Boolean(item.is_visible),
          created_at: item.created_at,
          link_url: "#",
        }));

        const mappedAchievements = (achievementsJson.results || []).map((item) => ({
          id: item.id,
          model: "achievement",
          category: "Achievement",
          title: item.title || "",
          slug: item.slug,
          summary: item.summary || "",
          is_visible: Boolean(item.is_visible),
          created_at: item.created_at,
          link_url: "#",
        }));

        const merged = [...mappedNews, ...mappedAchievements].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        if (isMounted) {
          setUpdates(merged);
        }
      } catch (error) {
        if (error.name !== "AbortError" && isMounted) {
          setUpdatesError("Unable to load news and achievements right now.");
          setUpdates([]);
        }
      } finally {
        if (isMounted) {
          setUpdatesLoading(false);
        }
      }
    }

    fetchContentUpdates();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchPowerSources() {
      setPowerSourcesError("");
      try {
        const response = await fetch(apiUrl(API_ENDPOINTS.powerSources), { signal: controller.signal });
        if (!response.ok) {
          throw new Error("Failed to fetch power sources.");
        }
        const json = await response.json();
        if (isMounted) {
          setPowerSources(json.results || []);
        }
      } catch (error) {
        if (error.name !== "AbortError" && isMounted) {
          setPowerSourcesError("Unable to load product portfolio right now.");
          setPowerSources([]);
        }
      }
    }

    fetchPowerSources();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchIndustries() {
      setIndustriesError("");
      try {
        const response = await fetch(apiUrl(API_ENDPOINTS.industries), { signal: controller.signal });
        if (!response.ok) {
          throw new Error("Failed to fetch industries.");
        }
        const json = await response.json();
        if (isMounted) {
          setIndustries((json.results || []).filter((item) => item.is_visible !== false));
        }
      } catch (error) {
        if (error.name !== "AbortError" && isMounted) {
          setIndustriesError("Unable to load industries right now.");
          setIndustries([]);
        }
      }
    }

    fetchIndustries();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      setItemsPerSlide(window.innerWidth < 768 ? 1 : 3);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const slides = useMemo(() => chunkItems(visibleUpdates, itemsPerSlide), [visibleUpdates, itemsPerSlide]);
  const industryTrackItems = useMemo(() => (industries.length ? [...industries, ...industries] : []), [industries]);
  const partnerRows = useMemo(
    () => [
      partnerCompanies.slice(0, 4),
      partnerCompanies.slice(4, 8),
      partnerCompanies.slice(8, 12),
    ],
    [],
  );

  useEffect(() => {
    setSlideIndex(0);
  }, [itemsPerSlide]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return undefined;
    const intervalId = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 4200);
    return () => window.clearInterval(intervalId);
  }, [isPaused, slides.length]);

  const handlePowerSourceCardClick = (source) => {
    trackEvent("power_source_card_click", {
      source_section: "landing_product_portfolio",
      power_source_id: source?.id ?? null,
      power_source_slug: source?.slug || "",
      power_source_name: source?.name || "",
    });
  };

  const handleIndustryCardClick = (industry) => {
    trackEvent("industry_card_click", {
      source_section: "landing_industries",
      industry_id: industry?.id ?? null,
      industry_slug: industry?.slug || "",
      industry_name: industry?.name || "",
    });
  };

  return (
    <>
      <Navbar />
      <main className="bg-steel-50">
      <section className="w-full">
        <div
          className="relative min-h-55 w-full bg-cover bg-center sm:min-h-75 md:min-h-90 lg:min-h-87.5"
          style={{
            backgroundImage:
              "url('https://www.karenaudit.com/wp-content/uploads/2024/03/steel-metal-celik-isci.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-linear-to-r from-steel-950/78 via-steel-900/38 to-steel-900/8" />
          <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="w-[92vw] max-w-136 rounded-xl border border-white/20 bg-steel-950/42 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.25)] backdrop-blur-md sm:rounded-2xl sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70 sm:text-xs">
                Industrial Automation Solutions
              </p>

              <h1 className="mt-3 max-w-[12ch] text-[clamp(2.1rem,5vw,4rem)] font-extrabold leading-[0.9] tracking-tight text-white">
                <span className="text-brand-500">Reliability</span>
                <span className="block">engineered</span>
                <span className="block">into every</span>
                <span className="block">valve</span>
              </h1>

              <p className="mt-3 max-w-[34ch] text-xs leading-relaxed text-white/75 sm:text-sm">
                Built for demanding plants and pipelines with actuator automation, controls, and valve integration.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2 sm:mt-6">
                <Link
                  href="/products"
                  className="inline-flex items-center rounded-md bg-brand-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-brand-600 sm:text-sm"
                >
                  Explore Products
                </Link>
                <Link
                  href="/auth"
                  className="inline-flex items-center rounded-md border border-white/55 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-white hover:text-steel-900 sm:text-sm"
                >
                  Know More About Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="bg-[#e7d7b7]">
          <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                Latest News & Achievements
              </p>
              <Link
                href="/news"
                className="rounded-md  px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700 transition hover:bg-brand-700 hover:text-white"
              >
                View All News
              </Link>
            </div>

            {updatesError ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{updatesError}</p>
            ) : null}

            {!updatesLoading && slides.length === 0 && !updatesError ? (
              <p className="rounded-md bg-white/70 px-3 py-2 text-sm font-medium text-steel-800">
                No visible news or achievements found.
              </p>
            ) : null}

            <div
              className="overflow-hidden"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
              onTouchCancel={() => setIsPaused(false)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
            >
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${slideIndex * 100}%)` }}
              >
                {slides.map((slide, idx) => (
                  <div key={idx} className="grid w-full shrink-0 gap-2 sm:gap-3 md:grid-cols-3">
                    {slide.map((item) => (
                      <article
                        key={`${item.model}-${item.id}`}
                        className="news-card flex min-h-50 flex-col rounded-sm border border-[#e7d7b7]! bg-[#e7d7b7] p-3 sm:min-h-52.5 sm:p-2"
                      >
                        <p className="news-title-clamp text-[11px] font-medium text-brand-700 sm:text-xs">
                          {item.category}
                        </p>
                        <h2 className="news-summary-clamp mt-1.5 text-[1.15rem] font-bold leading-[1.08] tracking-tight text-steel-900 sm:text-[1.3rem]">
                          {item.title}
                        </h2>
                        <p className="news-content-clamp mt-2 text-[11px] leading-snug text-steel-800 sm:text-xs">
                          {item.summary}
                        </p>
                        <Link
                          href={`/${encodeURIComponent(item.model)}/${encodeURIComponent(item.slug || "item")}-${encodeURIComponent(item.id)}`}
                          className="mt-auto inline-flex items-center gap-1.5 pt-3 text-[11px] font-medium text-brand-700 transition hover:text-brand-900 sm:text-xs"
                        >
                          <span>Read More</span>
                          <svg
                            className="h-3.5 w-3.5"
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
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-steel-200/80 bg-steel-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-11">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
                Core Solutions
              </p>
              <h2 className="mt-1 text-4xl font-extrabold leading-[0.95] tracking-tight text-steel-900 sm:text-5xl">
                Product
                <br />
                <span className="text-brand-500">Portfolio</span>
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-steel-600 sm:text-right">
              Industrial-grade actuator and control solutions designed for reliability, safety,
              and long service life in demanding operating environments.
            </p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {powerSources.map((source) => (
              <Link
                key={source.id}
                href={source.slug ? `/products/${encodeURIComponent(source.slug)}` : "/products"}
                onClick={() => handlePowerSourceCardClick(source)}
                className="product-portfolio-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-steel-200/90 bg-white cursor-pointer"
              >
                <div className="relative h-52 w-full overflow-hidden bg-steel-100 sm:h-56">
                  <Image
                    src={source.image_url || "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1600&q=80&auto=format&fit=crop"}
                    alt={source.name}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="product-portfolio-image h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-steel-950/45 via-steel-950/8 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <h3 className="overflow-hidden text-ellipsis text-lg font-semibold leading-tight tracking-tight text-steel-900 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                    {source.name}
                  </h3>
                  <p className="mt-2 product-summary-clamp text-sm leading-relaxed text-steel-600">
                    {source.summary}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-steel-100 pt-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-700">
                      View Details
                    </span>
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
              </Link>
            ))}
          </div>
          {powerSourcesError ? (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{powerSourcesError}</p>
          ) : null}
        </div>
      </section>

      <section className="bg-steel-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            Our Contributions
          </p>
          <h2 className="mt-1 text-4xl font-extrabold leading-[0.95] tracking-tight text-steel-900 sm:text-5xl">
            Industries We
            <br />
            <span className="text-brand-500">Serve!</span>
          </h2>

          {industriesError && <p className="mt-3 text-sm text-red-600">{industriesError}</p>}

          <div
            className="mt-5 overflow-hidden"
            onMouseEnter={() => setIsIndustryPaused(true)}
            onMouseLeave={() => setIsIndustryPaused(false)}
            onTouchStart={() => setIsIndustryPaused(true)}
            onTouchEnd={() => setIsIndustryPaused(false)}
            onTouchCancel={() => setIsIndustryPaused(false)}
            onFocus={() => setIsIndustryPaused(true)}
            onBlur={() => setIsIndustryPaused(false)}
          >
            <div
              className="industry-marquee-track flex w-max gap-3 sm:gap-4"
              style={{ animationPlayState: isIndustryPaused ? "paused" : "running" }}
            >
              {industryTrackItems.map((industry, index) => (
                <Link
                  key={`${industry.id}-${index}`}
                  href={industry.slug ? `/products?industries=${encodeURIComponent(industry.slug)}` : "/products"}
                  onClick={() => handleIndustryCardClick(industry)}
                  className="relative block w-[78vw] max-w-70 shrink-0 overflow-hidden rounded-xl border border-brand-200"
                >
                  <div
                    className="h-32 bg-cover bg-center sm:h-36"
                    style={{
                      backgroundImage: `linear-gradient(0deg, rgba(20,26,34,0.58), rgba(20,26,34,0.18)), url('${industry.image_url || ''}')`,
                    }}
                  />
                  <h3
                    className="absolute left-3 top-1/2 max-w-[86%] -translate-y-1/2 text-[clamp(1.2rem,3vw,2rem)] font-extrabold leading-[0.95] tracking-tight"
                    style={{ color: industry.accent_color || "#FFFFFF" }}
                  >
                    {industry.name}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-steel-100">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:pt-8 lg:pb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
          </p>
          <h2 className="mt-1 text-4xl font-extrabold leading-[0.95] tracking-tight text-steel-900 sm:text-5xl">
            Our
            <br />
            <span className="text-brand-500">Customers</span>
          </h2>

          <div className="mt-6 space-y-3 overflow-hidden">
            {partnerRows.map((row, rowIndex) => {
              const trackClass =
                rowIndex === 1
                  ? "partners-track partners-track-reverse"
                  : "partners-track";

              return (
                <div key={rowIndex} className="overflow-hidden">
                  <div className={`${trackClass} flex w-max items-center gap-8 sm:gap-12`}>
                    {[...row, ...row].map((company, index) => (
                      <span
                        key={`${rowIndex}-${company}-${index}`}
                        className="customer-company-name text-steel-800"
                      >
                        {company}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      </main>
      <div className="-mt-16">
        <Footer />
      </div>
    </>
  );
}
