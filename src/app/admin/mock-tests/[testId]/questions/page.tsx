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
  HardDrive,
  BookOpen,
  PlusCircle,
  ListPlus,
  FileQuestion,
  Edit3,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Save,
  Info,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { ParsedMCQ, parseRawQuestionsText, generateMCQTemplateCsv, validateParsedQuestions } from '@/lib/mcqParser';
import { MathText } from '@/components/ui/MathText';
import { MockQuestionImage } from '@/components/mock-tests/MockQuestionImage';
import { MockQuestionGroup, MockQuestionOption, getOptionText, getOptionImage } from '@/data/initialSeedData';

export default function AdminMockTestQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.testId as string;
  const { showToast } = useCga();

  const [activeTab, setActiveTab] = useState<'review' | 'paste' | 'csv' | 'passages'>('review');
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

  // Local diagram attachment for the question currently being entered
  const [currentDiagramFile, setCurrentDiagramFile] = useState<File | null>(null);
  const [currentDiagramPreview, setCurrentDiagramPreview] = useState<string>('');
  const [currentDiagramAlt, setCurrentDiagramAlt] = useState<string>('');
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [showAdvancedPasteOptions, setShowAdvancedPasteOptions] = useState(false);
  const currentDiagramInputRef = useRef<HTMLInputElement>(null);

  // Dedicated Two-Section Passage Builder state
  const [passageTitle, setPassageTitle] = useState('');
  const [passageBody, setPassageBody] = useState('');
  const [passageQuestionsText, setPassageQuestionsText] = useState('');
  const [passageDiagramFile, setPassageDiagramFile] = useState<File | null>(null);
  const [passageDiagramPreview, setPassageDiagramPreview] = useState<string>('');
  const [passageDiagramAlt, setPassageDiagramAlt] = useState<string>('');
  const [isAddingPassage, setIsAddingPassage] = useState(false);
  const passageDiagramInputRef = useRef<HTMLInputElement>(null);

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
        if (mapped.length === 0) {
          setActiveTab('paste');
        }
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

  // Direct 1-click Question Diagram Upload
  const handleDirectQuestionImageUpload = async (qIndex: number, file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please select an image file (PNG, JPG, WebP).', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast('File Too Large', 'Diagram image must be under 8 MB.', 'error');
      return;
    }

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('testId', testId);
      form.append('maxDimension', 'question');
      form.append('altText', `Diagram for question ${questions[qIndex]?.position || qIndex + 1}`);

      const res = await fetch('/api/mock-tests/upload-image', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed.');
      }

      const data = await res.json();
      setQuestions((prev) => {
        const next = [...prev];
        next[qIndex] = {
          ...next[qIndex],
          imagePath: data.storagePath,
          imageAlt: `Diagram for question ${next[qIndex]?.position || qIndex + 1}`,
          needsDiagram: false,
        };
        return next;
      });

      showToast(
        'Diagram Attached',
        `Diagram attached to Question ${questions[qIndex]?.position || qIndex + 1}.`,
        'success'
      );
      fetchStorageUsage();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to attach diagram.';
      showToast('Upload Error', msg, 'error');
    }
  };

  const handleRemoveQuestionDiagram = (qIndex: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[qIndex] = {
        ...next[qIndex],
        imagePath: null,
        imageAlt: null,
      };
      return next;
    });
    showToast(
      'Diagram Removed',
      `Diagram removed from Question ${questions[qIndex]?.position || qIndex + 1}.`,
      'error'
    );
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

  // Select local diagram for the question being created
  const handleSelectCurrentDiagram = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please select an image file (PNG, JPG, WebP).', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast('File Too Large', 'Diagram image must be under 8 MB.', 'error');
      return;
    }
    setCurrentDiagramFile(file);
    const url = URL.createObjectURL(file);
    setCurrentDiagramPreview(url);
    if (!currentDiagramAlt) {
      setCurrentDiagramAlt(`Diagram for question`);
    }
    showToast('Diagram Ready', `${file.name} selected. Click "Add Question to Test" below to add.`, 'info');
  };

  const handleClearCurrentDiagram = () => {
    if (currentDiagramPreview) {
      try {
        URL.revokeObjectURL(currentDiagramPreview);
      } catch {}
    }
    setCurrentDiagramFile(null);
    setCurrentDiagramPreview('');
    setCurrentDiagramAlt('');
    if (currentDiagramInputRef.current) {
      currentDiagramInputRef.current.value = '';
    }
  };

  // Auto-persist questions and groups to the server database
  const persistQuestionsToServer = async (qs: ParsedMCQ[], grps: MockQuestionGroup[]) => {
    try {
      await fetch('/api/admin/mock-tests/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId,
          questionGroups: grps,
          questions: qs.map((q, idx) => ({
            id: q.id,
            position: idx + 1,
            questionText: q.question,
            options: q.options,
            correctOption: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0,
            explanation: q.explanation || '',
            explanationImagePath: q.explanationImagePath || null,
            explanationImageAlt: q.explanationImageAlt || null,
            groupId: q.groupId || null,
            imagePath: q.imagePath || null,
            imageAlt: q.imageAlt || null,
          })),
        }),
      });

      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('cga_custom_tests');
          if (stored) {
            const list = JSON.parse(stored);
            const idx = list.findIndex((t: any) => t.id === testId);
            if (idx >= 0) {
              list[idx].questions = qs.map((q, i) => ({
                id: q.id,
                position: i + 1,
                question: q.question,
                options: q.options,
                correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0,
                explanation: q.explanation || '',
                explanationImagePath: q.explanationImagePath || null,
                explanationImageAlt: q.explanationImageAlt || null,
                groupId: q.groupId || null,
                imagePath: q.imagePath || null,
                imageAlt: q.imageAlt || null,
              }));
              list[idx].questionGroups = grps;
              list[idx].questionCount = qs.length;
              localStorage.setItem('cga_custom_tests', JSON.stringify(list));
            }
          }
        } catch {}
      }
    } catch {}
  };

  const handleGoToPreview = async () => {
    if (questions.length > 0) {
      await persistQuestionsToServer(questions, questionGroups);
    }
    router.push(`/admin/mock-tests/${testId}/preview`);
  };

  // Human-Friendly Action: Parse pasted question text locally and attach selected diagram
  const handleAddQuestionWithDiagram = async () => {
    const trimmed = pastedText.trim();
    if (!trimmed) {
      showToast('Question Text Required', 'Please paste the question statement and options.', 'error');
      return;
    }

    setIsAddingQuestion(true);
    try {
      // 1. Direct local parse (0ms, zero server crash)
      const parsed = parseRawQuestionsText(trimmed, pastedAnswerKey.trim() || undefined);
      if (!parsed || parsed.length === 0) {
        showToast(
          'Format Not Recognized',
          'Please ensure the question includes numbered question statement, options (A), (B), (C), (D) and Ans: ...',
          'error'
        );
        setIsAddingQuestion(false);
        return;
      }

      // 2. Upload attached diagram if present
      let uploadedImagePath: string | null = null;
      let uploadedImageAlt: string | null = null;

      if (currentDiagramFile) {
        const form = new FormData();
        form.append('file', currentDiagramFile);
        form.append('testId', testId);
        form.append('maxDimension', 'question');
        form.append('altText', currentDiagramAlt.trim() || `Diagram for question ${questions.length + 1}`);

        const res = await fetch('/api/mock-tests/upload-image', {
          method: 'POST',
          body: form,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to upload question diagram image.');
        }

        const data = await res.json();
        uploadedImagePath = data.storagePath;
        uploadedImageAlt = currentDiagramAlt.trim() || `Diagram for question ${questions.length + 1}`;
        fetchStorageUsage();
      }

      // 3. Attach uploaded diagram to the first parsed question
      let preparedQuestions = parsed;
      if (uploadedImagePath && preparedQuestions.length > 0) {
        preparedQuestions = preparedQuestions.map((q, idx) => {
          if (idx === 0) {
            return {
              ...q,
              imagePath: uploadedImagePath,
              imageAlt: uploadedImageAlt,
              needsDiagram: false,
            };
          }
          return q;
        });
      }

      // 4. Handle comprehension passage grouping if enabled
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

      if (targetGroupId) {
        preparedQuestions = preparedQuestions.map((q) => ({
          ...q,
          groupId: targetGroupId,
        }));
      }

      // 5. Append or replace questions
      let nextQuestions: ParsedMCQ[] = [];
      const currentGrps = targetGroupId ? [...questionGroups] : questionGroups;

      if (importMode === 'append' && questions.length > 0) {
        const startIndex = questions.length;
        const renumbered = preparedQuestions.map((q, idx) => ({
          ...q,
          position: startIndex + idx + 1,
        }));
        nextQuestions = [...questions, ...renumbered];
        setQuestions(nextQuestions);
        setActiveQIndex(startIndex);
        showToast(
          'Question Added Successfully',
          `Added ${preparedQuestions.length} question(s) (Q${startIndex + 1}–Q${startIndex + preparedQuestions.length})${uploadedImagePath ? ' with attached diagram' : ''}.`,
          'success'
        );
      } else {
        const renumbered = preparedQuestions.map((q, idx) => ({
          ...q,
          position: idx + 1,
        }));
        nextQuestions = renumbered;
        setQuestions(nextQuestions);
        setActiveQIndex(0);
        showToast(
          'Question Added Successfully',
          `Loaded ${preparedQuestions.length} question(s)${uploadedImagePath ? ' with attached diagram' : ''}.`,
          'success'
        );
      }

      // Auto-save immediately to server database
      void persistQuestionsToServer(nextQuestions, currentGrps);

      // 6. Reset inputs ready for next question
      setPastedText('');
      setPastedAnswerKey('');
      handleClearCurrentDiagram();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add question';
      showToast('Error Adding Question', msg, 'error');
    } finally {
      setIsAddingQuestion(false);
    }
  };

  // Fallback Parse Text Action
  const handleParseText = async () => {
    handleAddQuestionWithDiagram();
  };

  // Passage Builder Handlers
  const handleSelectPassageDiagram = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please select an image file (PNG, JPG, WebP).', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast('File Too Large', 'Passage diagram must be under 8 MB.', 'error');
      return;
    }
    setPassageDiagramFile(file);
    const url = URL.createObjectURL(file);
    setPassageDiagramPreview(url);
    if (!passageDiagramAlt) {
      setPassageDiagramAlt('Passage diagram / illustration');
    }
    showToast('Passage Diagram Ready', `${file.name} selected.`, 'info');
  };

  const handleClearPassageDiagram = () => {
    if (passageDiagramPreview) {
      try {
        URL.revokeObjectURL(passageDiagramPreview);
      } catch {}
    }
    setPassageDiagramFile(null);
    setPassageDiagramPreview('');
    setPassageDiagramAlt('');
    if (passageDiagramInputRef.current) {
      passageDiagramInputRef.current.value = '';
    }
  };

  const handleAddPassageAndQuestions = async () => {
    const pText = passageBody.trim();
    if (!pText) {
      showToast('Passage Text Required', 'Please enter the full paragraph text for Section 1.', 'error');
      return;
    }

    const qText = passageQuestionsText.trim();
    if (!qText) {
      showToast('Questions Required', 'Please paste the questions for Section 2.', 'error');
      return;
    }

    setIsAddingPassage(true);
    try {
      // 1. Parse questions locally (0ms)
      const parsed = parseRawQuestionsText(qText);
      if (!parsed || parsed.length === 0) {
        showToast(
          'Format Not Recognized',
          'Could not parse questions. Please ensure each question includes numbered statement, options (A), (B), (C), (D) and Ans: ...',
          'error'
        );
        setIsAddingPassage(false);
        return;
      }

      // 2. Upload passage diagram if selected
      let uploadedPassageImgPath: string | null = null;
      if (passageDiagramFile) {
        const form = new FormData();
        form.append('file', passageDiagramFile);
        form.append('testId', testId);
        form.append('maxDimension', 'passage');
        form.append('altText', passageDiagramAlt.trim() || 'Passage diagram');

        const res = await fetch('/api/mock-tests/upload-image', {
          method: 'POST',
          body: form,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to upload passage diagram.');
        }

        const data = await res.json();
        uploadedPassageImgPath = data.storagePath;
        fetchStorageUsage();
      }

      // 3. Create new Passage Group
      const newGrpId = `grp-${Date.now()}`;
      const newGroup: MockQuestionGroup = {
        id: newGrpId,
        testId,
        position: questionGroups.length + 1,
        passageText: pText,
        imagePath: uploadedPassageImgPath,
        imageAlt: passageTitle.trim() || 'Comprehension Passage',
      };
      const nextGroups = [...questionGroups, newGroup];
      setQuestionGroups(nextGroups);

      // 4. Link parsed questions to this passage group and append
      const startIndex = questions.length;
      const linkedQuestions = parsed.map((q, idx) => ({
        ...q,
        id: `q-psg-${Date.now()}-${idx}`,
        position: startIndex + idx + 1,
        groupId: newGrpId,
      }));

      const nextQuestions = [...questions, ...linkedQuestions];
      setQuestions(nextQuestions);
      setActiveQIndex(startIndex);

      // 5. Automatically save to server database so questions and passage are NEVER lost!
      void persistQuestionsToServer(nextQuestions, nextGroups);

      // 6. Positive notification
      showToast(
        'Passage & Questions Added',
        `Successfully added and saved 1 passage with ${linkedQuestions.length} linked questions (Q${startIndex + 1}–Q${startIndex + linkedQuestions.length}).`,
        'success'
      );

      // 6. Reset form
      setPassageTitle('');
      setPassageBody('');
      setPassageQuestionsText('');
      handleClearPassageDiagram();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add passage and questions';
      showToast('Passage Creation Error', msg, 'error');
    } finally {
      setIsAddingPassage(false);
    }
  };

  // Parse File Action (CSV/XLSX + ZIP)
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
            onClick={handleGoToPreview}
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
          Paste Questions &amp; Attach Diagrams
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
          onClick={() => setActiveTab('passages')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
            activeTab === 'passages'
              ? 'bg-[#0056b3] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Reading Comprehension / Passages ({questionGroups.length})
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
                      <label className="px-3.5 py-1.5 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                        <Upload className="w-3.5 h-3.5" /> Attach / Replace Diagram
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleDirectQuestionImageUpload(activeQIndex, f);
                          }}
                          className="hidden"
                        />
                      </label>

                      {currentQ.imagePath && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestionDiagram(activeQIndex)}
                          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#dc2626] border border-red-200 text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove Diagram
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
                        <p><strong className="text-slate-800">Alt Text:</strong> {currentQ.imageAlt || `Diagram for Question ${activeQIndex + 1}`}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-1">
                      <ImageIcon className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <p className="font-bold text-slate-700">No diagram attached to Question {activeQIndex + 1}</p>
                      <p className="text-[11px] text-slate-400">Click &quot;Attach / Replace Diagram&quot; above to select an image, or drag &amp; drop an image here.</p>
                    </div>
                  )}
                </div>

                {/* Options 4 Normal Text Choices Editor */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Option Choices (Normal Text — Click letter to set correct answer)
                    </label>
                    <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                      Correct Answer: Option {String.fromCharCode(65 + currentQ.correctOptionIndex)}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {currentQ.options.map((opt, optIdx) => {
                      const isCorrect = currentQ.correctOptionIndex === optIdx;
                      const optText = getOptionText(opt);

                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-2xl border transition-all flex items-center gap-3 ${
                            isCorrect
                              ? 'border-2 border-emerald-500 bg-emerald-50/70 shadow-2xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setQuestions((prev) => {
                                const copy = [...prev];
                                copy[activeQIndex] = { ...copy[activeQIndex], correctOptionIndex: optIdx };
                                return copy;
                              });
                            }}
                            className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                              isCorrect
                                ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                            title={`Set Option ${String.fromCharCode(65 + optIdx)} as correct answer`}
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
                                opts[optIdx] = val;
                                copy[activeQIndex] = { ...copy[activeQIndex], options: opts };
                                return copy;
                              });
                            }}
                            placeholder={`Enter text for Option ${String.fromCharCode(65 + optIdx)}`}
                            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />

                          {isCorrect && (
                            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl shrink-0 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Correct Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
            <h2 className="text-base font-extrabold text-slate-900">Paste Multiple-Choice Questions &amp; Attach Diagrams</h2>
            <p className="text-xs text-slate-500">
              Paste questions and options in standard format. Options are normal text. Diagrams attach directly to the question statement.
            </p>
          </div>

          {/* Sample Question Format Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border-2 border-emerald-500 text-emerald-950 space-y-3 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Sample Question Format (Follow this format when pasting questions)
              </span>
              <button
                type="button"
                onClick={() => {
                  setPastedText(`1. In the circuit diagram shown below, find the equivalent resistance between terminals A and B.
(A) 5 Ω
(B) 10 Ω
(C) 15 Ω
(D) 20 Ω
Ans: B
Explanation: The two 20 Ω parallel resistors yield 10 Ω equivalent resistance.

2. Which organelle is known as the powerhouse of the eukaryotic cell?
(A) Ribosome
(B) Golgi Body
(C) Mitochondria
(D) Endoplasmic Reticulum
Ans: C
Explanation: Mitochondria generate adenosine triphosphate (ATP) through cellular respiration.

3. নিচের কোনটি ভারতীয় সংবিধানের প্রস্তাবনার অংশ?
(A) সার্বভৌম (Sovereign)
(B) সমাজতান্ত্রিক (Socialist)
(C) ধর্মনিরপেক্ষ (Secular)
(D) উপরের সবকটি
Ans: D
Explanation: ৪২তম সংবিধান সংশোধনী দ্বারা সমাজতান্ত্রিক ও ধর্মনিরপেক্ষ শব্দ যুক্ত হয়।`);
                  showToast('Sample Loaded', 'Sample questions inserted into paste box.', 'success');
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Insert Sample Template into Box
              </button>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 font-mono text-[11px] leading-relaxed text-slate-800 space-y-2 overflow-x-auto">
              <p className="font-bold text-emerald-900">1. In the circuit diagram shown below, find the equivalent resistance between terminals A and B.</p>
              <p className="text-slate-600">(A) 5 Ω &nbsp;&nbsp; (B) 10 Ω &nbsp;&nbsp; (C) 15 Ω &nbsp;&nbsp; (D) 20 Ω</p>
              <p className="text-emerald-700 font-bold">Ans: B</p>
              <p className="text-slate-500">Explanation: The two 20 Ω parallel resistors yield 10 Ω.</p>
            </div>

            <p className="text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-700 shrink-0" />
              <span><strong>Note on Diagrams:</strong> Options are always normal text. Diagrams attach strictly to the question statement (e.g., Q1). Once parsed, you can attach any diagram image directly beside that specific question below.</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Question Text & Options Input */}
            <div className="lg:col-span-7 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  1. Paste Question Statement, Options &amp; Answer
                </label>
                <span className="text-[11px] text-slate-500 font-semibold">
                  Supports LaTeX math like \(\Omega\)
                </span>
              </div>
              <textarea
                rows={13}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`1. In the circuit diagram shown below, find the equivalent resistance between terminals A and B.
(A) 5 Ω
(B) 10 Ω
(C) 15 Ω
(D) 20 Ω
Ans: B
Explanation: The two 20 Ω parallel resistors yield 10 Ω equivalent resistance.`}
                className="w-full p-4 rounded-2xl border border-slate-300 font-mono text-xs leading-relaxed focus:border-[#0056b3] focus:ring-2 focus:ring-blue-100 bg-white shadow-2xs"
              />
            </div>

            {/* Right Column: Dedicated Diagram Attachment from Local Device */}
            <div className="lg:col-span-5 space-y-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  2. Attach Diagram for this Question (Optional)
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select an image from your device. It attaches directly to this question.
                </p>
              </div>

              {!currentDiagramPreview ? (
                /* No diagram selected state */
                <div className="p-6 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 hover:bg-blue-50 hover:border-[#0056b3] text-center transition-all flex flex-col items-center justify-center min-h-[220px]">
                  <div className="p-3 bg-white rounded-2xl border border-blue-200 shadow-2xs text-[#0056b3] mb-2.5">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <p className="text-xs font-black text-slate-800">
                    No Diagram Attached Yet
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 max-w-[240px]">
                    If this question has a diagram, table, or circuit, choose the image file from your device.
                  </p>

                  <label className="mt-4 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer shadow-sm transition-all hover:scale-[1.02]">
                    <Upload className="w-4 h-4" /> Choose Diagram from Device
                    <input
                      type="file"
                      ref={currentDiagramInputRef}
                      accept="image/*"
                      onChange={handleSelectCurrentDiagram}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-slate-400 mt-2 font-medium">
                    PNG, JPG, JPEG, WebP (Max 8 MB)
                  </span>
                </div>
              ) : (
                /* Diagram selected with live preview state */
                <div className="p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/40 space-y-3 shadow-2xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between gap-2 border-b border-emerald-200 pb-2">
                    <span className="text-[11px] font-black text-emerald-900 inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Diagram Ready from Device
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 truncate max-w-[150px]">
                      {currentDiagramFile?.name} ({(currentDiagramFile!.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-emerald-300 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentDiagramPreview}
                      alt="Local diagram preview"
                      className="max-h-40 w-auto object-contain rounded-lg shadow-2xs"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0056b3] text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 border border-blue-200 transition-all">
                      <Upload className="w-3.5 h-3.5" /> Change Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSelectCurrentDiagram}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleClearCurrentDiagram}
                      className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#dc2626] text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 border border-red-200 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Diagram
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={currentDiagramAlt}
                      onChange={(e) => setCurrentDiagramAlt(e.target.value)}
                      placeholder="Optional image description (e.g. Circuit diagram for Q1)"
                      className="w-full p-2.5 rounded-xl border border-emerald-200 text-xs bg-white text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}

              {/* Advanced Options Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvancedPasteOptions(!showAdvancedPasteOptions)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 cursor-pointer py-1"
                >
                  {showAdvancedPasteOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>Advanced Options (Answer Key Sheet, Passage, Import Mode)</span>
                </button>

                {showAdvancedPasteOptions && (
                  <div className="mt-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs animate-in fade-in duration-150">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                        Optional Separate Answer Key Sheet
                      </label>
                      <textarea
                        rows={3}
                        value={pastedAnswerKey}
                        onChange={(e) => setPastedAnswerKey(e.target.value)}
                        placeholder={`1-B, 2-D, 3-A, 4-C`}
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs bg-white"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                        Import Mode
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setImportMode('append')}
                          className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                            importMode === 'append'
                              ? 'bg-blue-50 border-[#0056b3] text-[#0056b3] font-bold'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="block font-bold text-[11px]">Append (Keep Existing)</span>
                          <span className="text-[10px] text-slate-500">Current: {questions.length} Qs</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setImportMode('replace')}
                          className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                            importMode === 'replace'
                              ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="block font-bold text-[11px]">Replace All</span>
                          <span className="text-[10px] text-slate-500">Clears previous Qs</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-950">
                        <input
                          type="checkbox"
                          checked={autoCreatePassage}
                          onChange={(e) => setAutoCreatePassage(e.target.checked)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span>Group as Reading / Comprehension Passage</span>
                      </label>

                      {autoCreatePassage && (
                        <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                          <input
                            type="text"
                            value={importPassageTitle}
                            onChange={(e) => setImportPassageTitle(e.target.value)}
                            placeholder="Passage Title (e.g. Comprehension Passage 1)"
                            className="w-full p-2 rounded-xl border border-purple-200 text-xs bg-white"
                          />
                          <textarea
                            rows={3}
                            value={importPassageText}
                            onChange={(e) => setImportPassageText(e.target.value)}
                            placeholder="Paste passage text here..."
                            className="w-full p-2 rounded-xl border border-purple-200 text-xs font-mono bg-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Large Action Button to Add / Upload Question */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isAddingQuestion || !pastedText.trim()}
              onClick={handleAddQuestionWithDiagram}
              className={`w-full py-4 rounded-2xl text-white text-sm font-black cursor-pointer inline-flex items-center justify-center gap-2.5 shadow-md disabled:opacity-50 transition-all ${
                currentDiagramFile
                  ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-500/20'
                  : 'bg-[#0056b3] hover:bg-blue-700'
              }`}
            >
              {isAddingQuestion ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing Question &amp; Attaching Diagram...</span>
                </>
              ) : currentDiagramFile ? (
                <>
                  <PlusCircle className="w-5 h-5" />
                  <span>+ Add Question with Attached Diagram to Test</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>+ Add Question to Test</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-500 mt-2">
              Parses the question text, uploads and links the diagram image (if attached), and adds the question to your test instantly.
            </p>
          </div>

          {/* Questions & Diagram Attachment Section */}
          {questions.length > 0 && (
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Questions in this Test ({questions.length} Questions)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Options are normal text choices. For questions that need an image, you can attach or change diagrams right beside the question.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={saving || questions.length === 0}
                    onClick={handleApproveAndSave}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 transition-all"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Approve &amp; Save All Questions
                  </button>
                  <button
                    type="button"
                    onClick={handleGoToPreview}
                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-4 h-4 text-slate-600" /> Preview Test
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('review')}
                    className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0056b3] border border-blue-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    Full Review Editor →
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {questions.map((q, qIdx) => {
                  const hasImage = Boolean(q.imagePath);

                  return (
                    <div
                      key={q.id || qIdx}
                      className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        hasImage
                          ? 'border-2 border-emerald-500 bg-emerald-50/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Left: Question statement & normal options */}
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                            hasImage ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            Q{q.position || qIdx + 1}
                          </span>
                          {hasImage && (
                            <span className="text-[11px] font-bold text-emerald-700 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Diagram Attached
                            </span>
                          )}
                          <span className="text-[11px] font-bold text-slate-400">
                            Ans: Option {String.fromCharCode(65 + (q.correctOptionIndex ?? 0))}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                          {q.question || 'No question statement'}
                        </p>

                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                          {q.options.map((opt, oIdx) => (
                            <span
                              key={oIdx}
                              className={`px-2 py-0.5 rounded-lg border ${
                                q.correctOptionIndex === oIdx
                                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              ({String.fromCharCode(65 + oIdx)}) {getOptionText(opt)}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right: Attached Diagram or Direct Upload Button */}
                      <div className="flex items-center gap-3 shrink-0">
                        {hasImage ? (
                          <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-emerald-200 shadow-2xs">
                            <MockQuestionImage
                              path={q.imagePath!}
                              alt={q.imageAlt || `Diagram for Q${qIdx + 1}`}
                              testId={testId}
                              type="question"
                              className="w-24 h-16 rounded-lg"
                            />
                            <div className="space-y-1">
                              <label className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0056b3] text-[11px] font-bold cursor-pointer block text-center">
                                Change
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleDirectQuestionImageUpload(qIdx, f);
                                  }}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestionDiagram(qIdx)}
                                className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-[#dc2626] text-[11px] font-bold cursor-pointer block w-full text-center"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#0056b3] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all">
                            <ImageIcon className="w-4 h-4 text-[#0056b3]" /> Attach Diagram to Q{q.position || qIdx + 1}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleDirectQuestionImageUpload(qIdx, f);
                              }}
                              className="hidden"
                            />
                          </label>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setActiveQIndex(qIdx);
                            setActiveTab('review');
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-[#0056b3] hover:bg-blue-50 cursor-pointer"
                          title="Edit this question in Review Screen"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Save Bar for Convenience */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <p className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    All {questions.length} questions ready to save
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Click Approve &amp; Save to store all questions and diagram references in the database.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleApproveAndSave}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 transition-all"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Approve &amp; Save All Questions
                  </button>
                  <button
                    type="button"
                    onClick={handleGoToPreview}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-4 h-4 text-emerald-700" /> Preview Test
                  </button>
                </div>
              </div>
            </div>
          )}
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

      {/* 6. TWO-SECTION READING COMPREHENSION / PASSAGE BUILDER */}
      {activeTab === 'passages' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-8">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <span>Reading Comprehension &amp; Passage Question Builder</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Two-Section Builder: Paste the full reading paragraph in Section 1, then paste all questions and options based on it in Section 2.
            </p>
          </div>

          {/* Sample Format Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border-2 border-emerald-500 text-emerald-950 space-y-3 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Sample Passage &amp; Question Format (Follow this format for Section 1 &amp; Section 2)
              </span>
              <button
                type="button"
                onClick={() => {
                  setPassageTitle('Directions (Q.1 to Q.3): Read the following passage carefully and answer the questions below:');
                  setPassageBody(`Environmental sustainability is one of the most pressing challenges of the modern era. Over the last century, exponential industrial growth and urban expansion have led to unprecedented levels of resource depletion and carbon emissions.

Scientists emphasize that conservation cannot remain a peripheral policy; it must be integrated into the core economic framework of every nation. By transitioning toward circular economies and renewable energy, societies can mitigate severe climate risks while generating sustainable economic growth.`);
                  setPassageQuestionsText(`1. According to the passage, what is described as one of the most pressing challenges of the modern era?
(A) Space exploration
(B) Environmental sustainability
(C) Agricultural taxation
(D) Classical literature
Ans: B
Explanation: The first sentence explicitly states that environmental sustainability is one of the most pressing challenges.

2. What led to unprecedented levels of resource depletion according to paragraph 1?
(A) Industrial growth and urban expansion
(B) Foreign trade agreements
(C) Scientific laboratories
(D) Decreased consumer demand
Ans: A
Explanation: Paragraph 1 highlights exponential industrial growth and urban expansion.

3. How can societies mitigate climate risks while generating growth?
(A) By abandoning technology
(B) By transitioning to circular economies and renewable energy
(C) By increasing fossil fuel subsidies
(D) By isolating local markets
Ans: B
Explanation: The concluding sentence emphasizes circular economies and renewable energy.`);
                  showToast('Sample Loaded', 'Sample passage and questions inserted into Section 1 and Section 2.', 'success');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Insert Sample Passage &amp; Questions Template
              </button>
            </div>

            <p className="text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-700 shrink-0" />
              <span><strong>How it works:</strong> In Section 1, paste the full reading paragraph. In Section 2, paste all questions and options for this passage. When you click &quot;Add Passage &amp; Questions&quot;, the questions are automatically linked to this passage so students will read the passage before answering.</span>
            </p>
          </div>

          {/* TWO SECTIONS GRID */}
          <div className="space-y-6">
            {/* SECTION 1: FULL PASSAGE SECTION */}
            <div className="p-6 rounded-3xl bg-purple-50/40 border-2 border-purple-200 space-y-4">
              <div className="flex items-center justify-between border-b border-purple-200 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white inline-flex items-center justify-center text-xs font-black">1</span>
                  Section 1: Full Paragraph of the Passage
                </span>
                <span className="text-[11px] text-purple-800 font-bold">
                  Reading Material / Story / Case Study
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Passage Reference Header / Instructions
                  </label>
                  <input
                    type="text"
                    value={passageTitle}
                    onChange={(e) => setPassageTitle(e.target.value)}
                    placeholder="e.g. Directions (Q.1 to Q.5): Read the following passage carefully and answer the questions that follow:"
                    className="w-full p-3 rounded-2xl border border-purple-200 bg-white text-xs font-bold text-slate-800 focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  <div className="lg:col-span-8 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Full Passage Paragraph Text
                    </label>
                    <textarea
                      rows={10}
                      value={passageBody}
                      onChange={(e) => setPassageBody(e.target.value)}
                      placeholder="Paste the complete reading comprehension passage, story, article, or legal case text here..."
                      className="w-full p-4 rounded-2xl border border-purple-200 bg-white font-serif sm:font-sans text-xs leading-relaxed focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                    />
                  </div>

                  {/* Optional Passage Diagram Box */}
                  <div className="lg:col-span-4 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Passage Diagram / Map / Chart (Optional)
                    </label>

                    {!passageDiagramPreview ? (
                      <div className="p-4 rounded-2xl border-2 border-dashed border-purple-200 bg-white hover:border-purple-400 text-center flex flex-col items-center justify-center min-h-[200px]">
                        <ImageIcon className="w-7 h-7 text-purple-400 mb-2" />
                        <p className="text-xs font-bold text-slate-700">No Passage Diagram</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Attach a shared image, chart, or map if needed.</p>
                        <label className="mt-3 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                          <Upload className="w-3.5 h-3.5" /> Select Image
                          <input
                            type="file"
                            ref={passageDiagramInputRef}
                            accept="image/*"
                            onChange={handleSelectPassageDiagram}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-white border border-purple-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-purple-900 truncate">
                            {passageDiagramFile?.name}
                          </span>
                          <button
                            type="button"
                            onClick={handleClearPassageDiagram}
                            className="text-red-600 hover:text-red-700 text-[11px] font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={passageDiagramPreview}
                          alt="Passage diagram preview"
                          className="max-h-32 w-auto mx-auto object-contain rounded-lg border border-purple-100"
                        />
                        <input
                          type="text"
                          value={passageDiagramAlt}
                          onChange={(e) => setPassageDiagramAlt(e.target.value)}
                          placeholder="Diagram label (optional)"
                          className="w-full p-2 rounded-xl border border-purple-200 text-xs bg-purple-50/50"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: QUESTIONS REGARDING THE PASSAGE */}
            <div className="p-6 rounded-3xl bg-blue-50/40 border-2 border-blue-200 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-200 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-blue-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#0056b3] text-white inline-flex items-center justify-center text-xs font-black">2</span>
                  Section 2: Questions Regarding this Passage
                </span>
                <span className="text-[11px] text-blue-800 font-bold">
                  Questions, Options (A, B, C, D) &amp; Answers
                </span>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Paste All Questions for this Passage
                </label>
                <textarea
                  rows={12}
                  value={passageQuestionsText}
                  onChange={(e) => setPassageQuestionsText(e.target.value)}
                  placeholder={`1. According to the author, what was the primary cause of the change?
(A) First option choice
(B) Second option choice
(C) Third option choice
(D) Fourth option choice
Ans: B
Explanation: The answer is explained in paragraph 2.

2. Which word in the passage means the same as "exponential"?
(A) Rapid
(B) Stagnant
(C) Declining
(D) Irrelevant
Ans: A`}
                  className="w-full p-4 rounded-2xl border border-blue-200 bg-white font-mono text-xs leading-relaxed focus:border-[#0056b3] focus:ring-2 focus:ring-blue-100 shadow-2xs"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON FOR PASSAGE & QUESTIONS */}
            <div>
              <button
                type="button"
                disabled={isAddingPassage || !passageBody.trim() || !passageQuestionsText.trim()}
                onClick={handleAddPassageAndQuestions}
                className="w-full py-4 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-sm font-black cursor-pointer inline-flex items-center justify-center gap-2.5 shadow-md disabled:opacity-50 transition-all hover:scale-[1.005]"
              >
                {isAddingPassage ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Processing Passage &amp; Linking Questions...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5" />
                    <span>+ Add Passage &amp; Linked Questions to Test</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-slate-500 mt-2">
                Creates the reading comprehension section, links all pasted questions to this passage, and adds them to the test immediately.
              </p>
            </div>
          </div>

          {/* LIST OF CONFIGURED PASSAGES IN THIS TEST */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>Passages in this Test ({questionGroups.length} Passages Configured)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Each passage is shown to students with its linked questions in the CBT exam.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={saving || questions.length === 0}
                  onClick={handleApproveAndSave}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 transition-all"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Approve &amp; Save All to Database
                </button>
                <button
                  type="button"
                  onClick={handleGoToPreview}
                  className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Eye className="w-4 h-4 text-slate-600" /> Preview Test (Student View)
                </button>
              </div>
            </div>

            {questionGroups.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-xs text-slate-500">
                No comprehension passages configured yet. Fill out Section 1 and Section 2 above to add a passage with its questions.
              </div>
            ) : (
              <div className="space-y-4">
                {questionGroups.map((group, grpIdx) => {
                  const linked = questions.filter((q) => q.groupId === group.id);

                  return (
                    <div
                      key={group.id}
                      className="p-5 rounded-2xl border-2 border-purple-200 bg-purple-50/30 space-y-3.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-purple-700 text-white text-xs font-black">
                            Passage #{grpIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-purple-950">
                            {group.imageAlt || 'Comprehension Passage'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#0056b3] text-[10px] font-extrabold">
                            {linked.length} Questions Linked
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setQuestionGroups((prev) => prev.filter((g) => g.id !== group.id));
                              setQuestions((prev) =>
                                prev.map((q) => (q.groupId === group.id ? { ...q, groupId: null } : q))
                              );
                              showToast('Passage Deleted', 'Passage removed and linked questions unlinked.', 'error');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Passage
                          </button>
                        </div>
                      </div>

                      {/* Passage Preview */}
                      <div className="bg-white p-3.5 rounded-xl border border-purple-100 text-xs text-slate-800 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-line font-serif sm:font-sans">
                        {group.passageText}
                      </div>

                      {group.imagePath && (
                        <div className="bg-white p-2 rounded-xl border border-purple-100 inline-block">
                          <MockQuestionImage
                            path={group.imagePath}
                            alt={group.imageAlt || 'Passage diagram'}
                            testId={testId}
                            type="group"
                            className="w-48 h-28 object-contain"
                          />
                        </div>
                      )}

                      {/* Linked Questions List */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                          Linked Questions ({linked.length}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {linked.map((lq) => (
                            <span
                              key={lq.id}
                              className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-900 text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                            >
                              Q{lq.position}
                              {lq.imagePath && <ImageIcon className="w-3 h-3 text-emerald-600" />}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
