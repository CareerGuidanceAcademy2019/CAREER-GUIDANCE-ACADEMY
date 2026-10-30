'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Upload, X, CheckCircle2 } from 'lucide-react';
import { ParsedMCQ } from '@/lib/mcqParser';
import { MockQuestionGroup } from '@/data/initialSeedData';

interface Draft {
  key: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  file: File | null;
  preview: string | null;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const newDraft = (): Draft => ({
  key: `d-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  question: '',
  options: ['', '', '', ''],
  correct: 0,
  explanation: '',
  file: null,
  preview: null,
});

interface Props {
  mode: 'passage' | 'diagram';
  testId: string;
  existingCount: number;
  groupCount: number;
  onAdd: (questions: ParsedMCQ[], group: MockQuestionGroup | null) => void;
  onError: (msg: string) => void;
}

export function ManualQuestionBuilder({ mode, testId, existingCount, groupCount, onAdd, onError }: Props) {
  const [passageTitle, setPassageTitle] = useState('');
  const [passageText, setPassageText] = useState('');
  const [passageFile, setPassageFile] = useState<File | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([newDraft()]);
  const [busy, setBusy] = useState(false);

  const update = (i: number, patch: Partial<Draft>) =>
    setDrafts((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const pickImage = (i: number, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return onError('Only image files are allowed.');
    if (file.size > MAX_IMAGE_BYTES) return onError('Image must be under 8 MB.');
    update(i, { file, preview: URL.createObjectURL(file) });
  };

  const upload = async (file: File, kind: 'question' | 'passage', alt: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('testId', testId);
    form.append('maxDimension', kind);
    form.append('altText', alt);
    const res = await fetch('/api/mock-tests/upload-image', { method: 'POST', body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Image upload failed.');
    }
    const data = await res.json();
    return data.storagePath as string;
  };

  const submit = async () => {
    if (mode === 'passage' && !passageText.trim()) return onError('Passage text is required.');
    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];
      if (!d.question.trim()) return onError(`Question ${i + 1}: enter the question text.`);
      if (d.options.some((o) => !o.trim())) return onError(`Question ${i + 1}: fill all four options.`);
      if (mode === 'diagram' && !d.file) return onError(`Question ${i + 1}: attach a diagram.`);
    }

    setBusy(true);
    try {
      const stamp = Date.now();
      let group: MockQuestionGroup | null = null;
      if (mode === 'passage') {
        const imagePath = passageFile ? await upload(passageFile, 'passage', passageTitle || 'Passage diagram') : null;
        group = {
          id: `grp-${stamp}`,
          testId,
          position: groupCount + 1,
          passageText: passageText.trim(),
          imagePath,
          imageAlt: passageTitle.trim() || 'Comprehension passage',
        };
      }

      const built: ParsedMCQ[] = [];
      for (let i = 0; i < drafts.length; i++) {
        const d = drafts[i];
        const position = existingCount + i + 1;
        let imagePath: string | null = null;
        if (mode === 'diagram' && d.file) imagePath = await upload(d.file, 'question', `Diagram for question ${position}`);
        built.push({
          id: `q-${stamp}-${i}`,
          position,
          question: d.question.trim(),
          options: d.options.map((o) => o.trim()),
          correctOptionIndex: d.correct,
          explanation: d.explanation.trim(),
          groupId: group ? group.id : null,
          imagePath,
          imageAlt: imagePath ? `Diagram for question ${position}` : null,
          needsDiagram: Boolean(imagePath),
          confidence: 'high',
          warnings: [],
        });
      }

      onAdd(built, group);
      setPassageTitle('');
      setPassageText('');
      setPassageFile(null);
      setDrafts([newDraft()]);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to add questions.');
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'w-full p-2.5 rounded-xl border border-slate-200 text-xs';

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
      <div>
        <h2 className="text-base font-extrabold text-slate-900">
          {mode === 'passage' ? 'Add Passage with Questions' : 'Add Question with Diagram'}
        </h2>
        <p className="text-xs text-slate-500">
          {mode === 'passage'
            ? 'Enter the passage once, add its questions, and select the correct option for each. They are added together to the end of the test.'
            : 'Paste the question, attach its diagram, choose the correct option, then add it to the existing questions.'}
        </p>
      </div>

      {mode === 'passage' && (
        <div className="space-y-2 p-4 rounded-2xl bg-purple-50/50 border border-purple-200">
          <input
            className={inputCls}
            placeholder="Passage title (optional)"
            value={passageTitle}
            onChange={(e) => setPassageTitle(e.target.value)}
          />
          <textarea
            rows={7}
            className={`${inputCls} font-mono leading-relaxed`}
            placeholder="Paste the passage here..."
            value={passageText}
            onChange={(e) => setPassageText(e.target.value)}
          />
          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <Upload className="w-4 h-4" /> {passageFile ? passageFile.name : 'Attach passage image (optional)'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                if (f && f.size > MAX_IMAGE_BYTES) return onError('Image must be under 8 MB.');
                setPassageFile(f);
              }}
            />
          </label>
        </div>
      )}

      {drafts.map((d, i) => (
        <div key={d.key} className="p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700">Question {existingCount + i + 1}</span>
            {drafts.length > 1 && (
              <button
                type="button"
                onClick={() => setDrafts((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-red-600 cursor-pointer"
                aria-label="Remove question"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <textarea
            rows={3}
            className={inputCls}
            placeholder="Paste question text..."
            value={d.question}
            onChange={(e) => update(i, { question: e.target.value })}
          />

          {mode === 'diagram' && (
            <div className="space-y-2">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-[#0056b3] cursor-pointer">
                <Upload className="w-4 h-4" /> {d.file ? 'Replace diagram' : 'Attach diagram'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickImage(i, e.target.files?.[0] || null)}
                />
              </label>
              {d.preview && (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.preview} alt="Diagram preview" className="max-h-48 rounded-xl border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => update(i, { file: null, preview: null })}
                    className="absolute -top-2 -right-2 bg-white rounded-full border p-0.5 cursor-pointer"
                    aria-label="Remove diagram"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {d.options.map((opt, oi) => (
              <label
                key={oi}
                className={`flex items-center gap-2 p-2 rounded-xl border ${
                  d.correct === oi ? 'border-green-500 bg-green-50' : 'border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name={`correct-${d.key}`}
                  checked={d.correct === oi}
                  onChange={() => update(i, { correct: oi })}
                  className="cursor-pointer"
                  aria-label={`Mark option ${String.fromCharCode(65 + oi)} correct`}
                />
                <span className="text-xs font-extrabold">{String.fromCharCode(65 + oi)}</span>
                <input
                  className="flex-1 text-xs bg-transparent outline-none"
                  placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                  value={opt}
                  onChange={(e) => update(i, { options: d.options.map((o, k) => (k === oi ? e.target.value : o)) })}
                />
              </label>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">Select the radio button next to the correct option.</p>
          <input
            className={inputCls}
            placeholder="Explanation (optional)"
            value={d.explanation}
            onChange={(e) => update(i, { explanation: e.target.value })}
          />
        </div>
      ))}

      <div className="flex flex-wrap gap-3">
        {(
          <button
            type="button"
            onClick={() => setDrafts((prev) => [...prev, newDraft()])}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add another question
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className="px-5 py-2.5 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" /> {busy ? 'Adding...' : 'Add to Test Questions'}
        </button>
      </div>
    </div>
  );
}
