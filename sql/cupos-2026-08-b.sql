-- ═══════════════════════════════════════════════════════════════════
--  Dresse · Cupos: separar catalogar de consultar (2026-08-07)
--
--  Decision de negocio: el armario NO es el peaje. Fotografiar la ropa es
--  trabajo que hace la clienta y es lo que la ata a la app; cobrarle por
--  terminarlo es al reves. El peaje es Madame Dresse, que ademas es lo unico
--  que cuesta dinero cada vez que se usa.
--
--    Gratis  : armario 40 prendas · 5 consultas al mes a la estilista
--    Premium : armario ilimitado  · consultas ilimitadas
--
--  Catalogar una prenda NO gasta consultas: es lo que llena el armario.
--  Solo lleva un tope diario alto, como proteccion contra abusos.
--
--  La tabla se creo hoy mismo y esta vacia, asi que se puede reestructurar
--  sin perder nada. Se comprobo antes de ejecutar esto.
-- ═══════════════════════════════════════════════════════════════════

-- Un contador por usuaria, periodo y concepto. El periodo es texto porque
-- para catalogar es un dia ('2026-08-07') y para consultar un mes ('2026-08').
alter table dresse.uso_asesor add column if not exists periodo  text;
alter table dresse.uso_asesor add column if not exists concepto text;

update dresse.uso_asesor
   set periodo  = coalesce(periodo, to_char(dia, 'YYYY-MM-DD')),
       concepto = coalesce(concepto, 'catalogar');

alter table dresse.uso_asesor alter column periodo  set not null;
alter table dresse.uso_asesor alter column concepto set not null;

alter table dresse.uso_asesor drop constraint if exists uso_asesor_pkey;
alter table dresse.uso_asesor add primary key (usuario_id, periodo, concepto);

comment on table dresse.uso_asesor is
  'Consumo de IA por usuaria. concepto=catalogar (tope diario) o asesorar (cupo mensual). Solo la escribe consumir_cupo_asesor().';

/*
  Suma un uso y devuelve como ha quedado el cupo.

  Devuelve jsonb y no un booleano para que la app pueda decir "te quedan 2
  consultas este mes" en vez de un no seco.

  Usa auth.uid() en vez de recibir el id: asi nadie puede gastarle el cupo a
  otra persona.
*/
create or replace function dresse.consumir_cupo_asesor(concepto_ text)
returns jsonb
language plpgsql
security definer
set search_path = dresse, auth, pg_temp
as $fn$
declare
  yo         uuid := auth.uid();
  es_premium boolean;
  periodo_   text;
  tope       int;
  n          int;
begin
  if yo is null then
    return jsonb_build_object('ok', false, 'motivo', 'sin_sesion');
  end if;

  if concepto_ not in ('catalogar', 'asesorar') then
    return jsonb_build_object('ok', false, 'motivo', 'concepto_invalido');
  end if;

  select coalesce(premium, false) into es_premium
    from dresse.perfiles where id = yo;

  if concepto_ = 'asesorar' then
    -- La estilista: 5 al mes en gratuito. En Premium no hay cupo real, pero
    -- se deja un techo altisimo por si alguna cuenta quedara comprometida.
    periodo_ := to_char(current_date, 'YYYY-MM');
    tope     := case when es_premium then 100000 else 5 end;
  else
    -- Catalogar es libre: este tope solo lo nota quien este abusando.
    periodo_ := to_char(current_date, 'YYYY-MM-DD');
    tope     := 100;
  end if;

  insert into dresse.uso_asesor (usuario_id, periodo, concepto, consultas)
  values (yo, periodo_, concepto_, 1)
  on conflict (usuario_id, periodo, concepto)
  do update set consultas = dresse.uso_asesor.consultas + 1
  returning consultas into n;

  return jsonb_build_object(
    'ok',        n <= tope,
    'usadas',    n,
    'tope',      tope,
    'restantes', greatest(0, tope - n),
    'premium',   es_premium,
    'concepto',  concepto_
  );
end;
$fn$;

-- La firma cambia (antes recibia un int), asi que se retira la version vieja.
drop function if exists dresse.consumir_cupo_asesor(int);

revoke all on function dresse.consumir_cupo_asesor(text) from public, anon;
grant execute on function dresse.consumir_cupo_asesor(text) to authenticated;
