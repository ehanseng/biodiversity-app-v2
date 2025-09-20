<?php
// API REST para Biodiversity App - Versión directa
// Subir este archivo como biodiversity.php en la raíz del servidor

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

// Obtener el endpoint desde el parámetro GET
$endpoint = $_GET['endpoint'] ?? 'help';
$method = $_SERVER['REQUEST_METHOD'];

// Rutas de la API
switch ($endpoint) {
    case 'help':
        echo json_encode([
            'message' => 'Biodiversity API',
            'version' => '1.0',
            'usage' => 'Use ?endpoint=ENDPOINT_NAME',
            'endpoints' => [
                '?endpoint=health' => 'Check API status',
                '?endpoint=records' => 'Get all biodiversity records',
                '?endpoint=users' => 'Get all users',
                '?endpoint=stats' => 'Get statistics'
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
                'cors' => 'enabled'
            ]);
        }
        break;
        
    case 'records':
        if ($method === 'GET') {
            try {
                $stmt = $pdo->query('
                    SELECT r.*, u.email as creator_email, u.full_name as creator_name
                    FROM biodiversity_records r
                    LEFT JOIN users u ON r.user_id = u.id
                    ORDER BY r.created_at DESC
                ');
                $records = $stmt->fetchAll();
                echo json_encode($records);
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
            'available_endpoints' => [
                '?endpoint=health',
                '?endpoint=records',
                '?endpoint=users',
                '?endpoint=stats'
            ]
        ]);
        break;
}
?>
