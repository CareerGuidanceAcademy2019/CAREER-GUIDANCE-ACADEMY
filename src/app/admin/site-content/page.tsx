'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Globe,
  Plus,
  Trash2,
  Camera,
  Upload,
  CheckCircle2,
  BellRing,
  Link2,
  ExternalLink,
  Edit3,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { CampusGalleryImage, SiteContent, UrgentPopupAnnouncement } from '@/data/initialSeedData';
import { compressCampusPhoto, MAX_CAMPUS_IMAGES, type CompressionResult } from '@/lib/imageCompressor';

export default function AdminSiteContentCmsPage() {
  const { db, updateSiteContent, showToast } = useCga();
  const [form, setForm] = useState<SiteContent>(db.siteContent);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [compressedResult, setCompressedResult] = useState<CompressionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Urgent Entry Popup Announcement Editor State
  const [editingPopupId, setEditingPopupId] = useState<string | null>(null);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupTag, setPopupTag] = useState('Urgent Notice');
  const [popupLinkUrl, setPopupLinkUrl] = useState('');
  const [popupLinkLabel, setPopupLinkLabel] = useState('');
  const [popupIsActive, setPopupIsActive] = useState(true);

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
    const currentList = form.campusImages || [];
    if (currentList.length >= MAX_CAMPUS_IMAGES) {
      showToast(
        '20-Photo Limit Reached',
        `Maximum ${MAX_CAMPUS_IMAGES} photos can be uploaded to the front page banner. Please remove an existing photo first.`,
        'error'
      );
      return;
    }
    const newImg: CampusGalleryImage = {
      id: `campus-${Date.now()}`,
      url: compressedResult.dataUrl,
      title: photoTitle.trim() || 'CGA Classroom',
      caption: photoCaption.trim() || undefined,
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newImg, ...currentList].slice(0, MAX_CAMPUS_IMAGES);
    setForm({ ...form, campusImages: updated });
    setCompressedResult(null);
    setPhotoTitle('');
    setPhotoCaption('');
    showToast('Photo Added', `Classroom photo added (${updated.length}/${MAX_CAMPUS_IMAGES}). Click Save to publish.`, 'info');
  };

  const handleRemovePhoto = (id: string) => {
    const updated = (form.campusImages || []).filter((p) => p.id !== id);
    setForm({ ...form, campusImages: updated });
  };

  const resetPopupForm = () => {
    setEditingPopupId(null);
    setPopupTitle('');
    setPopupMessage('');
    setPopupTag('Urgent Notice');
    setPopupLinkUrl('');
    setPopupLinkLabel('');
    setPopupIsActive(true);
  };

  const handleAddOrUpdatePopupAnnouncement = async () => {
    if (!popupTitle.trim() || !popupMessage.trim()) {
      showToast('Missing Fields', 'Please enter both an announcement headline and message.', 'error');
      return;
    }

    let normalizedUrl = popupLinkUrl.trim();
    if (normalizedUrl && !/^(https?:\/\/|\/|mailto:|tel:)/i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    const currentPopups = Array.isArray(form.urgentPopupAnnouncements)
      ? form.urgentPopupAnnouncements
      : [];
    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];

    let nextPopups: UrgentPopupAnnouncement[];
    if (editingPopupId) {
      nextPopups = currentPopups.map((item) =>
        item.id === editingPopupId
          ? {
              ...item,
              title: popupTitle.trim(),
              message: popupMessage.trim(),
              tag: popupTag.trim() || 'Urgent Notice',
              linkUrl: normalizedUrl || undefined,
              linkLabel: popupLinkLabel.trim() || undefined,
              isActive: popupIsActive,
              updatedAt: nowIso,
            }
          : item
      );
    } else {
      const newNotice: UrgentPopupAnnouncement = {
        id: `urgent-popup-${Date.now()}`,
        title: popupTitle.trim(),
        message: popupMessage.trim(),
        tag: popupTag.trim() || 'Urgent Notice',
        linkUrl: normalizedUrl || undefined,
        linkLabel: popupLinkLabel.trim() || undefined,
        date: todayDate,
        isActive: popupIsActive,
        updatedAt: nowIso,
      };
      nextPopups = [newNotice, ...currentPopups];
    }

    const updatedForm: SiteContent = {
      ...form,
      urgentPopupAnnouncements: nextPopups,
    };
    setForm(updatedForm);
    resetPopupForm();

    setIsSaving(true);
    const ok = await updateSiteContent(updatedForm);
    setIsSaving(false);
    if (ok) {
      showToast(
        editingPopupId ? 'Urgent Popup Updated' : 'Urgent Popup Published',
        'Visitors entering the portal will now see this urgent announcement popup first.',
        'success'
      );
    }
  };

  const handleEditPopupItem = (item: UrgentPopupAnnouncement) => {
    setEditingPopupId(item.id);
    setPopupTitle(item.title);
    setPopupMessage(item.message);
    setPopupTag(item.tag || 'Urgent Notice');
    setPopupLinkUrl(item.linkUrl || '');
    setPopupLinkLabel(item.linkLabel || '');
    setPopupIsActive(item.isActive !== false);
  };

  const handleTogglePopupActive = async (id: string) => {
    const currentPopups = Array.isArray(form.urgentPopupAnnouncements)
      ? form.urgentPopupAnnouncements
      : [];
    const nextPopups = currentPopups.map((item) =>
      item.id === id
        ? { ...item, isActive: item.isActive === false ? true : false, updatedAt: new Date().toISOString() }
        : item
    );
    const updatedForm = { ...form, urgentPopupAnnouncements: nextPopups };
    setForm(updatedForm);
    setIsSaving(true);
    await updateSiteContent(updatedForm);
    setIsSaving(false);
  };

  const handleDeletePopupItem = async (id: string) => {
    const currentPopups = Array.isArray(form.urgentPopupAnnouncements)
      ? form.urgentPopupAnnouncements
      : [];
    const nextPopups = currentPopups.filter((item) => item.id !== id);
    const updatedForm = { ...form, urgentPopupAnnouncements: nextPopups };
    setForm(updatedForm);
    if (editingPopupId === id) resetPopupForm();
    setIsSaving(true);
    await updateSiteContent(updatedForm);
    setIsSaving(false);
    showToast('Popup Notice Removed', 'Urgent popup announcement has been deleted.', 'info');
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
        {/* 0. Urgent Entry Popup Announcements (Shown First When Users Enter Portal) */}
        <div className="bg-white rounded-2xl border-2 border-[#0056b3]/25 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-50 text-[#dc2626] border border-red-200 text-[11px] font-bold uppercase tracking-wide mb-1.5">
                <BellRing className="w-3.5 h-3.5" /> Portal Entry Popup Manager
              </span>
              <h2 className="text-base font-bold text-[#0a0e2a]">
                Urgent Entry Popup Announcements (Pop-Out First on Portal Entry)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Post one or multiple urgent notices here. When students or visitors open the portal, these announcements pop out first as a slide carousel with a top-right close button and optional clickable URL link.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shrink-0 self-start">
              {(form.urgentPopupAnnouncements || []).filter((a) => a.isActive !== false).length} Active Popup(s)
            </div>
          </div>

          {/* Add / Edit Urgent Popup Form */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50/90 border border-slate-200/90 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[#0056b3]" />
                {editingPopupId ? 'Edit Urgent Popup Announcement' : 'Create New Urgent Popup Announcement'}
              </span>
              {editingPopupId && (
                <button
                  type="button"
                  onClick={resetPopupForm}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="sm:col-span-8">
                <label className="font-semibold text-slate-700 block mb-1">
                  Announcement Headline *
                </label>
                <input
                  type="text"
                  id="urgent-popup-title-input"
                  value={popupTitle}
                  onChange={(e) => setPopupTitle(e.target.value)}
                  placeholder="e.g. Tripura TET 2026 Final Mock Test Series & Admit Card Schedule Released"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="font-semibold text-slate-700 block mb-1">
                  Category / Urgency Tag
                </label>
                <select
                  id="urgent-popup-tag-select"
                  value={popupTag}
                  onChange={(e) => setPopupTag(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                >
                  <option value="Urgent Notice">Urgent Notice</option>
                  <option value="Admission Alert">Admission Alert</option>
                  <option value="Exam Schedule">Exam Schedule</option>
                  <option value="Mock Test Update">Mock Test Update</option>
                  <option value="Official Circular">Official Circular</option>
                </select>
              </div>

              <div className="sm:col-span-12">
                <label className="font-semibold text-slate-700 block mb-1">
                  Announcement Details / Message *
                </label>
                <textarea
                  id="urgent-popup-message-input"
                  rows={3}
                  value={popupMessage}
                  onChange={(e) => setPopupMessage(e.target.value)}
                  placeholder="Write the complete urgent announcement message for students and visitors..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              <div className="sm:col-span-7">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <Link2 className="w-3.5 h-3.5 text-[#0056b3]" />
                  <span>Paste Any URL or Link (Optional — Drive PDF, Exam Form, or Page URL)</span>
                </label>
                <input
                  type="text"
                  id="urgent-popup-url-input"
                  value={popupLinkUrl}
                  onChange={(e) => setPopupLinkUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://trbt.tripura.gov.in or /mock-tests"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="font-semibold text-slate-700 block mb-1">
                  Link Button Label (Optional)
                </label>
                <input
                  type="text"
                  id="urgent-popup-label-input"
                  value={popupLinkLabel}
                  onChange={(e) => setPopupLinkLabel(e.target.value)}
                  placeholder="e.g. Open Official Notice / Click Here"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={popupIsActive}
                  onChange={(e) => setPopupIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-[#0056b3] focus:ring-[#0056b3]"
                />
                <span>Show immediately as entry popup when users open the portal</span>
              </label>

              <button
                type="button"
                id="urgent-popup-publish-btn"
                disabled={isSaving}
                onClick={handleAddOrUpdatePopupAnnouncement}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold text-xs shadow-xs cursor-pointer transition-all disabled:opacity-50"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>
                  {isSaving
                    ? 'Publishing...'
                    : editingPopupId
                    ? 'Update & Publish Urgent Popup'
                    : 'Post Urgent Popup Announcement'}
                </span>
              </button>
            </div>
          </div>

          {/* Active & Saved Urgent Popup Announcements List */}
          {(form.urgentPopupAnnouncements || []).length > 0 ? (
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Posted Urgent Popup Announcements ({(form.urgentPopupAnnouncements || []).length})
              </span>
              <div className="grid grid-cols-1 gap-3">
                {(form.urgentPopupAnnouncements || []).map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      item.isActive !== false
                        ? 'bg-white border-slate-200 shadow-2xs'
                        : 'bg-slate-50 border-slate-200/70 opacity-70'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold">
                          Slide #{idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-red-50 text-[#dc2626] border border-red-200 text-[10px] font-bold">
                          {item.tag || 'Urgent Notice'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">{item.date}</span>
                        {item.isActive !== false ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            Active on Entry
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                            Hidden
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-[#0a0e2a]">{item.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{item.message}</p>
                      {item.linkUrl && (
                        <div className="pt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#0056b3]">
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <a
                            href={item.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline truncate max-w-md"
                          >
                            {item.linkLabel ? `${item.linkLabel} (${item.linkUrl})` : item.linkUrl}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTogglePopupActive(item.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                        title={item.isActive !== false ? 'Hide popup' : 'Activate popup'}
                      >
                        {item.isActive !== false ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                            <span>Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Show</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditPopupItem(item)}
                        className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-[#0056b3] font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePopupItem(item.id)}
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Delete popup announcement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
              No urgent entry popup announcements posted yet. Use the form above to publish an urgent notice with an optional URL link.
            </div>
          )}
        </div>

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
                <span>
                  6. Campus &amp; Classroom Gallery Photos (Front Top Banner — {(form.campusImages || []).length}/{MAX_CAMPUS_IMAGES} Photos)
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Upload up to {MAX_CAMPUS_IMAGES} photos for the public homepage top banner. Every image is automatically compressed without quality loss before it can be posted.
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
