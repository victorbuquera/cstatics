-- CS2 Tactics System — Migration completa
-- Execute no SQL Editor do Supabase Dashboard

-- Habilitar extensão UUID
create extension if not exists "pgcrypto";

-- ==============================
-- TABELAS
-- ==============================

create table maps (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null
);

create table tactics (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  map_id      uuid references maps(id),
  side        text check (side in ('CT', 'TR')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table tactic_phases (
  id          uuid primary key default gen_random_uuid(),
  tactic_id   uuid references tactics(id) on delete cascade,
  name        text not null,
  order_index integer default 0
);

create table tactic_elements (
  id          uuid primary key default gen_random_uuid(),
  tactic_id   uuid references tactics(id) on delete cascade,
  phase_id    uuid references tactic_phases(id) on delete set null,
  type        text not null check (type in ('player', 'route', 'grenade', 'text')),
  data        jsonb not null,
  order_index integer default 0
);

create table element_comments (
  id          uuid primary key default gen_random_uuid(),
  element_id  uuid references tactic_elements(id) on delete cascade,
  author_name text not null,
  text        text not null,
  created_at  timestamptz default now()
);

-- ==============================
-- TRIGGER: updated_at em tactics
-- ==============================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tactics_updated_at
  before update on tactics
  for each row execute function update_updated_at();

-- ==============================
-- ÍNDICES
-- ==============================

create index on tactic_elements (tactic_id);
create index on tactic_elements (phase_id);
create index on tactic_phases (tactic_id);
create index on element_comments (element_id);

-- ==============================
-- ROW LEVEL SECURITY (acesso público por ora)
-- ==============================

alter table maps enable row level security;
alter table tactics enable row level security;
alter table tactic_phases enable row level security;
alter table tactic_elements enable row level security;
alter table element_comments enable row level security;

create policy "public_read_maps" on maps for select using (true);

create policy "public_read_tactics" on tactics for select using (true);
create policy "public_insert_tactics" on tactics for insert with check (true);
create policy "public_update_tactics" on tactics for update using (true);
create policy "public_delete_tactics" on tactics for delete using (true);

create policy "public_read_phases" on tactic_phases for select using (true);
create policy "public_insert_phases" on tactic_phases for insert with check (true);
create policy "public_update_phases" on tactic_phases for update using (true);
create policy "public_delete_phases" on tactic_phases for delete using (true);

create policy "public_read_elements" on tactic_elements for select using (true);
create policy "public_insert_elements" on tactic_elements for insert with check (true);
create policy "public_update_elements" on tactic_elements for update using (true);
create policy "public_delete_elements" on tactic_elements for delete using (true);

create policy "public_read_comments" on element_comments for select using (true);
create policy "public_insert_comments" on element_comments for insert with check (true);
create policy "public_delete_comments" on element_comments for delete using (true);

-- ==============================
-- REALTIME: habilitar para colaboração
-- ==============================

alter publication supabase_realtime add table tactic_elements;
alter publication supabase_realtime add table tactic_phases;
alter publication supabase_realtime add table element_comments;

-- ==============================
-- SEED: 3 mapas iniciais
-- ==============================

insert into maps (name, slug) values
  ('Dust2',   'dust2'),
  ('Inferno', 'inferno'),
  ('Mirage',  'mirage');
