<?php
// Script para crear la tabla animals en la base de datos
// Ejecutar una sola vez

// Headers para web
header('Content-Type: text/plain; charset=utf-8');

// Configuración de base de datos
$host = 'localhost';
$dbname = 'ieeetadeo2006_biodiversity_app';
$username = 'ieeetadeo2006_adminIEEEtadeo';
$password = 'gvDOwV7&D^xk.LJF';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Conectado a la base de datos...\n\n";
    
    // Verificar si la tabla animals existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'animals'");
    $tableExists = $stmt->rowCount() > 0;
    
    if ($tableExists) {
        echo "📋 La tabla 'animals' ya existe\n";
        
        // Mostrar estructura actual
        echo "\n📋 ESTRUCTURA ACTUAL DE LA TABLA 'animals':\n";
        echo "=============================================\n";
        $stmt = $pdo->query("SHOW COLUMNS FROM animals");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($columns as $col) {
            echo sprintf("%-20s %-20s %-8s\n", 
                $col['Field'], 
                $col['Type'], 
                $col['Null']
            );
        }
    } else {
        echo "❌ La tabla 'animals' no existe. Creándola...\n\n";
        
        // Crear la tabla animals
        $createTableSQL = "
        CREATE TABLE animals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            common_name VARCHAR(255) NOT NULL,
            scientific_name VARCHAR(255) NULL,
            animal_class VARCHAR(100) NULL,
            description TEXT NULL,
            latitude DECIMAL(10, 8) NULL,
            longitude DECIMAL(11, 8) NULL,
            image_url LONGTEXT NULL,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_status (status),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        $pdo->exec($createTableSQL);
        
        echo "✅ Tabla 'animals' creada exitosamente\n\n";
        
        // Mostrar estructura creada
        echo "📋 ESTRUCTURA DE LA TABLA 'animals' CREADA:\n";
        echo "==========================================\n";
        $stmt = $pdo->query("SHOW COLUMNS FROM animals");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($columns as $col) {
            echo sprintf("%-20s %-20s %-8s\n", 
                $col['Field'], 
                $col['Type'], 
                $col['Null']
            );
        }
        
        // Insertar algunos datos de prueba
        echo "\n📊 INSERTANDO DATOS DE PRUEBA:\n";
        echo "===============================\n";
        
        $testAnimals = [
            [
                'user_id' => 1,
                'common_name' => 'Colibrí',
                'scientific_name' => 'Trochilidae',
                'animal_class' => 'Ave',
                'description' => 'Pequeño colibrí observado en el jardín',
                'latitude' => 4.6097,
                'longitude' => -74.0817,
                'status' => 'approved'
            ],
            [
                'user_id' => 1,
                'common_name' => 'Mariposa Monarca',
                'scientific_name' => 'Danaus plexippus',
                'animal_class' => 'Insecto',
                'description' => 'Mariposa migratoria de colores naranjas',
                'latitude' => 4.6110,
                'longitude' => -74.0820,
                'status' => 'pending'
            ],
            [
                'user_id' => 2,
                'common_name' => 'Rana Verde',
                'scientific_name' => 'Lithobates clamitans',
                'animal_class' => 'Anfibio',
                'description' => 'Rana pequeña encontrada cerca del agua',
                'latitude' => 4.6120,
                'longitude' => -74.0830,
                'status' => 'approved'
            ]
        ];
        
        $stmt = $pdo->prepare("
            INSERT INTO animals (user_id, common_name, scientific_name, animal_class, description, latitude, longitude, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        foreach ($testAnimals as $animal) {
            $stmt->execute([
                $animal['user_id'],
                $animal['common_name'],
                $animal['scientific_name'],
                $animal['animal_class'],
                $animal['description'],
                $animal['latitude'],
                $animal['longitude'],
                $animal['status']
            ]);
            echo "✅ Insertado: {$animal['common_name']}\n";
        }
    }
    
    // Verificar registros existentes
    echo "\n📊 REGISTROS EXISTENTES:\n";
    echo "========================\n";
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM animals");
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Total de animales: " . $count['total'] . "\n";
    
    if ($count['total'] > 0) {
        $stmt = $pdo->query("SELECT COUNT(*) as approved FROM animals WHERE status = 'approved'");
        $approved = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stmt = $pdo->query("SELECT COUNT(*) as pending FROM animals WHERE status = 'pending'");
        $pending = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stmt = $pdo->query("SELECT COUNT(*) as rejected FROM animals WHERE status = 'rejected'");
        $rejected = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo "Aprobados: " . $approved['approved'] . "\n";
        echo "Pendientes: " . $pending['pending'] . "\n";
        echo "Rechazados: " . $rejected['rejected'] . "\n";
        
        // Mostrar últimos registros
        echo "\n📋 ÚLTIMOS 3 ANIMALES:\n";
        echo "======================\n";
        $stmt = $pdo->query("SELECT id, common_name, animal_class, user_id, status, created_at FROM animals ORDER BY created_at DESC LIMIT 3");
        $animals = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($animals as $animal) {
            echo "ID: {$animal['id']} | {$animal['common_name']} ({$animal['animal_class']}) | Usuario: {$animal['user_id']} | Estado: {$animal['status']}\n";
            echo "Fecha: {$animal['created_at']}\n";
            echo "---\n";
        }
    }
    
    echo "\n🎉 LISTO! Tabla 'animals' configurada y lista para usar.\n";
    echo "Ahora puedes registrar animales desde la app.\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
