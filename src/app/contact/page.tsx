'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { useCga } from '@/context/CgaContext';

export default function ContactPage() {
  const { db, submitEnquiry } = useCga();
  const { contact } = db.siteContent;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [courseInterest, setCourseInterest] = useState('Tripura TET (Paper I & II)');
  const [message, setMessage] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (honeypot) {
      // Bot trapped
      setSubmitted(true);
      return;
    }

    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!message.trim()) {
      setError('Please write your query or batch preference.');
      return;
    }
    if (!consentGiven) {
      setError('Please give consent to process your contact details for this enquiry under the DPDP Act, 2023.');
      return;
    }

    submitEnquiry({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || 'Not provided',
      courseInterest,
      message: message.trim(),
    });

    setSubmitted(true);
    setName('');
    setPhone('');
    setEmail('');
    setMessage('');
    setConsentGiven(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-1">
        {/* Page Header */}
        <section className="cga-gradient-hero text-white py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              Get in Touch with C.G.A Udaipur
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Visit Our Campus or Send an Admission Enquiry
            </h1>
            <p className="text-blue-100 mt-2 max-w-2xl text-sm sm:text-base">
              {contact.address}
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Address Cards + Embedded Map */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                <h2 className="text-xl font-extrabold text-[#0a0e2a]">
                  Official Campus Contact Information
                </h2>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-[#0056b3] text-white flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Institute Address
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{contact.address}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {contact.landmark} — PIN: {contact.pincode || '799120'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-[#ea580c] text-white flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Contact Number
                        </span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">
                          {contact.phonePrimary}
                        </p>
                        {contact.phoneSecondary && contact.phoneSecondary.trim() && contact.phoneSecondary !== contact.phonePrimary && (
                          <p className="text-xs text-slate-600">{contact.phoneSecondary}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-[#dc2626] text-white flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Email & Timings
                        </span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{contact.email}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{contact.officeHours}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Embedded Google Map of Chanban Youth Club Rd, Udaipur, Tripura 799114 */}
                <div className="rounded-2xl overflow-hidden border border-slate-200 h-64 bg-slate-100">
                  <iframe
                    title="Career Guidance Academy (C.G.A) Location Map - Udaipur Tripura"
                    src={contact.mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Validated Enquiry Form */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
                <h2 className="text-xl font-extrabold text-[#0a0e2a]">
                  Admission & Batch Enquiry Form
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 mb-6">
                  Fill out the form below to request a call back regarding batch timings, fee
                  instalments, or scholarship tests.
                </p>

                {submitted ? (
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Thank You for Contacting C.G.A Udaipur!
                    </h3>
                    <p className="text-sm text-slate-600">
                      Your admission enquiry has been recorded. Our academic counselor at Chanban
                      Youth Club Rd will call you shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="px-4 py-2 rounded-xl bg-[#0056b3] text-white text-xs font-bold cursor-pointer"
                    >
                      Send Another Enquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {/* Anti-bot honeypot field */}
                    <div className="hidden" aria-hidden="true">
                      <label htmlFor="enquiry-hp">Website Security Verification</label>
                      <input
                        id="enquiry-hp"
                        name="enquiry-hp"
                        type="text"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>

                    {error && (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs font-semibold text-[#dc2626]">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div>
                      <label htmlFor="enquiry-name" className="block text-xs font-bold text-slate-700 mb-1.5">
                        Full Name <span className="text-[#dc2626]">*</span>
                      </label>
                      <input
                        id="enquiry-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter student or guardian full name"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3] focus-visible:ring-2 focus-visible:ring-[#0056b3]"
                        required
                        aria-required="true"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="enquiry-phone" className="block text-xs font-bold text-slate-700 mb-1.5">
                          Mobile Number <span className="text-[#dc2626]">*</span>
                        </label>
                        <input
                          id="enquiry-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 9436X XXXXX"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3] focus-visible:ring-2 focus-visible:ring-[#0056b3]"
                          required
                          aria-required="true"
                        />
                      </div>
                      <div>
                        <label htmlFor="enquiry-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                          Email Address (Optional)
                        </label>
                        <input
                          id="enquiry-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3] focus-visible:ring-2 focus-visible:ring-[#0056b3]"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="enquiry-course" className="block text-xs font-bold text-slate-700 mb-1.5">
                        Course / Exam Wing of Interest
                      </label>
                      <select
                        id="enquiry-course"
                        value={courseInterest}
                        onChange={(e) => setCourseInterest(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0056b3] focus-visible:ring-2 focus-visible:ring-[#0056b3]"
                      >
                        {db.courses.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name} ({c.status})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="enquiry-message" className="block text-xs font-bold text-slate-700 mb-1.5">
                        Your Query / Preferred Batch Timing <span className="text-[#dc2626]">*</span>
                      </label>
                      <textarea
                        id="enquiry-message"
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask about batch start date, study material, or fee instalments..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3] focus-visible:ring-2 focus-visible:ring-[#0056b3]"
                        required
                        aria-required="true"
                      />
                    </div>

                    {/* DPDP Act 2023 Explicit Consent Checkbox */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-start gap-2.5">
                        <input
                          id="enquiry-consent"
                          type="checkbox"
                          checked={consentGiven}
                          onChange={(e) => setConsentGiven(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-[#0056b3] border-slate-300 focus:ring-[#0056b3] focus-visible:ring-2 focus-visible:ring-[#0056b3] cursor-pointer shrink-0"
                          required
                          aria-required="true"
                        />
                        <label
                          htmlFor="enquiry-consent"
                          className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none"
                        >
                          <span className="font-semibold text-slate-900">DPDP Data Protection Consent:</span>{' '}
                          I hereby consent to Career Guidance Academy (C.G.A) collecting and processing my name, mobile number, and enquiry details solely to respond to my academic query in accordance with India&apos;s Digital Personal Data Protection Act, 2023. I understand my data will not be sold or shared with third-party advertisers. See{' '}
                          <Link
                            href="/privacy-policy"
                            className="text-[#0056b3] underline font-semibold hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-[#0056b3]"
                          >
                            Privacy Policy
                          </Link>.
                        </label>
                      </div>
                    </div>

                    <button
                      id="enquiry-submit-btn"
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold text-sm shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0056b3]"
                      aria-label="Submit Admission Enquiry to Career Guidance Academy"
                    >
                      <Send className="w-4 h-4" />
                      Submit Admission Enquiry
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
