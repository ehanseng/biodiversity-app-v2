<?php
// API REST para Biodiversity App - Versión que maneja /api al final
// Subir este archivo como biodiversity-app.php

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=UTF-8');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuración de la base de datos
$host = 'localhost';
$user = 'ieeetadeo2006_adminIEEEtadeo';
$password = 'gvDOwV7&D^xk.LJF';
$database = 'ieeetadeo2006_biodiversity_app';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Obtener el endpoint - manejar tanto /api/endpoint como ?endpoint=endpoint
$endpoint = '';
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Si la URL contiene /api/, extraer el endpoint después de /api/
if (strpos($path, '/api/') !== false) {
    $parts = explode('/api/', $path);
    $fullEndpoint = isset($parts[1]) ? trim($parts[1], '/') : 'help';
    
    // Separar endpoint y parámetros adicionales (ej: records/123 -> records, 123)
    $endpointParts = explode('/', $fullEndpoint);
    $endpoint = $endpointParts[0];
    $resourceId = isset($endpointParts[1]) ? $endpointParts[1] : null;
} else {
    // Si no, usar parámetro GET
    $endpoint = $_GET['endpoint'] ?? 'help';
    $resourceId = $_GET['id'] ?? null;
}

// Si el endpoint está vacío, usar help
if (empty($endpoint)) {
    $endpoint = 'help';
}

$method = $_SERVER['REQUEST_METHOD'];

// Log para debugging
error_log("API Request: $method /$endpoint (from: $request_uri)");

