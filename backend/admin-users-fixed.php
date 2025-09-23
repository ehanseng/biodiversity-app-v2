<?php
/**
 * Admin Users Endpoint - Versión corregida
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
$input = json_decode(file_get_contents('php://input'), true);

try {
    if ($method === 'GET') {
        // Obtener todos los usuarios
        $stmt = $pdo->prepare("
            SELECT 
                id, 
                email, 
                full_name, 
                role, 
                is_active,
                created_at,
                updated_at,
                (SELECT COUNT(*) FROM trees WHERE user_id = users.id) as trees_count,
                (SELECT COUNT(*) FROM animals WHERE user_id = users.id) as animals_count
            FROM users 
            ORDER BY created_at DESC
        ");
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Convertir campos numéricos y agregar valores por defecto
        foreach ($users as &$user) {
            $user['id'] = (int)$user['id'];
            $user['is_active'] = (bool)$user['is_active'];
            $user['trees_count'] = (int)($user['trees_count'] ?? 0);
            $user['animals_count'] = (int)($user['animals_count'] ?? 0);
        }

        echo json_encode([
            'success' => true,
            'users' => $users,
            'total' => count($users)
        ]);
        
    } elseif ($method === 'PUT') {
        // Logging detallado para debugging
        error_log("🔧 [DEBUG] PUT request iniciado");
        error_log("🔧 [DEBUG] GET params: " . json_encode($_GET));
        error_log("🔧 [DEBUG] Input data: " . json_encode($input));
        
        // Obtener ID del usuario
        $userId = $_GET['id'] ?? null;
        error_log("🔧 [DEBUG] User ID extraído: " . $userId);
        
        if (!$userId) {
            error_log("❌ [DEBUG] Error: ID de usuario no proporcionado");
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
            exit();
        }
        
        // Verificar si el usuario existe
        error_log("🔧 [DEBUG] Verificando si usuario existe...");
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$existingUser) {
            error_log("❌ [DEBUG] Error: Usuario no encontrado en BD");
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            exit();
        }
        
        error_log("✅ [DEBUG] Usuario encontrado: " . $existingUser['email']);
        
        // Construir query de actualización
        error_log("🔧 [DEBUG] Construyendo query de actualización...");
        $updateFields = [];
        $values = [];
        
        // Campos permitidos para actualizar
        if (isset($input['is_active'])) {
            error_log("🔧 [DEBUG] Actualizando is_active: " . ($input['is_active'] ? 'true' : 'false'));
            $updateFields[] = "is_active = ?";
            $values[] = $input['is_active'] ? 1 : 0;
        }
        
        if (isset($input['email'])) {
            error_log("🔧 [DEBUG] Actualizando email: " . $input['email']);
            $updateFields[] = "email = ?";
            $values[] = $input['email'];
        }
        
        if (isset($input['full_name'])) {
            error_log("🔧 [DEBUG] Actualizando full_name: " . $input['full_name']);
            $updateFields[] = "full_name = ?";
            $values[] = $input['full_name'];
        }
        
        if (isset($input['role'])) {
            error_log("🔧 [DEBUG] Actualizando role: " . $input['role']);
            $updateFields[] = "role = ?";
            $values[] = $input['role'];
        }
        
        if (isset($input['password'])) {
            error_log("🔧 [DEBUG] Actualizando password_hash (hash será generado)");
            $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
            error_log("🔧 [DEBUG] Hash generado: " . substr($hashedPassword, 0, 20) . "...");
            $updateFields[] = "password_hash = ?";
            $values[] = $hashedPassword;
        }
        
        if (empty($updateFields)) {
            error_log("❌ [DEBUG] Error: No hay campos para actualizar");
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No hay campos válidos para actualizar']);
            exit();
        }
        
        // Agregar updated_at
        $updateFields[] = "updated_at = NOW()";
        $values[] = $userId;
        
        $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
        error_log("🔧 [DEBUG] SQL Query: " . $sql);
        error_log("🔧 [DEBUG] Valores: " . json_encode($values));
        
        error_log("🔧 [DEBUG] Ejecutando query...");
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute($values);
        error_log("🔧 [DEBUG] Query ejecutada. Resultado: " . ($result ? 'true' : 'false'));
        error_log("🔧 [DEBUG] Filas afectadas: " . $stmt->rowCount());
        
        // Obtener usuario actualizado
        error_log("🔧 [DEBUG] Obteniendo usuario actualizado...");
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Procesar campos
        if ($updatedUser) {
            error_log("✅ [DEBUG] Usuario actualizado obtenido correctamente");
            $updatedUser['id'] = (int)$updatedUser['id'];
            $updatedUser['is_active'] = (bool)$updatedUser['is_active'];
            // No incluir password_hash en la respuesta
            unset($updatedUser['password_hash']);
        } else {
            error_log("❌ [DEBUG] Error: No se pudo obtener el usuario actualizado");
        }
        
        error_log("🎉 [DEBUG] Enviando respuesta exitosa");
        echo json_encode([
            'success' => true,
            'message' => 'Usuario actualizado exitosamente',
            'user' => $updatedUser
        ]);
        
    } elseif ($method === 'DELETE') {
        // Obtener ID del usuario
        $userId = $_GET['id'] ?? null;
        
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
            exit();
        }
        
        // Soft delete si existe deleted_at, sino hard delete
        $stmt = $pdo->prepare("DESCRIBE users");
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (in_array('deleted_at', $columns)) {
            $sql = "UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?";
        } else {
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
    error_log("💥 [DEBUG] Exception capturada: " . $e->getMessage());
    error_log("💥 [DEBUG] Archivo: " . $e->getFile());
    error_log("💥 [DEBUG] Línea: " . $e->getLine());
    error_log("💥 [DEBUG] Trace: " . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage(),
        'debug' => [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]
    ]);
}
?>
