"use client";

import { useState } from "react";
import Image from "next/image";

const navItems = [
  { label: "Products", href: "#" },
  { label: "Solutions", href: "#" },
  { label: "Resources", href: "#" },
  { label: "News", href: "#" },
  { label: "Distributors", href: "#" },
  { label: "Careers", href: "#" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center">
          <Image
            src="/logo.jpg"
            alt="Credence logo"
            width={140}
            height={40}
            priority
            style={{ width: "auto" }}
            className="h-9 w-auto sm:h-10"
          />
        </a>

        <ul
          className={`hidden items-center transition-all duration-300 lg:flex ${isDesktopSearchOpen ? "gap-4" : "gap-6"}`}
        >
          {navItems.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="text-base font-medium text-zinc-700 transition ease-in-out hover:text-[#FF2300]"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex items-center">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center cursor-pointer justify-center rounded-md border border-zinc-300 text-zinc-800 transition hover:bg-zinc-50"
              onClick={() => setIsDesktopSearchOpen((prev) => !prev)}
              aria-expanded={isDesktopSearchOpen}
              aria-label="Toggle desktop search"
            >
              <svg
                className="h-4 w-4 text-zinc-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
            <div
              className={`ml-2 overflow-hidden transition-all duration-300 ${isDesktopSearchOpen ? "w-52 opacity-100" : "w-0 opacity-0"}`}
            >
              <div className="flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3">
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-500"
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md cursor-pointer border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            Login / Register
          </button>
          <button
            type="button"
            className="rounded-md border-2 border-transparent cursor-pointer bg-[#FF2300] px-4 py-2 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[0.98] hover:border-[#FF2300] hover:bg-white hover:text-[#FF2300]"
          >
            Request Quote
          </button>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <button
            type="button"
            className="inline-flex items-center rounded-md p-2 text-zinc-800"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            aria-expanded={isSearchOpen}
            aria-label="Toggle search"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>

          <button
            type="button"
            className="inline-flex items-center rounded-md border border-zinc-300 p-2 text-zinc-800"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {isSearchOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 py-3 lg:hidden sm:px-6">
          <div className="flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3">
            <svg
              className="h-4 w-4 text-zinc-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-500"
            />
          </div>
        </div>
      )}

      {isOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 py-4 lg:hidden sm:px-6">
          <ul className="flex flex-col gap-3">
            {navItems.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="block rounded-md px-2 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Login / Register
            </button>
            <button
              type="button"
              className="rounded-md bg-[#FF2300] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e21f00]"
            >
              Request Quote
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
