'use client';

import React, { useState } from 'react';
import { Trophy, CheckCircle2, Award, Search } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { useCga } from '@/context/CgaContext';

export default function AchievementsPage() {
  const { db } = useCga();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');

  const categories = [
    'All',
    'Teaching and Recruitment Exams',
    'Banking, SSC and Railway',
    'School Coaching',
  ];

  const filtered = db.achievements.filter((item) => {
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.exam.toLowerCase().includes(q) ||
      item.rank.toLowerCase().includes(q) ||
      item.year.includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Header */}
        <section className="cga-gradient-hero text-white py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Trophy className="w-3.5 h-3.5" /> C.G.A Udaipur Wall of Fame
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Our Toppers, State Rank-Holders & Government Selections
            </h1>
            <p className="text-blue-100 mt-2 max-w-3xl text-sm sm:text-base">
              Celebrating the hard work of our students who secured top ranks in TRBT (TET, STGT,
              STPGT), TPSC, JRBT, Banking, SSC, and TBSE & CBSE Board Examinations.
            </p>
          </div>
        </section>

        {/* Filter Bar */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#0056b3] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topper or exam..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
              />
            </div>
          </div>
        </section>

        {/* Toppers Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
              <Award className="w-10 h-10 text-[#ea580c] mx-auto mb-3" />
              <h3 className="text-base font-extrabold text-slate-900">No records matching filter</h3>
              <p className="text-xs text-slate-500 mt-1">Try selecting "All" categories above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs cga-card-hover flex flex-col"
                >
                  <div className="h-2 bg-gradient-to-r from-[#0056b3] via-[#ea580c] to-[#dc2626]" />
                  <div className="p-6 text-center border-b border-slate-100">
                    <div className="relative inline-block">
                      <img
                        src={item.photo}
                        alt={item.name}
                        className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-amber-100 shadow-md"
                      />
                      <span className="absolute -bottom-1 -right-1 bg-[#ea580c] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow whitespace-nowrap">
                        {item.year}
                      </span>
                    </div>
                    <div className="mt-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-[#ea580c] border border-amber-200 text-xs font-extrabold whitespace-nowrap">
                        {item.rank}
                      </span>
                      <h3 className="text-lg font-extrabold text-[#0a0e2a] mt-2">{item.name}</h3>
                      <p className="text-xs font-bold text-[#0056b3] mt-0.5">{item.exam}</p>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between bg-slate-50/60">
                    <p className="text-xs text-slate-600 italic leading-relaxed text-center">
                      “{item.quote}”
                    </p>
                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-700 whitespace-nowrap">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> C.G.A Udaipur Classroom Student
                    </div>
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
