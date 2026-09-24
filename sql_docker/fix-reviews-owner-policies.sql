-- ============================================================
-- FIX #22 del audit QA: reviews no tenía política de UPDATE/DELETE
-- - un cliente no podía corregir ni borrar su propia reseña.
-- Decisión de producto (confirmada): SÍ se permite, pero debe quedar
-- visible que la reseña fue editada (igual que reviews de Amazon o
-- comentarios de la mayoría de apps) - se agrega `updated_at`, seteado
-- solo por un trigger BEFORE UPDATE, nunca por el cliente directamente.
-- ============================================================

alter table public.reviews
  add column if not exists updated_at timestamptz;

create or replace function public.touch_review_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  -- Campos inmutables tras la creación: no se puede reasignar una reseña
  -- a otro booking/cliente/profesional ni cambiarle el rating a otro que
  -- no pase por esta misma validación - solo se edita el texto y el rating
  -- de la reseña propia.
  new.booking_id = old.booking_id;
  new.client_id = old.client_id;
  new.professional_id = old.professional_id;
  new.created_at = old.created_at;
  return new;
end;
$$;

drop trigger if exists review_update_touch on public.reviews;

create trigger review_update_touch
before update on public.reviews
for each row execute function public.touch_review_updated_at();

-- Solo el cliente dueño puede editar (rating/comment) su propia reseña.
-- El trigger de arriba ya congela booking_id/client_id/professional_id/
-- created_at, así que el WITH CHECK solo necesita seguir confirmando la
-- propiedad, no cada columna individual.
drop policy if exists "reviews_update_own_client" on public.reviews;

create policy "reviews_update_own_client"
on public.reviews for update
to authenticated
using (client_id = auth.uid())
with check (client_id = auth.uid());

-- Solo el cliente dueño puede borrar su propia reseña.
drop policy if exists "reviews_delete_own_client" on public.reviews;

create policy "reviews_delete_own_client"
on public.reviews for delete
to authenticated
using (client_id = auth.uid());
