-- DONIA seed: cnam_medications (carved from CNAM VEI XLS)
begin;
create extension if not exists pgcrypto;
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
create unique index if not exists cnam_meds_uniq on public.cnam_medications(country_code,payer,dci);
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','-- DONIA: Research Core + Stats + Medical Scheduling (foundation)',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','-- Safe to re-run: uses IF NOT EXISTS patterns where possible.',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','-- ---------- Research Core ----------',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','create table if not exists public.research_documents (',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  id uuid primary key default gen_random_uuid(),',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  user_id uuid not null,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  title text not null,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  content text not null,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  tags text[] default ''{}''::text[],',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  source_url text,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  source_license text,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  created_at timestamptz not null default now()',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM',');',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','-- Enable RLS',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','alter table public.research_documents enable row level security;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','-- Policies (owner only)',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  if not exists (select 1 from pg_policies where schemaname=''public'' and tablename=''research_documents'' and policyname=''research_documents_select_own'') then',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','    create policy research_documents_select_own on public.research_documents',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','      for select using (auth.uid() = user_id);',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  end if;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  if not exists (select 1 from pg_policies where schemaname=''public'' and tablename=''research_documents'' and policyname=''research_documents_insert_own'') then',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','    create policy research_documents_insert_own on public.research_documents',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','      for insert with check (auth.uid() = user_id);',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  end if;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  if not exists (select 1 from pg_policies where schemaname=''public'' and tablename=''research_documents'' and policyname=''research_documents_update_own'') then',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','    create policy research_documents_update_own on public.research_documents',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  end if;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  if not exists (select 1 from pg_policies where schemaname=''public'' and tablename=''research_documents'' and policyname=''research_documents_delete_own'') then',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','    create policy research_documents_delete_own on public.research_documents',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','      for delete using (auth.uid() = user_id);',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  end if;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','-- ---------- Stats (opinions + results) ----------',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','create table if not exists public.member_opinions (',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  id uuid primary key default gen_random_uuid(),',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  user_id uuid not null,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  topic text not null,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  score numeric not null check (score >= 0 and score <= 100),',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  country text,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  created_at timestamptz not null default now()',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM',');',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','create table if not exists public.stats_results (',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  id uuid primary key default gen_random_uuid(),',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  user_id uuid not null,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  topic text not null,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  n int not null,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  mean numeric not null,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  variance numeric not null,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  stddev numeric not null,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  created_at timestamptz not null default now()',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM',');',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','alter table public.member_opinions enable row level security;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','alter table public.stats_results enable row level security;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  if not exists (select 1 from pg_policies where schemaname=''public'' and tablename=''member_opinions'' and policyname=''member_opinions_select_own'') then',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','    create policy member_opinions_select_own on public.member_opinions',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','      for select using (auth.uid() = user_id);',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  end if;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  if not exists (select 1 from pg_policies where schemaname=''public'' and tablename=''member_opinions'' and policyname=''member_opinions_insert_own'') then',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','    create policy member_opinions_insert_own on public.member_opinions',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','      for insert with check (auth.uid() = user_id);',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  end if;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  if not exists (select 1 from pg_policies where schemaname=''public'' and tablename=''stats_results'' and policyname=''stats_results_select_own'') then',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','    create policy stats_results_select_own on public.stats_results',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','      for select using (auth.uid() = user_id);',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  end if;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  if not exists (select 1 from pg_policies where schemaname=''public'' and tablename=''stats_results'' and policyname=''stats_results_insert_own'') then',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','    create policy stats_results_insert_own on public.stats_results',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','      for insert with check (auth.uid() = user_id);',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  end if;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','-- ---------- Medical (pasion) ----------',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','create table if not exists public.pasion_patients (',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  id uuid primary key default gen_random_uuid(),',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  user_id uuid not null,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  nom text not null,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  prenom text not null,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  date_naissance date not null,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  code_medical text,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  num_assurance text,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  created_at timestamptz not null default now()',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM',');',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','create table if not exists public.medical_appointments (',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  id uuid primary key default gen_random_uuid(),',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  patient_id uuid not null references public.pasion_patients(id) on delete cascade,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  user_id uuid not null,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  doctor_name text not null,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  doctor_contact text,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  starts_at timestamptz not null,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  ends_at timestamptz not null,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  status text not null default ''scheduled'',',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  notes text,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  created_at timestamptz not null default now(),',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  check (ends_at > starts_at)',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM',');',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','alter table public.pasion_patients enable row level security;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','alter table public.medical_appointments enable row level security;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  if not exists (select 1 from pg_policies where schemaname=''public'' and tablename=''pasion_patients'' and policyname=''pasion_patients_select_own'') then',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','    create policy pasion_patients_select_own on public.pasion_patients',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','      for select using (auth.uid() = user_id);',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  end if;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  if not exists (select 1 from pg_policies where schemaname=''public'' and tablename=''pasion_patients'' and policyname=''pasion_patients_insert_own'') then',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','    create policy pasion_patients_insert_own on public.pasion_patients',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','      for insert with check (auth.uid() = user_id);',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  end if;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  if not exists (select 1 from pg_policies where schemaname=''public'' and tablename=''medical_appointments'' and policyname=''medical_appointments_select_own'') then',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','    create policy medical_appointments_select_own on public.medical_appointments',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','      for select using (auth.uid() = user_id);',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  end if;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  if not exists (select 1 from pg_policies where schemaname=''public'' and tablename=''medical_appointments'' and policyname=''medical_appointments_insert_own'') then',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','    create policy medical_appointments_insert_own on public.medical_appointments',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','      for insert with check (auth.uid() = user_id);',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  end if;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  if not exists (select 1 from pg_policies where schemaname=''public'' and tablename=''medical_appointments'' and policyname=''medical_appointments_update_own'') then',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','    create policy medical_appointments_update_own on public.medical_appointments',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  end if;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','-- ---------- Notifications automation (appointment insert) ----------',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','-- Assumes public.notifications already exists (it does in your project).',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','create or replace function public.notify_on_appointment()',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','begin',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  insert into public.notifications (user_id, title, message, type, is_read)',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  values (',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','    new.user_id,',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','    ''Rendez-vous médical'',',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','    ''Nouveau rendez-vous avec '' || new.doctor_name || '' le '' || to_char(new.starts_at, ''YYYY-MM-DD HH24:MI''),',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','    ''info'',',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','    false',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  );',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','  return new;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','drop trigger if exists trg_notify_on_appointment on public.medical_appointments;',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','create trigger trg_notify_on_appointment',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','after insert on public.medical_appointments',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','for each row execute function public.notify_on_appointment();',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM','',true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
commit;

