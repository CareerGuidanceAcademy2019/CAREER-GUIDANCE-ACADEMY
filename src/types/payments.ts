export type PaymentItemType = 'course' | 'material' | 'mock_series';
export type PaymentPlanType = 'full' | 'instalment_1' | 'instalment_2' | 'balance';
export type PaymentChannelType = 'upi' | 'bank_transfer';
export type PaymentMethodType = 'upi_manual' | 'bank_transfer' | 'razorpay';
export type PaymentStatus =
  | 'awaiting_payment'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'refund_due';

export interface PaymentRequest {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  studentCode?: string;
  itemType: PaymentItemType;
  itemId: string;
  itemTitle?: string;
  paymentType: PaymentPlanType;
  expectedAmount: number;
  referenceCode: string;
  paymentChannel: PaymentChannelType;
  paymentMethod: PaymentMethodType;
  utr?: string | null;
  utrNormalized?: string | null;
  amountReceived?: number | null;
  screenshotPath?: string | null;
  screenshotUrl?: string | null;
  status: PaymentStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectReason?: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface MaterialAccess {
  id: string;
  studentId: string;
  materialId: string;
  grantedVia: 'purchase' | 'enrolled_course' | 'admin_grant';
  paymentRequestId?: string | null;
  grantedAt: string;
}

export interface PaymentAuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  actorRole: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
}
