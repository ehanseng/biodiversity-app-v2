<?php
/**
 * Versión simplificada del endpoint de administración para debugging
 */

// Mostrar errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuración de base de datos
$host = 'localhost';
$dbname = 'ieeetadeo2006_biodiversity_app';
$username = 'ieeetadeo2006_adminIEEEtadeo';
$password = 'gvDOwV7&D^xk.LJF';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión: ' . $e->getMessage()
    ]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'PUT') {
    // Obtener datos
    $userId = $_GET['id'] ?? null;
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Log básico
    error_log("🔧 [SIMPLE] PUT request para usuario: $userId");
    error_log("🔧 [SIMPLE] Datos recibidos: " . json_encode($input));
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID requerido']);
        exit();
    }
    
    // Verificar usuario
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        exit();
    }
    
    // Actualización simple - solo los campos que vienen
    $updates = [];
    $values = [];
    
    if (isset($input['email'])) {
        $updates[] = "email = ?";
        $values[] = $input['email'];
    }
    
    if (isset($input['full_name'])) {
        $updates[] = "full_name = ?";
        $values[] = $input['full_name'];
    }
    
    if (isset($input['role'])) {
        $updates[] = "role = ?";
        $values[] = $input['role'];
    }
    
    if (isset($input['password']) && !empty($input['password'])) {
        $updates[] = "password_hash = ?";
        $values[] = password_hash($input['password'], PASSWORD_DEFAULT);
        error_log("🔧 [SIMPLE] Actualizando contraseña");
    }
    
    if (isset($input['is_active'])) {
        $updates[] = "is_active = ?";
        $values[] = $input['is_active'] ? 1 : 0;
    }
    
    if (empty($updates)) {
        echo json_encode(['success' => false, 'message' => 'No hay campos para actualizar']);
        exit();
    }
    
    // Agregar timestamp
    $updates[] = "updated_at = NOW()";
    $values[] = $userId;
    
    $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
    error_log("🔧 [SIMPLE] SQL: $sql");
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute($values);
    
    if ($result) {
        // Obtener usuario actualizado
        $stmt = $pdo->prepare("SELECT id, email, full_name, role, is_active, created_at, updated_at FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Usuario actualizado',
            'user' => $updatedUser
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error ejecutando actualización']);
    }
    
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}

?>
