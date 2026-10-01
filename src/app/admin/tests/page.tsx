'use client';

import React, { useState } from 'react';
import {
  Plus,
  ClipboardCheck,
  Trophy,
  Trash2,
  X,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { MockTest, MCQQuestion } from '@/data/initialSeedData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomCheckSvg, CustomCrossSvg } from '@/components/ui/CustomIcons';

export default function AdminMockTestsPage() {
  const { db, saveMockTest, deleteMockTest } = useCga();
  const [editingTest, setEditingTest] = useState<MockTest | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MockTest | null>(null);
  const [selectedTestForRanks, setSelectedTestForRanks] = useState<string>(
    db.mockTests[0]?.id || ''
  );

  // Question builder state inside modal
  const [newQText, setNewQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctIdx, setCorrectIdx] = useState(0);
  const [explanation, setExplanation] = useState('');

  const openCreateModal = () => {
    const firstCourse = db.courses[0];
    setIsNew(true);
    setEditingTest({
      id: `mock-${Date.now()}`,
      title: '',
      courseId: firstCourse?.id || 'crs-tet-1',
      courseName: firstCourse?.name || 'Tripura TET Integrated Batch',
      batchName: firstCourse?.batchName || 'TET-2026 Morning Batch A',
      durationMinutes: 15,
      totalMarks: 8,
      marksPerQuestion: 4,
      negativeMarking: 1,
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'Published',
      questions: [
        {
          id: `q-${Date.now()}-1`,
          question: 'Who is considered the father of Educational Psychology?',
          options: ['E.L. Thorndike', 'Jean Piaget', 'John Dewey', 'Sigmund Freud'],
          correctOptionIndex: 0,
          explanation: 'Edward Lee Thorndike is widely recognized as the father of modern Educational Psychology.',
        },
      ],
    });
  };

  const handleAddQuestion = () => {
    if (!editingTest || !newQText.trim() || !optA.trim() || !optB.trim()) return;
    const q: MCQQuestion = {
      id: `q-${Date.now()}`,
      question: newQText.trim(),
      options: [optA.trim(), optB.trim(), optC.trim() || 'Option C', optD.trim() || 'Option D'],
      correctOptionIndex: correctIdx,
      explanation: explanation.trim() || 'Refer to C.G.A classroom notes.',
    };
    const nextQs = [...editingTest.questions, q];
    setEditingTest({
      ...editingTest,
      questions: nextQs,
      totalMarks: nextQs.length * editingTest.marksPerQuestion,
    });
    setNewQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setExplanation('');
  };

  const handleSaveTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest || !editingTest.title.trim()) return;
    const computedMarks = editingTest.questions.length * editingTest.marksPerQuestion;
    saveMockTest({ ...editingTest, totalMarks: computedMarks }, isNew);
    setEditingTest(null);
  };

  const togglePublish = (test: MockTest) => {
    saveMockTest(
      {
        ...test,
        status: test.status === 'Published' ? 'Draft' : 'Published',
      },
      false
    );
  };

  const rankListAttempts = db.testAttempts
    .filter((a) => a.testId === selectedTestForRanks)
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
            Mock Test Builder, Batch Launch & Rank Lists
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Create MCQ mock tests with negative marking and timers, launch/publish for selected
            batches, and inspect batch rank lists.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" /> Create New Mock Test
        </button>
      </div>

      {/* Mock Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {db.mockTests.map((test) => (
          <div
            key={test.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0056b3] text-[11px] font-extrabold truncate">
                  {test.batchName}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold whitespace-nowrap shrink-0 ${
                    test.status === 'Published'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-[#ea580c] border border-amber-200'
                  }`}
                >
                  {test.status}
                </span>
              </div>

              <h2 className="text-base font-extrabold text-[#0a0e2a]">{test.title}</h2>
              <p className="text-xs text-slate-500">
                {test.questions.length} Questions • {test.totalMarks} Marks • {test.durationMinutes}{' '}
                Mins • -{test.negativeMarking} Negative
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => togglePublish(test)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {test.status === 'Published' ? 'Unpublish' : 'Launch for Batch'}
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(test)}
                className="p-2 rounded-xl bg-red-50 text-[#dc2626] hover:bg-red-100 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Batch Rank List & Results Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#ea580c]" /> Batch Results & Merit Rank List
          </h2>
          <select
            value={selectedTestForRanks}
            onChange={(e) => setSelectedTestForRanks(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
          >
            {db.mockTests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.batchName})
              </option>
            ))}
          </select>
        </div>

        {rankListAttempts.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No student attempts recorded for this test yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase">
                  <th className="py-3 px-3">Batch Rank</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Score</th>
                  <th className="py-3 px-3">Correct / Wrong</th>
                  <th className="py-3 px-3">Accuracy</th>
                  <th className="py-3 px-3">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rankListAttempts.map((att, idx) => (
                  <tr key={att.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-[#ea580c] border border-amber-200 font-extrabold whitespace-nowrap">
                        Rank #{idx + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-extrabold text-slate-900">
                      {att.studentName}
                    </td>
                    <td className="py-3.5 px-3 font-extrabold text-[#0056b3] whitespace-nowrap">
                      {att.score} / {att.totalMarks}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                        {att.correctCount} <CustomCheckSvg className="w-3.5 h-3.5" />
                      </span>{' '}
                      /{' '}
                      <span className="text-[#dc2626] font-bold inline-flex items-center gap-1">
                        {att.wrongCount} <CustomCrossSvg className="w-3.5 h-3.5" />
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-bold whitespace-nowrap">{att.accuracy}%</td>
                    <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                      {att.submittedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Mock Test Modal */}
      {editingTest && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveTest}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#0a0e2a]">
                Create & Launch Mock Test
              </h3>
              <button
                type="button"
                onClick={() => setEditingTest(null)}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Mock Test Title *</label>
                <input
                  type="text"
                  required
                  value={editingTest.title}
                  onChange={(e) => setEditingTest({ ...editingTest, title: e.target.value })}
                  placeholder="e.g., STGT Social Studies Full-Length Mock Test #02"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Course / Batch</label>
                <select
                  value={editingTest.courseId}
                  onChange={(e) => {
                    const crs = db.courses.find((c) => c.id === e.target.value);
                    setEditingTest({
                      ...editingTest,
                      courseId: e.target.value,
                      courseName: crs?.name || editingTest.courseName,
                      batchName: crs?.batchName || editingTest.batchName,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {db.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.batchName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    value={editingTest.durationMinutes}
                    onChange={(e) =>
                      setEditingTest({ ...editingTest, durationMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Marks / Q</label>
                  <input
                    type="number"
                    value={editingTest.marksPerQuestion}
                    onChange={(e) =>
                      setEditingTest({ ...editingTest, marksPerQuestion: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Negative</label>
                  <input
                    type="number"
                    value={editingTest.negativeMarking}
                    onChange={(e) =>
                      setEditingTest({ ...editingTest, negativeMarking: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Question Bank Builder */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#0a0e2a]">
                  Add MCQ to Question Bank ({editingTest.questions.length} added)
                </span>
              </div>
              <input
                type="text"
                value={newQText}
                onChange={(e) => setNewQText(e.target.value)}
                placeholder="Enter MCQ question stem..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={optA}
                  onChange={(e) => setOptA(e.target.value)}
                  placeholder="Option A"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                />
                <input
                  type="text"
                  value={optB}
                  onChange={(e) => setOptB(e.target.value)}
                  placeholder="Option B"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                />
                <input
                  type="text"
                  value={optC}
                  onChange={(e) => setOptC(e.target.value)}
                  placeholder="Option C"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                />
                <input
                  type="text"
                  value={optD}
                  onChange={(e) => setOptD(e.target.value)}
                  placeholder="Option D"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <select
                  value={correctIdx}
                  onChange={(e) => setCorrectIdx(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold"
                >
                  <option value={0}>Correct Answer: Option A</option>
                  <option value={1}>Correct Answer: Option B</option>
                  <option value={2}>Correct Answer: Option C</option>
                  <option value={3}>Correct Answer: Option D</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer"
                >
                  + Add Question to Test
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTest(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0056b3] text-white font-bold cursor-pointer"
              >
                Publish & Launch Mock Test
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Mock Test?"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMockTest(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
