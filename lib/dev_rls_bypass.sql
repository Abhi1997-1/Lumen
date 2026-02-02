-- RUN THIS IN SUPABASE SQL EDITOR TO FIX RLS ERRORS

-- 1. Enable RLS (Should already be enabled, but just in case)
alter table meetings enable row level security;
alter table user_settings enable row level security;

-- 2. Create permissive policies for 'meetings' table
-- This allows ANYONE to insert/select/update/delete.
-- Only safe for local development/prototyping.

create policy "Dev: Public Access to Meetings"
on meetings
for all
using (true)
with check (true);

-- 3. Create permissive policies for 'user_settings' table
create policy "Dev: Public Access to Settings"
on user_settings
for all
using (true)
with check (true);

-- 4. Create permissive policies for Storage 'meetings' bucket
create policy "Dev: Public Access to Storage"
on storage.objects
for all
using ( bucket_id = 'meetings' )
with check ( bucket_id = 'meetings' );

-- NOTE: If you still get errors, you might need to temporarily DISABLE RLS:
-- alter table meetings disable row level security;
-- alter table user_settings disable row level security;
