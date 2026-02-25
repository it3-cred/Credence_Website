"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { API_ENDPOINTS, apiUrl } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1600&q=80&auto=format&fit=crop";

function normalizeTorqueBounds(rawMin, rawMax) {
  const minValue = Number(rawMin);
  const maxValue = Number(rawMax);
  const hasMin = Number.isFinite(minValue) && String(rawMin).trim() !== "";
  const hasMax = Number.isFinite(maxValue) && String(rawMax).trim() !== "";
  if (!hasMin && !hasMax) return { min: "", max: "" };
  if (hasMin && hasMax && minValue > maxValue) {
    return { min: String(maxValue), max: String(minValue) };
  }
  return {
    min: hasMin ? String(minValue) : "",
    max: hasMax ? String(maxValue) : "",
  };
}

function buildProductsUrl({ powerSource, industries, torqueMin, torqueMax, thrustMin, thrustMax }) {
  const params = new URLSearchParams();
  if (powerSource) params.set("power_source", powerSource);
  if (industries.length) params.set("industries", industries.join(","));
  const normalizedTorque = normalizeTorqueBounds(torqueMin, torqueMax);
  const normalizedThrust = normalizeTorqueBounds(thrustMin, thrustMax);
  if (normalizedTorque.min) params.set("torque_min", normalizedTorque.min);
  if (normalizedTorque.max) params.set("torque_max", normalizedTorque.max);
  if (normalizedThrust.min) params.set("thrust_min", normalizedThrust.min);
  if (normalizedThrust.max) params.set("thrust_max", normalizedThrust.max);
  const query = params.toString();
  return query ? `${apiUrl(API_ENDPOINTS.products)}?${query}` : apiUrl(API_ENDPOINTS.products);
}

