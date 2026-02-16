"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { API_ENDPOINTS, apiUrl } from "@/lib/api";

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

function buildProductsUrl({ powerSource, industries, torqueMin, torqueMax }) {
  const params = new URLSearchParams();
  if (powerSource) params.set("power_source", powerSource);
  if (industries.length) params.set("industries", industries.join(","));
  const normalized = normalizeTorqueBounds(torqueMin, torqueMax);
  if (normalized.min) params.set("torque_min", normalized.min);
  if (normalized.max) params.set("torque_max", normalized.max);
  const query = params.toString();
  return query ? `${apiUrl(API_ENDPOINTS.products)}?${query}` : apiUrl(API_ENDPOINTS.products);
}

export default function ProductsPage({ initialPowerSourceSlug = "" }) {
  const router = useRouter();
  const pathname = usePathname();
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

  useEffect(() => {
    setSelectedPowerSource(initialPowerSourceSlug || "");
  }, [initialPowerSourceSlug]);

  useEffect(() => {
    const fromQueryIndustries = searchParams.get("industries");
    const fromQueryTorqueMin = searchParams.get("torque_min");
    const fromQueryTorqueMax = searchParams.get("torque_max");
    setSelectedIndustries(fromQueryIndustries ? fromQueryIndustries.split(",").filter(Boolean) : []);
    setTorqueMin(fromQueryTorqueMin || "");
    setTorqueMax(fromQueryTorqueMax || "");
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
  }, [selectedPowerSource, selectedIndustries, torqueMin, torqueMax]);

  const selectedPowerSourceName = useMemo(
    () => powerSources.find((source) => source.slug === selectedPowerSource)?.name || "",
    [powerSources, selectedPowerSource],
  );

  const appliedFilters = useMemo(() => {
    const chips = [];
    const normalizedTorque = normalizeTorqueBounds(torqueMin, torqueMax);
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
    return chips;
  }, [selectedPowerSourceName, selectedIndustries, industries, torqueMin, torqueMax]);

  const updateUrlQuery = (nextIndustries, nextTorqueMin, nextTorqueMax) => {
    const params = new URLSearchParams();
    if (nextIndustries.length) params.set("industries", nextIndustries.join(","));
    const normalizedTorque = normalizeTorqueBounds(nextTorqueMin, nextTorqueMax);
    if (normalizedTorque.min) params.set("torque_min", normalizedTorque.min);
    if (normalizedTorque.max) params.set("torque_max", normalizedTorque.max);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const handlePowerSourceSelect = (slug) => {
    const targetPath = slug ? `/products/${slug}` : "/products";
    const params = new URLSearchParams(searchParams.toString());
    router.push(params.toString() ? `${targetPath}?${params.toString()}` : targetPath);
  };

  const toggleIndustry = (slug) => {
    const next = selectedIndustries.includes(slug)
      ? selectedIndustries.filter((item) => item !== slug)
      : [...selectedIndustries, slug];
    setSelectedIndustries(next);
    updateUrlQuery(next, torqueMin, torqueMax);
  };

  const handleTorqueMinChange = (value) => {
    setTorqueMin(value);
    updateUrlQuery(selectedIndustries, value, torqueMax);
  };

  const handleTorqueMaxChange = (value) => {
    setTorqueMax(value);
    updateUrlQuery(selectedIndustries, torqueMin, value);
  };

  const clearFilters = () => {
    setSelectedIndustries([]);
    setTorqueMin("");
    setTorqueMax("");
    updateUrlQuery([], "", "");
    router.push("/products");
  };

  return (
    <>
      <Navbar />
      <main className="bg-steel-50">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">Product Catalogue</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-[0.95] tracking-tight text-steel-900 sm:text-5xl">
            Our 
            <span className="text-brand-500">Products</span>
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {appliedFilters.map((chip) => (
              <span key={chip.key} className="rounded-full border border-brand-300 bg-white px-3 py-1 text-xs font-medium text-brand-700">
                {chip.label}
              </span>
            ))}
            {appliedFilters.length ? (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Clear All
              </button>
            ) : null}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-brand-200 bg-white p-4">
              <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-steel-900">Filters</h2>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">Power Source</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handlePowerSourceSelect("")}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                      !selectedPowerSource ? "border-brand-500 bg-brand-50 text-brand-700" : "border-zinc-300 text-zinc-700"
                    }`}
                  >
                    All
                  </button>
                  {powerSources.map((source) => (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => handlePowerSourceSelect(source.slug)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                        selectedPowerSource === source.slug
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-zinc-300 text-zinc-700"
                      }`}
                    >
                      {source.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">Industry</p>
                <div className="mt-2 space-y-2">
                  {industries.map((industry) => (
                    <label key={industry.id} className="flex items-center gap-2 text-sm text-zinc-700">
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
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">Torque Range (Nm)</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    id="torque-min-filter"
                    type="number"
                    min="0"
                    step="any"
                    value={torqueMin}
                    onChange={(event) => handleTorqueMinChange(event.target.value)}
                    placeholder="Min"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                  <input
                    id="torque-max-filter"
                    type="number"
                    min="0"
                    step="any"
                    value={torqueMax}
                    onChange={(event) => handleTorqueMaxChange(event.target.value)}
                    placeholder="Max"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </aside>

            <div>
              {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
              {isLoading ? <p className="text-sm font-medium text-steel-700">Loading products...</p> : null}
              {!isLoading && !error && products.length === 0 ? (
                <p className="rounded-md bg-white px-3 py-2 text-sm font-medium text-steel-800">No products found for applied filters.</p>
              ) : null}

              <div className="mt-3 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <article key={product.id} className="overflow-hidden rounded-2xl border border-brand-200 bg-white">
                    <div className="h-60 w-full bg-steel-200">
                      <img
                        src={product.image_url || FALLBACK_IMAGE}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">
                        {product.power_source?.name || "Product"}
                      </p>
                      <h2 className="mt-1 text-xl font-bold leading-tight text-steel-900">{product.name}</h2>
                      <p className="mt-2 overflow-hidden text-ellipsis text-sm leading-snug text-steel-700 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]">
                        {product.short_summary || "No summary available."}
                      </p>
                    </div>
                  </article>
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
