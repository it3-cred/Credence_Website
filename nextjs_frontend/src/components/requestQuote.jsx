"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { API_ENDPOINTS, apiUrl } from "@/lib/api";

const inquiryReasons = [
  "Product Information",
  "Sales & Distribution Partnership",
  "Service Support",
  "Documentation Request",
  "General Inquiry",
];

const languages = ["English", "Hindi", "Marathi", "Tamil", "Telugu"];

function isLikelyEmail(value) {
  const normalized = String(value || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export default function RequestQuotePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitMessage("");
    setSubmitError("");
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      email: String(formData.get("email") || "").trim(),
      first_name: String(formData.get("firstName") || "").trim(),
      last_name: String(formData.get("lastName") || "").trim(),
      inquiry_reason: String(formData.get("inquiryReason") || "").trim(),
      preferred_language: String(formData.get("preferredLanguage") || "").trim(),
      company_name: String(formData.get("company") || "").trim(),
      request_details: String(formData.get("details") || "").trim(),
      country: String(formData.get("country") || "").trim(),
      business_address: String(formData.get("businessAddress") || "").trim(),
      phone_number: String(formData.get("phone") || "").trim(),
      state: String(formData.get("state") || "").trim(),
      city: String(formData.get("city") || "").trim(),
      postal_code: String(formData.get("postalCode") || "").trim(),
      subscribe_updates: formData.get("subscribeUpdates") === "on",
    };

    if (!isLikelyEmail(payload.email)) {
      setSubmitError("Enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(apiUrl(API_ENDPOINTS.requestQuote), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to submit inquiry.");
      }

      setSubmitMessage(data?.message || "Inquiry submitted successfully.");
      form.reset();
    } catch (error) {
      setSubmitError(error.message || "Something went wrong while submitting the inquiry.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="bg-steel-50">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-600">
            Learn More
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-steel-900 sm:text-4xl">
            Submit An Inquiry
          </h1>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4 rounded-xl border border-steel-200 bg-white p-4 shadow-sm sm:p-6"
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <label className="block">
                <span className="sr-only">Email</span>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Email"
                  className="h-11 w-full rounded-md border border-steel-300 bg-white px-3 text-sm text-steel-900 outline-none transition focus:border-brand-500"
                />
              </label>

              <label className="block">
                <span className="sr-only">First Name</span>
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="First Name"
                  className="h-11 w-full rounded-md border border-steel-300 bg-white px-3 text-sm text-steel-900 outline-none transition focus:border-brand-500"
                />
              </label>

              <label className="block">
                <span className="sr-only">Last Name</span>
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder="Last Name"
                  className="h-11 w-full rounded-md border border-steel-300 bg-white px-3 text-sm text-steel-900 outline-none transition focus:border-brand-500"
                />
              </label>

              <label className="block">
                <span className="sr-only">Inquiry Reason</span>
                <select
                  name="inquiryReason"
                  required
                  defaultValue=""
                  className="h-11 w-full rounded-md border border-steel-300 bg-white px-3 text-sm text-steel-700 outline-none transition focus:border-brand-500"
                >
                  <option value="" disabled>
                    Inquiry Reason
                  </option>
                  {inquiryReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="sr-only">Preferred Language</span>
                <select
                  name="preferredLanguage"
                  defaultValue=""
                  className="h-11 w-full rounded-md border border-steel-300 bg-white px-3 text-sm text-steel-700 outline-none transition focus:border-brand-500"
                >
                  <option value="" disabled>
                    Preferred Language
                  </option>
                  {languages.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="sr-only">Company Name</span>
                <input
                  type="text"
                  name="company"
                  placeholder="Company Name"
                  className="h-11 w-full rounded-md border border-steel-300 bg-white px-3 text-sm text-steel-900 outline-none transition focus:border-brand-500"
                />
              </label>
            </div>

            <label className="block">
              <span className="sr-only">Request Details</span>
              <textarea
                name="details"
                rows={6}
                placeholder="Request Details"
                className="w-full rounded-md border border-steel-300 bg-white px-3 py-3 text-sm text-steel-900 outline-none transition focus:border-brand-500"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <label className="block">
                <span className="sr-only">Country</span>
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  className="h-11 w-full rounded-md border border-steel-300 bg-white px-3 text-sm text-steel-900 outline-none transition focus:border-brand-500"
                />
              </label>

              <label className="block">
                <span className="sr-only">Business Address</span>
                <input
                  type="text"
                  name="businessAddress"
                  placeholder="Business Address (Not Home Address)"
                  className="h-11 w-full rounded-md border border-steel-300 bg-white px-3 text-sm text-steel-900 outline-none transition focus:border-brand-500"
                />
              </label>

              <label className="block">
                <span className="sr-only">Phone Number</span>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  className="h-11 w-full rounded-md border border-steel-300 bg-white px-3 text-sm text-steel-900 outline-none transition focus:border-brand-500"
                />
              </label>

              <label className="block">
                <span className="sr-only">State</span>
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  className="h-11 w-full rounded-md border border-steel-300 bg-white px-3 text-sm text-steel-900 outline-none transition focus:border-brand-500"
                />
              </label>

              <label className="block">
                <span className="sr-only">City</span>
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  className="h-11 w-full rounded-md border border-steel-300 bg-white px-3 text-sm text-steel-900 outline-none transition focus:border-brand-500"
                />
              </label>

              <label className="block">
                <span className="sr-only">Postal Code</span>
                <input
                  type="text"
                  name="postalCode"
                  placeholder="Postal Code"
                  className="h-11 w-full rounded-md border border-steel-300 bg-white px-3 text-sm text-steel-900 outline-none transition focus:border-brand-500"
                />
              </label>
            </div>

            {submitMessage ? (
              <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                {submitMessage}
              </p>
            ) : null}

            {submitError ? (
              <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {submitError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-md bg-brand-500 px-8 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
