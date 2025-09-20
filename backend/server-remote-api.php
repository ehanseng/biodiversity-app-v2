<?php
// API PHP para el servidor remoto
// Subir este archivo a tu servidor web como api.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuración de la base de datos
$host = 'localhost';
$user = 'ieeetadeo2006_adminIEEEtadeo';
$password = 'gvDOwV7&D^xk.LJF';
$database = 'ieeetadeo2006_biodiversity';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Obtener la ruta de la API
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path_parts = explode('/', trim($path, '/'));

// Remover 'api.php' de la ruta si está presente
if (end($path_parts) === 'api.php') {
    array_pop($path_parts);
}

$method = $_SERVER['REQUEST_METHOD'];
$endpoint = isset($path_parts[1]) ? $path_parts[1] : '';

// Funciones de la API
switch ($endpoint) {
    case 'health':
        if ($method === 'GET') {
            echo json_encode([
                'status' => 'OK',
                'message' => 'Biodiversity API funcionando correctamente',
                'timestamp' => date('c')
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
                $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($records);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to fetch records: ' . $e->getMessage()]);
            }
        } elseif ($method === 'POST') {
            try {
                $input = json_decode(file_get_contents('php://input'), true);
                
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
                    $input['common_name'],
                    $input['scientific_name'] ?? null,
                    $input['description'] ?? null,
                    $input['latitude'],
                    $input['longitude'],
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
                
                // Obtener el registro creado
                $stmt = $pdo->prepare('
                    SELECT r.*, u.email as creator_email, u.full_name as creator_name
                    FROM biodiversity_records r
                    LEFT JOIN users u ON r.user_id = u.id
                    WHERE r.id = ?
                ');
                $stmt->execute([$id]);
                $record = $stmt->fetch(PDO::FETCH_ASSOC);
                
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
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
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
                
                // Total records
                $stmt = $pdo->query('SELECT COUNT(*) as total FROM biodiversity_records');
                $stats['total_records'] = (int)$stmt->fetchColumn();
                
                // Flora count
                $stmt = $pdo->query("SELECT COUNT(*) as flora FROM biodiversity_records WHERE type = 'flora'");
                $stats['flora_count'] = (int)$stmt->fetchColumn();
                
                // Fauna count
                $stmt = $pdo->query("SELECT COUNT(*) as fauna FROM biodiversity_records WHERE type = 'fauna'");
                $stats['fauna_count'] = (int)$stmt->fetchColumn();
                
                // Approved count
                $stmt = $pdo->query("SELECT COUNT(*) as approved FROM biodiversity_records WHERE status = 'approved'");
                $stats['approved_count'] = (int)$stmt->fetchColumn();
                
                // Pending count
                $stmt = $pdo->query("SELECT COUNT(*) as pending FROM biodiversity_records WHERE status = 'pending'");
                $stats['pending_count'] = (int)$stmt->fetchColumn();
                
                // Users count
                $stmt = $pdo->query('SELECT COUNT(*) as users FROM users');
                $stats['users_count'] = (int)$stmt->fetchColumn();
                
                echo json_encode($stats);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to fetch stats: ' . $e->getMessage()]);
            }
        }
        break;
        
    case 'setup':
        if ($method === 'POST') {
            try {
                // Crear tablas si no existen
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS users (
                        id INT PRIMARY KEY AUTO_INCREMENT,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        password_hash VARCHAR(255) NOT NULL,
                        full_name VARCHAR(255) NOT NULL,
                        role ENUM('explorer', 'scientist', 'admin') DEFAULT 'explorer',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                ");
                
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS biodiversity_records (
                        id INT PRIMARY KEY AUTO_INCREMENT,
                        user_id INT NOT NULL,
                        type ENUM('flora', 'fauna') NOT NULL,
                        common_name VARCHAR(255) NOT NULL,
                        scientific_name VARCHAR(255),
                        description TEXT,
                        latitude DECIMAL(10, 8) NOT NULL,
                        longitude DECIMAL(11, 8) NOT NULL,
                        location_description TEXT,
                        height_meters DECIMAL(8, 2),
                        diameter_cm DECIMAL(8, 2),
                        health_status VARCHAR(100),
                        animal_class VARCHAR(100),
                        habitat TEXT,
                        behavior TEXT,
                        image_url TEXT,
                        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                        reviewed_by INT,
                        reviewed_at TIMESTAMP NULL,
                        review_notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
                        INDEX idx_user_id (user_id),
                        INDEX idx_type (type),
                        INDEX idx_status (status),
                        INDEX idx_location (latitude, longitude)
                    )
                ");
                
                // Insertar datos de prueba
                $pdo->exec("
                    INSERT IGNORE INTO users (email, password_hash, full_name, role) VALUES
                    ('explorer@vibo.co', '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Explorador Vibo', 'explorer'),
                    ('scientist@vibo.co', '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Científico Vibo', 'scientist'),
                    ('admin@vibo.co', '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin Vibo', 'admin')
                ");
                
                // Insertar registros de prueba (solo si no existen)
                $stmt = $pdo->query('SELECT COUNT(*) FROM biodiversity_records');
                if ($stmt->fetchColumn() == 0) {
                    $pdo->exec("
                        INSERT INTO biodiversity_records (
                            user_id, type, common_name, scientific_name, description,
                            latitude, longitude, location_description,
                            height_meters, diameter_cm, health_status,
                            image_url, status
                        ) VALUES
                        (1, 'flora', 'Ceiba del Campus', 'Ceiba pentandra', 'Árbol emblemático ubicado en la entrada principal',
                         4.6097, -74.0817, 'Entrada principal del campus',
                         25.0, 80.0, 'Excelente',
                         'https://picsum.photos/300/200?random=1', 'approved'),
                        (1, 'flora', 'Guayacán Amarillo', 'Tabebuia chrysantha', 'Hermoso árbol con flores amarillas en primavera',
                         4.6100, -74.0820, 'Jardín central',
                         15.0, 45.0, 'Bueno',
                         'https://picsum.photos/300/200?random=2', 'pending'),
                        (2, 'flora', 'Nogal Cafetero', 'Cordia alliodora', 'Árbol nativo usado tradicionalmente en construcción',
                         4.6095, -74.0815, 'Zona de reforestación',
                         20.0, 60.0, 'Regular',
                         'https://picsum.photos/300/200?random=3', 'rejected'),
                        (1, 'fauna', 'Colibrí Esmeralda', 'Amazilia tzacatl', 'Pequeño colibrí con plumaje verde brillante',
                         4.6095, -74.0815, 'Jardines con flores',
                         NULL, NULL, NULL,
                         'https://picsum.photos/300/200?random=6&blur=1', 'approved'),
                        (1, 'fauna', 'Ardilla Común', 'Sciurus granatensis', 'Ardilla nativa de color gris con cola esponjosa',
                         4.6102, -74.0818, 'Árboles del campus',
                         NULL, NULL, NULL,
                         'https://picsum.photos/300/200?random=7&blur=1', 'pending'),
                        (2, 'fauna', 'Mariposa Monarca', 'Danaus plexippus', 'Mariposa migratoria de color naranja con bordes negros',
                         4.6088, -74.0812, 'Jardín de mariposas',
                         NULL, NULL, NULL,
                         'https://picsum.photos/300/200?random=8&blur=1', 'approved')
                    ");
                }
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Database setup completed successfully'
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Setup failed: ' . $e->getMessage()]);
            }
        }
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        break;
}
?>
