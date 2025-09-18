# 🚀 Guía de Despliegue - Biodiversity App

Esta guía te ayudará a desplegar tu aplicación de biodiversidad en tu propio servidor.

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Acceso a tu servidor (SSH, FTP, o cPanel)
- Dominio configurado (opcional)
- Certificado SSL (recomendado)

## 🛠️ Preparación del Build

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Copia `.env.example` a `.env` y configura:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
EXPO_PUBLIC_ENVIRONMENT=production
```

### 3. Crear build de producción
```bash
# Build optimizado para producción
npm run build:prod

# O build normal
npm run build:web
```

## 🌐 Opciones de Despliegue

### Opción 1: Servidor VPS/Dedicado con SSH

#### A. Configuración con Nginx (Recomendado)

1. **Instalar Nginx**:
```bash
sudo apt update
sudo apt install nginx
```

2. **Subir archivos**:
```bash
scp -r dist/* usuario@tu-servidor:/var/www/biodiversity-app/
```

3. **Configurar Nginx**:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/biodiversity-app
sudo ln -s /etc/nginx/sites-available/biodiversity-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. **Configurar SSL con Let's Encrypt**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

#### B. Configuración con Apache

1. **Instalar Apache**:
```bash
sudo apt update
sudo apt install apache2
```

2. **Subir archivos**:
```bash
scp -r dist/* usuario@tu-servidor:/var/www/html/
```

3. **Habilitar mod_rewrite**:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Opción 2: Servidor Compartido (cPanel)

1. **Crear ZIP del build**:
```bash
cd dist
zip -r ../biodiversity-app.zip .
```

2. **Subir via cPanel**:
   - Ve a File Manager en cPanel
   - Navega a `public_html`
   - Sube el archivo ZIP
   - Extrae el contenido

3. **Configurar .htaccess**:
   - El archivo `.htaccess` ya está incluido en el build
   - Asegúrate de que esté en la raíz de `public_html`

### Opción 3: Servidor con FTP

1. **Usar cliente FTP** (FileZilla, WinSCP, etc.)
2. **Subir contenido de `dist/`** a la carpeta raíz del sitio web
3. **Verificar permisos** de archivos (644 para archivos, 755 para carpetas)

## ⚙️ Configuración de Variables de Entorno en Producción

### Para servidores con acceso SSH:
```bash
# Crear archivo de entorno
sudo nano /etc/environment

# Agregar variables
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
EXPO_PUBLIC_ENVIRONMENT=production
```

### Para cPanel:
1. Ve a "Environment Variables" en cPanel
2. Agrega cada variable individualmente

## 🔒 Configuración de Seguridad

### Headers de Seguridad (ya incluidos en nginx.conf y .htaccess):
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Content-Security-Policy

### HTTPS:
- **Let's Encrypt** (gratuito): `sudo certbot --nginx`
- **Certificado comercial**: Configura en tu panel de control

## 🚀 Script de Despliegue Automatizado

Usa el script incluido para automatizar el proceso:

```bash
# Hacer ejecutable
chmod +x deploy.sh

# Ejecutar
./deploy.sh
```

## 📊 Verificación del Despliegue

### 1. Verificar que la app carga:
- Visita tu dominio
- Verifica que no hay errores en la consola del navegador

### 2. Verificar funcionalidades:
- [ ] Login/registro funciona
- [ ] Conexión a Supabase funciona
- [ ] Subida de imágenes funciona
- [ ] Mapas muestran mensaje en web
- [ ] Navegación entre pantallas funciona

### 3. Verificar rendimiento:
```bash
# Verificar compresión
curl -H "Accept-Encoding: gzip" -I tu-dominio.com

# Verificar headers de seguridad
curl -I tu-dominio.com
```

## 🔧 Troubleshooting

### Problema: "404 Not Found" en rutas
**Solución**: Verifica que el archivo `.htaccess` (Apache) o la configuración de Nginx esté correcta para manejar SPA routing.

### Problema: Variables de entorno no funcionan
**Solución**: Las variables deben tener el prefijo `EXPO_PUBLIC_` y estar disponibles durante el build.

### Problema: Imágenes no cargan
**Solución**: Verifica los permisos de archivos y que la configuración de Supabase Storage sea correcta.

### Problema: App lenta
**Solución**: 
- Verifica que la compresión gzip esté habilitada
- Configura cache headers para archivos estáticos
- Usa CDN si es necesario

## 📱 Monitoreo y Mantenimiento

### Logs de acceso:
```bash
# Nginx
sudo tail -f /var/log/nginx/access.log

# Apache
sudo tail -f /var/log/apache2/access.log
```

### Actualizaciones:
1. Hacer cambios en el código
2. Ejecutar `npm run build:prod`
3. Subir nuevos archivos al servidor
4. Limpiar cache del navegador

## 🆘 Soporte

Si encuentras problemas:
1. Verifica los logs del servidor
2. Revisa la consola del navegador
3. Verifica la configuración de Supabase
4. Consulta la documentación de Expo

---

¡Tu app de biodiversidad está lista para producción! 🌱
