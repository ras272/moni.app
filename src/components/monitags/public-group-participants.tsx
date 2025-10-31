'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Crown } from 'lucide-react';
import type { GroupParticipant } from '@/types/database';

interface PublicGroupParticipantsProps {
  /** Lista de participantes del grupo */
  participants: GroupParticipant[];
  /** ID del perfil del owner (para marcar con corona) */
  ownerProfileId: string;
  /** Nombre del invitado actual (para destacar "TÚ") */
  currentGuestName?: string | null;
}

/**
 * Componente para mostrar la lista de participantes en la vista pública
 *
 * Características:
 * - Destaca al creador del grupo con una corona
 * - Destaca al usuario actual (invitado) con badge "TÚ"
 * - Muestra avatares con iniciales
 * - Compatible con participantes con y sin cuenta
 *
 * @example
 * ```tsx
 * <PublicGroupParticipants
 *   participants={participants}
 *   ownerProfileId={group.owner_profile_id}
 *   currentGuestName="Pedro"
 * />
 * ```
 */
export function PublicGroupParticipants({
  participants,
  ownerProfileId,
  currentGuestName
}: PublicGroupParticipantsProps) {
  /**
   * Genera las iniciales de un nombre
   * Ejemplo: "Juan Pérez" → "JP"
   */
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  /**
   * Verifica si el participante es el usuario actual (invitado)
   */
  const isCurrentGuest = (participant: GroupParticipant): boolean => {
    if (!currentGuestName) return false;

    // Comparación case-insensitive
    return (
      participant.name.toLowerCase().trim() ===
      currentGuestName.toLowerCase().trim()
    );
  };

  /**
   * Verifica si el participante es el owner
   */
  const isOwner = (participant: GroupParticipant): boolean => {
    return participant.profile_id === ownerProfileId;
  };

  return (
    <Card className='bg-card border shadow-sm'>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <Users className='text-muted-foreground h-5 w-5' />
          <div className='flex-1'>
            <CardTitle>Participantes</CardTitle>
            <CardDescription>
              {participants.length} miembro
              {participants.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className='space-y-2'>
          {participants.map((participant) => {
            const owner = isOwner(participant);
            const isYou = isCurrentGuest(participant);

            return (
              <div
                key={participant.id}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                  isYou ? 'border-primary bg-primary/5' : ''
                }`}
              >
                {/* Avatar con imagen real o iniciales */}
                {owner ? (
                  <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950'>
                    <Crown className='h-5 w-5 text-amber-600 dark:text-amber-500' />
                  </div>
                ) : (
                  <Avatar className='h-10 w-10 shrink-0'>
                    <AvatarImage
                      src={participant.avatar_url || ''}
                      alt={participant.name}
                    />
                    <AvatarFallback
                      className={
                        isYou
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }
                    >
                      {getInitials(participant.name)}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Información del participante */}
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p
                      className={`truncate font-medium ${isYou ? 'text-primary' : ''}`}
                    >
                      {participant.name}
                    </p>

                    {/* Badges */}
                    {owner && (
                      <Badge variant='secondary' className='gap-1 text-xs'>
                        <Crown className='h-3 w-3' />
                        Creador
                      </Badge>
                    )}
                    {isYou && (
                      <Badge variant='default' className='text-xs'>
                        TÚ
                      </Badge>
                    )}
                  </div>

                  {/* Teléfono si existe (no mostrar para guests) */}
                  {participant.phone &&
                    !participant.phone.startsWith('guest:') && (
                      <p className='text-muted-foreground truncate text-xs'>
                        {participant.phone}
                      </p>
                    )}
                </div>

                {/* Indicador de cuenta */}
                {participant.profile_id && (
                  <div className='shrink-0'>
                    <div
                      className='h-2 w-2 rounded-full bg-green-500'
                      title='Usuario registrado'
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className='text-muted-foreground mt-4 flex flex-wrap gap-4 text-xs'>
          <div className='flex items-center gap-2'>
            <div className='h-2 w-2 rounded-full bg-green-500' />
            <span>Usuario registrado</span>
          </div>
          <div className='flex items-center gap-2'>
            <Crown className='h-3 w-3' />
            <span>Creador del grupo</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
