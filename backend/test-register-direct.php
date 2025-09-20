<?php
// Script para probar directamente el endpoint de registro
// Ejecutar desde navegador: https://explora.ieeetadeo.org/test-register-direct.php

echo "<h1>🧪 PRUEBA DIRECTA DE REGISTRO</h1>";

// Configuración
$apiUrl = 'https://explora.ieeetadeo.org/biodiversity-app.php/api/users';
$testUser = [
    'email' => 'erick@ieee.org',
    'password' => 'erick123',
    'full_name' => 'Erick Hansen',
    'role' => 'admin'
];

echo "<h2>📋 Datos de prueba:</h2>";
echo "<pre>" . json_encode($testUser, JSON_PRETTY_PRINT) . "</pre>";

echo "<h2>🌐 Probando registro...</h2>";

// Hacer petición POST
$postData = json_encode($testUser);

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

echo "<p><strong>URL:</strong> $apiUrl</p>";
echo "<p><strong>Método:</strong> POST</p>";
echo "<p><strong>Datos:</strong></p>";
echo "<pre>$postData</pre>";

$response = file_get_contents($apiUrl, false, $context);

if ($response === false) {
    echo "<h3 style='color: red;'>❌ Error en la petición</h3>";
    $error = error_get_last();
    echo "<p>Error: " . $error['message'] . "</p>";
} else {
    echo "<h3 style='color: green;'>✅ Respuesta recibida</h3>";
    echo "<pre>$response</pre>";
    
    // Intentar decodificar JSON
    $userData = json_decode($response, true);
    if ($userData) {
        echo "<h3>📋 Datos del usuario creado:</h3>";
        echo "<ul>";
        echo "<li><strong>ID:</strong> " . ($userData['id'] ?? 'N/A') . "</li>";
        echo "<li><strong>Email:</strong> " . ($userData['email'] ?? 'N/A') . "</li>";
        echo "<li><strong>Nombre:</strong> " . ($userData['full_name'] ?? 'N/A') . "</li>";
        echo "<li><strong>Rol:</strong> " . ($userData['role'] ?? 'N/A') . "</li>";
        echo "<li><strong>Creado:</strong> " . ($userData['created_at'] ?? 'N/A') . "</li>";
        echo "</ul>";
    } else {
        echo "<h3 style='color: orange;'>⚠️ No se pudo decodificar la respuesta JSON</h3>";
    }
}

echo "<hr>";
echo "<h2>🔍 Verificar usuarios existentes</h2>";

// Obtener usuarios existentes
$usersResponse = file_get_contents('https://explora.ieeetadeo.org/biodiversity-app.php/api/users');
if ($usersResponse) {
    $users = json_decode($usersResponse, true);
    if ($users && is_array($users)) {
        echo "<h3>👥 Usuarios en la base de datos:</h3>";
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Email</th><th>Nombre</th><th>Rol</th><th>Creado</th></tr>";
        foreach ($users as $user) {
            echo "<tr>";
            echo "<td>" . ($user['id'] ?? 'N/A') . "</td>";
            echo "<td>" . ($user['email'] ?? 'N/A') . "</td>";
            echo "<td>" . ($user['full_name'] ?? 'N/A') . "</td>";
            echo "<td>" . ($user['role'] ?? 'N/A') . "</td>";
            echo "<td>" . ($user['created_at'] ?? 'N/A') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No se pudieron obtener los usuarios</p>";
    }
} else {
    echo "<p>Error obteniendo usuarios</p>";
}

echo "<hr>";
echo "<p><em>Prueba completada - " . date('Y-m-d H:i:s') . "</em></p>";
?>
