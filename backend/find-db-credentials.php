<?php
// Script para encontrar las credenciales correctas de la base de datos
// Subir como: find-db-credentials.php

header('Access-Control-Allow-Origin: *');
header('Content-Type: text/html; charset=utf-8');

echo "<h2>🔍 Buscando credenciales de base de datos</h2>";

// Posibles combinaciones de credenciales
$credentials = [
    // Opción 1: Credenciales originales del login
    [
        'host' => 'localhost',
        'dbname' => 'ieeetade_biodiversity',
        'username' => 'ieeetade_bio_user',
        'password' => 'BioUser2024!'
    ],
    // Opción 2: Usuario root
    [
        'host' => 'localhost',
        'dbname' => 'ieeetade_biodiversity',
        'username' => 'root',
        'password' => ''
    ],
    // Opción 3: Usuario ieeetade
    [
        'host' => 'localhost',
        'dbname' => 'ieeetade_biodiversity',
        'username' => 'ieeetade',
        'password' => ''
    ],
    // Opción 4: Credenciales del hosting
    [
        'host' => 'localhost',
        'dbname' => 'ieeetade_biodiversity',
        'username' => 'ieeetade_biodiversity',
        'password' => 'biodiversity123'
    ],
    // Opción 5: Otras variaciones
    [
        'host' => 'localhost',
        'dbname' => 'ieeetade_biodiversity',
        'username' => 'ieeetade_user',
        'password' => 'password123'
    ]
];

foreach ($credentials as $index => $cred) {
    $option = $index + 1;
    echo "<h3>Opción $option: {$cred['username']}@{$cred['host']}</h3>";
    
    try {
        $pdo = new PDO(
            "mysql:host={$cred['host']};dbname={$cred['dbname']};charset=utf8", 
            $cred['username'], 
            $cred['password']
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        echo "<p style='color: green;'>✅ <strong>CONEXIÓN EXITOSA!</strong></p>";
        
        // Verificar tablas
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        echo "<p><strong>Tablas encontradas:</strong> " . implode(', ', $tables) . "</p>";
        
        // Verificar tabla users
        if (in_array('users', $tables)) {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
            $userCount = $stmt->fetch(PDO::FETCH_ASSOC);
            echo "<p><strong>Usuarios:</strong> {$userCount['count']}</p>";
        }
        
        // Verificar tabla trees
        if (in_array('trees', $tables)) {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM trees");
            $treeCount = $stmt->fetch(PDO::FETCH_ASSOC);
            echo "<p><strong>Árboles:</strong> {$treeCount['count']}</p>";
        } else {
            echo "<p style='color: orange;'>⚠️ Tabla 'trees' no existe</p>";
        }
        
        echo "<hr>";
        echo "<h4>🎯 CREDENCIALES CORRECTAS ENCONTRADAS:</h4>";
        echo "<pre>";
        echo "\$host = '{$cred['host']}';\n";
        echo "\$dbname = '{$cred['dbname']}';\n";
        echo "\$username = '{$cred['username']}';\n";
        echo "\$password = '{$cred['password']}';\n";
        echo "</pre>";
        
        break; // Salir del loop si encontramos credenciales que funcionan
        
    } catch (PDOException $e) {
        echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
    }
    
    echo "<hr>";
}

// También intentar leer el archivo de configuración existente
echo "<h3>🔍 Buscando archivos de configuración existentes</h3>";

$configFiles = [
    'biodiversity-app.php',
    'config.php',
    'database.php',
    'simple-login-endpoint.php'
];

foreach ($configFiles as $file) {
    if (file_exists($file)) {
        echo "<h4>📄 Archivo encontrado: $file</h4>";
        $content = file_get_contents($file);
        
        // Buscar credenciales en el contenido
        if (preg_match('/\$host\s*=\s*[\'"]([^\'"]+)[\'"]/', $content, $matches)) {
            echo "<p>Host encontrado: <strong>{$matches[1]}</strong></p>";
        }
        if (preg_match('/\$dbname\s*=\s*[\'"]([^\'"]+)[\'"]/', $content, $matches)) {
            echo "<p>Database encontrada: <strong>{$matches[1]}</strong></p>";
        }
        if (preg_match('/\$username\s*=\s*[\'"]([^\'"]+)[\'"]/', $content, $matches)) {
            echo "<p>Username encontrado: <strong>{$matches[1]}</strong></p>";
        }
    }
}
?>
