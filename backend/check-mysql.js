const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkMySQL() {
  try {
    console.log('🔍 Verificando conexión a MySQL...');
    console.log('📍 Host:', process.env.DB_HOST || 'localhost');
    console.log('📍 Puerto:', process.env.DB_PORT || 3306);
    console.log('📍 Usuario:', process.env.DB_USER || 'root');
    console.log('📍 Base de datos:', process.env.DB_NAME || 'biodiversity_db');
    
    // Conectar a MySQL
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'biodiversity_db'
    });
    
    console.log('✅ Conexión exitosa a MySQL');
    
    // Verificar tablas
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Tablas encontradas:', tables.length);
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });
    
    // Verificar usuarios
    const [users] = await connection.execute('SELECT id, email, full_name, role FROM users');
    console.log('👥 Usuarios encontrados:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });
    
    // Verificar registros
    const [records] = await connection.execute('SELECT id, type, common_name, status FROM biodiversity_records');
    console.log('📊 Registros encontrados:', records.length);
    records.forEach(record => {
      console.log(`  - ${record.type === 'fauna' ? '🦋' : '🌳'} ${record.common_name} (${record.status})`);
    });
    
    await connection.end();
    console.log('🎉 Verificación completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Soluciones posibles:');
      console.error('   1. Verificar que XAMPP esté ejecutándose');
      console.error('   2. Verificar que MySQL esté activo en XAMPP Control Panel');
      console.error('   3. Verificar que el puerto 3306 esté disponible');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 La base de datos no existe. Ejecutar: node setup-database.js');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Credenciales incorrectas. Verificar usuario/contraseña');
    }
  }
}

checkMySQL();
