'use client';

import React, { useState, useEffect } from 'react';
import { Save, Globe, Plus, Trash2 } from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { SiteContent } from '@/data/initialSeedData';

export default function AdminSiteContentCmsPage() {
  const { db, updateSiteContent } = useCga();
  const [form, setForm] = useState<SiteContent>(db.siteContent);

  useEffect(() => {
    setForm(db.siteContent);
  }, [db.siteContent]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteContent(form);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
            Public Website CMS & Content Editor
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Edit homepage banners, institute introduction, mission, vision, highlight statistics,
            testimonials, and contact details. Every item on the public website is editable here.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-extrabold shadow-sm cursor-pointer self-start"
        >
          <Save className="w-4 h-4" /> Save All Site Content
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* 1. Homepage Hero & Branding */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h2 className="text-base font-extrabold text-[#0a0e2a] border-b border-slate-100 pb-2">
            1. Homepage Hero Banner & Branding
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Institute Name</label>
              <input
                type="text"
                value={form.instituteName}
                onChange={(e) => setForm({ ...form, instituteName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Top Admission Badge</label>
              <input
                type="text"
                value={form.heroBadge}
                onChange={(e) => setForm({ ...form, heroBadge: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Hero Main Headline</label>
              <input
                type="text"
                value={form.heroTitle}
                onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Hero Subtitle</label>
              <textarea
                rows={2}
                value={form.heroSubtitle}
                onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* 2. About Us, Mission & Vision */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h2 className="text-base font-extrabold text-[#0a0e2a] border-b border-slate-100 pb-2">
            2. Institute Introduction, Mission & Vision
          </h2>
          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Introduction Text</label>
              <textarea
                rows={3}
                value={form.introText}
                onChange={(e) => setForm({ ...form, introText: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Our Mission</label>
                <textarea
                  rows={3}
                  value={form.mission}
                  onChange={(e) => setForm({ ...form, mission: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Our Vision</label>
                <textarea
                  rows={3}
                  value={form.vision}
                  onChange={(e) => setForm({ ...form, vision: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Campus Contact Information */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h2 className="text-base font-extrabold text-[#0a0e2a] border-b border-slate-100 pb-2">
            3. Contact Details & Udaipur Address
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Full Campus Address</label>
              <input
                type="text"
                value={form.contact.address}
                onChange={(e) =>
                  setForm({ ...form, contact: { ...form.contact, address: e.target.value } })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Primary Phone</label>
              <input
                type="text"
                value={form.contact.phonePrimary}
                onChange={(e) =>
                  setForm({ ...form, contact: { ...form.contact, phonePrimary: e.target.value } })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Official Email</label>
              <input
                type="text"
                value={form.contact.email}
                onChange={(e) =>
                  setForm({ ...form, contact: { ...form.contact, email: e.target.value } })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-extrabold text-xs shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save & Publish Changes to Website
          </button>
        </div>
      </form>
    </div>
  );
}
