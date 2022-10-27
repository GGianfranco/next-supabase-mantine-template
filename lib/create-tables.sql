-- Run this script on Supabase web platform's SQL editor to create the tables.
-- Create a table for Public Foods
create table foods (
    id serial not null,
    user_id uuid references auth.users not null,
    updated_at timestamp with time zone,
    name text not null,
    description text,
    image_url text,
    rating integer,
    is_public boolean not null default false,
    primary key (id),
    unique(name),
    constraint name_length check (char_length(name) <= 20)
);

alter table
    foods enable row level security;

-- Set up Policies
create policy "Private foods are viewable by owner only." on foods for
select
    using (auth.uid() = user_id);

create policy "Public foods are viewable by everyone." on foods for
select
    using (is_public = true);

create policy "Users can insert their own food." on foods for
insert
    with check (auth.uid() = user_id);

create policy "Users can update own food." on foods for
update
    using (auth.uid() = user_id);

-- Set up Realtime!
alter publication supabase_realtime
add
    table foods;

-- Create a table for api_usage_records
create table api_usage_records (
    id serial not null,
    called_by uuid references auth.users not null,
    called_at timestamp with time zone not null default now(),
    api_name text not null
);

-- Create a table for Public Profiles
create table profiles (
    id uuid references auth.users not null,
    updated_at timestamp with time zone,
    username text unique,
    email text unique not null,
    avatar_url text,
    website text,
    primary key (id),
    unique(username),
    constraint username_length check (char_length(username) >= 3)
);

alter table
    profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles for
select
    using (true);

create policy "Users can insert their own profile." on profiles for
insert
    with check (auth.uid() = id);

create policy "Users can update own profile." on profiles for
update
    using (auth.uid() = id);

-- Set up Realtime!
begin;

drop publication if exists supabase_realtime;

create publication supabase_realtime;

commit;

alter publication supabase_realtime
add
    table profiles;

-- Set up Storage!
insert into
    storage.buckets (id, name)
values
    ('avatars', 'avatars');

create policy "Avatar images are publicly accessible." on storage.objects for
select
    using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar." on storage.objects for
insert
    with check (bucket_id = 'avatars');

create policy "Anyone can update an avatar." on storage.objects for
update
    with check (bucket_id = 'avatars');