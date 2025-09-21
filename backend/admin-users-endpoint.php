<?php
/**
 * Admin Users Endpoint - API para administración de usuarios
 * Permite a los administradores gestionar usuarios del sistema
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

// DEBUG: Log de información de la petición
error_log("=== DEBUG ADMIN ENDPOINT ===");
error_log("Method: " . $method);
error_log("Path: " . $path);
error_log("Path Parts: " . json_encode($pathParts));
error_log("Request URI: " . $_SERVER['REQUEST_URI']);

// Obtener el último segmento de la URL para determinar la acción
$action = end($pathParts);
error_log("Action: " . $action);

// Obtener datos JSON del cuerpo de la petición
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            // Detectar diferentes tipos de peticiones GET
            if ($action === 'users' || $action === 'admin' || in_array('users', $pathParts) || in_array('admin', $pathParts)) {
                // GET /admin/users - Obtener todos los usuarios
                getAllUsers($pdo);
            } elseif ($action === 'search' || isset($_GET['q'])) {
                // GET /admin/users/search?q=query - Buscar usuarios
                searchUsers($pdo);
            } elseif ($action === 'stats' || in_array('stats', $pathParts)) {
                // GET /admin/stats/users - Estadísticas de usuarios
                getUserStats($pdo);
            } else {
                // Si no coincide ninguna ruta, intentar obtener todos los usuarios por defecto
                error_log("No se encontró ruta específica, intentando getAllUsers por defecto");
                getAllUsers($pdo);
            }
            break;

        case 'PUT':
            if (strpos($action, 'role') !== false) {
                // PUT /admin/users/{id}/role - Cambiar rol
                $userId = $pathParts[count($pathParts) - 2];
                changeUserRole($pdo, $userId, $input);
            } elseif (strpos($action, 'status') !== false) {
                // PUT /admin/users/{id}/status - Cambiar estado
                $userId = $pathParts[count($pathParts) - 2];
                toggleUserStatus($pdo, $userId, $input);
            } elseif (strpos($action, 'password') !== false) {
                // PUT /admin/users/{id}/password - Resetear contraseña
                $userId = $pathParts[count($pathParts) - 2];
                resetUserPassword($pdo, $userId, $input);
            } elseif (is_numeric($action)) {
                // PUT /admin/users/{id} - Actualizar usuario
                updateUser($pdo, $action, $input);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
            }
            break;

        case 'DELETE':
            if (is_numeric($action)) {
                // DELETE /admin/users/{id} - Eliminar usuario
                deleteUser($pdo, $action);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método no permitido']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ]);
}

/**
 * Obtener todos los usuarios
 */
function getAllUsers($pdo) {
    try {
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
            WHERE deleted_at IS NULL 
            ORDER BY created_at DESC
        ");
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Convertir campos numéricos
        foreach ($users as &$user) {
            $user['id'] = (int)$user['id'];
            $user['is_active'] = (bool)$user['is_active'];
            $user['trees_count'] = (int)$user['trees_count'];
            $user['animals_count'] = (int)$user['animals_count'];
        }

        echo json_encode([
            'success' => true,
            'users' => $users,
            'total' => count($users)
        ]);
    } catch (Exception $e) {
        throw new Exception('Error obteniendo usuarios: ' . $e->getMessage());
    }
}

/**
 * Buscar usuarios
 */
function searchUsers($pdo) {
    try {
        $query = $_GET['q'] ?? '';
        if (empty($query)) {
            getAllUsers($pdo);
            return;
        }

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
            WHERE deleted_at IS NULL 
            AND (email LIKE ? OR full_name LIKE ?)
            ORDER BY created_at DESC
        ");
        
        $searchTerm = '%' . $query . '%';
        $stmt->execute([$searchTerm, $searchTerm]);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Convertir campos numéricos
        foreach ($users as &$user) {
            $user['id'] = (int)$user['id'];
            $user['is_active'] = (bool)$user['is_active'];
            $user['trees_count'] = (int)$user['trees_count'];
            $user['animals_count'] = (int)$user['animals_count'];
        }

        echo json_encode([
            'success' => true,
            'users' => $users,
            'total' => count($users),
            'query' => $query
        ]);
    } catch (Exception $e) {
        throw new Exception('Error buscando usuarios: ' . $e->getMessage());
    }
}

/**
 * Actualizar usuario
 */
function updateUser($pdo, $userId, $data) {
    try {
        $allowedFields = ['email', 'full_name', 'role'];
        $updateFields = [];
        $values = [];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }

        if (empty($updateFields)) {
            throw new Exception('No hay campos válidos para actualizar');
        }

        $values[] = $userId;
        $sql = "UPDATE users SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ? AND deleted_at IS NULL";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);

        if ($stmt->rowCount() === 0) {
            throw new Exception('Usuario no encontrado o no se pudo actualizar');
        }

        // Obtener usuario actualizado
        $stmt = $pdo->prepare("SELECT id, email, full_name, role, is_active, created_at, updated_at FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'message' => 'Usuario actualizado exitosamente',
            'user' => $user
        ]);
    } catch (Exception $e) {
        throw new Exception('Error actualizando usuario: ' . $e->getMessage());
    }
}

