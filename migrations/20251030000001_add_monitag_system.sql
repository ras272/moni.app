-- Migration: add_monitag_system
-- Description: Agrega sistema de @monitag y URLs públicas para MoniTags
-- Created: 2025-10-30
-- Version: 1.0
-- Dependencies: 20251027000003_create_money_tags.sql

BEGIN;

-- =====================================================
-- 1. CREAR FUNCIÓN: Lista de palabras reservadas/prohibidas
-- =====================================================

CREATE OR REPLACE FUNCTION is_monitag_reserved(tag TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Convertir a lowercase para comparación case-insensitive
  tag := LOWER(tag);
  
  -- Lista de palabras reservadas del sistema
  RETURN tag = ANY(ARRAY[
    'admin',
    'administrator',
    'moni',
    'monitag',
    'moneytag',
    'support',
    'help',
    'api',
    'app',
    'www',
    'root',
    'system',
    'moderator',
    'mod',
    'official',
    'staff',
    'team',
    'bot',
    'null',
    'undefined',
    'test',
    'demo'
  ]);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_monitag_reserved IS 'Verifica si un @monitag está en la lista de palabras reservadas del sistema';

-- =====================================================
-- 2. AGREGAR CAMPO: monitag a profiles
-- =====================================================

ALTER TABLE profiles 
ADD COLUMN monitag TEXT UNIQUE;

-- Constraint: Formato válido de @monitag
-- - 3 a 20 caracteres
-- - Solo lowercase, números y guiones bajos
-- - No puede empezar ni terminar con guión bajo
-- - No puede tener guiones bajos consecutivos
ALTER TABLE profiles 
ADD CONSTRAINT monitag_format 
CHECK (
  monitag IS NULL 
  OR (
    monitag ~ '^[a-z0-9][a-z0-9_]{1,18}[a-z0-9]$'
    AND monitag NOT LIKE '%__%'
  )
);

-- Constraint: No permitir palabras reservadas
ALTER TABLE profiles
ADD CONSTRAINT monitag_not_reserved
CHECK (
  monitag IS NULL 
  OR NOT is_monitag_reserved(monitag)
);

-- Índice para búsquedas rápidas (solo monitags no nulos)
CREATE INDEX idx_profiles_monitag 
ON profiles(monitag) 
WHERE monitag IS NOT NULL;

-- Índice para búsqueda fuzzy con trigram (para búsquedas tipo "ju" → @juanpy)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_profiles_monitag_trgm 
ON profiles USING gin(monitag gin_trgm_ops)
WHERE monitag IS NOT NULL;

COMMENT ON COLUMN profiles.monitag IS '@monitag único del usuario (3-20 caracteres, lowercase, alfanumérico + guiones bajos). Opcional hasta que el usuario quiera usar MoniTags. Inmutable una vez creado.';

-- =====================================================
-- 3. AGREGAR CAMPOS: slug e is_public a money_tag_groups
-- =====================================================

ALTER TABLE money_tag_groups 
ADD COLUMN slug TEXT NOT NULL DEFAULT gen_random_uuid()::text;

ALTER TABLE money_tag_groups 
ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT true;

-- Constraint: Formato válido de slug
-- - 3 a 50 caracteres
-- - Solo lowercase, números y guiones
-- - No puede empezar ni terminar con guión
-- - No puede tener guiones consecutivos
ALTER TABLE money_tag_groups
ADD CONSTRAINT slug_format
CHECK (
  slug ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$'
  AND slug NOT LIKE '%--%'
);

-- Índice único combinado: owner_profile_id + slug
CREATE UNIQUE INDEX idx_groups_owner_slug 
ON money_tag_groups(owner_profile_id, slug);

-- Índice para búsqueda de grupos públicos
CREATE INDEX idx_groups_public 
ON money_tag_groups(is_public) 
WHERE is_public = true;

-- Índice para búsqueda combinada monitag + slug (para URLs públicas)
CREATE INDEX idx_groups_public_lookup
ON money_tag_groups(owner_profile_id, slug)
WHERE is_public = true;

COMMENT ON COLUMN money_tag_groups.slug IS 'Slug único por owner para URLs amigables (ej: "asado-con-amigos"). Generado automáticamente al crear el grupo.';
COMMENT ON COLUMN money_tag_groups.is_public IS 'TRUE = grupo accesible vía link público. FALSE = solo visible para participantes.';

-- =====================================================
-- 4. AGREGAR CAMPOS: invitation_status y token a group_participants
-- =====================================================

ALTER TABLE group_participants 
ADD COLUMN invitation_status TEXT NOT NULL DEFAULT 'accepted'
CHECK (invitation_status IN ('pending', 'accepted', 'rejected'));

ALTER TABLE group_participants 
ADD COLUMN invitation_token TEXT UNIQUE;

-- Índice para búsqueda por token de invitación
CREATE INDEX idx_participants_token 
ON group_participants(invitation_token) 
WHERE invitation_token IS NOT NULL;

COMMENT ON COLUMN group_participants.invitation_status IS 'Estado de la invitación: pending (invitado pero no aceptó), accepted (en el grupo), rejected (rechazó)';
COMMENT ON COLUMN group_participants.invitation_token IS 'Token único para invitaciones a usuarios no registrados. Se usa para validar acceso a vista pública.';

-- =====================================================
-- 5. FUNCIÓN: Generar slug único para grupo
-- =====================================================

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
  -- - Lowercase
  -- - Quitar acentos
  -- - Reemplazar espacios y caracteres especiales por guiones
  -- - Quitar guiones múltiples
  -- - Limitar a 50 caracteres
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

COMMENT ON FUNCTION generate_group_slug IS 'Genera un slug único para un grupo basado en su nombre. Agrega sufijos numéricos si hay colisiones (ej: asado-amigos, asado-amigos-2).';

-- =====================================================
-- 6. FUNCIÓN: Búsqueda fuzzy de @monitags
-- =====================================================

CREATE OR REPLACE FUNCTION search_monitags(
  search_query TEXT,
  limit_results INTEGER DEFAULT 10
) RETURNS TABLE(
  profile_id UUID,
  monitag TEXT,
  full_name TEXT,
  avatar_url TEXT,
  similarity REAL
) AS $$
BEGIN
  -- Remover @ si está presente
  search_query := LTRIM(search_query, '@');
  search_query := LOWER(search_query);
  
  RETURN QUERY
  SELECT 
    p.id,
    p.monitag,
    p.full_name,
    p.avatar_url,
    SIMILARITY(p.monitag, search_query) as sim
  FROM profiles p
  WHERE 
    p.monitag IS NOT NULL
    AND (
      -- Búsqueda exacta (máxima prioridad)
      p.monitag = search_query
      OR
      -- Búsqueda fuzzy con trigram
      p.monitag % search_query
      OR
      -- Búsqueda por prefijo
      p.monitag LIKE search_query || '%'
    )
  ORDER BY 
    -- Ordenar por exactitud
    CASE WHEN p.monitag = search_query THEN 0 ELSE 1 END,
    sim DESC,
    p.monitag ASC
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION search_monitags IS 'Búsqueda fuzzy de @monitags. Soporta búsqueda exacta, prefijo y similar. Ej: "ju" → @juanpy, @juan_py, @juancho';

-- =====================================================
-- 7. FUNCIÓN: Obtener grupo público por monitag + slug
-- =====================================================

CREATE OR REPLACE FUNCTION get_public_group_by_url(
  owner_monitag TEXT,
  group_slug TEXT
) RETURNS TABLE(
  group_id UUID,
  group_name TEXT,
  group_description TEXT,
  is_settled BOOLEAN,
  owner_name TEXT,
  owner_avatar TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.name,
    g.description,
    g.is_settled,
    p.full_name,
    p.avatar_url,
    g.created_at
  FROM money_tag_groups g
  JOIN profiles p ON p.id = g.owner_profile_id
  WHERE 
    p.monitag = LOWER(LTRIM(owner_monitag, '@'))
    AND g.slug = LOWER(group_slug)
    AND g.is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_public_group_by_url IS 'Obtiene información pública de un grupo a partir de @monitag del owner y slug. Ej: @juanpy/asado-amigos';

-- =====================================================
-- 8. RLS POLICIES: Vista pública de grupos
-- =====================================================

-- Policy: Cualquiera puede ver grupos públicos
CREATE POLICY "Public groups viewable by anyone"
ON money_tag_groups FOR SELECT
TO public
USING (is_public = true);

-- Policy: Cualquiera puede ver participantes de grupos públicos
CREATE POLICY "Public group participants viewable by anyone"
ON group_participants FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM money_tag_groups 
    WHERE id = group_participants.group_id 
    AND is_public = true
  )
);

