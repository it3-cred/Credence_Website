"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { API_ENDPOINTS, apiUrl, productDetailPath } from "@/lib/api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1600&q=80&auto=format&fit=crop";

const TABS = {
  features: "features",
  specifications: "specifications",
  documents: "documents",
};

const DOCUMENT_TYPE_LABEL_MAP = {
  CATALOGUE: "Brochures",
  CERTIFICATE: "Certificates & Approvals",
  DATASHEET: "Data Sheets & Bulletins",
  DRAWING: "Drawings & Schematics",
  MANUAL: "Manuals & Guides",
  OTHER: "Other Documents",
};

function parseSlugAndId(slugAndId) {
  const value = Array.isArray(slugAndId) ? slugAndId[0] : slugAndId;
  const parts = String(value || "").split("-");
  const id = parts.pop() || "";
  const slug = parts.join("-") || "product";
  return { slug, id };
}

export default function ProductDetails({ slugAndId = "" }) {
  const parsed = useMemo(() => parseSlugAndId(slugAndId), [slugAndId]);

  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(TABS.features);
  const [activeImage, setActiveImage] = useState(0);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [activeDocumentType, setActiveDocumentType] = useState("");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [requestEmail, setRequestEmail] = useState("");
  const [requestCompany, setRequestCompany] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchProductDetails() {
      setIsLoading(true);
      setError("");
      setProduct(null);
      try {
        if (!parsed.id) throw new Error("Invalid product id.");
        const response = await fetch(apiUrl(productDetailPath(parsed.slug, parsed.id)), {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Failed to fetch product details.");
        const payload = await response.json();
        if (!isMounted) return;
        setProduct(payload);
        setActiveImage(0);
      } catch (fetchError) {
        if (fetchError.name !== "AbortError" && isMounted) {
          setError("Unable to load product details right now.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchProductDetails();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [parsed.id, parsed.slug]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchSimilarProducts() {
      const powerSourceSlug = product?.power_source?.slug;
      if (!powerSourceSlug || !product?.id) {
        setSimilarProducts([]);
        return;
      }

      try {
        const response = await fetch(
          `${apiUrl(API_ENDPOINTS.products)}?power_source=${encodeURIComponent(powerSourceSlug)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Failed to fetch similar products.");
        const payload = await response.json();
        if (!isMounted) return;

        const rows = Array.isArray(payload?.results) ? payload.results : [];
        setSimilarProducts(rows.filter((item) => String(item.id) !== String(product.id)).slice(0, 6));
      } catch (fetchError) {
        if (fetchError.name !== "AbortError" && isMounted) {
          setSimilarProducts([]);
        }
      }
    }

    fetchSimilarProducts();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [product?.id, product?.power_source?.slug]);

  const imageUrls = product?.image_urls?.length ? product.image_urls : [product?.image_url || FALLBACK_IMAGE];
  const features = Array.isArray(product?.features) ? product.features : [];
  const specifications =
    product?.specification && typeof product.specification === "object" && !Array.isArray(product.specification)
      ? Object.entries(product.specification)
      : [];
  const documents = useMemo(
    () => (Array.isArray(product?.documents) ? product.documents : []),
    [product?.documents],
  );
  const documentTypes = useMemo(() => {
    const unique = [...new Set(documents.map((item) => item.doc_type).filter(Boolean))];
    return unique.map((type) => ({
      value: type,
      label: DOCUMENT_TYPE_LABEL_MAP[type] || type,
    }));
  }, [documents]);
  const filteredDocuments = useMemo(() => {
    if (!activeDocumentType) return documents;
    return documents.filter((item) => item.doc_type === activeDocumentType);
  }, [documents, activeDocumentType]);
  const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== "";
  const hasTorqueRange = hasValue(product?.torque_min_nm) || hasValue(product?.torque_max_nm);
  const hasThrustRange = hasValue(product?.thrust_min_n) || hasValue(product?.thrust_max_n);
  const showPerformanceSection = hasTorqueRange || hasThrustRange;

  const openRequestModal = (document) => {
    setSelectedDocument(document);
    setRequestEmail("");
    setRequestCompany("");
    setRequestMessage("");
    setRequestError("");
    setIsRequestModalOpen(true);
  };

  const closeRequestModal = () => {
    setIsRequestModalOpen(false);
    setSelectedDocument(null);
    setRequestSubmitting(false);
  };

  const handleSubmitEmailRequest = async (event) => {
    event.preventDefault();
    if (!selectedDocument?.id) return;

    setRequestSubmitting(true);
    setRequestMessage("");
    setRequestError("");
    try {
      const response = await fetch(apiUrl(API_ENDPOINTS.catalogueEmailRequest), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          catalogue_id: selectedDocument.id,
          email: requestEmail,
          company_name: requestCompany,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.detail || "Failed to submit request.");
      }

      setRequestMessage(payload?.message || "Request submitted successfully.");
      setTimeout(() => {
        closeRequestModal();
      }, 900);
    } catch (submitError) {
      setRequestError(submitError.message || "Failed to submit request.");
    } finally {
      setRequestSubmitting(false);
    }
  };

  useEffect(() => {
    if (!documentTypes.length) {
      setActiveDocumentType("");
      return;
    }
    if (!activeDocumentType || !documentTypes.some((item) => item.value === activeDocumentType)) {
      setActiveDocumentType(documentTypes[0].value);
    }
  }, [documentTypes, activeDocumentType]);

  return (
    <>
      <Navbar />
      <main className="bg-gray-50">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-5 text-[0.95rem] text-steel-700">
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/products" className="hover:text-brand-600">Products</Link>
            {product?.name ? (
              <>
                <span className="mx-2">/</span>
                <span className="text-steel-900">{product.name}</span>
              </>
            ) : null}
          </div>

          {isLoading ? <p className="text-base text-steel-800">Loading product details...</p> : null}
          {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}

          {!isLoading && !error && product ? (
            <>
              <div className="grid gap-6 border-y border-steel-300 py-6 lg:grid-cols-2">
                <div className="px-1">
                  <div className="relative h-88 w-full overflow-hidden rounded-lg border border-steel-300 bg-white shadow-[0_4px_14px_rgba(23,28,34,0.08)] sm:h-104">
                    <Image
                      src={imageUrls[activeImage] || FALLBACK_IMAGE}
                      alt={product.name}
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  {imageUrls.length > 1 ? (
                    <div className="mt-3 flex gap-2 overflow-auto">
                      {imageUrls.map((url, index) => (
                        <button
                          key={`${url}-${index}`}
                          type="button"
                          onClick={() => setActiveImage(index)}
                          className={`h-14 w-14 shrink-0 overflow-hidden rounded border ${activeImage === index ? "border-brand-500" : "border-steel-400"}`}
                        >
                          <Image
                            src={url}
                            alt={`${product.name}-${index + 1}`}
                            width={56}
                            height={56}
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="px-1 sm:px-2 lg:border-l lg:border-steel-300 lg:pl-6">
                  <h1 className="text-3xl font-extrabold tracking-tight text-steel-900 sm:text-4xl">{product.name}</h1>
                  <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-steel-800">{product.description || product.short_summary}</p>

                  {showPerformanceSection ? (
                    <div className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                      {hasTorqueRange ? (
                        <div className="border-t border-steel-300 pt-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-steel-700">Torque Range</p>
                          <p className="mt-1 text-base font-bold text-steel-900">
                            {product.torque_min_nm ?? "-"} to {product.torque_max_nm ?? "-"} Nm
                          </p>
                        </div>
                      ) : null}
                      {hasThrustRange ? (
                        <div className="border-t border-steel-300 pt-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-steel-700">Thrust Range</p>
                          <p className="mt-1 text-base font-bold text-steel-900">
                            {product.thrust_min_n ?? "-"} to {product.thrust_max_n ?? "-"} N
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-8 border-t border-steel-300">
                <div className="flex flex-wrap border-b border-steel-300 bg-white">
                  <button
                    type="button"
                    onClick={() => setActiveTab(TABS.features)}
                    className={`relative px-5 py-3 text-[0.95rem] font-bold transition-colors ${
                      activeTab === TABS.features ? "text-brand-700" : "text-steel-700 hover:text-brand-600"
                    }`}
                  >
                    Features
                    <span
                      className={`absolute bottom-0 left-0 h-0.5 w-full bg-brand-500 transition-transform duration-200 ${
                        activeTab === TABS.features ? "scale-x-100" : "scale-x-0"
                      } origin-left`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab(TABS.specifications)}
                    className={`relative px-5 py-3 text-[0.95rem] font-bold transition-colors ${
                      activeTab === TABS.specifications ? "text-brand-700" : "text-steel-700 hover:text-brand-600"
                    }`}
                  >
                    Specifications
                    <span
                      className={`absolute bottom-0 left-0 h-0.5 w-full bg-brand-500 transition-transform duration-200 ${
                        activeTab === TABS.specifications ? "scale-x-100" : "scale-x-0"
                      } origin-left`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab(TABS.documents)}
                    className={`relative px-5 py-3 text-[0.95rem] font-bold transition-colors ${
                      activeTab === TABS.documents ? "text-brand-700" : "text-steel-700 hover:text-brand-600"
                    }`}
                  >
                    Documents & Drawings
                    <span
                      className={`absolute bottom-0 left-0 h-0.5 w-full bg-brand-500 transition-transform duration-200 ${
                        activeTab === TABS.documents ? "scale-x-100" : "scale-x-0"
                      } origin-left`}
                    />
                  </button>
                </div>

                <div className="py-5 sm:py-6">
                  <div key={activeTab} className="tab-panel-enter">
                    {activeTab === TABS.features ? (
                      features.length ? (
                        <ul className="list-disc space-y-2 pl-5 text-base text-steel-800">
                          {features.map((feature, index) => (
                            <li key={`${index}-${String(feature)}`} className="px-1">
                              {typeof feature === "string" ? feature : JSON.stringify(feature)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-base text-steel-700">No features added.</p>
                      )
                    ) : null}

                    {activeTab === TABS.specifications ? (
                      specifications.length ? (
                        <div className="overflow-x-auto rounded-md border border-steel-300 bg-white shadow-[0_2px_10px_rgba(23,28,34,0.06)]">
                          <table className="min-w-full border-collapse text-left text-[0.95rem]">
                            <thead className="bg-steel-100">
                              <tr>
                                <th className="w-65 border-b border-r border-steel-300 px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.06em] text-steel-700">
                                  Specification
                                </th>
                                <th className="border-b border-steel-300 px-4 py-3 text-xs font-bold uppercase tracking-[0.06em] text-steel-700">
                                  Value
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {specifications.map(([key, value], index) => (
                                <tr key={key} className={index % 2 === 0 ? "bg-white" : "bg-steel-50"}>
                                  <td className="border-b border-r border-steel-200 px-4 py-3 font-semibold text-steel-700">
                                    {key.replaceAll("_", " ")}
                                  </td>
                                  <td className="border-b border-steel-200 px-4 py-3 font-medium text-steel-900">
                                    {typeof value === "string" ? value : JSON.stringify(value)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-base text-steel-700">No specifications added.</p>
                      )
                    ) : null}

                    {activeTab === TABS.documents ? (
                      documents.length ? (
                        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                          <div className="border-r border-steel-300 pr-4">
                            <ul className="space-y-2">
                              {documentTypes.map((docType) => (
                                <li key={docType.value}>
                                  <button
                                    type="button"
                                    onClick={() => setActiveDocumentType(docType.value)}
                                    className={`relative w-full py-2 pl-3 text-left text-sm font-semibold uppercase tracking-[0.06em] ${
                                      activeDocumentType === docType.value
                                        ? "text-brand-700"
                                        : "text-steel-600 hover:text-brand-600"
                                    }`}
                                  >
                                    {activeDocumentType === docType.value ? (
                                      <span className="absolute left-0 top-0 h-full w-1 bg-brand-600" />
                                    ) : null}
                                    <span>{docType.label}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="grid gap-3">
                            {filteredDocuments.map((document) => (
                              <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-steel-300 bg-white px-3 py-3 shadow-[0_2px_10px_rgba(23,28,34,0.06)] transition hover:shadow-[0_8px_20px_rgba(23,28,34,0.12)]">
                                <div>
                                  <p className="text-base font-bold text-steel-900">{document.title}</p>
                                  <p className="text-sm text-steel-700">
                                    {document.doc_type} | {document.access_type}
                                  </p>
                                </div>
                                {document.access_type === "EMAIL_VALIDATED" ? (
                                  <button
                                    type="button"
                                    onClick={() => openRequestModal(document)}
                                    className="rounded-md border border-brand-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-brand-700 hover:bg-brand-50"
                                  >
                                    Request Via Email
                                  </button>
                                ) : document.file_url ? (
                                  <a
                                    href={document.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-md border border-brand-300 bg-brand-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-brand-700 hover:bg-brand-500 hover:text-white"
                                  >
                                    Download
                                  </a>
                                ) : (
                                  <span className="text-sm text-steel-700">File unavailable</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-base text-steel-700">No documents available.</p>
                      )
                    ) : null}
                  </div>
                </div>
              </div>

              {similarProducts.length ? (
                <div className="mt-10 border-t border-steel-300 pt-6">
                  <h2 className="text-xl font-bold text-steel-900">Similar Products</h2>
                  <p className="mt-1 text-sm text-steel-700">
                    Based on power source: <span className="font-semibold">{product?.power_source?.name}</span>
                  </p>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {similarProducts.map((item) => (
                      <Link
                        key={item.id}
                        href={`/product/${encodeURIComponent(item.slug || "product")}-${encodeURIComponent(item.id)}`}
                        className="overflow-hidden rounded-xl border border-steel-200 bg-white shadow-[0_2px_10px_rgba(23,28,34,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(23,28,34,0.14)]"
                      >
                        <div className="relative h-44 w-full bg-steel-100">
                          <Image
                            src={item.image_url || FALLBACK_IMAGE}
                            alt={item.name}
                            fill
                            unoptimized
                            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">
                            {item.power_source?.name || "Product"}
                          </p>
                          <h3 className="mt-1 text-base font-bold leading-tight text-steel-900">{item.name}</h3>
                          <p className="mt-2 overflow-hidden text-sm text-steel-700 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                            {item.short_summary || "No summary available."}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      </main>
      {isRequestModalOpen && selectedDocument ? (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-steel-300 bg-white p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-steel-900">Request Document Via Email</h3>
              <button type="button" onClick={closeRequestModal} className="text-steel-500 hover:text-steel-800">
                X
              </button>
            </div>
            <p className="mt-1 text-sm text-steel-700">{selectedDocument.title}</p>

            <form className="mt-4 space-y-3" onSubmit={handleSubmitEmailRequest}>
              <div>
                <label htmlFor="request-email" className="text-xs font-semibold uppercase text-steel-700">
                  Email
                </label>
                <input
                  id="request-email"
                  type="email"
                  required
                  value={requestEmail}
                  onChange={(event) => setRequestEmail(event.target.value)}
                  className="mt-1 w-full rounded-md border border-steel-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label htmlFor="request-company" className="text-xs font-semibold uppercase text-steel-700">
                  Company Name
                </label>
                <input
                  id="request-company"
                  type="text"
                  value={requestCompany}
                  onChange={(event) => setRequestCompany(event.target.value)}
                  className="mt-1 w-full rounded-md border border-steel-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  placeholder="Your company"
                />
              </div>

              {requestError ? <p className="text-sm text-red-700">{requestError}</p> : null}
              {requestMessage ? <p className="text-sm text-green-700">{requestMessage}</p> : null}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeRequestModal}
                  className="rounded-md border border-steel-300 px-3 py-2 text-xs font-semibold uppercase text-steel-700 hover:bg-steel-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestSubmitting}
                  className="rounded-md border border-brand-300 bg-brand-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-brand-700 hover:bg-brand-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {requestSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      <div className="-mt-16">
        <Footer />
      </div>
    </>
  );
}

