"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const journeySteps = [
  {
    year: "2011",
    phase: "Foundation",
    title: "Credence was founded to solve critical valve automation needs",
    body:
      "Credence Automation started with a clear objective: deliver customized valve automation solutions for critical applications in the process industry. From day one, the focus was on technologically superior products with reliability and safety at the center.",
    highlights: [
      "Customized valve automation solutions",
      "Critical process industry applications",
      "Reliability and safety driven engineering",
    ],
  },
  {
    year: "2011+",
    phase: "Market Entry",
    title: "Started with REXA Electraulic Actuators representation",
    body:
      "The company began business by representing REXA Electraulic Actuators. This early phase built application understanding, customer trust, and field exposure across demanding process environments.",
    highlights: [
      "REXA Electraulic Actuators representation",
      "Application learning through field deployments",
      "Base for product and engineering expansion",
    ],
  },
  {
    year: "Growth",
    phase: "Product Development",
    title: "Designed and developed Credence rotary and linear actuator ranges",
    body:
      "Credence went on to design and develop low-pressure pneumatic and high-pressure hydraulic Scotch Yoke rotary actuators in spring return and double acting configurations. The portfolio also expanded into large thrust linear actuators in spring return and double acting variants.",
    highlights: [
      "Low pressure pneumatic Scotch Yoke rotary actuators",
      "High pressure hydraulic Scotch Yoke rotary actuators",
      "Large thrust linear actuators",
    ],
  },
  {
    year: "Innovation",
    phase: "Engineering Differentiation",
    title: "Built safer and longer-life actuator designs",
    body:
      "Credence introduced improved design features such as Namur Solenoid Mounting, Tamper Proof Actuator Design and Multi Misalignment Absorbing Connections (Patent Pending). These design upgrades improve safety and extend actuator life in real operating conditions.",
    highlights: [
      "Namur Solenoid Mounting",
      "Tamper Proof Actuator Design",
      "Multi Misalignment Absorbing Connections (Patent Pending)",
    ],
  },
  {
    year: "Capability Expansion",
    phase: "Pipeline & Process Solutions",
    title: "Extended into gas transmission and specialized actuation",
    body:
      "Beyond rotary and linear platforms, Credence expanded into Direct Gas Actuators and Gas Over Oil (Gas Hydraulic) Actuators for gas transmission pipelines, strengthening its ability to address critical automation requirements across process sectors.",
    highlights: [
      "Direct Gas Actuators",
      "Gas Over Oil (Gas Hydraulic) Actuators",
      "Gas transmission pipeline automation",
    ],
  },
  {
    year: "Today",
    phase: "Continuous Improvement",
    title: "Scaling design, engineering, and organization capabilities",
    body:
      "Credence continues to strengthen design, engineering and organizational capabilities with a long-term focus on delivering critical valve actuator solutions for critical applications in the process industry.",
    highlights: [
      "Continuous capability development",
      "Engineering-led growth",
      "Long-term focus on critical applications",
    ],
  },
];

