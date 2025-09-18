# 🚀 Despliegue Automático con GitHub Actions

Esta guía te ayudará a configurar un despliegue automático desde GitHub a tu servidor GoDaddy.

## 🎯 ¿Qué hace esto?

Cada vez que hagas `git push` a la rama `main` o `master`:
1. 🏗️ GitHub construye automáticamente tu aplicación
2. 📦 Crea un paquete optimizado
3. 🚀 Lo despliega automáticamente a `explora.ieeetadeo.org`
4. ✅ Te notifica si fue exitoso o falló

## 📋 Configuración Inicial

### 1. Crear/Configurar Repositorio en GitHub

```bash
# Si no tienes repositorio, créalo
git init
git add .
git commit -m "Initial commit: Biodiversity App"

# Crear repositorio en GitHub y conectarlo
git remote add origin https://github.com/tu-usuario/biodiversity-app-v2.git
git branch -M main
git push -u origin main
```

### 2. Obtener Credenciales FTP de GoDaddy

#### A. Acceder a cPanel
1. Ve a tu panel de GoDaddy
2. Abre cPanel
3. Busca "FTP Accounts" o "Cuentas FTP"

#### B. Crear/Obtener Cuenta FTP
1. Si no tienes una cuenta FTP, créala:
   - **Username**: `tu-usuario@explora.ieeetadeo.org`
   - **Password**: (crea una contraseña segura)
   - **Directory**: `/public_html/`
   - **Quota**: Unlimited

2. Anota estos datos:
   - **FTP Server**: Generalmente es tu dominio o `ftp.explora.ieeetadeo.org`
   - **Username**: El usuario que creaste
   - **Password**: La contraseña que asignaste

### 3. Configurar Secrets en GitHub

#### A. Ir a Settings del Repositorio
1. Ve a tu repositorio en GitHub
2. Click en "Settings" (pestaña superior)
3. En el menú lateral, click "Secrets and variables" > "Actions"

#### B. Agregar Secrets
Click "New repository secret" para cada uno:

```
FTP_SERVER
Valor: ftp.explora.ieeetadeo.org (o el que te dé GoDaddy)

FTP_USERNAME  
Valor: tu-usuario@explora.ieeetadeo.org

FTP_PASSWORD
Valor: tu-contraseña-ftp

EXPO_PUBLIC_SUPABASE_URL
Valor: https://tu-proyecto.supabase.co

EXPO_PUBLIC_SUPABASE_ANON_KEY
Valor: tu-clave-anonima-de-supabase
```

## 🔧 Configuración del Workflow

El archivo `.github/workflows/deploy.yml` ya está configurado y hace lo siguiente:

### Triggers (Cuándo se ejecuta):
- ✅ Push a `main` o `master`
- ✅ Pull Request a `main` o `master` (solo build, no deploy)

### Pasos del Workflow:
1. **Checkout**: Descarga el código
2. **Setup Node.js**: Configura Node.js 18
3. **Install**: Instala dependencias con `npm ci`
4. **Build**: Construye la app con variables de producción
5. **Deploy**: Sube archivos via FTP a GoDaddy
6. **Notify**: Te dice si fue exitoso o falló

## 🚀 Uso Diario

### Para Desplegar Cambios:
```bash
# 1. Hacer cambios en tu código
# 2. Commit y push
git add .
git commit -m "feat: nueva funcionalidad de mapas"
git push origin main

# 3. ¡Eso es todo! GitHub se encarga del resto
```

### Monitorear Despliegues:
1. Ve a tu repositorio en GitHub
2. Click en "Actions" (pestaña superior)
3. Verás el historial de despliegues
4. Click en cualquier ejecución para ver detalles

## 📊 Estados del Workflow

- 🟡 **En progreso**: El despliegue está ejecutándose
- ✅ **Exitoso**: Despliegue completado, app actualizada
- ❌ **Fallido**: Hubo un error, revisa los logs

## 🔍 Troubleshooting

### Error: "FTP connection failed"
**Solución**: 
- Verifica las credenciales FTP en GitHub Secrets
- Asegúrate de que la cuenta FTP esté activa en cPanel

### Error: "Build failed"
**Solución**:
- Revisa que las variables de Supabase sean correctas
- Verifica que no haya errores de sintaxis en el código

### Error: "Permission denied"
**Solución**:
- Verifica que la cuenta FTP tenga permisos de escritura
- Revisa que el directorio de destino sea correcto

### El sitio no se actualiza
**Solución**:
- Verifica que los archivos se subieron correctamente
- Limpia el cache del navegador (Ctrl+F5)
- Revisa los logs del workflow en GitHub Actions

## 🛡️ Seguridad

### Secrets Protegidos:
- ✅ Las credenciales están encriptadas en GitHub
- ✅ Solo son visibles durante la ejecución del workflow
- ✅ No aparecen en los logs públicos

### Buenas Prácticas:
- 🔐 Usa contraseñas fuertes para FTP
- 🔄 Rota las credenciales periódicamente
- 👥 Solo da acceso al repositorio a personas de confianza

## 📈 Funcionalidades Avanzadas

### Despliegue por Ramas:
```yaml
# Solo desplegar desde rama 'production'
if: github.ref == 'refs/heads/production'
```

### Notificaciones por Email:
```yaml
# Agregar al workflow para recibir emails
- name: Send notification
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: "❌ Deployment Failed"
    body: "The deployment to explora.ieeetadeo.org has failed."
    to: tu-email@gmail.com
```

### Rollback Automático:
```yaml
# Mantener backup de la versión anterior
- name: Backup current version
  run: |
    curl -o backup.zip https://explora.ieeetadeo.org/backup-endpoint
```

## 🎯 Checklist de Configuración

- [ ] Repositorio creado en GitHub
- [ ] Workflow file (`.github/workflows/deploy.yml`) agregado
- [ ] Secrets configurados en GitHub:
  - [ ] `FTP_SERVER`
  - [ ] `FTP_USERNAME` 
  - [ ] `FTP_PASSWORD`
  - [ ] `EXPO_PUBLIC_SUPABASE_URL`
  - [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Cuenta FTP creada en GoDaddy cPanel
- [ ] Primer push realizado
- [ ] Workflow ejecutado exitosamente
- [ ] Sitio actualizado en https://explora.ieeetadeo.org

## 🎉 ¡Listo!

Una vez configurado, tu flujo de trabajo será:

```
Código → Git Push → GitHub Actions → GoDaddy → ¡Sitio Actualizado!
```

¡No más subidas manuales! 🚀
