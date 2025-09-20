# 🌳 Datos de Prueba - Biodiversity App

## 📊 Árboles Mock Disponibles

### 🗄️ Árboles de "Base de Datos" (Mock)

1. **Ceiba del Campus** ✅ Aprobado
   - Científico: *Ceiba pentandra*
   - Ubicación: Entrada principal
   - Estado: Excelente
   - Creado: Hace 7 días

2. **Guayacán Amarillo** ⏳ Pendiente
   - Científico: *Tabebuia chrysantha*
   - Ubicación: Con flores amarillas
   - Estado: Bueno
   - Creado: Hace 3 días

3. **Nogal Cafetero** ❌ Rechazado
   - Científico: *Cordia alliodora*
   - Ubicación: Área de construcción
   - Estado: Regular
   - Creado: Hace 5 días

4. **Jacaranda** ✅ Aprobado
   - Científico: *Jacaranda mimosifolia*
   - Ubicación: Área ornamental
   - Estado: Excelente
   - Creado: Hace 1 día

5. **Samán** ⏳ Pendiente
   - Científico: *Samanea saman*
   - Ubicación: Área de sombra
   - Estado: Bueno
   - Creado: Hace 2 días

### 📱 Árboles Locales (Solo primera vez)

1. **Árbol Local Pendiente** 📱 Local
   - Científico: *Ficus benjamina*
   - Estado: Pendiente sincronización
   - Creado: Hace 4 horas

2. **Palma Local** 📱 Local (Error)
   - Científico: *Phoenix canariensis*
   - Estado: Error de sincronización
   - Creado: Hace 2 horas

## 🎯 Cómo Probar

### 1. Login Inicial
```
Email: explorer@vibo.co
Password: explorer123
```

### 2. Ver Lista Completa
- Ve al tab "Explorer"
- Deberías ver **7 árboles total**:
  - 5 de "base de datos" (mock)
  - 2 locales (solo primera vez)

### 3. Filtros Disponibles
- **Todos**: Muestra todos los árboles
- **Míos**: Solo árboles del usuario actual
- **Aprobados**: Solo árboles con estado aprobado
- **Pendientes**: Solo árboles pendientes
- **Locales**: Solo árboles guardados localmente
- **Rechazados**: Solo árboles rechazados

### 4. Crear Nuevo Árbol
- Clic en "+" para agregar
- El nuevo árbol aparecerá inmediatamente
- Se guardará como "Local" con estado "Pendiente"

## 🔧 Para Limpiar Datos

Si quieres empezar de cero:

1. **Abrir DevTools** (F12)
2. **Ir a Application/Storage**
3. **Eliminar localStorage** con clave `@biodiversity_trees`
4. **Recargar la página**

## 📋 Estados de Árboles

- ✅ **Aprobado**: Verde - Árbol verificado por científico
- ⏳ **Pendiente**: Amarillo - Esperando revisión
- ❌ **Rechazado**: Rojo - No aprobado por científico
- 📱 **Local**: Azul - Guardado localmente, no sincronizado

## 🎉 ¡Ahora Deberías Ver Todos los Árboles!

La lista de Explorer debería mostrar todos los árboles con diferentes estados y colores para una experiencia completa de prueba.
