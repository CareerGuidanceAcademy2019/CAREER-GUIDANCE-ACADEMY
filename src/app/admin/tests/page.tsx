'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  ClipboardCheck,
  Trophy,
  Trash2,
  X,
  Send,
  Upload,
  Sparkles,
  AlertCircle,
  Edit2,
  Calendar,
  Languages,
  Save,
  Flame,
  Phone,
  Check,
  BookOpen,
  ExternalLink,
  Copy,
  FileText,
  Lock,
  Image as ImageIcon,
  Eye,
  HardDrive,
  Download,
  Search,
  Filter,
  Layers,
  Target,
  GraduationCap,
  Users,
  ShieldCheck,
  CheckCircle2,
  Printer,
  PlusCircle,
  RefreshCw,
  Award,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCga } from '@/context/CgaContext';
import { MockTest, MCQQuestion, MockSubjectPost, getOptionText } from '@/data/initialSeedData';
import { MockSeries, MOCK_SERIES_INITIAL, getSubjectLanguageMode } from '@/data/mockSeriesSeedData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomCheckSvg, CustomCrossSvg } from '@/components/ui/CustomIcons';
import { MathText } from '@/components/ui/MathText';
import { parseRawQuestionsText, extractRichClipboardQuestionText } from '@/lib/mcqParser';
import { MockTestStorageMeter } from '@/components/admin/MockTestStorageMeter';

export interface MockSubjectItem {
  name: string;
  label: string;
  langMode: 'english_only' | 'bengali_only' | 'bilingual';
  seriesId: string;
  defaultCourseId?: string;
  defaultTitle: string;
}

export interface MockSubjectGroup {
  group: string;
  seriesId: string;
  defaultCourseId?: string;
  items: MockSubjectItem[];
}

export const ALL_MOCK_SUBJECT_GROUPS: MockSubjectGroup[] = [
  {
    group: 'Tripura TET: Paper-I 2026 (Classes I to V — ₹399 Dedicated Mock Series)',
    seriesId: 'series-ttet-paper1',
    defaultCourseId: 'crs-tet-1-online',
    items: [
      {
        name: 'Child Development & Pedagogy',
        label: 'Child Development & Pedagogy (CDP) [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-ttet-paper1',
        defaultCourseId: 'crs-tet-1-online',
        defaultTitle: 'Tripura TET Paper-I: Child Development & Pedagogy Mock #01',
      },
      {
        name: 'Language – I (English)',
        label: 'Language – I (English) [English Only]',
        langMode: 'english_only',
        seriesId: 'series-ttet-paper1',
        defaultCourseId: 'crs-tet-1-online',
        defaultTitle: 'Tripura TET Paper-I: Language – I (English) Mock #01',
      },
      {
        name: 'Language – II (Bengali)',
        label: 'Language – II (Bengali) [Bengali Only]',
        langMode: 'bengali_only',
        seriesId: 'series-ttet-paper1',
        defaultCourseId: 'crs-tet-1-online',
        defaultTitle: 'Tripura TET Paper-I: Language – II (Bengali) Mock #01',
      },
      {
        name: 'Mathematics (Content & Pedagogy)',
        label: 'Mathematics (Content & Pedagogy) [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-ttet-paper1',
        defaultCourseId: 'crs-tet-1-online',
        defaultTitle: 'Tripura TET Paper-I: Mathematics (Content & Pedagogy) Mock #01',
      },
      {
        name: 'Environmental Studies (EVS)',
        label: 'Environmental Studies (EVS) [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-ttet-paper1',
        defaultCourseId: 'crs-tet-1-online',
        defaultTitle: 'Tripura TET Paper-I: Environmental Studies (EVS) Mock #01',
      },
      {
        name: 'Tripura TET Paper-I Full Length Mock',
        label: 'Full-Length Simulated Paper [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-ttet-paper1',
        defaultCourseId: 'crs-tet-1-online',
        defaultTitle: 'Tripura TET: Paper-I 2026 Full-Length Simulated Mock #01',
      },
    ],
  },
  {
    group: 'Tripura TET: Paper-II Science & Math (Classes VI to VIII — ₹499 Dedicated Series)',
    seriesId: 'series-ttet-paper2-sci',
    defaultCourseId: 'crs-tet-2-sci-online',
    items: [
      {
        name: 'Child Development & Pedagogy',
        label: 'Child Development & Pedagogy (CDP) [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-ttet-paper2-sci',
        defaultCourseId: 'crs-tet-2-sci-online',
        defaultTitle: 'Tripura TET Paper-II (Science): Child Development & Pedagogy Mock #01',
      },
      {
        name: 'Language – I (English)',
        label: 'Language – I (English) [English Only]',
        langMode: 'english_only',
        seriesId: 'series-ttet-paper2-sci',
        defaultCourseId: 'crs-tet-2-sci-online',
        defaultTitle: 'Tripura TET Paper-II (Science): Language – I (English) Mock #01',
      },
      {
        name: 'Language – II (Bengali)',
        label: 'Language – II (Bengali) [Bengali Only]',
        langMode: 'bengali_only',
        seriesId: 'series-ttet-paper2-sci',
        defaultCourseId: 'crs-tet-2-sci-online',
        defaultTitle: 'Tripura TET Paper-II (Science): Language – II (Bengali) Mock #01',
      },
      {
        name: 'Mathematics & Science Pedagogy',
        label: 'Mathematics & Science Pedagogy [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-ttet-paper2-sci',
        defaultCourseId: 'crs-tet-2-sci-online',
        defaultTitle: 'Tripura TET Paper-II: Mathematics & Science Pedagogy Mock #01',
      },
      {
        name: 'Science (Physics, Chemistry & Biology)',
        label: 'Science (Physics, Chemistry & Biology) [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-ttet-paper2-sci',
        defaultCourseId: 'crs-tet-2-sci-online',
        defaultTitle: 'Tripura TET Paper-II: Science (Physics, Chemistry & Biology) Mock #01',
      },
      {
        name: 'Tripura TET Paper-II Science Full Length Mock',
        label: 'Full-Length Science Simulated Paper [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-ttet-paper2-sci',
        defaultCourseId: 'crs-tet-2-sci-online',
        defaultTitle: 'Tripura TET: Paper-II (Science) 2026 Full-Length Simulated Mock #01',
      },
    ],
  },
  {
    group: 'Tripura TET: Paper-II Social Studies (Classes VI to VIII — ₹499 Dedicated Series)',
    seriesId: 'series-ttet-paper2-soc',
    defaultCourseId: 'crs-tet-2-sst-online',
    items: [
      {
        name: 'Child Development & Pedagogy',
        label: 'Child Development & Pedagogy (CDP) [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-ttet-paper2-soc',
        defaultCourseId: 'crs-tet-2-sst-online',
        defaultTitle: 'Tripura TET Paper-II (Social Studies): Child Development & Pedagogy Mock #01',
      },
      {
        name: 'Language – I (English)',
        label: 'Language – I (English) [English Only]',
        langMode: 'english_only',
        seriesId: 'series-ttet-paper2-soc',
        defaultCourseId: 'crs-tet-2-sst-online',
        defaultTitle: 'Tripura TET Paper-II (Social Studies): Language – I (English) Mock #01',
      },
      {
        name: 'Language – II (Bengali)',
        label: 'Language – II (Bengali) [Bengali Only]',
        langMode: 'bengali_only',
        seriesId: 'series-ttet-paper2-soc',
        defaultCourseId: 'crs-tet-2-sst-online',
        defaultTitle: 'Tripura TET Paper-II (Social Studies): Language – II (Bengali) Mock #01',
      },
      {
        name: 'History & Pedagogical Issues',
        label: 'History & Pedagogical Issues [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-ttet-paper2-soc',
        defaultCourseId: 'crs-tet-2-sst-online',
        defaultTitle: 'Tripura TET Paper-II: History & Pedagogical Issues Mock #01',
      },
      {
        name: 'Geography & Environment',
        label: 'Geography & Environment [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-ttet-paper2-soc',
        defaultCourseId: 'crs-tet-2-sst-online',
        defaultTitle: 'Tripura TET Paper-II: Geography & Environment Mock #01',
      },
      {
        name: 'Political Science & Civics',
        label: 'Political Science & Civics [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-ttet-paper2-soc',
        defaultCourseId: 'crs-tet-2-sst-online',
        defaultTitle: 'Tripura TET Paper-II: Political Science & Civics Mock #01',
      },
      {
        name: 'Tripura TET Paper-II Social Studies Full Length Mock',
        label: 'Full-Length Social Studies Simulated Paper [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-ttet-paper2-soc',
        defaultCourseId: 'crs-tet-2-sst-online',
        defaultTitle: 'Tripura TET: Paper-II (Social Studies) 2026 Full-Length Simulated Mock #01',
      },
    ],
  },
  {
    group: 'TRBT STGT (Graduate Teachers Examination — ₹499 Series)',
    seriesId: 'series-stgt-soc',
    defaultCourseId: 'crs-stgt-sst-online',
    items: [
      {
        name: 'STGT Social Science (History, Geography, Polity, Economics)',
        label: 'STGT Social Science (History, Geography, Polity, Economics) [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-stgt-soc',
        defaultCourseId: 'crs-stgt-sst-online',
        defaultTitle: 'TRBT STGT: Social Science (History, Geography, Polity, Economics) Mock #01',
      },
      {
        name: 'STGT Pure Science (Physics, Chemistry, Mathematics)',
        label: 'STGT Pure Science (Physics, Chemistry, Mathematics) [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-stgt-pure-sci',
        defaultCourseId: 'crs-stgt-pure-sci-online',
        defaultTitle: 'TRBT STGT: Pure Science (Physics, Chemistry, Mathematics) Mock #01',
      },
      {
        name: 'STGT Biological Science (Botany, Zoology, Physiology)',
        label: 'STGT Biological Science (Botany, Zoology, Physiology) [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-stgt-bio-sci',
        defaultCourseId: 'crs-stgt-bio-sci-online',
        defaultTitle: 'TRBT STGT: Biological Science (Botany, Zoology, Physiology) Mock #01',
      },
    ],
  },
  {
    group: 'State Civil Services (TCS / TPS & TPSC Combined — ₹499/₹599 Series)',
    seriesId: 'series-tpsc-combined',
    defaultCourseId: 'crs-tpsc-combined-online',
    items: [
      {
        name: 'General Studies & North-East / Tripura GK',
        label: 'General Studies & North-East / Tripura GK [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-tpsc-combined',
        defaultCourseId: 'crs-tpsc-combined-online',
        defaultTitle: 'TPSC Combined & TCS/TPS: General Studies & Tripura GK Mock #01',
      },
      {
        name: 'General English & Comprehension',
        label: 'General English & Comprehension [English Only]',
        langMode: 'english_only',
        seriesId: 'series-tpsc-combined',
        defaultCourseId: 'crs-tpsc-combined-online',
        defaultTitle: 'TPSC Combined: General English & Comprehension Mock #01',
      },
      {
        name: 'Quantitative Aptitude & Mental Ability',
        label: 'Quantitative Aptitude & Mental Ability [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-tpsc-combined',
        defaultCourseId: 'crs-tpsc-combined-online',
        defaultTitle: 'TPSC Combined & JRBT: Aptitude & Mental Ability Mock #01',
      },
      {
        name: 'TCS/TPS Officers Prelims Simulation',
        label: 'TCS / TPS Officers Prelims Simulation [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-tcs-tps',
        defaultCourseId: 'crs-tcs-tps-online',
        defaultTitle: 'TCS / TPS Civil & Police Service Prelims Simulation Mock #01',
      },
    ],
  },
  {
    group: 'Central Competitive (Banking IBPS/SBI, SSC & Railway — ₹399 Series)',
    seriesId: 'series-banking-ssc',
    defaultCourseId: 'crs-banking-online',
    items: [
      {
        name: 'Quantitative Aptitude & Numerical Ability',
        label: 'Quantitative Aptitude & Numerical Ability [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-banking-ssc',
        defaultCourseId: 'crs-banking-online',
        defaultTitle: 'Banking & SSC: Quantitative Aptitude Speed Drill Mock #01',
      },
      {
        name: 'Reasoning Ability & Logical Deduction',
        label: 'Reasoning Ability & Logical Deduction [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-banking-ssc',
        defaultCourseId: 'crs-banking-online',
        defaultTitle: 'Banking & SSC: Reasoning Ability & Puzzles Mock #01',
      },
      {
        name: 'English Language & Comprehension',
        label: 'English Language & Comprehension [English Only]',
        langMode: 'english_only',
        seriesId: 'series-banking-ssc',
        defaultCourseId: 'crs-banking-online',
        defaultTitle: 'Banking & SSC: English Language & Verbal Ability Mock #01',
      },
      {
        name: 'General & Banking Awareness',
        label: 'General & Banking Awareness [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-banking-ssc',
        defaultCourseId: 'crs-banking-online',
        defaultTitle: 'Banking & SSC: General & Financial Awareness Mock #01',
      },
    ],
  },
  {
    group: 'School Board Foundation (Classes VII to X — TBSE & CBSE — ₹299 Series)',
    seriesId: 'series-school-foundation',
    defaultCourseId: 'crs-school-10',
    items: [
      {
        name: 'Class X Mathematics (Standard & Basic)',
        label: 'Class X Mathematics (Standard & Basic) [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-school-foundation',
        defaultCourseId: 'crs-school-10',
        defaultTitle: 'Class X Board Foundation: Mathematics Chapter Mock #01',
      },
      {
        name: 'Class X Science (Physics, Chemistry, Biology)',
        label: 'Class X Science (Physics, Chemistry, Biology) [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-school-foundation',
        defaultCourseId: 'crs-school-10',
        defaultTitle: 'Class X Board Foundation: Science Chapter Mock #01',
      },
      {
        name: 'Class IX Science & Mathematics',
        label: 'Class IX Science & Mathematics [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-school-foundation',
        defaultCourseId: 'crs-school-9',
        defaultTitle: 'Class IX Foundation: Science & Mathematics Mock #01',
      },
      {
        name: 'Classes VII - VIII Science & Math',
        label: 'Classes VII - VIII Foundation Science & Math [Bilingual]',
        langMode: 'bilingual',
        seriesId: 'series-school-foundation',
        defaultCourseId: 'crs-school-7',
        defaultTitle: 'Classes VII - VIII Foundation: Science & Math Mock #01',
      },
    ],
  },
];

