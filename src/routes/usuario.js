const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../../config/db');



router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;

    if (!pool) {
      return res.status(500).json({ error: 'No hay conexión a la base de datos' });
    }

    const result = await pool
      .request()
      .query('SELECT nombre, tipo FROM Usuario');

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;