"use client";

export default function DistributorsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-steel-50">
      <main className="flex flex-1 items-center bg-steel-50">
        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="mx-auto flex min-h-[50vh] max-w-4xl items-center justify-center">
            <div className="w-full border-y border-steel-200 px-4 py-10 text-center sm:px-6 sm:py-12">
              <p className="text-fade text-fade-delay-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
                Distributors
              </p>
              <h1 className="text-fade text-fade-delay-2 mt-2 text-4xl font-extrabold leading-tight tracking-tight text-steel-900 sm:text-5xl lg:text-6xl">
                Interested in becoming our distributor?
              </h1>
              <p className="text-fade text-fade-delay-3 mx-auto mt-4 max-w-[50ch] text-base leading-relaxed text-steel-600 sm:text-lg">
                We are expanding our distributor network. If you would like to partner with Credence,
                send us your company details and region of interest by email.
              </p>

              <div className="text-fade text-fade-delay-4 mt-6 flex flex-wrap items-center justify-center gap-2">
                <a
                  href="mailto:webcred@credenceautomation.com?subject=Distributor%20Partnership%20Inquiry"
                  className="inline-flex items-center rounded-md border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-500 hover:text-white"
                >
                  Email Us
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <style jsx>{`
        @keyframes textFadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .text-fade {
          opacity: 0;
          animation: textFadeInUp 420ms ease-out forwards;
        }
        .text-fade-delay-1 {
          animation-delay: 60ms;
        }
        .text-fade-delay-2 {
          animation-delay: 120ms;
        }
        .text-fade-delay-3 {
          animation-delay: 180ms;
        }
        .text-fade-delay-4 {
          animation-delay: 240ms;
        }
        @media (prefers-reduced-motion: reduce) {
          .text-fade {
            opacity: 1;
            animation: none;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
