const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { poolPromise } = require('../../config/db');


router.get('/lista', async (req, res) => {
  try {
    const pool = await poolPromise;

    if (!pool) {
      return res.status(500).json({ error: 'No hay conexión a la base de datos' });
    }

    const rolesResult = await pool.request().query(`
      SELECT r.identificador, r.nombre
      FROM Rol r
    `);

    res.json(rolesResult.recordset);

  } catch (err) {
    console.error('Error al obtener los roles:', err);
    res.status(500).send('Error interno del servidor');
  } 
});

router.get('/usuarios/:identificador', async (req, res) => {
  try {
    const pool = await poolPromise;

    if (!pool) {
      return res.status(500).json({ error: 'No hay conexión a la base de datos' });
    }

    const { identificador } = req.params;

    const rolesResult = await pool
      .request()
      .input('identificador', sql.VarChar, identificador)
      .query(`
        SELECT u.nombreUsuario, u.nombre, u.apellido
        FROM Usuario_Rol ur
        INNER JOIN Usuario u ON ur.nombreUsuario = u.nombreUsuario
        WHERE ur.identificadorRol = @identificador
      `);

    res.json(rolesResult.recordset);
    
  } catch (err) {
    console.error('Error al obtener los usuarios:', err);
    res.status(500).send('Error interno del servidor');
  } 
});

router.post('/crear', async (req, res) => {
  try {
    const pool = await poolPromise;

    if (!pool) {
      return res.status(500).json({ error: 'No hay conexión a la base de datos' });
    }

    const { nombre } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre del rol es obligatorio' });
    }

    const nombreMayus = nombre.trim().toUpperCase();

    // Control de duplicados
    const existeRol = await pool
      .request()
      .input('nombre', sql.VarChar, nombreMayus)
      .query(`
        SELECT COUNT(*) AS cantidad
        FROM Rol
        WHERE nombre = @nombre
      `);

    if (existeRol.recordset[0].cantidad > 0) {
      return res.status(409).json({ error: 'El rol ya existe' });
    }

    // Se realiza el alta
    const result = await pool
    .request()
    .input('nombre', sql.VarChar, nombreMayus)
    .query(`
      INSERT INTO Rol (nombre)
      OUTPUT INSERTED.identificador
      VALUES (@nombre)
    `);

    res.status(201).json({ identificador: result.recordset[0].identificador });

  } catch (err) {
    console.error('Error al crear el rol:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
