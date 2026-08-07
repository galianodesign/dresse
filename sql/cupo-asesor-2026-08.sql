-- ═══════════════════════════════════════════════════════════════════
--  Dresse · Cupo diario del asesor (2026-08-07)
--
--  Contexto: /api/asesor estaba abierta a internet. Cualquiera con la
--  direccion podia llamarla sin cuenta y gastar el saldo de Anthropic.
--  Verificado con una peticion anonima contra produccion: 200 y respuesta
--  real de la IA.
--
--  El arreglo principal es exigir sesion (lib/supabase/ruta.ts). Esto es la
--  segunda barrera: que una cuenta legitima tampoco pueda vaciar el saldo.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists dresse.uso_asesor (
  usuario_id uuid not null,
  dia        date not null default current_date,
  consultas  int  not null default 0,
  primary key (usuario_id, dia)
);

comment on table dresse.uso_asesor is
  'Consultas a la IA por usuaria y dia. Solo la escribe consumir_cupo_asesor().';

-- Nadie toca esta tabla directamente: solo la funcion, que es security definer.
alter table dresse.uso_asesor enable row level security;
revoke all on dresse.uso_asesor from anon, authenticated;

/*
  Suma una consulta y dice si sigue dentro del cupo.

  Usa auth.uid() en vez de recibir el id como parametro: asi nadie puede
  llamarla para gastarle el cupo a otra persona.
*/
create or replace function dresse.consumir_cupo_asesor(tope int default 60)
returns boolean
language plpgsql
security definer
set search_path = dresse, auth, pg_temp
as $fn$
declare
  yo uuid := auth.uid();
  n  int;
begin
  if yo is null then
    return false;
  end if;

  insert into dresse.uso_asesor (usuario_id, dia, consultas)
  values (yo, current_date, 1)
  on conflict (usuario_id, dia)
  do update set consultas = dresse.uso_asesor.consultas + 1
  returning consultas into n;

  return n <= tope;
end;
$fn$;

revoke all on function dresse.consumir_cupo_asesor(int) from public, anon;
grant execute on function dresse.consumir_cupo_asesor(int) to authenticated;

-- ⚠️ TABLA NUEVA CON DATOS DE USUARIA: hay que borrarla al borrar la cuenta,
-- o sobrevive al borrado. Se anade a borrar_mi_cuenta() aqui abajo.
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

  delete from dresse.uso_asesor       where usuario_id = yo;
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
