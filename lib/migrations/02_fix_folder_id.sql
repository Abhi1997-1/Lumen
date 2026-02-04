-- Run this to ensure the folder_id column exists
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name = 'meetings' and column_name = 'folder_id') then
        alter table public.meetings add column folder_id uuid references public.folders(id) on delete set null;
    end if;
end $$;
