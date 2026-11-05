/**
 * Career Guidance Academy (C.G.A) — Official Institute Payment Settings
 * Seeded from institute administrative directive.
 * Dynamic values are fetched from the database table `payment_settings` (id=1).
 */

export interface PaymentSettingsRecord {
  id: number;
  instituteName: string;
  payeeName: string;
  upiId: string;
  upiIdBackup?: string | null;
  bankTransferEnabled: boolean;
  bankAccountHolder: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  supportPhoneWhatsapp: string;
  supportPhone?: string;
  supportEmail: string;
  instituteAddress: string;
  gstin?: string | null;
  receiptPrefix: string;
  requestExpiryHours: number;
  adminEmails: string[];
  refundPolicyText: string;
  paymentInstructionsExtra: string;
  updatedAt?: string;
  qrImageUrl?: string | null;
  qrImageUrlBackup?: string | null;
  qrLabel?: string | null;
  qrLabelBackup?: string | null;
}

export const PAYMENT_SETTINGS: PaymentSettingsRecord = {
  id: 1,
  instituteName: 'Career Guidance Academy (C.G.A)',
  payeeName: 'CAREER GUIDANCE ACADEMY',
  upiId: 'popighosh40@okicici',
  upiIdBackup: null,
  bankTransferEnabled: true,
  bankAccountHolder: 'POPI GHOSH',
  bankName: 'SBI, UDAIPUR.',
  bankAccountNumber: '37660443471',
  bankIfsc: 'SBIN0000216',
  supportPhoneWhatsapp: '+91-7005929189',
  supportPhone: '+91-7005929189',
  supportEmail: 'careerguidanceacademy2019@gmail.com',
  instituteAddress: 'Chanban (Behind Youthclub), Udaipur, Gomati Tripura.',
  gstin: null,
  receiptPrefix: 'CGA-RCP-',
  requestExpiryHours: 48,
  adminEmails: [
    'careerguidanceacademy2019@gmail.com',
  ],
  refundPolicyText: 'contract to office with evidance and reason for refund related queries',
  paymentInstructionsExtra: 'Approval will be verify within 24 hrs',
  qrImageUrl: '/cga-upi-qr.jpg',
  qrImageUrlBackup: null,
  qrLabel: 'Primary Institute QR',
  qrLabelBackup: 'Secondary / Alternate QR',
};

export type PaymentSettingsType = PaymentSettingsRecord;

/**
 * Builds the standard NPCI UPI Intent Deep Link URI for mobile UPI apps
 * (Google Pay, PhonePe, Paytm, BHIM, Cred, SBI YONO, Amazon Pay, etc.).
 * When tapped on mobile, this immediately launches the UPI app with payee and amount pre-filled.
 */
export function buildUpiDeepLink(params: {
  amount: number;
  note: string;
  transactionRef?: string;
  customSettings?: Partial<PaymentSettingsRecord>;
}): string {
  const settings = { ...PAYMENT_SETTINGS, ...params.customSettings };
  const cleanNote = (params.note || 'CGA Course Fee')
    .slice(0, 50)
    .replace(/[^a-zA-Z0-9 -]/g, '');
  const ref = params.transactionRef || `CGA${Date.now().toString().slice(-8)}`;

  const query = new URLSearchParams({
    pa: settings.upiId,
    pn: settings.payeeName,
    am: Number(params.amount).toFixed(2),
    cu: 'INR',
    tn: cleanNote,
    tr: ref,
  });

  return `upi://pay?${query.toString()}`;
}

/**
 * Generates dynamic QR code URL for scanning with any UPI app on a smartphone.
 */
export function getUpiQrCodeUrl(upiUrl: string, size = 300): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=12&data=${encodeURIComponent(
    upiUrl
  )}`;
}

/**
 * Returns the path/URL to the active official institute QR image.
 */
export function getOfficialQrCodeAsset(customSettings?: Partial<PaymentSettingsRecord>): string {
  if (customSettings?.qrImageUrl) return customSettings.qrImageUrl;
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('cga_active_qr_image');
    if (cached) return cached;
  }
  return PAYMENT_SETTINGS.qrImageUrl || '/cga-upi-qr.jpg';
}

/**
 * Returns the backup / alternate institute QR image (if added when daily limit is reached).
 */
export function getBackupQrCodeAsset(customSettings?: Partial<PaymentSettingsRecord>): string | null {
  if (customSettings?.qrImageUrlBackup) return customSettings.qrImageUrlBackup;
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('cga_backup_qr_image');
    if (cached) return cached;
  }
  return PAYMENT_SETTINGS.qrImageUrlBackup || null;
}

/**
 * Payment Provider Abstraction
 * Designed for future gateway addition (e.g. Razorpay webhook) with zero change to fulfillment logic.
 */
export type PaymentMethodType = 'upi_manual' | 'bank_transfer' | 'razorpay';

export interface PaymentProvider {
  method: PaymentMethodType;
  isAvailable(): boolean;
  createRequest(params: {
    itemType: 'course' | 'material' | 'mock_series';
    itemId: string;
    paymentType: 'full' | 'instalment_1' | 'instalment_2' | 'balance';
    expectedAmount: number;
  }): Promise<{ referenceCode: string; expiresAt: string }>;
}
