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

module.exports = router;
