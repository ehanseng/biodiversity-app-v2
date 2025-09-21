# 🧪 CONFIGURACIÓN DEL RANKING DE CIENTÍFICOS

## 📋 Resumen
Sistema de ranking para científicos basado en el número de registros (plantas y animales) que aprueban.

## 🎯 Funcionalidades
- **Top 3 científicos** más activos en aprobaciones
- **Conteo separado** de plantas y animales aprobados
- **Total de aprobaciones** como métrica principal
- **Datos mock** si no existe la columna `approved_by`

## 🔧 Configuración de Base de Datos

### 1. Agregar Columna `approved_by`
```sql
-- Ejecutar el script add-approved-by-column.sql
-- O ejecutar manualmente:

ALTER TABLE trees 
ADD COLUMN approved_by INT NULL 
AFTER status,
ADD INDEX idx_approved_by (approved_by);

ALTER TABLE animals 
ADD COLUMN approved_by INT NULL 
AFTER status,
ADD INDEX idx_approved_by (approved_by);
```

### 2. Verificar Instalación
```sql
-- Verificar que las columnas existen
DESCRIBE trees;
DESCRIBE animals;

-- Verificar datos
SELECT COUNT(*) FROM trees WHERE approved_by IS NOT NULL;
SELECT COUNT(*) FROM animals WHERE approved_by IS NOT NULL;
```

## 🚀 Archivos Creados

### Backend
- `ranking-endpoint.php` - Endpoint actualizado con `scientists_ranking`
- `add-approved-by-column.sql` - Script para agregar columnas
- `SCIENTIST_RANKING_SETUP.md` - Esta documentación

### Frontend
- `ScientistRankingCard.js` - Componente del ranking
- `RankingService.js` - Método `getScientistsRanking()`
- `HomeScreen.js` - Integración del componente

## 📊 API Endpoints

### Obtener Ranking de Científicos
```
GET /ranking-endpoint.php?action=scientists_ranking
```

**Respuesta:**
```json
{
  "success": true,
  "ranking": [
    {
      "id": 1,
      "full_name": "Dr. María González",
      "email": "scientist@biodiversity.com",
      "role": "scientist",
      "trees_approved": 15,
      "animals_approved": 8,
      "total_approvals": 23,
      "position": 1
    }
  ],
  "count": 3,
  "mock_data": false
}
```

## 🎨 Características del Componente

### Diseño Visual
- **Ícono**: Matraz (flask-outline) en color azul
- **Medallas**: 🥇🥈🥉 para top 3
- **Métricas**: Total de aprobaciones + desglose por tipo
- **Refresh**: Botón para actualizar datos

### Estados
- **Loading**: "Cargando ranking de científicos..."
- **Empty**: "No hay datos de ranking de científicos"
- **Data**: Lista de científicos con métricas

## 🔄 Modo Mock vs Real

### Modo Mock (sin columna approved_by)
- Datos de demostración con 3 científicos ficticios
- `mock_data: true` en la respuesta
- Permite probar la interfaz sin modificar BD

### Modo Real (con columna approved_by)
- Datos reales de aprobaciones por científico
- `mock_data: false` en la respuesta
- Requiere que se registren aprobaciones en la columna

## 🎯 Próximos Pasos

1. **Ejecutar script SQL** para agregar columnas
2. **Subir ranking-endpoint.php** actualizado al servidor
3. **Implementar lógica de aprobación** que actualice `approved_by`
4. **Probar funcionalidad** en la aplicación

## 📝 Notas Técnicas

- **Performance**: Índices agregados en `approved_by` para consultas rápidas
- **Compatibilidad**: Funciona con y sin la columna `approved_by`
- **Escalabilidad**: Límite de 5 científicos en el ranking
- **Roles**: Incluye tanto `scientist` como `admin` en el ranking

## ✅ Estado Actual
- ✅ Backend implementado con fallback a mock
- ✅ Frontend completamente funcional
- ✅ Integrado en HomeScreen
- ⏳ Pendiente: Agregar columnas a BD y lógica de aprobación
