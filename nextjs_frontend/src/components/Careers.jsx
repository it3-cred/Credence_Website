"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CareersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-steel-50">
      <Navbar />
      <main className="flex flex-1 items-center bg-steel-50">
        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center">
            <div className="w-full border-y border-steel-200 px-4 py-10 text-center sm:px-6 sm:py-12">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
                Careers
              </p>
              <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-tight text-steel-900 sm:text-5xl lg:text-6xl">
                No openings right now
              </h1>
              <p className="mx-auto mt-4 max-w-[46ch] text-base leading-relaxed text-steel-600 sm:text-lg">
                We do not have active job openings at the moment. Please check again after some time
                for future opportunities.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-md border border-steel-300 bg-steel-50 px-4 py-2 text-sm font-semibold text-steel-800 transition hover:border-brand-200 hover:text-brand-700"
                >
                  Back to Home
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center rounded-md border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-500 hover:text-white"
                >
                  About Credence
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
