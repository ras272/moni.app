'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGuestSession } from '@/hooks/use-guest-session';
import {
  GuestNameModal,
  GuestBanner,
  PublicGroupParticipants,
  PublicGroupExpenses,
  PublicDebtSummary
} from '@/components/monitags';
import { addGuestParticipant } from '@/lib/actions/guest-participants';
import { toast } from 'sonner';
import type {
  GroupParticipant,
  GroupExpenseWithRelations,
  GroupDebt
} from '@/types/database';

interface PublicGroupViewProps {
  /** ID del grupo */
  groupId: string;
  /** Nombre del grupo */
  groupName: string;
  /** ID del perfil del owner */
  ownerProfileId: string;
  /** Lista de participantes */
  participants: GroupParticipant[];
  /** Lista de gastos */
  expenses: GroupExpenseWithRelations[];
  /** Lista de deudas */
  debts: GroupDebt[];
}

/**
 * Vista pública completa de un grupo para usuarios sin cuenta
 *
 * Funcionalidades:
 * - Modal para capturar nombre del invitado (primera visita)
 * - Gestión de sesión con localStorage
 * - Muestra participantes, gastos y deudas
 * - Resumen personalizado de deuda del visitante
 * - Banner para incentivar registro
 *
 * @example
 * ```tsx
 * <PublicGroupView
 *   groupId={group.id}
 *   groupName={group.name}
 *   ownerProfileId={group.owner_profile_id}
 *   participants={participants}
 *   expenses={expenses}
 *   debts={debts}
 * />
 * ```
 */
export function PublicGroupView({
  groupId,
  groupName,
  ownerProfileId,
  participants,
  expenses,
  debts
}: PublicGroupViewProps) {
  // Router para refrescar datos
  const router = useRouter();

  // Estado de sesión del invitado
  const { guestName, guestId, isLoading, hasSession, saveGuestName } =
    useGuestSession(groupId);

  // Estado del modal
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Muestra el modal si no hay sesión activa
   */
  useEffect(() => {
    if (!isLoading && !hasSession) {
      setShowModal(true);
    }
  }, [isLoading, hasSession]);

  /**
   * Guarda el nombre del invitado en localStorage y crea participante en BD
   */
  const handleSaveName = async (name: string) => {
    try {
      setIsSaving(true);

      // Guardar en localStorage y obtener guestId
      const generatedGuestId = saveGuestName(name);

      // Crear participante guest en la base de datos
      const result = await addGuestParticipant(groupId, name, generatedGuestId);

      if (!result.success) {
        toast.error('Error al unirse al grupo', {
          description: result.error
        });
        return;
      }

      // Éxito: cerrar modal y refrescar para mostrar como participante
      toast.success('¡Bienvenido al grupo!', {
        description: `Ahora apareces en la lista de participantes`
      });

      setShowModal(false);

      // Refrescar la página para obtener lista actualizada de participantes
      router.refresh();
    } catch (error) {
      console.error('Error saving guest name:', error);
      toast.error('Error inesperado', {
        description: 'No se pudo unir al grupo'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Mostrar loading mientras carga la sesión
  if (isLoading) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <div className='text-center'>
          <div className='border-primary mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent' />
          <p className='text-muted-foreground mt-4 text-sm'>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal para capturar nombre */}
      <GuestNameModal
        open={showModal}
        onOpenChange={setShowModal}
        groupName={groupName}
        onSave={handleSaveName}
        isLoading={isSaving}
      />

      {/* Contenido principal */}
      <div className='space-y-6'>
        {/* Banner para invitados */}
        {guestName && <GuestBanner guestName={guestName} dismissible />}

        {/* Grid de componentes */}
        <div className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
          {/* Gastos */}
          <div className='md:col-span-2 xl:col-span-1'>
            <PublicGroupExpenses expenses={expenses} showTotal />
          </div>

          {/* Participantes */}
          <div className='md:col-span-1 xl:col-span-1'>
            <PublicGroupParticipants
              participants={participants}
              ownerProfileId={ownerProfileId}
              currentGuestName={guestName}
            />
          </div>

          {/* Resumen de deuda del visitante */}
          {guestName && (
            <div className='md:col-span-1 xl:col-span-1'>
              <PublicDebtSummary visitorName={guestName} debts={debts} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
