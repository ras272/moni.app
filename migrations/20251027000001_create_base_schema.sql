-- Migration: create_base_schema
-- Description: Crea la estructura base con profiles, categories y funciones fundamentales
-- Created: 2025-10-27
-- Version: 1.0

BEGIN;

-- =====================================================
-- 1. CREAR ENUMS
-- =====================================================

CREATE TYPE category_type AS ENUM ('income', 'expense');

-- =====================================================
-- 2. CREAR TABLA: profiles
-- =====================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT UNIQUE,
  country_code TEXT NOT NULL DEFAULT 'PY',
  default_currency TEXT NOT NULL DEFAULT 'PYG',
  timezone TEXT NOT NULL DEFAULT 'America/Asuncion',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 3. CREAR TABLA: categories
-- =====================================================

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  type category_type NOT NULL DEFAULT 'expense',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_category UNIQUE(profile_id, name),
  CONSTRAINT system_no_owner CHECK (
    (is_system = TRUE AND profile_id IS NULL) OR 
    (is_system = FALSE AND profile_id IS NOT NULL)
  )
);

-- =====================================================
-- 4. ÍNDICES
-- =====================================================

CREATE INDEX idx_profiles_auth_id ON profiles(auth_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;

CREATE INDEX idx_categories_profile ON categories(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX idx_categories_system ON categories(is_system, type) WHERE is_system = TRUE;

-- =====================================================
-- 5. FUNCIÓN: Actualizar updated_at automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGERS: updated_at para profiles y categories
-- =====================================================

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. SEED DATA: Categorías del Sistema
-- =====================================================

-- Categorías de GASTOS
INSERT INTO categories (name, icon, color, type, is_system) VALUES
  ('Comida y Bebidas', '🍔', '#ef4444', 'expense', TRUE),
  ('Transporte', '🚗', '#3b82f6', 'expense', TRUE),
  ('Hogar', '🏠', '#10b981', 'expense', TRUE),
  ('Servicios', '⚡', '#f59e0b', 'expense', TRUE),
  ('Salud', '🏥', '#ec4899', 'expense', TRUE),
  ('Educación', '🎓', '#8b5cf6', 'expense', TRUE),
  ('Ocio y Entretenimiento', '🎮', '#06b6d4', 'expense', TRUE),
  ('Ropa y Accesorios', '👕', '#f43f5e', 'expense', TRUE),
  ('Regalos', '🎁', '#a855f7', 'expense', TRUE),
  ('Otros Gastos', '💳', '#6b7280', 'expense', TRUE);

-- Categorías de INGRESOS
INSERT INTO categories (name, icon, color, type, is_system) VALUES
  ('Salario', '💼', '#22c55e', 'income', TRUE),
  ('Freelance', '💰', '#14b8a6', 'income', TRUE),
  ('Inversiones', '📈', '#eab308', 'income', TRUE),
  ('Bonos', '🎉', '#fb923c', 'income', TRUE),
  ('Otros Ingresos', '💵', '#84cc16', 'income', TRUE);

COMMIT;
