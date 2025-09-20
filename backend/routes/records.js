const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// Obtener todos los registros de biodiversidad
router.get('/', async (req, res) => {
  try {
    const { type, status, user_id } = req.query;
    
    let query = `
      SELECT 
        r.*,
        u.full_name as creator_name,
        u.email as creator_email
      FROM biodiversity_records r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Filtros opcionales
    if (type) {
      query += ' AND r.type = ?';
      params.push(type);
    }
    
    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }
    
    if (user_id) {
      query += ' AND r.user_id = ?';
      params.push(user_id);
    }

    query += ' ORDER BY r.created_at DESC';

    const records = await executeQuery(query, params);
    
    console.log(`📋 [API] Obtenidos ${records.length} registros`);
    res.json(records);
  } catch (error) {
    console.error('❌ Error obteniendo registros:', error);
    res.status(500).json({ error: 'Error obteniendo registros' });
  }
});

// Obtener un registro específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        r.*,
        u.full_name as creator_name,
        u.email as creator_email
      FROM biodiversity_records r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `;
    
    const records = await executeQuery(query, [id]);
    
    if (records.length === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    
    res.json(records[0]);
  } catch (error) {
    console.error('❌ Error obteniendo registro:', error);
    res.status(500).json({ error: 'Error obteniendo registro' });
  }
});

// Crear nuevo registro
router.post('/', async (req, res) => {
  try {
    const {
      user_id, type, common_name, scientific_name, description,
      latitude, longitude, location_description,
      height_meters, diameter_cm, health_status,
      animal_class, habitat, behavior,
      image_url
    } = req.body;

    // Validaciones básicas
    if (!user_id || !type || !common_name || !latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Campos requeridos: user_id, type, common_name, latitude, longitude' 
      });
    }

    const query = `
      INSERT INTO biodiversity_records (
        user_id, type, common_name, scientific_name, description,
        latitude, longitude, location_description,
        height_meters, diameter_cm, health_status,
        animal_class, habitat, behavior,
        image_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    const params = [
      user_id, type, common_name, scientific_name, description,
      latitude, longitude, location_description,
      height_meters, diameter_cm, health_status,
      animal_class, habitat, behavior,
      image_url
    ];

    const result = await executeQuery(query, params);
    
    // Obtener el registro creado
    const newRecord = await executeQuery(
      'SELECT * FROM biodiversity_records WHERE id = ?', 
      [result.insertId]
    );

    console.log(`✅ [API] Registro creado con ID: ${result.insertId}`);
    res.status(201).json({
      success: true,
      record: newRecord[0],
      message: 'Registro creado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error creando registro:', error);
    res.status(500).json({ error: 'Error creando registro' });
  }
});

// Actualizar registro
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remover campos que no se deben actualizar
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.user_id; // No permitir cambiar el creador
    
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE biodiversity_records SET ${setClause}, updated_at = NOW() WHERE id = ?`;
    
    values.push(id);
    
    const result = await executeQuery(query, values);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    
    // Obtener el registro actualizado
    const updatedRecord = await executeQuery(
      'SELECT * FROM biodiversity_records WHERE id = ?', 
      [id]
    );
    
    console.log(`✅ [API] Registro ${id} actualizado`);
    res.json({
      success: true,
      record: updatedRecord[0],
      message: 'Registro actualizado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error actualizando registro:', error);
    res.status(500).json({ error: 'Error actualizando registro' });
  }
});

// Eliminar registro
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await executeQuery(
      'DELETE FROM biodiversity_records WHERE id = ?', 
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    
    console.log(`🗑️ [API] Registro ${id} eliminado`);
    res.json({
      success: true,
      message: 'Registro eliminado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error eliminando registro:', error);
    res.status(500).json({ error: 'Error eliminando registro' });
  }
});

// Obtener estadísticas
router.get('/stats/summary', async (req, res) => {
  try {
    const { user_id } = req.query;
    
    let query = `
      SELECT 
        type,
        status,
        COUNT(*) as count
      FROM biodiversity_records
    `;
    const params = [];
    
    if (user_id) {
      query += ' WHERE user_id = ?';
      params.push(user_id);
    }
    
    query += ' GROUP BY type, status';
    
    const stats = await executeQuery(query, params);
    
    // Organizar estadísticas
    const summary = {
      total: 0,
      flora: { total: 0, approved: 0, pending: 0, rejected: 0 },
      fauna: { total: 0, approved: 0, pending: 0, rejected: 0 }
    };
    
    stats.forEach(stat => {
      summary.total += stat.count;
      summary[stat.type].total += stat.count;
      summary[stat.type][stat.status] += stat.count;
    });
    
    res.json(summary);
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

module.exports = router;
