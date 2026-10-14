'use client';

import React from 'react';
import { GraduationCap, Award, BookOpen, Briefcase } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { useCga } from '@/context/CgaContext';

export default function FacultyPage() {
  const { db } = useCga();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-1">
        {/* Page Header */}
        <section className="cga-gradient-hero text-white py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
              <GraduationCap className="w-4 h-4" /> Academic Leadership
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Meet Our Dedicated Faculty & Subject Experts
            </h1>
            <p className="text-blue-100 mt-2 max-w-3xl text-sm sm:text-base">
              Every educator at Career Guidance Academy (C.G.A), Udaipur brings deep examination
              expertise, NET/SET/Ph.D. academic credentials, and a proven track record of mentoring
              state rankers.
            </p>
          </div>
        </section>

        {/* Faculty Cards Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          {db.faculty.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700">No Faculty Profiles Listed Yet</h3>
              <p className="text-sm text-slate-500 mt-1">
                Faculty profiles will appear here as soon as they are announced.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {db.faculty.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs cga-card-hover flex flex-col"
                >
                  <div className="p-6 flex items-start gap-4 border-b border-slate-100">
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-[#0056b3]/20 shrink-0 shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {member.designation && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-extrabold uppercase tracking-wide">
                            {member.designation}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0056b3] border border-blue-200 text-xs font-bold">
                          <Briefcase className="w-3 h-3" /> {member.experience}
                        </span>
                      </div>
                      <h2 className="text-lg font-extrabold text-[#0a0e2a] mt-1.5">{member.name}</h2>
                      <p className="text-xs font-bold text-[#ea580c] mt-0.5">{member.subject}</p>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          Academic Qualification
                        </span>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">
                          {member.qualification}
                        </p>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{member.bio}</p>
                    </div>

                    {member.specializationTags && member.specializationTags.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {member.specializationTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
