'use client';

import { useEffect, useState } from 'react';

export default function PWACheckPage() {
  const [checks, setChecks] = useState({
    manifest: '⏳ Verificando...',
    serviceWorker: '⏳ Verificando...',
    https: '⏳ Verificando...',
    icons: '⏳ Verificando...',
    installable: '⏳ Verificando...'
  });

  useEffect(() => {
    async function runChecks() {
      const newChecks = { ...checks };

      // Check HTTPS
      newChecks.https =
        window.location.protocol === 'https:'
          ? '✅ HTTPS activo'
          : '❌ Requiere HTTPS';

      // Check manifest
      try {
        const manifestResponse = await fetch('/manifest.json');
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json();
          newChecks.manifest = `✅ Manifest cargado (${manifest.name})`;

          // Check icons
          const icon = manifest.icons?.[0];
          if (icon) {
            const iconResponse = await fetch(icon.src);
            newChecks.icons = iconResponse.ok
              ? `✅ Icono accesible (${icon.src})`
              : `❌ Icono no accesible (${icon.src})`;
          }
        } else {
          newChecks.manifest = '❌ Manifest no accesible';
        }
      } catch (e) {
        newChecks.manifest = `❌ Error: ${e}`;
      }

      // Check Service Worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          newChecks.serviceWorker = registration
            ? `✅ Service Worker registrado (${registration.active ? 'activo' : 'instalando'})`
            : '❌ Service Worker no registrado';
        } catch (e) {
          newChecks.serviceWorker = `❌ Error: ${e}`;
        }
      } else {
        newChecks.serviceWorker = '❌ Service Worker no soportado';
      }

      // Check if installable
      newChecks.installable =
        '⚠️ Verifica manualmente en el menú del navegador';

      setChecks(newChecks);
    }

    runChecks();
  }, []);

  return (
    <div className='bg-background min-h-screen p-8'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='mb-6 text-3xl font-bold'>PWA Installation Checker</h1>

        <div className='space-y-4'>
          <div className='rounded-lg border p-4'>
            <h2 className='mb-2 font-semibold'>HTTPS</h2>
            <p className='font-mono text-sm'>{checks.https}</p>
          </div>

          <div className='rounded-lg border p-4'>
            <h2 className='mb-2 font-semibold'>Manifest</h2>
            <p className='font-mono text-sm'>{checks.manifest}</p>
          </div>

          <div className='rounded-lg border p-4'>
            <h2 className='mb-2 font-semibold'>Icons</h2>
            <p className='font-mono text-sm'>{checks.icons}</p>
          </div>

          <div className='rounded-lg border p-4'>
            <h2 className='mb-2 font-semibold'>Service Worker</h2>
            <p className='font-mono text-sm'>{checks.serviceWorker}</p>
          </div>

          <div className='rounded-lg border p-4'>
            <h2 className='mb-2 font-semibold'>Installable</h2>
            <p className='font-mono text-sm'>{checks.installable}</p>
          </div>
        </div>

        <div className='bg-muted mt-8 rounded-lg p-6'>
          <h3 className='mb-3 font-semibold'>Cómo instalar:</h3>
          <ul className='space-y-2 text-sm'>
            <li>
              <strong>Android Chrome:</strong> Menú (⋮) → "Instalar aplicación"
              o "Agregar a pantalla de inicio"
            </li>
            <li>
              <strong>iOS Safari:</strong> Compartir → "Agregar a pantalla de
              inicio"
            </li>
            <li>
              <strong>Desktop Chrome:</strong> Icono (+) en la barra de
              direcciones o Menú → "Instalar Moni"
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
