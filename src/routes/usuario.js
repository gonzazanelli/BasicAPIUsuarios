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

    const usuariosResult = await pool.request().query(`
      SELECT nombre, apellido, nombreUsuario
      FROM Usuario
    `);
    const usuarios = usuariosResult.recordset;

    const rolesResult = await pool.request().query(`
      SELECT ur.nombreUsuario, r.identificador, r.nombre
      FROM Usuario_Rol ur
      INNER JOIN Rol r ON ur.identificadorRol = r.identificador
    `);
    const roles = rolesResult.recordset;

    const usuariosConInformacionAdicional = usuarios.map(u => ({
      nombre: u.nombre,
      apellido: u.apellido,
      nombreUsuario: u.nombreUsuario,
      roles: roles
        .filter(r => r.nombreUsuario === u.nombreUsuario)
        .map(r => ({
          identificador: r.identificador,
          nombre: r.nombre
        }))
    }));

    res.json(usuariosConInformacionAdicional);
  } catch (err) {
    console.error('Error al obtener los usuarios:', err);
    res.status(500).send('Error interno del servidor');
  } 
});

router.get('/info/:nombreUsuario', async (req, res) => {
  try {
    const pool = await poolPromise;

    if (!pool) {
      return res.status(500).json({ error: 'No hay conexión a la base de datos' });
    }

    const { nombreUsuario } = req.params;

    const usuarioResult = await pool.request().input('nombreUsuario', sql.VarChar, nombreUsuario)
      .query(`
        SELECT nombre, apellido, nombreUsuario
        FROM Usuario
        WHERE nombreUsuario = @nombreUsuario
      `);

    if (usuarioResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const rolesResult = await pool
      .request()
      .input('nombreUsuario', sql.VarChar, nombreUsuario)
      .query(`
        SELECT r.identificador, r.nombre
        FROM Usuario_Rol ur
        INNER JOIN Rol r ON ur.identificadorRol = r.identificador
        WHERE ur.nombreUsuario = @nombreUsuario
      `);

    const usuario = usuarioResult.recordset[0];

    res.json({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      nombreUsuario: usuario.nombreUsuario,
      roles: rolesResult.recordset
    });

  } catch (err) {
    console.error('Error al obtener los usuarios:', err);
    res.status(500).send('Error interno del servidor');
  } 
});

router.get('/roles/:nombreUsuario', async (req, res) => {
  try {
    const pool = await poolPromise;

    if (!pool) {
      return res.status(500).json({ error: 'No hay conexión a la base de datos' });
    }

    const { nombreUsuario } = req.params;

    const rolesResult = await pool
      .request()
      .input('nombreUsuario', sql.VarChar, nombreUsuario)
      .query(`
        SELECT r.identificador, r.nombre
        FROM Usuario_Rol ur
        INNER JOIN Rol r ON ur.identificadorRol = r.identificador
        WHERE ur.nombreUsuario = @nombreUsuario
      `);

    res.json(rolesResult.recordset);
    
  } catch (err) {
    console.error('Error al obtener los usuarios:', err);
    res.status(500).send('Error interno del servidor');
  } 
});

module.exports = router;
