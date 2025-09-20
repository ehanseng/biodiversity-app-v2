<?php
// Script de diagnóstico para identificar por qué el servidor devuelve respuesta vacía
// Subir como debug-server.php y ejecutar desde navegador

echo "<h1>🔍 DIAGNÓSTICO DEL SERVIDOR</h1>";

// 1. Verificar PHP básico
echo "<h2>1️⃣ PHP Básico</h2>";
echo "<p>✅ PHP funcionando correctamente</p>";
echo "<p>Versión PHP: " . phpversion() . "</p>";
echo "<p>Fecha/Hora: " . date('Y-m-d H:i:s') . "</p>";

// 2. Verificar conexión a base de datos
echo "<h2>2️⃣ Conexión a Base de Datos</h2>";
$host = 'localhost';
$user = 'ieeetadeo2006_adminIEEEtadeo';
$password = 'gvDOwV7&D^xk.LJF';
$database = 'ieeetadeo2006_biodiversity_app';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p>✅ Conexión a MySQL exitosa</p>";
    echo "<p>Base de datos: $database</p>";
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Error de conexión: " . $e->getMessage() . "</p>";
    exit();
}

// 3. Verificar tabla users
echo "<h2>3️⃣ Tabla Users</h2>";
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    $tableExists = $stmt->rowCount() > 0;
    
    if ($tableExists) {
        echo "<p>✅ Tabla 'users' existe</p>";
        
        // Mostrar estructura
        $stmt = $pdo->query("DESCRIBE users");
        $columns = $stmt->fetchAll();
        echo "<h3>Estructura de la tabla:</h3>";
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>Campo</th><th>Tipo</th><th>Nulo</th><th>Clave</th><th>Default</th></tr>";
        foreach ($columns as $column) {
            echo "<tr>";
            echo "<td>{$column['Field']}</td>";
            echo "<td>{$column['Type']}</td>";
            echo "<td>{$column['Null']}</td>";
            echo "<td>{$column['Key']}</td>";
            echo "<td>{$column['Default']}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // Contar usuarios
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
        $userCount = $stmt->fetchColumn();
        echo "<p>Usuarios existentes: $userCount</p>";
        
    } else {
        echo "<p style='color: orange;'>⚠️ Tabla 'users' NO existe</p>";
        echo "<p>Creando tabla...</p>";
        
        $createTableSQL = "
        CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            role ENUM('admin', 'scientist', 'explorer', 'visitor') DEFAULT 'explorer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";
        
        $pdo->exec($createTableSQL);
        echo "<p>✅ Tabla 'users' creada exitosamente</p>";
    }
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Error con tabla users: " . $e->getMessage() . "</p>";
}

// 4. Probar creación de usuario directamente
echo "<h2>4️⃣ Prueba de Creación de Usuario</h2>";
try {
    // Verificar si erick@ieee.org ya existe
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
    $stmt->execute(['erick@ieee.org']);
    $exists = $stmt->fetchColumn() > 0;
    
    if ($exists) {
        echo "<p>⚠️ Usuario erick@ieee.org ya existe</p>";
        
        // Mostrar datos del usuario
        $stmt = $pdo->prepare("SELECT id, email, full_name, role, created_at FROM users WHERE email = ?");
        $stmt->execute(['erick@ieee.org']);
        $user = $stmt->fetch();
        
        echo "<h3>Datos del usuario existente:</h3>";
        echo "<ul>";
        echo "<li>ID: {$user['id']}</li>";
        echo "<li>Email: {$user['email']}</li>";
        echo "<li>Nombre: {$user['full_name']}</li>";
        echo "<li>Rol: {$user['role']}</li>";
        echo "<li>Creado: {$user['created_at']}</li>";
        echo "</ul>";
        
    } else {
        echo "<p>🆕 Creando usuario erick@ieee.org...</p>";
        
        $stmt = $pdo->prepare("INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            'erick@ieee.org',
            password_hash('erick123', PASSWORD_DEFAULT),
            'Erick Hansen',
            'admin'
        ]);
        
        $userId = $pdo->lastInsertId();
        echo "<p>✅ Usuario creado con ID: $userId</p>";
    }
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Error creando usuario: " . $e->getMessage() . "</p>";
}

// 5. Simular petición POST como la app
echo "<h2>5️⃣ Simulación de Petición POST</h2>";
echo "<p>Simulando lo que hace la app React...</p>";

// Simular datos POST
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REQUEST_URI'] = '/biodiversity-app.php/api/users';

// Simular input JSON
$testUserData = [
    'email' => 'test@example.com',
    'password' => 'test123',
    'full_name' => 'Usuario de Prueba',
    'role' => 'explorer'
];

echo "<h3>Datos de prueba:</h3>";
echo "<pre>" . json_encode($testUserData, JSON_PRETTY_PRINT) . "</pre>";

try {
    // Verificar si el email ya existe
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
    $stmt->execute([$testUserData['email']]);
    if ($stmt->fetchColumn() > 0) {
        echo "<p style='color: orange;'>⚠️ Email ya existe, usando otro...</p>";
        $testUserData['email'] = 'test' . time() . '@example.com';
    }
    
    // Crear usuario
    $hashedPassword = password_hash($testUserData['password'], PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)");
    $stmt->execute([
        $testUserData['email'],
        $hashedPassword,
        $testUserData['full_name'],
        $testUserData['role']
    ]);
    
    $userId = $pdo->lastInsertId();
    
    // Obtener usuario creado
    $stmt = $pdo->prepare("SELECT id, email, full_name, role, created_at FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $newUser = $stmt->fetch();
    
    echo "<h3>✅ Usuario creado exitosamente:</h3>";
    echo "<pre>" . json_encode($newUser, JSON_PRETTY_PRINT) . "</pre>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Error en simulación: " . $e->getMessage() . "</p>";
}

// 6. Verificar archivo biodiversity-app.php
echo "<h2>6️⃣ Verificación de Archivos</h2>";
$apiFile = 'biodiversity-app.php';
if (file_exists($apiFile)) {
    echo "<p>✅ Archivo $apiFile existe</p>";
    echo "<p>Tamaño: " . filesize($apiFile) . " bytes</p>";
    echo "<p>Última modificación: " . date('Y-m-d H:i:s', filemtime($apiFile)) . "</p>";
} else {
    echo "<p style='color: red;'>❌ Archivo $apiFile NO existe</p>";
    echo "<p>Archivos en directorio actual:</p>";
    $files = scandir('.');
    echo "<ul>";
    foreach ($files as $file) {
        if ($file != '.' && $file != '..') {
            echo "<li>$file</li>";
        }
    }
    echo "</ul>";
}

echo "<hr>";
echo "<h2>🎯 CONCLUSIONES</h2>";
echo "<p>Si ves este mensaje, PHP está funcionando correctamente.</p>";
echo "<p>Si la conexión a MySQL es exitosa y la tabla users existe, el problema puede estar en:</p>";
echo "<ul>";
echo "<li>El archivo biodiversity-app.php no está subido o tiene errores</li>";
echo "<li>Problemas de permisos en el servidor</li>";
echo "<li>Errores fatales de PHP que no se muestran</li>";
echo "</ul>";

echo "<p><strong>Próximo paso:</strong> Verificar que biodiversity-app.php esté subido correctamente al servidor.</p>";
echo "<p><em>Diagnóstico completado - " . date('Y-m-d H:i:s') . "</em></p>";
?>
