'use client';

import React from 'react';
import { Trophy, CheckCircle2 } from 'lucide-react';
import { useCga } from '@/context/CgaContext';

export default function StudentAchievementsPage() {
  const { db } = useCga();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0a0e2a] flex items-center gap-2">
          <Trophy className="w-6 h-6 text-[#ea580c]" /> C.G.A Udaipur Toppers & Rank-Holders
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Get inspired by our senior batch achievers across TET, STGT, TPSC, JRBT, Banking, TBSE, and
          CBSE Board exams.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {db.achievements.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-3"
          >
            <div className="text-center space-y-2">
              <img
                src={item.photo}
                alt={item.name}
                className="w-20 h-20 rounded-full object-cover mx-auto ring-2 ring-[#ea580c]"
              />
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-[#ea580c] border border-amber-200 text-[11px] font-extrabold">
                {item.rank} ({item.year})
              </span>
              <h3 className="text-base font-extrabold text-[#0a0e2a]">{item.name}</h3>
              <p className="text-xs font-bold text-[#0056b3]">{item.exam}</p>
              <p className="text-xs text-slate-600 italic">“{item.quote}”</p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-center text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> C.G.A Verified Achiever
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
