<?php
// Script para verificar usuarios en la base de datos
// Subir como: check-users.php

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');

try {
    // Configuración de la base de datos REMOTA
    $host = 'localhost';
    $user = 'ieeetadeo2006_adminIEEEtadeo';
    $password = 'gvDOwV7&D^xk.LJF';
    $database = 'ieeetadeo2006_biodiversity_app';

    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Obtener todos los usuarios
    $stmt = $pdo->prepare("SELECT id, email, full_name, role, created_at FROM users ORDER BY id");
    $stmt->execute();
    $users = $stmt->fetchAll();
    
    echo "<h1>👥 USUARIOS EN LA BASE DE DATOS</h1>";
    echo "<p><strong>Base de datos:</strong> $database</p>";
    echo "<p><strong>Total usuarios:</strong> " . count($users) . "</p>";
    
    if (count($users) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%; margin: 20px 0;'>";
        echo "<tr style='background-color: #f0f0f0;'>";
        echo "<th style='padding: 10px;'>ID</th>";
        echo "<th style='padding: 10px;'>Email</th>";
        echo "<th style='padding: 10px;'>Nombre</th>";
        echo "<th style='padding: 10px;'>Rol</th>";
        echo "<th style='padding: 10px;'>Creado</th>";
        echo "</tr>";
        
        foreach ($users as $user) {
            echo "<tr>";
            echo "<td style='padding: 8px; text-align: center;'>" . $user['id'] . "</td>";
            echo "<td style='padding: 8px;'><strong>" . htmlspecialchars($user['email']) . "</strong></td>";
            echo "<td style='padding: 8px;'>" . htmlspecialchars($user['full_name']) . "</td>";
            echo "<td style='padding: 8px; text-align: center;'>" . $user['role'] . "</td>";
            echo "<td style='padding: 8px; text-align: center;'>" . $user['created_at'] . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        echo "<h2>🔐 CREDENCIALES PARA PROBAR:</h2>";
        echo "<ul>";
        foreach ($users as $user) {
            echo "<li><strong>" . htmlspecialchars($user['email']) . "</strong> / [contraseña desconocida]</li>";
        }
        echo "</ul>";
        
        echo "<h3>⚠️ NOTA:</h3>";
        echo "<p>Si no ves el usuario <strong>explorer@vibo.co</strong>, significa que no existe en la base de datos.</p>";
        echo "<p>Puedes usar cualquiera de los emails listados arriba para hacer login.</p>";
        
    } else {
        echo "<h2 style='color: red;'>❌ NO HAY USUARIOS EN LA BASE DE DATOS</h2>";
        echo "<p>La tabla 'users' está vacía. Necesitas crear usuarios primero.</p>";
    }
    
    // También mostrar la estructura de la tabla
    echo "<hr>";
    echo "<h2>📋 ESTRUCTURA DE LA TABLA 'users':</h2>";
    $stmt = $pdo->prepare("DESCRIBE users");
    $stmt->execute();
    $columns = $stmt->fetchAll();
    
    echo "<table border='1' style='border-collapse: collapse; margin: 20px 0;'>";
    echo "<tr style='background-color: #f0f0f0;'>";
    echo "<th style='padding: 10px;'>Campo</th>";
    echo "<th style='padding: 10px;'>Tipo</th>";
    echo "<th style='padding: 10px;'>Null</th>";
    echo "<th style='padding: 10px;'>Key</th>";
    echo "<th style='padding: 10px;'>Default</th>";
    echo "</tr>";
    
    foreach ($columns as $column) {
        echo "<tr>";
        echo "<td style='padding: 8px;'><strong>" . $column['Field'] . "</strong></td>";
        echo "<td style='padding: 8px;'>" . $column['Type'] . "</td>";
        echo "<td style='padding: 8px;'>" . $column['Null'] . "</td>";
        echo "<td style='padding: 8px;'>" . $column['Key'] . "</td>";
        echo "<td style='padding: 8px;'>" . $column['Default'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
} catch (PDOException $e) {
    echo "<h1 style='color: red;'>❌ ERROR DE BASE DE DATOS</h1>";
    echo "<p><strong>Error:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Verifica la conexión a la base de datos.</p>";
} catch (Exception $e) {
    echo "<h1 style='color: red;'>❌ ERROR GENERAL</h1>";
    echo "<p><strong>Error:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
}

echo "<hr>";
echo "<p><em>Verificación completada - " . date('Y-m-d H:i:s') . "</em></p>";
?>
