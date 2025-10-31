'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Smartphone,
  Palette,
  Globe,
  Moon,
  Sun,
  Monitor,
  Volume2
} from 'lucide-react';
import { useConfiguracion } from '@/hooks/use-configuracion';
import type { UserPreferences } from '@/features/configuracion/utils/configuracion-schema';

export function PreferenciasCard() {
  const { updatePreferences, getPreferences } = useConfiguracion();
  const [preferences, setPreferences] = useState<UserPreferences>({
    email_notifications: true,
    push_notifications: false,
    language: 'es-PY',
    theme: 'light',
    timezone: 'America/Asuncion'
  });

  useEffect(() => {
    const savedPrefs = getPreferences();
    if (savedPrefs) {
      setPreferences(savedPrefs);
    }
  }, [getPreferences]);

  const handlePreferenceChange = async (
    key: keyof UserPreferences,
    value: boolean | string
  ) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    await updatePreferences({ [key]: value });
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light':
        return <Sun className='h-4 w-4' />;
      case 'dark':
        return <Moon className='h-4 w-4' />;
      case 'system':
        return <Monitor className='h-4 w-4' />;
      default:
        return <Sun className='h-4 w-4' />;
    }
  };

  const getThemeLabel = (theme: string) => {
    switch (theme) {
      case 'light':
        return 'Modo Claro';
      case 'dark':
        return 'Modo Oscuro';
      case 'system':
        return 'Sistema';
      default:
        return 'Claro';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <Bell className='h-5 w-5' />
          <CardTitle>Preferencias</CardTitle>
          <Badge variant='secondary'>Personalizable</Badge>
        </div>
        <CardDescription>
          Configura tu experiencia y notificaciones
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Notificaciones */}
        <div className='space-y-4'>
          <h4 className='flex items-center gap-2 text-sm font-medium'>
            <Bell className='h-4 w-4' />
            Notificaciones
          </h4>

          <div className='space-y-3 pl-6'>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <Label className='text-sm'>Email</Label>
                <p className='text-muted-foreground text-xs'>
                  Resúmenes semanales de tus finanzas
                </p>
              </div>
              <Switch
                checked={preferences.email_notifications}
                onCheckedChange={(checked) =>
                  handlePreferenceChange('email_notifications', checked)
                }
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <Label className='flex items-center gap-2 text-sm'>
                  <Smartphone className='h-3 w-3' />
                  Push
                </Label>
                <p className='text-muted-foreground text-xs'>
                  Alertas instantáneas en tu dispositivo
                </p>
              </div>
              <Switch
                checked={preferences.push_notifications}
                onCheckedChange={(checked) =>
                  handlePreferenceChange('push_notifications', checked)
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Apariencia */}
        <div className='space-y-4'>
          <h4 className='flex items-center gap-2 text-sm font-medium'>
            <Palette className='h-4 w-4' />
            Apariencia
          </h4>

          <div className='grid gap-3 pl-6'>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <Label className='text-sm'>Tema</Label>
                <p className='text-muted-foreground text-xs'>
                  Elige tu preferencia visual
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <div className='bg-muted flex items-center gap-1 rounded-md p-1'>
                  {(['light', 'dark', 'system'] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => handlePreferenceChange('theme', theme)}
                      className={`flex items-center gap-1 rounded-md p-1.5 transition-colors ${
                        preferences.theme === theme
                          ? 'bg-background shadow-sm'
                          : 'hover:bg-background/50'
                      }`}
                    >
                      {getThemeIcon(theme)}
                      <span className='text-xs'>{getThemeLabel(theme)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Regional */}
        <div className='space-y-4'>
          <h4 className='flex items-center gap-2 text-sm font-medium'>
            <Globe className='h-4 w-4' />
            Regional
          </h4>

          <div className='grid gap-3 pl-6'>
            <div className='space-y-2'>
              <Label className='text-sm'>Idioma</Label>
              <select
                className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                value={preferences.language}
                onChange={(e) =>
                  handlePreferenceChange('language', e.target.value)
                }
              >
                <option value='es-PY'>🇵🇾 Español (Paraguay)</option>
                <option value='es'>🇪🇸 Español</option>
                <option value='en'>🇬🇧 English</option>
              </select>
            </div>

            <div className='space-y-2'>
              <Label className='text-sm'>Zona Horaria</Label>
              <select
                className='border-input bg-background w-full rounded-md border px-3 py-2 text-sm'
                value={preferences.timezone}
                onChange={(e) =>
                  handlePreferenceChange('timezone', e.target.value)
                }
              >
                <option value='America/Asuncion'>🇵🇾 Asunción (GMT-4)</option>
                <option value='America/New_York'>🇺🇸 Nueva York (GMT-5)</option>
                <option value='America/Los_Angeles'>
                  🇺🇸 Los Ángeles (GMT-8)
                </option>
                <option value='America/Mexico_City'>🇲🇽 México (GMT-6)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className='bg-muted/30 rounded-lg p-4'>
          <div className='flex items-start gap-2'>
            <Volume2 className='text-muted-foreground mt-0.5 h-4 w-4' />
            <div className='space-y-1'>
              <p className='text-sm font-medium'>Consejo</p>
              <p className='text-muted-foreground text-xs'>
                Las preferencias se guardan localmente para una experiencia más
                rápida en tu dispositivo.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
