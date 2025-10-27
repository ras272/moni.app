# 🔐 Configuración de Supabase Auth

Este documento describe cómo configurar la autenticación con Supabase en MONI.

## 📋 Prerrequisitos

1. **Cuenta de Supabase**: Crea una cuenta gratuita en [https://supabase.com](https://supabase.com)
2. **Node.js 18+**: Asegúrate de tener Node.js instalado
3. **Proyecto Supabase**: Crea un nuevo proyecto en Supabase

---

## 🚀 Paso 1: Instalar Dependencias

```bash
# Instalar paquetes de Supabase
npm install @supabase/supabase-js @supabase/ssr

# Remover Clerk (si aún está instalado)
npm uninstall @clerk/nextjs
```

---

## 🔧 Paso 2: Configurar Variables de Entorno

1. **Obtener credenciales de Supabase**:
   - Ve a tu proyecto en Supabase Dashboard
   - Navega a `Settings > API`
   - Copia el **Project URL** y el **anon/public key**

2. **Crear archivo `.env.local`** en la raíz del proyecto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Site URL (cambiar en producción)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 💾 Paso 3: Aplicar Migraciones SQL

Las migraciones ya fueron aplicadas automáticamente durante el desarrollo. Estas incluyen:

✅ **Migración 1**: Base schema (profiles, categories, ENUMs)
✅ **Migración 2**: Accounts & Transactions con triggers de balance
✅ **Migración 3**: MoneyTags (grupos compartidos)
✅ **Migración 4**: 25 políticas RLS seguras
✅ **Migración 5**: Comentarios y documentación
✅ **Migración 6**: Trigger de auto-creación de perfiles

**Estado**: ✅ Base de datos lista para usar

---

## 🔒 Paso 4: Configurar Email en Supabase

1. Ve a `Authentication > Email Templates` en Supabase Dashboard
2. Personaliza los templates de email (opcional):
   - Confirm signup
   - Magic Link
   - Reset password

3. **Email Provider** (Producción):
   - Por defecto usa el SMTP de Supabase (limitado)
   - Para producción, configura tu propio SMTP en `Project Settings > Auth > SMTP Settings`

---

## 🎨 Paso 5: Configurar URL Redirect (Opcional)

En `Authentication > URL Configuration` de Supabase:

```
Site URL: https://tu-dominio.com
Redirect URLs: 
  - http://localhost:3000/auth/callback
  - https://tu-dominio.com/auth/callback
```

---

## 🧪 Paso 6: Testing

### Prueba de Registro:

1. Inicia la aplicación: `npm run dev`
2. Ve a `http://localhost:3000/auth/sign-up`
3. Registra un nuevo usuario con:
   - Nombre completo
   - Email válido
   - Contraseña (mínimo 6 caracteres)
4. Verifica que:
   - Se crea el usuario en `auth.users`
   - Se crea automáticamente el perfil en `public.profiles`
   - Redirige a `/dashboard`

### Prueba de Login:

1. Ve a `http://localhost:3000/auth/sign-in`
2. Ingresa credenciales
3. Verifica acceso al dashboard

### Prueba de Logout:

1. En el dashboard, haz clic en el avatar (esquina superior derecha)
2. Selecciona "Cerrar Sesión"
3. Verifica que redirige a `/auth/sign-in`

### Prueba de Protección de Rutas:

1. Cierra sesión
2. Intenta acceder a `http://localhost:3000/dashboard`
3. Verifica que redirige automáticamente a `/auth/sign-in`

---

## 🔐 Seguridad: RLS Policies

La base de datos implementa **25 políticas RLS** que garantizan:

- ✅ Los usuarios solo ven sus propios datos
- ✅ No pueden modificar datos de otros usuarios
- ✅ Las políticas usan subconsulta segura: `profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())`
- ✅ Separación entre `profiles.id` (PK interna) y `profiles.auth_id` (FK a auth.users.id)

---

## 📁 Arquitectura de Archivos

```
src/
├── app/
│   └── auth/
│       ├── actions.ts              # Server Actions (signUp, signIn, signOut)
│       ├── callback/
│       │   └── route.ts            # Callback handler para OAuth/Magic Link
│       ├── sign-in/
│       │   └── [[...sign-in]]/
│       │       └── page.tsx        # Página de login
│       └── sign-up/
│           └── [[...sign-up]]/
│               └── page.tsx        # Página de registro
├── features/
│   └── auth/
│       └── components/
│           ├── sign-in-form.tsx    # Formulario de login
│           ├── sign-in-view.tsx    # Vista de login
│           ├── sign-up-form.tsx    # Formulario de registro
│           └── sign-up-view.tsx    # Vista de registro
├── lib/
│   └── supabase/
│       ├── server.ts               # Cliente de Supabase para Server Components
│       └── client.ts               # Cliente de Supabase para Client Components
├── components/
│   └── layout/
│       └── user-nav.tsx            # Menú de usuario con logout
└── middleware.ts                   # Protección de rutas y refresh de sesión
```

---

## 🚨 Troubleshooting

### Error: "Invalid API Key"
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de reiniciar el servidor después de modificar `.env.local`

### Error: "Failed to fetch session"
- Verifica que el proyecto de Supabase esté activo
- Chequea la URL del proyecto (no incluyas trailing slash)

### El perfil no se crea automáticamente:
- Verifica que la Migración 6 fue aplicada correctamente
- Chequea los logs de Supabase en `Database > Logs`
- Ejecuta manualmente:
  ```sql
  SELECT * FROM auth.users;  -- Ver usuarios creados
  SELECT * FROM profiles;    -- Ver perfiles creados
  ```

### RLS está bloqueando queries:
- Verifica que el usuario tenga un perfil en `public.profiles`
- Chequea que `profiles.auth_id` apunte al `auth.users.id` correcto
- Revisa las políticas RLS en `Database > Policies`

---

## ✅ Checklist de Configuración

- [ ] Dependencias instaladas (`@supabase/supabase-js`, `@supabase/ssr`)
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Proyecto de Supabase creado y activo
- [ ] Migraciones SQL aplicadas (automático)
- [ ] Test de registro exitoso
- [ ] Test de login exitoso
- [ ] Test de logout exitoso
- [ ] Test de protección de rutas funciona
- [ ] Trigger de perfil automático funciona

---

## 🎉 ¡Todo Listo!

Si completaste todos los pasos, tu aplicación MONI está lista para usar con Supabase Auth. Los usuarios pueden:

1. ✅ Registrarse con email/password
2. ✅ Iniciar sesión
3. ✅ Cerrar sesión
4. ✅ Acceder al dashboard protegido
5. ✅ Ver su perfil en el menú de usuario

**Próximos pasos**: Integrar los hooks de lectura de datos (Transactions, Accounts, MoneyTags) con Supabase.
