<?php
// Script de debugging para el ranking de científicos
// URL: https://explora.ieeetadeo.org/debug-scientist-ranking.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Configuración de base de datos
$host = 'localhost';
$dbname = 'ieeetadeo2006_biodiversity_app';
$username = 'ieeetadeo2006_adminIEEEtadeo';
$password = 'gvDOwV7&D^xk.LJF';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== DEBUG RANKING DE CIENTÍFICOS ===\n\n";
    
    // 1. Verificar científicos y admins en la base de datos
    echo "1. CIENTÍFICOS Y ADMINS REGISTRADOS:\n";
    $stmt = $pdo->query("SELECT id, full_name, email, role FROM users WHERE role IN ('scientist', 'admin') ORDER BY id");
    $scientists = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($scientists as $scientist) {
        echo "- ID: {$scientist['id']}, Nombre: {$scientist['full_name']}, Email: {$scientist['email']}, Rol: {$scientist['role']}\n";
    }
    echo "\n";
    
    // 2. Verificar si existe la columna approved_by
    echo "2. VERIFICACIÓN DE COLUMNAS:\n";
    $checkTrees = $pdo->query("SHOW COLUMNS FROM trees LIKE 'approved_by'");
    $treesHasColumn = $checkTrees->rowCount() > 0;
    echo "- Columna approved_by en trees: " . ($treesHasColumn ? "SÍ EXISTE" : "NO EXISTE") . "\n";
    
    $checkAnimals = $pdo->query("SHOW COLUMNS FROM animals LIKE 'approved_by'");
    $animalsHasColumn = $checkAnimals->rowCount() > 0;
    echo "- Columna approved_by en animals: " . ($animalsHasColumn ? "SÍ EXISTE" : "NO EXISTE") . "\n\n";
    
    if ($treesHasColumn) {
        // 3. Verificar aprobaciones por científico
        echo "3. APROBACIONES POR CIENTÍFICO:\n";
        foreach ($scientists as $scientist) {
            $stmt = $pdo->prepare("
                SELECT 
                    (SELECT COUNT(*) FROM trees WHERE approved_by = ?) as trees_approved,
                    (SELECT COUNT(*) FROM animals WHERE approved_by = ?) as animals_approved
            ");
            $stmt->execute([$scientist['id'], $scientist['id']]);
            $approvals = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $trees = (int)$approvals['trees_approved'];
            $animals = (int)$approvals['animals_approved'];
            $total = $trees + $animals;
            $points = ($trees * 10) + ($animals * 15);
            
            echo "- {$scientist['full_name']} ({$scientist['email']}):\n";
            echo "  * Plantas aprobadas: {$trees}\n";
            echo "  * Animales aprobados: {$animals}\n";
            echo "  * Total aprobaciones: {$total}\n";
            echo "  * Puntos calculados: {$points}\n\n";
        }
        
        // 4. Consulta exacta del ranking
        echo "4. CONSULTA EXACTA DEL RANKING:\n";
        $stmt = $pdo->query("
            SELECT 
                u.id,
                u.full_name,
                u.email,
                u.role,
                (SELECT COUNT(*) FROM trees WHERE approved_by = u.id) as trees_approved,
                (SELECT COUNT(*) FROM animals WHERE approved_by = u.id) as animals_approved,
                ((SELECT COUNT(*) FROM trees WHERE approved_by = u.id) + 
                 (SELECT COUNT(*) FROM animals WHERE approved_by = u.id)) as total_approvals,
                ((SELECT COUNT(*) FROM trees WHERE approved_by = u.id) * 10 + 
                 (SELECT COUNT(*) FROM animals WHERE approved_by = u.id) * 15) as scientist_points
            FROM users u 
            WHERE u.role IN ('scientist', 'admin')
            HAVING total_approvals > 0
            ORDER BY scientist_points DESC, total_approvals DESC, u.created_at ASC
            LIMIT 10
        ");
        
        $ranking = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "Científicos en el ranking: " . count($ranking) . "\n";
        
        foreach ($ranking as $index => $scientist) {
            echo "#{$index + 1}: {$scientist['full_name']} - {$scientist['scientist_points']} puntos ({$scientist['trees_approved']} plantas, {$scientist['animals_approved']} animales)\n";
        }
        
    } else {
        echo "3. COLUMNAS NO EXISTEN - No se pueden verificar aprobaciones reales\n";
    }
    
    // 5. Verificar registros aprobados sin asignar
    echo "\n5. REGISTROS APROBADOS SIN ASIGNAR:\n";
    if ($treesHasColumn) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM trees WHERE status = 'approved' AND approved_by IS NULL");
        $unassignedTrees = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        echo "- Plantas aprobadas sin asignar: {$unassignedTrees}\n";
        
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM animals WHERE status = 'approved' AND approved_by IS NULL");
        $unassignedAnimals = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        echo "- Animales aprobados sin asignar: {$unassignedAnimals}\n";
    } else {
        echo "- No se puede verificar (columnas no existen)\n";
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
