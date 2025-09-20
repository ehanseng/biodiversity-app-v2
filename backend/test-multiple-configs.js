const mysql = require('mysql2/promise');

// Diferentes configuraciones para probar
const configs = [
  {
    name: 'Configuración 1 - Usuario actual',
    host: '72.167.151.233',
    port: 3306,
    user: 'ieeetadeo2006_adminIEEEtadeo',
    password: 'gvDOwV7&D^xk.LJF',
    database: 'ieeetadeo2006_biodiversity'
  },
  {
    name: 'Configuración 2 - Sin base de datos específica',
    host: '72.167.151.233',
    port: 3306,
    user: 'ieeetadeo2006_adminIEEEtadeo',
    password: 'gvDOwV7&D^xk.LJF'
  },
  {
    name: 'Configuración 3 - Puerto alternativo',
    host: '72.167.151.233',
    port: 3307,
    user: 'ieeetadeo2006_adminIEEEtadeo',
    password: 'gvDOwV7&D^xk.LJF'
  }
];

async function testConfig(config) {
  try {
    console.log(`\n🔌 Probando: ${config.name}`);
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Usuario: ${config.user}`);
    if (config.database) console.log(`   BD: ${config.database}`);
    
    const connection = await mysql.createConnection({
      ...config,
      connectTimeout: 5000
    });
    
    console.log('   ✅ ¡CONEXIÓN EXITOSA!');
    
    // Probar consulta básica
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log(`   📊 MySQL: ${rows[0].version}`);
    
    // Listar bases de datos
    const [dbs] = await connection.execute('SHOW DATABASES');
    console.log(`   🗄️ Bases de datos disponibles: ${dbs.length}`);
    dbs.forEach(db => {
      const dbName = Object.values(db)[0];
      if (dbName.includes('ieeetadeo') || dbName.includes('biodiversity')) {
        console.log(`      - ${dbName} ⭐`);
      }
    });
    
    await connection.end();
    return true;
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    console.log(`   🔍 Código: ${error.code}`);
    return false;
  }
}

async function testAll() {
  console.log('🌐 Probando múltiples configuraciones...\n');
  
  let success = false;
  for (const config of configs) {
    const result = await testConfig(config);
    if (result) {
      success = true;
      break;
    }
  }
  
  if (success) {
    console.log('\n🎉 ¡Al menos una configuración funcionó!');
  } else {
    console.log('\n❌ Ninguna configuración funcionó');
    console.log('\n💡 Posibles soluciones:');
    console.log('1. Verificar que tu IP esté autorizada en cPanel');
    console.log('2. Agregar "%" como host permitido');
    console.log('3. Contactar al proveedor de hosting');
    console.log('4. Usar la API PHP como alternativa');
  }
}

testAll();
