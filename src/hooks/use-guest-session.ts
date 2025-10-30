'use client';

import { useState, useEffect } from 'react';

/**
 * Hook para gestionar la sesión de un usuario invitado (sin cuenta)
 *
 * Funcionalidades:
 * - Guarda el nombre del invitado en localStorage
 * - Genera un ID único persistente para el invitado
 * - Verifica si ya tiene una sesión activa
 *
 * @param groupId - ID del grupo para namespace del localStorage
 */
export function useGuestSession(groupId: string) {
  const [guestName, setGuestName] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Keys para localStorage
  const GUEST_NAME_KEY = `moni_guest_name_${groupId}`;
  const GUEST_ID_KEY = `moni_guest_id_${groupId}`;

  /**
   * Genera un ID único para el invitado
   * Formato: guest_[timestamp]_[random]
   */
  const generateGuestId = (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `guest_${timestamp}_${random}`;
  };

  /**
   * Inicializa la sesión del invitado desde localStorage
   */
  useEffect(() => {
    try {
      const savedName = localStorage.getItem(GUEST_NAME_KEY);
      const savedId = localStorage.getItem(GUEST_ID_KEY);

      if (savedName) {
        setGuestName(savedName);
      }

      if (savedId) {
        setGuestId(savedId);
      }
    } catch (error) {
      console.error('Error loading guest session:', error);
    } finally {
      setIsLoading(false);
    }
  }, [GUEST_NAME_KEY, GUEST_ID_KEY]);

  /**
   * Guarda el nombre del invitado y genera un ID único
   */
  const saveGuestName = (name: string): string => {
    try {
      const trimmedName = name.trim();

      if (!trimmedName) {
        throw new Error('El nombre no puede estar vacío');
      }

      // Guardar nombre
      localStorage.setItem(GUEST_NAME_KEY, trimmedName);
      setGuestName(trimmedName);

      // Generar y guardar ID si no existe
      let id = localStorage.getItem(GUEST_ID_KEY);
      if (!id) {
        id = generateGuestId();
        localStorage.setItem(GUEST_ID_KEY, id);
      }
      setGuestId(id);

      return id;
    } catch (error) {
      console.error('Error saving guest name:', error);
      throw error;
    }
  };

  /**
   * Limpia la sesión del invitado (útil para testing o cambio de usuario)
   */
  const clearGuestSession = () => {
    try {
      localStorage.removeItem(GUEST_NAME_KEY);
      localStorage.removeItem(GUEST_ID_KEY);
      setGuestName(null);
      setGuestId(null);
    } catch (error) {
      console.error('Error clearing guest session:', error);
    }
  };

  /**
   * Actualiza el nombre del invitado (si quiere cambiarlo)
   */
  const updateGuestName = (newName: string) => {
    try {
      const trimmedName = newName.trim();
      if (!trimmedName) {
        throw new Error('El nombre no puede estar vacío');
      }

      localStorage.setItem(GUEST_NAME_KEY, trimmedName);
      setGuestName(trimmedName);
    } catch (error) {
      console.error('Error updating guest name:', error);
      throw error;
    }
  };

  return {
    // Estado
    guestName,
    guestId,
    isLoading,
    hasSession: !!guestName && !!guestId,

    // Acciones
    saveGuestName,
    updateGuestName,
    clearGuestSession
  };
}
