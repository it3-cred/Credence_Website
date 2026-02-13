"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function DistributorsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-steel-50">
        <section className="mx-auto min-h-[calc(100vh-220px)] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            Coming Soon
          </p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight text-steel-900 sm:text-5xl">
            Distributors
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-steel-600 sm:text-base">
            Distributor catalogue and regional network details will be added here.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