export default function ProductsPage({ initialPowerSourceSlug = "" }) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [powerSources, setPowerSources] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedPowerSource, setSelectedPowerSource] = useState(initialPowerSourceSlug);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [torqueMin, setTorqueMin] = useState("");
  const [torqueMax, setTorqueMax] = useState("");
  const [thrustMin, setThrustMin] = useState("");
  const [thrustMax, setThrustMax] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("featured");
  const lastFilterTrackSignatureRef = useRef("");

  useEffect(() => {
    setSelectedPowerSource(initialPowerSourceSlug || "");
  }, [initialPowerSourceSlug]);

  const searchParamsKey = searchParams?.toString() || "";

  useEffect(() => {
    const params = new URLSearchParams(searchParamsKey);
    const industriesParam = params.get("industries") || "";

    const queryIndustries = industriesParam
      .split(",")
      .map((slug) => slug.trim())
      .filter(Boolean);
    setSelectedIndustries(queryIndustries);
  }, [searchParamsKey]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadFilterOptions() {
      try {
        const [powerSourceRes, industriesRes] = await Promise.all([
          fetch(apiUrl(API_ENDPOINTS.powerSources), { signal: controller.signal }),
          fetch(apiUrl(API_ENDPOINTS.industries), { signal: controller.signal }),
        ]);

        if (!powerSourceRes.ok || !industriesRes.ok) {
          throw new Error("Failed to load filters.");
        }

        const [powerSourceJson, industriesJson] = await Promise.all([powerSourceRes.json(), industriesRes.json()]);
        if (!isMounted) return;
        setPowerSources(powerSourceJson.results || []);
        setIndustries(industriesJson.results || []);
      } catch (loadError) {
        if (loadError.name !== "AbortError" && isMounted) {
          setPowerSources([]);
          setIndustries([]);
        }
      }
    }

    loadFilterOptions();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchProducts() {
      setError("");
      setIsLoading(true);
      try {
        const response = await fetch(
          buildProductsUrl({
            powerSource: selectedPowerSource,
            industries: selectedIndustries,
            torqueMin: torqueMin.trim(),
            torqueMax: torqueMax.trim(),
            thrustMin: thrustMin.trim(),
            thrustMax: thrustMax.trim(),
          }),
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error("Failed to fetch products.");
        }

        const payload = await response.json();
        if (isMounted) {
          setProducts(payload.results || []);
        }
      } catch (fetchError) {
        if (fetchError.name !== "AbortError" && isMounted) {
          setError("Unable to load products right now.");
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [selectedPowerSource, selectedIndustries, torqueMin, torqueMax, thrustMin, thrustMax]);

  const selectedPowerSourceName = useMemo(
    () => powerSources.find((source) => source.slug === selectedPowerSource)?.name || "",
    [powerSources, selectedPowerSource],
  );

  const appliedFilters = useMemo(() => {
    const chips = [];
    const normalizedTorque = normalizeTorqueBounds(torqueMin, torqueMax);
    const normalizedThrust = normalizeTorqueBounds(thrustMin, thrustMax);
    if (selectedPowerSourceName) chips.push({ key: "power_source", label: `Power Source: ${selectedPowerSourceName}` });
    selectedIndustries.forEach((slug) => {
      const label = industries.find((item) => item.slug === slug)?.name || slug;
      chips.push({ key: `industry-${slug}`, label: `Industry: ${label}` });
    });
    if (normalizedTorque.min || normalizedTorque.max) {
      const torqueLabel =
        normalizedTorque.min && normalizedTorque.max
          ? `${normalizedTorque.min} - ${normalizedTorque.max} Nm`
          : `${normalizedTorque.min || normalizedTorque.max} Nm`;
      chips.push({
        key: "torque",
        label: `Torque: ${torqueLabel}`,
      });
    }
    if (normalizedThrust.min || normalizedThrust.max) {
      const thrustLabel =
        normalizedThrust.min && normalizedThrust.max
          ? `${normalizedThrust.min} - ${normalizedThrust.max} N`
          : `${normalizedThrust.min || normalizedThrust.max} N`;
      chips.push({
        key: "thrust",
        label: `Thrust: ${thrustLabel}`,
      });
    }
    return chips;
  }, [selectedPowerSourceName, selectedIndustries, industries, torqueMin, torqueMax, thrustMin, thrustMax]);

  const sortedProducts = useMemo(() => {
    const items = [...products];
    if (sortBy === "name_asc") {
      items.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
      return items;
    }
    if (sortBy === "name_desc") {
      items.sort((a, b) => (b?.name || "").localeCompare(a?.name || ""));
      return items;
    }
    if (sortBy === "latest") {
      items.sort((a, b) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime());
      return items;
    }
    return items;
  }, [products, sortBy]);

  const handlePowerSourceSelect = (slug) => {
    setSelectedPowerSource(slug);
  };

  const toggleIndustry = (slug) => {
    const next = selectedIndustries.includes(slug)
      ? selectedIndustries.filter((item) => item !== slug)
      : [...selectedIndustries, slug];
    setSelectedIndustries(next);
  };

  const clearFilters = () => {
    setSelectedPowerSource("");
    setSelectedIndustries([]);
    setTorqueMin("");
    setTorqueMax("");
    setThrustMin("");
    setThrustMax("");
  };

  useEffect(() => {
    if (isLoading || error) return undefined;

    const normalizedTorque = normalizeTorqueBounds(torqueMin, torqueMax);
    const normalizedThrust = normalizeTorqueBounds(thrustMin, thrustMax);
    const payload = {
      page: "products",
      power_source_slug: selectedPowerSource || null,
      power_source_name: powerSources.find((item) => item.slug === selectedPowerSource)?.name || "",
      industries: selectedIndustries,
      torque_min: normalizedTorque.min ? Number(normalizedTorque.min) : null,
      torque_max: normalizedTorque.max ? Number(normalizedTorque.max) : null,
      thrust_min: normalizedThrust.min ? Number(normalizedThrust.min) : null,
      thrust_max: normalizedThrust.max ? Number(normalizedThrust.max) : null,
      results_count: products.length,
    };

    const signature = JSON.stringify(payload);
    if (signature === lastFilterTrackSignatureRef.current) return undefined;

    const timerId = window.setTimeout(() => {
      if (signature !== lastFilterTrackSignatureRef.current) {
        trackEvent("product_filters_applied", payload);
        lastFilterTrackSignatureRef.current = signature;
      }
    }, 600);

    return () => window.clearTimeout(timerId);
  }, [
    isLoading,
    error,
    selectedPowerSource,
    selectedIndustries,
    torqueMin,
    torqueMax,
    thrustMin,
    thrustMax,
    products.length,
    powerSources,
  ]);

  return (
    <>
      <Navbar />
      <main className="bg-steel-50">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-steel-200 pb-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-700">Product Catalogue</p>
              <h1 className="text-3xl font-bold tracking-tight text-steel-900 sm:text-4xl">Products</h1>
            </div>
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className="rounded-md border border-steel-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-steel-700 lg:hidden"
            >
              {isFilterOpen ? "Hide Filters" : "Show Filters"}
            </button>
          </div>

          <div className="mt-4 flex h-12 items-center gap-3 rounded-md border border-steel-200 bg-white px-3">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-widest text-steel-700">
              Filters
            </span>
            <div className="scrollbar-hide min-w-0 flex-1 overflow-x-auto">
              {appliedFilters.length ? (
                <div className="inline-flex items-center gap-2 whitespace-nowrap">
                  {appliedFilters.map((chip) => (
                    <span
                      key={chip.key}
                      className="shrink-0 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs text-brand-700 transition"
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-steel-500">No active filters</span>
              )}
            </div>
            {appliedFilters.length ? (
              <button
                type="button"
                onClick={clearFilters}
                className="shrink-0 rounded-full border border-steel-300 bg-white px-3 py-1 text-xs text-steel-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              >
                Clear
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside
              className={`scrollbar-hide block rounded-xl border border-steel-200 bg-white p-4 transition-all duration-300 ease-out max-lg:overflow-hidden lg:sticky lg:top-24 lg:max-h-[calc(100vh-7.5rem)] lg:overflow-y-auto ${
                isFilterOpen
                  ? "max-lg:pointer-events-auto max-lg:max-h-[70vh] max-lg:opacity-100 max-lg:translate-y-0 max-lg:p-4 max-lg:border-steel-200"
                  : "max-lg:pointer-events-none max-lg:max-h-0 max-lg:opacity-0 max-lg:-translate-y-1 max-lg:p-0 max-lg:border-transparent lg:opacity-100 lg:translate-y-0"
              }`}
            >
              <h2 className="text-sm font-semibold text-steel-900">Filters</h2>

              <div className="mt-4 border-t border-steel-100 pt-4 first:border-t-0 first:pt-0">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-steel-600">Power Source</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handlePowerSourceSelect("")}
                    className={`rounded-md border px-2.5 py-1.5 text-xs ${
                      !selectedPowerSource ? "border-brand-500 bg-brand-50 text-brand-700" : "border-steel-300 text-steel-700 hover:border-steel-400"
                    }`}
                  >
                    All
                  </button>
                  {powerSources.map((source) => (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => handlePowerSourceSelect(source.slug)}
                      className={`rounded-md border px-2.5 py-1.5 text-xs ${
                        selectedPowerSource === source.slug
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-steel-300 text-steel-700 hover:border-steel-400"
                      }`}
                    >
                      {source.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 border-t border-steel-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-steel-600">Industry</p>
                <div className="scrollbar-hide mt-2 max-h-44 space-y-2 overflow-auto pr-1">
                  {industries.map((industry) => (
                    <label
                      key={industry.id}
                      className="group flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-sm text-steel-700 transition hover:bg-steel-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIndustries.includes(industry.slug)}
                        onChange={() => toggleIndustry(industry.slug)}
                        className="peer sr-only"
                      />
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-steel-300 bg-white transition peer-checked:border-brand-500 peer-checked:bg-brand-500 group-hover:border-steel-400">
                        <svg
                          viewBox="0 0 16 16"
                          className="h-3 w-3 text-white opacity-0 transition peer-checked:opacity-100"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3.5 8 6.5 11 12.5 5" />
                        </svg>
                      </span>
                      <span className="leading-snug">{industry.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-5 border-t border-steel-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-steel-600">Torque (Nm)</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    id="torque-min-filter"
                    type="number"
                    min="0"
                    step="any"
                    value={torqueMin}
                    onChange={(event) => setTorqueMin(event.target.value)}
                    placeholder="Min"
                    className="w-full rounded-md border border-steel-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                  <input
                    id="torque-max-filter"
                    type="number"
                    min="0"
                    step="any"
                    value={torqueMax}
                    onChange={(event) => setTorqueMax(event.target.value)}
                    placeholder="Max"
                    className="w-full rounded-md border border-steel-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              </div>

              <div className="mt-4 border-t border-steel-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-steel-600">Thrust (N)</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    id="thrust-min-filter"
                    type="number"
                    min="0"
                    step="any"
                    value={thrustMin}
                    onChange={(event) => setThrustMin(event.target.value)}
                    placeholder="Min"
                    className="w-full rounded-md border border-steel-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                  <input
                    id="thrust-max-filter"
                    type="number"
                    min="0"
                    step="any"
                    value={thrustMax}
                    onChange={(event) => setThrustMax(event.target.value)}
                    placeholder="Max"
                    className="w-full rounded-md border border-steel-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              </div>
            </aside>

            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-steel-200 bg-white px-3 py-2.5">
                <p className="text-sm font-medium text-steel-700">
                  {!isLoading && !error ? (
                    <>
                      <span className="font-semibold text-steel-900">{sortedProducts.length}</span> products found
                    </>
                  ) : (
                    "Loading catalogue..."
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <label htmlFor="products-sort" className="text-xs font-semibold uppercase tracking-[0.08em] text-steel-500">
                    Sort
                  </label>
                  <select
                    id="products-sort"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="rounded-md border border-steel-200 bg-white px-2.5 py-1.5 text-sm text-steel-700 outline-none transition focus:border-brand-500"
                  >
                    <option value="featured">Featured</option>
                    <option value="latest">Latest</option>
                    <option value="name_asc">Name A-Z</option>
                    <option value="name_desc">Name Z-A</option>
                  </select>
                </div>
              </div>

              {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
              {isLoading ? (
                <div className="mt-1 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={`product-skeleton-${index}`}
                      className="overflow-hidden rounded-xl border border-steel-200 bg-white"
                    >
                      <div className="products-skeleton-shimmer h-52 w-full bg-steel-100" />
                      <div className="space-y-2 p-4">
                        <div className="products-skeleton-shimmer h-3 w-24 rounded bg-steel-100" />
                        <div className="products-skeleton-shimmer h-5 w-5/6 rounded bg-steel-100" />
                        <div className="products-skeleton-shimmer h-4 w-full rounded bg-steel-100" />
                        <div className="products-skeleton-shimmer h-4 w-4/5 rounded bg-steel-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {!isLoading && !error && products.length === 0 ? (
                <p className="rounded-md border border-steel-200 bg-white px-3 py-2 text-sm text-steel-700">
                  No products found for applied filters.
                </p>
              ) : null}

              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {sortedProducts.map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/product/${encodeURIComponent(product.slug || "product")}-${encodeURIComponent(product.id)}`}
                    onClick={() =>
                      trackEvent("product_click", {
                        product_id: product.id,
                        product_slug: product.slug || "",
                        product_name: product.name || "",
                        power_source_slug: product.power_source?.slug || selectedPowerSource || "",
                        power_source_name: product.power_source?.name || "",
                        source_section: "products_grid",
                        position: index + 1,
                      })
                    }
                    className="products-grid-card group flex h-full flex-col overflow-hidden rounded-xl border border-steel-200 bg-white"
                  >
                    <div className="relative h-52 w-full overflow-hidden bg-steel-100">
                      <Image
                        src={product.image_url || FALLBACK_IMAGE}
                        alt={product.name}
                        fill
                        unoptimized
                        sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="products-grid-card-image h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-steel-950/30 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">
                        {product.power_source?.name || "Product"}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold leading-tight tracking-tight text-steel-900">
                        {product.name}
                      </h2>
                      <p className="mt-2 overflow-hidden text-sm leading-relaxed text-steel-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                        {product.short_summary || "No summary available."}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
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
