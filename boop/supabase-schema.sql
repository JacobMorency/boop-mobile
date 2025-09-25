-- Simplified Boop App Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop tables if they exist (for re-running)
drop table if exists pings cascade;
drop table if exists pairs cascade;
drop table if exists devices cascade;

-- Devices table - one per app install
create table devices (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  expo_push_token text,
  platform text check (platform in ('ios', 'android', 'web')),
  created_at timestamptz default now(),
  last_seen_at timestamptz
);

-- Pairs table - 1:1 device pairing
create table pairs (
  id uuid primary key default uuid_generate_v4(),
  device_a uuid not null references devices(id) on delete cascade,
  device_b uuid not null references devices(id) on delete cascade,
  created_at timestamptz default now(),
  constraint no_self_pair check (device_a != device_b)
);

-- Pings table - boop history
create table pings (
  id uuid primary key default uuid_generate_v4(),
  from_device uuid references devices(id) on delete set null,
  to_device uuid references devices(id) on delete set null,
  created_at timestamptz default now()
);

-- Indexes for performance
create index idx_devices_code on devices(code);
create index idx_devices_push_token on devices(expo_push_token);
create index idx_pairs_devices on pairs(device_a, device_b);
create index idx_pings_to_device on pings(to_device, created_at desc);

-- Unique constraint to prevent duplicate pairs
create unique index uniq_pairs_devices on pairs(least(device_a, device_b), greatest(device_a, device_b));

-- Function to generate device codes (6 chars, no ambiguous characters)
create or replace function generate_device_code()
returns text
language plpgsql
as $$
declare
  chars text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  
  -- Ensure uniqueness
  while exists (select 1 from devices where code = result) loop
    result := '';
    for i in 1..6 loop
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
  end loop;
  
  return result;
end;
$$;

-- Trigger to auto-generate device codes
create or replace function set_device_code()
returns trigger
language plpgsql
as $$
begin
  if new.code is null or trim(new.code) = '' then
    new.code := generate_device_code();
  end if;
  new.code := upper(trim(new.code));
  return new;
end;
$$;

create trigger trigger_set_device_code
  before insert on devices
  for each row
  execute function set_device_code();

-- Enable RLS (Row Level Security)
alter table devices enable row level security;
alter table pairs enable row level security;
alter table pings enable row level security;

-- Allow all operations for now (you can restrict later)
create policy "Allow all operations on devices" on devices for all using (true);
create policy "Allow all operations on pairs" on pairs for all using (true);
create policy "Allow all operations on pings" on pings for all using (true);
