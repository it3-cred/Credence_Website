"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

const products = [
  {
    id: 1,
    name: "Scotch Yoke Pneumatic and Hydraulic Actuators",
    slug: "scotch-yoke-pneumatic-and-hydraulic-actuators",
    short_description: "Credence Scotch Yoke Pneumatic & Hydraulic Actuators - A Series",
    summary:
      "Credence Scotch Yoke Rotary Actuators are available with technologically superior features in low pressure pneumatic and high pressure hydraulic applications. The actuators are available in double acting and spring return configurations. Scotch Yoke is the preferred actuation technology for Oil & Gas, Petrochemical, Water and Waste Water, Metals and Mining, and other industries requiring automation solutions for large valves having high torques.",
    image:
      "https://credenceautomation.com/wp-content/uploads/2020/01/A03_17.png",
    is_visible: true,
    catalogue_url: "#",
  },
  {
    id: 2,
    name: "Gas Over Oil (Gas Hydraulic) Rotary & Linear Actuators",
    slug: "gas-over-oil-gas-hydraulic-rotary-linear-actuators",
    short_description: "Gas Hydraulic Actuators or Gas Over Oil Actuators for Oil and Gas Pipelines",
    summary:
      "Credence Gas Over Oil (Gas Hydraulic) Actuators are available in linear and rotary configurations suitable for gas transmission pipelines and compressor station automation. Options include local manual, local and remote electric, line break protection, rate of pressure drop protection, high pressure close and low pressure close. Additional customized control configurations are available on request.",
    image:
      "https://credenceautomation.com/wp-content/uploads/2020/06/Gas-Over-oil-r1.-e1578733519171.png",
    is_visible: true,
    catalogue_url: "#",
  },
  {
    id: 3,
    name: "Linear Pneumatic and Hydraulic Actuators",
    slug: "linear-pneumatic-and-hydraulic-actuators",
    short_description: "Credence-Linear-Pneumatic-Hydraulic-Actuators",
    summary:
      "Credence offers a range of customized piston type linear actuators in double acting and spring return configurations for automation of large gate, globe and specialized valves. These actuators support on-off and modulation duty control and are available in stay put or fail-safe configurations including fail open, fail close, fail to extend and fail to retract.",
    image:
      "https://credenceautomation.com/wp-content/uploads/2020/06/Credence-Linear-Pneumaitc-Hydraulic-Actuators-e1585855414894.png",
    is_visible: true,
    catalogue_url: "#",
  },
  {
    id: 4,
    name: "Rack and Pinion Hydraulic Actuators",
    slug: "rack-and-pinion-hydraulic-actuators",
    short_description:
      "Credence Double Acting, Spring Return, Linear and Rotary Hydraulic Actuators for Submerged Service Applications",
    summary:
      "Credence offers a range of customized hydraulic actuators for linear gate and globe valves and rotary ball, butterfly and plug valves. Suitable for sub sea and submerged service valve applications. Actuators come with dual redundant sealing as standard and are available in linear and rotary, double acting and spring return configurations.",
    image:
      "https://credenceautomation.com/wp-content/uploads/2023/02/RP_BFY_4-removebg-preview-433x480.png",
    is_visible: true,
    catalogue_url: "#",
  },
  {
    id: 5,
    name: "Electric Quarter Turn Actuator",
    slug: "electric-quarter-turn-actuator",
    short_description: "Smart Electric Actuator for Rotary Valve Automation",
    summary:
      "Compact electric quarter turn actuator designed for dependable valve control with local override, position feedback and weatherproof construction options for harsh field conditions.",
    image:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1600&q=80&auto=format&fit=crop",
    is_visible: true,
    catalogue_url: "#",
  },
  {
    id: 6,
    name: "Heavy Duty Pneumatic Rack and Pinion Actuator",
    slug: "heavy-duty-pneumatic-rack-and-pinion-actuator",
    short_description: "High-Cycle Rack and Pinion Pneumatic Actuator",
    summary:
      "Engineered for fast response and repeatable torque output in high-cycle process automation with configurable spring return and double acting operation modes.",
    image:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1600&q=80&auto=format&fit=crop",
    is_visible: true,
    catalogue_url: "#",
  },
];

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
  const visibleUpdates = useMemo(() => updates.filter((item) => item.is_visible), []);
  const visibleProducts = useMemo(() => products.filter((item) => item.is_visible), []);

  const [itemsPerSlide, setItemsPerSlide] = useState(3);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isIndustryPaused, setIsIndustryPaused] = useState(false);

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
          className="relative min-h-[220px] w-full bg-cover bg-center sm:min-h-[300px] md:min-h-[360px] lg:min-h-[440px]"
          style={{
            backgroundImage:
              "url('https://www.karenaudit.com/wp-content/uploads/2024/03/steel-metal-celik-isci.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-linear-to-r from-steel-900/70 via-steel-900/35 to-steel-900/10" />
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
                        className="rounded-sm border border-[#e7d7b7]! bg-[#e7d7b7] p-3 sm:p-4"
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

      <section className="bg-steel-100">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-10">
          <h2 className="text-4xl font-extrabold leading-[0.95] tracking-tight text-steel-900 sm:text-5xl">
            Product
            <br />
            <span className="text-brand-500">Portfolio</span>
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProducts.map((product) => (
              <article
                key={product.slug}
                className="product-portfolio-card overflow-hidden rounded-2xl border border-brand-200 bg-white"
              >
                <div className="h-[17rem] w-full bg-steel-200 sm:h-[18rem]">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold leading-tight text-steel-900">{product.name}</h3>
                  <p className="mt-2 text-sm font-semibold text-brand-700">{product.short_description}</p>
                  <p className="product-summary-clamp mt-2 text-sm leading-snug text-steel-700">
                    {product.summary}
                  </p>
                  <button
                    type="button"
                    className="mt-4 rounded-md border border-brand-300 bg-brand-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-700 transition hover:bg-brand-500 hover:text-white"
                  >
                    View Details
                  </button>
                </div>
              </article>
            ))}
          </div>
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
            <span className="text-brand-500">Partners</span>
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
                        className="partner-name text-steel-800"
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
