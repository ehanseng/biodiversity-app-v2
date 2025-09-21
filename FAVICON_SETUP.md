# 🌳 Configuración de Favicon y PWA - Explora Tadeo

## 📱 PWA (Progressive Web App) Configurada

La aplicación ahora está configurada como PWA completa para que funcione perfectamente cuando se agregue al inicio del celular.

### ✅ Características PWA Implementadas:

1. **Manifest.json completo**:
   - Nombre: "Explora Tadeo - Biodiversidad"
   - Nombre corto: "Explora Tadeo"
   - Tema verde: `#2d5016`
   - Modo standalone (sin barra del navegador)
   - Orientación portrait

2. **Íconos para todas las plataformas**:
   - Favicon 16x16, 32x32
   - Apple Touch Icons (57x57 hasta 180x180)
   - Android Chrome Icons (192x192, 512x512)
   - Windows Tiles

3. **Meta tags optimizados**:
   - Apple mobile web app
   - Theme color
   - Open Graph para redes sociales
   - Twitter Cards

4. **Shortcuts de la app**:
   - Registrar Planta
   - Registrar Animal
   - Ver Mapa

## 🎨 Generación de Favicons

### Método 1: Generador HTML (Recomendado)
1. Abrir `scripts/generate-favicons.html` en el navegador
2. Se generarán automáticamente todos los tamaños
3. Descargar todos los archivos
4. Colocar en la carpeta `web/` y `assets/`

### Método 2: Herramientas Online
1. Usar [favicon.io](https://favicon.io/emoji-favicons/deciduous-tree/) con emoji 🌳
2. O usar [realfavicongenerator.net](https://realfavicongenerator.net/)
3. Subir el SVG `assets/tree-icon.svg`

### Método 3: Diseño Manual
El ícono debe tener:
- Fondo circular verde `#2d5016`
- Árbol estilizado en el centro
- Colores: Verde oscuro, verde claro, café para tronco
- Diseño simple que se vea bien en tamaños pequeños

## 📁 Estructura de Archivos Necesarios

```
web/
├── favicon.ico
├── favicon-16x16.png
├── favicon-32x32.png
├── apple-touch-icon.png (180x180)
├── apple-touch-icon-*.png (varios tamaños)
├── android-chrome-192x192.png
├── android-chrome-512x512.png
├── manifest.json
└── index.html

assets/
├── favicon.png
├── icon-192.png
├── icon-512.png
└── tree-icon.svg
```

## 🚀 Funcionalidades PWA

### En iOS Safari:
- Botón "Agregar a pantalla de inicio"
- Ícono personalizado en home screen
- Splash screen con tema verde
- Modo standalone sin Safari UI

### En Android Chrome:
- Banner "Instalar app"
- Ícono en launcher
- Splash screen automático
- Shortcuts en menú contextual

### En Desktop:
- Instalable desde Chrome
- Ventana independiente
- Ícono en dock/taskbar

## 🎯 Configuración Actual

### app.json:
```json
{
  "web": {
    "favicon": "./assets/favicon.png",
    "name": "Explora Tadeo - Biodiversidad",
    "shortName": "Explora Tadeo",
    "themeColor": "#2d5016",
    "backgroundColor": "#2d5016",
    "display": "standalone"
  }
}
```

### manifest.json:
- Configuración completa PWA
- Íconos para todas las resoluciones
- Shortcuts para acciones rápidas
- Categorías: education, science, environment

## 🔧 Para Activar PWA:

1. **Generar todos los favicons** usando el script HTML
2. **Colocar archivos** en las carpetas correctas
3. **Hacer build** de la aplicación: `npm run build`
4. **Servir desde HTTPS** (requerido para PWA)
5. **Probar** en dispositivos móviles

## 📱 Cómo Agregar al Inicio:

### iOS:
1. Abrir en Safari
2. Tocar botón "Compartir"
3. Seleccionar "Agregar a pantalla de inicio"
4. Confirmar nombre "Explora Tadeo"

### Android:
1. Abrir en Chrome
2. Tocar menú (3 puntos)
3. Seleccionar "Agregar a pantalla de inicio"
4. O usar banner automático "Instalar"

## ✅ Resultado Final:

- 🌳 Ícono del arbolito en todas las plataformas
- 📱 App instalable como nativa
- 🎨 Tema verde consistente
- ⚡ Carga rápida con splash screen
- 🔗 Shortcuts para acciones comunes

¡La app ahora se comporta como una aplicación nativa cuando se instala desde el navegador!
