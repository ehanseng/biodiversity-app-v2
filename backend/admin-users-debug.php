<?php
/**
 * Admin Users Endpoint - Versión de debug
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Función para log de debug
function debugLog($message) {
    error_log("[ADMIN-DEBUG] " . $message);
}

// Configuración de base de datos
$host = 'localhost';
$dbname = 'ieeetadeo2006_biodiversity_app';
$username = 'ieeetadeo2006_adminIEEEtadeo';
$password = 'gvDOwV7&D^xk.LJF';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    debugLog("Conexión a BD exitosa");
} catch (PDOException $e) {
    debugLog("Error de conexión: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión a la base de datos: ' . $e->getMessage()
    ]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

debugLog("Método: $method");
debugLog("Input: " . json_encode($input));
debugLog("GET: " . json_encode($_GET));

try {
    if ($method === 'PUT') {
        // Obtener ID del usuario
        $userId = $_GET['id'] ?? null;
        
        debugLog("ID de usuario: " . ($userId ?? 'NULL'));
        
        if (!$userId) {
            debugLog("ERROR: ID de usuario requerido");
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
            exit();
        }
        
        // Verificar si el usuario existe
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$existingUser) {
            debugLog("ERROR: Usuario no encontrado con ID: $userId");
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            exit();
        }
        
        debugLog("Usuario encontrado: " . $existingUser['email']);
        
        // Verificar qué columnas existen
        $stmt = $pdo->prepare("DESCRIBE users");
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        debugLog("Columnas disponibles: " . json_encode($columns));
        
        // Construir query de actualización
        $updateFields = [];
        $values = [];
        
        // Solo actualizar is_active si se proporciona
        if (isset($input['is_active'])) {
            if (in_array('is_active', $columns)) {
                $updateFields[] = "is_active = ?";
                $values[] = $input['is_active'] ? 1 : 0;
                debugLog("Actualizando is_active a: " . ($input['is_active'] ? 1 : 0));
            } else {
                debugLog("WARNING: Columna is_active no existe, ignorando");
            }
        }
        
        // Actualizar otros campos si se proporcionan
        $allowedFields = ['email', 'full_name', 'role'];
        foreach ($allowedFields as $field) {
            if (isset($input[$field]) && in_array($field, $columns)) {
                $updateFields[] = "$field = ?";
                $values[] = $input[$field];
                debugLog("Actualizando $field a: " . $input[$field]);
            }
        }
        
        if (empty($updateFields)) {
            debugLog("ERROR: No hay campos para actualizar");
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No hay campos válidos para actualizar']);
            exit();
        }
        
        // Agregar updated_at si existe
        if (in_array('updated_at', $columns)) {
            $updateFields[] = "updated_at = NOW()";
        }
        
        $values[] = $userId;
        $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
        
        debugLog("SQL: $sql");
        debugLog("Values: " . json_encode($values));
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute($values);
        
        debugLog("Resultado de UPDATE: " . ($result ? 'true' : 'false'));
        debugLog("Filas afectadas: " . $stmt->rowCount());
        
        if ($stmt->rowCount() === 0) {
            debugLog("WARNING: No se actualizó ninguna fila");
        }
        
        // Obtener usuario actualizado
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Procesar campos
        if ($updatedUser) {
            $updatedUser['id'] = (int)$updatedUser['id'];
            if (isset($updatedUser['is_active'])) {
                $updatedUser['is_active'] = (bool)$updatedUser['is_active'];
            }
        }
        
        debugLog("Usuario actualizado: " . json_encode($updatedUser));
        
        echo json_encode([
            'success' => true,
            'message' => 'Usuario actualizado exitosamente',
            'user' => $updatedUser
        ]);
        
    } else {
        debugLog("Método no soportado en versión debug: $method");
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Solo PUT soportado en versión debug']);
    }
    
} catch (Exception $e) {
    debugLog("EXCEPCIÓN: " . $e->getMessage());
    debugLog("Stack trace: " . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage(),
        'debug' => [
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]
    ]);
}
?>
