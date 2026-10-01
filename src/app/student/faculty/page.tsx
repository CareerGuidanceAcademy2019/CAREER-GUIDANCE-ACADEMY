'use client';

import React from 'react';
import { Users, Briefcase } from 'lucide-react';
import { useCga } from '@/context/CgaContext';

export default function StudentFacultyPage() {
  const { db } = useCga();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0a0e2a] flex items-center gap-2">
          <Users className="w-6 h-6 text-[#0056b3]" /> C.G.A Faculty Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Know your subject mentors, qualifications, and areas of specialization at Udaipur Campus.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {db.faculty.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4"
          >
            <div className="flex items-center gap-4">
              <img
                src={member.photo}
                alt={member.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
              />
              <div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[#0056b3] text-[11px] font-bold">
                  <Briefcase className="w-3 h-3" /> {member.experience}
                </span>
                <h2 className="text-base font-extrabold text-[#0a0e2a] mt-1">{member.name}</h2>
                <p className="text-xs font-bold text-[#ea580c]">{member.subject}</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              {member.qualification}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">{member.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
