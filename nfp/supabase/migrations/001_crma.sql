-- ═══════════════════════════════════════════════════════════════
-- CRMA — CRM Unificado Synemusic
-- Schema para Supabase (PostgreSQL 15+)
-- ═══════════════════════════════════════════════════════════════

-- 1. PROFILES (estende auth.users)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  avatar_url  text,
  plan        text not null default 'free' check (plan in ('free','booklet','pro','institutional')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Usuário vê próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuário atualiza próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. CONSENT RECORDS (LGPD)
create table public.consent_records (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  granted_at  timestamptz not null default now(),
  ip_hash     text,
  version     text not null,
  consents    text[] not null,
  created_at  timestamptz not null default now()
);

alter table public.consent_records enable row level security;

create policy "Usuário vê próprios registros de consentimento"
  on public.consent_records for select
  using (auth.uid() = user_id);

create policy "Usuário insere próprio consentimento"
  on public.consent_records for insert
  with check (auth.uid() = user_id);

-- 3. LEADS (capturados por lead magnets)
create table public.leads (
  id          bigint generated always as identity primary key,
  email       text not null,
  name        text,
  source      text not null,
  source_detail text,
  booklet_slug text,
  consented   boolean not null default false,
  ip_hash     text,
  created_at  timestamptz not null default now()
);

alter table public.leads enable row level security;

create policy "Admin lê leads"
  on public.leads for select
  using (auth.role() = 'authenticated');

create policy "Inserção anônima de lead"
  on public.leads for insert
  with check (true);

-- 4. STUDENTS (alunos de cursos/presenciais)
create table public.students (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id) on delete set null,
  name        text not null,
  email       text not null,
  phone       text,
  age_group   text check (age_group in ('5-12','13-17','18+')),
  source      text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.students enable row level security;

create policy "Admin vê alunos"
  on public.students for select
  using (auth.role() = 'authenticated');

create policy "Admin insere alunos"
  on public.students for insert
  with check (auth.role() = 'authenticated');

-- 5. BOOKLET DOWNLOADS (rastreio de downloads)
create table public.booklet_downloads (
  id          bigint generated always as identity primary key,
  lead_id     bigint references public.leads(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  booklet_slug text not null,
  downloaded_at timestamptz not null default now(),
  ip_hash     text
);

alter table public.booklet_downloads enable row level security;

create policy "Admin lê downloads"
  on public.booklet_downloads for select
  using (auth.role() = 'authenticated');

create policy "Inserção anônima de download"
  on public.booklet_downloads for insert
  with check (true);

-- 6. CAMPAIGNS (campanhas de marketing)
create table public.campaigns (
  id          bigint generated always as identity primary key,
  slug        text unique not null,
  title       text not null,
  pillar      text,
  content     text,
  status      text not null default 'draft' check (status in ('draft','active','paused','archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.campaigns enable row level security;

create policy "Admin gerencia campanhas"
  on public.campaigns for all
  using (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- Auto-cria profile ao cadastrar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, plan)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    'free'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atualiza updated_at automaticamente
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger set_students_updated_at
  before update on public.students
  for each row execute function public.update_updated_at();

create trigger set_campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.update_updated_at();
