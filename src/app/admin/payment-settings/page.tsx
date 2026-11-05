'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Landmark,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  Building,
  QrCode,
  CreditCard,
  Clock,
  FileText,
  AlertTriangle,
  X,
  Upload,
  Plus,
  Trash2,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { PAYMENT_SETTINGS, PaymentSettingsRecord } from '@/config/paymentSettings';

export default function AdminPaymentSettingsPage() {
  const { session, showToast } = useCga();

  const [settings, setSettings] = useState<PaymentSettingsRecord>(PAYMENT_SETTINGS);
  const [initialSettings, setInitialSettings] = useState<PaymentSettingsRecord>(PAYMENT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // High-Risk Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Add / Update QR Code Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrTarget, setQrTarget] = useState<'primary' | 'backup'>('primary');
  const [qrUpiId, setQrUpiId] = useState('');
  const [qrLabel, setQrLabel] = useState('');
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrError, setQrError] = useState('');

  // Fetch current payment settings
  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { data, error } = await sb
        .from('payment_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data) {
        const mapped: PaymentSettingsRecord = {
          id: 1,
          instituteName: data.payee_name || PAYMENT_SETTINGS.instituteName,
          payeeName: data.payee_name || PAYMENT_SETTINGS.payeeName,
          upiId: data.upi_id || PAYMENT_SETTINGS.upiId,
          upiIdBackup: data.upi_id_backup || '',
          qrImageUrl: data.qr_image_url || localStorage.getItem('cga_active_qr_image') || PAYMENT_SETTINGS.qrImageUrl,
          qrImageUrlBackup: data.qr_image_url_backup || localStorage.getItem('cga_backup_qr_image') || null,
          qrLabel: data.qr_label || 'Primary Institute QR',
          qrLabelBackup: data.qr_label_backup || 'Secondary / Alternate QR',
          bankTransferEnabled: data.bank_transfer_enabled ?? true,
          bankAccountHolder: data.bank_account_holder || PAYMENT_SETTINGS.bankAccountHolder,
          bankName: data.bank_name || PAYMENT_SETTINGS.bankName,
          bankAccountNumber: data.bank_account_number || PAYMENT_SETTINGS.bankAccountNumber,
          bankIfsc: data.bank_ifsc || PAYMENT_SETTINGS.bankIfsc,
          supportPhoneWhatsapp: data.support_phone || PAYMENT_SETTINGS.supportPhoneWhatsapp,
          supportPhone: data.support_phone || PAYMENT_SETTINGS.supportPhone,
          supportEmail: data.support_email || PAYMENT_SETTINGS.supportEmail,
          instituteAddress: data.institute_address || PAYMENT_SETTINGS.instituteAddress,
          gstin: data.gstin || '',
          receiptPrefix: data.receipt_prefix || PAYMENT_SETTINGS.receiptPrefix,
          requestExpiryHours: data.request_expiry_hours || PAYMENT_SETTINGS.requestExpiryHours,
          adminEmails: PAYMENT_SETTINGS.adminEmails,
          refundPolicyText: data.refund_policy_text || PAYMENT_SETTINGS.refundPolicyText,
          paymentInstructionsExtra: data.payment_instructions_extra || PAYMENT_SETTINGS.paymentInstructionsExtra,
        };
        setSettings(mapped);
        setInitialSettings(mapped);
      }
    } catch {
      // Use fallback PAYMENT_SETTINGS
      setSettings(PAYMENT_SETTINGS);
      setInitialSettings(PAYMENT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Check if sensitive financial routing columns were touched
  const isHighRiskChange = () => {
    return (
      settings.upiId.trim() !== initialSettings.upiId.trim() ||
      settings.bankAccountNumber.trim() !== initialSettings.bankAccountNumber.trim() ||
      settings.bankIfsc.trim().toUpperCase() !== initialSettings.bankIfsc.trim().toUpperCase()
    );
  };

  const handleOpenAddQrModal = (target: 'primary' | 'backup') => {
    setQrTarget(target);
    setQrUpiId(target === 'primary' ? settings.upiId : (settings.upiIdBackup || ''));
    setQrLabel(
      target === 'primary'
        ? (settings.qrLabel || 'Primary Institute QR')
        : (settings.qrLabelBackup || 'Secondary / Alternate QR (Limit Failover)')
    );
    setQrPreview(
      target === 'primary'
        ? (settings.qrImageUrl || '/cga-upi-qr.jpg')
        : (settings.qrImageUrlBackup || null)
    );
    setQrError('');
    setQrModalOpen(true);
  };

  const handleQrFileSelected = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setQrError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setQrError('QR image file size must be less than 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setQrPreview(e.target?.result as string);
      setQrError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveQrFromModal = async () => {
    if (!qrPreview) {
      setQrError('Please upload a QR code image file.');
      return;
    }
    if (!qrUpiId.trim()) {
      setQrError('Please enter the UPI ID for this QR code.');
      return;
    }

    const updatedSettings: PaymentSettingsRecord = {
      ...settings,
      ...(qrTarget === 'primary'
        ? {
            qrImageUrl: qrPreview,
            upiId: qrUpiId.trim(),
            qrLabel: qrLabel.trim() || 'Primary Institute QR',
          }
        : {
            qrImageUrlBackup: qrPreview,
            upiIdBackup: qrUpiId.trim(),
            qrLabelBackup: qrLabel.trim() || 'Secondary / Alternate QR',
          }),
    };

    setSettings(updatedSettings);
    setQrModalOpen(false);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      await sb
        .from('payment_settings')
        .update({
          upi_id: updatedSettings.upiId,
          upi_id_backup: updatedSettings.upiIdBackup || null,
          qr_image_url: updatedSettings.qrImageUrl || '/cga-upi-qr.jpg',
          qr_image_url_backup: updatedSettings.qrImageUrlBackup || null,
          qr_label: updatedSettings.qrLabel || 'Primary Institute QR',
          qr_label_backup: updatedSettings.qrLabelBackup || 'Secondary / Alternate QR',
        })
        .eq('id', 1);

      localStorage.setItem('cga_active_qr_image', updatedSettings.qrImageUrl || '/cga-upi-qr.jpg');
      if (updatedSettings.qrImageUrlBackup) {
        localStorage.setItem('cga_backup_qr_image', updatedSettings.qrImageUrlBackup);
      }
      localStorage.setItem('cga_payment_settings', JSON.stringify(updatedSettings));

      showToast(
        'QR Code Updated',
        qrTarget === 'primary'
          ? 'New primary QR code activated! Students can now pay using this QR.'
          : 'New secondary / backup QR code added! Students can switch to it when limits are reached.',
        'success'
      );
    } catch {
      localStorage.setItem('cga_active_qr_image', updatedSettings.qrImageUrl || '/cga-upi-qr.jpg');
      if (updatedSettings.qrImageUrlBackup) {
        localStorage.setItem('cga_backup_qr_image', updatedSettings.qrImageUrlBackup);
      }
      localStorage.setItem('cga_payment_settings', JSON.stringify(updatedSettings));
      showToast('QR Code Saved Locally', 'QR code saved to browser storage. Click "Save All Configuration" to sync.', 'info');
    }
  };

  const handleRemoveBackupQr = async () => {
    const updated: PaymentSettingsRecord = {
      ...settings,
      qrImageUrlBackup: null,
      upiIdBackup: '',
    };
    setSettings(updated);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      await sb
        .from('payment_settings')
        .update({
          qr_image_url_backup: null,
          upi_id_backup: null,
        })
        .eq('id', 1);
      localStorage.removeItem('cga_backup_qr_image');
      localStorage.setItem('cga_payment_settings', JSON.stringify(updated));
      showToast('Alternate QR Removed', 'Secondary QR code has been removed.', 'info');
    } catch {}
  };

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();

    if (isHighRiskChange()) {
      setShowPasswordModal(true);
      setAdminPassword('');
      setPasswordError('');
      return;
    }

    void executeUpdateSettings(null);
  };

  const executeUpdateSettings = async (pwd: string | null) => {
    setIsSaving(true);
    setPasswordError('');

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();

      const payload = {
        payee_name: settings.payeeName,
        upi_id: settings.upiId,
        upi_id_backup: settings.upiIdBackup || null,
        qr_image_url: settings.qrImageUrl || '/cga-upi-qr.jpg',
        qr_image_url_backup: settings.qrImageUrlBackup || null,
        qr_label: settings.qrLabel || 'Primary Institute QR',
        qr_label_backup: settings.qrLabelBackup || 'Secondary / Alternate QR',
        bank_transfer_enabled: settings.bankTransferEnabled,
        bank_account_holder: settings.bankAccountHolder,
        bank_name: settings.bankName,
        bank_account_number: settings.bankAccountNumber,
        bank_ifsc: settings.bankIfsc,
        support_phone: settings.supportPhone,
        support_email: settings.supportEmail,
        institute_address: settings.instituteAddress,
        gstin: settings.gstin || null,
        receipt_prefix: settings.receiptPrefix,
        request_expiry_hours: settings.requestExpiryHours,
        refund_policy_text: settings.refundPolicyText,
        payment_instructions_extra: settings.paymentInstructionsExtra,
      };

      if (isHighRiskChange()) {
        const { data, error } = await sb.rpc('cga_update_payment_settings', {
          p_admin_password: pwd,
          p_settings_json: payload,
        });

        if (error) {
          setPasswordError(error.message || 'Re-authentication failed. Incorrect password.');
          setIsSaving(false);
          return;
        }
      } else {
        const { error } = await sb
          .from('payment_settings')
          .update(payload)
          .eq('id', 1);

        if (error) {
          throw error;
        }
      }

      localStorage.setItem('cga_active_qr_image', settings.qrImageUrl || '/cga-upi-qr.jpg');
      if (settings.qrImageUrlBackup) {
        localStorage.setItem('cga_backup_qr_image', settings.qrImageUrlBackup);
      } else {
        localStorage.removeItem('cga_backup_qr_image');
      }
      localStorage.setItem('cga_payment_settings', JSON.stringify(settings));

      showToast('Settings Saved', 'Bank & UPI payment configuration updated successfully.', 'success');
      setInitialSettings({ ...settings });
      setShowPasswordModal(false);
    } catch (err: any) {
      showToast('Update Failed', err.message || 'Could not save payment settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0056b3] text-xs font-bold mb-1">
            <Landmark className="w-3.5 h-3.5" /> High-Security Gateway Config
          </div>
          <h1 className="text-2xl font-black text-[#0a0e2a]">
            Institute Payment & Bank Transfer Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Public financial identifiers presented to students for manual UPI transfers and NEFT/RTGS bank transfers.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSettings}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Reload
        </button>
      </div>

      {/* High-Risk Protection Warning Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h4 className="font-extrabold text-amber-900">
            Protected Financial Routing Policy
          </h4>
          <p className="text-amber-800 leading-relaxed">
            Changing the <strong>UPI ID</strong>, <strong>Bank Account Number</strong>, or <strong>IFSC Code</strong> redirects all student funds. Modifying these fields triggers mandatory administrator password re-authentication and an immutable audit log trail.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveClick} className="space-y-8">
        {/* Section 1: UPI Gateway Configuration */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-[#0056b3]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0a0e2a]">UPI Gateway Settings</h2>
              <p className="text-xs text-slate-500">
                Primary and backup Virtual Payment Addresses (VPA) for Google Pay, PhonePe, Paytm & BHIM.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Payee Legal Name (Account Holder Name) *
              </label>
              <input
                type="text"
                required
                value={settings.payeeName}
                onChange={(e) => setSettings({ ...settings, payeeName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0056b3]/20 focus:border-[#0056b3]"
              />
              <span className="text-[10px] text-slate-400">Appears on the student UPI app confirmation screen</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">
                  Primary Institute UPI ID *
                </label>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  High Risk
                </span>
              </div>
              <input
                type="text"
                required
                value={settings.upiId}
                onChange={(e) => setSettings({ ...settings, upiId: e.target.value.trim() })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50/20 text-xs font-mono font-bold text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
              />
              <span className="text-[10px] text-slate-400">Current: popighosh40@okicici</span>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">
                Backup / Standby UPI ID (Optional)
              </label>
              <input
                type="text"
                value={settings.upiIdBackup || ''}
                onChange={(e) => setSettings({ ...settings, upiIdBackup: e.target.value.trim() })}
                placeholder="Leave blank if none"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0056b3]/20 focus:border-[#0056b3]"
              />
            </div>
          </div>

          {/* UPI QR Code Management & Limit Failover */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#0056b3]" />
                  <span>UPI QR Code Management &amp; Daily Limit Protection</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage active QR codes shown to students during course &amp; mock test enrollment. When personal UPI limits are reached, secondary QR codes prevent enrollment failures.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenAddQrModal('primary')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-black cursor-pointer shadow-sm transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add / Replace QR Code
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary Active QR Card */}
              <div className="p-4 rounded-2xl border-2 border-blue-200 bg-blue-50/30 flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#0056b3] text-[10px] font-black uppercase tracking-wider">
                      Primary Active QR
                    </span>
                    <h4 className="font-extrabold text-xs text-slate-900 mt-1">
                      {settings.qrLabel || 'Primary Institute QR'}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                      UPI ID: <strong>{settings.upiId}</strong>
                    </p>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shrink-0 mt-1" title="Active" />
                </div>

                <div className="flex items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <img
                    src={settings.qrImageUrl || '/cga-upi-qr.jpg'}
                    alt="Primary UPI QR Code"
                    className="w-36 h-36 object-contain rounded-lg"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddQrModal('primary')}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 text-[#0056b3] font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" /> Replace Primary QR
                </button>
              </div>

              {/* Secondary / Alternate QR Card */}
              <div className={`p-4 rounded-2xl border-2 flex flex-col justify-between space-y-3 ${
                settings.qrImageUrlBackup
                  ? 'border-purple-200 bg-purple-50/30'
                  : 'border-dashed border-slate-200 bg-slate-50/50'
              }`}>
                {settings.qrImageUrlBackup ? (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black uppercase tracking-wider">
                          Secondary / Alternate QR
                        </span>
                        <h4 className="font-extrabold text-xs text-slate-900 mt-1">
                          {settings.qrLabelBackup || 'Secondary / Alternate QR'}
                        </h4>
                        <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                          UPI ID: <strong>{settings.upiIdBackup || 'Not specified'}</strong>
                        </p>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-purple-100 shrink-0 mt-1" title="Alternate Active" />
                    </div>

                    <div className="flex items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <img
                        src={settings.qrImageUrlBackup}
                        alt="Secondary UPI QR Code"
                        className="w-36 h-36 object-contain rounded-lg"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenAddQrModal('backup')}
                        className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-purple-50 border border-purple-200 text-purple-900 font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" /> Replace
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveBackupQr}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-[#dc2626] border border-red-200 text-xs font-bold cursor-pointer transition-all"
                        title="Remove Alternate QR"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="my-auto py-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800">
                        No Alternate QR Code Configured
                      </h4>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-0.5">
                        Add a secondary QR from another UPI account (e.g. PhonePe/Paytm/SBI) so students can pay when primary QR hits daily bank transaction limit.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenAddQrModal('backup')}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Add Alternate QR Code
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Direct Bank Transfer Details */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#0a0e2a]">
                  NEFT / RTGS / IMPS Bank Transfer
                </h2>
                <p className="text-xs text-slate-500">
                  Allow students to pay directly via online banking or bank branch counter.
                </p>
              </div>
            </div>

            {/* Toggle Enable Bank Transfer */}
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-bold text-slate-700">Enable Option:</span>
              <input
                type="checkbox"
                checked={settings.bankTransferEnabled}
                onChange={(e) => setSettings({ ...settings, bankTransferEnabled: e.target.checked })}
                className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Bank Account Holder Name *
              </label>
              <input
                type="text"
                required
                value={settings.bankAccountHolder}
                onChange={(e) => setSettings({ ...settings, bankAccountHolder: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0056b3]/20 focus:border-[#0056b3]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Bank & Branch *</label>
              <input
                type="text"
                required
                value={settings.bankName}
                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0056b3]/20 focus:border-[#0056b3]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">
                  Bank Account Number *
                </label>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  High Risk
                </span>
              </div>
              <input
                type="text"
                required
                value={settings.bankAccountNumber}
                onChange={(e) => setSettings({ ...settings, bankAccountNumber: e.target.value.replace(/\s+/g, '') })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50/20 text-xs font-mono font-bold text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">IFSC Code *</label>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  High Risk
                </span>
              </div>
              <input
                type="text"
                required
                value={settings.bankIfsc}
                onChange={(e) => setSettings({ ...settings, bankIfsc: e.target.value.trim().toUpperCase() })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50/20 text-xs font-mono font-bold text-rose-950 uppercase focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Institute Contact & Receipts */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0a0e2a]">
                Contact, Support & Receipt Settings
              </h2>
              <p className="text-xs text-slate-500">
                Contact information printed on generated receipts and payment assistance cards.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Support Phone / WhatsApp *
              </label>
              <input
                type="text"
                required
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Support Email *</label>
              <input
                type="email"
                required
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">
                Institute Physical Address *
              </label>
              <input
                type="text"
                required
                value={settings.instituteAddress}
                onChange={(e) => setSettings({ ...settings, instituteAddress: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">GSTIN (Optional)</label>
              <input
                type="text"
                value={settings.gstin || ''}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value.trim() })}
                placeholder="Leave blank or NA if not registered"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Receipt Prefix *</label>
              <input
                type="text"
                required
                value={settings.receiptPrefix}
                onChange={(e) => setSettings({ ...settings, receiptPrefix: e.target.value.trim() })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Request Expiry Window (Hours) *
              </label>
              <input
                type="number"
                min={1}
                max={168}
                required
                value={settings.requestExpiryHours}
                onChange={(e) => setSettings({ ...settings, requestExpiryHours: parseInt(e.target.value) || 48 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Verification SLA / Extra Instructions *
              </label>
              <input
                type="text"
                required
                value={settings.paymentInstructionsExtra}
                onChange={(e) => setSettings({ ...settings, paymentInstructionsExtra: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">
                Official Refund Policy Text *
              </label>
              <textarea
                rows={2}
                required
                value={settings.refundPolicyText}
                onChange={(e) => setSettings({ ...settings, refundPolicyText: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            {isHighRiskChange() ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> High-risk financial changes require admin password.
              </span>
            ) : (
              'Changes take effect immediately across all student checkout screens.'
            )}
          </p>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-[#0056b3] hover:bg-[#1e3a8a] disabled:opacity-50 text-white text-xs font-extrabold shadow-md cursor-pointer transition-all inline-flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Payment Settings
              </>
            )}
          </button>
        </div>
      </form>

      {/* Add / Update QR Code Modal */}
      {qrModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0056b3] flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {qrTarget === 'primary' ? 'Add / Replace Primary QR' : 'Add Alternate Failover QR'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {qrTarget === 'primary'
                      ? 'Active QR code scanned by students during enrollment'
                      : 'Students switch to this QR when daily limits are reached'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Role Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">QR Role &amp; Priority</label>
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setQrTarget('primary');
                    setQrUpiId(settings.upiId);
                    setQrLabel(settings.qrLabel || 'Primary Institute QR');
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    qrTarget === 'primary' ? 'bg-white text-[#0056b3] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Primary Active QR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQrTarget('backup');
                    setQrUpiId(settings.upiIdBackup || '');
                    setQrLabel(settings.qrLabelBackup || 'Secondary / Alternate QR');
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    qrTarget === 'backup' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Alternate QR (Limit Failover)
                </button>
              </div>
            </div>

            {/* QR Image Upload & Preview */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                QR Code Image File (PNG, JPG, WebP) *
              </label>
              <div className="flex items-center gap-4 p-3 rounded-2xl border border-slate-200 bg-slate-50">
                {qrPreview ? (
                  <img
                    src={qrPreview}
                    alt="Uploaded QR Code Preview"
                    className="w-24 h-24 object-contain rounded-xl border border-slate-300 bg-white shadow-2xs shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center text-slate-400 shrink-0">
                    <QrCode className="w-8 h-8" />
                  </div>
                )}
                <div className="space-y-1.5 flex-1">
                  <label className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-[#0056b3]" />
                    <span>{qrPreview ? 'Change QR Image' : 'Select QR Image File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleQrFileSelected(f);
                      }}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-500">
                    Upload your official Google Pay, PhonePe, Paytm or Bank QR code image screenshot.
                  </p>
                </div>
              </div>
            </div>

            {/* Corresponding UPI ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Associated UPI ID (VPA) *
              </label>
              <input
                type="text"
                required
                value={qrUpiId}
                onChange={(e) => setQrUpiId(e.target.value.trim())}
                placeholder="e.g. popighosh40@okicici or careerguidance@sbi"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0056b3]/20 focus:border-[#0056b3]"
              />
              <span className="text-[10px] text-slate-400">
                Must match the account behind this QR code for verification.
              </span>
            </div>

            {/* QR Label */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                QR Display Label
              </label>
              <input
                type="text"
                value={qrLabel}
                onChange={(e) => setQrLabel(e.target.value)}
                placeholder="e.g. Google Pay Institute QR, PhonePe Alternate QR"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
              />
            </div>

            {qrError && (
              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {qrError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQrFromModal}
                className="px-5 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-black text-xs cursor-pointer shadow-md inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Save &amp; Activate QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== RE-AUTHENTICATION PASSWORD MODAL ==================== */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-lg font-extrabold text-slate-900">
                  Confirm High-Risk Financial Update
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are altering the <strong>UPI ID</strong> or <strong>Bank Account Number / IFSC</strong>. Any future student payments will be routed according to these new values. Please re-enter your administrator password to confirm authorization.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Administrator Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Enter your admin account password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  autoFocus
                />
              </div>
              {passwordError && (
                <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {passwordError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeUpdateSettings(adminPassword)}
                disabled={isSaving || !adminPassword}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                {isSaving ? 'Authenticating...' : 'Authorize & Commit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