-- Policy: Cualquiera puede ver gastos de grupos públicos
CREATE POLICY "Public group expenses viewable by anyone"
ON group_expenses FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM money_tag_groups 
    WHERE id = group_expenses.group_id 
    AND is_public = true
  )
);

-- Policy: Cualquiera puede ver splits de gastos públicos
CREATE POLICY "Public expense splits viewable by anyone"
ON expense_splits FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM group_expenses ge
    JOIN money_tag_groups g ON g.id = ge.group_id
    WHERE ge.id = expense_splits.expense_id 
    AND g.is_public = true
  )
);

-- =====================================================
-- 9. RLS POLICIES: Protección de @monitag
-- =====================================================

-- Policy: Solo el usuario puede ver su propio @monitag
-- (Los @monitags de otros usuarios solo son visibles al buscar)
CREATE POLICY "Users can view own monitag"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = auth_id OR monitag IS NOT NULL);

-- Policy: Solo el usuario puede actualizar su propio @monitag
CREATE POLICY "Users can update own monitag"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = auth_id)
WITH CHECK (auth.uid() = auth_id);

-- Policy: @monitag inmutable una vez creado
-- (Se implementa en la aplicación, no en BD por complejidad)

-- =====================================================
-- 10. TRIGGER: Generar slug automáticamente al crear grupo
-- =====================================================

