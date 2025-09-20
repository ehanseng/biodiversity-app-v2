<?php
// Script para configurar la tabla de usuarios en MySQL
// Ejecutar una sola vez para crear la estructura necesaria

// Configuración de la base de datos (misma que biodiversity-final.php)
$host = 'localhost';
$user = 'ieeetadeo2006_adminIEEEtadeo';
$password = 'gvDOwV7&D^xk.LJF';
$database = 'ieeetadeo2006_biodiversity_app';

try {
    echo "🔗 Conectando a MySQL...\n";
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    echo "✅ Conexión exitosa a MySQL\n";

    // Crear tabla users si no existe
    echo "📋 Creando tabla users...\n";
    $createUsersTable = "
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(255),
            role ENUM('admin', 'scientist', 'explorer', 'visitor') DEFAULT 'explorer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    $pdo->exec($createUsersTable);
    echo "✅ Tabla users creada/verificada\n";

    // Verificar si ya existen usuarios
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $userCount = $stmt->fetchColumn();
    echo "👥 Usuarios existentes: $userCount\n";

    // Crear usuarios de prueba si no existen
    if ($userCount == 0) {
        echo "🆕 Creando usuarios de prueba...\n";
        
        $testUsers = [
            [
                'email' => 'erick@ieee.org',
                'password' => password_hash('erick123', PASSWORD_DEFAULT),
                'full_name' => 'Erick Hansen',
                'role' => 'admin'
            ],
            [
                'email' => 'admin@biodiversidad.com',
                'password' => password_hash('admin123', PASSWORD_DEFAULT),
                'full_name' => 'Administrador Sistema',
                'role' => 'admin'
            ],
            [
                'email' => 'scientist@biodiversidad.com',
                'password' => password_hash('scientist123', PASSWORD_DEFAULT),
                'full_name' => 'Dr. Científico Biólogo',
                'role' => 'scientist'
            ],
            [
                'email' => 'explorer@biodiversidad.com',
                'password' => password_hash('explorer123', PASSWORD_DEFAULT),
                'full_name' => 'Explorador Naturalista',
                'role' => 'explorer'
            ],
            [
                'email' => 'test@test.com',
                'password' => password_hash('test123', PASSWORD_DEFAULT),
                'full_name' => 'Usuario de Prueba',
                'role' => 'explorer'
            ]
        ];

        $insertStmt = $pdo->prepare("
            INSERT INTO users (email, password, full_name, role) 
            VALUES (?, ?, ?, ?)
        ");

        foreach ($testUsers as $user) {
            try {
                $insertStmt->execute([
                    $user['email'],
                    $user['password'],
                    $user['full_name'],
                    $user['role']
                ]);
                echo "✅ Usuario creado: {$user['email']} ({$user['role']})\n";
            } catch (PDOException $e) {
                echo "⚠️ Error creando usuario {$user['email']}: " . $e->getMessage() . "\n";
            }
        }
    }

    // Mostrar usuarios existentes
    echo "\n📋 Usuarios en la base de datos:\n";
    $stmt = $pdo->query("SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll();
    
    foreach ($users as $user) {
        echo "  ID: {$user['id']} | {$user['email']} | {$user['full_name']} | {$user['role']} | {$user['created_at']}\n";
    }

    echo "\n🎉 Configuración de usuarios completada exitosamente!\n";
    echo "\n📝 Credenciales de prueba:\n";
    echo "  erick@ieee.org / erick123 (Administrador Principal)\n";
    echo "  admin@biodiversidad.com / admin123 (Administrador)\n";
    echo "  scientist@biodiversidad.com / scientist123 (Científico)\n";
    echo "  explorer@biodiversidad.com / explorer123 (Explorador)\n";
    echo "  test@test.com / test123 (Prueba)\n";

} catch (PDOException $e) {
    echo "❌ Error de base de datos: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Error general: " . $e->getMessage() . "\n";
    exit(1);
}
?>
