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
  { site: "Home", href: "#" },
  { site: "About Us", href: "#" },
  { site: "Products", href: "/products" },
  { site: "Distributors", href: "/distributors" },
  { site: "Carrers", href: "/careers" },
  { site: "News", href: "/news" },
];

export default function Footer() {
  return (
    <footer className="mt-16">
      <div className="bg-steel-200 to-white text-steel-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.7fr]">
            <section className="border-b border-[#ff2301]! pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-10">
              <Link href="/" className="inline-flex items-center">
                <Image
                  src="/logo.jpg"
                  alt="Credence Automation and Control Systems"
                  width={320}
                  height={70}
                  style={{ width: "auto" }}
                  className="h-14 w-auto rounded-sm bg-white/70 p-1"
                />
              </Link>

              <p className="mt-6 max-w-sm text-sm leading-relaxed text-steel-900">
                Connect with our expert team for products, services, and
                technical guidance to improve performance and safety.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
                >
                  Contact Us
                </button>
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#ff2301]! text-brand-700 transition hover:bg-brand-500 hover:text-white"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M6.94 8.5A1.57 1.57 0 1 1 6.94 5.36a1.57 1.57 0 0 1 0 3.14ZM5.57 9.7h2.75V18H5.57V9.7Zm4.34 0h2.64v1.14h.04c.37-.7 1.26-1.44 2.6-1.44 2.78 0 3.3 1.83 3.3 4.2V18h-2.75v-3.9c0-.93-.02-2.12-1.3-2.12-1.3 0-1.5 1-1.5 2.05V18H9.9V9.7Z" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="WhatsApp"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#ff2301]! text-brand-700 transition hover:bg-brand-500 hover:text-white"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M20.52 3.48A11.87 11.87 0 0 0 12.07 0C5.56 0 .27 5.29.27 11.8c0 2.08.54 4.11 1.58 5.89L0 24l6.51-1.71a11.73 11.73 0 0 0 5.56 1.42h.01c6.5 0 11.79-5.29 11.79-11.8 0-3.15-1.23-6.12-3.35-8.43ZM12.08 21.7h-.01a9.85 9.85 0 0 1-5-1.37l-.36-.21-3.86 1.01 1.03-3.77-.24-.39A9.8 9.8 0 0 1 2.27 11.8C2.27 6.4 6.67 2 12.07 2c2.62 0 5.09 1.02 6.94 2.87a9.73 9.73 0 0 1 2.86 6.93c0 5.4-4.39 9.9-9.79 9.9Zm5.43-7.38c-.3-.15-1.78-.88-2.06-.98-.27-.1-.47-.15-.66.15-.2.3-.76.98-.94 1.18-.17.2-.35.22-.65.07-.3-.15-1.24-.46-2.37-1.47-.88-.79-1.47-1.76-1.64-2.06-.17-.3-.02-.47.13-.62.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.25-.6-.5-.52-.66-.52h-.56c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.1 4.49.71.31 1.27.5 1.7.65.72.23 1.37.2 1.88.12.57-.08 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="WhatsApp"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#ff2301]! text-brand-700 transition hover:bg-brand-500 hover:text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A100 100 0 0 1 7.858 2zM6.4 5.209v4.818l4.157-2.408z" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="WhatsApp"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#ff2301]! text-brand-700 transition hover:bg-brand-500 hover:text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="WhatsApp"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#ff2301]! text-brand-700 transition hover:bg-brand-500 hover:text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
                  </svg>
                </a>
              </div>
            </section>

            <section className="space-y-6">
              <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
                    Location
                  </p>
                  <div className="overflow-hidden rounded-md border border-[#ff2301]!/80 bg-white shadow-sm">
                    <iframe
                      title="Credence location map"
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3779.3857367349196!2d73.78886597524102!3d18.691540882435472!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2b7e5dba049c1%3A0x37607f5ae62d0128!2sCredence%20Automation%20and%20Control%20Systems%20Private%20Limited!5e0!3m2!1sen!2sin!4v1770626426124!5m2!1sen!2sin"
                      className="h-44 w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold tracking-tight">
                    Products
                  </h3>
                  <ul className="mt-3 space-y-1.5 text-sm text-steel-900">
                    {productLinks.map((item) => (
                      <li key={item}>
                        <a href="#" className="transition hover:text-brand-700">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-t border-t-[#ff2301]! pt-5">
                <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  {siteLinks.map((link) => (
                    <li key={link.site}>
                      <Link href={link.href} className="text-steel-900 transition hover:text-brand-700">
                        <p>{link.site}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="bg-steel-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-black sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>
            Copyright (c) 2026 Credence Automation Control Systems Private
            Limited
          </p>
          <p className="text-black">
            Engineered for industrial automation reliability
          </p>
        </div>
      </div>
    </footer>
  );
}
