<?php
/**
 * Script para agregar columna deleted_at a la tabla users
 * Necesario para el soft delete en el sistema de administración
 */

// Configuración de base de datos
$host = 'localhost';
$dbname = 'ieeetadeo2006_biodiversity_app';
$username = 'ieeetadeo2006_adminIEEEtadeo';
$password = 'gvDOwV7&D^xk.LJF';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "🔗 Conectado a la base de datos exitosamente\n";
    
    // Verificar si la columna deleted_at ya existe
    $stmt = $pdo->prepare("SHOW COLUMNS FROM users LIKE 'deleted_at'");
    $stmt->execute();
    $columnExists = $stmt->rowCount() > 0;
    
    if ($columnExists) {
        echo "✅ La columna 'deleted_at' ya existe en la tabla users\n";
    } else {
        echo "➕ Agregando columna 'deleted_at' a la tabla users...\n";
        
        // Agregar la columna deleted_at
        $sql = "ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL";
        $pdo->exec($sql);
        
        echo "✅ Columna 'deleted_at' agregada exitosamente\n";
    }
    
    // Verificar estructura actual de la tabla
    echo "\n📋 Estructura actual de la tabla users:\n";
    $stmt = $pdo->prepare("DESCRIBE users");
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($columns as $column) {
        echo "  - {$column['Field']} ({$column['Type']}) {$column['Null']} {$column['Key']} {$column['Default']}\n";
    }
    
    // Contar usuarios actuales
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "\n📊 Total de usuarios activos: {$result['total']}\n";
    
    echo "\n🎉 Script completado exitosamente!\n";
    
} catch (PDOException $e) {
    echo "❌ Error de conexión: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
