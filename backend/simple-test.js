const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('🔌 Probando conexión...');
    
    const connection = await mysql.createConnection({
      host: '72.167.151.233',
      port: 3306,
      user: 'ieeetadeo2006_adminIEEEtadeo',
      password: 'gvDOwV7&D^xk.LJF',
      database: 'ieeetadeo2006_biodiversity_app',
      connectTimeout: 10000
    });
    
    console.log('✅ ¡CONEXIÓN EXITOSA!');
    
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log(`📊 MySQL Version: ${rows[0].version}`);
    
    await connection.end();
    console.log('🎉 Todo funcionando correctamente');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('🔍 Código de error:', error.code);
  }
}

testConnection();
