// Optional: loads the sample catalogue (site content, faculty, courses, toppers, materials,
// mock tests, announcements) into Supabase. Students/fees are NOT seeded (they need real accounts).
// Usage:  node --env-file=.env.local scripts/seed.mjs
import { createClient } from '@supabase/supabase-js';
import { INITIAL_SEED_DATA as d } from '../src/data/initialSeedData.ts';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
const sb = createClient(url, key, { auth: { persistSession: false } });

const iso = (v) => {
  const t = new Date(v);
  return Number.isNaN(t.getTime()) ? new Date().toISOString().slice(0, 10) : t.toISOString().slice(0, 10);
};
const must = async (label, p) => {
  const { error } = await p;
  if (error) throw new Error(`${label}: ${error.message}`);
  console.log('seeded', label);
};

await must('site_content', sb.from('site_content').upsert({ id: 1, content: d.siteContent }));
if (d.faculty.length > 0) {
  await must('faculty', sb.from('faculty').upsert(d.faculty.map((f) => ({
    id: f.id, name: f.name, designation: f.designation || null, subject: f.subject, qualification: f.qualification,
    experience: f.experience, photo: f.photo, bio: f.bio, specialization_tags: f.specializationTags,
  }))));
} else {
  console.log('faculty: 0 records (cleared for real data)');
}

if (d.courses.length > 0) {
  await must('courses', sb.from('courses').upsert(d.courses.map((c) => ({
    id: c.id, name: c.name, category: c.category, sub_category: c.subCategory,
    board: c.board ?? null, class_level: c.classLevel ?? null, description: c.description,
    syllabus_highlights: c.syllabusHighlights, price: c.price,
    instalment_available: c.instalmentAvailable, first_instalment: c.firstInstalment,
    faculty_id: c.facultyId || null, batch_name: c.batchName, batch_size: c.batchSize,
    seats_available: c.seatsAvailable, waiting_list_count: c.waitingListCount,
    duration: c.duration, start_date: c.startDate, schedule: c.schedule,
    status: c.status, featured: !!c.featured,
  }))));
} else {
  console.log('courses: 0 records (cleared for real data)');
}
await must('achievements', sb.from('achievements').upsert(d.achievements.map((a) => ({ ...a }))));
await must('study_materials', sb.from('study_materials').upsert(d.studyMaterials.map((m) => ({
  id: m.id, title: m.title, course_id: m.courseId, type: m.type, author: m.author,
  pages: m.pages, file_size: m.fileSize, uploaded_date: iso(m.uploadedDate),
  description: m.description, preview_sections: m.previewSections,
}))));
await must('mock_tests', sb.from('mock_tests').upsert(d.mockTests.map((t) => ({
  id: t.id, title: t.title, course_id: t.courseId, batch_name: t.batchName,
  duration_minutes: t.durationMinutes, total_marks: t.totalMarks,
  marks_per_question: t.marksPerQuestion, negative_marking: t.negativeMarking,
  scheduled_date: t.scheduledDate, status: t.status, questions: t.questions,
}))));
await must('announcements', sb.from('announcements').upsert(d.announcements.map((a) => ({
  id: a.id, title: a.title, content: a.content, target_batch: a.targetBatch,
  target_label: a.targetLabel, priority: a.priority, date: iso(a.date), author: a.author,
}))));
console.log('Done.');
