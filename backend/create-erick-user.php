<?php
// Script para crear específicamente el usuario erick@ieee.org en MySQL
// Ejecutar una sola vez

// Configuración de la base de datos
$host = 'localhost';
$user = 'ieeetadeo2006_adminIEEEtadeo';
$password = 'gvDOwV7&D^xk.LJF';
$database = 'ieeetadeo2006_biodiversity_app';

try {
    echo "🔗 Conectando a MySQL...\n";
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Conexión exitosa\n";

    // Verificar estructura de la tabla users
    echo "🔧 Verificando estructura de la tabla users...\n";
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        echo "❌ La tabla 'users' no existe. Creándola...\n";
        $createTableSQL = "
        CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            role ENUM('admin', 'scientist', 'explorer', 'visitor') DEFAULT 'explorer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";
        $pdo->exec($createTableSQL);
        echo "✅ Tabla 'users' creada exitosamente\n";
    } else {
        echo "✅ La tabla 'users' existe\n";
        
        // Verificar si tiene la columna password
        $stmt = $pdo->query("DESCRIBE users");
        $columns = $stmt->fetchAll();
        $hasPassword = false;
        
        foreach ($columns as $column) {
            if ($column['Field'] === 'password') {
                $hasPassword = true;
                break;
            }
        }
        
        if (!$hasPassword) {
            echo "⚠️ Agregando columna 'password' faltante...\n";
            $pdo->exec("ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL AFTER email");
            echo "✅ Columna 'password' agregada\n";
        }
    }

    // Verificar si el usuario ya existe
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
    $stmt->execute(['erick@ieee.org']);
    $exists = $stmt->fetchColumn() > 0;

    if ($exists) {
        echo "⚠️ El usuario erick@ieee.org ya existe\n";
        
        // Mostrar datos del usuario existente
        $stmt = $pdo->prepare("SELECT id, email, full_name, role, created_at FROM users WHERE email = ?");
        $stmt->execute(['erick@ieee.org']);
        $user = $stmt->fetch();
        
        echo "📋 Datos actuales:\n";
        echo "  ID: {$user['id']}\n";
        echo "  Email: {$user['email']}\n";
        echo "  Nombre: {$user['full_name']}\n";
        echo "  Rol: {$user['role']}\n";
        echo "  Creado: {$user['created_at']}\n";
        
    } else {
        echo "🆕 Creando usuario erick@ieee.org...\n";
        
        $stmt = $pdo->prepare("
            INSERT INTO users (email, password, full_name, role) 
            VALUES (?, ?, ?, ?)
        ");
        
        $stmt->execute([
            'erick@ieee.org',
            password_hash('erick123', PASSWORD_DEFAULT),
            'Erick Hansen',
            'admin'
        ]);
        
        $userId = $pdo->lastInsertId();
        echo "✅ Usuario creado con ID: $userId\n";
    }

    // Mostrar todos los usuarios para verificar
    echo "\n📋 Todos los usuarios en la base de datos:\n";
    $stmt = $pdo->query("SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll();
    
    foreach ($users as $user) {
        echo "  ID: {$user['id']} | {$user['email']} | {$user['full_name']} | {$user['role']}\n";
    }

    echo "\n🎉 Proceso completado!\n";
    echo "📝 Credenciales para login:\n";
    echo "  Email: erick@ieee.org\n";
    echo "  Contraseña: erick123\n";
    echo "  Rol: admin\n";

} catch (PDOException $e) {
    echo "❌ Error de base de datos: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ Error general: " . $e->getMessage() . "\n";
}
?>