// Rutas de la API
switch ($endpoint) {
    case 'help':
        echo json_encode([
            'message' => 'Biodiversity API',
            'version' => '1.0',
            'request_uri' => $request_uri,
            'detected_endpoint' => $endpoint,
            'endpoints' => [
                '/api/health' => 'Check API status',
                '/api/records' => 'Get all biodiversity records',
                '/api/users' => 'Get all users',
                '/api/stats' => 'Get statistics'
            ]
        ]);
        break;
        
    case 'health':
        if ($method === 'GET') {
            echo json_encode([
                'status' => 'OK',
                'message' => 'Biodiversity API funcionando correctamente',
                'timestamp' => date('c'),
                'server' => $_SERVER['SERVER_NAME'],
                'cors' => 'enabled',
                'endpoint_detected' => $endpoint
            ]);
        }
        break;
        
    case 'records':
        if ($method === 'GET') {
            try {
                if ($resourceId) {
                    // Obtener un registro específico
                    $stmt = $pdo->prepare('
                        SELECT r.*, u.email as creator_email, u.full_name as creator_name
                        FROM biodiversity_records r
                        LEFT JOIN users u ON r.user_id = u.id
                        WHERE r.id = ?
                    ');
                    $stmt->execute([$resourceId]);
                    $record = $stmt->fetch();
                    
                    if ($record) {
                        echo json_encode($record);
                    } else {
                        http_response_code(404);
                        echo json_encode(['error' => 'Record not found']);
                    }
                } else {
                    // Obtener todos los registros
                    $stmt = $pdo->query('
                        SELECT r.*, u.email as creator_email, u.full_name as creator_name
                        FROM biodiversity_records r
                        LEFT JOIN users u ON r.user_id = u.id
                        ORDER BY r.created_at DESC
                    ');
                    $records = $stmt->fetchAll();
                    echo json_encode($records);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to fetch records: ' . $e->getMessage()]);
            }
        } elseif ($method === 'POST') {
            try {
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!$input) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid JSON input']);
                    exit();
                }
                
                $stmt = $pdo->prepare('
                    INSERT INTO biodiversity_records (
                        user_id, type, common_name, scientific_name, description,
                        latitude, longitude, location_description,
                        height_meters, diameter_cm, health_status,
                        animal_class, habitat, behavior, image_url, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ');
                
                $stmt->execute([
                    $input['user_id'] ?? 1,
                    $input['type'] ?? 'flora',
                    $input['common_name'] ?? 'Sin nombre',
                    $input['scientific_name'] ?? null,
                    $input['description'] ?? null,
                    $input['latitude'] ?? 0,
                    $input['longitude'] ?? 0,
                    $input['location_description'] ?? null,
                    $input['height_meters'] ?? null,
                    $input['diameter_cm'] ?? null,
                    $input['health_status'] ?? null,
                    $input['animal_class'] ?? null,
                    $input['habitat'] ?? null,
                    $input['behavior'] ?? null,
                    $input['image_url'] ?? null,
                    $input['status'] ?? 'pending'
                ]);
                
                $id = $pdo->lastInsertId();
                
                $stmt = $pdo->prepare('
                    SELECT r.*, u.email as creator_email, u.full_name as creator_name
                    FROM biodiversity_records r
                    LEFT JOIN users u ON r.user_id = u.id
                    WHERE r.id = ?
                ');
                $stmt->execute([$id]);
                $record = $stmt->fetch();
                
                echo json_encode([
                    'success' => true,
                    'record' => $record,
                    'message' => 'Record created successfully'
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to create record: ' . $e->getMessage()]);
            }
        } elseif ($method === 'PUT' && $resourceId) {
            try {
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!$input) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid JSON input']);
                    exit();
                }
                
                $stmt = $pdo->prepare('
                    UPDATE biodiversity_records SET
                        type = ?, common_name = ?, scientific_name = ?, description = ?,
                        latitude = ?, longitude = ?, location_description = ?,
                        height_meters = ?, diameter_cm = ?, health_status = ?,
                        animal_class = ?, habitat = ?, behavior = ?, image_url = ?, status = ?
                    WHERE id = ?
                ');
                
                $stmt->execute([
                    $input['type'] ?? 'flora',
                    $input['common_name'] ?? 'Sin nombre',
                    $input['scientific_name'] ?? null,
                    $input['description'] ?? null,
                    $input['latitude'] ?? 0,
                    $input['longitude'] ?? 0,
                    $input['location_description'] ?? null,
                    $input['height_meters'] ?? null,
                    $input['diameter_cm'] ?? null,
                    $input['health_status'] ?? null,
                    $input['animal_class'] ?? null,
                    $input['habitat'] ?? null,
                    $input['behavior'] ?? null,
                    $input['image_url'] ?? null,
                    $input['status'] ?? 'pending',
                    $resourceId
                ]);
                
                // Obtener el registro actualizado
                $stmt = $pdo->prepare('
                    SELECT r.*, u.email as creator_email, u.full_name as creator_name
                    FROM biodiversity_records r
                    LEFT JOIN users u ON r.user_id = u.id
                    WHERE r.id = ?
                ');
                $stmt->execute([$resourceId]);
                $record = $stmt->fetch();
                
                echo json_encode([
                    'success' => true,
                    'record' => $record,
                    'message' => 'Record updated successfully'
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update record: ' . $e->getMessage()]);
            }
        } elseif ($method === 'DELETE' && $resourceId) {
            try {
                $stmt = $pdo->prepare('DELETE FROM biodiversity_records WHERE id = ?');
                $stmt->execute([$resourceId]);
                
                if ($stmt->rowCount() > 0) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Record deleted successfully'
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Record not found']);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete record: ' . $e->getMessage()]);
            }
        }
        break;
        
    case 'users':
        if ($method === 'GET') {
            try {
                $stmt = $pdo->query('SELECT id, email, full_name, role, created_at FROM users');
                $users = $stmt->fetchAll();
                echo json_encode($users);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to fetch users: ' . $e->getMessage()]);
            }
        }
        break;
        
    case 'stats':
        if ($method === 'GET') {
            try {
                $stats = [];
                
                $stmt = $pdo->query('SELECT COUNT(*) as total FROM biodiversity_records');
                $stats['total_records'] = (int)$stmt->fetchColumn();
                
                $stmt = $pdo->query("SELECT COUNT(*) as flora FROM biodiversity_records WHERE type = 'flora'");
                $stats['flora_count'] = (int)$stmt->fetchColumn();
                
                $stmt = $pdo->query("SELECT COUNT(*) as fauna FROM biodiversity_records WHERE type = 'fauna'");
                $stats['fauna_count'] = (int)$stmt->fetchColumn();
                
                $stmt = $pdo->query("SELECT COUNT(*) as approved FROM biodiversity_records WHERE status = 'approved'");
                $stats['approved_count'] = (int)$stmt->fetchColumn();
                
                $stmt = $pdo->query("SELECT COUNT(*) as pending FROM biodiversity_records WHERE status = 'pending'");
                $stats['pending_count'] = (int)$stmt->fetchColumn();
                
                $stmt = $pdo->query('SELECT COUNT(*) as users FROM users');
                $stats['users_count'] = (int)$stmt->fetchColumn();
                
                echo json_encode($stats);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to fetch stats: ' . $e->getMessage()]);
            }
        }
        break;
        
    default:
        http_response_code(404);
        echo json_encode([
            'error' => 'Endpoint not found: ' . $endpoint,
            'request_uri' => $request_uri,
            'available_endpoints' => [
                '/api/health',
                '/api/records',
                '/api/users',
                '/api/stats'
            ]
        ]);
        break;
}
?>
