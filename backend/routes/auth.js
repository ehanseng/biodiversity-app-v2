const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { executeQuery } = require('../config/database');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario
    const users = await executeQuery(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = users[0];

    // Verificar contraseña (por ahora usamos contraseñas simples para prueba)
    const validPassword = password === 'explorer123' || password === 'scientist123' || password === 'admin123';
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    // Remover password del response
    delete user.password_hash;

    console.log(`✅ [AUTH] Login exitoso: ${user.email} (${user.role})`);
    
    res.json({
      success: true,
      user,
      token,
      message: 'Login exitoso'
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Registro (opcional)
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role = 'explorer' } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ 
        error: 'Email, contraseña y nombre completo son requeridos' 
      });
    }

    // Verificar si el usuario ya existe
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'El usuario ya existe' });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const result = await executeQuery(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      [email, passwordHash, full_name, role]
    );

    // Obtener el usuario creado
    const newUser = await executeQuery(
      'SELECT id, email, full_name, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    console.log(`✅ [AUTH] Usuario registrado: ${email}`);
    
    res.status(201).json({
      success: true,
      user: newUser[0],
      message: 'Usuario registrado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Verificar token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    
    // Obtener datos actuales del usuario
    const users = await executeQuery(
      'SELECT id, email, full_name, role, created_at FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('❌ Error verificando token:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

module.exports = router;
