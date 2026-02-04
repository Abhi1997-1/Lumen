-- Create integrations table
create table if not exists public.integrations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text not null check (provider in ('notion', 'onenote')),
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  workspace_name text,
  workspace_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

-- RLS
alter table public.integrations enable row level security;

create policy "Users can view own integrations"
  on public.integrations for select
  using (auth.uid() = user_id);

create policy "Users can insert own integrations"
  on public.integrations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own integrations"
  on public.integrations for update
  using (auth.uid() = user_id);

create policy "Users can delete own integrations"
  on public.integrations for delete
  using (auth.uid() = user_id);
