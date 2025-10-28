-- Migración: Agregar protección contra duplicación de settlements
-- Fecha: 2025-10-28
-- 
-- OBJETIVO: Prevenir que se inserten settlements duplicados
-- 
-- ESTRATEGIA:
-- 1. Agregar constraint UNIQUE que impida duplicados exactos
-- 2. Agregar índice para mejorar rendimiento de consultas

-- Constraint UNIQUE para evitar duplicados exactos en el mismo día
-- Permite que la misma persona pague varias veces en días diferentes
ALTER TABLE group_settlements
ADD CONSTRAINT unique_settlement_per_day 
UNIQUE (group_id, from_participant_id, to_participant_id, amount, settlement_date);

-- Índice para mejorar consultas de settlements por grupo
CREATE INDEX IF NOT EXISTS idx_settlements_group_date 
ON group_settlements(group_id, settlement_date DESC);

-- Índice para consultas de settlements por participante
CREATE INDEX IF NOT EXISTS idx_settlements_participants 
ON group_settlements(from_participant_id, to_participant_id);

COMMENT ON CONSTRAINT unique_settlement_per_day ON group_settlements IS 
'Previene settlements duplicados del mismo monto entre las mismas personas en el mismo día. 
Permite pagos múltiples en días diferentes o de montos diferentes.';
