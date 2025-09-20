const mysql = require('mysql2/promise');

// Configuración para tu servidor remoto
const REMOTE_CONFIG = {
  host: '72.167.151.233',
  port: 3306,
  user: 'ieeetadeo2006_adminIEEEtadeo',
  password: 'gvDOwV7&D^xk.LJF',
  database: 'ieeetadeo2006_biodiversity_app',
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000
};

async function setupRemoteDatabase() {
  let connection;
  
  try {
    console.log('🌐 Configurando base de datos remota...');
    console.log(`📍 Host: ${REMOTE_CONFIG.host}:${REMOTE_CONFIG.port}`);
    console.log(`👤 Usuario: ${REMOTE_CONFIG.user}`);
    console.log(`🗄️ Base de datos: ${REMOTE_CONFIG.database}`);
    console.log('');
    
    // Conectar al servidor (sin especificar base de datos primero)
    console.log('🔌 Conectando al servidor...');
    const connectionConfig = { ...REMOTE_CONFIG };
    delete connectionConfig.database; // Conectar sin BD específica primero
    
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Conectado al servidor MySQL');
    
    // Crear base de datos si no existe
    console.log('🏗️ Creando base de datos...');
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${REMOTE_CONFIG.database}`);
    console.log(`✅ Base de datos ${REMOTE_CONFIG.database} creada/verificada`);
    
    // Usar la base de datos
    await connection.execute(`USE ${REMOTE_CONFIG.database}`);
    console.log('✅ Usando base de datos');
    
    // Crear tabla users
    console.log('👥 Creando tabla users...');
    await connection.execute(`
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
    console.log('✅ Tabla users creada');
    
    // Crear tabla biodiversity_records
    console.log('🌳 Creando tabla biodiversity_records...');
    await connection.execute(`
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
    console.log('✅ Tabla biodiversity_records creada');
    
    // Insertar usuarios de prueba
    console.log('👤 Insertando usuarios de prueba...');
    await connection.execute(`
      INSERT IGNORE INTO users (email, password_hash, full_name, role) VALUES
      ('explorer@vibo.co', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Explorador Vibo', 'explorer'),
      ('scientist@vibo.co', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Científico Vibo', 'scientist'),
      ('admin@vibo.co', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin Vibo', 'admin')
    `);
    console.log('✅ Usuarios de prueba insertados');
    
    // Insertar datos de prueba de Flora
    console.log('🌳 Insertando datos de flora...');
    await connection.execute(`
      INSERT IGNORE INTO biodiversity_records (
        id, user_id, type, common_name, scientific_name, description,
        latitude, longitude, location_description,
        height_meters, diameter_cm, health_status,
        image_url, status
      ) VALUES
      (1, 1, 'flora', 'Ceiba del Campus', 'Ceiba pentandra', 'Árbol emblemático ubicado en la entrada principal',
       4.6097, -74.0817, 'Entrada principal del campus',
       25.0, 80.0, 'Excelente',
       'https://picsum.photos/300/200?random=1', 'approved'),
      (2, 1, 'flora', 'Guayacán Amarillo', 'Tabebuia chrysantha', 'Hermoso árbol con flores amarillas en primavera',
       4.6100, -74.0820, 'Jardín central',
       15.0, 45.0, 'Bueno',
       'https://picsum.photos/300/200?random=2', 'pending'),
      (3, 2, 'flora', 'Nogal Cafetero', 'Cordia alliodora', 'Árbol nativo usado tradicionalmente en construcción',
       4.6095, -74.0815, 'Zona de reforestación',
       20.0, 60.0, 'Regular',
       'https://picsum.photos/300/200?random=3', 'rejected')
    `);
    console.log('✅ Datos de flora insertados');
    
    // Insertar datos de prueba de Fauna
    console.log('🦋 Insertando datos de fauna...');
    await connection.execute(`
      INSERT IGNORE INTO biodiversity_records (
        id, user_id, type, common_name, scientific_name, description,
        latitude, longitude, location_description,
        animal_class, habitat, behavior,
        image_url, status
      ) VALUES
      (4, 1, 'fauna', 'Colibrí Esmeralda', 'Amazilia tzacatl', 'Pequeño colibrí con plumaje verde brillante',
       4.6095, -74.0815, 'Jardines con flores',
       'Aves', 'Jardines y áreas florales', 'Diurno, se alimenta de néctar',
       'https://picsum.photos/300/200?random=6&blur=1', 'approved'),
      (5, 1, 'fauna', 'Ardilla Común', 'Sciurus granatensis', 'Ardilla nativa de color gris con cola esponjosa',
       4.6102, -74.0818, 'Árboles del campus',
       'Mamíferos', 'Árboles y zonas verdes', 'Diurno, muy activa en las mañanas',
       'https://picsum.photos/300/200?random=7&blur=1', 'pending'),
      (6, 2, 'fauna', 'Mariposa Monarca', 'Danaus plexippus', 'Mariposa migratoria de color naranja con bordes negros',
       4.6088, -74.0812, 'Jardín de mariposas',
       'Insectos', 'Jardines con flores', 'Diurno, migratoria estacional',
       'https://picsum.photos/300/200?random=8&blur=1', 'approved')
    `);
    console.log('✅ Datos de fauna insertados');
    
    // Verificar que todo se creó correctamente
    console.log('🔍 Verificando instalación...');
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [recordCount] = await connection.execute('SELECT COUNT(*) as count FROM biodiversity_records');
    
    console.log('');
    console.log('📊 RESUMEN:');
    console.log(`👥 Usuarios creados: ${userCount[0].count}`);
    console.log(`🌳 Registros creados: ${recordCount[0].count}`);
    console.log('');
    console.log('🎉 ¡Base de datos remota configurada exitosamente!');
    console.log('');
    console.log('📋 Próximos pasos:');
    console.log('1. Copiar .env.remote a .env');
    console.log('2. Reiniciar el backend: npm start');
    console.log('3. Probar la conexión desde la app');
    
  } catch (error) {
    console.error('❌ Error configurando base de datos:', error.message);
    
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
      console.error('   - El script intentará crearla automáticamente');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar configuración
setupRemoteDatabase();
