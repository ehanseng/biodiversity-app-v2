<?php
// Script para crear árboles de prueba en el servidor remoto
// Subir como: create-sample-trees.php
// Ejecutar desde: https://explora.ieeetadeo.org/create-sample-trees.php

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Content-Type: text/html; charset=utf-8');

// Configuración de base de datos
$host = 'localhost';
$dbname = 'ieeetadeo2006_biodiversity_app';
$username = 'ieeetadeo2006_adminIEEEtadeo';
$password = 'gvDOwV7&D^xk.LJF';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>🌳 Creando árboles de prueba</h2>";
    
    // Primero, obtener los IDs de los usuarios existentes
    $stmt = $pdo->query("SELECT id, email FROM users ORDER BY id");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h3>👥 Usuarios disponibles:</h3>";
    echo "<ul>";
    foreach ($users as $user) {
        echo "<li>ID: {$user['id']} - Email: {$user['email']}</li>";
    }
    echo "</ul>";
    
    if (count($users) < 3) {
        echo "<p style='color: red;'>⚠️ Se necesitan al menos 3 usuarios. Solo hay " . count($users) . " usuarios.</p>";
        exit();
    }
    
    // Usar los primeros 3 usuarios
    $user1 = $users[0]['id']; // explorer@vibo.co
    $user2 = $users[1]['id']; // scientist@vibo.co  
    $user3 = $users[2]['id']; // admin@vibo.co
    
    // Árboles de prueba con diferentes estados
    $sampleTrees = [
        // Usuario 1 - Explorer
        [
            'user_id' => $user1,
            'common_name' => 'Ceiba',
            'scientific_name' => 'Ceiba pentandra',
            'description' => 'Árbol emblemático de Colombia, conocido por su gran tamaño y valor cultural.',
            'latitude' => 4.6097,
            'longitude' => -74.0817,
            'location_description' => 'Parque Nacional, Bogotá',
            'height_meters' => 25.5,
            'diameter_cm' => 180.0,
            'health_status' => 'Excelente',
            'status' => 'approved'
        ],
        [
            'user_id' => $user1,
            'common_name' => 'Guayacán Amarillo',
            'scientific_name' => 'Handroanthus chrysanthus',
            'description' => 'Árbol nativo con hermosas flores amarillas, muy valorado en construcción.',
            'latitude' => 4.6351,
            'longitude' => -74.0703,
            'location_description' => 'Zona Rosa, Bogotá',
            'height_meters' => 12.0,
            'diameter_cm' => 45.0,
            'health_status' => 'Bueno',
            'status' => 'pending'
        ],
        [
            'user_id' => $user1,
            'common_name' => 'Eucalipto',
            'scientific_name' => 'Eucalyptus globulus',
            'description' => 'Especie introducida, crecimiento rápido pero controvertida por su impacto ambiental.',
            'latitude' => 4.5981,
            'longitude' => -74.0758,
            'location_description' => 'Cerros Orientales, Bogotá',
            'height_meters' => 18.0,
            'diameter_cm' => 35.0,
            'health_status' => 'Regular',
            'status' => 'rejected'
        ],
        
        // Usuario 2 - Scientist
        [
            'user_id' => $user2,
            'common_name' => 'Nogal Cafetero',
            'scientific_name' => 'Cordia alliodora',
            'description' => 'Especie nativa muy importante para sistemas agroforestales y cafetales.',
            'latitude' => 4.6482,
            'longitude' => -74.0648,
            'location_description' => 'Universidad Nacional, Bogotá',
            'height_meters' => 15.8,
            'diameter_cm' => 62.0,
            'health_status' => 'Excelente',
            'status' => 'approved'
        ],
        [
            'user_id' => $user2,
            'common_name' => 'Roble Andino',
            'scientific_name' => 'Quercus humboldtii',
            'description' => 'Especie endémica de los Andes colombianos, en peligro de extinción.',
            'latitude' => 4.6276,
            'longitude' => -74.0645,
            'location_description' => 'Jardín Botánico, Bogotá',
            'height_meters' => 22.3,
            'diameter_cm' => 95.0,
            'health_status' => 'Bueno',
            'status' => 'approved'
        ],
        [
            'user_id' => $user2,
            'common_name' => 'Palma de Cera',
            'scientific_name' => 'Ceroxylon quindiuense',
            'description' => 'Árbol nacional de Colombia, la palma más alta del mundo.',
            'latitude' => 4.5339,
            'longitude' => -75.6811,
            'location_description' => 'Valle de Cocora, Quindío',
            'height_meters' => 35.0,
            'diameter_cm' => 25.0,
            'health_status' => 'Excelente',
            'status' => 'pending'
        ],
        
        // Usuario 3 - Admin
        [
            'user_id' => $user3,
            'common_name' => 'Yarumo',
            'scientific_name' => 'Cecropia peltata',
            'description' => 'Árbol pionero importante para la regeneración de bosques secundarios.',
            'latitude' => 4.6118,
            'longitude' => -74.0705,
            'location_description' => 'Parque Simón Bolívar, Bogotá',
            'height_meters' => 8.5,
            'diameter_cm' => 28.0,
            'health_status' => 'Bueno',
            'status' => 'approved'
        ],
        [
            'user_id' => $user3,
            'common_name' => 'Caucho Sabanero',
            'scientific_name' => 'Ficus elastica',
            'description' => 'Árbol ornamental muy común en parques urbanos, originario de Asia.',
            'latitude' => 4.6392,
            'longitude' => -74.0834,
            'location_description' => 'Parque de la 93, Bogotá',
            'height_meters' => 16.2,
            'diameter_cm' => 78.0,
            'health_status' => 'Excelente',
            'status' => 'pending'
        ],
        [
            'user_id' => $user3,
            'common_name' => 'Pino Pátula',
            'scientific_name' => 'Pinus patula',
            'description' => 'Especie introducida para reforestación, pero puede ser invasiva.',
            'latitude' => 4.7110,
            'longitude' => -74.0721,
            'location_description' => 'Cerro de Guadalupe, Bogotá',
            'height_meters' => 20.0,
            'diameter_cm' => 40.0,
            'health_status' => 'Regular',
            'status' => 'rejected'
        ],
        [
            'user_id' => $user3,
            'common_name' => 'Aliso',
            'scientific_name' => 'Alnus acuminata',
            'description' => 'Árbol nativo de montaña, excelente para control de erosión.',
            'latitude' => 4.6789,
            'longitude' => -74.0456,
            'location_description' => 'Cerros de Monserrate, Bogotá',
            'height_meters' => 14.7,
            'diameter_cm' => 52.0,
            'health_status' => 'Bueno',
            'status' => 'approved'
        ]
    ];
    
    echo "<h3>🌱 Insertando árboles de prueba...</h3>";
    
    $stmt = $pdo->prepare("
        INSERT INTO trees (
            user_id, common_name, scientific_name, description, 
            latitude, longitude, location_description, 
            height_meters, diameter_cm, health_status, 
            status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    
    $insertedCount = 0;
    
    foreach ($sampleTrees as $tree) {
        try {
            $result = $stmt->execute([
                $tree['user_id'],
                $tree['common_name'],
                $tree['scientific_name'],
                $tree['description'],
                $tree['latitude'],
                $tree['longitude'],
                $tree['location_description'],
                $tree['height_meters'],
                $tree['diameter_cm'],
                $tree['health_status'],
                $tree['status']
            ]);
            
            if ($result) {
                $insertedCount++;
                echo "<p>✅ <strong>{$tree['common_name']}</strong> ({$tree['scientific_name']}) - Estado: <em>{$tree['status']}</em> - Usuario: {$tree['user_id']}</p>";
            }
            
        } catch (PDOException $e) {
            echo "<p style='color: red;'>❌ Error insertando {$tree['common_name']}: " . $e->getMessage() . "</p>";
        }
    }
    
    echo "<hr>";
    echo "<h3>📊 Resumen de inserción:</h3>";
    echo "<p><strong>Árboles insertados exitosamente: $insertedCount/" . count($sampleTrees) . "</strong></p>";
    
    // Mostrar estadísticas por estado
    echo "<h3>📈 Estadísticas por estado:</h3>";
    $stmt = $pdo->query("
        SELECT status, COUNT(*) as count 
        FROM trees 
        GROUP BY status 
        ORDER BY status
    ");
    $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<ul>";
    foreach ($stats as $stat) {
        $emoji = $stat['status'] === 'approved' ? '✅' : ($stat['status'] === 'pending' ? '⏳' : '❌');
        echo "<li>$emoji <strong>" . ucfirst($stat['status']) . "</strong>: {$stat['count']} árboles</li>";
    }
    echo "</ul>";
    
    // Mostrar estadísticas por usuario
    echo "<h3>👥 Estadísticas por usuario:</h3>";
    $stmt = $pdo->query("
        SELECT u.email, COUNT(t.id) as tree_count 
        FROM users u 
        LEFT JOIN trees t ON u.id = t.user_id 
        GROUP BY u.id, u.email 
        ORDER BY tree_count DESC
    ");
    $userStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<ul>";
    foreach ($userStats as $userStat) {
        echo "<li><strong>{$userStat['email']}</strong>: {$userStat['tree_count']} árboles</li>";
    }
    echo "</ul>";
    
    echo "<hr>";
    echo "<h3>🎯 ¡Datos de prueba creados exitosamente!</h3>";
    echo "<p>Ahora puedes probar:</p>";
    echo "<ul>";
    echo "<li>🔍 <strong>ExplorerScreen</strong> - Ver todos los árboles</li>";
    echo "<li>🏠 <strong>HomeScreen</strong> - Ver estadísticas</li>";
    echo "<li>📊 <strong>Filtros</strong> - Por estado (Aprobados, Pendientes, Rechazados)</li>";
    echo "<li>👤 <strong>Filtro 'Míos'</strong> - Ver solo árboles del usuario actual</li>";
    echo "</ul>";
    
} catch (PDOException $e) {
    echo "<h2>❌ Error de conexión</h2>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
?>
