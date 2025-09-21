# 🧪 SISTEMA DE APROBACIÓN DE CIENTÍFICOS

## 📋 Resumen
Sistema completo para manejar el registro y aprobación de científicos con interfaz temporal de explorador.

## 🗄️ Cambios en Base de Datos

### Campo Agregado: `scientist_approval_status`
```sql
ALTER TABLE users ADD COLUMN scientist_approval_status ENUM('pending', 'approved', 'rejected') NULL DEFAULT NULL AFTER role;
```

### Valores Posibles:
- `NULL`: Para exploradores y admins (no aplica)
- `'pending'`: Científico registrado, esperando aprobación
- `'approved'`: Científico aprobado, acceso completo
- `'rejected'`: Científico rechazado (futuro uso)

## 🔄 Flujo de Usuario

### 1. Registro de Científico:
- Usuario se registra seleccionando rol "científico"
- Sistema automáticamente establece `scientist_approval_status = 'pending'`
- Usuario puede ingresar inmediatamente a la aplicación

### 2. Experiencia Pre-Aprobación:
- Ve interfaz completa de **explorador**
- Mensaje prominente: "Científico en Espera de Aprobación"
- Pestañas disponibles: Home, Plantas, Animales, Mapa, Perfil
- **Sin acceso** a funciones de científico

### 3. Post-Aprobación:
- Admin cambia estado a `'approved'`
- Usuario ve interfaz completa de **científico**
- Acceso a pestaña "Científico" para aprobaciones
- Puntos y estadísticas de científico

## 🎯 Lógica de Interfaz

### Condiciones Implementadas:

#### Científico Pendiente:
```javascript
user?.role === 'scientist' && user?.scientist_approval_status === 'pending'
```
- **Interfaz**: Como explorador
- **Mensaje**: Espera de aprobación
- **Puntos**: De explorador
- **Estadísticas**: "Mis Registros Aprobados"

#### Científico Aprobado:
```javascript
user?.role === 'scientist' && user?.scientist_approval_status === 'approved'
```
- **Interfaz**: Completa de científico
- **Pestaña**: "Científico" visible
- **Puntos**: De científico
- **Estadísticas**: "Mis Registros Creados"

#### Explorador Normal:
```javascript
user?.role === 'explorer'
```
- **Interfaz**: Normal de explorador
- **Sin cambios** en funcionalidad

#### Administrador:
```javascript
user?.role === 'admin'
```
- **Sin estadísticas** ni puntos
- **Interfaz limpia** para administración

## 📁 Archivos Modificados

### Backend:
- `add-scientist-approval-field.sql` - Script para agregar campo
- `simple-register-endpoint-v2.php` - Establece estado al registrar
- `simple-login-endpoint.php` - Incluye campo en login

### Frontend:
- `HomeScreen.js` - Lógica de interfaz según estado
- `AppNavigator.js` - Pestaña científico solo para aprobados

## 🔧 Scripts de Base de Datos

### 1. Agregar Campo:
```bash
mysql -u usuario -p database < add-scientist-approval-field.sql
```

### 2. Verificar Usuarios:
```sql
SELECT id, full_name, email, role, scientist_approval_status, is_active 
FROM users 
WHERE role = 'scientist' 
ORDER BY created_at DESC;
```

### 3. Aprobar Científico:
```sql
UPDATE users 
SET scientist_approval_status = 'approved' 
WHERE id = [USER_ID] AND role = 'scientist';
```

## 🧪 Usuario de Prueba

### Dr. Tadeo (ID: 8):
- **Estado actual**: Debería tener `scientist_approval_status = 'pending'`
- **Experiencia**: Interfaz de explorador + mensaje de espera
- **Para aprobar**: Ejecutar UPDATE con `'approved'`

## ✅ Verificación del Sistema

### 1. Registro:
- [ ] Científico se registra correctamente
- [ ] Campo `scientist_approval_status` se establece como `'pending'`
- [ ] Usuario puede ingresar inmediatamente

### 2. Interfaz Pre-Aprobación:
- [ ] Ve mensaje de "Científico en Espera de Aprobación"
- [ ] Interfaz de explorador (puntos, estadísticas)
- [ ] Sin pestaña "Científico"

### 3. Aprobación:
- [ ] Admin puede cambiar estado a `'approved'`
- [ ] Usuario ve interfaz completa de científico
- [ ] Pestaña "Científico" aparece

### 4. Funcionalidad:
- [ ] Exploradores no afectados
- [ ] Admins sin estadísticas irrelevantes
- [ ] Navegación correcta según rol y estado

## 🎯 Próximos Pasos

1. **Ejecutar script SQL** para agregar campo
2. **Subir endpoints actualizados** al servidor
3. **Probar con Dr. Tadeo** (usuario ID: 8)
4. **Implementar aprobación** en AdminScreen (futuro)

## 📝 Notas Técnicas

- **Compatibilidad**: Sistema funciona con y sin el nuevo campo
- **Performance**: Índice agregado para consultas rápidas
- **Escalabilidad**: Soporte para estado 'rejected' en futuro
- **Seguridad**: Validación de roles en frontend y backend
