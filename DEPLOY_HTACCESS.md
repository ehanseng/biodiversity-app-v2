# 🚀 Guía para Solucionar Error 404 en URLs Internas

## Problema
Al recargar URLs como `/login`, `/admin`, `/home` aparece error 404:
```
Not Found
The requested URL was not found on this server.
```

## Solución
Copiar el archivo `.htaccess` del proyecto a la carpeta pública del servidor.

## Pasos para el Servidor Remoto

### 1. Ubicar el archivo .htaccess
El archivo ya existe en la raíz del proyecto: `/.htaccess`

### 2. Copiarlo al servidor
Subir el archivo `.htaccess` a la carpeta donde está alojada la aplicación web en el servidor:

**Para cPanel/GoDaddy:**
- Carpeta: `public_html/` o `public_html/explora/`
- Archivo: `.htaccess`

**Para servidores Linux:**
- Carpeta: `/var/www/html/` o similar
- Archivo: `.htaccess`

### 3. Verificar permisos
Asegurar que el archivo tenga permisos 644:
```bash
chmod 644 .htaccess
```

## Contenido del .htaccess (ya configurado)

```apache
# Apache configuration for Biodiversity App
RewriteEngine On

# Handle client-side routing for SPA
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Content-Type-Options "nosniff"
</IfModule>
```

## Verificación
Después de subir el archivo:
1. Ir a `https://explora.ieeetadeo.org/login`
2. Recargar la página (F5)
3. Debería cargar correctamente sin error 404

## Alternativa para Nginx
Si el servidor usa Nginx en lugar de Apache, crear archivo `nginx.conf`:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## Notas
- El archivo `.htaccess` ya está configurado correctamente
- Solo necesita ser copiado al directorio público del servidor
- Funciona con Apache (la mayoría de hosting compartido)
- Para servidores Nginx se requiere configuración diferente
