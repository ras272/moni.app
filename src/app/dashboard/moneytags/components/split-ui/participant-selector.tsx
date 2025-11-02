/**
 * =====================================================
 * COMPONENT: ParticipantSelector
 * =====================================================
 *
 * Selector de participantes con checkboxes y avatares.
 * Permite seleccionar quiénes participan en un gasto específico.
 *
 * @module moneytags/components/split-ui
 * @author Sistema
 * @version 1.0.0
 */

'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Participant {
  id: string;
  name: string;
  avatar_url?: string | null;
  phone?: string | null;
}

interface ParticipantSelectorProps {
  /** Lista completa de participantes del grupo */
  participants: Participant[];

  /** IDs de participantes seleccionados */
  selectedIds: string[];

  /** Callback cuando cambia la selección */
  onChange: (selectedIds: string[]) => void;

  /** Deshabilitar selector */
  disabled?: boolean;
}

export function ParticipantSelector({
  participants,
  selectedIds,
  onChange,
  disabled = false
}: ParticipantSelectorProps) {
  const handleToggle = (participantId: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedIds, participantId]);
    } else {
      onChange(selectedIds.filter((id) => id !== participantId));
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === participants.length) {
      // Deseleccionar todos
      onChange([]);
    } else {
      // Seleccionar todos
      onChange(participants.map((p) => p.id));
    }
  };

  const allSelected = selectedIds.length === participants.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  return (
    <div className='space-y-4'>
      {/* Header con botón "Seleccionar todos" */}
      <div className='flex items-center justify-between'>
        <Label className='text-sm font-medium'>
          ¿Quiénes participan en este gasto?
        </Label>
        <button
          type='button'
          onClick={handleSelectAll}
          disabled={disabled}
          className='text-primary hover:text-primary/80 text-xs font-medium transition-colors disabled:opacity-50'
        >
          {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
        </button>
      </div>

      {/* Contador de seleccionados */}
      <p className='text-muted-foreground text-xs'>
        {selectedIds.length} de {participants.length} participante(s)
        seleccionado(s)
      </p>

      {/* Lista de participantes */}
      <div className='space-y-2'>
        {participants.map((participant) => {
          const isSelected = selectedIds.includes(participant.id);

          return (
            <div
              key={participant.id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background hover:bg-muted/50'
              }`}
            >
              {/* Checkbox */}
              <Checkbox
                id={`participant-${participant.id}`}
                checked={isSelected}
                onCheckedChange={(checked) =>
                  handleToggle(participant.id, checked as boolean)
                }
                disabled={disabled}
              />

              {/* Avatar */}
              <Avatar className='h-9 w-9 shrink-0'>
                <AvatarImage
                  src={participant.avatar_url || ''}
                  alt={participant.name}
                />
                <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
                  {participant.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase() || '??'}
                </AvatarFallback>
              </Avatar>

              {/* Nombre y teléfono */}
              <label
                htmlFor={`participant-${participant.id}`}
                className='flex-1 cursor-pointer'
              >
                <p className='text-sm font-medium'>{participant.name}</p>
                {participant.phone && (
                  <p className='text-muted-foreground text-xs'>
                    {participant.phone}
                  </p>
                )}
              </label>
            </div>
          );
        })}
      </div>

      {/* Warning si no hay seleccionados */}
      {selectedIds.length === 0 && (
        <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950/20'>
          <p className='text-xs font-medium text-yellow-900 dark:text-yellow-100'>
            ⚠️ Debes seleccionar al menos un participante
          </p>
        </div>
      )}
    </div>
  );
}
