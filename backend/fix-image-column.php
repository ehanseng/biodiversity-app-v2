<?php
// Script para ampliar la columna image_url automáticamente
// Subir como fix-image-column.php y ejecutar desde navegador

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>🔧 Arreglar Columna image_url</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .info { color: #17a2b8; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Arreglar Columna image_url</h1>
        
        <?php
        // Configuración de la base de datos
        $host = 'localhost';
        $user = 'ieeetadeo2006_adminIEEEtadeo';
        $password = 'gvDOwV7&D^xk.LJF';
        $database = 'ieeetadeo2006_biodiversity_app';
        
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $user, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            echo "<p class='info'>🔌 Conectado a la base de datos</p>";
            
            // Verificar estructura actual
            echo "<h3>📋 Estructura actual de image_url:</h3>";
            $stmt = $pdo->query("DESCRIBE biodiversity_records");
            $columns = $stmt->fetchAll();
            
            foreach ($columns as $column) {
                if ($column['Field'] === 'image_url') {
                    echo "<p><strong>Tipo actual:</strong> {$column['Type']}</p>";
                    echo "<p><strong>Null:</strong> {$column['Null']}</p>";
                    echo "<p><strong>Default:</strong> {$column['Default']}</p>";
                    break;
                }
            }
            
            // Ampliar la columna
            echo "<h3>🔧 Ampliando columna image_url...</h3>";
            $pdo->exec("ALTER TABLE biodiversity_records MODIFY COLUMN image_url TEXT");
            echo "<p class='success'>✅ Columna image_url ampliada a TEXT exitosamente</p>";
            
            // Verificar el cambio
            echo "<h3>📋 Nueva estructura de image_url:</h3>";
            $stmt = $pdo->query("DESCRIBE biodiversity_records");
            $columns = $stmt->fetchAll();
            
            foreach ($columns as $column) {
                if ($column['Field'] === 'image_url') {
                    echo "<p class='success'><strong>Nuevo tipo:</strong> {$column['Type']}</p>";
                    echo "<p><strong>Null:</strong> {$column['Null']}</p>";
                    echo "<p><strong>Default:</strong> {$column['Default']}</p>";
                    break;
                }
            }
            
            echo "<h3>🎉 ¡Cambio completado!</h3>";
            echo "<p class='success'>Ahora puedes sincronizar imágenes de cualquier tamaño.</p>";
            echo "<p class='info'>Puedes volver a tu app y probar la sincronización.</p>";
            
        } catch (PDOException $e) {
            echo "<p class='error'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
        }
        ?>
    </div>
</body>
</html>
