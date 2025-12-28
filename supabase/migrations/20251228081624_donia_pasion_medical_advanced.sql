-- DONIA (pasion) - Medical Advanced schema
-- Safety: prescriptions are DRAFT only, require human validation.

-- 0) Extensions (safe)
create extension if not exists pgcrypto;

------------------------------------------------------------
-- 1) Patients
------------------------------------------------------------
create table if not exists public.pasion_patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  nom text not null,
  prenom text not null,
  date_naissance date not null,
  code_medical text,
  num_assurance text,
  created_at timestamptz not null default now()
);

alter table public.pasion_patients enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='pasion_patients' and policyname='pasion_patients_select_own'
  ) then
    create policy pasion_patients_select_own on public.pasion_patients
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='pasion_patients' and policyname='pasion_patients_insert_own'
  ) then
    create policy pasion_patients_insert_own on public.pasion_patients
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='pasion_patients' and policyname='pasion_patients_update_own'
  ) then
    create policy pasion_patients_update_own on public.pasion_patients
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end
$$;

------------------------------------------------------------
-- 2) Symptoms
------------------------------------------------------------
create table if not exists public.pasion_symptoms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  patient_id uuid not null references public.pasion_patients(id) on delete cascade,
  symptom text not null,
  severity smallint check (severity between 0 and 10),
  onset_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.pasion_symptoms enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='pasion_symptoms' and policyname='pasion_symptoms_select_own'
  ) then
    create policy pasion_symptoms_select_own on public.pasion_symptoms
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='pasion_symptoms' and policyname='pasion_symptoms_insert_own'
  ) then
    create policy pasion_symptoms_insert_own on public.pasion_symptoms
      for insert with check (auth.uid() = user_id);
  end if;
end
$$;

------------------------------------------------------------
-- 3) Vitals
------------------------------------------------------------
create table if not exists public.pasion_vitals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  patient_id uuid not null references public.pasion_patients(id) on delete cascade,
  measured_at timestamptz not null default now(),
  weight_kg numeric,
  height_cm numeric,
  temp_c numeric,
  sbp_mmHg numeric,
  dbp_mmHg numeric,
  hr_bpm numeric,
  rr_per_min numeric,
  spo2_pct numeric,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.pasion_vitals enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='pasion_vitals' and policyname='pasion_vitals_select_own'
  ) then
    create policy pasion_vitals_select_own on public.pasion_vitals
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='pasion_vitals' and policyname='pasion_vitals_insert_own'
  ) then
    create policy pasion_vitals_insert_own on public.pasion_vitals
      for insert with check (auth.uid() = user_id);
  end if;
end
$$;

------------------------------------------------------------
-- 4) Labs
------------------------------------------------------------
create table if not exists public.pasion_labs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  patient_id uuid not null references public.pasion_patients(id) on delete cascade,
  collected_at timestamptz not null default now(),
  panel text,
  results jsonb not null default '{}'::jsonb,
  lab_name text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.pasion_labs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='pasion_labs' and policyname='pasion_labs_select_own'
  ) then
    create policy pasion_labs_select_own on public.pasion_labs
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='pasion_labs' and policyname='pasion_labs_insert_own'
  ) then
    create policy pasion_labs_insert_own on public.pasion_labs
      for insert with check (auth.uid() = user_id);
  end if;
end
$$;

------------------------------------------------------------
-- 5) Imaging references
------------------------------------------------------------
create table if not exists public.pasion_imaging_refs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  patient_id uuid not null references public.pasion_patients(id) on delete cascade,
  modality text,
  performed_at timestamptz,
  facility text,
  report_text text,
  external_url text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.pasion_imaging_refs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='pasion_imaging_refs' and policyname='pasion_imaging_refs_select_own'
  ) then
    create policy pasion_imaging_refs_select_own on public.pasion_imaging_refs
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='pasion_imaging_refs' and policyname='pasion_imaging_refs_insert_own'
  ) then
    create policy pasion_imaging_refs_insert_own on public.pasion_imaging_refs
      for insert with check (auth.uid() = user_id);
  end if;
end
$$;

------------------------------------------------------------
-- 6) Prescription drafts
------------------------------------------------------------
create table if not exists public.pasion_prescription_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  patient_id uuid not null references public.pasion_patients(id) on delete cascade,
  country_code text,
  draft jsonb not null default '{}'::jsonb,
  ai_provider text,
  ai_request_id text,
  status text not null default 'draft' check (status in ('draft','validated','rejected')),
  validated_by text,
  validated_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.pasion_prescription_drafts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='pasion_prescription_drafts' and policyname='pasion_rx_select_own'
  ) then
    create policy pasion_rx_select_own on public.pasion_prescription_drafts
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='pasion_prescription_drafts' and policyname='pasion_rx_insert_own'
  ) then
    create policy pasion_rx_insert_own on public.pasion_prescription_drafts
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='pasion_prescription_drafts' and policyname='pasion_rx_update_own'
  ) then
    create policy pasion_rx_update_own on public.pasion_prescription_drafts
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end
$$;

------------------------------------------------------------
-- 7) Audit log
------------------------------------------------------------
create table if not exists public.pasion_medical_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action text not null, -- e.g. "CREATE_SYMPTOM", "SAVE_CALCULATOR_RUN", "CREATE_RX_DRAFT"
  entity text,          -- "pasion_symptoms" etc
  entity_id uuid,
  meta jsonb not null default '{}'::jsonb, -- safe metadata only
  created_at timestamptz not null default now()
);

alter table public.pasion_medical_audit_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='pasion_medical_audit_log' and policyname='pasion_audit_select_own'
  ) then
    create policy pasion_audit_select_own on public.pasion_medical_audit_log
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='pasion_medical_audit_log' and policyname='pasion_audit_insert_own'
  ) then
    create policy pasion_audit_insert_own on public.pasion_medical_audit_log
      for insert with check (auth.uid() = user_id);
  end if;
end
$$;
