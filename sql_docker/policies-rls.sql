-- ============================================================
-- POLÍTICAS RLS - App de servicios
-- ============================================================
-- Corre esto en el SQL Editor después del schema-inicial.sql.
-- RLS ya está habilitado en las 6 tablas (lo hizo Studio al
-- darle "Run and enable RLS"). Aquí solo definimos las reglas.

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
-- Cualquier usuario logueado puede ver cualquier perfil (nombre, foto)
create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

-- Un usuario solo puede crear SU PROPIO perfil (id = su propio auth.uid())
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

-- Un usuario solo puede editar su propio perfil
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- ------------------------------------------------------------
-- CATEGORIES
-- ------------------------------------------------------------
-- Lectura pública, incluso sin login (para mostrar el feed a visitantes)
create policy "categories_select_public"
on public.categories for select
to anon, authenticated
using (true);
-- Nota: no hay política de INSERT/UPDATE/DELETE a propósito.
-- Sin una política que lo permita, esa acción queda bloqueada por
-- completo vía API. Las categorías se gestionan manualmente por
-- ustedes (con la service_role key, que se salta RLS).

-- ------------------------------------------------------------
-- PROFESSIONAL_PROFILES
-- ------------------------------------------------------------
-- Lectura pública (el feed de clientes necesita verlos SIN login)
create policy "professional_profiles_select_public"
on public.professional_profiles for select
to anon, authenticated
using (true);

-- Solo el propio profesional puede crear su perfil profesional
create policy "professional_profiles_insert_own"
on public.professional_profiles for insert
to authenticated
with check (profile_id = auth.uid());

-- Solo el propio profesional puede editar su perfil profesional
create policy "professional_profiles_update_own"
on public.professional_profiles for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

-- ------------------------------------------------------------
-- SERVICES
-- ------------------------------------------------------------
-- Lectura pública (es el feed que ve el cliente)
create policy "services_select_public"
on public.services for select
to anon, authenticated
using (true);

-- Solo el profesional dueño puede crear sus propios servicios
create policy "services_insert_own"
on public.services for insert
to authenticated
with check (professional_id = auth.uid());

create policy "services_update_own"
on public.services for update
to authenticated
using (professional_id = auth.uid())
with check (professional_id = auth.uid());

create policy "services_delete_own"
on public.services for delete
to authenticated
using (professional_id = auth.uid());

-- ------------------------------------------------------------
-- BOOKINGS (solicitudes)
-- ------------------------------------------------------------
-- Solo el cliente o el profesional involucrados ven la solicitud
-- (nadie más debe poder ver quién solicitó qué a quién)
create policy "bookings_select_involved"
on public.bookings for select
to authenticated
using (client_id = auth.uid() or professional_id = auth.uid());

-- Solo un cliente puede crear una solicitud, y siempre a su propio nombre
create policy "bookings_insert_own_client"
on public.bookings for insert
to authenticated
with check (client_id = auth.uid());

-- Cualquiera de los dos involucrados puede actualizar (aceptar, cancelar, etc.)
create policy "bookings_update_involved"
on public.bookings for update
to authenticated
using (client_id = auth.uid() or professional_id = auth.uid())
with check (client_id = auth.uid() or professional_id = auth.uid());

-- ------------------------------------------------------------
-- REVIEWS
-- ------------------------------------------------------------
-- Lectura pública (para mostrar el ranking en el feed)
create policy "reviews_select_public"
on public.reviews for select
to anon, authenticated
using (true);

-- Solo el cliente dueño de la reseña puede crearla
create policy "reviews_insert_own_client"
on public.reviews for insert
to authenticated
with check (client_id = auth.uid());
