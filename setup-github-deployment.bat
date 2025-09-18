@echo off
echo 🚀 Configurando despliegue automático con GitHub Actions
echo.

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo ❌ Error: No se encontró package.json
    echo Asegúrate de ejecutar este script desde la raíz del proyecto
    pause
    exit /b 1
)

echo 📦 Instalando dependencias...
npm install

echo 🏗️ Probando build de producción...
npm run build:prod:win

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error en el build. Revisa los errores arriba.
    pause
    exit /b 1
)

echo ✅ Build exitoso!
echo.

echo 📋 Verificando archivos generados...
if exist "dist\index.html" (
    echo ✅ index.html creado
) else (
    echo ❌ No se encontró index.html
)

if exist "dist\.htaccess" (
    echo ✅ .htaccess incluido
) else (
    echo ❌ No se encontró .htaccess
)

echo.
echo 🎯 PRÓXIMOS PASOS:
echo.
echo 1. Crear repositorio en GitHub (si no existe)
echo 2. Configurar credenciales FTP en GoDaddy cPanel
echo 3. Agregar secrets en GitHub:
echo    - FTP_SERVER
echo    - FTP_USERNAME  
echo    - FTP_PASSWORD
echo    - EXPO_PUBLIC_SUPABASE_URL
echo    - EXPO_PUBLIC_SUPABASE_ANON_KEY
echo.
echo 4. Hacer push a GitHub:
echo    git add .
echo    git commit -m "feat: configurar despliegue automático"
echo    git push origin main
echo.
echo 📖 Lee GITHUB_DEPLOYMENT.md para instrucciones detalladas
echo.

pause
