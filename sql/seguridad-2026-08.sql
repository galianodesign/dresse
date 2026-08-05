-- ═══════════════════════════════════════════════════════════════════
--  Dresse · Cierre de filtraciones (aplicado el 2026-08-04)
--
--  Este archivo queda como registro de lo que se cambio en la base de
--  datos. YA ESTA APLICADO: no hay que volver a ejecutarlo.
--
--  Motivo: la app comprobaba la privacidad solo en la pantalla. Quien
--  consultara la base de datos directamente veia, sin sesion:
--  el mapa completo de seguidores, todos los comentarios y todos los
--  "me gusta", incluidos los de cuentas privadas.
-- ═══════════════════════════════════════════════════════════════════

-- 1) El almacen de fotos deja de aceptar cualquier archivo.
--    Antes: sin limite de tamano y cualquier tipo (se podia subir codigo).
update storage.buckets
   set allowed_mime_types = array['image/jpeg','image/png','image/webp'],
       file_size_limit = 5242880
 where id = 'dresse';

-- 2) Funcion auxiliar para saber si un perfil es publico.
--    Es "security definer" a proposito: consulta perfiles SIN pasar por sus
--    reglas. Sin esto se produce recursion infinita, porque la regla de
--    perfiles ya consulta seguidores y la de seguidores consultaria perfiles.
--    (Ocurrio de verdad y dejo la app inaccesible unos minutos.)
create or replace function dresse.es_publico(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = dresse, pg_temp
as $fn$
  select coalesce((select not privado from dresse.perfiles where id = uid), false)
$fn$;

revoke all on function dresse.es_publico(uuid) from public;
grant execute on function dresse.es_publico(uuid) to anon, authenticated;

-- 3) Seguidores: antes lo leia cualquiera. Ahora solo si estas implicada
--    o la cuenta seguida es publica.
drop policy if exists "seguidores lectura" on dresse.seguidores;
create policy "seguidores lectura" on dresse.seguidores for select using (
  auth.uid() = seguidor_id
  or auth.uid() = seguido_id
  or dresse.es_publico(seguido_id)
);

-- 4) Comentarios: antes lo leia cualquiera. Ahora solo los de publicaciones
--    que puedas ver. El EXISTS hereda por si solo las reglas de posts.
drop policy if exists "comentarios lectura" on dresse.comentarios;
create policy "comentarios lectura" on dresse.comentarios for select using (
  exists (select 1 from dresse.posts p where p.id = dresse.comentarios.post_id)
);

-- 5) Me gusta: igual que los comentarios.
drop policy if exists "likes lectura" on dresse.post_likes;
create policy "likes lectura" on dresse.post_likes for select using (
  exists (select 1 from dresse.posts p where p.id = dresse.post_likes.post_id)
);

-- ───────────────────────────────────────────────────────────────────
--  FASE 2 (aplicado despues de desplegar el codigo que firma las fotos)
--  IMPORTANTE: esto NO se puede ejecutar antes de ese despliegue, o
--  todas las imagenes de la app dejan de verse.
-- ───────────────────────────────────────────────────────────────────

-- 6) Leer el almacen deja de estar abierto al mundo: solo usuarias con
--    sesion. Antes la regla era para el rol "public", es decir cualquiera.
drop policy if exists "dresse leer" on storage.objects;
create policy "dresse leer" on storage.objects for select
  to authenticated using (bucket_id = 'dresse');

-- 7) El almacen deja de ser publico. A partir de aqui las fotos solo se ven
--    con una direccion firmada, que caduca a las 8 horas (lib/almacen.ts).
update storage.buckets set public = false where id = 'dresse';

-- Comprobado tras aplicarlo:
--   usuaria registrada -> lee las 9 fotos
--   desconocido        -> lee 0
--   direccion publica antigua -> HTTP 400
