"use client";

import { useEffect, useMemo, useState } from "react";

const updates = [
  {
    id: 1,
    model: "news",
    title: "Industry",
    summary: "Sales & Distribution Partnership with a",
    content:
      "Bray is a premier global manufacturer of quality valves, actuators and controls used for purifying water in critical process lines.",
    is_visible: true,
    created_at: "2026-01-12T10:00:00Z",
    link_url: "#",
  },
  {
    id: 2,
    model: "achievement",
    title: "Industry",
    summary: "Sales & Distribution Partnership with a",
    content:
      "Successfully commissioned high-cycle actuated valve packages for a multi-site industrial utility network with strict safety requirements.",
    is_visible: true,
    created_at: "2026-01-26T10:00:00Z",
    link_url: "#",
  },
  {
    id: 3,
    model: "news",
    title: "Industry",
    summary: "Sales & Distribution Partnership with a",
    content:
      "Expanded product support for process automation teams by adding faster response channels for installation, troubleshooting, and maintenance.",
    is_visible: true,
    created_at: "2026-02-03T10:00:00Z",
    link_url: "#",
  },
  {
    id: 4,
    model: "achievement",
    title: "Industry",
    summary: "Automation Milestone in Safety",
    content:
      "Delivered an actuator retrofit package that improved response reliability and reduced unscheduled maintenance across the line.",
    is_visible: true,
    created_at: "2026-02-10T10:00:00Z",
    link_url: "#",
  },
  {
    id: 5,
    model: "news",
    title: "Industry",
    summary: "Regional Service Network Expansion",
    content:
      "Extended field support coverage with faster callback windows for commissioning, diagnostics, and annual maintenance plans.",
    is_visible: true,
    created_at: "2026-02-14T10:00:00Z",
    link_url: "#",
  },
  {
    id: 6,
    model: "achievement",
    title: "Industry",
    summary: "High-Cycle Validation Completed",
    content:
      "Validated actuator performance under high-cycle conditions for a demanding process segment with strict uptime targets.",
    is_visible: true,
    created_at: "2026-02-18T10:00:00Z",
    link_url: "#",
  },
];

function chunkItems(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export default function LandingPage() {
  const visibleUpdates = useMemo(() => updates.filter((item) => item.is_visible), []);
  const [itemsPerSlide, setItemsPerSlide] = useState(3);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const onResize = () => setItemsPerSlide(window.innerWidth < 768 ? 1 : 3);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const slides = useMemo(
    () => chunkItems(visibleUpdates, itemsPerSlide),
    [visibleUpdates, itemsPerSlide],
  );

  useEffect(() => {
    setSlideIndex(0);
  }, [itemsPerSlide]);

  useEffect(() => {
    if (isPaused) return undefined;
    if (slides.length <= 1) return undefined;
    const intervalId = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 4200);
    return () => window.clearInterval(intervalId);
  }, [isPaused, slides.length]);

  return (
    <main className="bg-steel-50">
      <section className="w-full">
        <div
          className="relative min-h-[220px] w-full bg-cover bg-center sm:min-h-[300px] md:min-h-[360px] lg:min-h-[440px]"
          style={{
            backgroundImage:
              "url('https://www.karenaudit.com/wp-content/uploads/2024/03/steel-metal-celik-isci.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-steel-900/70 via-steel-900/35 to-steel-900/10" />

          <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="w-[90vw] max-w-[430px] rounded-xl border border-white/40 bg-steel-900/50 p-4 backdrop-blur-[4px] sm:rounded-2xl sm:p-6">
              <h1 className="max-w-[10ch] break-words text-[clamp(2rem,7vw,4.4rem)] font-extrabold leading-[0.92] tracking-tight text-white">
                <span className="text-brand-500">Reliability</span>
                <br />
                engineered
                <br />
                into every
                <br />
                valve
              </h1>

              <button
                type="button"
                className="mt-4 rounded-md border border-white/60 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-white hover:text-steel-900 sm:mt-6 sm:text-sm"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="bg-[#e7d7b7]">
          <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
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
                        className="rounded-sm border border-[#d4c29f] bg-[#e7d7b7] p-3 sm:p-4"
                      >
                        <p className="text-[11px] font-medium text-brand-700 sm:text-xs">{item.title}</p>
                        <h2 className="mt-1.5 max-w-[26ch] text-[1.25rem] font-bold leading-[1.08] tracking-tight text-steel-900 sm:text-[1.5rem]">
                          {item.summary}
                        </h2>
                        <p className="mt-2 max-w-[46ch] text-[11px] leading-snug text-steel-800 sm:text-xs">
                          {item.content}
                        </p>
                        <a
                          href={item.link_url}
                          className="mt-3 inline-block text-[11px] font-medium text-brand-700 transition hover:text-brand-900 sm:text-xs"
                        >
                          Read More -{">"}
                        </a>
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

