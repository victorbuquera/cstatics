ALTER TABLE tactic_elements DROP CONSTRAINT tactic_elements_type_check;
ALTER TABLE tactic_elements ADD CONSTRAINT tactic_elements_type_check
  CHECK (type IN ('player', 'route', 'grenade', 'text', 'draw', 'watch'));
