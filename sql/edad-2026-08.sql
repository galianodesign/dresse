-- ═══════════════════════════════════════════════════════════════════
--  Dresse · Control de edad (aplicado el 2026-08-06)
--  YA ESTA APLICADO. Queda como registro.
--
--  Los terminos de uso exigen 14 anos (LOPDGDD art. 7: por debajo de esa
--  edad hace falta el consentimiento de quien tenga la patria potestad).
--  Escribir la regla y no aplicarla es peor que no tenerla.
--
--  La columna es NULLABLE a proposito: null significa "aun no se ha
--  preguntado", y es lo que hace aparecer la pantalla de ControlEdad. Los
--  perfiles que ya existian entran con null y se les preguntara una vez.
-- ═══════════════════════════════════════════════════════════════════

alter table dresse.perfiles add column if not exists nacimiento date;

comment on column dresse.perfiles.nacimiento is
  'Fecha de nacimiento declarada por la usuaria. Minimo 14 anos (LOPDGDD art. 7).';

-- Nota: es una declaracion, no una verificacion. Nadie comprueba un documento.
-- Es lo habitual en aplicaciones que no piden el DNI y lo que la ley espera de
-- un servicio de este tamano, pero no confundir una cosa con la otra.
