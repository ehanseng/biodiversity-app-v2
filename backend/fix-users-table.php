<?php
// Script para verificar y corregir la estructura de la tabla users
// Ejecutar antes de crear usuarios

// Configuración de la base de datos
$host = 'localhost';
$user = 'ieeetadeo2006_adminIEEEtadeo';
$password = 'gvDOwV7&D^xk.LJF';
$database = 'ieeetadeo2006_biodiversity_app';

try {
    echo "🔗 Conectando a MySQL...\n";
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Conexión exitosa\n\n";

    // 1. Verificar si la tabla users existe
    echo "1️⃣ Verificando si la tabla 'users' existe...\n";
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    $tableExists = $stmt->rowCount() > 0;
    
    if ($tableExists) {
        echo "✅ La tabla 'users' existe\n";
        
        // Verificar estructura actual
        echo "📋 Estructura actual de la tabla 'users':\n";
        $stmt = $pdo->query("DESCRIBE users");
        $columns = $stmt->fetchAll();
        
        foreach ($columns as $column) {
            echo "  - {$column['Field']} ({$column['Type']}) {$column['Null']} {$column['Key']} {$column['Default']}\n";
        }
        
        // Verificar si falta la columna password
        $hasPassword = false;
        foreach ($columns as $column) {
            if ($column['Field'] === 'password') {
                $hasPassword = true;
                break;
            }
        }
        
        if (!$hasPassword) {
            echo "\n⚠️ Falta la columna 'password', agregándola...\n";
            $pdo->exec("ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL AFTER email");
            echo "✅ Columna 'password' agregada\n";
        } else {
            echo "✅ La columna 'password' ya existe\n";
        }
        
    } else {
        echo "❌ La tabla 'users' NO existe\n";
        echo "🔧 Creando tabla 'users'...\n";
        
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
    }

    // 2. Mostrar estructura final
    echo "\n2️⃣ Estructura final de la tabla 'users':\n";
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll();
    
    foreach ($columns as $column) {
        echo "  - {$column['Field']} ({$column['Type']}) {$column['Null']} {$column['Key']} {$column['Default']}\n";
    }

    // 3. Verificar usuarios existentes
    echo "\n3️⃣ Usuarios existentes:\n";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $userCount = $stmt->fetchColumn();
    echo "Total usuarios: $userCount\n";
    
    if ($userCount > 0) {
        $stmt = $pdo->query("SELECT id, email, full_name, role FROM users");
        $users = $stmt->fetchAll();
        foreach ($users as $user) {
            echo "  - ID: {$user['id']} | {$user['email']} | {$user['full_name']} | {$user['role']}\n";
        }
    }

    // 4. Crear usuario erick@ieee.org si no existe
    echo "\n4️⃣ Verificando usuario erick@ieee.org...\n";
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
    $stmt->execute(['erick@ieee.org']);
    $erickExists = $stmt->fetchColumn() > 0;

    if ($erickExists) {
        echo "✅ El usuario erick@ieee.org ya existe\n";
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

    // 5. Mostrar usuarios finales
    echo "\n5️⃣ Usuarios finales en la base de datos:\n";
    $stmt = $pdo->query("SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll();
    
    foreach ($users as $user) {
        echo "  ID: {$user['id']} | {$user['email']} | {$user['full_name']} | {$user['role']} | {$user['created_at']}\n";
    }

    echo "\n🎉 Configuración completada exitosamente!\n";
    echo "📝 Credenciales para login:\n";
    echo "  Email: erick@ieee.org\n";
    echo "  Contraseña: erick123\n";
    echo "  Rol: admin\n";

} catch (PDOException $e) {
    echo "❌ Error de base de datos: " . $e->getMessage() . "\n";
    echo "📋 Detalles del error:\n";
    echo "  Código: " . $e->getCode() . "\n";
    echo "  Archivo: " . $e->getFile() . "\n";
    echo "  Línea: " . $e->getLine() . "\n";
} catch (Exception $e) {
    echo "❌ Error general: " . $e->getMessage() . "\n";
}
?>
