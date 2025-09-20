<?php
// Endpoint simple SOLO para login - subir al servidor remoto
// Subir como: simple-login-endpoint.php

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Log para debugging
error_log("Simple Login Endpoint - Method: " . $_SERVER['REQUEST_METHOD']);
error_log("Simple Login Endpoint - URI: " . $_SERVER['REQUEST_URI']);

try {
    // Configuración de la base de datos REMOTA
    $host = 'localhost';
    $user = 'ieeetadeo2006_adminIEEEtadeo';
    $password = 'gvDOwV7&D^xk.LJF';
    $database = 'ieeetadeo2006_biodiversity_app';

    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Mostrar información básica y usuarios disponibles
        echo json_encode([
            'status' => 'OK',
            'message' => 'Simple Login Endpoint funcionando',
            'timestamp' => date('c'),
            'method' => 'GET',
            'database' => $database,
            'info' => 'Envía POST con email y password para hacer login'
        ]);
        exit();
    }
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Leer datos JSON
        $input = json_decode(file_get_contents('php://input'), true);
        
        error_log("Simple Login Endpoint - Input: " . json_encode($input));
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => 'No se recibieron datos JSON válidos']);
            exit();
        }
        
        if (!isset($input['email']) || !isset($input['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email y contraseña requeridos']);
            exit();
        }
        
        // Buscar usuario por email
        $stmt = $pdo->prepare("SELECT id, email, full_name, role, password_hash FROM users WHERE email = ?");
        $stmt->execute([$input['email']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            error_log("Simple Login Endpoint - Usuario no encontrado: " . $input['email']);
            http_response_code(401);
            echo json_encode(['error' => 'Credenciales inválidas']);
            exit();
        }
        
        // Verificar contraseña
        if (!password_verify($input['password'], $user['password_hash'])) {
            error_log("Simple Login Endpoint - Contraseña incorrecta para: " . $input['email']);
            http_response_code(401);
            echo json_encode(['error' => 'Credenciales inválidas']);
            exit();
        }
        
        // Login exitoso - devolver usuario sin password
        unset($user['password_hash']);
        
        error_log("Simple Login Endpoint - Login exitoso: " . json_encode($user));
        
        http_response_code(200);
        echo json_encode($user);
        exit();
    }
    
    // Método no permitido
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    
} catch (PDOException $e) {
    error_log("Simple Login Endpoint - Error PDO: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Simple Login Endpoint - Error general: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error del servidor: ' . $e->getMessage()]);
}
?>
