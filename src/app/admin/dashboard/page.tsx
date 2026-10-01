'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  IndianRupee,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { CustomArrowRightSvg } from '@/components/ui/CustomIcons';

export default function AdminDashboardPage() {
  const { db } = useCga();

  const totalStudents = db.students.length;
  const activeCourses = db.courses.filter((c) => c.status === 'Open for Admission').length;
  const closedCourses = db.courses.length - activeCourses;

  const totalRevenue = db.feePayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPendingDues = db.students.reduce(
    (sum, s) => sum + s.enrollments.reduce((eSum, e) => eSum + e.dueAmount, 0),
    0
  );

  // Category-wise course & seat chart calculation
  const categoryStats = [
    'Teaching and Recruitment Exams',
    'Banking, SSC and Railway',
    'Other Competitive Examinations',
    'School Coaching',
  ].map((cat) => {
    const catCourses = db.courses.filter((c) => c.category === cat);
    const totalSeats = catCourses.reduce((s, c) => s + c.batchSize, 0);
    const enrolledSeats = catCourses.reduce(
      (s, c) => s + Math.max(0, c.batchSize - c.seatsAvailable),
      0
    );
    const percent = totalSeats > 0 ? Math.round((enrolledSeats / totalSeats) * 100) : 0;
    return { category: cat, count: catCourses.length, enrolledSeats, totalSeats, percent };
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="cga-gradient-hero rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="inline-block px-3 py-0.5 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider">
            Udaipur Campus • Live Executive Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Career Guidance Academy (C.G.A) — Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1">
            All changes made here persist in localStorage and update the Public Website and Student
            Portal immediately.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Link
            href="/admin/courses"
            className="px-4 py-2.5 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-white text-xs font-bold"
          >
            + Add / Control Batches
          </Link>
          <Link
            href="/admin/site-content"
            className="px-4 py-2.5 rounded-xl bg-white text-[#0a0e2a] hover:bg-blue-50 text-xs font-bold"
          >
            Edit Public Website CMS
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Registered Students</span>
            <p className="text-3xl font-extrabold text-[#0a0e2a] mt-1">{totalStudents}</p>
            <Link
              href="/admin/students"
              className="text-[11px] font-bold text-[#0056b3] hover:underline inline-flex items-center gap-0.5 mt-1"
            >
              Manage & Export CSV <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0056b3] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Active / Total Courses</span>
            <p className="text-3xl font-extrabold text-[#0a0e2a] mt-1">
              {activeCourses}{' '}
              <span className="text-sm font-semibold text-slate-400">/ {db.courses.length}</span>
            </p>
            <span className="text-[11px] font-semibold text-[#dc2626] block mt-1">
              {closedCourses} Batches Closed/Full
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ea580c] flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Revenue Collected</span>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] font-semibold text-slate-500 block mt-1">
              Across {db.feePayments.length} verified receipts
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Pending Fee Dues</span>
            <p className="text-3xl font-extrabold text-[#dc2626] mt-1">
              ₹{totalPendingDues.toLocaleString('en-IN')}
            </p>
            <Link
              href="/admin/fees"
              className="text-[11px] font-bold text-[#dc2626] hover:underline inline-flex items-center gap-0.5 mt-1"
            >
              View Fee Defaulters <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#dc2626] flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Wing-wise Seat Occupancy Chart */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#0a0e2a] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#0056b3]" /> Batch Seat Occupancy by Division
              </h2>
              <p className="text-xs text-slate-500">
                Real-time seat fill percentage across C.G.A’s 4 academic & competitive wings
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {categoryStats.map((item) => (
              <div key={item.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    {item.category}{' '}
                    <span className="text-slate-400 font-normal">({item.count} batches)</span>
                  </span>
                  <span className="font-extrabold text-[#0056b3]">
                    {item.enrolledSeats}/{item.totalSeats} Seats ({item.percent}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0056b3] to-[#ea580c]"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Fee Payments & Enrolments */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-extrabold text-[#0a0e2a]">
              Recent Enrolments & Fee Receipts
            </h2>
            <Link
              href="/admin/fees"
              className="text-xs font-bold text-[#0056b3] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              All Receipts <CustomArrowRightSvg className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {db.feePayments.slice(0, 5).map((pay) => (
              <div
                key={pay.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-900 truncate">{pay.studentName}</p>
                  <p className="text-slate-500 truncate">{pay.courseName}</p>
                  <span className="text-[10px] font-mono text-[#0056b3]">{pay.receiptNo}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-extrabold text-emerald-700 text-sm block">
                    +₹{pay.amount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400">{pay.paymentMode}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
