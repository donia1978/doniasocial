-- DONIA: Email delivery for notifications (non-breaking, best-effort)
-- If public.notifications exists, add fields. Otherwise create a minimal notifications table.

do supabase\migrations\${ts}_donia_notifications_email_delivery.sql begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='notifications'
  ) then
    create table public.notifications (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null,
      type text not null,
      title text not null,
      message text not null,
      created_at timestamptz not null default now(),
      read_at timestamptz,
      -- email delivery
      email_to text,
      email_status text not null default 'pending' check (email_status in ('pending','sent','failed','skipped')),
      email_last_error text,
      email_sent_at timestamptz
    );
    alter table public.notifications enable row level security;

    -- basic RLS: owner can read/write own notifications
    create policy notif_select_own on public.notifications for select using (auth.uid() = user_id);
    create policy notif_insert_own on public.notifications for insert with check (auth.uid() = user_id);
    create policy notif_update_own on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  else
    -- add columns if missing
    begin
      alter table public.notifications add column if not exists email_to text;
      alter table public.notifications add column if not exists email_status text not null default 'pending';
      alter table public.notifications add column if not exists email_last_error text;
      alter table public.notifications add column if not exists email_sent_at timestamptz;
      -- add constraint if not exists (guard)
      begin
        alter table public.notifications
          add constraint notifications_email_status_check
          check (email_status in ('pending','sent','failed','skipped'));
      exception when duplicate_object then
        -- ignore
      end;
    end;
  end if;
end supabase\migrations\${ts}_donia_notifications_email_delivery.sql;

create index if not exists notifications_email_pending_idx
  on public.notifications(email_status, created_at);
