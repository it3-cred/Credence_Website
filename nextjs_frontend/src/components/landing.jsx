"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { API_ENDPOINTS, apiUrl } from "@/lib/api";
import Link from "next/link";

const industries = [
  {
    id: 1,
    name: "Oil and Gas Industry",
    image:
      "https://www.worldfinance.com/wp-content/uploads/2019/11/Exploration-for-oil-and-gas-is-very-expensive-and-risky.jpg",
    accent: "text-[#ffb84d]",
  },
  {
    id: 2,
    name: "Power Generation Industry",
    image:
      "https://alfainfraprop.com/wp-content/uploads/2023/03/POWER-GENERATION-IN-INDIA-INDUSTRY-ANALYSIS.jpg",
    accent: "text-white",
  },
  {
    id: 3,
    name: "Water and Waste Water Industry",
    image:
      "https://static.wixstatic.com/media/2f92f1_8ade180c99ba4466b5b9e47201e38021~mv2.jpg/v1/fill/w_568,h_378,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/2f92f1_8ade180c99ba4466b5b9e47201e38021~mv2.jpg",
    accent: "text-[#e7ff7c]",
  },
  {
    id: 4,
    name: "Aerospace Research and Defence",
    image:
      "https://timestech.in/wp-content/uploads/2019/09/Aerospace-Defense.jpg",
    accent: "text-white",
  },
  {
    id: 5,
    name: "Food Beverage and Pharmaceuticals",
    image:
      "https://lh3.googleusercontent.com/proxy/_AbhMIsV3muA1O4U9JP1WFh5WJBkZzCVJzmdYR2HH6HUyFEnKtIWGUloeZhg00ndnNEqZRaM0aTGcntPmkbuFJctnfjyKDaLYXA2jbSszRFxaZDFj6UYeBoZdyHUyudj1Q",
    accent: "text-[#ffdf9a]",
  },
  {
    id: 6,
    name: "Metals and Mining",
    image:
      "https://www.mining-technology.com/wp-content/uploads/sites/19/2020/10/Feature-Image-top-ten-metals-and-mining-companies.jpg",
    accent: "text-white",
  },
];

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

const partnerCardBackgrounds = [
  
  
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
    const onResize = () => {
      setItemsPerSlide(window.innerWidth < 768 ? 1 : 3);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const slides = useMemo(() => chunkItems(visibleUpdates, itemsPerSlide), [visibleUpdates, itemsPerSlide]);
  const industryTrackItems = useMemo(() => [...industries, ...industries], []);
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

  return (
    <>
      <Navbar />
      <main className="bg-steel-50">
      <section className="w-full">
        <div
          className="relative min-h-[220px] w-full bg-cover bg-center sm:min-h-[300px] md:min-h-[360px] lg:min-h-[350px]"
          style={{
            backgroundImage:
              "url('https://www.karenaudit.com/wp-content/uploads/2024/03/steel-metal-celik-isci.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-linear-to-r from-steel-900/70 via-steel-900/35 to-steel-900/10" />
          <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="w-[90vw] max-w-[430px] rounded-xl border border-white/40 bg-steel-900/50 p-4 backdrop-blur-[4px] sm:rounded-2xl sm:p-6">
              <h1 className="max-w-[10ch] break-words text-[clamp(2.8rem,3.4vw,3.4rem)] font-extrabold leading-[0.92] tracking-tight text-white">
                <span className="text-brand-500">Reliability</span>
                <br />
                engineered
                <br />
                into every
                <br />
                valve
              </h1>
              <Link
                href="/auth"
                className="mt-4 inline-block rounded-md border border-white/60 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-white hover:text-steel-900 sm:mt-6 sm:text-sm"
              >
                Know More Abot Us
              </Link>
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
                        className="news-card flex min-h-[200px] flex-col rounded-sm border border-[#e7d7b7]! bg-[#e7d7b7] p-3 sm:min-h-[210px] sm:p-2"
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
                          className="mt-auto inline-block pt-3 text-[11px] font-medium text-brand-700 transition hover:text-brand-900 sm:text-xs"
                        >
                          Read More -{">"}
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

      <section className="bg-steel-100">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-10">
          <h2 className="text-4xl font-extrabold leading-[0.95] tracking-tight text-steel-900 sm:text-5xl">
            Product
            <br />
            <span className="text-brand-500">Portfolio</span>
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {powerSources.map((source) => (
              <Link
                key={source.id}
                href={source.slug ? `/products/${encodeURIComponent(source.slug)}` : "/products"}
                className="product-portfolio-card overflow-hidden rounded-2xl border border-brand-200 bg-white cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="h-[17rem] w-full bg-steel-200 sm:h-[18rem]">
                  <img
                    src={source.image_url || "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1600&q=80&auto=format&fit=crop"}
                    alt={source.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <h3 className="overflow-hidden text-ellipsis text-xl font-bold leading-tight text-steel-900 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                    {source.name}
                  </h3>
                  <p className="mt-2 overflow-hidden text-ellipsis text-base leading-snug text-steel-700 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]">
                    {source.summary}
                  </p>
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
                <article
                  key={`${industry.id}-${index}`}
                  className="relative w-[78vw] max-w-[280px] shrink-0 overflow-hidden rounded-xl border border-brand-200"
                >
                  <div
                    className="h-32 bg-cover bg-center sm:h-36"
                    style={{
                      backgroundImage: `linear-gradient(0deg, rgba(20,26,34,0.58), rgba(20,26,34,0.18)), url('${industry.image}')`,
                    }}
                  />
                  <h3
                    className={`absolute left-3 top-1/2 max-w-[86%] -translate-y-1/2 text-[clamp(1.2rem,3vw,2rem)] font-extrabold leading-[0.95] tracking-tight ${industry.accent}`}
                  >
                    {industry.name}
                  </h3>
                </article>
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
