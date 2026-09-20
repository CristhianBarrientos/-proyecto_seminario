-- ============================================================
-- FIX consolidado: hallazgos críticos/altos de RLS
-- Aplica: fix-bookings-state-machine.sql (ya existía, nunca se corrió)
--       + profiles: deja de exponer phone a cualquier autenticado
--       + professional_profiles: deja de exponer verification_docs
--       + professional_profiles: bloquea auto-verificación (is_verified)
--       + reviews: exige booking propio y completado antes de reseñar
-- ============================================================

-- ------------------------------------------------------------
-- 1 y 2. BOOKINGS: máquina de estados real
--    (cliente marcaba 'completado' unilateral / reasignaba professional_id)
-- ------------------------------------------------------------
create or replace function public.validate_booking_update()
returns trigger as $$
begin
  if new.client_id is distinct from old.client_id
     or new.professional_id is distinct from old.professional_id
     or new.service_id is distinct from old.service_id then
    raise exception 'No se puede reasignar cliente, profesional o servicio de una solicitud existente';
  end if;

  if new.price_agreed is distinct from old.price_agreed and old.status <> 'solicitado' then
    raise exception 'No se puede modificar el precio acordado después de aceptada la solicitud';
  end if;

  if new.status = old.status then
    return new;
  end if;

  if auth.uid() = old.professional_id then
    if not (
      (old.status = 'solicitado' and new.status in ('aceptado', 'cancelado')) or
      (old.status = 'aceptado' and new.status in ('en_curso', 'cancelado')) or
      (old.status = 'en_curso' and new.status in ('completado', 'cancelado'))
    ) then
      raise exception 'Transición de estado no permitida para el profesional (% -> %)', old.status, new.status;
    end if;

  elsif auth.uid() = old.client_id then
    if not (old.status in ('solicitado', 'aceptado') and new.status = 'cancelado') then
      raise exception 'Transición de estado no permitida para el cliente (% -> %)', old.status, new.status;
    end if;

  else
    raise exception 'No autorizado para modificar esta solicitud';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists booking_update_guard on public.bookings;

create trigger booking_update_guard
before update on public.bookings
for each row execute function public.validate_booking_update();

-- ------------------------------------------------------------
-- 3. PROFESSIONAL_PROFILES: verification_docs y location dejan de
--    ser legibles por cualquiera. Solo el propio profesional ve su
--    fila completa. Lectura pública pasa por una vista sin
--    verification_docs (location se mantiene: el feed la necesita
--    para "cerca de mí" - queda documentado como riesgo residual
--    a resolver con una función RPC de distancia server-side).
-- ------------------------------------------------------------
drop policy if exists professional_profiles_select_public on public.professional_profiles;

create policy professional_profiles_select_own on public.professional_profiles
  for select to authenticated
  using (profile_id = auth.uid());

-- security_invoker='false' (no 'true'): esta vista debe correr con los
-- privilegios de su dueño para exponer el subconjunto público pese al RLS
-- restrictivo de la tabla base - con invoker='true' hereda esa restricción
-- y termina devolviendo 0 filas a terceros (bug real, detectado probando
-- contra el frontend).
create or replace view public.professional_profiles_public
  with (security_invoker='false') as
select profile_id, bio, location, service_radius_km, is_verified, created_at
from public.professional_profiles;

grant select on public.professional_profiles_public to authenticated, anon;

-- ------------------------------------------------------------
-- 4. PROFILES: phone deja de ser legible por cualquier autenticado.
--    Lectura pública de terceros (nombre/foto para mostrar en feed
--    y detalle) pasa por vista sin phone.
-- ------------------------------------------------------------
drop policy if exists profiles_select_authenticated on public.profiles;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

create or replace view public.profiles_public
  with (security_invoker='false') as
select id, full_name, avatar_url, role from public.profiles;

grant select on public.profiles_public to authenticated;

-- ------------------------------------------------------------
-- 5. PROFESSIONAL_PROFILES: bloquear auto-verificación.
--    El profesional puede editar su fila (bio, servicios, docs) pero
--    NO puede cambiar is_verified por su cuenta; eso requiere un
--    proceso con service_role (que sí bypasea RLS pero no triggers).
-- ------------------------------------------------------------
create or replace function public.protect_is_verified()
returns trigger as $$
begin
  if new.is_verified is distinct from old.is_verified and auth.role() <> 'service_role' then
    raise exception 'is_verified solo puede cambiarlo un proceso de verificación autorizado';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_is_verified_guard on public.professional_profiles;

create trigger protect_is_verified_guard
before update on public.professional_profiles
for each row execute function public.protect_is_verified();

-- ------------------------------------------------------------
-- 6. REVIEWS: exigir booking propio, con ese profesional, y
--    completado antes de poder reseñar (evita reseñas falsas sin
--    haber contratado el servicio).
-- ------------------------------------------------------------
create or replace function public.validate_review_insert()
returns trigger as $$
declare
  b public.bookings;
begin
  select * into b from public.bookings where id = new.booking_id;

  if b is null then
    raise exception 'booking_id no existe';
  end if;

  if b.client_id <> new.client_id then
    raise exception 'La reseña debe corresponder a un booking propio';
  end if;

  if b.professional_id <> new.professional_id then
    raise exception 'professional_id no coincide con el del booking';
  end if;

  if b.status <> 'completado' then
    raise exception 'Solo se puede reseñar un servicio completado';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists review_insert_guard on public.reviews;

create trigger review_insert_guard
before insert on public.reviews
for each row execute function public.validate_review_insert();
