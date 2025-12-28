-- DONIA seed: cnam_medications (OPTIMIZED BATCH)
-- Generated: 2025-12-28T09:24:07.3115621+01:00
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
commit;

