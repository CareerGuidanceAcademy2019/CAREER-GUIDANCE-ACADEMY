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
