# 🚀 MONI - Setup Rápido

## ✅ Estado Actual

El proyecto está **completamente configurado** con:

- ✅ **Supabase Auth** implementado (reemplazó Clerk)
- ✅ **6 migraciones SQL** aplicadas en Supabase
- ✅ **25 políticas RLS** seguras activas
- ✅ **Hooks modulares** para datos (Accounts, Transactions, MoneyTags)
- ✅ **Build exitoso** sin errores TypeScript
- ✅ **Código en GitHub**: https://github.com/ras272/moni.app.git

---

## 📋 Próximos Pasos

### 1. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Copiar el template
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**¿Dónde obtener las credenciales?**
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto (las migraciones ya están aplicadas)
3. Ve a `Settings > API`
4. Copia **Project URL** y **anon/public key**

### 2. Instalar Dependencias (si no están instaladas)

```bash
npm install
```

### 3. Iniciar el Servidor

```bash
npm run dev
```

### 4. Testing de Autenticación

1. **Registro de Usuario**:
   - Ve a `http://localhost:3000/auth/sign-up`
   - Registra un usuario de prueba
   - Verifica que redirige a `/dashboard`

2. **Verificar Perfil Auto-Creado**:
   - En Supabase Dashboard, ve a `Database > Table Editor`
   - Tabla `profiles` debe tener tu usuario
   - Tabla `auth.users` en `Authentication`

3. **Logout**:
   - En dashboard, clic en avatar (esquina superior derecha)
   - Selecciona "Cerrar Sesión"
   - Verifica que redirige a `/auth/sign-in`

4. **Login**:
   - Ingresa con las credenciales creadas
   - Verifica acceso al dashboard

---

## 📊 Estructura de la Base de Datos

### Tablas Creadas (8)

1. **profiles** - Perfiles de usuarios (auto-creado con trigger)
2. **categories** - 15 categorías seed (Ingresos/Gastos)
3. **accounts** - Cuentas multi-moneda (PYG/USD)
4. **transactions** - Transacciones con balance automático
5. **money_tag_groups** - Grupos de gastos compartidos
6. **group_participants** - Participantes (usuarios + externos)
7. **group_expenses** - Gastos del grupo
8. **expense_splits** - División de gastos

### Seguridad RLS

✅ **25 políticas activas** que garantizan:
- Los usuarios solo ven sus propios datos
- No pueden modificar datos de otros usuarios
- Usa subconsulta segura: `profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())`

---

## 📁 Documentación Completa

- **`docs/SUPABASE_AUTH_SETUP.md`** - Guía completa de configuración
- **`docs/DATABASE_ARCHITECTURE_PLAN.md`** - Arquitectura de base de datos
- **`docs/IMPLEMENTACION_SUPABASE_AUTH_RESUMEN.md`** - Resumen técnico
- **`docs/CORRECCION_RLS_CRITICA.md`** - Fix de seguridad RLS
- **`docs/INSTALL_DEPENDENCIES.md`** - Instalación de dependencias

---

## 🎯 Arquitectura del Código

```
src/
├── app/
│   ├── auth/
│   │   ├── actions.ts              # Server Actions (signUp, signIn, signOut)
│   │   ├── callback/route.ts       # OAuth callback
│   │   ├── sign-in/                # Página login
│   │   └── sign-up/                # Página registro
│   └── dashboard/
│       ├── cuentas/                # CRUD Cuentas
│       ├── transacciones/          # CRUD Transacciones
│       └── moneytags/              # CRUD MoneyTags
├── lib/
│   └── supabase/
│       ├── server.ts               # Cliente servidor
│       ├── client.ts               # Cliente browser
│       ├── accounts.ts             # Query functions
│       ├── transactions.ts         # Query functions
│       └── money-tags.ts           # Query functions
├── hooks/
│   ├── accounts/                   # Hooks modulares
│   ├── transactions/               # Hooks modulares
│   ├── categories/                 # Hooks modulares
│   └── money-tags/                 # Hooks modulares
├── types/
│   └── database.ts                 # TypeScript types
└── middleware.ts                   # Protección de rutas
```

---

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build (verificar que compila)
npm run build

# Lint
npm run lint

# Type check
npm run type-check
```

---

## 🐛 Troubleshooting

### Error: "Module not found: @supabase/ssr"
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Error: "Module not found: @tanstack/react-query"
```bash
npm install @tanstack/react-query
```

### Error: "Invalid API Key"
- Verifica que `.env.local` existe
- Verifica que las variables están correctas
- Reinicia el servidor: `Ctrl+C` → `npm run dev`

### No aparece mi perfil en la tabla
- Verifica que el trigger `on_auth_user_created` existe
- Chequea logs de Supabase: `Database > Logs`
- Verifica RLS policies en la tabla `profiles`

---

## 📞 Soporte

Si encuentras problemas:

1. **Logs de Supabase**: `Database > Logs` en Dashboard
2. **Consola del navegador**: F12 > Console
3. **Logs del servidor**: Terminal donde corre `npm run dev`
4. **Documentación**: `docs/SUPABASE_AUTH_SETUP.md`

---

## 🎉 ¡Listo para Desarrollar!

Una vez configurado `.env.local` y probado la autenticación, puedes:

1. Conectar los componentes del dashboard con los hooks reales
2. Reemplazar mock data por queries de Supabase
3. Implementar funcionalidades adicionales
4. Desplegar en Vercel/Netlify

**Estado actual**: Base de datos lista, autenticación funcionando, build exitoso ✅
