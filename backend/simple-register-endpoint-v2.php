<?php
// Endpoint simple SOLO para registro - subir al servidor remoto
// Subir como: simple-register-endpoint-v2.php
// URL: https://explora.ieeetadeo.org/simple-register-endpoint-v2.php

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Log para debugging
error_log("Simple Register Endpoint V2 - Method: " . $_SERVER['REQUEST_METHOD']);
error_log("Simple Register Endpoint V2 - URI: " . $_SERVER['REQUEST_URI']);

try {
    // Configuración de la base de datos REMOTA (mismas credenciales que login)
    $host = 'localhost';
    $user = 'ieeetadeo2006_adminIEEEtadeo';
    $password = 'gvDOwV7&D^xk.LJF';
    $database = 'ieeetadeo2006_biodiversity_app';

    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Mostrar información básica para testing
        echo json_encode([
            'status' => 'success',
            'message' => 'Endpoint de registro funcionando',
            'method' => 'GET',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Obtener datos JSON del request
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            error_log("Simple Register V2 - Error: No se recibieron datos JSON");
            http_response_code(400);
            echo json_encode(['error' => 'No se recibieron datos válidos']);
            exit();
        }
        
        error_log("Simple Register V2 - Datos recibidos: " . json_encode($input));
        
        // Validar campos requeridos
        if (empty($input['email']) || empty($input['password'])) {
            error_log("Simple Register V2 - Error: Faltan campos requeridos");
            http_response_code(400);
            echo json_encode(['error' => 'Email y password son requeridos']);
            exit();
        }
        
        $email = trim($input['email']);
        $password = $input['password'];
        $full_name = $input['full_name'] ?? $email;
        $role = $input['role'] ?? 'explorer';
        
        // Verificar si el usuario ya existe
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        
        if ($stmt->fetch()) {
            error_log("Simple Register V2 - Error: Usuario ya existe: $email");
            http_response_code(409);
            echo json_encode(['error' => 'El usuario ya existe']);
            exit();
        }
        
        // Hash de la contraseña
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        
        // Insertar nuevo usuario
        $stmt = $pdo->prepare("
            INSERT INTO users (email, password_hash, full_name, role, created_at, updated_at) 
            VALUES (?, ?, ?, ?, NOW(), NOW())
        ");
        
        $result = $stmt->execute([$email, $password_hash, $full_name, $role]);
        
        if ($result) {
            $userId = $pdo->lastInsertId();
            
            // Obtener el usuario creado (sin password_hash)
            $stmt = $pdo->prepare("SELECT id, email, full_name, role, created_at FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $newUser = $stmt->fetch(PDO::FETCH_ASSOC);
            
            error_log("Simple Register V2 - Usuario creado exitosamente: ID $userId, Email: $email");
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Usuario registrado exitosamente',
                'user' => $newUser
            ]);
        } else {
            error_log("Simple Register V2 - Error al insertar usuario");
            http_response_code(500);
            echo json_encode(['error' => 'Error al crear usuario']);
        }
        
    } else {
        error_log("Simple Register V2 - Método no permitido: " . $_SERVER['REQUEST_METHOD']);
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
    }
    
} catch (PDOException $e) {
    error_log("Simple Register V2 - Error de base de datos: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Simple Register V2 - Error general: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor: ' . $e->getMessage()]);
}
?>
