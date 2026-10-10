-- Nural database schema. Run this in the SQL editor of a new Supabase project.
--
-- Nural signs each device in anonymously, so enable it first:
-- Authentication -> Sign In / Providers -> Allow anonymous sign-ins.
-- Every row belongs to the signed-in user, enforced by row-level security below.

-- One profile per user: onboarding answers that personalise readings and reflections
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  spiritual_preference text,
  learning_areas text[],
  knowledge_level text,
  biggest_challenge text,
  thirty_day_goal text,
  growth_meaning text,
  onboarding_completed boolean not null default false,
  last_interview_date timestamptz
);
create index profiles_user_id_idx on profiles (user_id);

-- The five readings prepared for a profile each day
create table sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  profile_id uuid not null references profiles (id) on delete cascade,
  category text not null,
  source_title text,
  reading_content text,
  completed boolean not null default false,
  completed_at timestamptz,
  session_date date not null default current_date
);
create index sessions_profile_date_idx on sessions (profile_id, session_date);

-- The reflection conversation that follows a reading
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id uuid not null references sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null
);
create index chat_messages_session_id_idx on chat_messages (session_id);

-- Streak and totals, one row per profile
create table streaks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles (id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  total_sessions integer not null default 0,
  total_reading_minutes integer not null default 0
);

-- Row-level security: a user can only see and change rows that belong to their own profile.
alter table profiles enable row level security;
alter table sessions enable row level security;
alter table chat_messages enable row level security;
alter table streaks enable row level security;

create policy "Users manage their own profile" on profiles
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users manage their own sessions" on sessions
  for all to authenticated
  using (exists (
    select 1 from profiles p
    where p.id = sessions.profile_id and p.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from profiles p
    where p.id = sessions.profile_id and p.user_id = (select auth.uid())
  ));

create policy "Users manage their own streak" on streaks
  for all to authenticated
  using (exists (
    select 1 from profiles p
    where p.id = streaks.profile_id and p.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from profiles p
    where p.id = streaks.profile_id and p.user_id = (select auth.uid())
  ));

create policy "Users manage their own chat messages" on chat_messages
  for all to authenticated
  using (exists (
    select 1 from sessions s
    join profiles p on p.id = s.profile_id
    where s.id = chat_messages.session_id and p.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from sessions s
    join profiles p on p.id = s.profile_id
    where s.id = chat_messages.session_id and p.user_id = (select auth.uid())
  ));
