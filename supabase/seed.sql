-- ═══════════════════════════════════════════════════════════════════════
-- Guardian Angel AI — Seed data (demo)
-- Run AFTER schema.sql. Safe to re-run (idempotent on agency name).
--
-- NOTE: Demo USER accounts are created by signing up through the app
-- (so they get proper auth.users + password). See README "Demo accounts".
-- This seed only fills the public agencies directory used by "Nearby Help".
-- ═══════════════════════════════════════════════════════════════════════

insert into public.agencies (name, type, phone, latitude, longitude, address)
values
  ('St. Jude Emergency Center',        'Hospital',             '+91 44 9110 3829', 13.0805, 80.2730, 'Periamet, Chennai, Tamil Nadu 600003'),
  ('17th Precinct Police Station',     'Police Station',       '+91 44 9110 9988', 13.0630, 80.2520, 'Egmore, Chennai, Tamil Nadu 600008'),
  ('Municipal Child Welfare Office',   'Child Welfare Office', '+91 44 9110 4433', 13.0450, 80.2600, 'Mylapore, Chennai, Tamil Nadu 600004'),
  ('Hope Family Foundation',           'NGO Shelter',          '+91 44 9110 0011', 13.0850, 80.2100, 'Anna Nagar, Chennai, Tamil Nadu 600040'),
  ('Bellevue Pediatric Trauma',        'Hospital',             '+91 44 9110 7766', 13.0100, 80.2000, 'Guindy, Chennai, Tamil Nadu 600032'),
  ('Midtown South Precinct',           'Police Station',       '+91 44 9110 2200', 13.0900, 80.2800, 'Royapuram, Chennai, Tamil Nadu 600013')
on conflict do nothing;
