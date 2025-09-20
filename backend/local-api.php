<?php
// API local para registro y login de usuarios
// Colocar en: C:\xampp\htdocs\biodiversity-app\local-api.php
// Acceder desde: http://localhost/biodiversity-app/local-api.php

// Headers CORS para desarrollo local
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuración de la base de datos LOCAL
$host = 'localhost';
$user = 'root';  // Usuario por defecto de XAMPP
$password = '';  // Contraseña vacía por defecto en XAMPP
$database = 'biodiversity_app';

try {
    // Conectar a MySQL
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Crear base de datos si no existe
    $pdo->exec("CREATE DATABASE IF NOT EXISTS $database");
    $pdo->exec("USE $database");
    
    // Crear tabla users si no existe
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role ENUM('admin', 'scientist', 'explorer', 'visitor') DEFAULT 'explorer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión: ' . $e->getMessage()]);
    exit();
}

// Obtener el endpoint de la URL
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Extraer endpoint después de local-api.php
if (strpos($path, 'local-api.php') !== false) {
    $parts = explode('local-api.php', $path);
    $endpoint = isset($parts[1]) ? trim($parts[1], '/') : '';
} else {
    $endpoint = '';
}

$method = $_SERVER['REQUEST_METHOD'];

// Log para debugging
error_log("Local API - Method: $method, Endpoint: '$endpoint'");

// Manejar diferentes endpoints
switch ($endpoint) {
    case 'users':
        handleUsers($pdo);
        break;
    case 'users/login':
        handleLogin($pdo);
        break;
    case 'health':
        echo json_encode([
            'status' => 'OK',
            'message' => 'API Local funcionando',
            'timestamp' => date('c'),
            'database' => $database
        ]);
        break;
    default:
        echo json_encode([
            'message' => 'API Local Biodiversity v1.0',
            'endpoints' => [
                'POST /users' => 'Crear usuario',
                'POST /users/login' => 'Login usuario',
                'GET /health' => 'Estado de la API'
            ],
            'detected_endpoint' => $endpoint,
            'method' => $method
        ]);
        break;
}

// Función para manejar usuarios (registro)
function handleUsers($pdo) {
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'POST') {
        // Registro de usuario
        $input = json_decode(file_get_contents('php://input'), true);
        
        error_log("Local API - Registro input: " . json_encode($input));
        
        if (!$input || !isset($input['email']) || !isset($input['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email y contraseña requeridos']);
            return;
        }
        
        try {
            // Verificar si el email ya existe
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
            $stmt->execute([$input['email']]);
            if ($stmt->fetchColumn() > 0) {
                http_response_code(409);
                echo json_encode(['error' => 'El email ya está registrado']);
                return;
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
            
            error_log("Local API - Usuario creado: " . json_encode($user));
            
            http_response_code(201);
            echo json_encode($user);
            
        } catch (PDOException $e) {
            error_log("Local API - Error PDO: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
        }
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
    }
}

// Función para manejar login
function handleLogin($pdo) {
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        error_log("Local API - Login input: " . json_encode($input));
        
        if (!$input || !isset($input['email']) || !isset($input['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email y contraseña requeridos']);
            return;
        }
        
        try {
            $stmt = $pdo->prepare("SELECT id, email, full_name, role, password FROM users WHERE email = ?");
            $stmt->execute([$input['email']]);
            $user = $stmt->fetch();
            
            if ($user && password_verify($input['password'], $user['password'])) {
                // Login exitoso - no devolver password
                unset($user['password']);
                echo json_encode($user);
            } else {
                http_response_code(401);
                echo json_encode(['error' => 'Credenciales inválidas']);
            }
            
        } catch (PDOException $e) {
            error_log("Local API - Error login: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
        }
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
    }
}
?>
