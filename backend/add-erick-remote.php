<?php
// Script para agregar usuario erick@ieee.org al servidor remoto
// Usar la API remota que ya funciona

echo "<h1>🚀 AGREGANDO USUARIO AL SERVIDOR REMOTO</h1>";

$apiUrl = 'https://explora.ieeetadeo.org/biodiversity-app.php/api/users';
$userData = [
    'email' => 'erick@ieee.org',
    'password' => 'erick123',
    'full_name' => 'Erick Hansen',
    'role' => 'admin'
];

echo "<h2>📋 Datos del usuario:</h2>";
echo "<pre>" . json_encode($userData, JSON_PRETTY_PRINT) . "</pre>";

echo "<h2>🌐 Enviando petición POST...</h2>";
echo "<p><strong>URL:</strong> $apiUrl</p>";

// Preparar datos para POST
$postData = json_encode($userData);

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => [
            'Content-Type: application/json',
            'Content-Length: ' . strlen($postData)
        ],
        'content' => $postData
    ]
]);

$response = file_get_contents($apiUrl, false, $context);

if ($response === false) {
    echo "<h3 style='color: red;'>❌ Error en la petición</h3>";
    $error = error_get_last();
    echo "<p>Error: " . $error['message'] . "</p>";
} else {
    echo "<h3 style='color: green;'>✅ Respuesta recibida</h3>";
    echo "<pre>$response</pre>";
    
    // Intentar decodificar JSON
    $result = json_decode($response, true);
    if ($result) {
        if (isset($result['error'])) {
            echo "<h3 style='color: orange;'>⚠️ Error del servidor:</h3>";
            echo "<p>" . $result['error'] . "</p>";
            
            if (strpos($result['error'], 'ya está registrado') !== false) {
                echo "<p><strong>✅ El usuario ya existe, puedes hacer login con:</strong></p>";
                echo "<ul>";
                echo "<li>Email: erick@ieee.org</li>";
                echo "<li>Contraseña: erick123</li>";
                echo "</ul>";
            }
        } else {
            echo "<h3 style='color: green;'>🎉 Usuario creado exitosamente:</h3>";
            echo "<ul>";
            echo "<li><strong>ID:</strong> " . ($result['id'] ?? 'N/A') . "</li>";
            echo "<li><strong>Email:</strong> " . ($result['email'] ?? 'N/A') . "</li>";
            echo "<li><strong>Nombre:</strong> " . ($result['full_name'] ?? 'N/A') . "</li>";
            echo "<li><strong>Rol:</strong> " . ($result['role'] ?? 'N/A') . "</li>";
            echo "<li><strong>Creado:</strong> " . ($result['created_at'] ?? 'N/A') . "</li>";
            echo "</ul>";
        }
    } else {
        echo "<h3 style='color: orange;'>⚠️ Respuesta no es JSON válido</h3>";
    }
}

echo "<hr>";
echo "<h2>🔍 Verificar usuarios existentes</h2>";

// Obtener lista de usuarios
$usersResponse = file_get_contents('https://explora.ieeetadeo.org/biodiversity-app.php/api/users');
if ($usersResponse) {
    $users = json_decode($usersResponse, true);
    if ($users && is_array($users)) {
        echo "<h3>👥 Usuarios en el servidor:</h3>";
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Email</th><th>Nombre</th><th>Rol</th><th>Creado</th></tr>";
        foreach ($users as $user) {
            $highlight = ($user['email'] === 'erick@ieee.org') ? 'style="background-color: #90EE90;"' : '';
            echo "<tr $highlight>";
            echo "<td>" . ($user['id'] ?? 'N/A') . "</td>";
            echo "<td>" . ($user['email'] ?? 'N/A') . "</td>";
            echo "<td>" . ($user['full_name'] ?? 'N/A') . "</td>";
            echo "<td>" . ($user['role'] ?? 'N/A') . "</td>";
            echo "<td>" . ($user['created_at'] ?? 'N/A') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // Verificar si erick@ieee.org existe
        $erickExists = false;
        foreach ($users as $user) {
            if ($user['email'] === 'erick@ieee.org') {
                $erickExists = true;
                break;
            }
        }
        
        if ($erickExists) {
            echo "<h3 style='color: green;'>✅ Usuario erick@ieee.org confirmado en el servidor</h3>";
            echo "<p><strong>Ahora puedes:</strong></p>";
            echo "<ul>";
            echo "<li>Hacer login desde la app con: erick@ieee.org / erick123</li>";
            echo "<li>O registrarte con otro email si prefieres</li>";
            echo "</ul>";
        } else {
            echo "<h3 style='color: red;'>❌ Usuario erick@ieee.org NO encontrado</h3>";
        }
    }
}

echo "<hr>";
echo "<p><em>Proceso completado - " . date('Y-m-d H:i:s') . "</em></p>";
?>
