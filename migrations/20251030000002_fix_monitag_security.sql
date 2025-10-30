-- Migration: fix_monitag_security
-- Description: Corrige problemas críticos de seguridad en sistema de @monitag
-- Created: 2025-10-30
-- Version: 1.1
-- Dependencies: 20251030000001_add_monitag_system.sql

BEGIN;

-- =====================================================
-- 1. CORREGIR RLS POLICIES DE PROFILES (CRÍTICO)
-- =====================================================

-- Remover policies inseguras
DROP POLICY IF EXISTS "Users can view own monitag" ON profiles;
DROP POLICY IF EXISTS "Users can update own monitag" ON profiles;

-- Policy CORRECTA: Solo ver tu propio profile completo
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = auth_id);

-- Policy: Solo actualizar tu propio profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = auth_id)
WITH CHECK (auth.uid() = auth_id);

-- Nota: La búsqueda de @monitags se hace vía función search_monitags()
-- que usa SECURITY DEFINER y solo expone: profile_id, monitag, full_name, avatar_url
-- Esto previene exposición de email, phone, y otros datos sensibles ✅

-- =====================================================
-- 2. AGREGAR CONSTRAINT: @monitag inmutable
-- =====================================================

-- Función para prevenir cambios de monitag una vez creado
CREATE OR REPLACE FUNCTION prevent_monitag_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el monitag ya existía y se intenta cambiar, bloquear
  IF OLD.monitag IS NOT NULL AND NEW.monitag IS DISTINCT FROM OLD.monitag THEN
    RAISE EXCEPTION '@monitag es inmutable una vez creado. No se puede cambiar de "%" a "%"', OLD.monitag, NEW.monitag;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_monitag_change
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_monitag_change();

COMMENT ON TRIGGER trigger_prevent_monitag_change ON profiles IS 'Previene cambios de @monitag una vez creado (inmutabilidad)';

-- =====================================================
-- 3. AGREGAR EXTENSIÓN UNACCENT (si no existe)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS unaccent;

-- Actualizar función generate_group_slug para usar UNACCENT
CREATE OR REPLACE FUNCTION generate_group_slug(
  group_name TEXT,
  owner_id UUID
) RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
  max_attempts INTEGER := 100;
BEGIN
  -- Convertir nombre a slug
  -- Intentar usar UNACCENT, si falla usar reemplazo manual
  BEGIN
    base_slug := LOWER(
      TRIM(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              UNACCENT(group_name),
              '[^a-z0-9]+', '-', 'g'
            ),
            '-+', '-', 'g'
          ),
          '^-|-$', '', 'g'
        )
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: Reemplazo manual si UNACCENT falla
    base_slug := group_name;
    base_slug := REPLACE(base_slug, 'á', 'a');
    base_slug := REPLACE(base_slug, 'é', 'e');
    base_slug := REPLACE(base_slug, 'í', 'i');
    base_slug := REPLACE(base_slug, 'ó', 'o');
    base_slug := REPLACE(base_slug, 'ú', 'u');
    base_slug := REPLACE(base_slug, 'ñ', 'n');
    base_slug := REPLACE(base_slug, 'Á', 'a');
    base_slug := REPLACE(base_slug, 'É', 'e');
    base_slug := REPLACE(base_slug, 'Í', 'i');
    base_slug := REPLACE(base_slug, 'Ó', 'o');
    base_slug := REPLACE(base_slug, 'Ú', 'u');
    base_slug := REPLACE(base_slug, 'Ñ', 'n');
    
    base_slug := LOWER(
      TRIM(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              base_slug,
              '[^a-z0-9]+', '-', 'gi'
            ),
            '-+', '-', 'g'
          ),
          '^-|-$', '', 'g'
        )
      )
    );
  END;
  
  -- Limitar longitud
  base_slug := SUBSTRING(base_slug FROM 1 FOR 45);
  
  -- Si el slug está vacío después de sanitizar, usar fallback
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'grupo';
  END IF;
  
  -- Intentar slug base sin sufijo
  final_slug := base_slug;
  
  -- Si existe, agregar sufijo numérico
  WHILE EXISTS (
    SELECT 1 FROM money_tag_groups 
    WHERE owner_profile_id = owner_id 
    AND slug = final_slug
  ) AND counter < max_attempts LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  -- Si después de max_attempts aún no hay slug único, agregar UUID corto
  IF counter >= max_attempts THEN
    final_slug := base_slug || '-' || SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8);
  END IF;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. MEJORAR RLS DE GRUPOS PÚBLICOS
-- =====================================================

-- Remover policies existentes si hay conflictos
DROP POLICY IF EXISTS "Public groups viewable by anyone" ON money_tag_groups;
DROP POLICY IF EXISTS "Public group participants viewable by anyone" ON group_participants;
DROP POLICY IF EXISTS "Public group expenses viewable by anyone" ON group_expenses;
DROP POLICY IF EXISTS "Public expense splits viewable by anyone" ON expense_splits;

-- Re-crear policies con nombres más específicos
CREATE POLICY "moni_public_groups_select"
ON money_tag_groups FOR SELECT
TO anon, authenticated
USING (is_public = true);

