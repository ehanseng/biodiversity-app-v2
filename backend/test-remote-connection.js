const mysql = require('mysql2/promise');

// Configuración para tu servidor remoto
const REMOTE_CONFIG = {
  host: '72.167.151.233',
  port: 3306,
  user: 'ieeetadeo2006_adminIEEEtadeo', // Cambiar por el nuevo usuario si es diferente
  password: 'gvDOwV7&D^xk.LJF', // Cambiar por la nueva contraseña si es diferente
  database: 'ieeetadeo2006_biodiversity', // Cambiar por el nombre exacto de la BD
  connectTimeout: 20000,
  acquireTimeout: 20000,
  timeout: 20000
};

async function testRemoteConnection() {
  let connection;
  
  try {
    console.log('🌐 Probando conexión a servidor remoto...');
    console.log(`📍 Host: ${REMOTE_CONFIG.host}:${REMOTE_CONFIG.port}`);
    console.log(`👤 Usuario: ${REMOTE_CONFIG.user}`);
    console.log(`🗄️ Base de datos: ${REMOTE_CONFIG.database}`);
    console.log('');
    
    // Intentar conexión
    console.log('🔌 Conectando...');
    connection = await mysql.createConnection(REMOTE_CONFIG);
    console.log('✅ ¡Conexión exitosa!');
    
    // Probar consulta básica
    console.log('🔍 Probando consulta...');
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log(`📊 Versión MySQL: ${rows[0].version}`);
    
    // Verificar tablas
    console.log('📋 Verificando tablas...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📊 Tablas encontradas: ${tables.length}`);
    
    if (tables.length > 0) {
      console.log('📋 Lista de tablas:');
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`  - ${tableName}`);
      });
      
      // Si existe la tabla users, mostrar conteo
      const hasUsers = tables.some(table => Object.values(table)[0] === 'users');
      if (hasUsers) {
        const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
        console.log(`👥 Usuarios en BD: ${userCount[0].count}`);
      }
      
      // Si existe la tabla biodiversity_records, mostrar conteo
      const hasRecords = tables.some(table => Object.values(table)[0] === 'biodiversity_records');
      if (hasRecords) {
        const [recordCount] = await connection.execute('SELECT COUNT(*) as count FROM biodiversity_records');
        console.log(`🌳 Registros en BD: ${recordCount[0].count}`);
      }
    } else {
      console.log('⚠️ No se encontraron tablas. Ejecuta el script cpanel-setup.sql primero.');
    }
    
    console.log('');
    console.log('🎉 ¡Conexión remota funcionando correctamente!');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('');
    console.log('💡 Posibles soluciones:');
    console.log('1. Verificar que la contraseña sea correcta');
    console.log('2. Verificar que el nombre de la base de datos sea correcto');
    console.log('3. Verificar que el servidor permita conexiones remotas');
    console.log('4. Verificar firewall del servidor');
    console.log('5. Contactar al proveedor de hosting si persiste el error');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔥 Conexión rechazada - Verificar host y puerto');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('🔐 Acceso denegado - Verificar usuario y contraseña');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('🗄️ Base de datos no existe - Crear la base de datos primero');
    }
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar prueba
testRemoteConnection();