/**
 * Cambiar rol de usuario
 */
function changeUserRole($pdo, $userId, $data) {
    try {
        $newRole = $data['role'] ?? null;
        $validRoles = ['explorer', 'scientist', 'admin'];

        if (!$newRole || !in_array($newRole, $validRoles)) {
            throw new Exception('Rol inválido. Roles válidos: ' . implode(', ', $validRoles));
        }

        $stmt = $pdo->prepare("UPDATE users SET role = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL");
        $stmt->execute([$newRole, $userId]);

        if ($stmt->rowCount() === 0) {
            throw new Exception('Usuario no encontrado');
        }

        // Obtener usuario actualizado
        $stmt = $pdo->prepare("SELECT id, email, full_name, role, is_active, created_at, updated_at FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'message' => 'Rol cambiado exitosamente',
            'user' => $user
        ]);
    } catch (Exception $e) {
        throw new Exception('Error cambiando rol: ' . $e->getMessage());
    }
}

/**
 * Cambiar estado de usuario (activo/inactivo)
 */
function toggleUserStatus($pdo, $userId, $data) {
    try {
        $isActive = isset($data['is_active']) ? (bool)$data['is_active'] : null;

        if ($isActive === null) {
            throw new Exception('Estado requerido (is_active)');
        }

        $stmt = $pdo->prepare("UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL");
        $stmt->execute([$isActive ? 1 : 0, $userId]);

        if ($stmt->rowCount() === 0) {
            throw new Exception('Usuario no encontrado');
        }

        // Obtener usuario actualizado
        $stmt = $pdo->prepare("SELECT id, email, full_name, role, is_active, created_at, updated_at FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $user['is_active'] = (bool)$user['is_active'];

        echo json_encode([
            'success' => true,
            'message' => 'Estado cambiado exitosamente',
            'user' => $user
        ]);
    } catch (Exception $e) {
        throw new Exception('Error cambiando estado: ' . $e->getMessage());
    }
}

/**
 * Eliminar usuario (soft delete)
 */
function deleteUser($pdo, $userId) {
    try {
        $stmt = $pdo->prepare("UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND deleted_at IS NULL");
        $stmt->execute([$userId]);

        if ($stmt->rowCount() === 0) {
            throw new Exception('Usuario no encontrado');
        }

        echo json_encode([
            'success' => true,
            'message' => 'Usuario eliminado exitosamente'
        ]);
    } catch (Exception $e) {
        throw new Exception('Error eliminando usuario: ' . $e->getMessage());
    }
}

/**
 * Resetear contraseña de usuario
 */
function resetUserPassword($pdo, $userId, $data) {
    try {
        $newPassword = $data['password'] ?? null;

        if (!$newPassword || strlen($newPassword) < 6) {
            throw new Exception('Contraseña debe tener al menos 6 caracteres');
        }

        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

        $stmt = $pdo->prepare("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL");
        $stmt->execute([$hashedPassword, $userId]);

        if ($stmt->rowCount() === 0) {
            throw new Exception('Usuario no encontrado');
        }

        echo json_encode([
            'success' => true,
            'message' => 'Contraseña reseteada exitosamente'
        ]);
    } catch (Exception $e) {
        throw new Exception('Error reseteando contraseña: ' . $e->getMessage());
    }
}

/**
 * Obtener estadísticas de usuarios
 */
function getUserStats($pdo) {
    try {
        // Estadísticas básicas
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
                SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_users,
                SUM(CASE WHEN role = 'explorer' THEN 1 ELSE 0 END) as explorers,
                SUM(CASE WHEN role = 'scientist' THEN 1 ELSE 0 END) as scientists,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_registrations,
                SUM(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as week_registrations,
                SUM(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as month_registrations
            FROM users 
            WHERE deleted_at IS NULL
        ");
        $stmt->execute();
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        // Convertir a enteros
        foreach ($stats as $key => $value) {
            $stats[$key] = (int)$value;
        }

        // Estadísticas de contenido
        $stmt = $pdo->prepare("
            SELECT 
                (SELECT COUNT(*) FROM trees) as total_trees,
                (SELECT COUNT(*) FROM animals) as total_animals,
                (SELECT COUNT(*) FROM trees WHERE status = 'approved') as approved_trees,
                (SELECT COUNT(*) FROM animals WHERE status = 'approved') as approved_animals,
                (SELECT COUNT(*) FROM trees WHERE status = 'pending') as pending_trees,
                (SELECT COUNT(*) FROM animals WHERE status = 'pending') as pending_animals
        ");
        $stmt->execute();
        $contentStats = $stmt->fetch(PDO::FETCH_ASSOC);

        // Convertir a enteros
        foreach ($contentStats as $key => $value) {
            $contentStats[$key] = (int)$value;
        }

        echo json_encode([
            'success' => true,
            'stats' => array_merge($stats, $contentStats)
        ]);
    } catch (Exception $e) {
        throw new Exception('Error obteniendo estadísticas: ' . $e->getMessage());
    }
}
?>
