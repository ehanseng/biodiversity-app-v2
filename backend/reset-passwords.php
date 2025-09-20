<?php
// Script para resetear contraseñas de usuarios existentes
// Subir como: reset-passwords.php

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Content-Type: text/html; charset=UTF-8');

try {
    // Configuración de la base de datos REMOTA
    $host = 'localhost';
    $user = 'ieeetadeo2006_adminIEEEtadeo';
    $password = 'gvDOwV7&D^xk.LJF';
    $database = 'ieeetadeo2006_biodiversity_app';

    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h1>🔐 RESETEANDO CONTRASEÑAS DE USUARIOS</h1>";
    echo "<p><strong>Base de datos:</strong> $database</p>";
    
    // Definir usuarios con sus nuevas contraseñas
    $users = [
        ['email' => 'explorer@vibo.co', 'password' => 'explorer123'],
        ['email' => 'scientist@vibo.co', 'password' => 'scientist123'],
        ['email' => 'admin@vibo.co', 'password' => 'admin123']
    ];
    
    echo "<h2>📝 Actualizando contraseñas...</h2>";
    
    foreach ($users as $userData) {
        $email = $userData['email'];
        $plainPassword = $userData['password'];
        $hashedPassword = password_hash($plainPassword, PASSWORD_DEFAULT);
        
        // Actualizar contraseña
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
        $result = $stmt->execute([$hashedPassword, $email]);
        
        if ($result && $stmt->rowCount() > 0) {
            echo "<p style='color: green;'>✅ <strong>$email</strong> → Contraseña actualizada a: <strong>$plainPassword</strong></p>";
        } else {
            echo "<p style='color: red;'>❌ <strong>$email</strong> → No se pudo actualizar (usuario no encontrado)</p>";
        }
    }
    
    echo "<hr>";
    echo "<h2>🎯 CREDENCIALES ACTUALIZADAS:</h2>";
    echo "<table border='1' style='border-collapse: collapse; width: 100%; margin: 20px 0;'>";
    echo "<tr style='background-color: #f0f0f0;'>";
    echo "<th style='padding: 10px;'>Email</th>";
    echo "<th style='padding: 10px;'>Contraseña</th>";
    echo "<th style='padding: 10px;'>Rol</th>";
    echo "</tr>";
    
    foreach ($users as $userData) {
        echo "<tr>";
        echo "<td style='padding: 8px;'><strong>" . htmlspecialchars($userData['email']) . "</strong></td>";
        echo "<td style='padding: 8px; background-color: #ffffcc;'><strong>" . htmlspecialchars($userData['password']) . "</strong></td>";
        echo "<td style='padding: 8px;'>" . str_replace('@vibo.co', '', $userData['email']) . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    echo "<h3>🚀 AHORA PUEDES HACER LOGIN CON:</h3>";
    echo "<ul>";
    foreach ($users as $userData) {
        echo "<li><strong>" . htmlspecialchars($userData['email']) . "</strong> / <strong>" . htmlspecialchars($userData['password']) . "</strong></li>";
    }
    echo "</ul>";
    
    echo "<h3>⚠️ IMPORTANTE:</h3>";
    echo "<p>Las contraseñas han sido hasheadas correctamente en la base de datos.</p>";
    echo "<p>Ahora puedes usar estas credenciales en tu app para hacer login.</p>";
    
    // Verificar que las contraseñas se guardaron correctamente
    echo "<hr>";
    echo "<h2>🔍 VERIFICACIÓN:</h2>";
    
    foreach ($users as $userData) {
        $email = $userData['email'];
        $plainPassword = $userData['password'];
        
        $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($plainPassword, $user['password_hash'])) {
            echo "<p style='color: green;'>✅ <strong>$email</strong> → Verificación exitosa</p>";
        } else {
            echo "<p style='color: red;'>❌ <strong>$email</strong> → Error en verificación</p>";
        }
    }
    
} catch (PDOException $e) {
    echo "<h1 style='color: red;'>❌ ERROR DE BASE DE DATOS</h1>";
    echo "<p><strong>Error:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
} catch (Exception $e) {
    echo "<h1 style='color: red;'>❌ ERROR GENERAL</h1>";
    echo "<p><strong>Error:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
}

echo "<hr>";
echo "<p><em>Proceso completado - " . date('Y-m-d H:i:s') . "</em></p>";
?>
