<?php
// Script PHP para configurar la base de datos desde el servidor
// Subir este archivo a tu servidor web y ejecutarlo desde el navegador

header('Content-Type: text/plain; charset=utf-8');

// Configuración de la base de datos
$host = 'localhost'; // En el servidor será localhost
$user = 'ieeetadeo2006_adminIEEEtadeo';
$password = 'gvDOwV7&D^xk.LJF';
$database = 'ieeetadeo2006_biodiversity';

echo "🌐 Configurando base de datos desde el servidor...\n";
echo "📍 Host: $host\n";
echo "👤 Usuario: $user\n";
echo "🗄️ Base de datos: $database\n\n";

try {
    // Conectar a MySQL
    echo "🔌 Conectando al servidor MySQL...\n";
    $pdo = new PDO("mysql:host=$host", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Conectado al servidor MySQL\n";
    
    // Crear base de datos
    echo "🏗️ Creando base de datos...\n";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS $database");
    echo "✅ Base de datos $database creada/verificada\n";
    
    // Usar la base de datos
    $pdo->exec("USE $database");
    echo "✅ Usando base de datos\n";
    
    // Crear tabla users
    echo "👥 Creando tabla users...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            role ENUM('explorer', 'scientist', 'admin') DEFAULT 'explorer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ");
    echo "✅ Tabla users creada\n";
    
    // Crear tabla biodiversity_records
    echo "🌳 Creando tabla biodiversity_records...\n";
    $pdo->exec("
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
    ");
    echo "✅ Tabla biodiversity_records creada\n";
    
    // Insertar usuarios de prueba
    echo "👤 Insertando usuarios de prueba...\n";
    $pdo->exec("
        INSERT IGNORE INTO users (email, password_hash, full_name, role) VALUES
        ('explorer@vibo.co', '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Explorador Vibo', 'explorer'),
        ('scientist@vibo.co', '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Científico Vibo', 'scientist'),
        ('admin@vibo.co', '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin Vibo', 'admin')
    ");
    echo "✅ Usuarios de prueba insertados\n";
    
    // Insertar datos de flora
    echo "🌳 Insertando datos de flora...\n";
    $pdo->exec("
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
    ");
    echo "✅ Datos de flora insertados\n";
    
    // Insertar datos de fauna
    echo "🦋 Insertando datos de fauna...\n";
    $pdo->exec("
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
    ");
    echo "✅ Datos de fauna insertados\n";
    
    // Verificar instalación
    echo "🔍 Verificando instalación...\n";
    $userCount = $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    $recordCount = $pdo->query('SELECT COUNT(*) FROM biodiversity_records')->fetchColumn();
    
    echo "\n📊 RESUMEN:\n";
    echo "👥 Usuarios creados: $userCount\n";
    echo "🌳 Registros creados: $recordCount\n";
    echo "\n🎉 ¡Base de datos remota configurada exitosamente!\n";
    echo "\n📋 Próximos pasos:\n";
    echo "1. Configurar acceso remoto en cPanel\n";
    echo "2. Actualizar backend para usar servidor remoto\n";
    echo "3. Probar conexión desde la app\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "\n💡 Posibles soluciones:\n";
    echo "1. Verificar credenciales de base de datos\n";
    echo "2. Verificar permisos del usuario\n";
    echo "3. Contactar soporte del hosting\n";
}
?>
