-- Migration v2: adicionar tipo 'draw' para ferramenta de pincel livre
-- Execute no SQL Editor do Supabase Dashboard

ALTER TABLE tactic_elements DROP CONSTRAINT tactic_elements_type_check;
ALTER TABLE tactic_elements ADD CONSTRAINT tactic_elements_type_check
  CHECK (type IN ('player', 'route', 'grenade', 'text', 'draw'));
