-- DONIA (pasion) - Schéma médical complet (propre)
create extension if not exists pgcrypto;

-- Patients
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

DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_patients' AND policyname='pasion_patients_select_own'
  ) THEN
    CREATE POLICY pasion_patients_select_own ON public.pasion_patients
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_patients' AND policyname='pasion_patients_insert_own'
  ) THEN
    CREATE POLICY pasion_patients_insert_own ON public.pasion_patients
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_patients' AND policyname='pasion_patients_update_own'
  ) THEN
    CREATE POLICY pasion_patients_update_own ON public.pasion_patients
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END
$mig$;

-- Symptoms
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

DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_symptoms' AND policyname='pasion_symptoms_select_own'
  ) THEN
    CREATE POLICY pasion_symptoms_select_own ON public.pasion_symptoms
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_symptoms' AND policyname='pasion_symptoms_insert_own'
  ) THEN
    CREATE POLICY pasion_symptoms_insert_own ON public.pasion_symptoms
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END
$mig$;

-- Vitals
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

DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_vitals' AND policyname='pasion_vitals_select_own'
  ) THEN
    CREATE POLICY pasion_vitals_select_own ON public.pasion_vitals
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_vitals' AND policyname='pasion_vitals_insert_own'
  ) THEN
    CREATE POLICY pasion_vitals_insert_own ON public.pasion_vitals
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END
$mig$;

-- Labs
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

DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_labs' AND policyname='pasion_labs_select_own'
  ) THEN
    CREATE POLICY pasion_labs_select_own ON public.pasion_labs
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_labs' AND policyname='pasion_labs_insert_own'
  ) THEN
    CREATE POLICY pasion_labs_insert_own ON public.pasion_labs
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END
$mig$;

-- Imaging refs
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

DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_imaging_refs' AND policyname='pasion_imaging_refs_select_own'
  ) THEN
    CREATE POLICY pasion_imaging_refs_select_own ON public.pasion_imaging_refs
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_imaging_refs' AND policyname='pasion_imaging_refs_insert_own'
  ) THEN
    CREATE POLICY pasion_imaging_refs_insert_own ON public.pasion_imaging_refs
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END
$mig$;

-- Prescription drafts (DRAFT only)
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

DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_prescription_drafts' AND policyname='pasion_rx_select_own'
  ) THEN
    CREATE POLICY pasion_rx_select_own ON public.pasion_prescription_drafts
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_prescription_drafts' AND policyname='pasion_rx_insert_own'
  ) THEN
    CREATE POLICY pasion_rx_insert_own ON public.pasion_prescription_drafts
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_prescription_drafts' AND policyname='pasion_rx_update_own'
  ) THEN
    CREATE POLICY pasion_rx_update_own ON public.pasion_prescription_drafts
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END
$mig$;

-- Audit log
create table if not exists public.pasion_medical_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action text not null,
  entity text,
  entity_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.pasion_medical_audit_log enable row level security;

DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_medical_audit_log' AND policyname='pasion_audit_select_own'
  ) THEN
    CREATE POLICY pasion_audit_select_own ON public.pasion_medical_audit_log
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_medical_audit_log' AND policyname='pasion_audit_insert_own'
  ) THEN
    CREATE POLICY pasion_audit_insert_own ON public.pasion_medical_audit_log
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END
$mig$;

-- CNAM medications (TN)
create table if not exists public.cnam_medications (
  id uuid primary key default gen_random_uuid(),
  country_code text not null default 'TN',
  payer text not null default 'CNAM',
  code text,
  atc text,
  dci text not null,
  brand text,
  form text,
  strength text,
  reimbursable boolean default true,
  updated_at timestamptz not null default now()
);
alter table public.cnam_medications enable row level security;

DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='cnam_medications' AND policyname='cnam_meds_read'
  ) THEN
    CREATE POLICY cnam_meds_read ON public.cnam_medications
      FOR SELECT TO authenticated USING (true);
  END IF;
END
$mig$;

-- Patient chronic conditions
create table if not exists public.pasion_patient_conditions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  patient_id uuid not null references public.pasion_patients(id) on delete cascade,
  condition_code text not null,
  label text,
  is_chronic boolean not null default true,
  started_at date,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.pasion_patient_conditions enable row level security;

DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_patient_conditions' AND policyname='ppc_select_own'
  ) THEN
    CREATE POLICY ppc_select_own ON public.pasion_patient_conditions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_patient_conditions' AND policyname='ppc_insert_own'
  ) THEN
    CREATE POLICY ppc_insert_own ON public.pasion_patient_conditions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_patient_conditions' AND policyname='ppc_update_own'
  ) THEN
    CREATE POLICY ppc_update_own ON public.pasion_patient_conditions
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END
$mig$;

-- Prescriptions (final)
create table if not exists public.pasion_prescriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  patient_id uuid not null references public.pasion_patients(id) on delete cascade,
  country_code text not null default 'TN',
  payer text not null default 'CNAM',
  kind text not null default 'ordinary' check (kind in ('ordinary','chronic')),
  status text not null default 'draft' check (status in ('draft','validated','rejected')),
  prescriber_name text,
  prescriber_rpps text,
  notes text,
  created_at timestamptz not null default now(),
  validated_by text,
  validated_at timestamptz
);
alter table public.pasion_prescriptions enable row level security;

DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_prescriptions' AND policyname='rx_select_own'
  ) THEN
    CREATE POLICY rx_select_own ON public.pasion_prescriptions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_prescriptions' AND policyname='rx_insert_own'
  ) THEN
    CREATE POLICY rx_insert_own ON public.pasion_prescriptions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_prescriptions' AND policyname='rx_update_own'
  ) THEN
    CREATE POLICY rx_update_own ON public.pasion_prescriptions
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END
$mig$;

-- Prescription items
create table if not exists public.pasion_prescription_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  prescription_id uuid not null references public.pasion_prescriptions(id) on delete cascade,
  medication_id uuid references public.cnam_medications(id),
  dci text not null,
  dosage text,
  frequency text,
  duration_days integer,
  quantity integer,
  instructions text,
  created_at timestamptz not null default now()
);
alter table public.pasion_prescription_items enable row level security;

DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_prescription_items' AND policyname='rxi_select_own'
  ) THEN
    CREATE POLICY rxi_select_own ON public.pasion_prescription_items
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_prescription_items' AND policyname='rxi_insert_own'
  ) THEN
    CREATE POLICY rxi_insert_own ON public.pasion_prescription_items
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_prescription_items' AND policyname='rxi_update_own'
  ) THEN
    CREATE POLICY rxi_update_own ON public.pasion_prescription_items
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END
$mig$;

-- Renewal plans
create table if not exists public.pasion_renewal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  patient_id uuid not null references public.pasion_patients(id) on delete cascade,
  prescription_id uuid references public.pasion_prescriptions(id) on delete set null,
  next_appointment_at timestamptz,
  renewal_due_at timestamptz,
  lead_days integer default 7,
  status text not null default 'active' check (status in ('active','done','paused')),
  created_at timestamptz not null default now()
);
alter table public.pasion_renewal_plans enable row level security;

DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_renewal_plans' AND policyname='rp_select_own'
  ) THEN
    CREATE POLICY rp_select_own ON public.pasion_renewal_plans
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_renewal_plans' AND policyname='rp_insert_own'
  ) THEN
    CREATE POLICY rp_insert_own ON public.pasion_renewal_plans
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='pasion_renewal_plans' AND policyname='rp_update_own'
  ) THEN
    CREATE POLICY rp_update_own ON public.pasion_renewal_plans
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END
$mig$;
