-- ============================================================
-- FIX: Máquina de estados real para bookings
-- Arregla los hallazgos críticos del QA:
--  #2 - cliente marcaba unilateralmente "completado" y cambiaba price_agreed
--  #3 - cliente podía reasignar professional_id/service_id de su solicitud
-- ============================================================
-- La política bookings_update_involved sigue igual (controla QUIÉN puede
-- intentar un update). Este trigger controla QUÉ cambios son válidos,
-- comparando la fila vieja contra la nueva - algo que RLS por sí solo
-- no puede expresar bien.

create or replace function public.validate_booking_update()
returns trigger as $$
begin
  -- Cliente, profesional y servicio quedan congelados tras crear la solicitud
  if new.client_id is distinct from old.client_id
     or new.professional_id is distinct from old.professional_id
     or new.service_id is distinct from old.service_id then
    raise exception 'No se puede reasignar cliente, profesional o servicio de una solicitud existente';
  end if;

  -- El precio acordado solo se puede fijar/ajustar mientras sigue "solicitado"
  if new.price_agreed is distinct from old.price_agreed and old.status <> 'solicitado' then
    raise exception 'No se puede modificar el precio acordado después de aceptada la solicitud';
  end if;

  -- Si el status no cambió, no hay nada más que validar
  if new.status = old.status then
    return new;
  end if;

  -- Transiciones permitidas según el rol de quien hace el update
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