CREATE POLICY "moni_public_participants_select"
ON group_participants FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM money_tag_groups 
    WHERE id = group_participants.group_id 
    AND is_public = true
  )
);

CREATE POLICY "moni_public_expenses_select"
ON group_expenses FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM money_tag_groups 
    WHERE id = group_expenses.group_id 
    AND is_public = true
  )
);

CREATE POLICY "moni_public_splits_select"
ON expense_splits FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_expenses ge
    JOIN money_tag_groups g ON g.id = ge.group_id
    WHERE ge.id = expense_splits.expense_id 
    AND g.is_public = true
  )
);

-- =====================================================
-- 5. AGREGAR ÍNDICE PARA VALIDACIÓN DE MONITAG
-- =====================================================

-- Índice para validar disponibilidad rápidamente
CREATE INDEX IF NOT EXISTS idx_profiles_monitag_lower 
ON profiles(LOWER(monitag)) 
WHERE monitag IS NOT NULL;

-- =====================================================
-- 6. FUNCIÓN: Validar disponibilidad de @monitag
-- =====================================================

CREATE OR REPLACE FUNCTION is_monitag_available(desired_tag TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  desired_tag := LOWER(TRIM(BOTH '@' FROM desired_tag));
  
  -- Verificar que no esté reservado
  IF is_monitag_reserved(desired_tag) THEN
    RETURN false;
  END IF;
  
  -- Verificar que no esté en uso
  IF EXISTS (SELECT 1 FROM profiles WHERE monitag = desired_tag) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_monitag_available TO authenticated;

COMMENT ON FUNCTION is_monitag_available IS 'Verifica si un @monitag está disponible (no reservado y no en uso)';

-- =====================================================
-- 7. FUNCIÓN: Sugerir @monitags alternativos
-- =====================================================

CREATE OR REPLACE FUNCTION suggest_monitags(desired_tag TEXT, limit_results INTEGER DEFAULT 5)
RETURNS TABLE(suggestion TEXT) AS $$
DECLARE
  base_tag TEXT;
  counter INTEGER := 1;
BEGIN
  base_tag := LOWER(TRIM(BOTH '@' FROM desired_tag));
  
  -- Sugerir con sufijos numéricos
  WHILE counter <= limit_results LOOP
    IF is_monitag_available(base_tag || counter::text) THEN
      RETURN QUERY SELECT base_tag || counter::text;
    END IF;
    counter := counter + 1;
  END LOOP;
  
  -- Sugerir con guión bajo
  IF is_monitag_available(base_tag || '_') THEN
    RETURN QUERY SELECT base_tag || '_';
  END IF;
  
  -- Sugerir con prefijo "el_" o "la_"
  IF is_monitag_available('el_' || base_tag) THEN
    RETURN QUERY SELECT 'el_' || base_tag;
  END IF;
  
  IF is_monitag_available('la_' || base_tag) THEN
    RETURN QUERY SELECT 'la_' || base_tag;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION suggest_monitags TO authenticated;

COMMENT ON FUNCTION suggest_monitags IS 'Sugiere @monitags alternativos si el deseado no está disponible';

-- =====================================================
-- 8. AUDITORÍA: Log de creación de @monitags
-- =====================================================

-- Tabla para auditar creación de monitags
CREATE TABLE IF NOT EXISTS monitag_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  monitag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_monitag_audit_profile ON monitag_audit_log(profile_id);
CREATE INDEX idx_monitag_audit_created ON monitag_audit_log(created_at DESC);

-- Trigger para registrar creación de monitag
CREATE OR REPLACE FUNCTION log_monitag_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo log cuando se crea un monitag (antes era NULL)
  IF OLD.monitag IS NULL AND NEW.monitag IS NOT NULL THEN
    INSERT INTO monitag_audit_log (profile_id, monitag)
    VALUES (NEW.id, NEW.monitag);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_monitag_creation
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.monitag IS NULL AND NEW.monitag IS NOT NULL)
  EXECUTE FUNCTION log_monitag_creation();

-- RLS para audit log (solo el usuario puede ver su propio log)
ALTER TABLE monitag_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own monitag audit log"
ON monitag_audit_log FOR SELECT
TO authenticated
USING (profile_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

COMMENT ON TABLE monitag_audit_log IS 'Log de auditoría de creación de @monitags';

COMMIT;

-- =====================================================
-- RESUMEN DE CORRECCIONES DE SEGURIDAD:
-- =====================================================
-- ✅ RLS de profiles corregido: Solo profile propio visible completo
-- ✅ Búsqueda de @monitags segura vía función SECURITY DEFINER
-- ✅ @monitag inmutable una vez creado (trigger)
-- ✅ Extensión unaccent agregada con fallback
-- ✅ Políticas públicas mejoradas con nombres únicos
-- ✅ Función de validación de disponibilidad de @monitag
-- ✅ Función de sugerencias de @monitags alternativos
-- ✅ Auditoría de creación de @monitags
-- ✅ DROP POLICY IF EXISTS para prevenir conflictos
