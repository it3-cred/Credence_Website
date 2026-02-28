"use client";

import { memo, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { API_ENDPOINTS, apiUrl } from "@/lib/api";

const navItems = [
  { label: "Products", href: "/products" },
  // { label: "Solutions", href: "#" },
  { label: "About Us", href: "/about" },
  { label: "News", href: "/news" },
  { label: "Distributors", href: "/distributors" },
  { label: "Careers", href: "/careers" },
];

function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUserName, setAuthUserName] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [isRibbonClosed, setIsRibbonClosed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    products: [],
    news: [],
    achievements: [],
    documents: [],
  });
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadMe = async () => {
      try {
        const response = await fetch(apiUrl(API_ENDPOINTS.authMe), {
          method: "GET",
          credentials: "include",
        });
        const payload = await response.json();
        if (!isMounted) return;
        const isLoggedIn = Boolean(payload?.data?.authenticated);
        setIsAuthenticated(isLoggedIn);
        setAuthUserName(
          isLoggedIn
            ? payload?.data?.user?.name || payload?.data?.user?.email || ""
            : "",
        );
      } catch (error) {
        if (isMounted) {
          setIsAuthenticated(false);
          setAuthUserName("");
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
        const response = await fetch(apiUrl(API_ENDPOINTS.contentAnnouncementRibbon), {
          method: "GET",
        });
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
      await fetch(apiUrl(API_ENDPOINTS.authLogout), {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      // Ignore network errors and still reset local auth state.
    }
    setIsAuthenticated(false);
    setAuthUserName("");
    setIsUserMenuOpen(false);
    window.dispatchEvent(new Event("auth-changed"));
  };

  const handleNavClick = (item) => {
    if (item?.label === "Products") {
      trackEvent("nav_click", {
        label: "Products",
        source: "navbar",
        target_path: item.href || "/products",
      });
    }
  };

  const handleRequestQuoteClick = () => {
    trackEvent("request_quote_click", {
      source_section: "navbar",
      page_context: "global",
      product_id: null,
      product_slug: null,
      power_source_slug: null,
      power_source_name: null,
    });
  };

  const isAnySearchOpen = isDesktopSearchOpen || isSearchOpen;
  const normalizedSearchQuery = searchQuery.trim();

  useEffect(() => {
    if (!isAnySearchOpen) {
      setIsSearchLoading(false);
      setSearchError("");
      setHasSearched(false);
      return;
    }

    if (normalizedSearchQuery.length < 2) {
      setIsSearchLoading(false);
      setSearchError("");
      setHasSearched(false);
      setSearchResults({ products: [], news: [], achievements: [], documents: [] });
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearchLoading(true);
        setSearchError("");
        const response = await fetch(
          `${apiUrl(API_ENDPOINTS.search)}?q=${encodeURIComponent(normalizedSearchQuery)}&limit=6`,
          {
            method: "GET",
            signal: controller.signal,
          },
        );
        if (!response.ok) {
          throw new Error("Failed to load search results.");
        }
        const payload = await response.json();
        setSearchResults({
          products: Array.isArray(payload?.results?.products) ? payload.results.products : [],
          news: Array.isArray(payload?.results?.news) ? payload.results.news : [],
          achievements: Array.isArray(payload?.results?.achievements) ? payload.results.achievements : [],
          documents: Array.isArray(payload?.results?.documents) ? payload.results.documents : [],
        });
        setHasSearched(true);
      } catch (error) {
        if (error?.name !== "AbortError") {
          setSearchError("Unable to search right now.");
          setHasSearched(true);
        }
      } finally {
        setIsSearchLoading(false);
      }
    }, 260);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [isAnySearchOpen, normalizedSearchQuery]);

  const searchResultCount = useMemo(
    () =>
      (searchResults.products?.length || 0) +
      (searchResults.news?.length || 0) +
      (searchResults.achievements?.length || 0) +
      (searchResults.documents?.length || 0),
    [searchResults],
  );

  const handleSearchResultClick = () => {
    setIsSearchOpen(false);
    setIsDesktopSearchOpen(false);
    setIsOpen(false);
  };

  const hasRibbon = !isRibbonClosed && announcements.length > 0;
  const hasMultipleAnnouncements = announcements.length > 1;
  const latestAnnouncement = announcements[0] || null;
  const menuUserLabel = authUserName || "My Account";

  const isActiveNavItem = (href) => {
    if (!href || !href.startsWith("/") || !pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderSearchResults = ({ mobile = false } = {}) => {
    if (!isAnySearchOpen) return null;
    if (!normalizedSearchQuery && !isSearchLoading && !hasSearched) return null;

    const panelClass = mobile
      ? "mt-2 rounded-xl border border-steel-200 bg-white p-2 shadow-[0_10px_24px_rgba(23,28,34,0.10)]"
      : "absolute right-0 top-11 z-60 w-[min(32rem,80vw)] rounded-xl border border-steel-200 bg-white p-2 shadow-[0_10px_24px_rgba(23,28,34,0.10)]";

    return (
      <div className={panelClass}>
        {normalizedSearchQuery.length < 2 ? (
          <p className="px-2 py-2 text-xs font-medium text-steel-500">
            Type at least 2 characters to search.
          </p>
        ) : null}

        {isSearchLoading ? (
          <p className="px-2 py-2 text-xs font-medium text-steel-500">Searching...</p>
        ) : null}

        {!isSearchLoading && searchError ? (
          <p className="px-2 py-2 text-xs font-medium text-red-600">{searchError}</p>
        ) : null}

        {!isSearchLoading && !searchError && hasSearched && searchResultCount === 0 ? (
          <p className="px-2 py-2 text-xs font-medium text-steel-500">
            No results found for "{normalizedSearchQuery}".
          </p>
        ) : null}

        {!isSearchLoading && !searchError && searchResultCount > 0 ? (
          <div className="max-h-96 space-y-3 overflow-y-auto px-1 py-1">
            {searchResults.products.length ? (
              <div>
                <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">
                  Products
                </p>
                <div className="space-y-1">
                  {searchResults.products.map((item) => (
                    <Link
                      key={`search-product-${item.id}`}
                      href={`/product/${encodeURIComponent(item.slug || "product")}-${encodeURIComponent(item.id)}`}
                      onClick={handleSearchResultClick}
                      className="block rounded-lg px-2 py-2 transition hover:bg-steel-50"
                    >
                      <p className="text-sm font-semibold text-steel-900">{item.name}</p>
                      {item.summary ? (
                        <p className="mt-0.5 line-clamp-1 text-xs text-steel-600">{item.summary}</p>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {searchResults.news.length ? (
              <div>
                <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">
                  News
                </p>
                <div className="space-y-1">
                  {searchResults.news.map((item) => (
                    <Link
                      key={`search-news-${item.id}`}
                      href={`/news/${encodeURIComponent(item.slug || "news")}-${encodeURIComponent(item.id)}`}
                      onClick={handleSearchResultClick}
                      className="block rounded-lg px-2 py-2 transition hover:bg-steel-50"
                    >
                      <p className="text-sm font-semibold text-steel-900">{item.title}</p>
                      {item.summary ? (
                        <p className="mt-0.5 line-clamp-1 text-xs text-steel-600">{item.summary}</p>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {searchResults.achievements.length ? (
              <div>
                <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">
                  Achievements
                </p>
                <div className="space-y-1">
                  {searchResults.achievements.map((item) => (
                    <Link
                      key={`search-achievement-${item.id}`}
                      href={`/achievement/${encodeURIComponent(item.slug || "achievement")}-${encodeURIComponent(item.id)}`}
                      onClick={handleSearchResultClick}
                      className="block rounded-lg px-2 py-2 transition hover:bg-steel-50"
                    >
                      <p className="text-sm font-semibold text-steel-900">{item.title}</p>
                      {item.summary ? (
                        <p className="mt-0.5 line-clamp-1 text-xs text-steel-600">{item.summary}</p>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {searchResults.documents.length ? (
              <div>
                <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">
                  Product Documents
                </p>
                <div className="space-y-1">
                  {searchResults.documents.map((item) => (
                    <Link
                      key={`search-document-${item.id}`}
                      href={`/product/${encodeURIComponent(item.product_slug || "product")}-${encodeURIComponent(item.product_id)}`}
                      onClick={handleSearchResultClick}
                      className="block rounded-lg px-2 py-2 transition hover:bg-steel-50"
                    >
                      <p className="text-sm font-semibold text-steel-900">{item.title}</p>
                      <p className="mt-0.5 text-xs text-steel-600">
                        {item.product_name} • {item.doc_type}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  };
  return (
    <header className="sticky top-0 z-50 border-b border-steel-200/90 bg-white/95 shadow-[0_1px_0_rgba(23,28,34,0.04)] backdrop-blur-md">
      {hasRibbon ? (
        <div className="border-b border-brand-400/50 bg-brand-500 text-white">
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
                        className="inline-block pr-12 text-white/95 underline-offset-4 transition hover:text-white hover:underline"
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
                  className="ribbon-blink inline-block text-xs font-semibold tracking-[0.02em] text-white underline-offset-4 transition hover:text-white/90 hover:underline"
                >
                  Alert: {latestAnnouncement.text || latestAnnouncement.message}
                </a>
              ) : (
                <p className="ribbon-blink text-xs font-semibold tracking-[0.02em] text-white">
                  Alert:{" "}
                  {latestAnnouncement?.text || latestAnnouncement?.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsRibbonClosed(true)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-white transition hover:bg-white/15"
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
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.jpg"
            alt="Credence logo"
            width={140}
            height={40}
            priority
            style={{ width: "auto" }}
            className="h-9 w-auto transition duration-200 sm:h-10"
          />
        </Link>

        <ul
          className={`hidden items-center transition-all duration-300 min-[1200px]:flex ${isDesktopSearchOpen ? "gap-4" : "gap-6"}`}
        >
          {navItems.map((item) => (
            <li key={item.label}>
              {(() => {
                const isActive = isActiveNavItem(item.href);
                const desktopNavClass = `relative rounded-md px-2 py-2 text-sm font-medium transition duration-200 ease-in-out ${
                  isActive
                    ? "text-brand-700"
                    : "text-zinc-700 hover:bg-brand-50 hover:text-brand-700"
                }`;
                return item.href.startsWith("/") ? (
                  <Link
                    href={item.href}
                    onClick={() => handleNavClick(item)}
                    className={desktopNavClass}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    onClick={() => handleNavClick(item)}
                    className={desktopNavClass}
                  >
                    {item.label}
                  </a>
                );
              })()}
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2.5 min-[1200px]:flex">
          <div className="relative flex items-center rounded-xl p-1 transition duration-300">
            <button
              type="button"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center border border-steel-200 bg-white rounded-lg text-zinc-700 transition duration-200 hover:bg-steel-50/70 hover:text-brand-600"
              onClick={() =>
                setIsDesktopSearchOpen((prev) => {
                  const next = !prev;
                  if (!next) {
                    setSearchQuery("");
                    setSearchResults({ products: [], news: [], achievements: [], documents: [] });
                    setHasSearched(false);
                    setSearchError("");
                  }
                  return next;
                })
              }
              aria-expanded={isDesktopSearchOpen}
              aria-label="Toggle desktop search"
            >
              <svg
                className="h-3 w-4"
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
              className={`overflow-hidden transition-all duration-300 ease-out ${isDesktopSearchOpen ? "ml-1 w-56 opacity-100" : "ml-0 w-0 opacity-0"}`}
            >
              <div className="flex h-9 items-center gap-2 rounded-lg border border-steel-200 bg-white px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-500"
                />
              </div>
            </div>
            {isDesktopSearchOpen ? renderSearchResults() : null}
          </div>
          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsUserMenuOpen((prev) => !prev);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-steel-200 bg-white text-zinc-700 transition duration-200 hover:border-brand-200 hover:text-brand-600 hover:shadow-sm"
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
                  className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-steel-200 bg-white p-1.5 shadow-[0_12px_30px_rgba(23,28,34,0.12)]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-700"
                    title={menuUserLabel}
                  >
                    <span className="block max-w-[10.5rem] overflow-hidden text-ellipsis whitespace-nowrap">
                      {menuUserLabel}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              href="/auth"
              className="rounded-lg cursor-pointer border border-steel-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-800 transition duration-200 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
              Login
            </Link>
          )}
          <Link
            href="/request-quote"
            onClick={handleRequestQuoteClick}
            className="rounded-lg cursor-pointer bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_6px_14px_rgba(255,35,1,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-[0_10px_18px_rgba(255,35,1,0.24)]"
          >
            Request Quote
          </Link>
        </div>

        <div className="flex items-center gap-1 min-[1200px]:hidden">
          <button
            type="button"
            className="inline-flex items-center rounded-lg p-2 text-zinc-700 transition hover:bg-steel-100"
            onClick={() =>
              setIsSearchOpen((prev) => {
                const next = !prev;
                if (!next) {
                  setSearchQuery("");
                  setSearchResults({ products: [], news: [], achievements: [], documents: [] });
                  setHasSearched(false);
                  setSearchError("");
                }
                return next;
              })
            }
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
            className="inline-flex items-center rounded-lg border border-steel-200 bg-white p-2 text-zinc-800 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
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
        <div className="navbar-panel-enter border-t border-steel-200 bg-white/95 px-4 py-3 min-[1200px]:hidden sm:px-6">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-steel-200 bg-steel-50 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
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
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-500"
            />
          </div>
          {renderSearchResults({ mobile: true })}
        </div>
      )}

      {isOpen && (
        <div className="navbar-panel-enter border-t border-steel-200 bg-white/95 px-4 py-4 min-[1200px]:hidden sm:px-6">
          <ul className="flex flex-col gap-2">
            {navItems.map((item) => (
              <li key={item.label}>
                {(() => {
                  const isActive = isActiveNavItem(item.href);
                  const mobileNavClass = `block rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-zinc-800 hover:bg-steel-100 hover:text-brand-700"
                  }`;
                  return item.href.startsWith("/") ? (
                    <Link
                      href={item.href}
                      onClick={() => handleNavClick(item)}
                      className={mobileNavClass}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      onClick={() => handleNavClick(item)}
                      className={mobileNavClass}
                    >
                      {item.label}
                    </a>
                  );
                })()}
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {isAuthenticated ? (
              <>
                <div className="inline-flex items-center justify-center rounded-lg border border-steel-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-steel-50">
                  <span className="max-w-[11rem] overflow-hidden text-ellipsis whitespace-nowrap">
                    {menuUserLabel}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="rounded-lg border border-steel-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-800 transition hover:bg-steel-50"
              >
                Login / Register
              </Link>
            )}
            <Link
              href="/request-quote"
              onClick={handleRequestQuoteClick}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-[0_6px_14px_rgba(255,35,1,0.16)] transition hover:bg-brand-600"
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
        .navbar-panel-enter {
          animation: navbar-panel-fade 220ms ease;
          transform-origin: top;
        }
        @keyframes navbar-panel-fade {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  );
}

export default memo(Navbar);
