-- =============================================================================
-- PrescriptionMaker — Supabase Database Schema
-- =============================================================================
-- Run this in Supabase's SQL Editor (Dashboard > SQL Editor > New Query)
-- Order matters: create tables before adding foreign keys or RLS policies.
--
-- Tables:
--   users               — Doctor/user profiles (extends Supabase auth.users)
--   prescriptions       — Saved prescriptions
--   prescription_drafts — Autosaved draft data (one per user per prescription)
--   doctor_profiles     — Detailed clinic/doctor configuration
--   user_plans          — Subscription plan tracking
-- =============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================================================
-- 1. USERS (Doctor/User Profile)
-- =============================================================================
-- This mirrors the auth.users table and stores additional profile data.
-- Automatically created via signup API route.

create table if not exists public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null unique,
  name            text not null,
  role            text not null default 'doctor' check (role in ('doctor', 'admin', 'staff')),
  plan            text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  status          text not null default 'active' check (status in ('active', 'suspended', 'pending')),
  avatar_url      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =============================================================================
-- 2. DOCTOR PROFILES (Clinic & Doctor Info)
-- =============================================================================
-- Stores the doctor information that pre-fills the prescription editor.
-- One-to-one with users.

create table if not exists public.doctor_profiles (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null unique references public.users(id) on delete cascade,

  -- Doctor info
  doctor_name           text,
  qualifications        text,        -- e.g. "MBBS, MD"
  specialization        text,        -- e.g. "General Medicine"
  registration_number   text,        -- MCI/State registration number
  experience_years      integer,

  -- Clinic info
  clinic_name           text,
  clinic_phone          text,
  clinic_address        text,
  clinic_city           text,
  clinic_state          text,
  clinic_pincode        text,
  clinic_email          text,
  clinic_website        text,
  clinic_logo_url       text,

  -- Stamp / Signature
  stamp_url             text,
  signature_url         text,

  -- Preferences
  default_template_slug text default 'classic-medical',
  default_language      text default 'en',

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- =============================================================================
-- 3. PRESCRIPTIONS
-- =============================================================================

create table if not exists public.prescriptions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,

  -- Meta
  title           text,                    -- User-defined title or auto-generated
  template_slug   text not null default 'classic-medical',
  status          text not null default 'draft' check (status in ('draft', 'complete', 'archived')),
  mode            text not null default 'form' check (mode in ('form', 'hand')),

  -- Prescription content (stored as JSONB for flexibility)
  -- Mirrors PrescriptionFormValues from packages/validation
  doctor_info     jsonb not null default '{}',
  patient_info    jsonb not null default '{}',
  diagnosis       text,
  medicines       jsonb not null default '[]',
  lab_tests       text,
  advice          text,
  follow_up_date  text,

  -- Hand mode specific
  canvas_data     jsonb,               -- Fabric.js canvas JSON
  canvas_image_url text,               -- Rendered PNG of canvas (for preview)

  -- PDF
  pdf_url         text,                -- Stored PDF URL (Supabase Storage)
  pdf_generated_at timestamptz,

  -- Timestamps
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Index for listing user's prescriptions
create index if not exists prescriptions_user_id_idx on public.prescriptions (user_id, created_at desc);
create index if not exists prescriptions_status_idx on public.prescriptions (user_id, status);

-- =============================================================================
-- 4. USER PLANS (Subscription Tracking)
-- =============================================================================

create table if not exists public.user_plans (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null unique references public.users(id) on delete cascade,
  plan                text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  billing_cycle       text check (billing_cycle in ('monthly', 'yearly')),
  status              text not null default 'active' check (status in ('active', 'cancelled', 'expired', 'trial')),
  current_period_start timestamptz,
  current_period_end  timestamptz,
  razorpay_customer_id text,
  razorpay_subscription_id text,
  prescription_count_this_month integer not null default 0,
  prescription_count_reset_at   timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- Users can only access their own data.

alter table public.users enable row level security;
alter table public.doctor_profiles enable row level security;
alter table public.prescriptions enable row level security;
alter table public.user_plans enable row level security;

-- Users: can view and update own row
create policy "users_own_row_select" on public.users
  for select using (auth.uid() = id);

create policy "users_own_row_update" on public.users
  for update using (auth.uid() = id);

-- Doctor profiles: can read/write own profile
create policy "doctor_profiles_own_select" on public.doctor_profiles
  for select using (auth.uid() = user_id);

create policy "doctor_profiles_own_insert" on public.doctor_profiles
  for insert with check (auth.uid() = user_id);

create policy "doctor_profiles_own_update" on public.doctor_profiles
  for update using (auth.uid() = user_id);

-- Prescriptions: full CRUD on own prescriptions
create policy "prescriptions_own_select" on public.prescriptions
  for select using (auth.uid() = user_id);

create policy "prescriptions_own_insert" on public.prescriptions
  for insert with check (auth.uid() = user_id);

create policy "prescriptions_own_update" on public.prescriptions
  for update using (auth.uid() = user_id);

create policy "prescriptions_own_delete" on public.prescriptions
  for delete using (auth.uid() = user_id);

-- User plans: read-only (plans are updated by server-side webhook)
create policy "user_plans_own_select" on public.user_plans
  for select using (auth.uid() = user_id);

-- =============================================================================
-- 6. TRIGGERS — updated_at auto-update
-- =============================================================================

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger doctor_profiles_updated_at
  before update on public.doctor_profiles
  for each row execute procedure public.handle_updated_at();

create trigger prescriptions_updated_at
  before update on public.prescriptions
  for each row execute procedure public.handle_updated_at();

create trigger user_plans_updated_at
  before update on public.user_plans
  for each row execute procedure public.handle_updated_at();

-- =============================================================================
-- 7. FUNCTIONS — Helpers
-- =============================================================================

-- Auto-create user_plan row when a user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_plans (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_user_created
  after insert on public.users
  for each row execute procedure public.handle_new_user();

-- =============================================================================
-- 8. STORAGE BUCKETS
-- =============================================================================
-- Run these in Supabase Dashboard > Storage, OR via API:
--
-- Bucket: 'prescription-pdfs'   — generated PDFs (private)
-- Bucket: 'doctor-assets'       — logos, stamps, signatures (private)
-- Bucket: 'canvas-previews'     — hand-mode canvas PNG exports (private)
--
-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('prescription-pdfs', 'prescription-pdfs', false),
--   ('doctor-assets', 'doctor-assets', false),
--   ('canvas-previews', 'canvas-previews', false);

-- =============================================================================
-- End of schema
-- =============================================================================
