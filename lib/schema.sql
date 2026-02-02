-- Create Meetings Table
create table if not exists meetings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text Default 'Untitled Meeting',
  audio_url text,
  transcript text,
  summary text,
  action_items jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create User Settings Table
create table if not exists user_settings (
  user_id uuid references auth.users primary key,
  gemini_api_key text, -- Will be stored encrypted by the app
  notion_access_token text,
  onenote_access_token text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table meetings enable row level security;
alter table user_settings enable row level security;

-- Policies for Meetings
drop policy if exists "Users can view their own meetings" on meetings;
create policy "Users can view their own meetings" 
  on meetings for select 
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own meetings" on meetings;
create policy "Users can insert their own meetings" 
  on meetings for insert 
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own meetings" on meetings;
create policy "Users can update their own meetings" 
  on meetings for update 
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own meetings" on meetings;
create policy "Users can delete their own meetings" 
  on meetings for delete 
  using (auth.uid() = user_id);

-- Policies for User Settings
drop policy if exists "Users can view their own settings" on user_settings;
create policy "Users can view their own settings" 
  on user_settings for select 
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own settings" on user_settings;
create policy "Users can insert their own settings" 
  on user_settings for insert 
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own settings" on user_settings;
create policy "Users can update their own settings" 
  on user_settings for update 
  using (auth.uid() = user_id);

-- Storage (if not using Dashboard)
insert into storage.buckets (id, name, public) values ('meetings', 'meetings', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload meeting audio" on storage.objects;
create policy "Users can upload meeting audio"
  on storage.objects for insert
  with check ( bucket_id = 'meetings' and auth.uid() = owner );

drop policy if exists "Users can view meeting audio" on storage.objects;
create policy "Users can view meeting audio"
  on storage.objects for select
  using ( bucket_id = 'meetings' and auth.uid() = owner );
