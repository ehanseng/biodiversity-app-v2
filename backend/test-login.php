<?php
// Script de prueba para verificar login de usuarios
// Ejecutar desde navegador: http://localhost/biodiversity-app/test-login.php

// Headers para permitir CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

// Configuración de la base de datos (misma que biodiversity-final.php)
$host = 'localhost';
$user = 'ieeetadeo2006_adminIEEEtadeo';
$password = 'gvDOwV7&D^xk.LJF';
$database = 'ieeetadeo2006_biodiversity_app';

try {
    echo "<h1>🔍 Test de Login - Biodiversity App</h1>";
    echo "<p>Probando conexión y login de usuarios...</p>";

    // Conectar a MySQL
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    echo "<p>✅ Conexión a MySQL exitosa</p>";

    // Verificar tabla users
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    if ($stmt->rowCount() > 0) {
        echo "<p>✅ Tabla 'users' existe</p>";
        
        // Contar usuarios
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
        $userCount = $stmt->fetchColumn();
        echo "<p>👥 Total de usuarios: $userCount</p>";
        
        // Mostrar usuarios existentes
        echo "<h3>📋 Usuarios en la base de datos:</h3>";
        $stmt = $pdo->query("SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC");
        $users = $stmt->fetchAll();
        
        if (count($users) > 0) {
            echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
            echo "<tr><th>ID</th><th>Email</th><th>Nombre</th><th>Rol</th><th>Creado</th></tr>";
            foreach ($users as $user) {
                echo "<tr>";
                echo "<td>{$user['id']}</td>";
                echo "<td>{$user['email']}</td>";
                echo "<td>{$user['full_name']}</td>";
                echo "<td>{$user['role']}</td>";
                echo "<td>{$user['created_at']}</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p>❌ No hay usuarios en la base de datos</p>";
        }
        
        // Probar login con usuarios de prueba
        echo "<h3>🔐 Pruebas de Login:</h3>";
        
        $testCredentials = [
            ['email' => 'admin@biodiversidad.com', 'password' => 'admin123'],
            ['email' => 'scientist@biodiversidad.com', 'password' => 'scientist123'],
            ['email' => 'explorer@biodiversidad.com', 'password' => 'explorer123'],
            ['email' => 'test@test.com', 'password' => 'test123']
        ];
        
        foreach ($testCredentials as $cred) {
            echo "<h4>Probando: {$cred['email']}</h4>";
            
            // Buscar usuario
            $stmt = $pdo->prepare("SELECT id, email, full_name, role, password FROM users WHERE email = ?");
            $stmt->execute([$cred['email']]);
            $user = $stmt->fetch();
            
            if ($user) {
                // Verificar contraseña
                if (password_verify($cred['password'], $user['password'])) {
                    echo "<p>✅ Login exitoso - Usuario: {$user['full_name']} ({$user['role']})</p>";
                } else {
                    echo "<p>❌ Contraseña incorrecta</p>";
                }
            } else {
                echo "<p>❌ Usuario no encontrado</p>";
            }
        }
        
        // Probar API endpoint
        echo "<h3>🌐 Prueba de API:</h3>";
        echo "<p>URL de API: <a href='biodiversity-final.php/api/users' target='_blank'>biodiversity-final.php/api/users</a></p>";
        echo "<p>URL de Health: <a href='biodiversity-final.php/api/health' target='_blank'>biodiversity-final.php/api/health</a></p>";
        
    } else {
        echo "<p>❌ Tabla 'users' no existe. Ejecuta setup-users-table.php primero.</p>";
    }

} catch (PDOException $e) {
    echo "<p>❌ Error de base de datos: " . $e->getMessage() . "</p>";
} catch (Exception $e) {
    echo "<p>❌ Error general: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<h3>📝 Credenciales de prueba:</h3>";
echo "<ul>";
echo "<li><strong>admin@biodiversidad.com</strong> / admin123 (Administrador)</li>";
echo "<li><strong>scientist@biodiversidad.com</strong> / scientist123 (Científico)</li>";
echo "<li><strong>explorer@biodiversidad.com</strong> / explorer123 (Explorador)</li>";
echo "<li><strong>test@test.com</strong> / test123 (Prueba)</li>";
echo "</ul>";

echo "<h3>🚀 Próximos pasos:</h3>";
echo "<ol>";
echo "<li>Si no hay usuarios, ejecuta <strong>setup-users-table.php</strong></li>";
echo "<li>Verifica que la API funcione en <strong>biodiversity-final.php/api/health</strong></li>";
echo "<li>Prueba el login desde la app React</li>";
echo "</ol>";
?>
