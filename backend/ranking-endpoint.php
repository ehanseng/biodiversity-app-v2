<?php
// Endpoint para ranking de usuarios y sistema de puntos
// Subir como: ranking-endpoint.php
// URL: https://explora.ieeetadeo.org/ranking-endpoint.php

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Manejar preflight OPTIONS
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
    
    error_log("[ranking-endpoint] Conexión a base de datos exitosa");
    
} catch (PDOException $e) {
    error_log("[ranking-endpoint] Error de conexión: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión a la base de datos']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];

error_log("[ranking-endpoint] Método: $method, Path: $path");

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['action']) && $_GET['action'] === 'ranking') {
                // Obtener ranking de usuarios
                error_log("[ranking-endpoint] Obteniendo ranking de usuarios");
                
                // Verificar si la columna explorer_points existe
                $checkColumn = $pdo->query("SHOW COLUMNS FROM users LIKE 'explorer_points'");
                $columnExists = $checkColumn->rowCount() > 0;
                
                if (!$columnExists) {
                    // Si no existe la columna, calcular puntos dinámicamente
                    $stmt = $pdo->query("
                        SELECT 
                            u.id,
                            u.full_name,
                            u.email,
                            u.created_at,
                            (SELECT COUNT(*) FROM trees WHERE user_id = u.id AND status = 'approved') as trees_approved,
                            (SELECT COUNT(*) FROM animals WHERE user_id = u.id AND status = 'approved') as animals_approved,
                            ((SELECT COUNT(*) FROM trees WHERE user_id = u.id AND status = 'approved') * 10 + 
                             (SELECT COUNT(*) FROM animals WHERE user_id = u.id AND status = 'approved') * 15) as explorer_points
                        FROM users u 
                        HAVING explorer_points > 0
                        ORDER BY explorer_points DESC, u.created_at ASC
                        LIMIT 10
                    ");
                } else {
                    // Si existe la columna, usar la consulta normal
                    $stmt = $pdo->query("
                        SELECT 
                            u.id,
                            u.full_name,
                            u.email,
                            u.explorer_points,
                            u.created_at,
                            (SELECT COUNT(*) FROM trees WHERE user_id = u.id AND status = 'approved') as trees_approved,
                            (SELECT COUNT(*) FROM animals WHERE user_id = u.id AND status = 'approved') as animals_approved
                        FROM users u 
                        WHERE u.explorer_points > 0
                        ORDER BY u.explorer_points DESC, u.created_at ASC
                        LIMIT 10
                    ");
                }
                
                $ranking = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Agregar posición en el ranking
                foreach ($ranking as $index => &$user) {
                    $user['position'] = $index + 1;
                    $user['total_approved'] = (int)$user['trees_approved'] + (int)$user['animals_approved'];
                    // Asegurar que explorer_points sea un entero
                    $user['explorer_points'] = (int)$user['explorer_points'];
                }
                
                error_log("[ranking-endpoint] Ranking obtenido: " . count($ranking) . " usuarios");
                echo json_encode([
                    'success' => true,
                    'ranking' => $ranking,
                    'count' => count($ranking),
                    'column_exists' => $columnExists
                ]);
                
            } elseif (isset($_GET['action']) && $_GET['action'] === 'update_points') {
                // Actualizar puntos de todos los usuarios
                error_log("[ranking-endpoint] Actualizando puntos de todos los usuarios");
                
                // Calcular puntos por usuario
                $stmt = $pdo->query("
                    SELECT 
                        u.id,
                        u.full_name,
                        (SELECT COUNT(*) FROM trees WHERE user_id = u.id AND status = 'approved') as trees_approved,
                        (SELECT COUNT(*) FROM animals WHERE user_id = u.id AND status = 'approved') as animals_approved
                    FROM users u
                ");
                
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $updated = 0;
                
                foreach ($users as $user) {
                    // Sistema de puntos:
                    // - 10 puntos por árbol aprobado
                    // - 15 puntos por animal aprobado (más difícil de encontrar)
                    $points = ($user['trees_approved'] * 10) + ($user['animals_approved'] * 15);
                    
                    // Actualizar puntos del usuario
                    $updateStmt = $pdo->prepare("UPDATE users SET explorer_points = ? WHERE id = ?");
                    $updateStmt->execute([$points, $user['id']]);
                    $updated++;
                    
                    error_log("[ranking-endpoint] Usuario {$user['full_name']}: {$points} puntos ({$user['trees_approved']} árboles, {$user['animals_approved']} animales)");
                }
                
                error_log("[ranking-endpoint] Puntos actualizados para $updated usuarios");
                echo json_encode([
                    'success' => true,
                    'message' => "Puntos actualizados para $updated usuarios",
                    'updated_users' => $updated
                ]);
                
            } else {
                // Obtener estadísticas generales
                $stmt = $pdo->query("
                    SELECT 
                        COUNT(*) as total_users,
                        SUM(explorer_points) as total_points,
                        MAX(explorer_points) as max_points,
                        AVG(explorer_points) as avg_points
                    FROM users 
                    WHERE explorer_points > 0
                ");
                
                $stats = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'stats' => $stats
                ]);
            }
            break;
            
        case 'POST':
            // Actualizar puntos de un usuario específico
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['user_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'user_id es requerido']);
                exit();
            }
            
            $userId = $input['user_id'];
            error_log("[ranking-endpoint] Actualizando puntos del usuario: $userId");
            
            // Calcular puntos del usuario
            $stmt = $pdo->prepare("
                SELECT 
                    (SELECT COUNT(*) FROM trees WHERE user_id = ? AND status = 'approved') as trees_approved,
                    (SELECT COUNT(*) FROM animals WHERE user_id = ? AND status = 'approved') as animals_approved
            ");
            $stmt->execute([$userId, $userId]);
            $counts = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $points = ($counts['trees_approved'] * 10) + ($counts['animals_approved'] * 15);
            
            // Actualizar puntos
            $updateStmt = $pdo->prepare("UPDATE users SET explorer_points = ? WHERE id = ?");
            $result = $updateStmt->execute([$points, $userId]);
            
            if ($result) {
                error_log("[ranking-endpoint] Puntos actualizados para usuario $userId: $points puntos");
                echo json_encode([
                    'success' => true,
                    'user_id' => $userId,
                    'points' => $points,
                    'trees_approved' => (int)$counts['trees_approved'],
                    'animals_approved' => (int)$counts['animals_approved']
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al actualizar puntos']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
            break;
    }
    
} catch (Exception $e) {
    error_log("[ranking-endpoint] Error general: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor: ' . $e->getMessage()]);
}
?>
