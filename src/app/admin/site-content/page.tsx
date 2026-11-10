'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Save, Globe, Plus, Trash2, Camera, Upload, CheckCircle2 } from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { CampusGalleryImage, SiteContent } from '@/data/initialSeedData';
import { compressCampusPhoto, type CompressionResult } from '@/lib/imageCompressor';

export default function AdminSiteContentCmsPage() {
  const { db, updateSiteContent, showToast } = useCga();
  const [form, setForm] = useState<SiteContent>(db.siteContent);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [compressedResult, setCompressedResult] = useState<CompressionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(db.siteContent);
  }, [db.siteContent]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const res = await compressCampusPhoto(file);
      setCompressedResult(res);
      if (!photoTitle) {
        setPhotoTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
      showToast('Compressed', `Optimized from ${res.originalSizeKb}KB to ${res.compressedSizeKb}KB.`, 'success');
    } catch (err: any) {
      showToast('Error', err.message || 'Compression failed.', 'error');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleAddPhoto = () => {
    if (!compressedResult) return;
    const newImg: CampusGalleryImage = {
      id: `campus-${Date.now()}`,
      url: compressedResult.dataUrl,
      title: photoTitle.trim() || 'CGA Classroom',
      caption: photoCaption.trim() || undefined,
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newImg, ...(form.campusImages || [])];
    setForm({ ...form, campusImages: updated });
    setCompressedResult(null);
    setPhotoTitle('');
    setPhotoCaption('');
    showToast('Photo Added', 'Classroom photo added to list. Click Save to publish.', 'info');
  };

  const handleRemovePhoto = (id: string) => {
    const updated = (form.campusImages || []).filter((p) => p.id !== id);
    setForm({ ...form, campusImages: updated });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateSiteContent(form);
    setIsSaving(false);
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
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-extrabold shadow-sm cursor-pointer self-start disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save All Site Content'}
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

        {/* 6. Campus & Classroom Gallery Photos (Front Top Banner) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div>
              <h2 className="text-base font-extrabold text-[#0a0e2a] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#ea580c]" />
                <span>6. Campus &amp; Classroom Gallery Photos (Front Top Banner)</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Uploaded photos appear prominently on the public homepage top banner, followed by State Rankers. All photos are auto-compressed without quality loss.
              </p>
            </div>
          </div>

          {/* Upload and Compress Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 block text-xs">Upload New Photo</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl border border-blue-300 bg-white hover:bg-blue-50 text-[#0056b3] font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Upload className="w-4 h-4" />
                <span>{isCompressing ? 'Compressing…' : 'Choose Photo (JPG/PNG/WebP)'}</span>
              </button>

              {compressedResult && (
                <span className="text-emerald-700 font-bold text-[11px] inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Compressed {compressedResult.originalSizeKb}KB → {compressedResult.compressedSizeKb}KB ({compressedResult.savingsPercent}% saved)
                </span>
              )}
            </div>

            {compressedResult && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Title</label>
                  <input
                    type="text"
                    value={photoTitle}
                    onChange={(e) => setPhotoTitle(e.target.value)}
                    placeholder="e.g. Science Batch Smart Classroom"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Caption</label>
                  <input
                    type="text"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="e.g. Regular problem solving sessions"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="px-4 py-2 rounded-xl bg-[#ea580c] hover:bg-orange-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Add Compressed Photo to List
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Existing Photos List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {(form.campusImages || []).map((img) => (
              <div
                key={img.id}
                className="p-3 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs"
              >
                <img
                  src={img.url}
                  alt={img.title}
                  className="w-16 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <strong className="text-xs font-bold text-slate-900 truncate block">{img.title}</strong>
                  {img.caption && <p className="text-[10px] text-slate-500 truncate">{img.caption}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(img.id)}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer shrink-0"
                  title="Remove photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-extrabold text-xs shadow-md cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save & Publish Changes to Website'}
          </button>
        </div>
      </form>
    </div>
  );
}
