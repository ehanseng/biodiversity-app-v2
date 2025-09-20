<?php
// Script para configurar la base de datos de biodiversidad
// Subir este archivo a tu servidor y ejecutarlo desde el navegador

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Configuración Biodiversity App</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .info { color: #17a2b8; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .step { margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌳 Configuración Biodiversity App</h1>
        
        <?php
        // Configuración de la base de datos
        $host = 'localhost'; // En el servidor será localhost
        $user = 'ieeetadeo2006_adminIEEEtadeo';
        $password = 'gvDOwV7&D^xk.LJF';
        $database = 'ieeetadeo2006_biodiversity_app';
        
        echo "<div class='step'>";
        echo "<h3>📋 Configuración:</h3>";
        echo "<p><strong>Host:</strong> $host</p>";
        echo "<p><strong>Usuario:</strong> $user</p>";
        echo "<p><strong>Base de datos:</strong> $database</p>";
        echo "</div>";
        
        try {
            // Conectar a MySQL
            echo "<div class='step'>";
            echo "<h3>🔌 Conectando a MySQL...</h3>";
            $pdo = new PDO("mysql:host=$host", $user, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            echo "<p class='success'>✅ Conectado al servidor MySQL</p>";
            echo "</div>";
            
            // Usar la base de datos
            echo "<div class='step'>";
            echo "<h3>🗄️ Configurando base de datos...</h3>";
            $pdo->exec("USE $database");
            echo "<p class='success'>✅ Usando base de datos: $database</p>";
            echo "</div>";
            
            // Crear tabla users
            echo "<div class='step'>";
            echo "<h3>👥 Creando tabla users...</h3>";
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
            echo "<p class='success'>✅ Tabla users creada</p>";
            echo "</div>";
            
            // Crear tabla biodiversity_records
            echo "<div class='step'>";
            echo "<h3>🌳 Creando tabla biodiversity_records...</h3>";
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
            echo "<p class='success'>✅ Tabla biodiversity_records creada</p>";
            echo "</div>";
            
            // Insertar usuarios de prueba
            echo "<div class='step'>";
            echo "<h3>👤 Insertando usuarios de prueba...</h3>";
            $pdo->exec("
                INSERT IGNORE INTO users (email, password_hash, full_name, role) VALUES
                ('explorer@vibo.co', '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Explorador Vibo', 'explorer'),
                ('scientist@vibo.co', '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Científico Vibo', 'scientist'),
                ('admin@vibo.co', '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin Vibo', 'admin')
            ");
            echo "<p class='success'>✅ Usuarios de prueba insertados</p>";
            echo "<p class='info'>🔑 Credenciales de prueba:</p>";
            echo "<ul>";
            echo "<li>explorer@vibo.co / explorer123</li>";
            echo "<li>scientist@vibo.co / scientist123</li>";
            echo "<li>admin@vibo.co / admin123</li>";
            echo "</ul>";
            echo "</div>";
            
            // Insertar datos de flora
            echo "<div class='step'>";
            echo "<h3>🌳 Insertando datos de flora...</h3>";
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
            echo "<p class='success'>✅ 3 registros de flora insertados</p>";
            echo "</div>";
            
            // Insertar datos de fauna
            echo "<div class='step'>";
            echo "<h3>🦋 Insertando datos de fauna...</h3>";
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
            echo "<p class='success'>✅ 3 registros de fauna insertados</p>";
            echo "</div>";
            
            // Verificar instalación
            echo "<div class='step'>";
            echo "<h3>🔍 Verificando instalación...</h3>";
            $userCount = $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
            $recordCount = $pdo->query('SELECT COUNT(*) FROM biodiversity_records')->fetchColumn();
            $floraCount = $pdo->query("SELECT COUNT(*) FROM biodiversity_records WHERE type = 'flora'")->fetchColumn();
            $faunaCount = $pdo->query("SELECT COUNT(*) FROM biodiversity_records WHERE type = 'fauna'")->fetchColumn();
            
            echo "<p class='success'>📊 RESUMEN FINAL:</p>";
            echo "<ul>";
            echo "<li>👥 Usuarios: $userCount</li>";
            echo "<li>🌳 Flora: $floraCount registros</li>";
            echo "<li>🦋 Fauna: $faunaCount registros</li>";
            echo "<li>📊 Total registros: $recordCount</li>";
            echo "</ul>";
            echo "</div>";
            
            echo "<div class='step'>";
            echo "<h3>🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!</h3>";
            echo "<p class='success'>Tu base de datos está lista para usar con la Biodiversity App.</p>";
            echo "<p class='info'><strong>Próximos pasos:</strong></p>";
            echo "<ol>";
            echo "<li>Configurar tu app para conectarse a este servidor</li>";
            echo "<li>Usar las credenciales de prueba para hacer login</li>";
            echo "<li>¡Empezar a registrar biodiversidad!</li>";
            echo "</ol>";
            echo "</div>";
            
        } catch (PDOException $e) {
            echo "<div class='step'>";
            echo "<h3>❌ Error de configuración</h3>";
            echo "<p class='error'>Error: " . htmlspecialchars($e->getMessage()) . "</p>";
            echo "<p class='info'><strong>Posibles soluciones:</strong></p>";
            echo "<ul>";
            echo "<li>Verificar que la base de datos '$database' exista en cPanel</li>";
            echo "<li>Verificar credenciales de usuario MySQL</li>";
            echo "<li>Contactar soporte del hosting si persiste</li>";
            echo "</ul>";
            echo "</div>";
        }
        ?>
        
        <div class="step">
            <h3>📋 Información técnica</h3>
            <p><strong>Servidor:</strong> <?php echo $_SERVER['SERVER_NAME']; ?></p>
            <p><strong>PHP Version:</strong> <?php echo PHP_VERSION; ?></p>
            <p><strong>Fecha:</strong> <?php echo date('Y-m-d H:i:s'); ?></p>
        </div>
    </div>
</body>
</html>