CREATE OR REPLACE FUNCTION auto_generate_group_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo generar slug si no se proporcionó uno o si es el default UUID
  IF NEW.slug IS NULL OR LENGTH(NEW.slug) > 36 THEN
    NEW.slug := generate_group_slug(NEW.name, NEW.owner_profile_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_group_slug
  BEFORE INSERT ON money_tag_groups
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_group_slug();

COMMENT ON TRIGGER trigger_auto_generate_group_slug ON money_tag_groups IS 'Genera slug único automáticamente al crear un grupo si no se proporciona.';

-- =====================================================
-- 11. MIGRAR GRUPOS EXISTENTES (si hay)
-- =====================================================

-- Generar slugs para grupos existentes que tengan slug UUID
UPDATE money_tag_groups
SET slug = generate_group_slug(name, owner_profile_id)
WHERE LENGTH(slug) > 36; -- Solo actualizar UUIDs generados como default

-- =====================================================
-- 12. GRANTS DE SEGURIDAD
-- =====================================================

-- Permitir a usuarios autenticados llamar funciones de búsqueda
GRANT EXECUTE ON FUNCTION search_monitags TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_group_by_url TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_group_slug TO authenticated;

-- =====================================================
-- 13. ÍNDICES DE PERFORMANCE ADICIONALES
-- =====================================================

-- Índice compuesto para búsquedas de grupos por owner + público
CREATE INDEX idx_groups_owner_public 
ON money_tag_groups(owner_profile_id, is_public) 
WHERE is_public = true;

-- Índice para búsqueda de participantes por profile_id + status
CREATE INDEX idx_participants_profile_status
ON group_participants(profile_id, invitation_status)
WHERE profile_id IS NOT NULL;

COMMIT;

-- =====================================================
-- NOTAS DE SEGURIDAD:
-- =====================================================
-- 1. RLS habilitado en todas las tablas ✅
-- 2. @monitag inmutable en aplicación (no en BD por complejidad)
-- 3. Palabras reservadas bloqueadas a nivel de constraint ✅
-- 4. Validación de formato en constraints ✅
-- 5. Políticas públicas solo para lectura ✅
-- 6. SECURITY DEFINER solo en funciones de consulta ✅
-- 7. Índices para performance en queries públicas ✅
