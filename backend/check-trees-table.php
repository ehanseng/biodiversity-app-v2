<?php
// Script para verificar la tabla trees en el servidor remoto
// Subir como: check-trees-table.php
// Ejecutar desde: https://explora.ieeetadeo.org/check-trees-table.php

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Configuración de base de datos
$host = 'localhost';
$dbname = 'ieeetadeo2006_biodiversity_app';
$username = 'ieeetadeo2006_adminIEEEtadeo';
$password = 'gvDOwV7&D^xk.LJF';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>🌳 Verificación de tabla TREES</h2>";
    
    // 1. Verificar si la tabla existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'trees'");
    $tableExists = $stmt->rowCount() > 0;
    
    echo "<h3>1. ¿Existe la tabla 'trees'?</h3>";
    echo "<p><strong>" . ($tableExists ? "✅ SÍ" : "❌ NO") . "</strong></p>";
    
    if (!$tableExists) {
        echo "<h3>2. Creando tabla 'trees'...</h3>";
        
        $createTableSQL = "
        CREATE TABLE trees (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            common_name VARCHAR(255) NOT NULL,
            scientific_name VARCHAR(255),
            description TEXT,
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            location_description TEXT,
            height_meters DECIMAL(5, 2),
            diameter_cm DECIMAL(5, 2),
            health_status VARCHAR(100),
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            image_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )";
        
        $pdo->exec($createTableSQL);
        echo "<p>✅ Tabla 'trees' creada exitosamente</p>";
    } else {
        // 2. Mostrar estructura de la tabla
        echo "<h3>2. Estructura de la tabla 'trees':</h3>";
        $stmt = $pdo->query("DESCRIBE trees");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Campo</th><th>Tipo</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
        foreach ($columns as $column) {
            echo "<tr>";
            echo "<td>{$column['Field']}</td>";
            echo "<td>{$column['Type']}</td>";
            echo "<td>{$column['Null']}</td>";
            echo "<td>{$column['Key']}</td>";
            echo "<td>{$column['Default']}</td>";
            echo "<td>{$column['Extra']}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // 3. Contar árboles
        echo "<h3>3. Árboles en la base de datos:</h3>";
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM trees");
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "<p><strong>Total de árboles: {$count['total']}</strong></p>";
        
        if ($count['total'] > 0) {
            // Mostrar algunos árboles de ejemplo
            echo "<h3>4. Primeros 5 árboles:</h3>";
            $stmt = $pdo->query("SELECT id, user_id, common_name, scientific_name, status, created_at FROM trees ORDER BY created_at DESC LIMIT 5");
            $trees = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
            echo "<tr><th>ID</th><th>User ID</th><th>Nombre Común</th><th>Nombre Científico</th><th>Estado</th><th>Creado</th></tr>";
            foreach ($trees as $tree) {
                echo "<tr>";
                echo "<td>{$tree['id']}</td>";
                echo "<td>{$tree['user_id']}</td>";
                echo "<td>{$tree['common_name']}</td>";
                echo "<td>" . ($tree['scientific_name'] ?: 'N/A') . "</td>";
                echo "<td>{$tree['status']}</td>";
                echo "<td>{$tree['created_at']}</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
    }
    
    echo "<h3>5. Test de endpoint:</h3>";
    echo "<p><a href='simple-trees-endpoint.php' target='_blank'>🔗 Probar endpoint de árboles</a></p>";
    
} catch (PDOException $e) {
    echo "<h2>❌ Error de conexión</h2>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
?>