export default function Aboutus() {
  const [activeJourneyIndex, setActiveJourneyIndex] = useState(0);
  const timelineProgressScale = useMemo(
    () => (activeJourneyIndex + 1) / journeySteps.length,
    [activeJourneyIndex],
  );

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!nodes.length) return undefined;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const stepNodes = Array.from(document.querySelectorAll("[data-journey-step]"));
    if (!stepNodes.length) return undefined;

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setActiveJourneyIndex(0);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (!visibleEntries.length) return;

        const nextActive = visibleEntries
          .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top))[0]
          ?.target?.getAttribute("data-journey-step");

        const parsedIndex = Number.parseInt(nextActive ?? "0", 10);
        if (Number.isNaN(parsedIndex)) return;
        setActiveJourneyIndex(parsedIndex);
      },
      {
        threshold: [0.2, 0.4, 0.65],
        rootMargin: "-10% 0px -55% 0px",
      },
    );

    stepNodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <main className="bg-steel-50">
        <section className="border-b border-steel-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div data-reveal="up" className="reveal-on-scroll">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                  About Us
                </p>
                <h1 className="mt-2 max-w-[18ch] text-4xl font-extrabold leading-[0.95] tracking-tight text-steel-900 sm:text-5xl lg:text-6xl">
                  Valve Automation Solutions for the Process Industry
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-steel-600 sm:text-base">
                  Credence Automation is a valve actuators manufacturer and valve automation specialist
                  focused on customized solutions for critical applications where reliability, safety, and
                  long service life are non-negotiable.
                </p>
              </div>

              <div
                data-reveal="right"
                className="reveal-on-scroll rounded-xl border border-steel-200 bg-steel-50 p-4 sm:p-5"
                style={{ transitionDelay: "80ms" }}
              >
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="border border-steel-200 bg-white px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-steel-500">
                      Founded
                    </p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-steel-900">2011</p>
                  </div>
                  <div className="border border-steel-200 bg-white px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-steel-500">
                      Focus
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-tight text-steel-900">
                      Critical Valve Automation
                    </p>
                  </div>
                  <div className="col-span-2 border border-steel-200 bg-white px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-steel-500">
                      Philosophy
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-steel-700">
                      Deliver technologically superior products with high reliability and safety to meet
                      or exceed customer application requirements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-10">
            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <div data-reveal="left" className="reveal-on-scroll border border-steel-200 bg-white p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
                  Company Journey
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-steel-900">
                  From Representation to Engineering-Led Product Development
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-steel-600">
                  Scroll through the milestones to see how Credence evolved from market entry into a
                  specialized valve automation engineering company.
                </p>

                <div className="mt-5 border-t border-steel-200 pt-4">
                  <ol className="space-y-2">
                    {journeySteps.map((step, index) => (
                      <li
                        key={`${step.year}-${step.phase}`}
                        className={`flex items-start gap-3 rounded-md px-2 py-1.5 transition-colors duration-200 ${
                          index === activeJourneyIndex ? "bg-brand-50/60" : "bg-transparent"
                        }`}
                        aria-current={index === activeJourneyIndex ? "step" : undefined}
                      >
                        <span
                          className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold transition-all duration-300 ${
                            index === activeJourneyIndex
                              ? "border-brand-400 bg-brand-500 text-white shadow-[0_4px_10px_rgba(255,35,1,0.2)]"
                              : "border-brand-200 bg-brand-50 text-brand-700"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div>
                          <p
                            className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${
                              index === activeJourneyIndex ? "text-brand-700" : "text-steel-500"
                            }`}
                          >
                            {step.year}
                          </p>
                          <p
                            className={`text-sm font-semibold transition-colors duration-200 ${
                              index === activeJourneyIndex ? "text-steel-900" : "text-steel-800"
                            }`}
                          >
                            {step.phase}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </aside>

            <div className="relative">
              <div className="about-timeline-line absolute left-[13px] top-0 h-full w-px bg-steel-200" aria-hidden="true" />
              <div
                className="about-timeline-progress absolute left-[13px] top-0 h-full w-px origin-top bg-brand-300"
                aria-hidden="true"
                style={{ transform: `scaleY(${timelineProgressScale})` }}
              />
              <div className="space-y-6 sm:space-y-8">
                {journeySteps.map((step, index) => (
                  <section
                    key={`${step.year}-${step.title}`}
                    data-journey-step={index}
                    data-reveal="up"
                    className="reveal-on-scroll relative pl-10"
                    style={{ transitionDelay: `${Math.min(index * 45, 220)}ms` }}
                  >
                    <div
                      className={`absolute left-0 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full border bg-white text-xs font-bold text-brand-700 shadow-[0_2px_8px_rgba(23,28,34,0.05)] transition-all duration-300 ${
                        index === activeJourneyIndex
                          ? "border-brand-400 shadow-[0_8px_18px_rgba(255,35,1,0.14)]"
                          : "border-brand-200"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div
                      className={`group border bg-white p-4 transition duration-200 sm:p-5 ${
                        index === activeJourneyIndex
                          ? "border-brand-200 bg-brand-50/20"
                          : "border-steel-200 hover:border-steel-300 hover:bg-steel-50"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                          {step.phase}
                        </span>
                        <span className="inline-block h-1 w-1 rounded-full bg-steel-300" aria-hidden="true" />
                        <span className="text-xs font-medium text-steel-500">{step.year}</span>
                      </div>

                      <h3 className="mt-2 text-xl font-bold leading-tight tracking-tight text-steel-900 sm:text-2xl">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-steel-600 sm:text-base">
                        {step.body}
                      </p>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {step.highlights.map((highlight) => (
                          <div
                            key={highlight}
                            className="flex items-start gap-2 border border-steel-200 bg-steel-50 px-3 py-2 text-sm text-steel-700"
                          >
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                            <span>{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-steel-200 bg-steel-100">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div data-reveal="up" className="reveal-on-scroll">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
                  What Drives Credence
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-steel-900 sm:text-4xl">
                  Engineering reliability for critical valve applications
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-steel-600 sm:text-base">
                  Credence continues to build design, engineering and organizational capability with a
                  clear focus: provide dependable actuator solutions for critical applications across the
                  process industry with a strong commitment to performance and safety.
                </p>
              </div>

              <div
                data-reveal="right"
                className="reveal-on-scroll flex flex-col gap-2.5"
                style={{ transitionDelay: "80ms" }}
              >
                <Link
                  href="/products"
                  className="inline-flex items-center justify-between border border-steel-200 bg-white px-4 py-3 text-sm font-semibold text-steel-800 transition hover:border-brand-200 hover:text-brand-700"
                >
                  <span>Explore Products</span>
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
                <Link
                  href="/request-quote"
                  className="inline-flex items-center justify-between border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-500 hover:text-white"
                >
                  <span>Discuss Your Application</span>
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
              </div>
            </div>
          </div>
        </section>
      </main>


      <style jsx>{`
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(18px);
          transition:
            opacity 520ms ease,
            transform 520ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity, transform;
        }

        .reveal-on-scroll[data-reveal="left"] {
          transform: translateX(-20px);
        }

        .reveal-on-scroll[data-reveal="right"] {
          transform: translateX(20px);
        }

        .reveal-on-scroll.is-visible {
          opacity: 1;
          transform: translate(0, 0);
        }

        .about-timeline-line {
          transform-origin: top;
          animation: timeline-grow 900ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both;
        }

        .about-timeline-progress {
          transition: transform 680ms cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 0 0 1px rgba(255, 35, 1, 0.04);
          will-change: transform;
        }

        [aria-current="step"] > span {
          animation: about-step-pulse 1.6s ease-in-out infinite;
        }

        @keyframes timeline-grow {
          from {
            transform: scaleY(0);
            opacity: 0.4;
          }
          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        @keyframes about-step-pulse {
          0%,
          100% {
            box-shadow: 0 4px 10px rgba(255, 35, 1, 0.2);
          }
          50% {
            box-shadow: 0 4px 14px rgba(255, 35, 1, 0.32);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .reveal-on-scroll {
            opacity: 1;
            transform: none;
            transition: none;
          }

          .about-timeline-line {
            animation: none;
          }

          .about-timeline-progress {
            transition: none;
          }

          [aria-current="step"] > span {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
