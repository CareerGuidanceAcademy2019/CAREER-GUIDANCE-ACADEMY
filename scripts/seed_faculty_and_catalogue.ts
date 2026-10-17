import { createClient } from '@supabase/supabase-js';
import { INITIAL_SEED_DATA as d } from '../src/data/initialSeedData';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://craicxwqaygdydtdaxtw.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!key) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

async function seed() {
  console.log(`Seeding ${d.faculty.length} faculty members...`);
  const { error: facError } = await sb.from('faculty').upsert(
    d.faculty.map((f) => ({
      id: f.id,
      name: f.name,
      designation: f.designation || null,
      subject: f.subject,
      qualification: f.qualification,
      experience: f.experience,
      photo: f.photo,
      bio: f.bio,
      specialization_tags: f.specializationTags,
      approval_status: 'Approved',
    }))
  );

  if (facError) {
    console.error('Faculty seed error:', facError);
  } else {
    console.log(`✅ ${d.faculty.length} faculty members seeded successfully!`);
  }

  console.log(`Seeding ${d.achievements.length} achievements...`);
  const { error: achError } = await sb.from('achievements').upsert(
    d.achievements.map((a) => ({
      id: a.id,
      name: a.name,
      exam: a.exam,
      rank: a.rank,
      year: a.year,
      photo: a.photo,
      quote: a.quote || '',
      category: a.category || '',
    }))
  );

  if (achError) {
    console.error('Achievements seed error:', achError);
  } else {
    console.log(`✅ ${d.achievements.length} achievements seeded successfully!`);
  }

  console.log(`Seeding ${d.announcements.length} announcements...`);
  const { error: annError } = await sb.from('announcements').upsert(
    d.announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      target_batch: a.targetBatch,
      target_label: a.targetLabel,
      priority: a.priority,
      date: new Date(a.date).toISOString().split('T')[0],
      author: a.author,
    }))
  );

  if (annError) {
    console.error('Announcements seed error:', annError);
  } else {
    console.log(`✅ ${d.announcements.length} announcements seeded successfully!`);
  }
}

seed().catch(console.error);
