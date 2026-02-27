"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";

const productLinks = [
  "Scotch Yoke Pneumatic Actuators",
  "Scotch Yoke Hydraulic Actuators",
  "Gas Over Oil Rotary Actuators",
  "Gas Over Oil Linear Actuators",
  "Linear Pneumatic Actuators",
  "Linear Hydraulic Actuators",
  "Gear Box",
];

const siteLinks = [
  { site: "Home", href: "/" },
  { site: "About Us", href: "/about" },
  { site: "Products", href: "/products" },
  { site: "Distributors", href: "/distributors" },
  { site: "Careers", href: "/careers" },
  { site: "News", href: "/news" },
];

function Footer() {
  return (
    <footer className="mt-10 border-t-2 border-brand-200 bg-steel-50 sm:mt-16">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr_1.2fr] lg:gap-8">
          <section className="border-b border-brand-200 pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-7">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/logo.jpg"
                alt="Credence Automation and Control Systems"
                width={320}
                height={70}
                style={{ width: "auto" }}
                className="h-10 w-auto rounded-sm bg-white/90 p-0.5 sm:h-12"
              />
            </Link>

            <p className="mt-3 text-sm leading-relaxed text-steel-700">
              Connect with our expert team for products, services and technical guidance
              to improve plant performance and safety.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href="/request-quote"
                className="inline-flex items-center rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Contact Us
              </Link>

              {[
                {
                  label: "LinkedIn",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                      <path d="M6.94 8.5A1.57 1.57 0 1 1 6.94 5.36a1.57 1.57 0 0 1 0 3.14ZM5.57 9.7h2.75V18H5.57V9.7Zm4.34 0h2.64v1.14h.04c.37-.7 1.26-1.44 2.6-1.44 2.78 0 3.3 1.83 3.3 4.2V18h-2.75v-3.9c0-.93-.02-2.12-1.3-2.12-1.3 0-1.5 1-1.5 2.05V18H9.9V9.7Z" />
                    </svg>
                  ),
                },
                {
                  label: "WhatsApp",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                      <path d="M20.52 3.48A11.87 11.87 0 0 0 12.07 0C5.56 0 .27 5.29.27 11.8c0 2.08.54 4.11 1.58 5.89L0 24l6.51-1.71a11.73 11.73 0 0 0 5.56 1.42h.01c6.5 0 11.79-5.29 11.79-11.8 0-3.15-1.23-6.12-3.35-8.43ZM12.08 21.7h-.01a9.85 9.85 0 0 1-5-1.37l-.36-.21-3.86 1.01 1.03-3.77-.24-.39A9.8 9.8 0 0 1 2.27 11.8C2.27 6.4 6.67 2 12.07 2c2.62 0 5.09 1.02 6.94 2.87a9.73 9.73 0 0 1 2.86 6.93c0 5.4-4.39 9.9-9.79 9.9Zm5.43-7.38c-.3-.15-1.78-.88-2.06-.98-.27-.1-.47-.15-.66.15-.2.3-.76.98-.94 1.18-.17.2-.35.22-.65.07-.3-.15-1.24-.46-2.37-1.47-.88-.79-1.47-1.76-1.64-2.06-.17-.3-.02-.47.13-.62.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.25-.6-.5-.52-.66-.52h-.56c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.1 4.49.71.31 1.27.5 1.7.65.72.23 1.37.2 1.88.12.57-.08 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
                    </svg>
                  ),
                },
                {
                  label: "YouTube",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A100 100 0 0 1 7.858 2zM6.4 5.209v4.818l4.157-2.408z" />
                    </svg>
                  ),
                },
                {
                  label: "Facebook",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951" />
                    </svg>
                  ),
                },
                {
                  label: "X",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
                    </svg>
                  ),
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-brand-200 bg-transparent text-brand-700 transition hover:bg-brand-500 hover:text-white sm:h-10 sm:w-10"
                >
                  {social.icon}
                </a>
              ))}
            </div>

            <div className="mt-3 border-t border-brand-100 pt-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
                Quick Links
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                {siteLinks.map((link) => (
                  <li key={link.site}>
                    <Link href={link.href} className="text-steel-700 transition hover:text-brand-700">
                      {link.site}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="border-b border-brand-200 pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
                Product Lines
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight text-steel-900">
                Explore Product Categories
              </h3>
            </div>

            <ul className="mt-2 space-y-1 sm:mt-3 sm:space-y-2">
              {productLinks.map((item) => (
                <li key={item}>
                  <Link
                    href="/products"
                    className="group flex items-start justify-between gap-3 rounded-md px-1.5 py-1.5 text-sm text-steel-700 transition hover:bg-white/70 hover:text-steel-900 sm:px-2 sm:py-2"
                  >
                    <span>{item}</span>
                    <span className="mt-0.5 text-brand-500 opacity-0 transition group-hover:opacity-100">
                      {"->"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
              Visit Us
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-steel-900">
              Credence Automation and Control Systems
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-steel-600">
              Pune, Maharashtra, India. Reach out for actuator automation, controls and valve
              integration support.
            </p>

            <div className="relative z-20 mt-2.5 overflow-hidden rounded-xl border border-brand-200 bg-white">
              <iframe
                title="Credence location map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3779.3857367349196!2d73.78886597524102!3d18.691540882435472!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2b7e5dba049c1%3A0x37607f5ae62d0128!2sCredence%20Automation%20and%20Control%20Systems%20Private%20Limited!5e0!3m2!1sen!2sin!4v1770626426124!5m2!1sen!2sin"
                className="pointer-events-auto h-40 w-full sm:h-56 md:h-60"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                tabIndex={0}
                style={{ border: 0 }}
              />
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2">
              <Link
                href="/distributors"
                className="inline-flex items-center rounded-md border border-brand-200 bg-transparent px-3 py-1.5 text-sm font-medium text-steel-700 transition hover:bg-white hover:text-brand-700 sm:py-2"
              >
                Find Distributors
              </Link>
              <Link
                href="/news"
                className="inline-flex items-center rounded-md border border-brand-200 bg-transparent px-3 py-1.5 text-sm font-medium text-steel-700 transition hover:bg-white hover:text-brand-700 sm:py-2"
              >
                Latest News
              </Link>
            </div>
          </section>
        </div>
      </div>

      <div className="border-t border-brand-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-2.5 text-[11px] text-steel-600 sm:px-6 sm:py-3 sm:text-xs lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>Copyright (c) 2026 Credence Automation Control Systems Private Limited</p>
          <p className="text-steel-700">Engineered for industrial automation reliability</p>
        </div>
      </div>
    </footer>
  );
}

export default memo(Footer);
