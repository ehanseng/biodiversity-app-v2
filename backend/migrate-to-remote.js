const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuración para servidor remoto
const REMOTE_CONFIG = {
  host: process.env.REMOTE_DB_HOST || 'tu-servidor-remoto.com',
  port: process.env.REMOTE_DB_PORT || 3306,
  user: process.env.REMOTE_DB_USER || 'biodiversity_user',
  password: process.env.REMOTE_DB_PASSWORD || 'password_remoto',
  database: process.env.REMOTE_DB_NAME || 'biodiversity_db',
  ssl: process.env.REMOTE_DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
};

// Configuración local (XAMPP)
const LOCAL_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'biodiversity_db'
};

async function migrateToRemote() {
  let localConn, remoteConn;
  
  try {
    console.log('🔄 Iniciando migración a servidor remoto...');
    
    // Conectar a base de datos local
    console.log('📱 Conectando a MySQL local (XAMPP)...');
    localConn = await mysql.createConnection(LOCAL_CONFIG);
    console.log('✅ Conectado a MySQL local');
    
    // Conectar a servidor remoto
    console.log('🌐 Conectando a servidor remoto...');
    console.log(`   Host: ${REMOTE_CONFIG.host}:${REMOTE_CONFIG.port}`);
    console.log(`   Usuario: ${REMOTE_CONFIG.user}`);
    console.log(`   Base de datos: ${REMOTE_CONFIG.database}`);
    
    remoteConn = await mysql.createConnection(REMOTE_CONFIG);
    console.log('✅ Conectado a servidor remoto');
    
    // Crear base de datos y tablas en servidor remoto si no existen
    console.log('🏗️ Configurando base de datos remota...');
    await setupRemoteDatabase(remoteConn);
    
    // Migrar usuarios
    console.log('👥 Migrando usuarios...');
    const usersMigrated = await migrateTable(localConn, remoteConn, 'users');
    console.log(`✅ ${usersMigrated} usuarios migrados`);
    
    // Migrar registros de biodiversidad
    console.log('🌳 Migrando registros de biodiversidad...');
    const recordsMigrated = await migrateTable(localConn, remoteConn, 'biodiversity_records');
    console.log(`✅ ${recordsMigrated} registros migrados`);
    
    // Verificar migración
    console.log('🔍 Verificando migración...');
    await verifyMigration(remoteConn);
    
    console.log('🎉 ¡Migración completada exitosamente!');
    console.log('');
    console.log('📋 Próximos pasos:');
    console.log('1. Actualizar .env con configuración remota');
    console.log('2. Reiniciar backend con: npm start');
    console.log('3. Probar conexión con: node check-mysql.js');
    console.log('4. Actualizar frontend para usar servidor remoto');
    
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 No se puede conectar al servidor remoto');
      console.error('   - Verificar que el servidor esté activo');
      console.error('   - Verificar host, puerto y credenciales');
      console.error('   - Verificar firewall y permisos');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Acceso denegado');
      console.error('   - Verificar usuario y contraseña');
      console.error('   - Verificar permisos del usuario en el servidor');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 Base de datos no existe');
      console.error('   - Crear base de datos en servidor remoto');
      console.error('   - Ejecutar: CREATE DATABASE biodiversity_db;');
    }
    
    process.exit(1);
  } finally {
    if (localConn) await localConn.end();
    if (remoteConn) await remoteConn.end();
  }
}

async function setupRemoteDatabase(remoteConn) {
  try {
    // Crear base de datos si no existe
    await remoteConn.execute(`CREATE DATABASE IF NOT EXISTS ${REMOTE_CONFIG.database}`);
    await remoteConn.execute(`USE ${REMOTE_CONFIG.database}`);
    
    // Crear tabla users
    await remoteConn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role ENUM('explorer', 'scientist', 'admin') DEFAULT 'explorer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Crear tabla biodiversity_records
    await remoteConn.execute(`
      CREATE TABLE IF NOT EXISTS biodiversity_records (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        type ENUM('flora', 'fauna') NOT NULL,
        common_name VARCHAR(255) NOT NULL,
        scientific_name VARCHAR(255),
        description TEXT,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        location_description TEXT,
        height_meters DECIMAL(8, 2),
        diameter_cm DECIMAL(8, 2),
        health_status VARCHAR(100),
        animal_class VARCHAR(100),
        habitat TEXT,
        behavior TEXT,
        image_url TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        reviewed_by INT,
        reviewed_at TIMESTAMP NULL,
        review_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_type (type),
        INDEX idx_status (status),
        INDEX idx_location (latitude, longitude)
      )
    `);
    
    console.log('✅ Tablas creadas/verificadas en servidor remoto');
  } catch (error) {
    console.error('❌ Error configurando base de datos remota:', error.message);
    throw error;
  }
}

async function migrateTable(localConn, remoteConn, tableName) {
  try {
    // Obtener datos de tabla local
    const [localData] = await localConn.execute(`SELECT * FROM ${tableName}`);
    
    if (localData.length === 0) {
      console.log(`⚠️ No hay datos en tabla local: ${tableName}`);
      return 0;
    }
    
    console.log(`📊 Encontrados ${localData.length} registros en ${tableName}`);
    
    let migrated = 0;
    let errors = 0;
    
    for (const row of localData) {
      try {
        // Obtener columnas y valores
        const columns = Object.keys(row).filter(key => key !== 'id'); // Excluir ID para auto-increment
        const values = columns.map(col => row[col]);
        const placeholders = columns.map(() => '?').join(', ');
        
        // Insertar en servidor remoto (ignorar duplicados)
        const query = `INSERT IGNORE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        await remoteConn.execute(query, values);
        
        migrated++;
      } catch (error) {
        errors++;
        console.error(`❌ Error migrando registro de ${tableName}:`, error.message);
      }
    }
    
    console.log(`📈 ${tableName}: ${migrated} migrados, ${errors} errores`);
    return migrated;
    
  } catch (error) {
    console.error(`❌ Error migrando tabla ${tableName}:`, error.message);
    throw error;
  }
}

async function verifyMigration(remoteConn) {
  try {
    // Verificar usuarios
    const [users] = await remoteConn.execute('SELECT COUNT(*) as count FROM users');
    console.log(`👥 Usuarios en servidor remoto: ${users[0].count}`);
    
    // Verificar registros
    const [records] = await remoteConn.execute('SELECT COUNT(*) as count FROM biodiversity_records');
    console.log(`🌳 Registros en servidor remoto: ${records[0].count}`);
    
    // Verificar por tipo
    const [flora] = await remoteConn.execute("SELECT COUNT(*) as count FROM biodiversity_records WHERE type = 'flora'");
    const [fauna] = await remoteConn.execute("SELECT COUNT(*) as count FROM biodiversity_records WHERE type = 'fauna'");
    
    console.log(`🌳 Flora: ${flora[0].count}, 🦋 Fauna: ${fauna[0].count}`);
    
  } catch (error) {
    console.error('❌ Error verificando migración:', error.message);
    throw error;
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateToRemote();
}

module.exports = { migrateToRemote };
