<?php
/**
 * Script de prueba para el endpoint de administración de usuarios
 * Verifica que todas las funcionalidades funcionen correctamente
 */

// URL base del endpoint
$baseUrl = 'https://explora.ieeetadeo.org/api/admin';
// $baseUrl = 'http://localhost/biodiversity-app/backend/admin-users-endpoint.php';

echo "🧪 Iniciando pruebas del endpoint de administración...\n\n";

/**
 * Función para hacer peticiones HTTP
 */
function makeRequest($url, $method = 'GET', $data = null) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'body' => $response,
        'data' => json_decode($response, true)
    ];
}

// Test 1: Obtener todos los usuarios
echo "1️⃣ Test: Obtener todos los usuarios\n";
$response = makeRequest("$baseUrl/users");
if ($response['code'] === 200 && $response['data']['success']) {
    $users = $response['data']['users'];
    echo "✅ Éxito: Se obtuvieron " . count($users) . " usuarios\n";
    
    // Mostrar algunos usuarios
    foreach (array_slice($users, 0, 3) as $user) {
        echo "   - {$user['full_name']} ({$user['email']}) - {$user['role']}\n";
    }
} else {
    echo "❌ Error: " . ($response['data']['message'] ?? 'Respuesta inválida') . "\n";
}
echo "\n";

// Test 2: Obtener estadísticas
echo "2️⃣ Test: Obtener estadísticas de usuarios\n";
$response = makeRequest("$baseUrl/stats/users");
if ($response['code'] === 200 && $response['data']['success']) {
    $stats = $response['data']['stats'];
    echo "✅ Éxito: Estadísticas obtenidas\n";
    echo "   - Total usuarios: {$stats['total_users']}\n";
    echo "   - Usuarios activos: {$stats['active_users']}\n";
    echo "   - Exploradores: {$stats['explorers']}\n";
    echo "   - Científicos: {$stats['scientists']}\n";
    echo "   - Administradores: {$stats['admins']}\n";
} else {
    echo "❌ Error: " . ($response['data']['message'] ?? 'Respuesta inválida') . "\n";
}
echo "\n";

// Test 3: Buscar usuarios
echo "3️⃣ Test: Buscar usuarios\n";
$response = makeRequest("$baseUrl/users/search?q=test");
if ($response['code'] === 200 && $response['data']['success']) {
    $users = $response['data']['users'];
    echo "✅ Éxito: Se encontraron " . count($users) . " usuarios con 'test'\n";
} else {
    echo "❌ Error: " . ($response['data']['message'] ?? 'Respuesta inválida') . "\n";
}
echo "\n";

// Test 4: Intentar actualizar un usuario (necesita un ID válido)
if (!empty($users) && count($users) > 0) {
    $testUser = $users[0];
    echo "4️⃣ Test: Actualizar usuario (simulado)\n";
    echo "   - Usuario de prueba: {$testUser['full_name']} (ID: {$testUser['id']})\n";
    echo "   ⚠️  Para evitar cambios reales, este test solo muestra la estructura\n";
    echo "   📝 Datos que se enviarían:\n";
    echo "      PUT $baseUrl/users/{$testUser['id']}\n";
    echo "      Body: " . json_encode([
        'full_name' => $testUser['full_name'] . ' (Actualizado)',
        'role' => $testUser['role']
    ]) . "\n";
    echo "\n";
}

// Test 5: Verificar estructura de respuestas
echo "5️⃣ Test: Verificar estructura de respuestas\n";
$response = makeRequest("$baseUrl/users");
if ($response['code'] === 200 && $response['data']['success']) {
    $user = $response['data']['users'][0] ?? null;
    if ($user) {
        $requiredFields = ['id', 'email', 'full_name', 'role', 'is_active', 'created_at', 'trees_count', 'animals_count'];
        $missingFields = [];
        
        foreach ($requiredFields as $field) {
            if (!array_key_exists($field, $user)) {
                $missingFields[] = $field;
            }
        }
        
        if (empty($missingFields)) {
            echo "✅ Éxito: Todos los campos requeridos están presentes\n";
        } else {
            echo "❌ Error: Faltan campos: " . implode(', ', $missingFields) . "\n";
        }
    }
} else {
    echo "❌ Error: No se pudo verificar la estructura\n";
}
echo "\n";

// Test 6: Verificar endpoints que requieren métodos específicos
echo "6️⃣ Test: Verificar endpoints con métodos HTTP\n";

// Test PUT (cambio de rol) - sin ejecutar realmente
echo "   📝 Endpoint de cambio de rol: PUT $baseUrl/users/{id}/role\n";
echo "   📝 Endpoint de cambio de estado: PUT $baseUrl/users/{id}/status\n";
echo "   📝 Endpoint de eliminación: DELETE $baseUrl/users/{id}\n";
echo "   ⚠️  Estos endpoints requieren IDs válidos y no se ejecutan en el test\n";
echo "\n";

echo "🎉 Pruebas completadas!\n";
echo "\n";
echo "📋 Resumen:\n";
echo "   - El endpoint debe estar disponible en: $baseUrl\n";
echo "   - Asegúrate de que la columna 'deleted_at' exista en la tabla users\n";
echo "   - Verifica que los permisos de la base de datos sean correctos\n";
echo "   - El endpoint soporta CORS para peticiones desde el frontend\n";
?>
