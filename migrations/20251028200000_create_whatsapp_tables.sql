-- =====================================================
-- WhatsApp Bot MVP - Database Schema
-- =====================================================
-- Autor: MONI Team
-- Fecha: 2025-10-28
-- Descripción: Tablas para integración de WhatsApp Bot
-- =====================================================

-- =====================================================
-- TABLA: whatsapp_connections
-- =====================================================
-- Almacena las vinculaciones entre números de WhatsApp y usuarios MONI
-- Un número solo puede estar vinculado a un perfil a la vez

CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relación con usuario
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Número de WhatsApp (formato internacional sin +)
  -- Ejemplo: 595991234567 (Paraguay)
  phone_number TEXT NOT NULL UNIQUE,
  
  -- Estado de la conexión
  is_active BOOLEAN DEFAULT true,
  
  -- Token temporal para vinculación (expira en 15 minutos)
  verification_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Auditoría
  linked_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE whatsapp_connections IS 'Vinculaciones entre números de WhatsApp y perfiles de usuario MONI';
COMMENT ON COLUMN whatsapp_connections.profile_id IS 'Usuario MONI propietario de la conexión';
COMMENT ON COLUMN whatsapp_connections.phone_number IS 'Número de WhatsApp en formato internacional sin + (ej: 595991234567)';
COMMENT ON COLUMN whatsapp_connections.is_active IS 'FALSE cuando el usuario desvincula su WhatsApp';
COMMENT ON COLUMN whatsapp_connections.verification_token IS 'Token JWT temporal para vincular cuenta (expira en 15 min)';
COMMENT ON COLUMN whatsapp_connections.last_message_at IS 'Última vez que el usuario envió un mensaje al bot';

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_whatsapp_phone ON whatsapp_connections(phone_number);
CREATE INDEX idx_whatsapp_profile ON whatsapp_connections(profile_id);
CREATE INDEX idx_whatsapp_active ON whatsapp_connections(is_active);
CREATE INDEX idx_whatsapp_last_message ON whatsapp_connections(last_message_at DESC);

-- =====================================================
-- TABLA: whatsapp_message_logs
-- =====================================================
-- Registra todos los mensajes intercambiados con el bot
-- Útil para debugging, analytics y auditoría

CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relación con conexión
  connection_id UUID REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  
  -- Dirección del mensaje
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  
  -- Contenido del mensaje
  message_text TEXT NOT NULL,
  
  -- Intención detectada (solo para inbound)
  intent TEXT,
  
  -- Metadata adicional en formato JSON
  -- Ejemplos:
  -- - inbound: { "parsed_amount": 50000, "detected_category": "Comida" }
  -- - outbound: { "transaction_id": "uuid", "balance": 1250000 }
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE whatsapp_message_logs IS 'Log de todos los mensajes del bot WhatsApp para auditoría y analytics';
COMMENT ON COLUMN whatsapp_message_logs.direction IS 'inbound: usuario → bot | outbound: bot → usuario';
COMMENT ON COLUMN whatsapp_message_logs.intent IS 'Intención detectada: add_expense, get_balance, help, etc.';
COMMENT ON COLUMN whatsapp_message_logs.metadata IS 'Datos adicionales en formato JSON flexible';

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_message_logs_connection ON whatsapp_message_logs(connection_id);
CREATE INDEX idx_message_logs_created ON whatsapp_message_logs(created_at DESC);
CREATE INDEX idx_message_logs_intent ON whatsapp_message_logs(intent);
CREATE INDEX idx_message_logs_direction ON whatsapp_message_logs(direction);

-- Para búsquedas en metadata JSONB
CREATE INDEX idx_message_logs_metadata ON whatsapp_message_logs USING GIN (metadata);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: whatsapp_connections
-- =====================================================

-- SELECT: Los usuarios solo ven sus propias conexiones
CREATE POLICY "Users can view own whatsapp connections"
  ON whatsapp_connections
  FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_id = auth.uid()
    )
  );

-- INSERT: Los usuarios pueden crear sus propias conexiones
CREATE POLICY "Users can create own whatsapp connections"
  ON whatsapp_connections
  FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_id = auth.uid()
    )
  );

-- UPDATE: Los usuarios pueden actualizar sus propias conexiones
CREATE POLICY "Users can update own whatsapp connections"
  ON whatsapp_connections
  FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_id = auth.uid()
    )
  );

-- DELETE: Los usuarios pueden eliminar sus propias conexiones
CREATE POLICY "Users can delete own whatsapp connections"
  ON whatsapp_connections
  FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_id = auth.uid()
    )
  );

-- =====================================================
-- POLICIES: whatsapp_message_logs
-- =====================================================

-- SELECT: Los usuarios solo ven logs de sus propias conexiones
CREATE POLICY "Users can view own whatsapp message logs"
  ON whatsapp_message_logs
  FOR SELECT
  USING (
    connection_id IN (
      SELECT id FROM whatsapp_connections 
      WHERE profile_id IN (
        SELECT id FROM profiles WHERE auth_id = auth.uid()
      )
    )
  );

-- INSERT: El sistema puede insertar logs (webhook API)
-- Nota: La API del webhook usará service_role para insertar
CREATE POLICY "System can insert message logs"
  ON whatsapp_message_logs
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- TRIGGER: updated_at automático
-- =====================================================

CREATE OR REPLACE FUNCTION update_whatsapp_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_whatsapp_connections_updated_at
  BEFORE UPDATE ON whatsapp_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_connections_updated_at();

-- =====================================================
-- FUNCIÓN: Limpiar tokens expirados (cron job futuro)
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_whatsapp_tokens()
RETURNS void AS $$
BEGIN
  UPDATE whatsapp_connections
  SET verification_token = NULL,
      token_expires_at = NULL
  WHERE token_expires_at IS NOT NULL
    AND token_expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_whatsapp_tokens IS 'Limpia tokens de vinculación expirados. Ejecutar cada 1 hora con cron.';

-- =====================================================
-- ÍNDICES DE PERFORMANCE ADICIONALES
-- =====================================================

-- Para rate limiting: contar mensajes recientes
CREATE INDEX idx_message_logs_recent 
  ON whatsapp_message_logs(connection_id, created_at DESC) 
  WHERE direction = 'inbound';

-- Para analytics: mensajes por intención
CREATE INDEX idx_message_logs_intent_created 
  ON whatsapp_message_logs(intent, created_at DESC) 
  WHERE intent IS NOT NULL;

-- =====================================================
-- DATOS INICIALES (opcional)
-- =====================================================

-- Ninguno por ahora. Las conexiones se crean cuando el usuario vincula su WhatsApp.

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
