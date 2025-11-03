# 🎨 Paleta de Colores - Moni Dashboard

## Colores Principales

### Verde Moni (Principal)
```tsx
// Verde principal del logo
className="bg-[#1F7D67] text-white"
// O usando la variable CSS
style={{ backgroundColor: 'var(--verde-principal)' }}
```

### Colores de Acento
- **Verde Success**: `#10B981` - Para ingresos, operaciones exitosas
- **Azul Info**: `#3B82F6` - Para MoneyTags, información general
- **Amarillo Warning**: `#F59E0B` - Para alertas, metas pendientes
- **Rojo Error**: `#EF4444` - Para gastos, errores, deudas
- **Morado Premium**: `#8B5CF6` - Para features premium, destacados

## Cards por Tipo

### 1. Card de Ingresos
```tsx
<div className="bg-[var(--card-income-bg)] border border-[var(--card-income-border)] rounded-lg p-4">
  <div className="flex items-center gap-2">
    <TrendingUp className="text-[var(--success)]" />
    <span className="text-lg font-semibold text-[var(--success)]">+Gs. 5.000.000</span>
  </div>
  <p className="text-sm text-muted-foreground mt-1">Salario Mensual</p>
</div>
```

### 2. Card de Gastos
```tsx
<div className="bg-[var(--card-expense-bg)] border border-[var(--card-expense-border)] rounded-lg p-4">
  <div className="flex items-center gap-2">
    <TrendingDown className="text-[var(--error)]" />
    <span className="text-lg font-semibold text-[var(--error)]">-Gs. 1.500.000</span>
  </div>
  <p className="text-sm text-muted-foreground mt-1">Supermercado</p>
</div>
```

### 3. Card de MoneyTag/Grupo
```tsx
<div className="bg-[var(--card-moneytag-bg)] border border-[var(--card-moneytag-border)] rounded-lg p-4">
  <div className="flex items-center gap-2">
    <Users className="text-[var(--info)]" />
    <span className="text-lg font-semibold text-[var(--info)]">@asado</span>
  </div>
  <p className="text-sm text-muted-foreground mt-1">4 participantes</p>
</div>
```

### 4. Card Featured/Premium
```tsx
<div className="bg-[var(--card-featured-bg)] border border-[var(--card-featured-border)] rounded-lg p-4">
  <div className="flex items-center gap-2">
    <Sparkles className="text-[var(--purple)]" />
    <span className="text-lg font-semibold text-[var(--purple)]">Premium</span>
  </div>
  <p className="text-sm text-muted-foreground mt-1">Funciones avanzadas</p>
</div>
```

### 5. Card de Advertencia/Meta
```tsx
<div className="bg-[var(--card-warning-bg)] border border-[var(--card-warning-border)] rounded-lg p-4">
  <div className="flex items-center gap-2">
    <Target className="text-[var(--warning)]" />
    <span className="text-lg font-semibold text-[var(--warning)]">Meta 60%</span>
  </div>
  <p className="text-sm text-muted-foreground mt-1">Ahorro mensual</p>
</div>
```

### 6. Card de Balance Principal (Destacada)
```tsx
<div className="bg-gradient-to-br from-[#1F7D67] to-[#52D4BA] rounded-lg p-6 text-white shadow-lg">
  <p className="text-sm opacity-90">Balance Total</p>
  <p className="text-3xl font-bold mt-2">Gs. 3.500.000</p>
  <div className="flex items-center gap-2 mt-4 text-sm opacity-90">
    <TrendingUp size={16} />
    <span>+12% este mes</span>
  </div>
</div>
```

## Badges y Tags

### Badge de Income
```tsx
<span className="px-2 py-1 bg-[var(--card-income-bg)] text-[var(--success)] border border-[var(--card-income-border)] rounded-full text-xs font-medium">
  Ingreso
</span>
```

### Badge de Expense
```tsx
<span className="px-2 py-1 bg-[var(--card-expense-bg)] text-[var(--error)] border border-[var(--card-expense-border)] rounded-full text-xs font-medium">
  Gasto
</span>
```

### Badge de MoneyTag
```tsx
<span className="px-2 py-1 bg-[var(--card-moneytag-bg)] text-[var(--info)] border border-[var(--card-moneytag-border)] rounded-full text-xs font-medium">
  @grupo
</span>
```

## Botones

### Botón Principal (Verde Moni)
```tsx
<button className="bg-[#1F7D67] hover:bg-[#196654] text-white px-4 py-2 rounded-lg transition-colors">
  Agregar Gasto
</button>
```

### Botón Secundario (Info)
```tsx
<button className="bg-[var(--info)] hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
  Ver MoneyTags
</button>
```

### Botón Warning
```tsx
<button className="bg-[var(--warning)] hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors">
  Revisar Meta
</button>
```

### Botón Destructivo
```tsx
<button className="bg-[var(--error)] hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors">
  Eliminar
</button>
```

## Gráficos (Charts)

```tsx
// Para Recharts
const chartConfig = {
  ingresos: {
    color: '#10B981', // Verde success
    label: 'Ingresos'
  },
  gastos: {
    color: '#EF4444', // Rojo error
    label: 'Gastos'
  },
  balance: {
    color: '#1F7D67', // Verde principal
    label: 'Balance'
  },
  moneytags: {
    color: '#3B82F6', // Azul info
    label: 'MoneyTags'
  },
  premium: {
    color: '#8B5CF6', // Morado
    label: 'Premium'
  }
}
```

## Estados de Hover y Active

```tsx
// Card con hover effect
<div className="bg-white border border-gray-200 hover:bg-[#F8FFFE] hover:border-[#D1E8E4] transition-all duration-200 rounded-lg p-4 cursor-pointer">
  Card con hover verde sutil
</div>

// Card activa/seleccionada
<div className="bg-[var(--card-income-bg)] border-2 border-[var(--success)] rounded-lg p-4">
  Card seleccionada
</div>
```

## Skeleton/Loading States

```tsx
// Usar el verde muy claro para skeleton
<div className="animate-pulse">
  <div className="h-4 bg-[var(--card-income-bg)] rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-[var(--card-income-bg)] rounded w-1/2"></div>
</div>
```

## Combinaciones Recomendadas

### Dashboard Overview
- **Balance Card**: Gradiente verde (#1F7D67 → #52D4BA)
- **Income Card**: Fondo verde claro con border e icon verde success
- **Expenses Card**: Fondo rojo claro con border e icon rojo
- **MoneyTags Card**: Fondo azul claro con border e icon azul

### Lista de Transacciones
- **Row Income**: Fondo blanco, text verde, icon verde
- **Row Expense**: Fondo blanco, text rojo, icon rojo
- **Row MoneyTag**: Badge azul a la derecha

### Settings/Premium
- **Premium Features**: Card morado claro con border morado
- **Regular Features**: Card blanca con border gris

## Notas de Implementación

1. **Consistencia**: Siempre usa el mismo color para el mismo tipo de dato:
   - Verde (#10B981) = Ingresos
   - Rojo (#EF4444) = Gastos
   - Azul (#3B82F6) = MoneyTags
   - Amarillo (#F59E0B) = Metas/Alertas
   - Morado (#8B5CF6) = Premium

2. **Contraste**: Los fondos de cards son muy claros para mantener legibilidad

3. **Accesibilidad**: Todos los colores tienen suficiente contraste con blanco/negro

4. **Dark Mode**: Ya está configurado en globals.css, las cards ajustarán automáticamente
