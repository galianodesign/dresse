-- ═══════════════════════════════════════════════════════════════════
--  Dresse · Derechos RGPD (aplicado el 2026-08-06)
--  YA ESTA APLICADO. Queda como registro.
--
--  Hallazgo previo: NO existe ninguna clave foranea entre las tablas de
--  dresse y auth.users. Borrar una cuenta no arrastraba nada, asi que
--  todos sus datos quedaban ahi. Por eso el borrado va tabla por tabla.
--
--  !! SI SE ANADE UNA TABLA NUEVA CON DATOS DE USUARIA, HAY QUE ANADIRLA
--     A ESTA FUNCION O SUS DATOS SOBREVIVIRAN AL BORRADO DE LA CUENTA.
-- ═══════════════════════════════════════════════════════════════════

create or replace function dresse.borrar_mi_cuenta()
returns void
language plpgsql
security definer
set search_path = dresse, auth, pg_temp
as $fn$
declare
  yo uuid := auth.uid();
begin
  if yo is null then
    raise exception 'Hace falta sesion iniciada';
  end if;

  delete from dresse.comentarios      where usuario_id = yo;
  delete from dresse.post_likes       where usuario_id = yo;
  delete from dresse.tablero_posts    where tablero_id in
        (select id from dresse.tableros where usuario_id = yo);
  delete from dresse.tableros         where usuario_id = yo;
  delete from dresse.posts            where usuario_id = yo;
  delete from dresse.prendas          where usuario_id = yo;
  delete from dresse.looks            where usuario_id = yo;
  delete from dresse.wishlist         where usuario_id = yo;
  delete from dresse.historial_asesor where usuario_id = yo;
  delete from dresse.seguidores       where seguidor_id = yo or seguido_id = yo;
  delete from dresse.solicitudes      where seguidor_id = yo or seguido_id = yo;
  delete from dresse.perfiles         where id = yo;
  delete from auth.users              where id = yo;
end;
$fn$;

revoke all on function dresse.borrar_mi_cuenta() from public;
grant execute on function dresse.borrar_mi_cuenta() to authenticated;

-- Las fotos NO se borran aqui: el almacen no se limpia solo. Se borran desde
-- la app antes de llamar a esta funcion (lib/misDatos.ts), y si eso falla se
-- aborta el proceso en vez de dejar imagenes huerfanas en el servidor.
