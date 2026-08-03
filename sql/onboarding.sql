-- ===================================================================
--  Dresse · Onboarding de nuevas usuarias
--
--  Anade a la tabla de perfiles la columna que recuerda si una usuaria
--  ya ha visto las pantallas de bienvenida.
--
--  COMO EJECUTARLO:
--   1. Entra en https://supabase.com e inicia sesion.
--   2. Abre el proyecto "crm-galiano".
--   3. Menu de la izquierda: "SQL Editor".
--   4. Boton "New query".
--   5. Copia y pega TODO este archivo (Ctrl+A y Ctrl+C aqui,
--      Ctrl+V alli). No selecciones solo un trozo.
--   6. Pulsa "Run".
--
--  Son solo dos ordenes. Si sale "Success. No rows returned",
--  ha ido bien.
--
--  ES SEGURO: no borra ni modifica ningun dato existente, y puedes
--  ejecutarlo varias veces sin que pase nada.
-- ===================================================================

-- 1) Crear la columna. Se crea con "default true" a proposito: asi las
-- cuentas que YA existen quedan marcadas como que ya vieron la
-- bienvenida y no les vuelve a salir.
alter table dresse.perfiles add column if not exists onboarded boolean not null default true;

-- 2) Cambiar el valor por defecto a "false". A partir de aqui, cada
-- cuenta NUEVA nace sin la bienvenida vista, asi que la vera la primera
-- vez que entre.
alter table dresse.perfiles alter column onboarded set default false;
