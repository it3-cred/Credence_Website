"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { API_ENDPOINTS, apiUrl } from "@/lib/api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1600&q=80&auto=format&fit=crop";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchProducts() {
      setError("");
      setIsLoading(true);
      try {
        const response = await fetch(apiUrl(API_ENDPOINTS.products), {
          signal: controller.signal,
        });
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
  }, []);

  return (
    <>
      <Navbar />
      <main className="bg-steel-50">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">Product Catalogue</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-[0.95] tracking-tight text-steel-900 sm:text-5xl">
            Our
            <br />
            <span className="text-brand-500">Products</span>
          </h1>

          {error ? <p className="mt-5 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
          {isLoading ? <p className="mt-5 text-sm font-medium text-steel-700">Loading products...</p> : null}
          {!isLoading && !error && products.length === 0 ? (
            <p className="mt-5 rounded-md bg-white px-3 py-2 text-sm font-medium text-steel-800">No visible products found.</p>
          ) : null}

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                  <Link
                    href="#"
                    className="mt-4 inline-flex rounded-md border border-brand-300 bg-brand-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-700 transition hover:bg-brand-500 hover:text-white"
                  >
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <div className="-mt-16">
        <Footer />
      </div>
    </>
  );
}
