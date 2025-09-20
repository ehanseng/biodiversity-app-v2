<?php
// Script para agregar/modificar la columna image_url a la tabla trees
// Ejecutar una sola vez para corregir el tamaño de la columna

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
    
    // Verificar si la columna image_url existe y su tipo
    $stmt = $pdo->query("SHOW COLUMNS FROM trees LIKE 'image_url'");
    $column = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($column) {
        echo "📋 La columna 'image_url' existe:\n";
        echo "   Tipo actual: " . $column['Type'] . "\n";
        echo "   Null: " . $column['Null'] . "\n\n";
        
        // Si no es LONGTEXT, modificarla
        if (strtoupper($column['Type']) !== 'LONGTEXT') {
            echo "🔧 Modificando columna a LONGTEXT para soportar imágenes base64...\n";
            $pdo->exec("ALTER TABLE trees MODIFY COLUMN image_url LONGTEXT NULL");
            echo "✅ Columna 'image_url' modificada a LONGTEXT exitosamente\n\n";
        } else {
            echo "✅ La columna ya es LONGTEXT, no necesita modificación\n\n";
        }
    } else {
        echo "❌ La columna 'image_url' no existe. Agregándola...\n";
        
        // Agregar la columna image_url como LONGTEXT
        $pdo->exec("ALTER TABLE trees ADD COLUMN image_url LONGTEXT NULL");
        
        echo "✅ Columna 'image_url' agregada como LONGTEXT exitosamente\n\n";
    }
    
    // Mostrar estructura actualizada
    echo "📋 ESTRUCTURA ACTUALIZADA DE LA TABLA 'trees':\n";
    echo "=============================================\n";
    $stmt = $pdo->query("SHOW COLUMNS FROM trees");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($columns as $col) {
        $highlight = ($col['Field'] === 'image_url') ? ' ⭐' : '';
        echo sprintf("%-20s %-15s %-8s%s\n", 
            $col['Field'], 
            $col['Type'], 
            $col['Null'],
            $highlight
        );
    }
    
    // Verificar registros existentes
    echo "\n📊 REGISTROS EXISTENTES:\n";
    echo "========================\n";
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM trees");
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Total de árboles: " . $count['total'] . "\n";
    
    if ($count['total'] > 0) {
        $stmt = $pdo->query("SELECT COUNT(*) as with_image FROM trees WHERE image_url IS NOT NULL AND image_url != ''");
        $withImage = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Con imagen: " . $withImage['with_image'] . "\n";
        echo "Sin imagen: " . ($count['total'] - $withImage['with_image']) . "\n";
    }
    
    echo "\n🎉 LISTO PARA USAR! Ahora puedes registrar árboles con imágenes base64.\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
