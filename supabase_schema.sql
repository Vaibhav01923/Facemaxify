-- Create a table for public profiles (synced from Clerk)
create table users (
  id text primary key, -- Use Clerk ID as the primary key
  email text unique not null,
  first_name text,
  last_name text,
  full_name text,
  photo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security)
alter table users enable row level security;

-- Allow public read access (optional, depending on your app needs)
create policy "Public profiles are viewable by everyone."
  on users for select
  using ( true );
