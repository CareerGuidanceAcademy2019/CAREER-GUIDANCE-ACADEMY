import { NextResponse } from 'next/server';
import { createAdminSupabase, requireAdmin } from '@/lib/supabase/server';

/**
 * Server-side Daily Reconciliation Export (Admin-only).
 * Generates and returns a CSV file of approved payments within a date range.
 * Fields: Receipt No, Date, Student Code, Student Name, Student Phone, Item Type, Item Title, UTR, Amount Expected, Amount Received, Payment Channel, Payment Method, Approved By, Approved At.
 */
export async function GET(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') || searchParams.get('start_date');
  const endDate = searchParams.get('endDate') || searchParams.get('end_date');

  const admin = createAdminSupabase();

  try {
    // Query approved payment requests joining student profile
    let query = admin
      .from('payment_requests')
      .select(`
        id,
        reference_code,
        item_type,
        item_id,
        payment_type,
        expected_amount,
        amount_received,
        payment_channel,
        payment_method,
        utr,
        status,
        reviewed_by,
        reviewed_at,
        created_at,
        student_id
      `)
      .eq('status', 'approved')
      .order('reviewed_at', { ascending: false });

    if (startDate) {
      query = query.gte('reviewed_at', `${startDate}T00:00:00Z`);
    }
    if (endDate) {
      query = query.lte('reviewed_at', `${endDate}T23:59:59Z`);
    }

    const { data: requests, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch student profiles for student code and phone
    const studentIds = Array.from(new Set((requests || []).map((r) => r.student_id)));
    let profileMap: Record<string, { name: string; student_code: string; phone: string }> = {};

    if (studentIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, name, student_code, phone')
        .in('id', studentIds);
      (profiles || []).forEach((p) => {
        profileMap[p.id] = {
          name: p.name || 'Student',
          student_code: p.student_code || p.id.slice(0, 8),
          phone: p.phone || '',
        };
      });
    }

    // Fetch courses for title mapping
    const { data: courses } = await admin.from('courses').select('id, name');
    const courseMap = new Map((courses || []).map((c) => [c.id, c.name]));

    // Fetch study materials for title mapping
    const { data: materials } = await admin.from('study_materials').select('id, title');
    const matMap = new Map((materials || []).map((m) => [m.id, m.title]));

    // Generate CSV lines
    const headers = [
      'Receipt No',
      'Approval Date',
      'Student Code',
      'Student Name',
      'Student Phone',
      'Item Type',
      'Item Description',
      'Payment Plan',
      'UTR / Bank Ref',
      'Amount Expected (INR)',
      'Amount Received (INR)',
      'Payment Channel',
      'Payment Method',
      'Approved By',
      'Created At',
    ];

    const escapeCsv = (str: unknown) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = (requests || []).map((r) => {
      const prof = profileMap[r.student_id] || { name: 'Student', student_code: 'CGA-STU', phone: '' };
      let itemTitle = r.item_id;
      if (r.item_type === 'course') itemTitle = courseMap.get(r.item_id) || r.item_id;
      else if (r.item_type === 'material') itemTitle = matMap.get(r.item_id) || r.item_id;
      else if (r.item_type === 'mock_series') itemTitle = 'T-TET 2026 Mock Test Series';

      const dateStr = r.reviewed_at ? r.reviewed_at.split('T')[0] : r.created_at.split('T')[0];

      return [
        escapeCsv(r.reference_code),
        escapeCsv(dateStr),
        escapeCsv(prof.student_code),
        escapeCsv(prof.name),
        escapeCsv(prof.phone),
        escapeCsv(r.item_type),
        escapeCsv(itemTitle),
        escapeCsv(r.payment_type),
        escapeCsv(r.utr || 'N/A'),
        r.expected_amount,
        r.amount_received ?? r.expected_amount,
        escapeCsv(r.payment_channel),
        escapeCsv(r.payment_method || 'upi_manual'),
        escapeCsv(r.reviewed_by || 'Admin'),
        escapeCsv(r.created_at),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const today = new Date().toISOString().split('T')[0];

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="cga_reconciliation_${today}.csv"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Export failed.' }, { status: 500 });
  }
}
