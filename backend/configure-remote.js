const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function configureRemote() {
  console.log('🌐 Configurador de Servidor MySQL Remoto');
  console.log('=====================================');
  console.log('');
  
  try {
    // Recopilar información del servidor
    console.log('📋 Información del Servidor MySQL Remoto:');
    const host = await question('Host del servidor (ej: mi-servidor.com): ');
    const port = await question('Puerto (presiona Enter para 3306): ') || '3306';
    const user = await question('Usuario de MySQL: ');
    const password = await question('Contraseña de MySQL: ');
    const database = await question('Nombre de base de datos (presiona Enter para biodiversity_db): ') || 'biodiversity_db';
    
    console.log('');
    console.log('🔧 Configuración Adicional:');
    const ssl = await question('¿Requiere SSL? (y/N): ');
    const jwtSecret = await question('JWT Secret (presiona Enter para generar uno): ') || generateJWTSecret();
    const backendPort = await question('Puerto del backend (presiona Enter para 3001): ') || '3001';
    
    // Crear archivo .env
    const envContent = `# Configuración para servidor remoto MySQL
# Generado automáticamente el ${new Date().toLocaleString()}

# === CONFIGURACIÓN SERVIDOR REMOTO ===
DB_HOST=${host}
DB_PORT=${port}
DB_USER=${user}
DB_PASSWORD=${password}
DB_NAME=${database}

# Puerto del servidor backend
PORT=${backendPort}

# JWT Secret
JWT_SECRET=${jwtSecret}

# Configuración de archivos
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=5242880

# SSL
DB_SSL=${ssl.toLowerCase() === 'y' ? 'true' : 'false'}

# CORS Origins (actualizar con tu dominio)
CORS_ORIGINS=http://localhost:8081,https://tu-dominio.com
`;

    // Guardar archivo .env
    fs.writeFileSync(path.join(__dirname, '.env'), envContent);
    console.log('');
    console.log('✅ Archivo .env creado exitosamente');
    
    // Crear archivo de configuración para migración
    const migrateEnvContent = `# Configuración para migración
REMOTE_DB_HOST=${host}
REMOTE_DB_PORT=${port}
REMOTE_DB_USER=${user}
REMOTE_DB_PASSWORD=${password}
REMOTE_DB_NAME=${database}
REMOTE_DB_SSL=${ssl.toLowerCase() === 'y' ? 'true' : 'false'}
`;

    fs.writeFileSync(path.join(__dirname, '.env.migrate'), migrateEnvContent);
    console.log('✅ Archivo .env.migrate creado para migración');
    
    console.log('');
    console.log('🎯 Configuración Completada');
    console.log('==========================');
    console.log(`📍 Host: ${host}:${port}`);
    console.log(`👤 Usuario: ${user}`);
    console.log(`🗄️ Base de datos: ${database}`);
    console.log(`🔒 SSL: ${ssl.toLowerCase() === 'y' ? 'Habilitado' : 'Deshabilitado'}`);
    console.log(`🚀 Puerto backend: ${backendPort}`);
    
    console.log('');
    console.log('📋 Próximos Pasos:');
    console.log('1. Probar conexión: node check-mysql.js');
    console.log('2. Migrar datos: node migrate-to-remote.js');
    console.log('3. Iniciar backend: npm start');
    console.log('4. Actualizar frontend con nueva URL');
    
    // Preguntar si quiere probar la conexión
    const testConnection = await question('\n¿Probar conexión ahora? (Y/n): ');
    if (testConnection.toLowerCase() !== 'n') {
      console.log('\n🔍 Probando conexión...');
      const { testConnection: testFunc } = require('./config/database');
      const success = await testFunc();
      
      if (success) {
        console.log('✅ ¡Conexión exitosa al servidor remoto!');
        
        const migrate = await question('¿Migrar datos ahora? (Y/n): ');
        if (migrate.toLowerCase() !== 'n') {
          console.log('\n🔄 Iniciando migración...');
          const { migrateToRemote } = require('./migrate-to-remote');
          await migrateToRemote();
        }
      } else {
        console.log('❌ No se pudo conectar al servidor remoto');
        console.log('💡 Verifica la configuración y vuelve a intentar');
      }
    }
    
  } catch (error) {
    console.error('❌ Error en configuración:', error.message);
  } finally {
    rl.close();
  }
}

function generateJWTSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  configureRemote();
}

module.exports = { configureRemote };
