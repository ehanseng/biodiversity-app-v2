<?php
// Script para probar directamente la API de login
// Simula exactamente lo que hace la app React

// Configuración
$apiUrl = 'https://explora.ieeetadeo.org/biodiversity-app.php/api';
$testEmail = 'erick@ieee.org';
$testPassword = 'erick123';

echo "🧪 PROBANDO API DE LOGIN DIRECTAMENTE\n";
echo "URL: $apiUrl\n";
echo "Email: $testEmail\n";
echo "Password: $testPassword\n\n";

// 1. Probar health check
echo "1️⃣ Probando health check...\n";
$healthUrl = $apiUrl . '/health';
$healthResponse = file_get_contents($healthUrl);
echo "Health Response: $healthResponse\n\n";

// 2. Probar login
echo "2️⃣ Probando login...\n";
$loginUrl = $apiUrl . '/users/login';

$postData = json_encode([
    'email' => $testEmail,
    'password' => $testPassword
]);

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

echo "POST URL: $loginUrl\n";
echo "POST Data: $postData\n";

$loginResponse = file_get_contents($loginUrl, false, $context);

if ($loginResponse === false) {
    echo "❌ Error en la petición de login\n";
    $error = error_get_last();
    echo "Error: " . $error['message'] . "\n";
} else {
    echo "✅ Respuesta de login: $loginResponse\n";
    
    // Intentar decodificar JSON
    $userData = json_decode($loginResponse, true);
    if ($userData) {
        echo "📋 Datos del usuario:\n";
        echo "  ID: " . ($userData['id'] ?? 'N/A') . "\n";
        echo "  Email: " . ($userData['email'] ?? 'N/A') . "\n";
        echo "  Nombre: " . ($userData['full_name'] ?? 'N/A') . "\n";
        echo "  Rol: " . ($userData['role'] ?? 'N/A') . "\n";
    } else {
        echo "❌ No se pudo decodificar la respuesta JSON\n";
    }
}

echo "\n3️⃣ Probando obtener usuarios...\n";
$usersUrl = $apiUrl . '/users';
$usersResponse = file_get_contents($usersUrl);
echo "Users Response: $usersResponse\n";

echo "\n🏁 Prueba completada\n";
?>
