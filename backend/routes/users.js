const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// Obtener todos los usuarios (solo para admins)
router.get('/', async (req, res) => {
  try {
    const users = await executeQuery(
      'SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json(users);
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});

// Obtener un usuario específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const users = await executeQuery(
      'SELECT id, email, full_name, role, created_at FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error obteniendo usuario' });
  }
});

module.exports = router;
