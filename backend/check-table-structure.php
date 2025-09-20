<?php
// Script para verificar la estructura de la tabla trees
// Ejecutar desde: https://explora.ieeetadeo.org/check-table-structure.php

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
    
    echo "✅ Conexión exitosa a la base de datos\n\n";
    
    // Verificar estructura de la tabla trees
    $stmt = $pdo->query("DESCRIBE trees");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "📋 ESTRUCTURA DE LA TABLA 'trees':\n";
    echo "=====================================\n";
    
    foreach ($columns as $column) {
        echo sprintf("%-20s %-15s %-10s %-10s %-10s %s\n", 
            $column['Field'], 
            $column['Type'], 
            $column['Null'], 
            $column['Key'], 
            $column['Default'], 
            $column['Extra']
        );
    }
    
    echo "\n🔍 VERIFICANDO COLUMNA image_url:\n";
    $hasImageUrl = false;
    foreach ($columns as $column) {
        if ($column['Field'] === 'image_url') {
            $hasImageUrl = true;
            echo "✅ La columna 'image_url' EXISTE\n";
            echo "   Tipo: " . $column['Type'] . "\n";
            echo "   Null: " . $column['Null'] . "\n";
            break;
        }
    }
    
    if (!$hasImageUrl) {
        echo "❌ La columna 'image_url' NO EXISTE\n";
        echo "💡 Necesitas agregar la columna con:\n";
        echo "   ALTER TABLE trees ADD COLUMN image_url TEXT NULL;\n";
    }
    
    // Mostrar algunos registros de ejemplo
    echo "\n📊 ÚLTIMOS 3 REGISTROS:\n";
    echo "========================\n";
    $stmt = $pdo->query("SELECT id, common_name, user_id, status, image_url, created_at FROM trees ORDER BY created_at DESC LIMIT 3");
    $trees = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($trees as $tree) {
        echo "ID: {$tree['id']} | {$tree['common_name']} | Usuario: {$tree['user_id']} | Estado: {$tree['status']}\n";
        echo "Imagen: " . ($tree['image_url'] ? substr($tree['image_url'], 0, 50) . '...' : 'Sin imagen') . "\n";
        echo "Fecha: {$tree['created_at']}\n";
        echo "---\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Error de conexión: " . $e->getMessage() . "\n";
}
?>
