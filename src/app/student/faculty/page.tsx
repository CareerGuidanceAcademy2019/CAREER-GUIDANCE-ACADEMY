'use client';

import React from 'react';
import { Users, Briefcase } from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { formatFacultyName, getFacultyAvatarUrl } from '@/lib/names';

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

      {db.faculty.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No Faculty Profiles Listed Yet</h3>
          <p className="text-sm text-slate-500 mt-1">
            Faculty mentor profiles will appear here as soon as they are announced.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {db.faculty.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={member.photo || getFacultyAvatarUrl(member.name)}
                  alt={formatFacultyName(member.name)}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = getFacultyAvatarUrl(member.name);
                  }}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {member.designation && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-extrabold uppercase tracking-wide">
                        {member.designation}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[#0056b3] text-[11px] font-bold">
                      <Briefcase className="w-3 h-3" /> {member.experience}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-[#0a0e2a] mt-1">{formatFacultyName(member.name)}</h2>
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
      )}
    </div>
  );
}
