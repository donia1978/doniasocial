-- DONIA: audit log for medical calculator runs (pasion)
create table if not exists public.medical_calculator_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  calculator_id text not null,
  calculator_version text not null,
  specialty text not null,
  input jsonb not null,
  output jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.medical_calculator_runs enable row level security;

do .\supabase\migrations\${ts}_donia_medical_calculators_audit.sql begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='medical_calculator_runs' and policyname='medical_calculator_runs_select_own') then
    create policy medical_calculator_runs_select_own on public.medical_calculator_runs
      for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='medical_calculator_runs' and policyname='medical_calculator_runs_insert_own') then
    create policy medical_calculator_runs_insert_own on public.medical_calculator_runs
      for insert with check (auth.uid() = user_id);
  end if;
end .\supabase\migrations\${ts}_donia_medical_calculators_audit.sql;
