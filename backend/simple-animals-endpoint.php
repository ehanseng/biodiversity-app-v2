<?php
// Endpoint simple para animales - SOLO MySQL remoto
// Basado en simple-trees-endpoint.php

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
    
    error_log("[simple-animals-endpoint] Conexión exitosa a la base de datos");
    
    $method = $_SERVER['REQUEST_METHOD'];
    error_log("[simple-animals-endpoint] Método HTTP: $method");
    
    switch ($method) {
        case 'GET':
            // Obtener todos los animales
            error_log("[simple-animals-endpoint] Obteniendo todos los animales");
            
            $stmt = $pdo->query("
                SELECT a.*, u.full_name as user_name 
                FROM animals a 
                LEFT JOIN users u ON a.user_id = u.id 
                ORDER BY a.created_at DESC
            ");
            $animals = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("[simple-animals-endpoint] Animales encontrados: " . count($animals));
            
            // Convertir campos numéricos
            foreach ($animals as &$animal) {
                $animal['id'] = (int)$animal['id'];
                $animal['user_id'] = (int)$animal['user_id'];
                if ($animal['latitude']) $animal['latitude'] = (float)$animal['latitude'];
                if ($animal['longitude']) $animal['longitude'] = (float)$animal['longitude'];
            }
            
            echo json_encode([
                'success' => true,
                'data' => $animals,
                'count' => count($animals)
            ]);
            break;
            
        case 'POST':
            // Crear nuevo animal
            error_log("[simple-animals-endpoint] Creando nuevo animal");
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                error_log("[simple-animals-endpoint] Error: No se recibieron datos JSON");
                http_response_code(400);
                echo json_encode(['error' => 'No se recibieron datos válidos']);
                exit();
            }
            
            error_log("[simple-animals-endpoint] Creando animal: " . json_encode($input));
            error_log("[simple-animals-endpoint] Imagen recibida: " . ($input['image_url'] ? substr($input['image_url'], 0, 50) . '...' : 'Sin imagen'));
            
            // Validar campos requeridos
            if (empty($input['user_id']) || empty($input['common_name'])) {
                error_log("[simple-animals-endpoint] Error: Faltan campos requeridos");
                http_response_code(400);
                echo json_encode(['error' => 'user_id y common_name son requeridos']);
                exit();
            }
            
            // Insertar animal
            $stmt = $pdo->prepare("
                INSERT INTO animals (
                    user_id, common_name, scientific_name, animal_class, description, 
                    latitude, longitude, image_url,
                    status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
            ");
            
            $result = $stmt->execute([
                $input['user_id'],
                $input['common_name'],
                $input['scientific_name'] ?? null,
                $input['animal_class'] ?? null,
                $input['description'] ?? null,
                $input['latitude'] ?? null,
                $input['longitude'] ?? null,
                $input['image_url'] ?? null
            ]);
            
            if ($result) {
                $animalId = $pdo->lastInsertId();
                
                // Obtener el animal creado
                $stmt = $pdo->prepare("SELECT * FROM animals WHERE id = ?");
                $stmt->execute([$animalId]);
                $createdAnimal = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // Convertir campos numéricos
                $createdAnimal['id'] = (int)$createdAnimal['id'];
                $createdAnimal['user_id'] = (int)$createdAnimal['user_id'];
                if ($createdAnimal['latitude']) $createdAnimal['latitude'] = (float)$createdAnimal['latitude'];
                if ($createdAnimal['longitude']) $createdAnimal['longitude'] = (float)$createdAnimal['longitude'];
                
                error_log("[simple-animals-endpoint] Animal creado exitosamente con ID: $animalId");
                
                echo json_encode([
                    'success' => true,
                    'data' => $createdAnimal,
                    'message' => 'Animal creado exitosamente'
                ]);
            } else {
                error_log("[simple-animals-endpoint] Error al insertar animal");
                http_response_code(500);
                echo json_encode(['error' => 'Error al crear el animal']);
            }
            break;
            
        case 'PUT':
            // Actualizar animal (especialmente para cambios de estado)
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['id'])) {
                error_log("[simple-animals-endpoint] Error: ID requerido para actualización");
                http_response_code(400);
                echo json_encode(['error' => 'ID es requerido']);
                exit();
            }
            
            $animalId = $input['id'];
            error_log("[simple-animals-endpoint] Actualizando animal: $animalId");
            
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
            
            if (empty($updateFields)) {
                error_log("[simple-animals-endpoint] Error: No hay campos para actualizar");
                http_response_code(400);
                echo json_encode(['error' => 'No hay campos para actualizar']);
                exit();
            }
            
            $updateFields[] = "updated_at = NOW()";
            $updateValues[] = $animalId;
            
            $sql = "UPDATE animals SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $result = $stmt->execute($updateValues);
            
            if ($result) {
                // Si se cambió el estado a 'approved', actualizar puntos del usuario
                if (isset($input['status']) && $input['status'] === 'approved') {
                    // Obtener user_id del animal
                    $userStmt = $pdo->prepare("SELECT user_id FROM animals WHERE id = ?");
                    $userStmt->execute([$animalId]);
                    $animal = $userStmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($animal) {
                        // Actualizar puntos del usuario
                        $pointsStmt = $pdo->prepare("
                            UPDATE users SET explorer_points = (
                                (SELECT COUNT(*) FROM trees WHERE user_id = ? AND status = 'approved') * 10 +
                                (SELECT COUNT(*) FROM animals WHERE user_id = ? AND status = 'approved') * 15
                            ) WHERE id = ?
                        ");
                        $pointsStmt->execute([$animal['user_id'], $animal['user_id'], $animal['user_id']]);
                        error_log("[simple-animals-endpoint] Puntos actualizados para usuario: " . $animal['user_id']);
                    }
                }
                
                // Obtener el animal actualizado
                $stmt = $pdo->prepare("SELECT * FROM animals WHERE id = ?");
                $stmt->execute([$animalId]);
                $updatedAnimal = $stmt->fetch(PDO::FETCH_ASSOC);
                
                error_log("[simple-animals-endpoint] Animal actualizado exitosamente: $animalId");
                echo json_encode([
                    'success' => true,
                    'data' => $updatedAnimal,
                    'message' => 'Animal actualizado exitosamente'
                ]);
            } else {
                error_log("[simple-animals-endpoint] Error al actualizar animal");
                http_response_code(500);
                echo json_encode(['error' => 'Error al actualizar animal']);
            }
            break;
            
        case 'DELETE':
            // Eliminar animal (para futuras funcionalidades)
            error_log("[simple-animals-endpoint] Eliminación de animales no implementada aún");
            http_response_code(501);
            echo json_encode(['error' => 'Eliminación no implementada']);
            break;
            
        default:
            error_log("[simple-animals-endpoint] Método no permitido: $method");
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
            break;
    }
    
} catch (PDOException $e) {
    error_log("[simple-animals-endpoint] Error de base de datos: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Error interno del servidor: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("[simple-animals-endpoint] Error general: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Error interno del servidor: ' . $e->getMessage()
    ]);
}
?>
