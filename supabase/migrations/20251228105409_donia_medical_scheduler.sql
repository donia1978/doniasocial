-- DONIA: Medical Scheduler Core (PowerShell generated)
create extension if not exists pgcrypto;

-- Patients
create table if not exists public.pasion_patients (
  id uuid primary key default gen_random_uuid(),
  patient_code text unique,
  full_name text,
  email text,
  phone text,
  country_code text not null default 'TN',
  cnam_id text,
  chronic boolean not null default false,
  user_id uuid unique, -- link to auth.uid()
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

-- Medical renewals
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
      else (last_dispense_at + make_interval(days => dispense_days))::date
    end
  ) stored,
  appointment_offset_days int not null default 7,
  status text not null default 'active' check (status in ('active','paused','stopped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists medical_renewals_next_idx on public.medical_renewals(next_renewal_date);
create index if not exists medical_renewals_status_idx on public.medical_renewals(status);

-- Notification dedup
create table if not exists public.notification_dedup (
  id uuid primary key default gen_random_uuid(),
  dedup_key text not null unique,
  notification_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists notification_dedup_created_idx on public.notification_dedup(created_at);

-- Enable RLS
alter table public.pasion_patients enable row level security;
alter table public.medical_appointments enable row level security;
alter table public.medical_renewals enable row level security;
alter table public.notification_dedup enable row level security;

-- Policies
do cls
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='pasion_patients') then
    create policy patient_select_own on public.pasion_patients for select using (auth.uid() = user_id);
    create policy patient_update_own on public.pasion_patients for update using (auth.uid() = user_id);
  end if;
end cls;

do cls
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='medical_appointments') then
    create policy appointment_select_own on public.medical_appointments
      for select using (patient_id in (select id from public.pasion_patients where user_id = auth.uid()));
    create policy appointment_update_own on public.medical_appointments
      for update using (patient_id in (select id from public.pasion_patients where user_id = auth.uid()));
  end if;
end cls;

do cls
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='medical_renewals') then
    create policy renewal_select_own on public.medical_renewals
      for select using (patient_id in (select id from public.pasion_patients where user_id = auth.uid()));
    create policy renewal_update_own on public.medical_renewals
      for update using (patient_id in (select id from public.pasion_patients where user_id = auth.uid()));
  end if;
end cls;

do cls
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notification_dedup') then
    create policy dedup_service_only on public.notification_dedup
      for all using (auth.role() = 'service_role');
  end if;
end cls;
