-- Migration: Backfill missing profiles
-- Description: Crear perfiles para usuarios existentes que no tienen perfil asociado
-- Created: 2025-10-27
-- Version: 1.0
-- Dependencies: 20251027000006_create_profile_trigger.sql

BEGIN;

-- =====================================================
-- BACKFILL: Crear perfiles para usuarios sin perfil
-- =====================================================

-- Esta migración corrige el caso donde usuarios se registraron
-- ANTES de que se creara el trigger on_auth_user_created.
-- Es idempotente: se puede ejecutar múltiples veces sin duplicar datos.

INSERT INTO public.profiles (
  auth_id,
  email,
  full_name,
  country_code,
  default_currency,
  timezone
)
SELECT 
  u.id as auth_id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name,
  COALESCE(u.raw_user_meta_data->>'country_code', 'PY') as country_code,
  COALESCE(u.raw_user_meta_data->>'default_currency', 'PYG') as default_currency,
  COALESCE(u.raw_user_meta_data->>'timezone', 'America/Asuncion') as timezone
FROM auth.users u
LEFT JOIN public.profiles p ON p.auth_id = u.id
WHERE p.id IS NULL -- Solo insertar para usuarios sin perfil
  AND u.deleted_at IS NULL; -- Excluir usuarios eliminados

-- =====================================================
-- VERIFICACIÓN: Contar perfiles creados
-- =====================================================

DO $$
DECLARE
  profiles_created INTEGER;
BEGIN
  SELECT COUNT(*) INTO profiles_created
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.auth_id;
  
  RAISE NOTICE 'Backfill completado. Total de perfiles: %', profiles_created;
END $$;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.profiles IS 
'Perfiles de usuario vinculados a Supabase Auth. 
NOTA: Los perfiles nuevos se crean automáticamente por el trigger on_auth_user_created.
Esta migración crea perfiles para usuarios históricos que existían antes del trigger.';

COMMIT;
