<?php
/**
 * Script de prueba simple para diagnosticar el problema de actualización de usuarios
 */

// Mostrar errores en pantalla
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h2>🔧 Diagnóstico de Actualización de Usuarios</h2>\n";

// Configuración de base de datos
$host = 'localhost';
$dbname = 'ieeetadeo2006_biodiversity_app';
$username = 'ieeetadeo2006_adminIEEEtadeo';
$password = 'gvDOwV7&D^xk.LJF';

try {
    echo "<p>📡 Conectando a la base de datos...</p>\n";
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p>✅ Conexión exitosa</p>\n";

    // Verificar estructura de la tabla users
    echo "<h3>📋 Estructura de la tabla users:</h3>\n";
    $stmt = $pdo->prepare("DESCRIBE users");
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1' style='border-collapse: collapse;'>\n";
    echo "<tr><th>Campo</th><th>Tipo</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>\n";
    foreach ($columns as $column) {
        echo "<tr>";
        echo "<td>{$column['Field']}</td>";
        echo "<td>{$column['Type']}</td>";
        echo "<td>{$column['Null']}</td>";
        echo "<td>{$column['Key']}</td>";
        echo "<td>{$column['Default']}</td>";
        echo "<td>{$column['Extra']}</td>";
        echo "</tr>\n";
    }
    echo "</table>\n";

    // Obtener usuarios disponibles
    echo "<h3>👥 Usuarios disponibles:</h3>\n";
    $stmt = $pdo->prepare("SELECT id, email, full_name, role, is_active FROM users ORDER BY id");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1' style='border-collapse: collapse;'>\n";
    echo "<tr><th>ID</th><th>Email</th><th>Nombre</th><th>Rol</th><th>Activo</th></tr>\n";
    foreach ($users as $user) {
        echo "<tr>";
        echo "<td>{$user['id']}</td>";
        echo "<td>{$user['email']}</td>";
        echo "<td>{$user['full_name']}</td>";
        echo "<td>{$user['role']}</td>";
        echo "<td>" . ($user['is_active'] ? 'Sí' : 'No') . "</td>";
        echo "</tr>\n";
    }
    echo "</table>\n";

    // Probar actualización del usuario ID=7 (el que está fallando)
    $testUserId = 7;
    echo "<h3>🧪 Probando actualización del usuario ID=$testUserId:</h3>\n";
    
    // Verificar si existe
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$testUserId]);
    $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$existingUser) {
        echo "<p>❌ Usuario ID=$testUserId no encontrado</p>\n";
    } else {
        echo "<p>✅ Usuario encontrado: {$existingUser['email']}</p>\n";
        
        // Intentar actualización simple (solo email)
        echo "<p>🔄 Intentando actualización simple (solo updated_at)...</p>\n";
        
        try {
            $sql = "UPDATE users SET updated_at = NOW() WHERE id = ?";
            echo "<p>📝 SQL: $sql</p>\n";
            
            $stmt = $pdo->prepare($sql);
            $result = $stmt->execute([$testUserId]);
            
            echo "<p>✅ Actualización simple exitosa. Filas afectadas: " . $stmt->rowCount() . "</p>\n";
            
            // Ahora probar con contraseña
            echo "<p>🔐 Intentando actualización con contraseña...</p>\n";
            
            $newPassword = 'testPassword123';
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            echo "<p>🔑 Hash generado: " . substr($hashedPassword, 0, 30) . "...</p>\n";
            
            $sql2 = "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?";
            echo "<p>📝 SQL: $sql2</p>\n";
            
            $stmt2 = $pdo->prepare($sql2);
            $result2 = $stmt2->execute([$hashedPassword, $testUserId]);
            
            echo "<p>✅ Actualización con contraseña exitosa. Filas afectadas: " . $stmt2->rowCount() . "</p>\n";
            
            // Verificar que la contraseña se guardó correctamente
            $stmt3 = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
            $stmt3->execute([$testUserId]);
            $storedPassword = $stmt3->fetchColumn();
            
            if (password_verify($newPassword, $storedPassword)) {
                echo "<p>✅ Verificación de contraseña exitosa</p>\n";
            } else {
                echo "<p>❌ Error en verificación de contraseña</p>\n";
            }
            
        } catch (Exception $e) {
            echo "<p>❌ Error durante actualización: " . $e->getMessage() . "</p>\n";
            echo "<p>📍 Archivo: " . $e->getFile() . "</p>\n";
            echo "<p>📍 Línea: " . $e->getLine() . "</p>\n";
        }
    }

} catch (Exception $e) {
    echo "<p>❌ Error de conexión: " . $e->getMessage() . "</p>\n";
    echo "<p>📍 Archivo: " . $e->getFile() . "</p>\n";
    echo "<p>📍 Línea: " . $e->getLine() . "</p>\n";
}

echo "<h3>🏁 Diagnóstico completado</h3>\n";
?>
