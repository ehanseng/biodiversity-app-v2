<?php
// Script para agregar la columna explorer_points a la tabla users
// Ejecutar una sola vez para actualizar la estructura de la base de datos

// Configuración de base de datos
$host = 'localhost';
$dbname = 'ieeetadeo2006_biodiversity_app';
$username = 'ieeetadeo2006_adminIEEEtadeo';
$password = 'gvDOwV7&D^xk.LJF';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Conexión a base de datos exitosa\n";
    
    // Verificar si la columna ya existe
    $checkColumn = $pdo->query("SHOW COLUMNS FROM users LIKE 'explorer_points'");
    $columnExists = $checkColumn->rowCount() > 0;
    
    if ($columnExists) {
        echo "⚠️  La columna 'explorer_points' ya existe en la tabla users\n";
    } else {
        // Agregar la columna explorer_points
        echo "🔧 Agregando columna 'explorer_points' a la tabla users...\n";
        
        $alterTable = $pdo->exec("
            ALTER TABLE users 
            ADD COLUMN explorer_points INT DEFAULT 0 NOT NULL 
            COMMENT 'Puntos de explorador basados en registros aprobados'
        ");
        
        echo "✅ Columna 'explorer_points' agregada exitosamente\n";
    }
    
    // Calcular y actualizar puntos para todos los usuarios existentes
    echo "🔄 Calculando puntos para usuarios existentes...\n";
    
    $users = $pdo->query("SELECT id, full_name FROM users")->fetchAll(PDO::FETCH_ASSOC);
    $updatedUsers = 0;
    
    foreach ($users as $user) {
        // Contar registros aprobados
        $treesStmt = $pdo->prepare("SELECT COUNT(*) as count FROM trees WHERE user_id = ? AND status = 'approved'");
        $treesStmt->execute([$user['id']]);
        $treesCount = $treesStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        $animalsStmt = $pdo->prepare("SELECT COUNT(*) as count FROM animals WHERE user_id = ? AND status = 'approved'");
        $animalsStmt->execute([$user['id']]);
        $animalsCount = $animalsStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Calcular puntos: 10 por árbol, 15 por animal
        $points = ($treesCount * 10) + ($animalsCount * 15);
        
        // Actualizar puntos del usuario
        $updateStmt = $pdo->prepare("UPDATE users SET explorer_points = ? WHERE id = ?");
        $updateStmt->execute([$points, $user['id']]);
        
        echo "👤 {$user['full_name']}: {$points} puntos ({$treesCount} árboles, {$animalsCount} animales)\n";
        $updatedUsers++;
    }
    
    echo "\n🎉 ¡Actualización completada!\n";
    echo "📊 Usuarios actualizados: {$updatedUsers}\n";
    
    // Mostrar top 5 usuarios con más puntos
    echo "\n🏆 Top 5 Exploradores:\n";
    $topUsers = $pdo->query("
        SELECT full_name, explorer_points 
        FROM users 
        WHERE explorer_points > 0 
        ORDER BY explorer_points DESC 
        LIMIT 5
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($topUsers as $index => $user) {
        $medal = ['🥇', '🥈', '🥉', '🏅', '🏅'][$index];
        echo "{$medal} {$user['full_name']}: {$user['explorer_points']} puntos\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Error de base de datos: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ Error general: " . $e->getMessage() . "\n";
}

echo "\n✨ Script completado. Ahora puedes usar el ranking-endpoint.php\n";
?>
