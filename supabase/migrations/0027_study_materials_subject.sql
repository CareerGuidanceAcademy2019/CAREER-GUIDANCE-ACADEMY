-- Add subject column to study_materials for competitive exam / subject categorization
alter table public.study_materials
  add column if not exists subject text default 'All Competitive Exams';

