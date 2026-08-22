-- ============================================================
-- ESQUEMA INICIAL - App de servicios (técnicos, albañiles, etc.)
-- ============================================================
-- Corre esto completo en el SQL Editor de Supabase Studio.
-- Nota para venir de SQL Server: aquí no hay "USE base; GO;" -
-- cada proyecto de Supabase ES una base de datos completa.

-- Extensión de PostGIS para manejar ubicación (equivalente al
-- tipo GEOGRAPHY de SQL Server, pero más completo)
create extension if not exists postgis;

-- ------------------------------------------------------------
-- 1. PROFILES
-- ------------------------------------------------------------
-- Supabase ya crea y maneja la tabla auth.users (login, password,
-- email, etc.) - nosotros no la tocamos. Esta tabla "profiles"
-- extiende esa con los datos propios de tu app, 1 a 1 con auth.users.
-- Es el patrón estándar en Supabase, similar a tener una tabla
-- "Usuarios" separada de la tabla de login de un Identity de .NET.

create type user_role as enum ('cliente', 'profesional');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. CATEGORIES (albañilería, plomería, electricidad, etc.)
-- ------------------------------------------------------------
create table public.categories (
  id serial primary key,
  name text not null unique,
  slug text not null unique
);

-- ------------------------------------------------------------
-- 3. PROFESSIONAL_PROFILES
-- ------------------------------------------------------------
-- Datos que SOLO tienen los profesionales: ubicación, bio,
-- si están verificados, etc. Separado de "profiles" para no
-- llenar de columnas nulas a los clientes.

create table public.professional_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  bio text,
  -- Punto geográfico (lat/lng). SRID 4326 = coordenadas GPS estándar.
  location geography(point, 4326),
  service_radius_km numeric default 10,
  is_verified boolean not null default false,
  -- Documentos de verificación (URLs a archivos en Storage)
  verification_docs jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Índice espacial: hace las búsquedas "cerca de mí" rápidas.
-- Es el equivalente a un índice espacial de SQL Server.
create index professional_location_idx
  on public.professional_profiles using gist (location);

-- ------------------------------------------------------------
-- 4. SERVICES (lo que ofrece cada profesional)
-- ------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(profile_id) on delete cascade,
  category_id int not null references public.categories(id),
  title text not null,
  description text,
  price numeric(10,2) not null,
  price_unit text not null default 'servicio', -- 'hora', 'servicio', 'm2', etc.
  -- Campos variables según el gremio (ej: "voltaje" para electricistas,
  -- "tipo de tubería" para plomeros) sin tener que alterar la tabla.
  extra_fields jsonb default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index services_category_idx on public.services (category_id);
create index services_professional_idx on public.services (professional_id);

-- ------------------------------------------------------------
-- 5. BOOKINGS (solicitudes / apartados de servicio)
-- ------------------------------------------------------------
create type booking_status as enum (
  'solicitado', 'aceptado', 'en_curso', 'completado', 'cancelado'
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id),
  professional_id uuid not null references public.professional_profiles(profile_id),
  service_id uuid not null references public.services(id),
  status booking_status not null default 'solicitado',
  scheduled_at timestamptz,
  price_agreed numeric(10,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_status_idx on public.bookings (status);
create index bookings_client_idx on public.bookings (client_id);
create index bookings_professional_idx on public.bookings (professional_id);

-- ------------------------------------------------------------
-- 6. REVIEWS (calificaciones del cliente hacia el profesional)
-- ------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id),
  client_id uuid not null references public.profiles(id),
  professional_id uuid not null references public.professional_profiles(profile_id),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index reviews_professional_idx on public.reviews (professional_id);

-- ------------------------------------------------------------
-- 7. VISTA: ranking promedio por profesional
-- ------------------------------------------------------------
-- En vez de guardar un campo "rating_avg" que hay que actualizar
-- a mano cada vez, usamos una vista que lo calcula al vuelo.
create view public.professional_ratings as
select
  professional_id,
  round(avg(rating)::numeric, 2) as rating_avg,
  count(*) as rating_count
from public.reviews
group by professional_id;
