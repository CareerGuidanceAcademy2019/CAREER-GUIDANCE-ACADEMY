'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Trash2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Eye,
  RefreshCw,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  Download,
  Filter,
  Check,
  X,
  Layers,
  Crop,
  HardDrive,
  BookOpen,
  PlusCircle,
  ListPlus,
  FileQuestion,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { ParsedMCQ, generateMCQTemplateCsv, validateParsedQuestions } from '@/lib/mcqParser';
import { MathText } from '@/components/ui/MathText';
import { MockQuestionImage } from '@/components/mock-tests/MockQuestionImage';
import { MockQuestionGroup, MockQuestionOption, getOptionText, getOptionImage } from '@/data/initialSeedData';
import { PdfDiagramCropTool } from '@/components/admin/PdfDiagramCropTool';

export default function AdminMockTestQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.testId as string;
  const { showToast } = useCga();

  const [activeTab, setActiveTab] = useState<'review' | 'paste' | 'pdf' | 'csv' | 'docx' | 'passages'>('review');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testDetails, setTestDetails] = useState<any>(null);

  // Review screen questions and groups
  const [questions, setQuestions] = useState<ParsedMCQ[]>([]);
  const [questionGroups, setQuestionGroups] = useState<MockQuestionGroup[]>([]);
  const [activeQIndex, setActiveQIndex] = useState(0);

  // Filter: 'all' | 'needs-diagram' | 'warnings'
  const [filterMode, setFilterMode] = useState<'all' | 'needs-diagram' | 'warnings'>('all');

  // Drag over target for UI feedback
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Delete All Questions Modal state
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [deleteFromDbAlso, setDeleteFromDbAlso] = useState(true);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Comprehension / Passage Builder Modal state
  const [passageModalOpen, setPassageModalOpen] = useState(false);
  const [editingPassage, setEditingPassage] = useState<{
    id?: string;
    position?: number;
    title?: string;
    passageText: string;
    imagePath?: string | null;
    imageAlt?: string | null;
    rangeFrom: number;
    rangeTo: number;
    selectedQuestionIds: string[];
    generateBlankCount: number;
  }>({
    passageText: '',
    rangeFrom: 1,
    rangeTo: 1,
    selectedQuestionIds: [],
    generateBlankCount: 0,
  });

  // Import mode state (Append vs Replace)
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [autoCreatePassage, setAutoCreatePassage] = useState(false);
  const [importPassageTitle, setImportPassageTitle] = useState('');
  const [importPassageText, setImportPassageText] = useState('');

  // Paste import state
  const [pastedText, setPastedText] = useState('');
  const [pastedAnswerKey, setPastedAnswerKey] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // File import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedZip, setSelectedZip] = useState<File | null>(null);

  // Image Upload / Alt text prompt modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageTarget, setImageTarget] = useState<{
    qIndex: number;
    targetType: 'question' | 'option' | 'explanation' | 'passage';
    optionIdx?: number;
    passageId?: string;
  } | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingAltText, setPendingAltText] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Storage usage
  const [storageUsage, setStorageUsage] = useState<any>(null);
  const [cleaningOrphans, setCleaningOrphans] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Load existing questions for this test
  const fetchQuestions = async () => {
    if (!testId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/mock-tests/questions?testId=${encodeURIComponent(testId)}`);
      if (res.ok) {
        const data = await res.json();
        setTestDetails(data.test || null);
        setQuestionGroups(data.questionGroups || []);

        const mapped: ParsedMCQ[] = (data.questions || []).map((q: any, idx: number) => ({
          id: q.id || `q-${idx}`,
          position: q.position || idx + 1,
          question: q.questionText || q.question || '',
          options: Array.isArray(q.options)
            ? q.options.map((o: any) =>
                typeof o === 'object' && o !== null
                  ? {
                      text: o.text || '',
                      imagePath: o.imagePath || o.image_path || null,
                      imageAlt: o.imageAlt || o.image_alt || null,
                    }
                  : String(o)
              )
            : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctOptionIndex: typeof q.correctOption === 'number' ? q.correctOption : 0,
          explanation: q.explanation || '',
          explanationImagePath: q.explanationImagePath || null,
          explanationImageAlt: q.explanationImageAlt || null,
          groupId: q.groupId || null,
          imagePath: q.imagePath || null,
          imageAlt: q.imageAlt || null,
          needsDiagram: Boolean(q.imagePath) || false,
          confidence: 'high',
          warnings: [],
        }));

        setQuestions(mapped);
      }
    } catch {
      showToast('Error', 'Failed to fetch test questions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageUsage = async () => {
    try {
      const form = new FormData();
      form.append('action', 'storage-usage');
      const res = await fetch('/api/mock-tests/upload-image', {
        method: 'POST',
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        setStorageUsage(data);
      }
    } catch {}
  };

  const handleCleanOrphans = async () => {
    setCleaningOrphans(true);
    try {
      const form = new FormData();
      form.append('action', 'clean-orphans');
      const res = await fetch('/api/mock-tests/upload-image', {
        method: 'POST',
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        showToast('Storage Cleaned', `Scanned ${data.totalFilesScanned} files. Removed ${data.deletedCount} unused orphan files.`, 'success');
        fetchStorageUsage();
      }
    } catch {
      showToast('Cleanup Error', 'Failed to clean orphan images.', 'error');
    } finally {
      setCleaningOrphans(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchStorageUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  // Global Clipboard Paste (Ctrl+V) listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeTab !== 'review' || !questions[activeQIndex]) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            setPendingImageFile(file);
            setImageTarget({ qIndex: activeQIndex, targetType: 'question' });
            setPendingAltText(`Diagram for question ${questions[activeQIndex].position}`);
            setImageModalOpen(true);
            showToast('Image Pasted', 'Image detected from clipboard. Please enter alt text.', 'info');
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTab, activeQIndex, questions, showToast]);

  // Filtered questions
  const filteredQuestions = questions.filter((q) => {
    if (filterMode === 'needs-diagram') return q.needsDiagram && !q.imagePath;
    if (filterMode === 'warnings') return q.warnings && q.warnings.length > 0;
    return true;
  });

  const currentQ = questions[activeQIndex] || questions[0];

  const needsDiagramTotal = questions.filter((q) => q.needsDiagram).length;
  const needsDiagramPending = questions.filter((q) => q.needsDiagram && !q.imagePath).length;

  // Jump to next question needing a diagram
  const jumpToNextNeedsDiagram = () => {
    const nextIdx = questions.findIndex((q, i) => i > activeQIndex && q.needsDiagram && !q.imagePath);
    if (nextIdx >= 0) {
      setActiveQIndex(nextIdx);
    } else {
      const anyIdx = questions.findIndex((q) => q.needsDiagram && !q.imagePath);
      if (anyIdx >= 0) setActiveQIndex(anyIdx);
    }
  };

  // Image Upload Handler
  const handleUploadImage = async () => {
    if (!pendingImageFile || !imageTarget) return;
    setUploadingImage(true);

    try {
      const form = new FormData();
      form.append('file', pendingImageFile);
      form.append('testId', testId);
      form.append('maxDimension', imageTarget.targetType);
      form.append('altText', pendingAltText || `Diagram for question ${questions[imageTarget.qIndex]?.position || ''}`);

      const res = await fetch('/api/mock-tests/upload-image', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed.');
      }

      const data = await res.json();

      if (imageTarget.targetType === 'question') {
        setQuestions((prev) => {
          const next = [...prev];
          next[imageTarget.qIndex] = {
            ...next[imageTarget.qIndex],
            imagePath: data.storagePath,
            imageAlt: pendingAltText || `Diagram for question ${next[imageTarget.qIndex].position}`,
          };
          return next;
        });
        showToast('Diagram Attached', `Optimized WebP created (${(data.processedSize / 1024).toFixed(1)} KB, saved ${data.compressionRatio}%).`, 'success');
        // Jump to next question needing diagram
        setTimeout(jumpToNextNeedsDiagram, 300);
      } else if (imageTarget.targetType === 'option' && typeof imageTarget.optionIdx === 'number') {
        setQuestions((prev) => {
          const next = [...prev];
          const curOpts = [...next[imageTarget.qIndex].options];
          const existingOpt = curOpts[imageTarget.optionIdx!];
          const optText = getOptionText(existingOpt);
          curOpts[imageTarget.optionIdx!] = {
            text: optText,
            imagePath: data.storagePath,
            imageAlt: pendingAltText || `Diagram for Option ${String.fromCharCode(65 + imageTarget.optionIdx!)}`,
          };
          next[imageTarget.qIndex] = { ...next[imageTarget.qIndex], options: curOpts };
          return next;
        });
        showToast('Option Diagram Attached', `Diagram attached to Option ${String.fromCharCode(65 + imageTarget.optionIdx!)}.`, 'success');
      } else if (imageTarget.targetType === 'explanation') {
        setQuestions((prev) => {
          const next = [...prev];
          next[imageTarget.qIndex] = {
            ...next[imageTarget.qIndex],
            explanationImagePath: data.storagePath,
            explanationImageAlt: pendingAltText || `Explanation diagram for question ${next[imageTarget.qIndex].position}`,
          };
          return next;
        });
        showToast('Explanation Diagram Attached', 'Diagram attached to explanation.', 'success');
      } else if (imageTarget.targetType === 'passage' && imageTarget.passageId) {
        setQuestionGroups((prev) =>
          prev.map((g) =>
            g.id === imageTarget.passageId
              ? { ...g, imagePath: data.storagePath, imageAlt: pendingAltText || 'Shared passage diagram' }
              : g
          )
        );
        showToast('Passage Diagram Attached', 'Shared passage diagram saved.', 'success');
      }

      setImageModalOpen(false);
      setPendingImageFile(null);
      setPendingAltText('');
      fetchStorageUsage();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to attach image';
      showToast('Image Error', msg, 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCropSave = async (blob: Blob, alt: string, targetType: 'question' | 'option' | 'passage') => {
    try {
      const form = new FormData();
      form.append('file', blob, `crop_${Date.now()}.png`);
      form.append('testId', testId);
      form.append('maxDimension', targetType);
      form.append('altText', alt);

      const res = await fetch('/api/mock-tests/upload-image', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Crop upload failed.');
      }

      const data = await res.json();

      if (targetType === 'question') {
        setQuestions((prev) => {
          const next = [...prev];
          next[activeQIndex] = {
            ...next[activeQIndex],
            imagePath: data.storagePath,
            imageAlt: alt,
          };
          return next;
        });
        showToast('Diagram Cropped', `Diagram attached to Question ${questions[activeQIndex]?.position || ''}.`, 'success');
        setTimeout(jumpToNextNeedsDiagram, 300);
      } else if (targetType === 'passage') {
        const newGrpId = `grp-${Date.now()}`;
        setQuestionGroups((prev) => [
          ...prev,
          {
            id: newGrpId,
            testId,
            position: prev.length + 1,
            passageText: alt,
            imagePath: data.storagePath,
            imageAlt: alt,
          },
        ]);
        showToast('Passage Created', 'Cropped diagram saved as new Shared Passage.', 'success');
      }

      fetchStorageUsage();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save cropped diagram';
      showToast('Crop Error', msg, 'error');
    }
  };

  // Delete All Questions Action
  const handleDeleteAllQuestions = async () => {
    setIsDeletingAll(true);
    try {
      if (deleteFromDbAlso) {
        const res = await fetch(`/api/admin/mock-tests/questions?testId=${encodeURIComponent(testId)}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to clear questions from database.');
        }
      }
      setQuestions([]);
      setQuestionGroups([]);
      setActiveQIndex(0);
      setDeleteAllModalOpen(false);
      showToast('All Questions Deleted', 'All loaded questions and passages have been cleared. You can now load fresh questions.', 'success');
      fetchStorageUsage();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete questions';
      showToast('Delete Error', msg, 'error');
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Add Blank Question Action
  const handleAddBlankQuestion = (linkedGroupId?: string) => {
    const newIdx = questions.length;
    const newQ: ParsedMCQ = {
      id: `q-${Date.now()}-${newIdx}`,
      position: newIdx + 1,
      question: '',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctOptionIndex: 0,
      explanation: '',
      groupId: linkedGroupId || null,
      needsDiagram: false,
      confidence: 'high',
      warnings: [],
    };
    setQuestions((prev) => [...prev, newQ]);
    setActiveQIndex(newIdx);
    showToast('Question Added', `Question ${newIdx + 1} added to test.`, 'success');
  };

  // Open Comprehension Passage Modal
  const handleOpenPassageModal = (groupToEdit?: MockQuestionGroup) => {
    if (groupToEdit) {
      const linked = questions.filter((q) => q.groupId === groupToEdit.id);
      const minPos = linked.length > 0 ? Math.min(...linked.map((q) => q.position)) : 1;
      const maxPos = linked.length > 0 ? Math.max(...linked.map((q) => q.position)) : Math.max(1, minPos);
      setEditingPassage({
        id: groupToEdit.id,
        position: groupToEdit.position,
        title: groupToEdit.imageAlt || '',
        passageText: groupToEdit.passageText || '',
        imagePath: groupToEdit.imagePath || null,
        imageAlt: groupToEdit.imageAlt || 'Passage diagram',
        rangeFrom: minPos,
        rangeTo: maxPos,
        selectedQuestionIds: linked.map((q) => q.id),
        generateBlankCount: 0,
      });
    } else {
      const defaultFrom = questions.length > 0 ? Math.max(1, questions.length - 4) : 1;
      const defaultTo = Math.max(1, questions.length);
      setEditingPassage({
        title: `Comprehension Section ${questionGroups.length + 1}`,
        passageText: 'Directions: Read the following passage carefully and answer the questions that follow:\n\n',
        imagePath: null,
        imageAlt: 'Comprehension Diagram',
        rangeFrom: defaultFrom,
        rangeTo: defaultTo,
        selectedQuestionIds: [],
        generateBlankCount: 0,
      });
    }
    setPassageModalOpen(true);
  };

  // Save Comprehension Passage Modal Action
  const handleSavePassageModal = () => {
    if (!editingPassage.passageText.trim()) {
      showToast('Validation Error', 'Passage text cannot be empty.', 'error');
      return;
    }

    const grpId = editingPassage.id || `grp-${Date.now()}`;
    const newGroup: MockQuestionGroup = {
      id: grpId,
      testId,
      position: editingPassage.position || questionGroups.length + 1,
      passageText: editingPassage.passageText.trim(),
      imagePath: editingPassage.imagePath || null,
      imageAlt: editingPassage.title?.trim() || editingPassage.imageAlt || 'Comprehension passage',
    };

    setQuestionGroups((prev) => {
      const exists = prev.some((g) => g.id === grpId);
      if (exists) {
        return prev.map((g) => (g.id === grpId ? newGroup : g));
      }
      return [...prev, newGroup];
    });

    let updatedQuestions = [...questions];

    if (editingPassage.generateBlankCount > 0) {
      const startPos = updatedQuestions.length;
      for (let i = 0; i < editingPassage.generateBlankCount; i++) {
        updatedQuestions.push({
          id: `q-gen-${Date.now()}-${i}`,
          position: startPos + i + 1,
          question: '',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctOptionIndex: 0,
          explanation: '',
          groupId: grpId,
          needsDiagram: false,
          confidence: 'high',
          warnings: [],
        });
      }
    }

    const from = Math.max(1, editingPassage.rangeFrom);
    const to = Math.max(from, editingPassage.rangeTo);

    updatedQuestions = updatedQuestions.map((q, idx) => {
      const pos = idx + 1;
      const inRange = pos >= from && pos <= to;
      const inSelectedList = editingPassage.selectedQuestionIds.includes(q.id);

      if (inRange || inSelectedList) {
        return { ...q, groupId: grpId };
      } else if (editingPassage.id && q.groupId === editingPassage.id) {
        return { ...q, groupId: null };
      }
      return q;
    });

    setQuestions(updatedQuestions);
    setPassageModalOpen(false);
    showToast(
      'Passage Saved',
      `Comprehension passage configured and linked to questions Q${from}–${Math.max(to, updatedQuestions.length)}.`,
      'success'
    );
  };

  // Helper to process incoming parsed questions with Append vs Replace and optional Passage grouping
  const applyImportedQuestions = (incoming: ParsedMCQ[], label: string) => {
    if (!incoming || incoming.length === 0) {
      showToast('Empty Import', 'No questions found in the provided input.', 'info');
      return;
    }

    let targetGroupId: string | null = null;
    if (autoCreatePassage && importPassageText.trim()) {
      const newGrpId = `grp-${Date.now()}`;
      const newGroup: MockQuestionGroup = {
        id: newGrpId,
        testId,
        position: questionGroups.length + 1,
        passageText: importPassageText.trim(),
        imagePath: null,
        imageAlt: importPassageTitle.trim() || 'Comprehension Passage',
      };
      setQuestionGroups((prev) => [...prev, newGroup]);
      targetGroupId = newGrpId;
    }

    const preparedIncoming = incoming.map((q) => ({
      ...q,
      groupId: targetGroupId || q.groupId || null,
    }));

    if (importMode === 'append' && questions.length > 0) {
      const startIndex = questions.length;
      const renumbered = preparedIncoming.map((q, idx) => ({
        ...q,
        position: startIndex + idx + 1,
      }));
      setQuestions((prev) => [...prev, ...renumbered]);
      setActiveQIndex(startIndex);
      showToast(
        'Questions Appended',
        `Appended ${incoming.length} questions (Q${startIndex + 1}–Q${startIndex + incoming.length})${targetGroupId ? ' linked to new comprehension passage' : ''}. Total: ${startIndex + incoming.length} questions.`,
        'success'
      );
    } else {
      setQuestions(preparedIncoming);
      setActiveQIndex(0);
      showToast(
        'Questions Loaded',
        `Loaded ${incoming.length} questions into test${targetGroupId ? ' linked to comprehension passage' : ''}.`,
        'success'
      );
    }

    setPastedText('');
    setPastedAnswerKey('');
    setImportPassageText('');
    setImportPassageTitle('');
    setAutoCreatePassage(false);
    setActiveTab('review');
  };

  // Parse Text Action
  const handleParseText = async () => {
    if (!pastedText.trim()) return;
    setIsParsing(true);
    try {
      const form = new FormData();
      form.append('text', pastedText);
      if (pastedAnswerKey.trim()) {
        form.append('answerKey', pastedAnswerKey);
      }
      form.append('testId', testId);

      const res = await fetch('/api/admin/parse-test', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Parsing failed.');
      }

      const data = await res.json();
      applyImportedQuestions(data.questions || [], 'Pasted text');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse text';
      showToast('Parsing Failed', msg, 'error');
    } finally {
      setIsParsing(false);
    }
  };

  // Parse File Action (PDF, CSV+ZIP, DOCX)
  const handleParseFile = async () => {
    if (!selectedFile) return;
    setIsParsing(true);
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      if (selectedZip) {
        form.append('zipFile', selectedZip);
      }
      form.append('testId', testId);

      const res = await fetch('/api/admin/parse-test', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'File parsing failed.');
      }

      const data = await res.json();
      applyImportedQuestions(data.questions || [], 'File');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse file';
      showToast('Import Error', msg, 'error');
    } finally {
      setIsParsing(false);
    }
  };

  // Approve and Save Questions
  const handleApproveAndSave = async () => {
    if (questions.length === 0) {
      showToast('Empty Test', 'No questions to save.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/mock-tests/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId,
          questionGroups,
          questions: questions.map((q, idx) => ({
            position: idx + 1,
            questionText: q.question,
            options: q.options,
            correctOption: q.correctOptionIndex,
            explanation: q.explanation,
            explanationImagePath: q.explanationImagePath || null,
            explanationImageAlt: q.explanationImageAlt || null,
            groupId: q.groupId || null,
            imagePath: q.imagePath || null,
            imageAlt: q.imageAlt || null,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed.');
      }

      showToast('Approved & Saved', `Saved ${questions.length} questions and diagrams to database.`, 'success');
      router.push(`/admin/tests`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save error';
      showToast('Error', msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const validation = validateParsedQuestions(questions, testDetails?.questionCount);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <button
            type="button"
            onClick={() => router.push('/admin/tests')}
            className="text-xs font-bold text-slate-500 hover:text-[#0056b3] inline-flex items-center gap-1.5 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Mock Tests
          </button>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>{testDetails?.title || 'Mock Test Questions & Diagrams'}</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#0056b3] border border-blue-200">
              {questions.length} Questions
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mandatory Review Screen: Attach diagrams, format formulas, link passages, and verify answers before publishing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/admin/mock-tests/${testId}/preview`)}
            className="px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-[#0056b3] hover:bg-blue-100 text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" /> Preview Test (CBT &amp; Checklist)
          </button>

          <button
            type="button"
            onClick={() => handleOpenPassageModal()}
            className="px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5"
            title="Create or configure a Reading Comprehension passage"
          >
            <BookOpen className="w-4 h-4" /> Add Comprehension / Passage
          </button>

          <button
            type="button"
            disabled={questions.length === 0}
            onClick={() => setDeleteAllModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-[#dc2626] hover:bg-red-100 text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
            title="Delete all loaded questions to re-upload or re-edit"
          >
            <Trash2 className="w-4 h-4" /> Delete All Questions
          </button>

          <button
            type="button"
            onClick={() => router.push(`/admin/tests`)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={saving || questions.length === 0}
            onClick={handleApproveAndSave}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Approve and Save Questions
          </button>
        </div>
      </div>

      {/* Storage usage warning bar if >= 80% */}
      {storageUsage && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <HardDrive className={`w-4 h-4 ${storageUsage.isWarning ? 'text-amber-600' : 'text-slate-500'}`} />
            <div>
              <span className="font-bold text-slate-800">Storage Usage: </span>
              <span className="font-semibold text-slate-600">
                {storageUsage.formattedUsed} / {storageUsage.formattedLimit} ({storageUsage.percentageUsed}%)
              </span>
              {storageUsage.isWarning && (
                <span className="ml-2 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Warning: Above 80% limit
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={cleaningOrphans}
            onClick={handleCleanOrphans}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {cleaningOrphans ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Clean Unused Files
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('review')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
            activeTab === 'review'
              ? 'bg-[#0056b3] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Review Screen ({questions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('paste')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
            activeTab === 'paste'
              ? 'bg-[#0056b3] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Paste Questions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pdf')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
            activeTab === 'pdf'
              ? 'bg-[#0056b3] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          PDF Import & Crop
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('csv')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
            activeTab === 'csv'
              ? 'bg-[#0056b3] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          CSV / XLSX + ZIP Import
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('docx')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
            activeTab === 'docx'
              ? 'bg-[#0056b3] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          DOCX Import
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('passages')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
            activeTab === 'passages'
              ? 'bg-[#0056b3] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Shared Passages ({questionGroups.length})
        </button>
      </div>

      {/* 1. REVIEW SCREEN */}
      {activeTab === 'review' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Question List Sidebar */}
          <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Question Navigator
              </span>

              {/* Filters */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2 py-0.5 rounded-lg cursor-pointer ${filterMode === 'all' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                >
                  All ({questions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('needs-diagram')}
                  className={`px-2 py-0.5 rounded-lg cursor-pointer ${filterMode === 'needs-diagram' ? 'bg-amber-100 text-amber-900' : 'text-slate-500'}`}
                >
                  Diagrams ({needsDiagramPending})
                </button>
              </div>
            </div>

            {/* Quick Actions in Sidebar */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleAddBlankQuestion()}
                className="py-1.5 px-2 rounded-xl bg-blue-50 text-[#0056b3] hover:bg-blue-100 text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                title="Add 1 blank MCQ to the test"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Add MCQ</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenPassageModal()}
                className="py-1.5 px-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                title="Create a Comprehension Passage section and link questions"
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Passage</span>
              </button>

              <button
                type="button"
                disabled={questions.length === 0}
                onClick={() => setDeleteAllModalOpen(true)}
                className="py-1.5 px-2 rounded-xl bg-red-50 text-[#dc2626] hover:bg-red-100 text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors disabled:opacity-40"
                title="Delete all loaded questions"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Delete All</span>
              </button>
            </div>

            {/* Checklist summary alert if warnings */}
            {validation.hasErrors && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Validation Errors:
                </span>
                {validation.warnings.map((w, idx) => (
                  <p key={idx} className="text-[11px]">• {w}</p>
                ))}
              </div>
            )}

            {/* Questions Grid */}
            {questions.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl text-xs text-slate-500 space-y-2">
                <FileQuestion className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="font-bold">No questions loaded yet</p>
                <p className="text-[11px] text-slate-400">Click &quot;Add MCQ&quot; above, or paste questions to start.</p>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2 max-h-[500px] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const isActive = idx === activeQIndex;
                  const needsDiag = q.needsDiagram && !q.imagePath;
                  const isPassageQ = Boolean(q.groupId);

                  let color = 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50';
                  if (isActive) {
                    color = 'bg-[#0056b3] text-white border-[#0056b3] font-black shadow-xs';
                  } else if (needsDiag) {
                    color = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
                  } else if (isPassageQ) {
                    color = 'bg-purple-50 text-purple-800 border-purple-200 font-bold';
                  } else if (q.imagePath) {
                    color = 'bg-blue-50 text-[#0056b3] border-blue-200 font-bold';
                  }

                  return (
                    <button
                      key={q.id || idx}
                      type="button"
                      onClick={() => setActiveQIndex(idx)}
                      className={`h-9 rounded-xl border text-xs flex items-center justify-center relative cursor-pointer transition-all ${color}`}
                      title={isPassageQ ? `Question ${idx + 1} (Linked to Comprehension Passage)` : `Question ${idx + 1}`}
                    >
                      <span>{idx + 1}</span>
                      {isPassageQ && !isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 absolute top-1 left-1" title="Passage question" />
                      )}
                      {q.imagePath && !isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0056b3] absolute top-1 right-1" title="Diagram attached" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Question Editor */}
          <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            {currentQ ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-[#0056b3]">
                      Editing Question {activeQIndex + 1} of {questions.length}
                    </span>
                    {currentQ.groupId && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold inline-flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-purple-600" /> Comprehension
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={activeQIndex === 0}
                      onClick={() => setActiveQIndex((i) => Math.max(0, i - 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={activeQIndex >= questions.length - 1}
                      onClick={() => setActiveQIndex((i) => Math.min(questions.length - 1, i + 1))}
                      className="px-3 py-1.5 rounded-lg bg-[#0056b3] text-white hover:bg-blue-700 text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const deletedQNum = activeQIndex + 1;
                        setQuestions((prev) => {
                          const next = prev.filter((_, i) => i !== activeQIndex);
                          return next.map((q, i) => ({ ...q, position: i + 1 }));
                        });
                        setActiveQIndex((prev) => Math.max(0, Math.min(prev, questions.length - 2)));
                        showToast('Question Removed', `Question ${deletedQNum} deleted.`, 'info');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-red-50 text-[#dc2626] hover:bg-red-100 text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                      title="Delete this question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Comprehension / Passage Association Card */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-700" />
                      <span className="text-xs font-extrabold text-slate-800">
                        Comprehension / Passage Assignment:
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenPassageModal()}
                      className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer border border-purple-200"
                    >
                      <Plus className="w-3 h-3" /> New Comprehension Passage
                    </button>
                  </div>

                  {(() => {
                    const linkedGroup = questionGroups.find((g) => g.id === currentQ.groupId);

                    if (linkedGroup) {
                      return (
                        <div className="p-3.5 bg-white rounded-xl border border-purple-200 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-purple-900 flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4 text-purple-700" />
                              <span>Passage #{linkedGroup.position}: {linkedGroup.imageAlt || 'Reading Comprehension'}</span>
                            </span>
                            <div className="flex items-center gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() => handleOpenPassageModal(linkedGroup)}
                                className="text-[11px] font-bold text-purple-700 hover:underline cursor-pointer"
                              >
                                Edit Passage / Range
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setQuestions((prev) => {
                                    const copy = [...prev];
                                    copy[activeQIndex] = { ...copy[activeQIndex], groupId: null };
                                    return copy;
                                  });
                                  showToast('Unlinked', `Question ${currentQ.position} unlinked from passage.`, 'info');
                                }}
                                className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                              >
                                Unlink from Passage
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 font-mono bg-purple-50/50 p-2 rounded-lg border border-purple-100">
                            {linkedGroup.passageText}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
                        <span>Standalone MCQ (Not linked to any comprehension passage).</span>
                        {questionGroups.length > 0 && (
                          <select
                            value=""
                            onChange={(e) => {
                              const grpId = e.target.value;
                              if (grpId) {
                                setQuestions((prev) => {
                                  const copy = [...prev];
                                  copy[activeQIndex] = { ...copy[activeQIndex], groupId: grpId };
                                  return copy;
                                });
                                showToast('Linked', `Question ${currentQ.position} linked to passage.`, 'success');
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50"
                          >
                            <option value="">Link to Existing Passage...</option>
                            {questionGroups.map((g, gIdx) => (
                              <option key={g.id} value={g.id}>
                                Passage #{gIdx + 1}: {g.imageAlt || (g.passageText || '').slice(0, 30)}...
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Question Statement */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                    Question Text (LaTeX formulas $...$ and Markdown tables supported)
                  </label>
                  <textarea
                    rows={4}
                    value={currentQ.question}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuestions((prev) => {
                        const copy = [...prev];
                        copy[activeQIndex] = { ...copy[activeQIndex], question: val };
                        return copy;
                      });
                    }}
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-[#0056b3] font-mono text-sm leading-relaxed"
                  />
                  {/* Live Render Preview */}
                  <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Rendered Statement:
                    </span>
                    <MathText text={currentQ.question} />
                  </div>
                </div>

                {/* Attached Diagram Section */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverTarget('question');
                  }}
                  onDragLeave={() => setDragOverTarget(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverTarget(null);
                    const f = e.dataTransfer?.files?.[0];
                    if (f && f.type.startsWith('image/')) {
                      setPendingImageFile(f);
                      setImageTarget({ qIndex: activeQIndex, targetType: 'question' });
                      setPendingAltText(`Diagram for question ${currentQ.position}`);
                      setImageModalOpen(true);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    dragOverTarget === 'question'
                      ? 'bg-blue-100/70 border-[#0056b3] ring-2 ring-[#0056b3]/30'
                      : 'bg-blue-50/50 border-blue-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#0056b3] flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" /> Attached Question Diagram
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setImageTarget({ qIndex: activeQIndex, targetType: 'question' });
                          setImageModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" /> Attach / Replace Diagram
                      </button>

                      {currentQ.imagePath && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuestions((prev) => {
                              const copy = [...prev];
                              copy[activeQIndex] = { ...copy[activeQIndex], imagePath: null, imageAlt: null };
                              return copy;
                            });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-[#dc2626] text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {currentQ.imagePath ? (
                    <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                      <MockQuestionImage
                        path={currentQ.imagePath}
                        alt={currentQ.imageAlt}
                        testId={testId}
                        type="question"
                        className="w-48 h-32"
                      />
                      <div className="text-xs text-slate-600 space-y-1">
                        <p><strong className="text-slate-800">Storage Path:</strong> {currentQ.imagePath}</p>
                        <p><strong className="text-slate-800">Alt Text:</strong> {currentQ.imageAlt || 'Diagram for question'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-2">
                      {currentQ.needsDiagram ? (
                        <div>
                          <p className="text-amber-700 font-bold">
                            Warning: This question references a diagram or table. Please attach an image.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setQuestions((prev) => {
                                const copy = [...prev];
                                copy[activeQIndex] = { ...copy[activeQIndex], needsDiagram: false };
                                return copy;
                              });
                              showToast('Notice', 'Diagram requirement dismissed for this question.', 'info');
                            }}
                            className="mt-2 px-3 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs cursor-pointer"
                          >
                            Dismiss / No Diagram Needed
                          </button>
                        </div>
                      ) : (
                        <span>No diagram attached. Drag &amp; drop an image here or press Ctrl+V to paste.</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Options 4 Editor */}
                <div className="space-y-3">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Option Choices (Select the circle to set the correct answer)
                  </label>
                  {currentQ.options.map((opt, optIdx) => {
                    const isCorrect = currentQ.correctOptionIndex === optIdx;
                    const optText = getOptionText(opt);
                    const optImg = getOptionImage(opt);
                    const isDropTarget = dragOverTarget === `option-${optIdx}`;

                    return (
                      <div
                        key={optIdx}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverTarget(`option-${optIdx}`);
                        }}
                        onDragLeave={() => setDragOverTarget(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverTarget(null);
                          const f = e.dataTransfer?.files?.[0];
                          if (f && f.type.startsWith('image/')) {
                            setPendingImageFile(f);
                            setImageTarget({ qIndex: activeQIndex, targetType: 'option', optionIdx: optIdx });
                            setPendingAltText(`Diagram for Option ${String.fromCharCode(65 + optIdx)}`);
                            setImageModalOpen(true);
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all space-y-2 ${
                          isDropTarget
                            ? 'bg-blue-50 border-[#0056b3] ring-2 ring-[#0056b3]/20'
                            : isCorrect
                            ? 'border-emerald-500 bg-emerald-50/50'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setQuestions((prev) => {
                                const copy = [...prev];
                                copy[activeQIndex] = { ...copy[activeQIndex], correctOptionIndex: optIdx };
                                return copy;
                              });
                            }}
                            className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 cursor-pointer ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </button>

                          <input
                            type="text"
                            value={optText}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuestions((prev) => {
                                const copy = [...prev];
                                const opts = [...copy[activeQIndex].options];
                                if (optImg) {
                                  opts[optIdx] = { text: val, imagePath: optImg.imagePath, imageAlt: optImg.imageAlt };
                                } else {
                                  opts[optIdx] = val;
                                }
                                copy[activeQIndex] = { ...copy[activeQIndex], options: opts };
                                return copy;
                              });
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              setImageTarget({ qIndex: activeQIndex, targetType: 'option', optionIdx: optIdx });
                              setImageModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                            {optImg ? 'Change Diagram' : 'Add Diagram'}
                          </button>

                          {isCorrect && (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg shrink-0">
                              Correct Answer
                            </span>
                          )}
                        </div>

                        {optImg?.imagePath && (
                          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200 ml-10">
                            <MockQuestionImage
                              path={optImg.imagePath}
                              alt={optImg.imageAlt || `Option ${String.fromCharCode(65 + optIdx)}`}
                              testId={testId}
                              type="option"
                              className="w-24 h-16"
                            />
                            <div className="text-xs text-slate-600 flex-1">
                              <span className="font-semibold block">{optImg.imageAlt || 'Option diagram'}</span>
                              <span className="text-[11px] text-slate-400 font-mono">{optImg.imagePath}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setQuestions((prev) => {
                                  const copy = [...prev];
                                  const opts = [...copy[activeQIndex].options];
                                  opts[optIdx] = optText;
                                  copy[activeQIndex] = { ...copy[activeQIndex], options: opts };
                                  return copy;
                                });
                              }}
                              className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverTarget('explanation');
                  }}
                  onDragLeave={() => setDragOverTarget(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverTarget(null);
                    const f = e.dataTransfer?.files?.[0];
                    if (f && f.type.startsWith('image/')) {
                      setPendingImageFile(f);
                      setImageTarget({ qIndex: activeQIndex, targetType: 'explanation' });
                      setPendingAltText(`Explanation diagram for question ${currentQ.position}`);
                      setImageModalOpen(true);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    dragOverTarget === 'explanation'
                      ? 'bg-blue-100/70 border-[#0056b3] ring-2 ring-[#0056b3]/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                      Detailed Solution &amp; Explanation
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setImageTarget({ qIndex: activeQIndex, targetType: 'explanation' });
                          setImageModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-[#0056b3] hover:bg-blue-100 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        {currentQ.explanationImagePath ? 'Change Explanation Diagram' : 'Attach Explanation Diagram'}
                      </button>

                      {currentQ.explanationImagePath && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuestions((prev) => {
                              const copy = [...prev];
                              copy[activeQIndex] = {
                                ...copy[activeQIndex],
                                explanationImagePath: null,
                                explanationImageAlt: null,
                              };
                              return copy;
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 text-[#dc2626] hover:bg-red-100 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={currentQ.explanation || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuestions((prev) => {
                        const copy = [...prev];
                        copy[activeQIndex] = { ...copy[activeQIndex], explanation: val };
                        return copy;
                      });
                    }}
                    placeholder="Enter step-by-step mathematical derivation, reasoning, or references..."
                    className="w-full p-3 rounded-2xl border border-slate-200 font-mono text-xs sm:text-sm leading-relaxed"
                  />

                  {currentQ.explanationImagePath && (
                    <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <MockQuestionImage
                        path={currentQ.explanationImagePath}
                        alt={currentQ.explanationImageAlt || 'Explanation diagram'}
                        testId={testId}
                        type="explanation"
                        className="w-48 h-32"
                      />
                      <div className="text-xs text-slate-600 space-y-1">
                        <p><strong className="text-slate-800">Storage Path:</strong> {currentQ.explanationImagePath}</p>
                        <p><strong className="text-slate-800">Alt Text:</strong> {currentQ.explanationImageAlt || 'Explanation diagram'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No questions available. Please use the Paste or Import tabs above.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. PASTE TAB */}
      {activeTab === 'paste' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Paste Multiple-Choice Questions</h2>
            <p className="text-xs text-slate-500">
              Paste questions, options, and answers. Handles English & Bengali numbering, single-line options, and separate answer key sheets.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                Question Text & Options
              </label>
              <textarea
                rows={16}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`1. What is the SI unit of power?
(A) Joule (B) Watt (C) Newton (D) Pascal
Ans: B
Explanation: Power is the rate of doing work.

2. নিচের কোনটি মৌলিক অধিকার?
(A) সম্পত্তির অধিকার (B) সাম্যের অধিকার (C) ধর্মীয় কর (D) কোনটিই নয়
Ans: B`}
                className="w-full p-4 rounded-2xl border border-slate-200 font-mono text-xs leading-relaxed"
              />
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Optional Separate Answer Key Sheet
                </label>
                <textarea
                  rows={8}
                  value={pastedAnswerKey}
                  onChange={(e) => setPastedAnswerKey(e.target.value)}
                  placeholder={`1-B, 2-D, 3-A, 4-C
or
1. B  2. D  3. A`}
                  className="w-full p-3 rounded-2xl border border-slate-200 font-mono text-xs leading-relaxed"
                />
              </div>

              {/* Import Mode & Comprehension Section Options */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1.5">
                    Import Mode
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setImportMode('append')}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        importMode === 'append'
                          ? 'bg-blue-50 border-[#0056b3] text-[#0056b3] font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <span className="block font-extrabold text-[11px]">Append (Keep Qs)</span>
                      <span className="text-[10px] text-slate-500">
                        Add after {questions.length} existing Qs
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('replace')}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        importMode === 'replace'
                          ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <span className="block font-extrabold text-[11px]">Replace All</span>
                      <span className="text-[10px] text-slate-500">Clear existing Qs first</span>
                    </button>
                  </div>
                </div>

                {/* Comprehension Passage Grouping */}
                <div className="pt-2 border-t border-slate-200/70 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-extrabold text-purple-950">
                    <input
                      type="checkbox"
                      checked={autoCreatePassage}
                      onChange={(e) => setAutoCreatePassage(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Group as Comprehension / Reading Passage</span>
                  </label>

                  {autoCreatePassage && (
                    <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                      <input
                        type="text"
                        value={importPassageTitle}
                        onChange={(e) => setImportPassageTitle(e.target.value)}
                        placeholder="Passage Reference (e.g. Directions: Q.11–Q.20 Comprehension)"
                        className="w-full p-2.5 rounded-xl border border-purple-200 text-xs font-semibold bg-white"
                      />
                      <textarea
                        rows={4}
                        value={importPassageText}
                        onChange={(e) => setImportPassageText(e.target.value)}
                        placeholder="Paste or write the reading comprehension passage or case study text here..."
                        className="w-full p-2.5 rounded-xl border border-purple-200 text-xs font-mono leading-relaxed bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={isParsing || !pastedText.trim()}
                onClick={handleParseText}
                className="w-full py-3.5 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-extrabold cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isParsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {importMode === 'append' && questions.length > 0 ? 'Append Questions to Review Screen' : 'Parse and Send to Review Screen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. CSV + ZIP TAB */}
      {activeTab === 'csv' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Import CSV Spreadsheet + Image ZIP</h2>
              <p className="text-xs text-slate-500">
                Upload a structured CSV spreadsheet together with a ZIP file containing question diagrams.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const csvData = generateMCQTemplateCsv();
                const blob = new Blob([csvData], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'cga_mock_test_template.csv';
                a.click();
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download CSV Template
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 text-center space-y-3">
              <FileSpreadsheet className="w-8 h-8 text-[#0056b3] mx-auto" />
              <p className="text-xs font-bold text-slate-700">Select CSV Spreadsheet File</p>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-600 block mx-auto"
              />
            </div>

            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 text-center space-y-3">
              <Layers className="w-8 h-8 text-amber-600 mx-auto" />
              <p className="text-xs font-bold text-slate-700">Optional: ZIP of Diagram Images</p>
              <input
                type="file"
                accept=".zip"
                onChange={(e) => setSelectedZip(e.target.files?.[0] || null)}
                className="text-xs text-slate-600 block mx-auto"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={isParsing || !selectedFile}
            onClick={handleParseFile}
            className="w-full py-3.5 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-extrabold cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isParsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Parse Spreadsheet & Import
          </button>
        </div>
      )}

      {/* 4. DOCX TAB */}
      {activeTab === 'docx' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Word Document (.docx) Import</h2>
            <p className="text-xs text-slate-500">
              Extracts questions and automatically pairs embedded diagram images with their corresponding questions using Mammoth.
            </p>
          </div>

          <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 text-center space-y-3">
            <FileText className="w-8 h-8 text-[#0056b3] mx-auto" />
            <p className="text-xs font-bold text-slate-700">Select Microsoft Word (.docx) File</p>
            <input
              type="file"
              accept=".docx"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-600 block mx-auto"
            />
          </div>

          <button
            type="button"
            disabled={isParsing || !selectedFile}
            onClick={handleParseFile}
            className="w-full py-3.5 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-extrabold cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isParsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Extract Questions and Images from DOCX
          </button>
        </div>
      )}

      {/* 5. PDF CROP TAB */}
      {activeTab === 'pdf' && (
        <PdfDiagramCropTool
          currentQuestionNumber={currentQ?.position || 1}
          onSaveCroppedDiagram={handleCropSave}
        />
      )}

      {/* 6. SHARED PASSAGES TAB */}
      {activeTab === 'passages' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Shared Passages &amp; Diagram Sets</h2>
              <p className="text-xs text-slate-500">
                Create a shared reading comprehension passage, data interpretation table, or map once and link multiple questions to it.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const newId = `grp-${Date.now()}`;
                setQuestionGroups((prev) => [
                  ...prev,
                  {
                    id: newId,
                    testId,
                    position: prev.length + 1,
                    passageText: 'Read the following passage and answer the questions below:',
                    imagePath: null,
                    imageAlt: 'Shared diagram',
                  },
                ]);
                showToast('Passage Added', 'New shared passage group created.', 'success');
              }}
              className="px-4 py-2 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Shared Passage
            </button>
          </div>

          {questionGroups.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-xs text-slate-500">
              No shared passages created yet. Click "Add Shared Passage" to group multiple questions under a common text or diagram.
            </div>
          ) : (
            <div className="space-y-6">
              {questionGroups.map((group, grpIdx) => {
                const linkedQuestions = questions.filter((q) => q.groupId === group.id);

                return (
                  <div key={group.id} className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#0056b3]" />
                        <span>Passage Group #{grpIdx + 1}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#0056b3]">
                          {linkedQuestions.length} Questions Linked
                        </span>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setImageTarget({ qIndex: 0, targetType: 'passage', passageId: group.id });
                            setImageModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#0056b3] hover:bg-blue-100 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" /> Attach / Replace Diagram
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setQuestionGroups((prev) => prev.filter((g) => g.id !== group.id));
                            // Unlink questions
                            setQuestions((prev) =>
                              prev.map((q) => (q.groupId === group.id ? { ...q, groupId: null } : q))
                            );
                          }}
                          className="p-1.5 rounded-lg bg-red-50 text-[#dc2626] hover:bg-red-100 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Passage Text (LaTeX &amp; Markdown Tables Supported)
                      </label>
                      <textarea
                        rows={3}
                        value={group.passageText || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuestionGroups((prev) =>
                            prev.map((g) => (g.id === group.id ? { ...g, passageText: val } : g))
                          );
                        }}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white font-mono text-xs leading-relaxed"
                      />
                    </div>

                    {group.imagePath && (
                      <div className="bg-white p-3 rounded-xl border border-slate-200 inline-block">
                        <MockQuestionImage
                          path={group.imagePath}
                          alt={group.imageAlt}
                          testId={testId}
                          type="group"
                          className="w-48 h-32"
                        />
                      </div>
                    )}

                    {/* Linked Questions Picker */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
                      <span className="font-bold text-slate-700 block">Select Questions to Link:</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {questions.map((q, qIdx) => {
                          const isLinked = q.groupId === group.id;
                          return (
                            <button
                              key={q.id || qIdx}
                              type="button"
                              onClick={() => {
                                setQuestions((prev) => {
                                  const copy = [...prev];
                                  copy[qIdx] = {
                                    ...copy[qIdx],
                                    groupId: isLinked ? null : group.id,
                                  };
                                  return copy;
                                });
                              }}
                              className={`px-2.5 py-1 rounded-lg border font-bold text-xs cursor-pointer transition-all ${
                                isLinked
                                  ? 'bg-[#0056b3] text-white border-[#0056b3]'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              Q{qIdx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Alt Text / Image Upload Prompt Modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#0056b3]" />
                <span>
                  {imageTarget?.targetType === 'option'
                    ? `Attach Diagram to Option ${String.fromCharCode(65 + (imageTarget.optionIdx || 0))}`
                    : imageTarget?.targetType === 'explanation'
                    ? 'Attach Solution / Explanation Diagram'
                    : imageTarget?.targetType === 'passage'
                    ? 'Attach Diagram to Shared Passage'
                    : `Attach Diagram to Question ${questions[imageTarget?.qIndex || activeQIndex]?.position || ''}`}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Image File (PNG, JPG, WebP up to 8MB)</label>
                {pendingImageFile && (
                  <div className="mb-2 p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-semibold flex items-center justify-between">
                    <span>{pendingImageFile.name} ({(pendingImageFile.size / 1024).toFixed(1)} KB)</span>
                    <span className="text-[10px] bg-blue-200 px-2 py-0.5 rounded-full font-bold">Ready</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setPendingImageFile(e.target.files?.[0] || null)}
                  className="w-full p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Required Alt Text (Brief diagram description for accessibility)
                </label>
                <input
                  type="text"
                  value={pendingAltText}
                  onChange={(e) => setPendingAltText(e.target.value)}
                  placeholder="e.g. Parallel circuit with two 20-ohm resistors"
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={uploadingImage || !pendingImageFile}
                onClick={handleUploadImage}
                className="px-5 py-2 rounded-xl bg-[#0056b3] text-white font-extrabold text-xs cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {uploadingImage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Process and Attach
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Questions Confirmation Modal */}
      {deleteAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-[#dc2626] shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Delete All Loaded Questions?</h3>
                <p className="text-xs text-slate-500">This action clears all loaded questions in this mock test.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                Are you sure you want to delete all <strong className="text-slate-900">{questions.length} loaded questions</strong> from this test?
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 inline" />
                  <span>What will happen:</span>
                </p>
                <p>• All {questions.length} questions will be removed from your review screen.</p>
                <p>• All linked comprehension passages will be unlinked and cleared.</p>
                <p>• You can start fresh and paste or upload new question sets or comprehensions.</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 pt-1">
                <input
                  type="checkbox"
                  checked={deleteFromDbAlso}
                  onChange={(e) => setDeleteFromDbAlso(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                />
                <span>Also wipe previously saved questions from the database for this test</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={() => setDeleteAllModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel / Keep Questions
              </button>
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={handleDeleteAllQuestions}
                className="px-5 py-2 rounded-xl bg-[#dc2626] hover:bg-red-700 text-white font-extrabold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isDeletingAll ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Yes, Delete All ({questions.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehension / Passage Builder Modal */}
      {passageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingPassage.id ? 'Edit Comprehension Passage' : 'Add Comprehension / Reading Passage'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Group multiple questions under a common reading comprehension passage, case study, or data table.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPassageModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Passage Title / Instructions */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Passage Title &amp; Candidate Instructions
                </label>
                <input
                  type="text"
                  value={editingPassage.title || ''}
                  onChange={(e) => setEditingPassage((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Directions (Q. 11 to 20): Read the following passage carefully and answer the questions:"
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              {/* Passage Text */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Passage Content (Supports English, Bengali, LaTeX formulas, and Markdown tables)
                </label>
                <textarea
                  rows={6}
                  value={editingPassage.passageText}
                  onChange={(e) => setEditingPassage((p) => ({ ...p, passageText: e.target.value }))}
                  placeholder="Paste or write the comprehension passage text, historical narrative, poem, or scientific study here..."
                  className="w-full p-3 rounded-xl border border-slate-200 font-mono text-xs leading-relaxed focus:ring-2 focus:ring-[#0056b3]"
                />
                {editingPassage.passageText && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 max-h-36 overflow-y-auto">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Preview Render:</span>
                    <MathText text={editingPassage.passageText} />
                  </div>
                )}
              </div>

              {/* Target Questions Association */}
              <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-3">
                <span className="font-extrabold text-xs text-purple-950 block">
                  Question Range &amp; Linking for this Passage
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Range Inputs */}
                  <div className="p-3 bg-white rounded-xl border border-purple-200 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Link Question Range (e.g. Q11 to Q20):
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">From Q</span>
                      <input
                        type="number"
                        min={1}
                        max={Math.max(1, questions.length)}
                        value={editingPassage.rangeFrom}
                        onChange={(e) => setEditingPassage((p) => ({ ...p, rangeFrom: Number(e.target.value) }))}
                        className="w-16 p-1.5 rounded-lg border border-slate-200 text-center font-bold"
                      />
                      <span className="text-xs font-bold text-slate-500">To Q</span>
                      <input
                        type="number"
                        min={1}
                        max={Math.max(1, questions.length + 50)}
                        value={editingPassage.rangeTo}
                        onChange={(e) => setEditingPassage((p) => ({ ...p, rangeTo: Number(e.target.value) }))}
                        className="w-16 p-1.5 rounded-lg border border-slate-200 text-center font-bold"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Total loaded questions: {questions.length}
                    </span>
                  </div>

                  {/* Or Generate Blank Questions */}
                  <div className="p-3 bg-white rounded-xl border border-purple-200 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Or Generate Blank MCQs for this Passage:
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={editingPassage.generateBlankCount}
                        onChange={(e) => setEditingPassage((p) => ({ ...p, generateBlankCount: Number(e.target.value) }))}
                        className="w-16 p-1.5 rounded-lg border border-slate-200 text-center font-bold"
                      />
                      <span className="text-xs font-semibold text-slate-600">new blank questions</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Appends blank MCQs immediately linked to this passage.
                    </span>
                  </div>
                </div>

                {/* Individual Question Badges */}
                {questions.length > 0 && (
                  <div className="pt-2 border-t border-purple-200/60 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Or Toggle Questions Individually:
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                      {questions.map((q, idx) => {
                        const pos = idx + 1;
                        const inRange = pos >= editingPassage.rangeFrom && pos <= editingPassage.rangeTo;
                        const isSelected = inRange || editingPassage.selectedQuestionIds.includes(q.id);

                        return (
                          <button
                            key={q.id || idx}
                            type="button"
                            onClick={() => {
                              setEditingPassage((p) => {
                                const list = p.selectedQuestionIds;
                                const nextList = isSelected
                                  ? list.filter((id) => id !== q.id)
                                  : [...list, q.id];
                                return { ...p, selectedQuestionIds: nextList };
                              });
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            Q{pos}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPassageModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePassageModal}
                className="px-6 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" /> Save Comprehension Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
