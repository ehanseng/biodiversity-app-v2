<?php
// Endpoint simplificado SOLO para registro de usuarios
// Subir como simple-register.php

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
error_log("Simple Register - Method: " . $_SERVER['REQUEST_METHOD']);
error_log("Simple Register - URI: " . $_SERVER['REQUEST_URI']);

try {
    // Configuración de la base de datos
    $host = 'localhost';
    $user = 'ieeetadeo2006_adminIEEEtadeo';
    $password = 'gvDOwV7&D^xk.LJF';
    $database = 'ieeetadeo2006_biodiversity_app';

    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Mostrar información básica
        echo json_encode([
            'status' => 'OK',
            'message' => 'Simple Register API funcionando',
            'timestamp' => date('c'),
            'method' => 'GET'
        ]);
        exit();
    }
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Leer datos JSON
        $input = json_decode(file_get_contents('php://input'), true);
        
        error_log("Simple Register - Input: " . json_encode($input));
        
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
        
        // Crear tabla users si no existe
        $pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(255),
            role ENUM('admin', 'scientist', 'explorer', 'visitor') DEFAULT 'explorer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )");
        
        // Verificar si el email ya existe
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
        $stmt->execute([$input['email']]);
        if ($stmt->fetchColumn() > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'El email ya está registrado']);
            exit();
        }
        
        // Hash de la contraseña
        $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
        
        // Insertar usuario
        $stmt = $pdo->prepare("INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $input['email'],
            $hashedPassword,
            $input['full_name'] ?? $input['email'],
            $input['role'] ?? 'explorer'
        ]);
        
        $userId = $pdo->lastInsertId();
        
        // Devolver usuario creado (sin password)
        $stmt = $pdo->prepare("SELECT id, email, full_name, role, created_at FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        error_log("Simple Register - Usuario creado: " . json_encode($user));
        
        http_response_code(201);
        echo json_encode($user);
        exit();
    }
    
    // Método no permitido
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    
} catch (PDOException $e) {
    error_log("Simple Register - Error PDO: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Simple Register - Error general: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error del servidor: ' . $e->getMessage()]);
}
?>
