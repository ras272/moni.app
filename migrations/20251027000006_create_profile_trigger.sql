-- Migration: create_profile_trigger
-- Description: Crea un trigger que automáticamente crea un perfil cuando se registra un usuario
-- Created: 2025-10-27
-- Version: 1.0
-- Dependencies: 20251027000001_create_base_schema.sql

BEGIN;

-- =====================================================
-- FUNCIÓN: Crear perfil automáticamente al registrar usuario
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    auth_id,
    email,
    full_name,
    country_code,
    default_currency,
    timezone
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'country_code', 'PY'),
    COALESCE(NEW.raw_user_meta_data->>'default_currency', 'PYG'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Asuncion')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Ejecutar función al insertar en auth.users
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger function: Crea automáticamente un perfil en public.profiles cuando se registra un nuevo usuario en auth.users';

COMMIT;
