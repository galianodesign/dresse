-- ═══════════════════════════════════════════════════════════════════
--  Dressé · Onboarding de nuevas usuarias
--
--  Añade a la tabla de perfiles la columna que recuerda si una usuaria
--  ya ha visto las pantallas de bienvenida.
--
--  CÓMO EJECUTARLO (paso a paso):
--   1. Entra en https://supabase.com e inicia sesión.
--   2. Abre el proyecto "crm-galiano".
--   3. En el menú de la izquierda, pulsa "SQL Editor".
--   4. Pulsa el botón "New query" (arriba).
--   5. Copia y pega TODO el contenido de este archivo.
--   6. Pulsa "Run" (abajo a la derecha, o Ctrl+Enter).
--
--  ES SEGURO: no borra ni modifica ningún dato existente, y puedes
--  ejecutarlo varias veces sin que pase nada.
-- ═══════════════════════════════════════════════════════════════════


-- 1) Crear la columna.
--    Se crea con "default true" a propósito: así todas las cuentas que YA
--    existen (la tuya, la de tu novia, etc.) quedan marcadas como que ya
--    vieron la bienvenida y no les vuelve a salir.
alter table dresse.perfiles
  add column if not exists onboarded boolean not null default true;


-- 2) Cambiar el valor por defecto a "false".
--    A partir de aquí, cada cuenta NUEVA nace sin la bienvenida vista,
--    así que la verá la primera vez que entre.
alter table dresse.perfiles
  alter column onboarded set default false;


-- 3) Comprobación final.
--    Si todo ha ido bien, esto devuelve UNA fila que dice:
--      onboarded | boolean | false
select column_name  as columna,
       data_type    as tipo,
       column_default as valor_por_defecto
  from information_schema.columns
 where table_schema = 'dresse'
   and table_name   = 'perfiles'
   and column_name  = 'onboarded';
