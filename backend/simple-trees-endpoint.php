<?php
// Endpoint simple para árboles - subir al servidor remoto
// Subir como: simple-trees-endpoint.php
// URL: https://explora.ieeetadeo.org/simple-trees-endpoint.php

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
    
    // Log de conexión exitosa
    error_log("[simple-trees-endpoint] Conexión a base de datos exitosa");
    
} catch (PDOException $e) {
    error_log("[simple-trees-endpoint] Error de conexión: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión a la base de datos']);
    exit();
}

// Obtener método HTTP
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];

error_log("[simple-trees-endpoint] Método: $method, Path: $path");

try {
    switch ($method) {
        case 'GET':
            // Obtener todos los árboles o por usuario
            if (isset($_GET['user_id'])) {
                $userId = $_GET['user_id'];
                error_log("[simple-trees-endpoint] Obteniendo árboles del usuario: $userId");
                
                $stmt = $pdo->prepare("
                    SELECT t.*, u.full_name as user_name 
                    FROM trees t 
                    LEFT JOIN users u ON t.user_id = u.id 
                    WHERE t.user_id = ? 
                    ORDER BY t.created_at DESC
                ");
                $stmt->execute([$userId]);
                $trees = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                error_log("[simple-trees-endpoint] Árboles encontrados para usuario $userId: " . count($trees));
                echo json_encode($trees);
                
            } else {
                // Obtener todos los árboles
                error_log("[simple-trees-endpoint] Obteniendo todos los árboles");
                
                $stmt = $pdo->query("
                    SELECT t.*, u.full_name as user_name 
                    FROM trees t 
                    LEFT JOIN users u ON t.user_id = u.id 
                    ORDER BY t.created_at DESC
                ");
                $trees = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                error_log("[simple-trees-endpoint] Total de árboles: " . count($trees));
                echo json_encode($trees);
            }
            break;
            
        case 'POST':
            // Crear nuevo árbol
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                error_log("[simple-trees-endpoint] Error: No se recibieron datos JSON");
                http_response_code(400);
                echo json_encode(['error' => 'No se recibieron datos válidos']);
                exit();
            }
            
            error_log("[simple-trees-endpoint] Creando árbol: " . json_encode($input));
            error_log("[simple-trees-endpoint] Imagen recibida: " . ($input['image_url'] ? substr($input['image_url'], 0, 50) . '...' : 'Sin imagen'));
            
            // Validar campos requeridos
            if (empty($input['user_id']) || empty($input['common_name'])) {
                error_log("[simple-trees-endpoint] Error: Faltan campos requeridos");
                http_response_code(400);
                echo json_encode(['error' => 'user_id y common_name son requeridos']);
                exit();
            }
            
            // Insertar árbol
            $stmt = $pdo->prepare("
                INSERT INTO trees (
                    user_id, common_name, scientific_name, description, 
                    latitude, longitude, location_description, 
                    height_meters, diameter_cm, health_status, image_url,
                    status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
            ");
            
            $result = $stmt->execute([
                $input['user_id'],
                $input['common_name'],
                $input['scientific_name'] ?? null,
                $input['description'] ?? null,
                $input['latitude'] ?? null,
                $input['longitude'] ?? null,
                $input['location_description'] ?? null,
                $input['height_meters'] ?? null,
                $input['diameter_cm'] ?? null,
                $input['health_status'] ?? null,
                $input['image_url'] ?? null
            ]);
            
            if ($result) {
                $treeId = $pdo->lastInsertId();
                
                // Obtener el árbol creado
                $stmt = $pdo->prepare("SELECT * FROM trees WHERE id = ?");
                $stmt->execute([$treeId]);
                $createdTree = $stmt->fetch(PDO::FETCH_ASSOC);
                
                error_log("[simple-trees-endpoint] Árbol creado exitosamente con ID: $treeId");
                http_response_code(201);
                echo json_encode($createdTree);
            } else {
                error_log("[simple-trees-endpoint] Error al insertar árbol");
                http_response_code(500);
                echo json_encode(['error' => 'Error al crear árbol']);
            }
            break;
            
        case 'PUT':
            // Actualizar árbol (especialmente para cambios de estado)
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['id'])) {
                error_log("[simple-trees-endpoint] Error: ID requerido para actualización");
                http_response_code(400);
                echo json_encode(['error' => 'ID es requerido']);
                exit();
            }
            
            $treeId = $input['id'];
            error_log("[simple-trees-endpoint] Actualizando árbol: $treeId");
            
            // Construir query dinámicamente
            $updateFields = [];
            $updateValues = [];
            
            if (isset($input['status'])) {
                $updateFields[] = "status = ?";
                $updateValues[] = $input['status'];
            }
            if (isset($input['approval_status'])) {
                $updateFields[] = "approval_status = ?";
                $updateValues[] = $input['approval_status'];
            }
            if (isset($input['common_name'])) {
                $updateFields[] = "common_name = ?";
                $updateValues[] = $input['common_name'];
            }
            if (isset($input['scientific_name'])) {
                $updateFields[] = "scientific_name = ?";
                $updateValues[] = $input['scientific_name'];
            }
            if (isset($input['approved_by'])) {
                $updateFields[] = "approved_by = ?";
                $updateValues[] = $input['approved_by'];
                error_log("[simple-trees-endpoint] Asignando aprobación al científico ID: " . $input['approved_by']);
            }
            
            if (empty($updateFields)) {
                error_log("[simple-trees-endpoint] Error: No hay campos para actualizar");
                http_response_code(400);
                echo json_encode(['error' => 'No hay campos para actualizar']);
                exit();
            }
            
            $updateFields[] = "updated_at = NOW()";
            $updateValues[] = $treeId;
            
            $sql = "UPDATE trees SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $result = $stmt->execute($updateValues);
            
            if ($result) {
                // Si se cambió el estado a 'approved', actualizar puntos del usuario
                if (isset($input['status']) && $input['status'] === 'approved') {
                    // Obtener user_id del árbol
                    $userStmt = $pdo->prepare("SELECT user_id FROM trees WHERE id = ?");
                    $userStmt->execute([$treeId]);
                    $tree = $userStmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($tree) {
                        // Actualizar puntos del usuario
                        $pointsStmt = $pdo->prepare("
                            UPDATE users SET explorer_points = (
                                (SELECT COUNT(*) FROM trees WHERE user_id = ? AND status = 'approved') * 10 +
                                (SELECT COUNT(*) FROM animals WHERE user_id = ? AND status = 'approved') * 15
                            ) WHERE id = ?
                        ");
                        $pointsStmt->execute([$tree['user_id'], $tree['user_id'], $tree['user_id']]);
                        error_log("[simple-trees-endpoint] Puntos actualizados para usuario: " . $tree['user_id']);
                    }
                }
                
                // Obtener el árbol actualizado
                $stmt = $pdo->prepare("SELECT * FROM trees WHERE id = ?");
                $stmt->execute([$treeId]);
                $updatedTree = $stmt->fetch(PDO::FETCH_ASSOC);
                
                error_log("[simple-trees-endpoint] Árbol actualizado exitosamente: $treeId");
                echo json_encode($updatedTree);
            } else {
                error_log("[simple-trees-endpoint] Error al actualizar árbol");
                http_response_code(500);
                echo json_encode(['error' => 'Error al actualizar árbol']);
            }
            break;
            
        case 'DELETE':
            // Eliminar árbol (implementar si es necesario)
            error_log("[simple-trees-endpoint] DELETE no implementado aún");
            http_response_code(501);
            echo json_encode(['error' => 'DELETE no implementado']);
            break;
            
        default:
            error_log("[simple-trees-endpoint] Método no permitido: $method");
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
            break;
    }
    
} catch (Exception $e) {
    error_log("[simple-trees-endpoint] Error general: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor: ' . $e->getMessage()]);
}
?>
