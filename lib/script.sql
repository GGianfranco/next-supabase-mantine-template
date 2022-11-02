-- Run this script on Supabase web platform's SQL editor to create the tables.
--create Create a table for Public Foods
create table foods (
    id serial not null,
    user_id uuid references auth.users not null,
    updated_at timestamptz,
    created_at timestamptz default now() not null,
    name text not null,
    description text,
    -- image_url text unique references storage.objects (name), storage.objects.name appears to be not unique.
    rating integer,
    is_public boolean not null default false,
    primary key (id),
    unique(name),
    constraint name_length check (
        char_length(name) > 1
        and char_length(name) <= 20
    )
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

create table images (
    id serial not null,
    filePath text not null,
    description text not null,
    updated_at timestamptz,
    created_at timestamptz default now() not null,
    created_by uuid references auth.users not null,
    is_public boolean not null default false,
    primary key (id),
    unique(filePath),
    constraint description_length check (char_length(description) > 0)
);

alter table
    images enable row level security;

create table peer_reviews (
    id serial not null,
    reviewee uuid references auth.users not null,
    review jsonb not null,
    updated_at timestamptz,
    created_at timestamptz default now() not null,
    created_by uuid references auth.users not null,
    primary key (id)
);

alter table
    peer_reviews enable row level security;

-- rpc below
create
or replace function keyword_occurence_image_description(keyword text) returns setof images as $ $
select
    *
from
    images
where
    description ilike '%' || keyword || '%';

$ $ language sql;

-- create database function to count occurence of a keyword from images table description column.
-- This function uses ilike postgresql operator.
create
or replace function count_keyword_occurence_image_description(keyword text) returns int as $ $
select
    count(*)
from
    images
where
    description ilike '%' || keyword || '%';

$ $ language sql;

-- create database function to count occurence of a keyword from images table description column.
-- This function uses ilike postgresql operator.
-- Distinct by created_by column.
create
or replace function count_keyword_occurence_image_description_distinct(keyword text) returns int as $ $
select
    count(distinct created_by)
from
    images
where
    description ilike '%' || keyword || '%';

$ $ language sql;

-- create database function to count occurence of a keyword from images table description column per created_by column.
-- This function uses ilike postgresql operator.
create
or replace function count_keyword_occurence_image_description_group(keyword text) returns table (created_by uuid, count int) as $ $
select
    created_by,
    count(*)
from
    images
where
    description ilike '%' || keyword || '%'
group by
    created_by;

$ $ language sql;

create
or replace function keyword_occurence_peer_reviews_review(keyword text) returns setof peer_reviews as $ $
select
    *
from
    peer_reviews
where
    review :: text ilike '%' || keyword || '%';

$ $ language sql;

-- create database function to count occurence of a keyword from peer_reviews table, review jsonb column. 
-- This function uses ilike postgresql operator.
-- Search recursively in jsonb column.
create
or replace function count_keyword_occurence_peer_reviews_review(keyword text) returns int as $ $
select
    count(*)
from
    peer_reviews
where
    review :: text ilike '%' || keyword || '%';

$ $ language sql;

-- per reviewee.
create
or replace function count_keyword_occurence_peer_reviews_review_group(keyword text) returns table (reviewee uuid, count int) as $ $
select
    reviewee,
    count(*)
from
    peer_reviews
where
    review :: text ilike '%' || keyword || '%'
group by
    reviewee;

$ $ language sql;

create
or replace function count_keyword_occurence_peer_reviews_review_distinct(keyword text) returns int as $ $
select
    count(distinct reviewee)
from
    peer_reviews
where
    review :: text ilike '%' || keyword || '%';

$ $ language sql;

-- fts below
create
or replace function keyword_occurence_image_description_fts(keyword text) returns setof images as $ $
select
    *
from
    images
where
    to_tsvector(description) @ @ to_tsquery(keyword);

$ $ language sql;

-- create database function to count occurence of a keyword from images table description column using postgresql full-text search.
create
or replace function count_keyword_occurence_image_description_fts(keyword text) returns int as $ $
select
    count(*)
from
    images
where
    to_tsvector(description) @ @ to_tsquery(keyword);

$ $ language sql;

-- create database function to count occurence of a keyword from images table description column using postgresql full-text search.
-- Distinct by created_by column.
create
or replace function count_keyword_occurence_image_description_distinct_fts(keyword text) returns int as $ $
select
    count(distinct created_by)
from
    images
where
    to_tsvector(description) @ @ to_tsquery(keyword);

$ $ language sql;

-- create database function to count occurence of a keyword from images table description column using postgresql full-text search per created_by column.
create
or replace function count_keyword_occurence_image_description_group_fts(keyword text) returns table (created_by uuid, count int) as $ $
select
    created_by,
    count(*)
from
    images
where
    to_tsvector(description) @ @ to_tsquery(keyword)
group by
    created_by;

$ $ language sql;

create
or replace function keyword_occurence_peer_reviews_review_fts(keyword text) returns setof peer_reviews as $ $
select
    *
from
    peer_reviews
where
    to_tsvector(review :: text) @ @ to_tsquery(keyword);

$ $ language sql;

-- create database function to count occurence of a keyword from peer_reviews table, review jsonb column using postgresql full-text search.
create
or replace function count_keyword_occurence_peer_reviews_review_fts(keyword text) returns int as $ $
select
    count(*)
from
    peer_reviews
where
    to_tsvector(review :: text) @ @ to_tsquery(keyword);

$ $ language sql;

-- create database function to count occurence of a keyword from peer_reviews table, review jsonb column using postgresql full-text search.
-- Distinct by created_by column.
create
or replace function count_keyword_occurence_peer_reviews_review_distinct_fts(keyword text) returns int as $ $
select
    count(distinct reviewee)
from
    peer_reviews
where
    to_tsvector(review :: text) @ @ to_tsquery(keyword);

$ $ language sql;

-- create database function to count occurence of a keyword from peer_reviews table, review jsonb column using postgresql full-text search per reviewee column.
create
or replace function count_keyword_occurence_peer_reviews_review_group_fts(keyword text) returns table (reviewee uuid, count int) as $ $
select
    reviewee,
    count(*)
from
    peer_reviews
where
    to_tsvector(review :: text) @ @ to_tsquery(keyword)
group by
    reviewee;

$ $ language sql;