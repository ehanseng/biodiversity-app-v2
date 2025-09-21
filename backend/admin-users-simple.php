<?php
/**
 * Admin Users Endpoint - Versión simplificada
 */

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
        'message' => 'Error de conexión a la base de datos: ' . $e->getMessage()
    ]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Obtener datos JSON del cuerpo de la petición
$input = json_decode(file_get_contents('php://input'), true);

try {
    if ($method === 'GET') {
        // Primero verificar qué columnas existen
        $stmt = $pdo->prepare("DESCRIBE users");
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Construir query basado en columnas disponibles
        $selectFields = ['id', 'email', 'full_name'];
        
        // Agregar columnas opcionales si existen
        if (in_array('role', $columns)) {
            $selectFields[] = 'role';
        }
        if (in_array('is_active', $columns)) {
            $selectFields[] = 'is_active';
        }
        if (in_array('created_at', $columns)) {
            $selectFields[] = 'created_at';
        }
        if (in_array('updated_at', $columns)) {
            $selectFields[] = 'updated_at';
        }
        
        // Agregar conteos de árboles y animales
        $selectFields[] = '(SELECT COUNT(*) FROM trees WHERE user_id = users.id) as trees_count';
        $selectFields[] = '(SELECT COUNT(*) FROM animals WHERE user_id = users.id) as animals_count';
        
        $sql = "SELECT " . implode(', ', $selectFields) . " FROM users ORDER BY created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Convertir campos numéricos y agregar valores por defecto
        foreach ($users as &$user) {
            $user['id'] = (int)$user['id'];
            
            // Agregar valores por defecto para campos faltantes
            if (!isset($user['is_active'])) {
                $user['is_active'] = true; // Por defecto activo
            } else {
                $user['is_active'] = (bool)$user['is_active'];
            }
            
            if (!isset($user['role'])) {
                $user['role'] = 'explorer'; // Por defecto explorer
            }
            
            if (!isset($user['created_at'])) {
                $user['created_at'] = date('Y-m-d H:i:s');
            }
            
            if (!isset($user['updated_at'])) {
                $user['updated_at'] = date('Y-m-d H:i:s');
            }
            
            $user['trees_count'] = (int)($user['trees_count'] ?? 0);
            $user['animals_count'] = (int)($user['animals_count'] ?? 0);
        }

        echo json_encode([
            'success' => true,
            'users' => $users,
            'total' => count($users)
        ]);
        
    } elseif ($method === 'PUT') {
        // DEBUG: Log de información de la petición PUT
        error_log("=== DEBUG PUT REQUEST ===");
        error_log("Input JSON: " . json_encode($input));
        error_log("GET params: " . json_encode($_GET));
        error_log("Path parts: " . json_encode($pathParts));
        
        // Manejar actualizaciones PUT
        // Extraer ID del usuario de la URL o del input
        $userId = null;
        
        // Buscar ID en la URL (ej: /admin-users-simple.php/123)
        if (count($pathParts) > 1 && is_numeric(end($pathParts))) {
            $userId = (int)end($pathParts);
        }
        
        // Si no se encuentra en URL, buscar en query params
        if (!$userId && isset($_GET['id'])) {
            $userId = (int)$_GET['id'];
        }
        
        // Si no se encuentra, buscar en el input JSON
        if (!$userId && isset($input['id'])) {
            $userId = (int)$input['id'];
        }
        
        error_log("User ID encontrado: " . ($userId ?? 'NULL'));
        
        if (!$userId) {
            error_log("ERROR: ID de usuario no encontrado");
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
            exit();
        }
        
        // Verificar qué columnas existen
        error_log("Verificando columnas de la tabla users...");
        $stmt = $pdo->prepare("DESCRIBE users");
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        error_log("Columnas disponibles: " . json_encode($columns));
        
        // Construir query de actualización
        $updateFields = [];
        $values = [];
        
        // Campos permitidos para actualizar
        $allowedFields = ['email', 'full_name', 'role', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field]) && in_array($field, $columns)) {
                $updateFields[] = "$field = ?";
                $values[] = $input[$field];
            }
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No hay campos válidos para actualizar']);
            exit();
        }
        
        $values[] = $userId;
        $sql = "UPDATE users SET " . implode(', ', $updateFields);
        
        // Agregar updated_at si existe la columna
        if (in_array('updated_at', $columns)) {
            $sql .= ", updated_at = NOW()";
        }
        
        $sql .= " WHERE id = ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            exit();
        }
        
        // Obtener usuario actualizado
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Procesar campos del usuario actualizado
        if ($user) {
            $user['id'] = (int)$user['id'];
            if (isset($user['is_active'])) {
                $user['is_active'] = (bool)$user['is_active'];
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Usuario actualizado exitosamente',
            'user' => $user
        ]);
        
    } elseif ($method === 'DELETE') {
        // Manejar eliminaciones DELETE
        $userId = null;
        
        // Buscar ID en la URL
        if (count($pathParts) > 1 && is_numeric(end($pathParts))) {
            $userId = (int)end($pathParts);
        }
        
        if (!$userId && isset($_GET['id'])) {
            $userId = (int)$_GET['id'];
        }
        
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
            exit();
        }
        
        // Verificar si existe columna deleted_at para soft delete
        $stmt = $pdo->prepare("DESCRIBE users");
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (in_array('deleted_at', $columns)) {
            // Soft delete
            $sql = "UPDATE users SET deleted_at = NOW()";
            if (in_array('updated_at', $columns)) {
                $sql .= ", updated_at = NOW()";
            }
            $sql .= " WHERE id = ?";
        } else {
            // Hard delete (no recomendado)
            $sql = "DELETE FROM users WHERE id = ?";
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            exit();
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Usuario eliminado exitosamente'
        ]);
        
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ]);
}
?>
