-- DONIA: Medical Scheduler Core
-- Creates minimal tables for scheduling notifications for appointments + renewals.
-- Non-breaking: creates only if not exists.

create extension if not exists pgcrypto;

-- Patients (minimal)
create table if not exists public.pasion_patients (
  id uuid primary key default gen_random_uuid(),
  patient_code text unique,               -- ex: PAT-0001 (optional)
  full_name text,
  email text,
  phone text,
  country_code text not null default 'TN',
  cnam_id text,
  chronic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Medical appointments
create table if not exists public.medical_appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.pasion_patients(id) on delete cascade,
  doctor_name text,
  doctor_email text,
  clinic_name text,
  appointment_at timestamptz not null,
  reason text,
  status text not null default 'scheduled' check (status in ('scheduled','cancelled','done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists medical_appointments_at_idx on public.medical_appointments(appointment_at);
create index if not exists medical_appointments_status_idx on public.medical_appointments(status);

-- Medication renewals
create table if not exists public.medical_renewals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.pasion_patients(id) on delete cascade,
  medication_dci text not null,
  payer text not null default 'CNAM',
  last_dispense_at date,
  dispense_days int not null default 30,
  next_renewal_date date generated always as (
    case
      when last_dispense_at is null then null
      else (last_dispense_at + (dispense_days || ' days')::interval)::date
    end
  ) stored,
  -- appointment recommendation offset (default 7 days before next renewal)
  appointment_offset_days int not null default 7,
  status text not null default 'active' check (status in ('active','paused','stopped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists medical_renewals_next_idx on public.medical_renewals(next_renewal_date);
create index if not exists medical_renewals_status_idx on public.medical_renewals(status);

-- Notification dedup table (idempotency)
create table if not exists public.notification_dedup (
  id uuid primary key default gen_random_uuid(),
  dedup_key text not null unique,
  notification_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists notification_dedup_created_idx on public.notification_dedup(created_at);

-- RLS (basic) - enable if you want; for now scheduler uses service role (server-side).
alter table public.pasion_patients enable row level security;
alter table public.medical_appointments enable row level security;
alter table public.medical_renewals enable row level security;
alter table public.notification_dedup enable row level security;

-- Minimal policies (optional). Keep permissive off by default.
-- NOTE: For production you should tailor these; scheduler uses service role bypass.

