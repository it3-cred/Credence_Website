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
  const filterTrackTimeoutRef = useRef(null);
  const lastFilterTrackRef = useRef("");

  useEffect(() => {
    setSelectedPowerSource(initialPowerSourceSlug || "");
  }, [initialPowerSourceSlug]);

  useEffect(() => {
    const queryIndustries = (searchParams.get("industries") || "")
      .split(",")
      .map((slug) => slug.trim())
      .filter(Boolean);
    setSelectedIndustries(queryIndustries);
  }, [searchParams]);

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

  useEffect(() => {
    if (isLoading) return;
    const normalizedTorque = normalizeTorqueBounds(torqueMin, torqueMax);
    const normalizedThrust = normalizeTorqueBounds(thrustMin, thrustMax);
    const payload = {
      page: "products",
      power_source_slug: selectedPowerSource || null,
      industries: selectedIndustries,
      torque_min: normalizedTorque.min ? Number(normalizedTorque.min) : null,
      torque_max: normalizedTorque.max ? Number(normalizedTorque.max) : null,
      thrust_min: normalizedThrust.min ? Number(normalizedThrust.min) : null,
      thrust_max: normalizedThrust.max ? Number(normalizedThrust.max) : null,
      results_count: products.length,
    };
    const signature = JSON.stringify(payload);
    if (signature === lastFilterTrackRef.current) return;

    if (filterTrackTimeoutRef.current) {
      window.clearTimeout(filterTrackTimeoutRef.current);
    }
    filterTrackTimeoutRef.current = window.setTimeout(() => {
      trackEvent("product_filters_applied", payload);
      lastFilterTrackRef.current = signature;
    }, 600);

    return () => {
      if (filterTrackTimeoutRef.current) {
        window.clearTimeout(filterTrackTimeoutRef.current);
        filterTrackTimeoutRef.current = null;
      }
    };
  }, [
    isLoading,
    selectedPowerSource,
    selectedIndustries,
    torqueMin,
    torqueMax,
    thrustMin,
    thrustMax,
    products.length,
  ]);

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

  return (
    <>
      <Navbar />
      <main className="bg-steel-50">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-steel-200 pb-5">
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
            <div className="min-w-0 flex-1 overflow-x-auto">
              {appliedFilters.length ? (
                <div className="inline-flex items-center gap-2 whitespace-nowrap">
                  {appliedFilters.map((chip) => (
                    <span key={chip.key} className="shrink-0 rounded-full border border-steel-300 bg-white px-3 py-1 text-xs text-steel-700">
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
                className="shrink-0 rounded-full border border-steel-300 bg-white px-3 py-1 text-xs text-steel-700 hover:bg-steel-100"
              >
                Clear
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className={`${isFilterOpen ? "block" : "hidden"} rounded-xl border border-steel-200 bg-white p-4 max-lg:max-h-[70vh] max-lg:overflow-y-auto lg:sticky lg:top-24 lg:block lg:h-[calc(100vh-7.5rem)] lg:overflow-y-auto`}>
              <h2 className="text-sm font-semibold text-steel-900">Filters</h2>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-steel-600">Power Source</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handlePowerSourceSelect("")}
                    className={`rounded-md border px-2.5 py-1.5 text-xs ${
                      !selectedPowerSource ? "border-brand-500 bg-brand-50 text-brand-700" : "border-steel-300 text-steel-700"
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
                          : "border-steel-300 text-steel-700"
                      }`}
                    >
                      {source.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-steel-600">Industry</p>
                <div className="mt-2 max-h-44 space-y-2 overflow-auto pr-1">
                  {industries.map((industry) => (
                    <label key={industry.id} className="flex items-center gap-2 text-sm text-steel-700">
                      <input
                        type="checkbox"
                        checked={selectedIndustries.includes(industry.slug)}
                        onChange={() => toggleIndustry(industry.slug)}
                      />
                      <span>{industry.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-5">
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
                    className="w-full rounded-md border border-steel-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                  <input
                    id="torque-max-filter"
                    type="number"
                    min="0"
                    step="any"
                    value={torqueMax}
                    onChange={(event) => setTorqueMax(event.target.value)}
                    placeholder="Max"
                    className="w-full rounded-md border border-steel-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="mt-5">
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
                    className="w-full rounded-md border border-steel-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                  <input
                    id="thrust-max-filter"
                    type="number"
                    min="0"
                    step="any"
                    value={thrustMax}
                    onChange={(event) => setThrustMax(event.target.value)}
                    placeholder="Max"
                    className="w-full rounded-md border border-steel-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </aside>

            <div>
              {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
              {isLoading ? <p className="text-sm text-steel-700">Loading products...</p> : null}
              {!isLoading && !error && products.length === 0 ? (
                <p className="rounded-md border border-steel-200 bg-white px-3 py-2 text-sm text-steel-700">
                  No products found for applied filters.
                </p>
              ) : null}

              <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/product/${encodeURIComponent(product.slug || "product")}-${encodeURIComponent(product.id)}`}
                    onClick={() =>
                      trackEvent("product_click", {
                        product_id: product.id,
                        product_slug: product.slug || "",
                        product_name: product.name || "",
                        power_source_slug: product.power_source?.slug || null,
                        source_section: "products_grid",
                        position: index + 1,
                      })
                    }
                    className="overflow-hidden rounded-xl border border-steel-200 bg-white transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="relative h-52 w-full bg-steel-100">
                      <Image
                        src={product.image_url || FALLBACK_IMAGE}
                        alt={product.name}
                        fill
                        unoptimized
                        sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="space-y-2 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">
                        {product.power_source?.name || "Product"}
                      </p>
                      <h2 className="text-lg font-semibold leading-tight text-steel-900">{product.name}</h2>
                      <p className="overflow-hidden text-sm leading-snug text-steel-700 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
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
