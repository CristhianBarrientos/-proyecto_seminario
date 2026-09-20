-- ============================================================
-- FIX #7 del audit QA: usuario huérfano si signUp tiene éxito
-- pero el insert en profiles falla (queda en auth.users sin fila
-- en profiles; reintento falla con "ya existe una cuenta").
-- ============================================================
-- Patrón estándar de Supabase: trigger AFTER INSERT en auth.users
-- que crea la fila en profiles dentro de la MISMA transacción del
-- signup. Si falla (ej. full_name/role faltan), todo el INSERT en
-- auth.users también se revierte -> ya no puede quedar a medias.
--
-- El frontend deja de hacer el insert manual a profiles y en su
-- lugar manda full_name/role como metadata del signUp() (ver
-- Login.tsx). Si algún día se agrega login social/OTP sin esa
-- metadata, hay defaults razonables para no romper el signup.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'cliente'),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
