-- Migration: fix_group_slug_trigger
-- Description: Corrige el trigger de generación automática de slugs para grupos
-- Created: 2025-10-30
-- Version: 1.1
-- Fixes: Bug donde UUIDs de exactamente 36 caracteres no activaban el trigger

BEGIN;

-- =====================================================
-- 1. ACTUALIZAR FUNCIÓN: auto_generate_group_slug
-- =====================================================

CREATE OR REPLACE FUNCTION auto_generate_group_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Generar slug si:
  -- 1. No se proporcionó uno (NULL)
  -- 2. Es un UUID (longitud >= 36 y contiene guiones en posiciones típicas de UUID)
  -- 3. Es el slug default generado por gen_random_uuid()

  IF NEW.slug IS NULL
     OR LENGTH(NEW.slug) >= 36
     OR NEW.slug ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' THEN
    NEW.slug := generate_group_slug(NEW.name, NEW.owner_profile_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_generate_group_slug IS 'Genera slug único automáticamente al crear un grupo. Detecta y reemplaza UUIDs por slugs amigables basados en el nombre del grupo.';

-- =====================================================
-- 2. MIGRAR GRUPOS EXISTENTES CON UUID COMO SLUG
-- =====================================================

-- Actualizar grupos que tienen UUID como slug (exactamente 36 caracteres con patrón UUID)
UPDATE money_tag_groups
SET slug = generate_group_slug(name, owner_profile_id)
WHERE slug ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$';

COMMIT;

-- =====================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- =====================================================
-- Ejecutar este query para verificar que no queden UUIDs:
-- SELECT id, name, slug FROM money_tag_groups WHERE slug ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$';
