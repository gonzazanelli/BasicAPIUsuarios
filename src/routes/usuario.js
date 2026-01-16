const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { poolPromise } = require('../../config/db');
const authMiddleware = require('../middlewares/authMiddleware');


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

router.get('/info', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;

    if (!pool) {
      return res.status(500).json({ error: 'No hay conexión a la base de datos' });
    }

    const nombreUsuario = req.user.nombreUsuario;

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

router.post('/asociarRol', async (req, res) => {
  try {
    const pool = await poolPromise;

    if (!pool) {
      return res.status(500).json({ error: 'No hay conexión a la base de datos' });
    }

    const { nombreUsuario, identificadorRol } = req.body;

    if (!nombreUsuario || nombreUsuario.trim() === '') {
      return res.status(400).json({ error: 'El nombre de usuario es obligatorio' });
    }

    if (!Number.isInteger(identificadorRol) || identificadorRol <= 0){
      return res.status(400).json({ error: 'El identificador del rol es obligatorio' });
    }

    // Validar Usuario
    if (!(await valUsuario (pool, nombreUsuario))) {
      return res.status(409).json({ error: 'El usuario no existe' });
    }

    // Validar Rol
    if (!(await valRol (pool, identificadorRol))) {
      return res.status(409).json({ error: 'El rol no existe' });
    }
        
    // Control de duplicados
    const existeAsociado = await pool
      .request()
      .input('nombreUsuario', sql.VarChar, nombreUsuario)
      .input('identificadorRol', sql.Int, identificadorRol)
      .query(`
        SELECT COUNT(*) AS cantidad
        FROM Usuario_Rol
        WHERE nombreUsuario = @nombreUsuario and identificadorRol = @identificadorRol
      `);

    if (existeAsociado.recordset[0].cantidad > 0) {
      return res.status(409).json({ error: 'El usuario ya tiene asociado el rol' });
    }

    // Se realiza el alta
    const result = await pool
    .request()
    .input('nombreUsuario', sql.VarChar, nombreUsuario)
    .input('identificadorRol', sql.Int, identificadorRol)
    .query(`
      INSERT INTO Usuario_Rol (nombreUsuario, identificadorRol)
      VALUES (@nombreUsuario, @identificadorRol)
    `);

     res.status(201).json({ message: 'Rol asociado correctamente' });

  } catch (err) {
    console.error('Error al crear el rol:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

//Validar usuario
async function valUsuario(pool, nombreUsuario) {
  const existeUsuario = await pool
    .request()
    .input('nombreUsuario', sql.VarChar, nombreUsuario)
    .query(`
      SELECT COUNT(*) AS cantidad
      FROM Usuario
      WHERE nombreUsuario = @nombreUsuario
    `);

  return existeUsuario.recordset[0].cantidad != 0
}

//Validar rol
async function valRol(pool, identificadorRol) {
  const existeRol = await pool
    .request()
    .input('identificador', sql.Int, identificadorRol)
    .query(`
      SELECT COUNT(*) AS cantidad
      FROM Rol
      WHERE identificador = @identificador
    `);

  return existeRol.recordset[0].cantidad != 0
}

module.exports = router;
