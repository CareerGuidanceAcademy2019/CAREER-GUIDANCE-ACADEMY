-- Career Guidance Academy: Comprehensive Mock Test Series Packages Migration
-- Seeds all specialized mock test series packages across TRBT TET, STGT, TPSC, TCS/TPS, Banking/SSC & School Wings.

INSERT INTO public.mock_series (id, slug, name, class_range, stream, price, batch_label, description, status, starts_on)
VALUES
  ('series-stgt-soc', 'trbt-stgt-social-science', 'TRBT STGT (Social Science) Daily Online Mock Tests Series', 'Graduate Teachers (Secondary)', 'Social Science', 499, '2026 Batch', 'Daily Online Mock Tests for TRBT STGT Social Science.', 'Open', 'Flexible / Admin Scheduled'),
  ('series-stgt-pure-sci', 'trbt-stgt-pure-science', 'TRBT STGT (Pure Science) Daily Online Mock Tests Series', 'Graduate Teachers (Secondary)', 'Pure Science (PCM)', 499, '2026 Batch', 'Daily Online Mock Tests for TRBT STGT Pure Science (Physics, Chemistry, Maths).', 'Open', 'Flexible / Admin Scheduled'),
  ('series-stgt-bio-sci', 'trbt-stgt-biological-science', 'TRBT STGT (Biological Science) Daily Online Mock Tests Series', 'Graduate Teachers (Secondary)', 'Biological Science (CBZ)', 499, '2026 Batch', 'Daily Online Mock Tests for TRBT STGT Biological Science (Botany, Zoology, Physiology).', 'Open', 'Flexible / Admin Scheduled'),
  ('series-tpsc-combined', 'tpsc-combined-jrbt', 'TPSC Combined Services & JRBT Mock Tests Series', 'Graduates & 10+2', 'Civil & General Recruitment', 499, '2026 Batch', 'Comprehensive Mock Tests Series for TPSC Combined & JRBT Group C/D.', 'Open', 'Flexible / Admin Scheduled'),
  ('series-tcs-tps', 'tcs-tps-officers', 'TCS / TPS Civil & Police Services Mock Tests Series', 'Graduates', 'State Civil & Police Services', 599, '2026 Batch', 'Simulated Prelims & Mains Mock Tests for TCS / TPS Officers Batch.', 'Open', 'Flexible / Admin Scheduled'),
  ('series-banking-ssc', 'banking-ibps-ssc-railway', 'Central Competitive (Banking IBPS/SBI, SSC & Railway) Mock Series', 'Graduates & 10+2', 'Banking, SSC & Railway', 399, '2026 Batch', 'Speed tests & full-length simulations for Banking, SSC and Railways.', 'Open', 'Flexible / Admin Scheduled'),
  ('series-school-foundation', 'school-board-foundation', 'TBSE & CBSE School Board Mock Tests Series (Classes VII - X)', 'Classes VII to X', 'School Board Foundation', 299, '2026 Batch', 'Chapter-wise and term-end simulated tests for TBSE and CBSE students.', 'Open', 'Flexible / Admin Scheduled')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  price = EXCLUDED.price;
