# 📦 Instalación de Dependencias

Este documento detalla los pasos para instalar las dependencias necesarias de Supabase y remover Clerk.

---

## ⚠️ IMPORTANTE: Ejecutar ANTES de iniciar la aplicación

Estas dependencias deben instalarse para que la autenticación funcione correctamente.

---

## 🔧 Comandos de Instalación

### Opción 1: Instalación rápida (recomendado)

```bash
# Instalar dependencias de Supabase
npm install @supabase/supabase-js @supabase/ssr

# Remover dependencias de Clerk
npm uninstall @clerk/nextjs @clerk/themes
```

### Opción 2: Con verificación

```bash
# 1. Instalar Supabase
npm install @supabase/supabase-js@latest @supabase/ssr@latest

# 2. Verificar instalación
npm list @supabase/supabase-js @supabase/ssr

# 3. Remover Clerk
npm uninstall @clerk/nextjs @clerk/themes

# 4. Verificar que Clerk fue removido
npm list @clerk/nextjs
```

---

## ✅ Verificación de Instalación

Después de ejecutar los comandos, verifica que las dependencias fueron instaladas correctamente:

```bash
npm list @supabase/supabase-js @supabase/ssr
```

Deberías ver algo como:

```
mni@0.1.0 C:\Users\...\mni
├── @supabase/ssr@0.x.x
└── @supabase/supabase-js@2.x.x
```

---

## 📋 Dependencias Instaladas

### @supabase/supabase-js
- **Versión**: 2.x (última)
- **Propósito**: Cliente principal de Supabase para autenticación, base de datos y storage
- **Uso**: `createBrowserClient()`, auth, database queries

### @supabase/ssr
- **Versión**: 0.x (última)
- **Propósito**: Utilidades para Server-Side Rendering con Supabase
- **Uso**: `createServerClient()`, manejo de cookies en Server Components y Middleware

---

## 🗑️ Dependencias Removidas

### @clerk/nextjs
- ❌ Removida - Ya no se usa
- Reemplazada por Supabase Auth

### @clerk/themes
- ❌ Removida - Ya no se usa
- Los estilos ahora son customizados con Tailwind

---

## 🚨 Errores Comunes

### Error: "Cannot find module '@supabase/ssr'"
**Solución**: Ejecuta `npm install @supabase/ssr`

### Error: "@clerk/nextjs is not installed"
**Solución**: Ignora este error. Clerk ya no se usa. Ejecuta `npm uninstall @clerk/nextjs`

### Error: "Module not found: Can't resolve '@clerk/nextjs'"
**Solución**: 
1. Verifica que todos los archivos fueron actualizados correctamente
2. Ejecuta `npm uninstall @clerk/nextjs`
3. Reinicia el servidor: `npm run dev`

---

## 🔄 Después de la Instalación

1. ✅ **Reinicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

2. ✅ **Verifica que no hay errores de imports**:
   - Abre el navegador en `http://localhost:3000`
   - Chequea la consola del navegador (F12)
   - Chequea la terminal del servidor

3. ✅ **Configura las variables de entorno**:
   - Sigue las instrucciones en `docs/SUPABASE_AUTH_SETUP.md`

---

## 📚 Próximos Pasos

Después de instalar las dependencias:

1. Configura `.env.local` con tus credenciales de Supabase
2. Inicia el servidor: `npm run dev`
3. Ve a `http://localhost:3000/auth/sign-up`
4. Regístrate y prueba la autenticación

**Guía completa**: Ver `docs/SUPABASE_AUTH_SETUP.md`