export default function AdminMockTestsPage() {
  const {
    db,
    saveMockTest,
    deleteMockTest,
    updateMockSeries,
    saveMockSubjectPost,
    deleteMockSubjectPost,
    showToast,
    refresh,
  } = useCga();
  const router = useRouter();

  useEffect(() => {
    void refresh(true);
  }, [refresh]);

  const [activeAdminTab, setActiveAdminTab] = useState<'tests' | 'series' | 'subject_posts' | 'storage_meter'>('tests');
  const [editingTest, setEditingTest] = useState<MockTest | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [justCreatedTest, setJustCreatedTest] = useState<{ id: string; title: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MockTest | null>(null);
  const [selectedTestForRanks, setSelectedTestForRanks] = useState<string>(
    db.mockTests[0]?.id || ''
  );
  const [rankSearchQuery, setRankSearchQuery] = useState('');
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [printableRankModal, setPrintableRankModal] = useState(false);

  // Subject Question Posts state
  const [editingPost, setEditingPost] = useState<MockSubjectPost | null>(null);
  const [isNewPost, setIsNewPost] = useState(false);
  const [deletePostTarget, setDeletePostTarget] = useState<MockSubjectPost | null>(null);
  const [filterPostSubject, setFilterPostSubject] = useState<string>('all');

  // Series Packages editing state
  const [editingSeries, setEditingSeries] = useState<MockSeries | null>(null);

  // Question Builder Tab state inside the modal
  const [importMode, setImportMode] = useState<'paste' | 'manual' | 'diagram' | 'passage'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Diagram & Passage states inside modal
  const [singleQDiagramFile, setSingleQDiagramFile] = useState<File | null>(null);
  const [singleQDiagramPreview, setSingleQDiagramPreview] = useState<string>('');
  const [isUploadingDiagram, setIsUploadingDiagram] = useState(false);
  const [modalPassageTitle, setModalPassageTitle] = useState('');
  const [modalPassageBody, setModalPassageBody] = useState('');
  const [modalPassageQsText, setModalPassageQsText] = useState('');
  const singleQDiagramInputRef = useRef<HTMLInputElement>(null);

  // Manual Question builder state inside modal
  const [newQText, setNewQText] = useState('');
  const [newQTextBn, setNewQTextBn] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [optABn, setOptABn] = useState('');
  const [optBBn, setOptBBn] = useState('');
  const [optCBn, setOptCBn] = useState('');
  const [optDBn, setOptDBn] = useState('');
  const [correctIdx, setCorrectIdx] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [explanationBn, setExplanationBn] = useState('');

  // Target Access Scope for Create/Edit Modal:
  // 'mock_series_only' = Standalone mock series package only
  // 'course_only' = Specific classroom or online batch only
  // 'combined' = Both mock series and course students permitted
  const [modalTargetScope, setModalTargetScope] = useState<'mock_series_only' | 'course_only' | 'combined'>('mock_series_only');

  // Filters for Tab 1 Mock Tests
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [testScopeFilter, setTestScopeFilter] = useState<'all' | 'mock_series' | 'course' | 'combined'>('all');
  const [testSeriesFilter, setTestSeriesFilter] = useState<string>('all');
  const [testStatusFilter, setTestStatusFilter] = useState<'all' | 'Published' | 'Draft'>('all');

  const openCreateModal = () => {
    setIsNew(true);
    setPastedText('');
    setParseError('');
    setModalPassageTitle('');
    setModalPassageBody('');
    setModalPassageQsText('');
    setSingleQDiagramFile(null);
    setSingleQDiagramPreview('');
    setImportMode('paste');
    setModalTargetScope('mock_series_only');

    const defaultSeries = (db.mockSeries && db.mockSeries.length > 0 ? db.mockSeries : MOCK_SERIES_INITIAL)[0];
    const defaultSubj = ALL_MOCK_SUBJECT_GROUPS[0].items[0];

    setEditingTest({
      id: `mock-${Date.now()}`,
      title: defaultSubj.defaultTitle,
      seriesId: defaultSeries.id,
      subject: defaultSubj.name,
      languageMode: defaultSubj.langMode,
      courseId: '',
      courseName: 'Dedicated Mock Test Series Package',
      batchName: `${defaultSeries.name} (Dedicated Mock Series Students)`,
      durationMinutes: 30,
      totalMarks: 30,
      marksPerQuestion: 1,
      negativeMarking: 0,
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'Draft',
      questions: [],
      questionGroups: [],
    });
  };

  const openEditModal = async (test: MockTest) => {
    setIsNew(false);
    setPastedText('');
    setParseError('');
    setModalPassageTitle('');
    setModalPassageBody('');
    setModalPassageQsText('');
    setSingleQDiagramFile(null);
    setSingleQDiagramPreview('');
    setImportMode('paste');

    const isMock = Boolean(
      test.seriesId &&
      (!test.courseId ||
        test.courseName?.includes('Mock') ||
        test.batchName?.includes('Mock Series') ||
        test.batchName?.includes('Enrolled Students Only'))
    );
    const isCourse = Boolean(test.courseId && !test.seriesId && !test.courseName?.includes('Mock'));
    const scope = isMock ? 'mock_series_only' : isCourse ? 'course_only' : 'combined';
    setModalTargetScope(scope);
    setEditingTest({ ...test, questionGroups: test.questionGroups || [] });

    // Fetch authoritative questions and passage groups from server so Passage Studio questions are always visible
    try {
      const res = await fetch(`/api/admin/mock-tests/questions?testId=${encodeURIComponent(test.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEditingTest((prev) => {
            if (!prev || prev.id !== test.id) return prev;
            const grpMap = new Map<string, any>();
            for (const g of prev.questionGroups || []) {
              if (g && g.id) grpMap.set(g.id, g);
            }
            for (const g of data.questionGroups || []) {
              if (g && g.id) {
                grpMap.set(g.id, {
                  id: g.id,
                  testId: test.id,
                  position: g.position || grpMap.size + 1,
                  passageText: g.passageText || g.passage_text || '',
                  imagePath: g.imagePath || g.image_path || null,
                  imageAlt: g.imageAlt || g.image_alt || null,
                });
              }
            }

            const seenIds = new Set<string>();
            const seenStems = new Set<string>();
            const mergedQs: MCQQuestion[] = [];

            for (const sq of data.questions || []) {
              const stem = (sq.questionText || sq.question || '').trim();
              const qId = sq.id || `q-${mergedQs.length + 1}`;
              const grp = sq.groupId ? grpMap.get(sq.groupId) : null;
              seenIds.add(qId);
              if (stem) seenStems.add(stem.toLowerCase());
              mergedQs.push({
                id: qId,
                question: stem,
                questionBn: sq.questionTextBn || sq.questionBn || undefined,
                options: sq.options || [],
                optionsBn: sq.optionsBn || undefined,
                correctOptionIndex: sq.correctOption ?? sq.correctOptionIndex ?? 0,
                explanation: sq.explanation || '',
                explanationBn: sq.explanationBn || undefined,
                groupId: sq.groupId || null,
                passageText: grp?.passageText || sq.passageText || null,
                passageTitle: grp?.imageAlt || sq.passageTitle || null,
                passageImagePath: grp?.imagePath || sq.passageImagePath || null,
                imagePath: sq.imagePath || null,
                imageAlt: sq.imageAlt || null,
              });
            }

            for (const lq of prev.questions || []) {
              const stem = (lq.question || '').trim();
              if ((lq.id && seenIds.has(lq.id)) || (stem && seenStems.has(stem.toLowerCase()))) {
                continue;
              }
              if (lq.id) seenIds.add(lq.id);
              if (stem) seenStems.add(stem.toLowerCase());
              mergedQs.push(lq);
            }

            const marksPerQ = prev.marksPerQuestion || 1;
            return {
              ...prev,
              questions: mergedQs,
              questionGroups: Array.from(grpMap.values()),
              totalMarks: mergedQs.length > 0 ? mergedQs.length * marksPerQ : prev.totalMarks,
            };
          });
        }
      }
    } catch {
      // Non-fatal: local test state remains active
    }
  };

  // Client-side smart image compression before upload (preserves crisp diagram text while reducing payload size)
  const compressDiagramFileBeforeUpload = async (file: File): Promise<File> => {
    if (typeof window === 'undefined' || !file.type.startsWith('image/') || file.size <= 350 * 1024) {
      return file;
    }
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        try {
          const maxDim = 1400;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
              } else {
                resolve(file);
              }
            },
            'image/webp',
            0.9
          );
        } catch {
          resolve(file);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  };

  const openCreatePostModal = (defaultSubj?: string, defaultSeriesId?: string) => {
    setIsNewPost(true);
    const series = db.mockSeries.find((s) => s.id === defaultSeriesId) || db.mockSeries[0] || {
      id: 'series-ttet-paper1',
      name: 'Tripura TET: Paper-I 2026',
    };
    const subject = defaultSubj
      ? db.mockSubjects.find((s) => s.name.toLowerCase().includes(defaultSubj.toLowerCase()))
      : db.mockSubjects.find((s) => s.seriesId === series.id) || db.mockSubjects[0];

    setEditingPost({
      id: `post-${Date.now()}`,
      seriesId: series.id,
      seriesName: series.name,
      subjectId: subject?.id || 'subj-p1-cdp',
      subjectName: subject?.name || 'Child Development & Pedagogy',
      testId: null,
      testTitle: null,
      title: '',
      driveLink: '',
      instructions: 'Exclusive for Enrolled Candidates: Download the question paper PDF from the Google Drive link. Complete all questions within the scheduled time. Detailed answer key analysis will be discussed in class.',
      postedDate: new Date().toISOString().split('T')[0],
      author: 'Academic Director (C.G.A)',
      isEnrolledOnly: true,
    });
  };

  const handleSaveSubjectPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    if (!editingPost.title.trim()) {
      showToast('Title Required', 'Please enter a title for the mock test question post.', 'error');
      return;
    }
    if (!editingPost.driveLink.trim() || !editingPost.driveLink.startsWith('http')) {
      showToast('Valid Link Required', 'Please enter a valid Google Drive or HTTP web link.', 'error');
      return;
    }
    await saveMockSubjectPost(editingPost, isNewPost);
    setEditingPost(null);
  };

  // 1. Bulk PDF or Document File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingTest) return;

    setIsParsing(true);
    setParseError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/parse-test', {
        method: 'POST',
        headers: {
          'x-portal-role': 'ADMIN',
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract questions from file.');
      }

      const extracted: MCQQuestion[] = data.questions;
      const combined = [...editingTest.questions, ...extracted];
      const newTotal = combined.length * editingTest.marksPerQuestion;

      setEditingTest({
        ...editingTest,
        questions: combined,
        totalMarks: newTotal,
      });

      showToast(
        'Questions Extracted Successfully!',
        `Extracted ${extracted.length} questions from ${file.name}. Review them below.`,
        'success'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setParseError(message);
      showToast('Document Parsing Error', message, 'error');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Helper to automatically commit any pending Passage or Paste inputs so questions are never lost when switching tabs or saving
  const flushPendingInputsIntoTest = (baseTest: MockTest, silent = false): MockTest => {
    let updatedGroups = [...(baseTest.questionGroups || [])];
    let updatedQuestions = [...(baseTest.questions || [])];
    let addedPassageQsCount = 0;
    let addedPasteQsCount = 0;

    const pText = modalPassageBody.trim();
    const qText = modalPassageQsText.trim();
    if (pText && qText) {
      const parsed = parseRawQuestionsText(qText);
      if (parsed && parsed.length > 0) {
        const newGrpId = `grp-${Date.now()}`;
        const pTitle = modalPassageTitle.trim() || 'Reading Comprehension Passage';
        const newGroup = {
          id: newGrpId,
          testId: baseTest.id,
          position: updatedGroups.length + 1,
          passageText: pText,
          imagePath: null,
          imageAlt: pTitle,
        };
        const linkedQs: MCQQuestion[] = parsed.map((q, idx) => ({
          id: `q-psg-${Date.now()}-${idx}`,
          question: q.question,
          options: q.options as any,
          correctOptionIndex: q.correctOptionIndex,
          explanation: q.explanation || '',
          groupId: newGrpId,
          passageText: pText,
          passageTitle: pTitle,
          passageImagePath: null,
          imagePath: q.imagePath || null,
          imageAlt: q.imageAlt || null,
        }));
        updatedGroups = [...updatedGroups, newGroup];
        updatedQuestions = [...updatedQuestions, ...linkedQs];
        addedPassageQsCount = linkedQs.length;
        setModalPassageTitle('');
        setModalPassageBody('');
        setModalPassageQsText('');
      }
    }

    const rawPaste = pastedText.trim();
    if (rawPaste) {
      const extracted = parseRawQuestionsText(rawPaste);
      if (extracted && extracted.length > 0) {
        updatedQuestions = [...updatedQuestions, ...extracted];
        addedPasteQsCount = extracted.length;
        setPastedText('');
        setParseError('');
      }
    }

    if (!silent && (addedPassageQsCount > 0 || addedPasteQsCount > 0)) {
      const parts: string[] = [];
      if (addedPassageQsCount > 0) parts.push(`${addedPassageQsCount} passage question(s)`);
      if (addedPasteQsCount > 0) parts.push(`${addedPasteQsCount} standard question(s)`);
      showToast(
        'Questions Added to Bank',
        `Added ${parts.join(' and ')}. Total in bank: ${updatedQuestions.length} questions.`,
        'success'
      );
    }

    return {
      ...baseTest,
      questionGroups: updatedGroups,
      questions: updatedQuestions,
      totalMarks: updatedQuestions.length * (baseTest.marksPerQuestion || 1),
    };
  };

  const handleSwitchImportMode = (nextMode: 'paste' | 'manual' | 'diagram' | 'passage') => {
    if (editingTest) {
      const updated = flushPendingInputsIntoTest(editingTest);
      setEditingTest(updated);
    }
    setImportMode(nextMode);
  };

  // 2. Bulk Text Parse Handler (Instant client-side extraction)
  const handleParsePastedText = () => {
    if (!editingTest) return;
    setParseError('');

    if (!pastedText.trim() && !(modalPassageBody.trim() && modalPassageQsText.trim())) {
      setParseError('Please paste question text with options (A, B, C, D) before extracting.');
      return;
    }

    try {
      if (pastedText.trim()) {
        const check = parseRawQuestionsText(pastedText);
        if (check.length === 0) {
          setParseError(
            'Could not detect multiple-choice questions. Ensure questions start with 1. or Q1. and have options (A, B, C, D).'
          );
          return;
        }
      }
      const nextTest = flushPendingInputsIntoTest(editingTest);
      setEditingTest(nextTest);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Parsing error';
      setParseError(message);
    }
  };

  // Sample template insertion helper for admin convenience
  const handleInsertSampleTemplate = () => {
    const isEng = editingTest?.languageMode === 'english_only';
    const isBen = editingTest?.languageMode === 'bengali_only';

    let sample = '';
    if (isEng) {
      sample = `1. Choose the sentence with the correct passive voice:
(A) The syllabus will be completed by the faculty on time.
(B) The syllabus was completed by the faculty on time.
(C) The syllabus is completing by the faculty on time.
(D) The syllabus will completed by the faculty on time.
Ans: A
Explanation: Active future simple 'will complete' transforms to 'will be completed'.

2. Identify the synonym of 'PRAGMATIC':
(A) Practical
(B) Idealistic
(C) Theoretical
(D) Speculative
Ans: A
Explanation: Pragmatic means dealing with things sensibly and realistically.`;
    } else if (isBen) {
      sample = `1. নিচের কোন বানানটি শুদ্ধ?
(A) মুমূর্ষু
(B) মুমুর্ষু
(C) মুমুর্ষূ
(D) মুমূর্ষূ
Ans: A
Explanation: শুদ্ধ বানানটি হলো 'মুমূর্ষু' (হ্রস্ব উ-কার, দীর্ঘ ঊ-কার, হ্রস্ব উ-কার)।

2. 'উপকূল' শব্দটির সঠিক ব্যাসবাক্য ও সমাস কোনটি?
(A) কূলের সমীপে — অব্যয়ীভাব সমাস
(B) কূলের পশ্চাৎ — তৎপুরুষ সমাস
(C) কূলকে অতিক্রম — কর্মধারয় সমাস
(D) কূল ও উপকূল — দ্বন্দ্ব সমাস
Ans: A
Explanation: 'কূলের সমীপে' = উপকূল। এটি সামীপ্য অর্থে অব্যয়ীভাব সমাসের উদাহরণ।`;
    } else {
      sample = `1. According to Jean Piaget, during which stage does a child begin to think logically about concrete events?
(A) Sensorimotor Stage
(B) Preoperational Stage
(C) Concrete Operational Stage
(D) Formal Operational Stage
Ans: C
Explanation: Concrete operational stage (7-11 years) develops logical thought regarding concrete events.

2. Which wildlife sanctuary in Tripura is famous for the Clouded Leopard National Park?
(A) Rowa Wildlife Sanctuary
(B) Trishna Wildlife Sanctuary
(C) Sepahijala Wildlife Sanctuary
(D) Gumti Wildlife Sanctuary
Ans: C
Explanation: Sepahijala Sanctuary houses Clouded Leopard National Park and Phayre's Leaf Monkey.`;
    }
    setPastedText(sample);
  };

  // 3. Manual Single Question Add with Diagram Attachment
  const handleAddSingleQuestion = async () => {
    if (!editingTest || !newQText.trim() || !optA.trim() || !optB.trim()) return;
    const isEngOnly = editingTest.languageMode === 'english_only';

    let attachedImgPath: string | null = null;
    let attachedImgAlt: string | null = null;
    let compressionNote = '';

    if (singleQDiagramFile) {
      try {
        setIsUploadingDiagram(true);
        const compressedFile = await compressDiagramFileBeforeUpload(singleQDiagramFile);
        const form = new FormData();
        form.append('file', compressedFile);
        form.append('testId', editingTest.id);
        form.append('maxDimension', 'question');
        form.append('altText', `Diagram for question ${editingTest.questions.length + 1}`);
        const res = await fetch('/api/mock-tests/upload-image', {
          method: 'POST',
          body: form,
        });
        if (res.ok) {
          const data = await res.json();
          attachedImgPath = data.storagePath;
          attachedImgAlt = `Diagram for question ${editingTest.questions.length + 1}`;
          if (data.processedSize) {
            const kb = Math.max(1, Math.round(data.processedSize / 1024));
            compressionNote = ` (${kb} KB HD WebP)`;
          }
        }
      } catch {} finally {
        setIsUploadingDiagram(false);
      }
    }

    const q: MCQQuestion = {
      id: `q-${Date.now()}`,
      question: newQText.trim(),
      questionBn: isEngOnly ? undefined : (newQTextBn.trim() || undefined),
      options: [
        optA.trim(),
        optB.trim(),
        optC.trim() || 'Option C',
        optD.trim() || 'Option D',
      ],
      optionsBn: isEngOnly
        ? undefined
        : optABn.trim() || optBBn.trim()
          ? [
            optABn.trim() || optA.trim(),
            optBBn.trim() || optB.trim(),
            optCBn.trim() || optC.trim(),
            optDBn.trim() || optD.trim(),
          ]
          : undefined,
      correctOptionIndex: correctIdx,
      explanation: explanation.trim() || 'Refer to C.G.A classroom notes and model solutions.',
      explanationBn: isEngOnly ? undefined : (explanationBn.trim() || undefined),
      subject: editingTest.subject,
      imagePath: attachedImgPath,
      imageAlt: attachedImgAlt,
    };
    const nextQs = [...editingTest.questions, q];
    setEditingTest({
      ...editingTest,
      questions: nextQs,
      totalMarks: nextQs.length * editingTest.marksPerQuestion,
    });
    setNewQText('');
    setNewQTextBn('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setOptABn('');
    setOptBBn('');
    setOptCBn('');
    setOptDBn('');
    setExplanation('');
    setExplanationBn('');
    setSingleQDiagramFile(null);
    setSingleQDiagramPreview('');
    if (singleQDiagramInputRef.current) singleQDiagramInputRef.current.value = '';
    showToast('Question Added', `Question ${nextQs.length} added to test${attachedImgPath ? ` with compressed diagram${compressionNote}` : ''}.`, 'success');
  };

  // 4. Attach diagram to existing question inside modal (with smart compression)
  const handleModalQuestionDiagramUpload = async (qIndex: number, file: File) => {
    if (!editingTest || !file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please select an image file (PNG, JPG, WebP).', 'error');
      return;
    }

    try {
      const compressedFile = await compressDiagramFileBeforeUpload(file);
      const form = new FormData();
      form.append('file', compressedFile);
      form.append('testId', editingTest.id);
      form.append('maxDimension', 'question');
      form.append('altText', `Diagram for question ${qIndex + 1}`);

      const res = await fetch('/api/mock-tests/upload-image', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await res.json();
      const updatedQs = [...editingTest.questions];
      updatedQs[qIndex] = {
        ...updatedQs[qIndex],
        imagePath: data.storagePath,
        imageAlt: `Diagram for question ${qIndex + 1}`,
      };

      setEditingTest({
        ...editingTest,
        questions: updatedQs,
      });

      const kb = data.processedSize ? Math.max(1, Math.round(data.processedSize / 1024)) : null;
      showToast(
        'Diagram Attached & Compressed',
        `Diagram attached to Question ${qIndex + 1}${kb ? ` (Compressed to ${kb} KB HD WebP)` : ''}.`,
        'success'
      );
    } catch {
      showToast('Upload Error', 'Failed to upload question diagram.', 'error');
    }
  };

  const handleModalRemoveDiagram = async (qIndex: number) => {
    if (!editingTest) return;
    const oldPath = editingTest.questions[qIndex]?.imagePath;
    const updatedQs = [...editingTest.questions];
    updatedQs[qIndex] = {
      ...updatedQs[qIndex],
      imagePath: null,
      imageAlt: null,
    };
    setEditingTest({
      ...editingTest,
      questions: updatedQs,
    });
    if (oldPath) {
      try {
        const form = new FormData();
        form.append('action', 'delete-image');
        form.append('storagePath', oldPath);
        await fetch('/api/mock-tests/upload-image', { method: 'POST', body: form });
      } catch {}
    }
    showToast('Diagram Removed & Space Freed', `Diagram removed from Question ${qIndex + 1} and deleted from cloud storage.`, 'success');
  };

  const [isCleaningTestImages, setIsCleaningTestImages] = useState(false);

  const handleCleanAllTestImages = async (targetTest: MockTest) => {
    setIsCleaningTestImages(true);
    try {
      const form = new FormData();
      form.append('action', 'clean-test-images');
      form.append('testId', targetTest.id);
      const res = await fetch('/api/mock-tests/upload-image', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok && data.success) {
        const cleanedQs = (targetTest.questions || []).map((q) => ({
          ...q,
          imagePath: null,
          imageAlt: null,
          passageImagePath: null,
        }));
        const cleanedGroups = (targetTest.questionGroups || []).map((g) => ({
          ...g,
          imagePath: null,
        }));
        const updatedTest = {
          ...targetTest,
          questions: cleanedQs,
          questionGroups: cleanedGroups,
        };
        if (editingTest && editingTest.id === targetTest.id) {
          setEditingTest(updatedTest);
        }
        void saveMockTest({ ...updatedTest, syncQuestions: true } as any, false, 'Test Diagrams Cleaned Up');
        showToast('Storage Space Cleaned Up', data.message || 'All diagram images for this test have been removed to free storage space.', 'success');
      } else {
        showToast('Cleanup Failed', data.error || 'Could not clean test images.', 'error');
      }
    } catch {
      showToast('Cleanup Error', 'Network error while cleaning up test images.', 'error');
    } finally {
      setIsCleaningTestImages(false);
    }
  };

  // 5. Add Passage & Linked Questions in Modal
  const handleAddPassageInModal = () => {
    if (!editingTest) return;
    const pText = modalPassageBody.trim();
    const qText = modalPassageQsText.trim();

    if (!pText) {
      showToast('Passage Text Required', 'Please enter the reading comprehension passage paragraph in Section 1.', 'error');
      return;
    }
    if (!qText) {
      showToast('Questions Required', 'Please paste the questions and options for this passage in Section 2.', 'error');
      return;
    }

    const parsed = parseRawQuestionsText(qText);
    if (!parsed || parsed.length === 0) {
      showToast(
        'Format Not Recognized',
        'Could not parse questions. Ensure questions have numbers (1.), options ((A), (B), (C), (D)), and Ans: ...',
        'error'
      );
      return;
    }

    const newGrpId = `grp-${Date.now()}`;
    const pTitle = modalPassageTitle.trim() || 'Reading Comprehension Passage';
    const newGroup = {
      id: newGrpId,
      testId: editingTest.id,
      position: (editingTest.questionGroups?.length || 0) + 1,
      passageText: pText,
      imagePath: null,
      imageAlt: pTitle,
    };

    const linkedQs: MCQQuestion[] = parsed.map((q, idx) => ({
      id: `q-psg-${Date.now()}-${idx}`,
      question: q.question,
      options: q.options as any,
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation || '',
      groupId: newGrpId,
      passageText: pText,
      passageTitle: pTitle,
      passageImagePath: null,
      imagePath: q.imagePath || null,
      imageAlt: q.imageAlt || null,
    }));

    const updatedGroups = [...(editingTest.questionGroups || []), newGroup];
    const updatedQuestions = [...editingTest.questions, ...linkedQs];

    setEditingTest({
      ...editingTest,
      questionGroups: updatedGroups,
      questions: updatedQuestions,
      totalMarks: updatedQuestions.length * editingTest.marksPerQuestion,
    });

    setModalPassageTitle('');
    setModalPassageBody('');
    setModalPassageQsText('');
    showToast(
      'Passage & Questions Added to Bank',
      `Added 1 passage with ${linkedQs.length} linked questions. Total in Test Question Bank: ${updatedQuestions.length}.`,
      'success'
    );
  };

  const handleRemovePassageGroupInModal = (groupId: string) => {
    if (!editingTest) return;
    const filteredQs = editingTest.questions.filter((q) => q.groupId !== groupId);
    const filteredGroups = (editingTest.questionGroups || []).filter((g) => g.id !== groupId);
    setEditingTest({
      ...editingTest,
      questionGroups: filteredGroups,
      questions: filteredQs,
      totalMarks: filteredQs.length * editingTest.marksPerQuestion,
    });
    showToast('Passage & Questions Removed', 'Removed the passage and its linked questions from the Test Question Bank.', 'success');
  };

  const handleRemoveQuestion = async (qId: string) => {
    if (!editingTest) return;
    const targetQ = editingTest.questions.find((q) => q.id === qId);
    if (targetQ?.imagePath) {
      try {
        const form = new FormData();
        form.append('action', 'delete-image');
        form.append('storagePath', targetQ.imagePath);
        void fetch('/api/mock-tests/upload-image', { method: 'POST', body: form });
      } catch {}
    }
    const filtered = editingTest.questions.filter((q) => q.id !== qId);
    const remainingGroupIds = new Set(filtered.map((q) => q.groupId).filter(Boolean));
    const filteredGroups = (editingTest.questionGroups || []).filter((g) => remainingGroupIds.has(g.id));
    setEditingTest({
      ...editingTest,
      questionGroups: filteredGroups,
      questions: filtered,
      totalMarks: filtered.length * editingTest.marksPerQuestion,
    });
  };

  const handleUpdateQuestionCorrectOpt = (qId: string, optIndex: number) => {
    if (!editingTest) return;
    const updated = editingTest.questions.map((q) =>
      q.id === qId ? { ...q, correctOptionIndex: optIndex } : q
    );
    setEditingTest({ ...editingTest, questions: updated });
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest || !editingTest.title.trim()) {
      showToast('Validation Error', 'Please specify a mock test title.', 'error');
      return;
    }

    // Automatically commit any pending passage or pasted questions in the input boxes before saving
    const finalEditingTest = flushPendingInputsIntoTest(editingTest, true);

    if (finalEditingTest.status === 'Published' && finalEditingTest.questions.length === 0) {
      showToast('No Questions Added', 'Please upload questions before publishing live, or set status to Draft.', 'error');
      return;
    }

    const seriesObj = (db.mockSeries && db.mockSeries.length > 0 ? db.mockSeries : MOCK_SERIES_INITIAL).find(
      (s) => s.id === finalEditingTest.seriesId
    );

    let finalCourseId = finalEditingTest.courseId;
    let finalCourseName = finalEditingTest.courseName;
    let finalBatchName = finalEditingTest.batchName;

    if (modalTargetScope === 'mock_series_only') {
      finalCourseId = '';
      finalCourseName = seriesObj?.name || 'Dedicated Mock Test Series Package';
      finalBatchName = `${seriesObj?.name || 'Mock Series'} (Enrolled Students Only)`;
    } else if (modalTargetScope === 'course_only') {
      const crs = db.courses.find((c) => c.id === finalEditingTest.courseId);
      if (!crs) {
        showToast('Course Batch Required', 'Please select a specific course batch for this test.', 'error');
        return;
      }
      finalCourseId = crs.id;
      finalCourseName = crs.name;
      finalBatchName = crs.batchName;
    } else if (modalTargetScope === 'combined') {
      const crs = db.courses.find((c) => c.id === finalEditingTest.courseId);
      finalCourseId = crs?.id || '';
      finalCourseName = crs?.name || 'Course Batch';
      finalBatchName = `${seriesObj?.name || 'Mock Series'} + ${crs?.batchName || 'Course Batch'}`;
    }

    const computedMarks = finalEditingTest.questions.length * finalEditingTest.marksPerQuestion;
    const testToSave = {
      ...finalEditingTest,
      totalMarks: computedMarks,
      courseId: finalCourseId,
      courseName: finalCourseName,
      batchName: finalBatchName,
      syncQuestions: true,
    };

    if (isNew) {
      setJustCreatedTest({ id: testToSave.id, title: testToSave.title });
    }

    setEditingTest(null);
    await saveMockTest(testToSave as MockTest, isNew);
  };

  const togglePublish = async (test: MockTest) => {
    const nextStatus = test.status === 'Published' ? 'Draft' : 'Published';
    await saveMockTest(
      {
        ...test,
        status: nextStatus,
      },
      false,
      nextStatus === 'Published' ? 'Test Launched Live!' : 'Test Set to Draft'
    );
  };

  const handleQuickDateChange = async (test: MockTest, newDate: string) => {
    await saveMockTest(
      { ...test, scheduledDate: newDate },
      false,
      'Launch Date Scheduled'
    );
  };

  const handleSubjectChange = (val: string) => {
    if (!editingTest) return;

    let targetSeriesId = editingTest.seriesId || 'series-ttet-paper1';
    let targetSubjName = val;

    if (val.includes(':::')) {
      const parts = val.split(':::');
      targetSeriesId = parts[0];
      targetSubjName = parts[1];
    }

    let foundItem: MockSubjectItem | undefined;
    for (const grp of ALL_MOCK_SUBJECT_GROUPS) {
      const match = grp.items.find(
        (it) => it.name === targetSubjName && (!val.includes(':::') || it.seriesId === targetSeriesId)
      );
      if (match) {
        foundItem = match;
        targetSeriesId = match.seriesId;
        break;
      }
    }

    const mode = foundItem ? foundItem.langMode : getSubjectLanguageMode(targetSubjName);
    const seriesObj = (db.mockSeries && db.mockSeries.length > 0 ? db.mockSeries : MOCK_SERIES_INITIAL).find(
      (s) => s.id === targetSeriesId
    );

    let newCourseId = editingTest.courseId;
    let newCourseName = editingTest.courseName;
    let newBatchName = editingTest.batchName;

    if (modalTargetScope === 'mock_series_only') {
      newCourseId = '';
      newCourseName = seriesObj?.name || 'Dedicated Mock Test Series Package';
      newBatchName = `${seriesObj?.name || 'Mock Series'} (Enrolled Students Only)`;
    } else if (modalTargetScope === 'course_only') {
      const matchedCrs = db.courses.find((c) => c.id === foundItem?.defaultCourseId) || db.courses[0];
      newCourseId = matchedCrs?.id || '';
      newCourseName = matchedCrs?.name || '';
      newBatchName = matchedCrs?.batchName || '';
    } else if (modalTargetScope === 'combined') {
      const matchedCrs = db.courses.find((c) => c.id === foundItem?.defaultCourseId) || db.courses[0];
      newCourseId = matchedCrs?.id || '';
      newCourseName = matchedCrs?.name || '';
      newBatchName = `${seriesObj?.name || 'Mock Series'} & ${matchedCrs?.batchName || 'Course'}`;
    }

    setEditingTest({
      ...editingTest,
      seriesId: targetSeriesId,
      subject: targetSubjName,
      languageMode: mode,
      courseId: newCourseId,
      courseName: newCourseName,
      batchName: newBatchName,
      title: editingTest.title ? editingTest.title : foundItem?.defaultTitle || `${seriesObj?.name || 'Mock'}: ${targetSubjName} Mock #01`,
    });
  };

  const selectedTestObj = db.mockTests.find((t) => t.id === selectedTestForRanks) || db.mockTests[0];

  const rawRankAttempts = db.testAttempts
    .filter((a) => a.testId === (selectedTestObj?.id || selectedTestForRanks))
    .sort((a, b) => b.score - a.score);

  const filteredRankAttempts = rawRankAttempts.filter((att) => {
    if (!rankSearchQuery.trim()) return true;
    const q = rankSearchQuery.toLowerCase();
    return (
      (att.studentName || '').toLowerCase().includes(q) ||
      (att.studentId && att.studentId.toLowerCase().includes(q))
    );
  });

  const totalAppeared = rawRankAttempts.length;
  const highestScore = totalAppeared > 0 ? Math.max(...rawRankAttempts.map((a) => a.score)) : 0;
  const avgScore = totalAppeared > 0 ? (rawRankAttempts.reduce((sum, a) => sum + a.score, 0) / totalAppeared).toFixed(1) : '0';
  const avgAccuracy = totalAppeared > 0 ? Math.round(rawRankAttempts.reduce((sum, a) => sum + (a.accuracy || 0), 0) / totalAppeared) : 0;
  const totalMaxMarks = selectedTestObj?.totalMarks || rawRankAttempts[0]?.totalMarks || 30;

  const downloadRankListImage = () => {
    if (rawRankAttempts.length === 0) {
      showToast('No Results', 'There are no student results to export for this test.', 'error');
      return;
    }
    setIsExportingImage(true);

    try {
      const canvas = document.createElement('canvas');
      const width = 1200;
      const rowHeight = 44;
      const headerHeight = 220;
      const tableHeadHeight = 50;
      const padding = 40;
      const rowsToRender = rawRankAttempts.slice(0, 100);
      const height = headerHeight + tableHeadHeight + rowsToRender.length * rowHeight + padding * 2 + 60;

      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.scale(2, 2);

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Top Navy Header Banner
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, '#0a0e2a');
      grad.addColorStop(1, '#0056b3');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, 140);

      // Academy Title
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('CAREER GUIDANCE ACADEMY', padding, 40);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('Official Merit & Batch Rank List', padding, 72);

      ctx.fillStyle = '#93c5fd';
      ctx.font = '13px sans-serif';
      const testTitleText = selectedTestObj ? `${selectedTestObj.title} (${selectedTestObj.batchName || 'General Batch'})` : 'Mock Test Results';
      ctx.fillText(testTitleText, padding, 100);

      const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`Published: ${dateStr}`, width - padding, 40);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#bfdbfe';
      ctx.fillText(`Total Candidates: ${totalAppeared}`, width - padding, 64);
      ctx.fillText(`Max Marks: ${totalMaxMarks}`, width - padding, 88);
      ctx.textAlign = 'left';

      // Summary KPI bar
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(padding, 155, width - padding * 2, 50);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(padding, 155, width - padding * 2, 50);

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`Top Score: ${highestScore}/${totalMaxMarks}`, padding + 20, 185);
      ctx.fillText(`Average Score: ${avgScore}`, padding + 220, 185);
      ctx.fillText(`Average Accuracy: ${avgAccuracy}%`, padding + 420, 185);
      ctx.fillText(`Appeared Candidates: ${totalAppeared}`, padding + 640, 185);

      // Table Header Row
      const tableTop = 220;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(padding, tableTop, width - padding * 2, tableHeadHeight);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('RANK', padding + 20, tableTop + 30);
      ctx.fillText('STUDENT NAME', padding + 130, tableTop + 30);
      ctx.fillText('SCORE OBTAINED', padding + 480, tableTop + 30);
      ctx.fillText('CORRECT / WRONG', padding + 670, tableTop + 30);
      ctx.fillText('ACCURACY', padding + 860, tableTop + 30);
      ctx.fillText('SUBMITTED DATE', padding + 980, tableTop + 30);

      // Table Rows
      let currentY = tableTop + tableHeadHeight;
      rowsToRender.forEach((att, idx) => {
        ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        ctx.fillRect(padding, currentY, width - padding * 2, rowHeight);

        ctx.strokeStyle = '#f1f5f9';
        ctx.strokeRect(padding, currentY, width - padding * 2, rowHeight);

        // Rank Badge
        const rankNum = idx + 1;
        if (rankNum === 1) {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(padding + 16, currentY + 10, 68, 24);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(`Rank #1`, padding + 22, currentY + 26);
        } else if (rankNum === 2) {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(padding + 16, currentY + 10, 68, 24);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(`Rank #2`, padding + 22, currentY + 26);
        } else if (rankNum === 3) {
          ctx.fillStyle = '#b45309';
          ctx.fillRect(padding + 16, currentY + 10, 68, 24);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(`Rank #3`, padding + 22, currentY + 26);
        } else {
          ctx.fillStyle = '#475569';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(`Rank #${rankNum}`, padding + 20, currentY + 26);
        }

        // Student Name
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12px sans-serif';
        const name = att.studentName || 'Student';
        ctx.fillText(name.slice(0, 35), padding + 130, currentY + 26);

        // Score
        ctx.fillStyle = '#0056b3';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`${att.score} / ${att.totalMarks || totalMaxMarks}`, padding + 480, currentY + 26);

        // Correct / Wrong
        ctx.fillStyle = '#16a34a';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`${att.correctCount} Correct`, padding + 670, currentY + 26);
        ctx.fillStyle = '#dc2626';
        ctx.fillText(` / ${att.wrongCount} Wrong`, padding + 745, currentY + 26);

        // Accuracy
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`${att.accuracy}%`, padding + 860, currentY + 26);

        // Submitted
        ctx.fillStyle = '#64748b';
        ctx.font = '11px sans-serif';
        const dateFormatted = (att.submittedAt || '').slice(0, 16);
        ctx.fillText(dateFormatted, padding + 980, currentY + 26);

        currentY += rowHeight;
      });

      // Footer
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(padding, currentY + 15, width - padding * 2, 40);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText('Official Examination Results • Career Guidance Academy Tripura • Verification Portal', padding + 20, currentY + 39);

      // Download trigger
      const link = document.createElement('a');
      const cleanTitle = (selectedTestObj?.title || 'Mock_Test').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `Merit_Rank_List_${cleanTitle}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      showToast('Image Downloaded', 'Merit Rank List downloaded as high-resolution PNG image.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to export image';
      showToast('Export Error', msg, 'error');
    } finally {
      setIsExportingImage(false);
    }
  };

  const downloadRankListCSV = () => {
    if (rawRankAttempts.length === 0) {
      showToast('No Results', 'There are no student results to export.', 'error');
      return;
    }
    const headers = ['Rank', 'Student Name', 'Score', 'Total Marks', 'Correct', 'Wrong', 'Accuracy %', 'Submitted At'];
    const rows = rawRankAttempts.map((att, idx) => [
      idx + 1,
      `"${(att.studentName || '').replace(/"/g, '""')}"`,
      att.score,
      att.totalMarks || totalMaxMarks,
      att.correctCount,
      att.wrongCount,
      att.accuracy,
      `"${att.submittedAt}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const cleanTitle = (selectedTestObj?.title || 'Mock_Test').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `Merit_Rank_List_${cleanTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV Downloaded', 'Rank list exported to CSV successfully.', 'success');
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
            Mock Test Builder, Batch Launch & Series Pricing
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage scheduled launch dates and immediate launch status. Questions for English subjects are English-only,
            Bengali subjects are Bengali-only, and all other subjects have bilingual questions in English and Bengali.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          {activeAdminTab === 'subject_posts' ? (
            <button
              type="button"
              onClick={() => openCreatePostModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold cursor-pointer shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Post Question Drive Link
            </button>
          ) : (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold cursor-pointer shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Create & Upload Mock Test
            </button>
          )}
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveAdminTab('tests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeAdminTab === 'tests'
              ? 'bg-[#0056b3] text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
        >
          <ClipboardCheck className="w-4 h-4" /> Batch & Sectional Tests ({db.mockTests.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveAdminTab('series')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeAdminTab === 'series'
              ? 'bg-[#0056b3] text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
        >
          <Flame className="w-4 h-4 text-amber-300" /> T-TET Daily Series Packages ({db.mockSeries.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveAdminTab('subject_posts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeAdminTab === 'subject_posts'
              ? 'bg-[#0056b3] text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
        >
          <BookOpen className="w-4 h-4 text-amber-300" /> Subject Question Drive Links ({db.mockSubjectPosts?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveAdminTab('storage_meter')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeAdminTab === 'storage_meter'
              ? 'bg-[#0056b3] text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
        >
          <HardDrive className="w-4 h-4 text-purple-400" /> Storage Meter &amp; Lifecycle
        </button>
      </div>

      {/* ==================== TAB 1: BATCH MOCK TESTS ==================== */}
      {activeAdminTab === 'tests' && (() => {
        const filteredAdminTests = db.mockTests.filter((test) => {
          if (testSearchQuery.trim()) {
            const q = testSearchQuery.toLowerCase();
            const mTitle = (test.title || '').toLowerCase().includes(q);
            const mSubj = (test.subject || '').toLowerCase().includes(q);
            const mBatch = (test.batchName || '').toLowerCase().includes(q);
            if (!mTitle && !mSubj && !mBatch) return false;
          }

          const isMockOnly = Boolean(
            test.seriesId &&
            (!test.courseId ||
              test.courseName?.includes('Mock') ||
              test.batchName?.includes('Mock Series') ||
              test.batchName?.includes('Enrolled Students Only'))
          );
          const isCourseOnly = Boolean(test.courseId && !test.seriesId && !test.courseName?.includes('Mock'));
          const isCombined = Boolean(test.seriesId && test.courseId && !isMockOnly);

          if (testScopeFilter === 'mock_series' && !isMockOnly) return false;
          if (testScopeFilter === 'course' && !isCourseOnly) return false;
          if (testScopeFilter === 'combined' && !isCombined) return false;

          if (testSeriesFilter !== 'all' && test.seriesId !== testSeriesFilter) return false;
          if (testStatusFilter !== 'all') {
            const filterLower = testStatusFilter.toLowerCase();
            const statusLower = (test.status || '').toLowerCase();
            if (filterLower === 'draft') {
              if (statusLower !== 'draft') return false;
            } else if (filterLower === 'published') {
              if (statusLower !== 'published' && statusLower !== 'ready' && statusLower !== 'launched') return false;
            }
          }

          return true;
        });

        return (
          <div className="space-y-6">
            {/* Positive Navigation Prompt with Green Border */}
            {justCreatedTest && (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700 shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </span>
                  <div>
                    <p className="text-xs sm:text-sm font-black text-emerald-900">
                      Mock Test Created Successfully: &quot;{justCreatedTest.title}&quot;
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      The test has been registered. Follow the navigation buttons to attach question diagrams or preview the CBT layout.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/mock-tests/${justCreatedTest.id}/questions`)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer inline-flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <ImageIcon className="w-4 h-4" /> Go to Questions &amp; Attach Diagrams →
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/mock-tests/${justCreatedTest.id}/preview`)}
                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-2xs transition-all"
                  >
                    <Eye className="w-4 h-4 text-emerald-700" /> Preview Test
                  </button>
                  <button
                    type="button"
                    onClick={() => setJustCreatedTest(null)}
                    className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-200/60 cursor-pointer"
                    aria-label="Dismiss banner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Search, Scope & Series Filter Bar */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#0056b3]" />
                  <span className="font-extrabold text-xs text-[#0a0e2a] uppercase tracking-wider">
                    Filter Mock Tests by Scope, Series & Exam Status
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  Showing {filteredAdminTests.length} of {db.mockTests.length} mock tests
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={testSearchQuery}
                    onChange={(e) => setTestSearchQuery(e.target.value)}
                    placeholder="Search mock tests by title, subject..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                  />
                </div>

                {/* Scope Filter */}
                <div>
                  <select
                    value={testScopeFilter}
                    onChange={(e) => setTestScopeFilter(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                  >
                    <option value="all">All Access Scopes</option>
                    <option value="mock_series">Mock Test Series Only (Standalone)</option>
                    <option value="course">Course Batch Only</option>
                    <option value="combined">Combined Access (Series + Course)</option>
                  </select>
                </div>

                {/* Specific Series Filter */}
                <div>
                  <select
                    value={testSeriesFilter}
                    onChange={(e) => setTestSeriesFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                  >
                    <option value="all">All Series Packages (All Exams)</option>
                    {(db.mockSeries && db.mockSeries.length > 0 ? db.mockSeries : MOCK_SERIES_INITIAL).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (₹{s.price})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={testStatusFilter}
                    onChange={(e) => setTestStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                  >
                    <option value="all">All Launch Statuses</option>
                    <option value="Published">Launched / Live</option>
                    <option value="Draft">Draft / Scheduled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mock Tests Grid or Clean Empty State */}
            {filteredAdminTests.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-2xs space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0056b3] flex items-center justify-center mx-auto">
                  <ClipboardCheck className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-[#0a0e2a]">
                    {db.mockTests.length === 0 ? 'No Mock Tests Active' : 'No Matching Mock Tests'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {db.mockTests.length === 0
                      ? 'The mock test section is currently empty. You can create a new mock test using the button below and launch it whenever you are ready.'
                      : 'No mock tests match your current search and scope filters. Try clearing filters or search query.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold cursor-pointer shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" /> Create &amp; Upload Mock Test
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAdminTests.map((test) => {
                  const langMode =
                    test.languageMode ||
                    (test.subject ? getSubjectLanguageMode(test.subject) : getSubjectLanguageMode(test.title));

                  const isMockOnly = Boolean(
                    test.seriesId &&
                    (!test.courseId ||
                      test.courseName?.includes('Mock') ||
                      test.batchName?.includes('Mock Series') ||
                      test.batchName?.includes('Enrolled Students Only'))
                  );
                  const isCourseOnly = Boolean(test.courseId && !test.seriesId && !test.courseName?.includes('Mock'));

                  return (
                    <div
                      key={test.id}
                      className={`bg-white rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between transition-all hover:shadow-md ${justCreatedTest?.id === test.id
                          ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'border border-slate-200 hover:border-blue-300'
                        }`}
                    >
                      <div className="space-y-3">
                        {/* Top Header Row */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="px-2.5 py-1 rounded-full bg-blue-50 text-[#0056b3] text-[11px] font-extrabold truncate max-w-[170px]"
                            title={test.batchName}
                          >
                            {test.batchName}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap shrink-0 flex items-center gap-1.5 ${test.status === 'Published'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-[#ea580c] border border-amber-200'
                              }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${test.status === 'Published' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                                }`}
                            />
                            {test.status === 'Published' ? 'Launched' : 'Draft / Scheduled'}
                          </span>
                        </div>

                        {/* Title & Stats */}
                        <div>
                          <h2
                            className="text-sm sm:text-base font-extrabold text-[#0a0e2a] line-clamp-2 min-h-[2.75rem] leading-snug"
                            title={test.title}
                          >
                            {test.title}
                          </h2>
                          <p className="text-xs text-slate-500 mt-1">
                            {test.questions.length} Questions • {test.totalMarks} Marks • {test.durationMinutes} Mins • -
                            {test.negativeMarking} Negative
                          </p>
                        </div>

                        {/* Access Scope & Strict Enrolled-Only Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {isMockOnly ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0056b3] border border-blue-200 text-[10px] font-extrabold flex items-center gap-1">
                              <Target className="w-3 h-3" /> Mock Series Only
                            </span>
                          ) : isCourseOnly ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" /> Course Batch Only
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-extrabold flex items-center gap-1">
                              <Users className="w-3 h-3" /> Combined Access
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Enrolled Students Only
                          </span>
                        </div>

                        {/* Language Mode Badge */}
                        <div className="flex items-center gap-1.5 min-h-[1.5rem]">
                          {langMode === 'english_only' && (
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                              English Only
                            </span>
                          )}
                          {langMode === 'bengali_only' && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 font-sans">
                              Bengali Only (বাংলা)
                            </span>
                          )}
                          {langMode === 'bilingual' && (
                            <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                              Bilingual (English and Bengali)
                            </span>
                          )}
                        </div>

                        {/* Admin Launch Date Manager (Inline) */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-500 text-[11px]">
                            <span className="font-bold flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[#0056b3]" /> Launch Date
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">Admin Managed</span>
                          </div>
                          <input
                            type="date"
                            value={test.scheduledDate || ''}
                            onChange={(e) => handleQuickDateChange(test, e.target.value)}
                            className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-xs text-slate-800 cursor-pointer focus:ring-1 focus:ring-[#0056b3]"
                            title="Click to change the scheduled launch date"
                          />
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="pt-3.5 mt-3.5 border-t border-slate-100 space-y-2">
                        {/* Row 1: Core Content Editors (Grid of 3 buttons) */}
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => void openEditModal(test)}
                            className="h-8 px-2 rounded-xl bg-blue-50 text-[#0056b3] hover:bg-blue-100 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            title="Edit Mock Test Details, Passages & Questions"
                          >
                            <Edit2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/mock-tests/${test.id}/questions`)}
                            className="h-8 px-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            title="Diagrams, Passages & Questions Studio"
                          >
                            <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Studio</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/mock-tests/${test.id}/preview`)}
                            className="h-8 px-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            title="Preview Test & Checklist"
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Preview</span>
                          </button>
                        </div>

                        {/* Optional Post-Test Image Cleanup Button when diagrams exist */}
                        {(test.questions.some((q) => Boolean(q.imagePath || q.passageImagePath)) ||
                          (test.questionGroups || []).some((g) => Boolean(g.imagePath))) && (
                          <button
                            type="button"
                            disabled={isCleaningTestImages}
                            onClick={() => void handleCleanAllTestImages(test)}
                            className="w-full h-7 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                            title="Remove uploaded diagrams from this test to free storage space while keeping all questions and student results"
                          >
                            <Trash2 className="w-3 h-3 shrink-0 text-amber-700" />
                            <span className="truncate">
                              {isCleaningTestImages ? 'Cleaning Diagrams...' : 'Remove Test Images & Free Space'}
                            </span>
                          </button>
                        )}

                        {/* Row 2: Launch/Unpublish + Archive ZIP + Delete */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => togglePublish(test)}
                            className={`h-8 flex-1 px-3 rounded-xl text-[11px] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${test.status === 'Published'
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              }`}
                          >
                            <Send className="w-3.5 h-3.5 shrink-0" />
                            <span>{test.status === 'Published' ? 'Unpublish' : 'Launch Now'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              window.open(`/api/admin/mock-tests/archive?testId=${encodeURIComponent(test.id)}`, '_blank')
                            }
                            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                            title="Download self-contained offline ZIP archive"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(test)}
                            className="w-8 h-8 rounded-xl bg-red-50 text-[#dc2626] hover:bg-red-100 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                            title="Delete Mock Test"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Batch Rank List & Results Table */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-6">
              {/* Clean Humanized Header & Controls */}
              <div className="space-y-4 pb-5 border-b border-slate-100">
                {/* Row 1: Title, Badge and Export Actions */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                      <Trophy className="w-5 h-5 text-amber-600" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                          Batch Results &amp; Merit Rank List
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0056b3] border border-blue-200 text-xs font-semibold whitespace-nowrap">
                          {totalAppeared} {totalAppeared === 1 ? 'Candidate' : 'Candidates'} Appeared
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Verified student scores, merit standings, and downloadable score records.
                      </p>
                    </div>
                  </div>

                  {/* Export Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isExportingImage || totalAppeared === 0}
                      onClick={downloadRankListImage}
                      className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40 transition-all"
                      title="Download rank list as a high-resolution PNG image"
                    >
                      {isExportingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                      <span>Download Image</span>
                    </button>

                    <button
                      type="button"
                      disabled={totalAppeared === 0}
                      onClick={() => setPrintableRankModal(true)}
                      className="px-3.5 py-2.5 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40 transition-all"
                      title="Open formatted A4 page to print or Save as PDF"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print PDF</span>
                    </button>

                    <button
                      type="button"
                      disabled={totalAppeared === 0}
                      onClick={downloadRankListCSV}
                      className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-all"
                      title="Export records to CSV"
                    >
                      <Download className="w-4 h-4" /> CSV
                    </button>
                  </div>
                </div>

                {/* Row 2: Test Selector & Candidate Search Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-700 shrink-0">Select Mock Test:</span>
                    <select
                      value={selectedTestForRanks}
                      onChange={(e) => setSelectedTestForRanks(e.target.value)}
                      className="w-full sm:max-w-xl px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 hover:bg-white focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0056b3] transition-colors truncate"
                    >
                      {db.mockTests.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.batchName || 'General'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative w-full sm:w-64 shrink-0">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={rankSearchQuery}
                      onChange={(e) => setRankSearchQuery(e.target.value)}
                      placeholder="Search candidates by name..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                    />
                  </div>
                </div>
              </div>

              {/* Performance KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">
                    Total Candidates
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-blue-950 mt-1">
                    {totalAppeared}
                  </p>
                  <span className="text-[11px] text-blue-600 font-medium">Submissions recorded</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                    Highest Score
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
                    {highestScore} <span className="text-xs font-normal text-emerald-700">/ {totalMaxMarks}</span>
                  </p>
                  <span className="text-[11px] text-emerald-600 font-medium">Top candidate marks</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                    Average Score
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-amber-950 mt-1">
                    {avgScore} <span className="text-xs font-normal text-amber-700">/ {totalMaxMarks}</span>
                  </p>
                  <span className="text-[11px] text-amber-600 font-medium">Batch average</span>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">
                    Average Accuracy
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-purple-950 mt-1">
                    {avgAccuracy}%
                  </p>
                  <span className="text-[11px] text-purple-600 font-medium">Correct answer ratio</span>
                </div>
              </div>

              {totalAppeared === 0 ? (
                <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                  <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No Student Attempts Recorded Yet</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    When students take this mock test and submit their answers, their authoritative marks, merit ranks, and accuracy will appear here in real time.
                  </p>
                </div>
              ) : filteredRankAttempts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-slate-200 rounded-2xl">
                  No students match &quot;{rankSearchQuery}&quot;. Try a different search term.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[11px]">
                        <th className="py-3.5 px-4">Merit Rank</th>
                        <th className="py-3.5 px-4">Student Name</th>
                        <th className="py-3.5 px-4">Total Obtained Marks</th>
                        <th className="py-3.5 px-4">Correct / Wrong</th>
                        <th className="py-3.5 px-4">Accuracy %</th>
                        <th className="py-3.5 px-4">Submitted At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredRankAttempts.map((att, idx) => {
                        const actualRank = rawRankAttempts.findIndex((x) => x.id === att.id) + 1;
                        const isTop1 = actualRank === 1;
                        const isTop2 = actualRank === 2;
                        const isTop3 = actualRank === 3;

                        return (
                          <tr
                            key={att.id}
                            className={`hover:bg-slate-50 transition-colors ${isTop1 ? 'bg-amber-50/30' : isTop2 ? 'bg-slate-50/40' : isTop3 ? 'bg-orange-50/20' : ''
                              }`}
                          >
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {isTop1 ? (
                                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs">
                                  <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Rank #1
                                </span>
                              ) : isTop2 ? (
                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs">
                                  <Award className="w-3.5 h-3.5 text-slate-600 shrink-0" /> Rank #2
                                </span>
                              ) : isTop3 ? (
                                <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-800 border border-orange-200 font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs">
                                  <Award className="w-3.5 h-3.5 text-orange-600 shrink-0" /> Rank #3
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                                  #{actualRank}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0056b3] to-[#1e3a8a] text-white text-[11px] font-black inline-flex items-center justify-center shrink-0">
                                  {(att.studentName || 'S').slice(0, 1).toUpperCase()}
                                </span>
                                <span className="font-extrabold text-slate-900 text-xs">
                                  {att.studentName}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="text-sm font-black text-[#0056b3]">
                                {att.score}
                              </span>
                              <span className="text-xs font-semibold text-slate-400"> / {att.totalMarks || totalMaxMarks}</span>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                                {att.correctCount} <CustomCheckSvg className="w-3.5 h-3.5 text-emerald-600" />
                              </span>{' '}
                              /{' '}
                              <span className="text-red-600 font-bold inline-flex items-center gap-1">
                                {att.wrongCount} <CustomCrossSvg className="w-3.5 h-3.5 text-red-500" />
                              </span>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-full ${att.accuracy >= 75
                                        ? 'bg-emerald-500'
                                        : att.accuracy >= 50
                                          ? 'bg-blue-500'
                                          : 'bg-amber-500'
                                      }`}
                                    style={{ width: `${Math.min(100, att.accuracy)}%` }}
                                  />
                                </div>
                                <span className="font-bold text-slate-700 text-xs">{att.accuracy}%</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                              {att.submittedAt}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Printable Page Modal (Formatted for A4 Printing & Save as PDF) */}
            {printableRankModal && (
              <div className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Printer className="w-5 h-5 text-[#0056b3]" />
                      <h3 className="font-black text-base text-slate-900">
                        Official Printable Rank List Page
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-4 py-2 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Printer className="w-4 h-4" /> Print / Save as PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintableRankModal(false)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Print Sheet Document */}
                  <div className="p-6 sm:p-8 bg-white border border-slate-300 rounded-2xl shadow-xs space-y-6 print:p-0 print:border-none print:shadow-none">
                    {/* Academy Header */}
                    <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1">
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wider">
                        CAREER GUIDANCE ACADEMY
                      </h1>
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                        Tripura Academic Examination &amp; Mock Test Verification Portal
                      </p>
                      <div className="pt-2">
                        <span className="inline-block px-4 py-1 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-wider">
                          Official Merit &amp; Rank List
                        </span>
                      </div>
                    </div>

                    {/* Test Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Examination</span>
                        <p className="font-black text-slate-900 mt-0.5">{selectedTestObj?.title || 'Mock Test'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Batch / Target</span>
                        <p className="font-black text-slate-900 mt-0.5">{selectedTestObj?.batchName || 'General Batch'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Candidates</span>
                        <p className="font-black text-slate-900 mt-0.5">{totalAppeared}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Max Marks</span>
                        <p className="font-black text-slate-900 mt-0.5">{totalMaxMarks}</p>
                      </div>
                    </div>

                    {/* Printable Table */}
                    <table className="w-full text-left border-collapse text-xs border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-black uppercase text-[10px]">
                          <th className="py-2.5 px-3 border-r border-slate-300">Rank</th>
                          <th className="py-2.5 px-3 border-r border-slate-300">Candidate Name</th>
                          <th className="py-2.5 px-3 border-r border-slate-300">Marks Obtained</th>
                          <th className="py-2.5 px-3 border-r border-slate-300">Correct / Wrong</th>
                          <th className="py-2.5 px-3 border-r border-slate-300">Accuracy</th>
                          <th className="py-2.5 px-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {rawRankAttempts.map((att, idx) => (
                          <tr key={att.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="py-2.5 px-3 font-black border-r border-slate-200">
                              #{idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200">
                              {att.studentName}
                            </td>
                            <td className="py-2.5 px-3 font-black text-slate-900 border-r border-slate-200">
                              {att.score} / {att.totalMarks || totalMaxMarks}
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-200">
                              {att.correctCount} / {att.wrongCount}
                            </td>
                            <td className="py-2.5 px-3 font-bold border-r border-slate-200">
                              {att.accuracy}%
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                              {att.submittedAt}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Signature Section */}
                    <div className="pt-8 flex items-center justify-between border-t border-slate-300 text-xs">
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium">Verified by: Academic Examination Committee</p>
                        <p className="font-bold text-slate-800 mt-0.5">Career Guidance Academy</p>
                      </div>
                      <div className="text-right">
                        <div className="w-40 border-b border-slate-400 mb-1" />
                        <p className="text-[11px] text-slate-500 font-bold uppercase">Authorized Signatory</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ==================== TAB 2: TRIPURA TET DAILY MOCK SERIES PACKAGES ==================== */}
      {activeAdminTab === 'series' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-sm text-[#0a0e2a] flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#ea580c]" /> Tripura TET Daily Online Mock Tests Series Packages
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Manage mock test series package pricing, student enrollment fees, and launch schedules live in the database.
              </p>
            </div>
            <div className="text-xs text-slate-600 font-bold flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#0056b3]" /> 7005929189
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(db.mockSeries && db.mockSeries.length > 0 ? db.mockSeries : MOCK_SERIES_INITIAL).map((series) => {
              const isEditing = editingSeries?.id === series.id;

              return (
                <div
                  key={series.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-[#dc2626] text-[10px] font-black uppercase tracking-wider">
                        Festival Offer
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {series.classRange}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-[#0a0e2a] leading-snug">
                      {series.name}
                    </h3>
                    <p className="text-xs text-slate-600">{series.description}</p>

                    {/* Price & Schedule Management */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-bold">Package Price:</span>
                        {isEditing && editingSeries ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-black text-slate-800">₹</span>
                            <input
                              type="number"
                              value={editingSeries.price}
                              onChange={(e) =>
                                setEditingSeries({ ...editingSeries, price: Number(e.target.value) })
                              }
                              className="w-20 px-2 py-0.5 rounded border border-blue-400 text-xs font-bold text-[#0056b3]"
                            />
                          </div>
                        ) : (
                          <span className="text-xl font-black text-[#0056b3]">
                            ₹{series.price}/-
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Launch Date:</span>
                        {isEditing && editingSeries ? (
                          <input
                            type="text"
                            value={editingSeries.startsOn}
                            onChange={(e) =>
                              setEditingSeries({ ...editingSeries, startsOn: e.target.value })
                            }
                            className="px-2 py-0.5 rounded border border-slate-300 text-xs font-semibold"
                            placeholder="e.g. Admin Scheduled"
                          />
                        ) : (
                          <span className="font-bold text-slate-700">{series.startsOn}</span>
                        )}
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Features from Banner:
                      </span>
                      <ul className="text-xs text-slate-600 space-y-1">
                        {series.highlights.slice(0, 5).map((h: string, i: number) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    {isEditing ? (
                      <div className="flex items-center gap-2 w-full">
                        <button
                          type="button"
                          onClick={async () => {
                            if (editingSeries) {
                              await updateMockSeries(editingSeries);
                              setEditingSeries(null);
                            }
                          }}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" /> Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSeries(null)}
                          className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <button
                          type="button"
                          onClick={() => setEditingSeries({ ...series })}
                          className="flex-1 py-2 rounded-xl bg-blue-50 text-[#0056b3] hover:bg-blue-100 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Price
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/mock-tests/${series.id}/papers`)}
                          className="px-3 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          title="Manage soft-copy Question Paper PDFs"
                        >
                          <FileText className="w-3.5 h-3.5" /> Papers
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: SUBJECT QUESTION DRIVE LINKS & ANNOUNCEMENTS ==================== */}
      {activeAdminTab === 'subject_posts' && (
        <div className="space-y-6">
          {/* Action Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-[#0056b3] text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1.5 max-w-2xl">
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Enrolled Students Exclusive Portal
              </span>
              <h2 className="text-xl font-extrabold text-white">
                Mock Test Subject Question Papers &amp; Google Drive Announcements
              </h2>
              <p className="text-xs text-blue-100 leading-relaxed">
                Post question paper PDFs, OMR worksheets, and examination instructions inside each specific mock test subject. Only enrolled students in that mock test package can access the Google Drive links.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openCreatePostModal()}
              className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg shrink-0 transition-all"
            >
              <Plus className="w-4 h-4" /> Post New Question Drive Link
            </button>
          </div>

          {/* Subject Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-bold text-slate-500 mr-1">Filter by Subject:</span>
            {[
              'all',
              'Child Development & Pedagogy',
              'Language – I (English)',
              'Language – II (Bengali)',
              'Mathematics',
              'Environmental Studies (EVS)',
              'Science',
              'History',
            ].map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setFilterPostSubject(sub)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${filterPostSubject === sub
                    ? 'bg-[#0056b3] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {sub === 'all' ? 'All Subjects' : sub}
              </button>
            ))}
          </div>

          {/* Posts Grid */}
          {(() => {
            const posts = (db.mockSubjectPosts || []).filter((p) => {
              if (filterPostSubject === 'all') return true;
              return p.subjectName.toLowerCase().includes(filterPostSubject.toLowerCase());
            });

            if (posts.length === 0) {
              return (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-extrabold text-sm text-slate-700">No question papers posted for this subject yet.</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Click the button below to share a Google Drive link and instructions for enrolled candidates.
                  </p>
                  <button
                    type="button"
                    onClick={() => openCreatePostModal()}
                    className="px-4 py-2 rounded-xl bg-[#0056b3] text-white font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Post First Question Paper
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all border-t-4 border-t-[#0056b3]"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0056b3] border border-blue-200 text-[11px] font-extrabold">
                          {post.subjectName}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Enrolled Only
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {post.seriesName || 'Tripura TET Package'}
                          {post.testTitle ? ` • ${post.testTitle}` : ''}
                        </span>
                        <h3 className="text-base font-extrabold text-[#0a0e2a] mt-0.5 leading-snug">
                          {post.title}
                        </h3>
                      </div>

                      {/* Google Drive Link Box */}
                      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-amber-900 inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            Google Drive Question Paper Link:
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={post.driveLink}
                            className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-slate-600 text-[11px] font-mono truncate focus:outline-none"
                          />
                          <a
                            href={post.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-[11px] font-bold inline-flex items-center gap-1 shrink-0 shadow-xs"
                          >
                            <ExternalLink className="w-3 h-3" /> Open
                          </a>
                        </div>
                      </div>

                      {/* Exam Instructions */}
                      {post.instructions && (
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                            Instructions for Enrolled Students:
                          </span>
                          <p className="leading-relaxed line-clamp-3">{post.instructions}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div>
                        <span className="font-bold text-slate-700 block">{post.author}</span>
                        <span>Posted on {post.postedDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewPost(false);
                            setEditingPost({ ...post });
                          }}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-all"
                          title="Edit Post"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletePostTarget(post)}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-[#dc2626] cursor-pointer transition-all"
                          title="Delete Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ==================== TAB 4: STORAGE METER & LIFECYCLE ==================== */}
      {activeAdminTab === 'storage_meter' && (
        <MockTestStorageMeter />
      )}

      {/* ==================== CREATE / EDIT MOCK TEST MODAL ==================== */}
      {editingTest && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveTest}
            className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 text-xs my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0056b3] text-[10px] font-bold uppercase tracking-wider">
                  Mock Test Builder & Ingestion
                </span>
                <h3 className="text-lg font-extrabold text-[#0a0e2a] mt-1">
                  {isNew ? 'Create & Launch Mock Test' : `Edit ${editingTest.title}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTest(null)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Metadata & Scheduling Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {/* 1. Scope Selector Cards */}
              <div className="sm:col-span-2">
                <label className="font-extrabold text-xs text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Mock Test Target &amp; Student Access Scope *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setModalTargetScope('mock_series_only');
                      const sObj = (db.mockSeries && db.mockSeries.length > 0 ? db.mockSeries : MOCK_SERIES_INITIAL).find(
                        (s) => s.id === editingTest.seriesId
                      ) || (db.mockSeries && db.mockSeries.length > 0 ? db.mockSeries : MOCK_SERIES_INITIAL)[0];
                      setEditingTest({
                        ...editingTest,
                        seriesId: sObj.id,
                        courseId: '',
                        courseName: 'Dedicated Mock Test Series Package',
                        batchName: `${sObj.name} (Dedicated Mock Series Students)`,
                      });
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${modalTargetScope === 'mock_series_only'
                        ? 'bg-blue-50/90 border-[#0056b3] ring-2 ring-[#0056b3]/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#0a0e2a] flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-[#0056b3]" />
                          <span>Mock Series Only</span>
                        </span>
                        {modalTargetScope === 'mock_series_only' && <Check className="w-3.5 h-3.5 text-[#0056b3]" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                        Mock Test Section Only. Students enrolled in the standalone mock test package (plus enrolled course students with mock tests) have access.
                      </p>
                    </div>
                    <span className="mt-2 text-[9px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 self-start">
                      Dedicated Mock Series
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalTargetScope('course_only');
                      const firstCourse = db.courses[0];
                      setEditingTest({
                        ...editingTest,
                        courseId: firstCourse?.id || '',
                        courseName: firstCourse?.name || 'Classroom Batch',
                        batchName: firstCourse?.batchName || 'Regular Batch',
                      });
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${modalTargetScope === 'course_only'
                        ? 'bg-blue-50/90 border-[#0056b3] ring-2 ring-[#0056b3]/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#0a0e2a] flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                          <span>Course Batch Only</span>
                        </span>
                        {modalTargetScope === 'course_only' && <Check className="w-3.5 h-3.5 text-[#0056b3]" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                        Exclusive only for students enrolled in a specific classroom or online batch (e.g. TCS/TPS, TPSC, STGT regular batches).
                      </p>
                    </div>
                    <span className="mt-2 text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 self-start">
                      Course Enrolled Only
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalTargetScope('combined');
                      const sObj = (db.mockSeries && db.mockSeries.length > 0 ? db.mockSeries : MOCK_SERIES_INITIAL).find(
                        (s) => s.id === editingTest.seriesId
                      ) || (db.mockSeries && db.mockSeries.length > 0 ? db.mockSeries : MOCK_SERIES_INITIAL)[0];
                      const firstCourse = db.courses[0];
                      setEditingTest({
                        ...editingTest,
                        seriesId: sObj.id,
                        courseId: firstCourse?.id || '',
                        courseName: firstCourse?.name || 'Classroom Batch',
                        batchName: `${sObj.name} & ${firstCourse?.batchName || 'Batch'}`,
                      });
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${modalTargetScope === 'combined'
                        ? 'bg-blue-50/90 border-[#0056b3] ring-2 ring-[#0056b3]/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#0a0e2a] flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-purple-600" />
                          <span>Combined Access</span>
                        </span>
                        {modalTargetScope === 'combined' && <Check className="w-3.5 h-3.5 text-[#0056b3]" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                        Dual Access: Permits BOTH candidates enrolled in the Mock Test Series AND students enrolled in the Course Batch to attempt.
                      </p>
                    </div>
                    <span className="mt-2 text-[9px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 self-start">
                      Mock Series + Course
                    </span>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Mock Test Title *</label>
                <input
                  type="text"
                  required
                  value={editingTest.title}
                  onChange={(e) => setEditingTest({ ...editingTest, title: e.target.value })}
                  placeholder="e.g. Tripura TET: Paper-I 2026 — Daily Online Mock #01"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              {/* Subject & Category Selection (Grouped by Specific Mock Test) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Subject &amp; Category (Specific Mock Tests) *
                </label>
                <select
                  value={`${editingTest.seriesId || 'series-ttet-paper1'}:::${editingTest.subject || 'Child Development & Pedagogy'}`}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                >
                  {ALL_MOCK_SUBJECT_GROUPS.map((grp) => (
                    <optgroup key={grp.seriesId} label={grp.group}>
                      {grp.items.map((it) => (
                        <option key={`${it.seriesId}:::${it.name}`} value={`${it.seriesId}:::${it.name}`}>
                          {it.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  {/* Fallback for any legacy subject not in groups */}
                  {!ALL_MOCK_SUBJECT_GROUPS.some((g) =>
                    g.items.some((it) => it.seriesId === editingTest.seriesId && it.name === editingTest.subject)
                  ) && (
                      <optgroup label="Other Subject">
                        <option value={`${editingTest.seriesId || 'series-ttet-paper1'}:::${editingTest.subject || 'Custom'}`}>
                          {editingTest.subject || 'Custom Subject'}
                        </option>
                      </optgroup>
                    )}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Selecting a subject auto-configures the series, language mode, and default matching course.
                </p>
              </div>

              {/* Scheduled Launch Date */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>Scheduled Launch Date *</span>
                  <span className="text-[10px] text-blue-600 font-semibold">Admin Managed</span>
                </label>
                <input
                  type="date"
                  required
                  value={editingTest.scheduledDate || ''}
                  onChange={(e) => setEditingTest({ ...editingTest, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                />
              </div>

              {/* Scope Tailored Target Selectors */}
              {modalTargetScope === 'mock_series_only' && (
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Target Mock Test Series Package *</span>
                    <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      Mock Test Section Only
                    </span>
                  </label>
                  <select
                    value={editingTest.seriesId || 'series-ttet-paper1'}
                    onChange={(e) => {
                      const sObj = (db.mockSeries && db.mockSeries.length > 0 ? db.mockSeries : MOCK_SERIES_INITIAL).find(
                        (s) => s.id === e.target.value
                      );
                      setEditingTest({
                        ...editingTest,
                        seriesId: e.target.value,
                        courseId: '',
                        courseName: sObj?.name || 'Dedicated Mock Test Series Package',
                        batchName: `${sObj?.name || 'Mock Series'} (Enrolled Students Only)`,
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                  >
                    {(db.mockSeries && db.mockSeries.length > 0 ? db.mockSeries : MOCK_SERIES_INITIAL).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (₹{s.price}/-) — {s.classRange}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Strict access control: only students enrolled in this series package (and enrolled course students with mock tests included) will be permitted to attempt this test.
                  </p>
                </div>
              )}

              {modalTargetScope === 'course_only' && (
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Target Course &amp; Batch *</span>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Course Batch Enrolled Only
                    </span>
                  </label>
                  <select
                    required
                    value={editingTest.courseId || ''}
                    onChange={(e) => {
                      const crs = db.courses.find((c) => c.id === e.target.value);
                      setEditingTest({
                        ...editingTest,
                        courseId: e.target.value,
                        courseName: crs?.name || '',
                        batchName: crs?.batchName || '',
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-amber-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Select Enrolled Course Batch --</option>
                    {db.courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — ({c.batchName} • {c.mode})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Strict access control: only candidates enrolled in this specific course batch will have access to attempt.
                  </p>
                </div>
              )}

              {modalTargetScope === 'combined' && (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Target Mock Test Series Package *
                    </label>
                    <select
                      value={editingTest.seriesId || 'series-ttet-paper1'}
                      onChange={(e) => {
                        setEditingTest({
                          ...editingTest,
                          seriesId: e.target.value,
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                    >
                      {(db.mockSeries && db.mockSeries.length > 0 ? db.mockSeries : MOCK_SERIES_INITIAL).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (₹{s.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Target Course &amp; Batch *</label>
                    <select
                      value={editingTest.courseId || ''}
                      onChange={(e) => {
                        const crs = db.courses.find((c) => c.id === e.target.value);
                        setEditingTest({
                          ...editingTest,
                          courseId: e.target.value,
                          courseName: crs?.name || '',
                          batchName: crs?.batchName || '',
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                    >
                      <option value="">-- Select Matching Course Batch --</option>
                      {db.courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.batchName})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Real-time Access Guarantee Banner */}
              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-sm flex items-start gap-3">
                <Lock className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    Strict Enrolled-Only Access Guarantee Enforced
                  </span>
                  <p className="text-slate-200 text-[11px] leading-relaxed">
                    {modalTargetScope === 'mock_series_only' && (
                      <>
                        Only candidates who enrolled in{' '}
                        <strong>
                          {(db.mockSeries && db.mockSeries.length > 0 ? db.mockSeries : MOCK_SERIES_INITIAL).find(
                            (s) => s.id === editingTest.seriesId
                          )?.name || 'the selected mock series package'}
                        </strong>{' '}
                        (or students whose enrolled course includes mock tests) will be permitted to attempt this test. Unenrolled students are completely blocked.
                      </>
                    )}
                    {modalTargetScope === 'course_only' && (
                      <>
                        Only students enrolled in{' '}
                        <strong>
                          {db.courses.find((c) => c.id === editingTest.courseId)?.name ||
                            editingTest.courseName ||
                            'the selected course batch'}
                        </strong>{' '}
                        will have access to attempt. Unenrolled students and candidates in other courses cannot attempt.
                      </>
                    )}
                    {modalTargetScope === 'combined' && (
                      <>
                        Candidates enrolled in either the{' '}
                        <strong>
                          {(db.mockSeries && db.mockSeries.length > 0 ? db.mockSeries : MOCK_SERIES_INITIAL).find(
                            (s) => s.id === editingTest.seriesId
                          )?.name || 'Mock Series Package'}
                        </strong>{' '}
                        OR the{' '}
                        <strong>
                          {db.courses.find((c) => c.id === editingTest.courseId)?.name ||
                            editingTest.courseName ||
                            'Course Batch'}
                        </strong>{' '}
                        will have access to attempt. Unenrolled students are strictly blocked.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Question Paper Google Drive Link */}
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>Question Paper Google Drive Link (Optional)</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Enrolled Students Only</span>
                </label>
                <input
                  type="url"
                  value={editingTest.driveLink || ''}
                  onChange={(e) => setEditingTest({ ...editingTest, driveLink: e.target.value })}
                  placeholder="https://drive.google.com/file/d/... or folder link"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  When published, enrolled students can view the official question paper PDF directly from their student portal. If left empty, the student portal indicates the Drive link will be published by admin before exam time.
                </p>
              </div>

              {/* Language Rule Banner Indicator */}
              <div className="sm:col-span-2">
                {editingTest.languageMode === 'english_only' && (
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center gap-2">
                    <Languages className="w-4 h-4 shrink-0 text-indigo-600" />
                    <div>
                      <strong className="block">English Subject Exam:</strong>
                      <span>Questions and options are strictly in English. No Bengali translation needed.</span>
                    </div>
                  </div>
                )}
                {editingTest.languageMode === 'bengali_only' && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2 font-sans">
                    <Languages className="w-4 h-4 shrink-0 text-emerald-600" />
                    <div>
                      <strong className="block">বাংলা পত্র (Bengali Subject):</strong>
                      <span>প্রশ্ন ও উত্তর শুধুমাত্র বাংলা ভাষায় তৈরি হবে।</span>
                    </div>
                  </div>
                )}
                {editingTest.languageMode === 'bilingual' && (
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 flex items-center gap-2">
                    <Languages className="w-4 h-4 shrink-0 text-purple-600" />
                    <div>
                      <strong className="block">Bilingual Subject Standard:</strong>
                      <span>Questions and options are provided in both English and Bengali (students can toggle language view in CBT).</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingTest.durationMinutes}
                    onChange={(e) =>
                      setEditingTest({ ...editingTest, durationMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Marks / Q</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0.5}
                    value={editingTest.marksPerQuestion}
                    onChange={(e) => {
                      const mpq = Number(e.target.value);
                      setEditingTest({
                        ...editingTest,
                        marksPerQuestion: mpq,
                        totalMarks: editingTest.questions.length * mpq,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Negative</label>
                  <input
                    type="number"
                    step="0.25"
                    min={0}
                    value={editingTest.negativeMarking}
                    onChange={(e) =>
                      setEditingTest({ ...editingTest, negativeMarking: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* ==================== BULK QUESTION UPLOADER & PARSER ==================== */}
            <div className="border border-blue-200 rounded-3xl p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#0056b3]" />
                  <span className="font-extrabold text-sm text-[#0a0e2a]">
                    Add Questions &amp; Passages (Paste Text, Single MCQ, Diagrams, or Passages)
                  </span>
                </div>

                <div className="flex flex-wrap bg-white rounded-xl p-1 border border-slate-200 shadow-2xs gap-1">
                  <button
                    type="button"
                    onClick={() => handleSwitchImportMode('paste')}
                    className={`px-3 py-1.5 rounded-lg font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                      importMode === 'paste' ? 'bg-[#0056b3] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Paste Questions
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchImportMode('manual')}
                    className={`px-3 py-1.5 rounded-lg font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                      importMode === 'manual' ? 'bg-[#0056b3] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Single MCQ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchImportMode('diagram')}
                    className={`px-3 py-1.5 rounded-lg font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                      importMode === 'diagram' ? 'bg-[#0056b3] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Add Diagram
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchImportMode('passage')}
                    className={`px-3 py-1.5 rounded-lg font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                      importMode === 'passage' ? 'bg-[#0056b3] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Passage Questions
                  </button>
                </div>
              </div>

              {/* Mode 1: Paste Raw Text */}
              {importMode === 'paste' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Paste question paper text with options and answer keys:
                    </span>
                    <button
                      type="button"
                      onClick={handleInsertSampleTemplate}
                      className="text-xs text-[#0056b3] hover:underline font-bold inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Load Sample Questions
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    onPaste={(e) => {
                      const html = e.clipboardData?.getData('text/html');
                      const plain = e.clipboardData?.getData('text/plain') || '';
                      if (html || plain) {
                        const enriched = extractRichClipboardQuestionText(html || '', plain);
                        if (enriched && enriched !== plain) {
                          e.preventDefault();
                          setPastedText(enriched);
                        }
                      }
                    }}
                    placeholder="1. Question statement...&#10;(A) Option A&#10;(B) Option B&#10;(C) Option C&#10;(D) Option D&#10;Ans: A&#10;Explanation: Solution notes..."
                    className="w-full p-3.5 rounded-2xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                  />
                  {parseError && (
                    <div className="p-2.5 rounded-xl bg-red-50 text-[#dc2626] border border-red-200 text-xs">
                      {parseError}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleParsePastedText}
                      className="px-5 py-2.5 rounded-xl bg-[#0056b3] text-white font-bold text-xs cursor-pointer hover:bg-[#1e3a8a] shadow-xs"
                    >
                      Extract &amp; Add Questions
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/mock-tests/${editingTest.id}/questions?tab=paste`)}
                      className="text-xs font-bold text-[#0056b3] hover:underline inline-flex items-center gap-1"
                    >
                      Open Full Studio for LaTeX &amp; OCR <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Mode 2: Manual Single Question */}
              {importMode === 'manual' && (
                <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">
                      {editingTest.languageMode === 'bengali_only' ? 'প্রশ্ন (বাংলায়) *' : 'Question Statement (English) *'}
                    </label>
                    <input
                      type="text"
                      value={newQText}
                      onChange={(e) => setNewQText(e.target.value)}
                      placeholder="e.g. In the given circuit diagram, find the equivalent resistance..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  {editingTest.languageMode === 'bilingual' && (
                    <div>
                      <label className="font-bold text-blue-900 block mb-1 text-xs">
                        প্রশ্ন অনুবাদ (বাংলায় - Optional/Bilingual)
                      </label>
                      <input
                        type="text"
                        value={newQTextBn}
                        onChange={(e) => setNewQTextBn(e.target.value)}
                        placeholder="প্রদত্ত সার্কিট চিত্রে সমতুল্য রোধ নির্ণয় করুন..."
                        className="w-full px-3 py-2 rounded-xl border border-blue-200 text-xs bg-blue-50/30"
                      />
                    </div>
                  )}

                  {/* Optional Diagram Attachment for this single question */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#0056b3]" />
                      <span className="text-xs font-bold text-slate-700">Attach Question Diagram (Optional):</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {singleQDiagramPreview ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={singleQDiagramPreview}
                            alt="Diagram preview"
                            className="w-12 h-10 object-contain rounded border border-slate-300 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSingleQDiagramFile(null);
                              setSingleQDiagramPreview('');
                              if (singleQDiagramInputRef.current) singleQDiagramInputRef.current.value = '';
                            }}
                            className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs">
                          <Upload className="w-3.5 h-3.5 text-[#0056b3]" /> Select Diagram Image
                          <input
                            ref={singleQDiagramInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                setSingleQDiagramFile(f);
                                setSingleQDiagramPreview(URL.createObjectURL(f));
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={optA}
                      onChange={(e) => setOptA(e.target.value)}
                      placeholder="Option A (English)"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                    <input
                      type="text"
                      value={optB}
                      onChange={(e) => setOptB(e.target.value)}
                      placeholder="Option B (English)"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                    <input
                      type="text"
                      value={optC}
                      onChange={(e) => setOptC(e.target.value)}
                      placeholder="Option C (English)"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                    <input
                      type="text"
                      value={optD}
                      onChange={(e) => setOptD(e.target.value)}
                      placeholder="Option D (English)"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  {editingTest.languageMode === 'bilingual' && (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                      <input
                        type="text"
                        value={optABn}
                        onChange={(e) => setOptABn(e.target.value)}
                        placeholder="অপশন A (বাংলায়)"
                        className="px-3 py-1.5 rounded-xl border border-blue-200 text-xs bg-blue-50/20"
                      />
                      <input
                        type="text"
                        value={optBBn}
                        onChange={(e) => setOptBBn(e.target.value)}
                        placeholder="অপশন B (বাংলায়)"
                        className="px-3 py-1.5 rounded-xl border border-blue-200 text-xs bg-blue-50/20"
                      />
                      <input
                        type="text"
                        value={optCBn}
                        onChange={(e) => setOptCBn(e.target.value)}
                        placeholder="অপশন C (বাংলায়)"
                        className="px-3 py-1.5 rounded-xl border border-blue-200 text-xs bg-blue-50/20"
                      />
                      <input
                        type="text"
                        value={optDBn}
                        onChange={(e) => setOptDBn(e.target.value)}
                        placeholder="অপশন D (বাংলায়)"
                        className="px-3 py-1.5 rounded-xl border border-blue-200 text-xs bg-blue-50/20"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <select
                      value={correctIdx}
                      onChange={(e) => setCorrectIdx(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-xs bg-white"
                    >
                      <option value={0}>Correct: Option A</option>
                      <option value={1}>Correct: Option B</option>
                      <option value={2}>Correct: Option C</option>
                      <option value={3}>Correct: Option D</option>
                    </select>

                    <button
                      type="button"
                      disabled={isUploadingDiagram}
                      onClick={handleAddSingleQuestion}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isUploadingDiagram ? 'Attaching Diagram...' : '+ Add Question'}
                    </button>
                  </div>
                </div>
              )}

              {/* Mode 3: Add Diagrams directly to Questions */}
              {importMode === 'diagram' && (
                <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-[#0056b3]" />
                        <span>Attach Question Diagrams from Local Device</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Options are normal text. Diagrams attach strictly to the specific question statement.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/mock-tests/${editingTest.id}/questions?tab=paste`)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#0056b3] border border-blue-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      Open Full Diagram Studio <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {editingTest.questions.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      No questions in this test yet. Add questions via &quot;Paste Questions&quot; first, then attach diagrams here.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {editingTest.questions.map((q, qIdx) => (
                        <div
                          key={q.id || qIdx}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex-1">
                            <span className="font-bold text-[#0056b3] mr-2">Q{qIdx + 1}.</span>
                            <span className="font-semibold text-slate-800 line-clamp-1">{q.question}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {q.imagePath ? (
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px] inline-flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" /> Diagram Attached
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleModalRemoveDiagram(qIdx)}
                                  className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <label className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs">
                                <Upload className="w-3.5 h-3.5 text-[#0056b3]" /> Attach Diagram
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleModalQuestionDiagramUpload(qIdx, f);
                                  }}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mode 4: Two-Section Reading Comprehension / Passage Builder */}
              {importMode === 'passage' && (
                <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-purple-200 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-2.5">
                    <div>
                      <h4 className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-purple-700" />
                        <span>Two-Section Reading Comprehension Passage Builder</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Section 1: Full reading paragraph text. Section 2: Questions and options based on it.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setModalPassageTitle('Reading Comprehension (Q.1 to Q.3)');
                        setModalPassageBody(`Environmental sustainability is one of the most pressing challenges of the modern era. Over the last century, exponential industrial growth and urban expansion have led to unprecedented levels of resource depletion and carbon emissions.

Scientists emphasize that conservation cannot remain a peripheral policy; it must be integrated into the core economic framework of every nation. By transitioning toward circular economies and renewable energy, societies can mitigate severe climate risks while generating sustainable economic growth.`);
                        setModalPassageQsText(`1. According to the passage, what is described as one of the most pressing challenges of the modern era?
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
Explanation: Paragraph 1 highlights exponential industrial growth and urban expansion.`);
                        showToast('Sample Loaded', 'Sample passage and questions inserted into Section 1 & Section 2.', 'success');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Load Sample Passage
                    </button>
                  </div>

                  {/* Section 1: Passage Paragraph */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-purple-950 block">
                      Section 1: Full Reading Paragraph / Comprehension Text *
                    </label>
                    <textarea
                      rows={4}
                      value={modalPassageBody}
                      onChange={(e) => setModalPassageBody(e.target.value)}
                      placeholder="Paste the whole paragraph of the reading comprehension passage here..."
                      className="w-full p-3 rounded-xl border border-purple-200 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50/20"
                    />
                  </div>

                  {/* Section 2: Questions based on Passage */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-purple-950 block">
                      Section 2: Questions &amp; Options linked to this passage *
                    </label>
                    <textarea
                      rows={5}
                      value={modalPassageQsText}
                      onChange={(e) => setModalPassageQsText(e.target.value)}
                      onPaste={(e) => {
                        const html = e.clipboardData?.getData('text/html');
                        const plain = e.clipboardData?.getData('text/plain') || '';
                        if (html || plain) {
                          const enriched = extractRichClipboardQuestionText(html || '', plain);
                          if (enriched && enriched !== plain) {
                            e.preventDefault();
                            setModalPassageQsText(enriched);
                          }
                        }
                      }}
                      placeholder="1. Question linked to the passage...&#10;(A) Option A&#10;(B) Option B&#10;(C) Option C&#10;(D) Option D&#10;Ans: B&#10;Explanation: Refer to paragraph 1..."
                      className="w-full p-3 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0056b3] bg-white"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-purple-100">
                    <button
                      type="button"
                      onClick={handleAddPassageInModal}
                      className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" /> Add Passage &amp; Questions to Test
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push(`/admin/mock-tests/${editingTest.id}/questions?tab=passages`)}
                      className="text-xs font-bold text-purple-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      Open Full Passage Studio <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ==================== EXTRACTED QUESTIONS INVENTORY ==================== */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-[#0056b3]" />
                  <span className="font-extrabold text-sm text-[#0a0e2a]">
                    Test Question Bank ({editingTest.questions.length} Total Questions)
                  </span>
                  {editingTest.questions.some((q) => Boolean(q.groupId || q.passageText)) && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold">
                      {editingTest.questions.filter((q) => Boolean(q.groupId || q.passageText)).length} Passage Qs
                    </span>
                  )}
                  {editingTest.questions.some((q) => !q.groupId && !q.passageText) && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0056b3] border border-blue-200 text-[10px] font-bold">
                      {editingTest.questions.filter((q) => !q.groupId && !q.passageText).length} Standard MCQs
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(editingTest.questions.some((q) => Boolean(q.imagePath || q.passageImagePath)) ||
                    (editingTest.questionGroups || []).some((g) => Boolean(g.imagePath))) && (
                    <button
                      type="button"
                      disabled={isCleaningTestImages}
                      onClick={() => void handleCleanAllTestImages(editingTest)}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                      title="Delete all uploaded diagram images for this test to free storage space while keeping all questions and passages"
                    >
                      <Trash2 className="w-3 h-3 text-amber-700" />
                      <span>{isCleaningTestImages ? 'Cleaning...' : 'Remove All Diagrams (Free Space)'}</span>
                    </button>
                  )}
                  <div className="text-xs font-bold text-[#0056b3] bg-blue-50 px-2.5 py-1 rounded-lg">
                    Total Marks: {editingTest.questions.length * editingTest.marksPerQuestion}
                  </div>
                </div>
              </div>

              {editingTest.questions.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500">
                  <p className="font-bold text-xs">No questions loaded yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Paste question text, add single MCQs, or build passage questions above to populate this mock test.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {editingTest.questions.map((q, idx) => {
                    const prevQ = idx > 0 ? editingTest.questions[idx - 1] : null;
                    const groupObj = (editingTest.questionGroups || []).find((g) => g.id === q.groupId);
                    const effectivePassageText = groupObj?.passageText || q.passageText || null;
                    const effectivePassageTitle =
                      groupObj?.imageAlt || q.passageTitle || 'Reading Comprehension Passage';
                    const isFirstInPassageGroup =
                      Boolean(effectivePassageText) &&
                      (!prevQ ||
                        (q.groupId && prevQ.groupId !== q.groupId) ||
                        (!q.groupId && prevQ.passageText !== q.passageText));

                    return (
                      <React.Fragment key={q.id || idx}>
                        {isFirstInPassageGroup && effectivePassageText && (
                          <div className="p-3.5 rounded-2xl bg-purple-50/70 border-2 border-purple-200 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-extrabold text-purple-900 flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-purple-700" />
                                <span>{effectivePassageTitle}</span>
                              </span>
                              {q.groupId && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePassageGroupInModal(q.groupId!)}
                                  className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-[#dc2626] border border-red-200 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                  title="Delete this passage and all its linked questions"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete Passage &amp; Linked Qs
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-700 bg-white p-2.5 rounded-xl border border-purple-100 whitespace-pre-line max-h-28 overflow-y-auto leading-relaxed">
                              {effectivePassageText}
                            </p>
                          </div>
                        )}

                        <div
                          className={`p-3.5 rounded-2xl bg-white border space-y-2 transition-all shadow-2xs ${
                            effectivePassageText
                              ? 'border-purple-200 hover:border-purple-300'
                              : 'border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-1">
                              <div className="font-extrabold text-slate-900 text-xs leading-relaxed">
                                <span className="text-[#0056b3] font-bold mr-1.5">Q{idx + 1}.</span>
                                <MathText text={q.question} />
                              </div>
                              {q.questionBn && (
                                <div className="text-[11px] font-semibold text-blue-900 leading-relaxed">
                                  <MathText text={q.questionBn} />
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(q.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-[#dc2626] hover:bg-red-50 cursor-pointer"
                              title="Remove Question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Diagram or Passage indicators */}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            {q.imagePath ? (
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                                  <ImageIcon className="w-3 h-3 text-emerald-600" /> Compressed Diagram Attached
                                </span>
                                <button
                                  type="button"
                                  onClick={() => void handleModalRemoveDiagram(idx)}
                                  className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                                >
                                  Remove &amp; Free Space
                                </button>
                              </div>
                            ) : (
                              <label className="text-[11px] font-bold text-[#0056b3] hover:underline cursor-pointer inline-flex items-center gap-1">
                                <Upload className="w-3 h-3" /> Attach Diagram
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) void handleModalQuestionDiagramUpload(idx, f);
                                  }}
                                  className="hidden"
                                />
                              </label>
                            )}

                            {(q.groupId || q.passageText) && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold inline-flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> Linked to Passage
                              </span>
                            )}
                          </div>

                          {/* Options Grid with Clickable Correct Answer Selector */}
                          <div className="grid grid-cols-2 gap-1.5">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = q.correctOptionIndex === oIdx;
                              const optBn = q.optionsBn?.[oIdx];
                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() => handleUpdateQuestionCorrectOpt(q.id, oIdx)}
                                  className={`p-2 rounded-xl text-left border flex items-center gap-2 cursor-pointer transition-all ${
                                    isCorrect
                                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <span
                                    className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0 ${
                                      isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <div className="truncate flex-1">
                                    <div className="truncate block text-xs">
                                      <MathText text={getOptionText(opt)} isOption />
                                    </div>
                                    {optBn && (
                                      <div className="truncate block text-[10px] text-slate-500">
                                        <MathText text={getOptionText(optBn)} isOption />
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600">Launch Status:</label>
                <select
                  value={editingTest.status}
                  onChange={(e) =>
                    setEditingTest({
                      ...editingTest,
                      status: e.target.value as 'Published' | 'Draft',
                    })
                  }
                  className="px-2.5 py-1 rounded-lg border border-slate-300 font-bold text-xs bg-white"
                >
                  <option value="Published">Published (Live for Students)</option>
                  <option value="Draft">Draft (Scheduled / Private)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTest(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-extrabold cursor-pointer shadow-sm"
                >
                  {editingTest.status === 'Draft' ? 'Save Draft Mock Test' : 'Save & Launch Mock Test'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Mock Test?"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? All associated questions and attempt records will be removed.`}
        confirmLabel="Yes, Delete Test"
        onConfirm={async () => {
          if (deleteTarget) {
            const id = deleteTarget.id;
            setDeleteTarget(null);
            await deleteMockTest(id);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ==================== CREATE / EDIT SUBJECT QUESTION POST MODAL ==================== */}
      {editingPost && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveSubjectPost}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 text-xs my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0056b3] text-white flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    {isNewPost ? 'Post Mock Test Question / Drive Link' : 'Edit Subject Question Post'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Share question booklet PDFs with enrolled candidates for this mock test subject.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Series & Subject Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Mock Test Series Package <span className="text-[#dc2626]">*</span>
                </label>
                <select
                  value={editingPost.seriesId}
                  onChange={(e) => {
                    const ser = db.mockSeries.find((s) => s.id === e.target.value);
                    const defaultSub = db.mockSubjects.find((sub) => sub.seriesId === e.target.value) || db.mockSubjects[0];
                    setEditingPost({
                      ...editingPost,
                      seriesId: e.target.value,
                      seriesName: ser?.name || '',
                      subjectId: defaultSub?.id || editingPost.subjectId,
                      subjectName: defaultSub?.name || editingPost.subjectName,
                    });
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs bg-white"
                >
                  {db.mockSeries.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                  <option value="all">All Packages / General Mock Tests</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Specific Mock Test Subject <span className="text-[#dc2626]">*</span>
                </label>
                <select
                  value={editingPost.subjectName}
                  onChange={(e) => {
                    const found = db.mockSubjects.find((s) => s.name === e.target.value);
                    setEditingPost({
                      ...editingPost,
                      subjectName: e.target.value,
                      subjectId: found?.id || editingPost.subjectId,
                    });
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs bg-white"
                >
                  {Array.from(new Set(db.mockSubjects.map((s) => s.name))).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Specific Mock Test */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Target Specific Mock Test (Optional)
              </label>
              <select
                value={editingPost.testId || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const t = db.mockTests.find((x) => x.id === val);
                  setEditingPost({
                    ...editingPost,
                    testId: val || null,
                    testTitle: t?.title || null,
                  });
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs bg-white"
              >
                <option value="">Apply to Entire Subject (All Mock Tests in Subject)</option>
                {db.mockTests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.batchName})
                  </option>
                ))}
              </select>
            </div>

            {/* Post Title */}
            <div>
              <label htmlFor="drive-post-title" className="block text-xs font-bold text-slate-700 mb-1.5">
                Question Paper Title / Announcement Heading <span className="text-[#dc2626]">*</span>
              </label>
              <input
                id="drive-post-title"
                type="text"
                required
                value={editingPost.title}
                onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                placeholder="e.g. Tripura TET 2026: CDP Sectional Mock 1 Question Booklet PDF"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-xs focus:ring-2 focus:ring-[#0056b3]"
              />
            </div>

            {/* Google Drive Link */}
            <div>
              <label htmlFor="drive-post-url" className="block text-xs font-bold text-slate-700 mb-1.5">
                Google Drive Link (URL) <span className="text-[#dc2626]">*</span>
              </label>
              <input
                id="drive-post-url"
                type="url"
                required
                value={editingPost.driveLink}
                onChange={(e) => setEditingPost({ ...editingPost, driveLink: e.target.value })}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-[#0056b3]"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Make sure sharing permissions on Google Drive are set to &apos;Anyone with the link&apos; or restricted to enrolled candidate accounts.
              </p>
            </div>

            {/* Instructions */}
            <div>
              <label htmlFor="drive-post-instructions" className="block text-xs font-bold text-slate-700 mb-1.5">
                Exam Guidelines &amp; Instructions for Students
              </label>
              <textarea
                id="drive-post-instructions"
                rows={3}
                value={editingPost.instructions}
                onChange={(e) => setEditingPost({ ...editingPost, instructions: e.target.value })}
                placeholder="e.g. Download the 30-MCQ booklet, attempt in 30 minutes, submit your OMR response..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-xs focus:ring-2 focus:ring-[#0056b3]"
              />
            </div>

            {/* Enrolled Only Checkbox & Author */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingPost.isEnrolledOnly}
                  onChange={(e) => setEditingPost({ ...editingPost, isEnrolledOnly: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0056b3] border-slate-300"
                />
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  Restrict to Enrolled Students Only <Lock className="w-3.5 h-3.5 text-slate-600" />
                </span>
              </label>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Author Name / Department</label>
                <input
                  type="text"
                  value={editingPost.author}
                  onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium text-xs bg-white"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="drive-post-submit-btn"
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-extrabold cursor-pointer shadow-md inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Save &amp; Share Question Paper
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Subject Post Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletePostTarget}
        title="Delete Question Paper Post?"
        message={`Are you sure you want to remove "${deletePostTarget?.title}"? Enrolled students will no longer be able to access this Drive link.`}
        confirmLabel="Yes, Delete Post"
        onConfirm={() => {
          if (deletePostTarget) {
            deleteMockSubjectPost(deletePostTarget.id);
            setDeletePostTarget(null);
          }
        }}
        onCancel={() => setDeletePostTarget(null)}
      />
    </div>
  );
}
