"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const navItems = [
  { label: "Products", href: "/products" },
  // { label: "Solutions", href: "#" },
  { label: "Resources", href: "#" },
  { label: "News", href: "/news" },
  { label: "Distributors", href: "/distributors" },
  { label: "Careers", href: "/careers" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [isRibbonClosed, setIsRibbonClosed] = useState(false);

  const getApiBase = () => {
    if (process.env.NEXT_PUBLIC_API_BASE_URL)
      return process.env.NEXT_PUBLIC_API_BASE_URL;
    if (typeof window !== "undefined")
      return `${window.location.protocol}//${window.location.hostname}:8000`;
    return "http://127.0.0.1:8000";
  };

  useEffect(() => {
    let isMounted = true;

    const loadMe = async () => {
      try {
        const response = await fetch(`${getApiBase()}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });
        const payload = await response.json();
        if (!isMounted) return;
        setIsAuthenticated(Boolean(payload?.data?.authenticated));
      } catch (error) {
        if (isMounted) {
          setIsAuthenticated(false);
        }
      }
    };

    loadMe();
    window.addEventListener("auth-changed", loadMe);

    return () => {
      isMounted = false;
      window.removeEventListener("auth-changed", loadMe);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAnnouncement = async () => {
      try {
        const response = await fetch(
          `${getApiBase()}/api/content/announcement-ribbon`,
          {
            method: "GET",
          },
        );
        const payload = await response.json();
        if (!isMounted) return;
        const rows = Array.isArray(payload?.results)
          ? payload.results
          : payload?.result
            ? [payload.result]
            : [];
        if (payload?.enabled && rows.length > 0) {
          setAnnouncements(rows);
          setIsRibbonClosed(false);
          return;
        }
        setAnnouncements([]);
      } catch (error) {
        if (isMounted) {
          setAnnouncements([]);
        }
      }
    };

    loadAnnouncement();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const closeUserMenu = () => setIsUserMenuOpen(false);
    window.addEventListener("click", closeUserMenu);
    return () => window.removeEventListener("click", closeUserMenu);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${getApiBase()}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      // Ignore network errors and still reset local auth state.
    }
    setIsAuthenticated(false);
    setIsUserMenuOpen(false);
    window.dispatchEvent(new Event("auth-changed"));
  };

  const hasRibbon = !isRibbonClosed && announcements.length > 0;
  const hasMultipleAnnouncements = announcements.length > 1;
  const latestAnnouncement = announcements[0] || null;

  return (
    <header className="sticky top-0 z-50 border-b border-steel-200 bg-white/95 backdrop-blur">
      {hasRibbon ? (
        <div className="border-b border-zinc-200 bg-brand-500 text-white">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-2 py-2 sm:px-4 lg:px-6">
            <div className="min-w-0 flex-1 overflow-hidden text-center">
              {hasMultipleAnnouncements ? (
                <div className="ribbon-marquee-track inline-flex whitespace-nowrap text-xs font-semibold tracking-[0.02em]">
                  {announcements.map((item, index) => {
                    const text = item.text || item.message;
                    const key = `${item.id}-${index}`;
                    return item.link_url ? (
                      <a
                        key={key}
                        href={item.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block pr-12 text-white underline-offset-4 hover:underline"
                      >
                        Alert: {text}
                      </a>
                    ) : (
                      <span key={key} className="inline-block pr-12">
                        Alert: {text}
                      </span>
                    );
                  })}
                </div>
              ) : latestAnnouncement?.link_url ? (
                <a
                  href={latestAnnouncement.link_url}
                  target="_blank"
                  rel="noreferrer"
                  className="ribbon-blink inline-block text-xs font-semibold tracking-[0.02em] text-white underline-offset-4 transition hover:underline"
                >
                  Alert: {latestAnnouncement.text || latestAnnouncement.message}
                </a>
              ) : (
                <p className="ribbon-blink text-xs font-semibold tracking-[0.02em] text-white">
                  Alert: {latestAnnouncement?.text || latestAnnouncement?.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsRibbonClosed(true)}
              className="inline-flex h-6 w-6 items-center justify-center rounded text-white transition hover:bg-white/15"
              aria-label="Close announcement ribbon"
              title="Close announcement ribbon"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.jpg"
            alt="Credence logo"
            width={140}
            height={40}
            priority
            style={{ width: "auto" }}
            className="h-9 w-auto sm:h-10"
          />
        </Link>

        <ul
          className={`hidden items-center transition-all duration-300 min-[1200px]:flex ${isDesktopSearchOpen ? "gap-4" : "gap-6"}`}
        >
          {navItems.map((item) => (
            <li key={item.label}>
              {item.href.startsWith("/") ? (
                <Link
                  href={item.href}
                  className="text-sm font-medium text-zinc-700 transition ease-in-out hover:text-brand-600"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  href={item.href}
                  className="text-sm font-medium text-zinc-700 transition ease-in-out hover:text-brand-600"
                >
                  {item.label}
                </a>
              )}
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 min-[1200px]:flex">
          <div className="flex items-center">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center cursor-pointer justify-center rounded-md border border-steel-300 text-zinc-800 transition hover:bg-zinc-50"
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
          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsUserMenuOpen((prev) => !prev);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 transition hover:bg-zinc-50"
                aria-label="Open user menu"
                title="User menu"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20a8 8 0 0 1 16 0" />
                </svg>
              </button>
              {isUserMenuOpen ? (
                <div
                  className="absolute right-0 top-12 z-50 w-44 rounded-md border border-zinc-200 bg-white p-1 shadow-lg"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Link
                    href="/auth"
                    className="block rounded px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                  >
                    My Account
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full rounded px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link href="/auth" className="rounded-md cursor-pointer border border-steel-300 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50">
              Login
            </Link>
          )}
          <Link
            href="/request-quote"
            className="rounded-md cursor-pointer bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Request Quote
          </Link>
        </div>

        <div className="flex items-center gap-1 min-[1200px]:hidden">
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
        <div className="border-t border-zinc-200 bg-white px-4 py-3 min-[1200px]:hidden sm:px-6">
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
        <div className="border-t border-zinc-200 bg-white px-4 py-4 min-[1200px]:hidden sm:px-6">
          <ul className="flex flex-col gap-3">
            {navItems.map((item) => (
              <li key={item.label}>
                {item.href.startsWith("/") ? (
                  <Link
                    href={item.href}
                    className="block rounded-md px-2 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    className="block rounded-md px-2 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {isAuthenticated ? (
              <>
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                >
                  My Account
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="rounded-md border border-zinc-300 px-4 py-2 text-center text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                Login / Register
              </Link>
            )}
            <Link
              href="/request-quote"
              className="rounded-md bg-[#FF2300] px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-[#e21f00]"
            >
              Request Quote
            </Link>
          </div>
        </div>
      )}
      <style jsx>{`
        .ribbon-marquee-track {
          width: max-content;
          animation: ribbon-marquee 18s linear infinite;
        }
        .ribbon-marquee-track:hover {
          animation-play-state: paused;
        }
        .ribbon-blink {
          animation: ribbon-blink 1.2s ease-in-out infinite;
        }
        @keyframes ribbon-marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        @keyframes ribbon-blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.45;
          }
        }
      `}</style>
    </header>
  );
}


