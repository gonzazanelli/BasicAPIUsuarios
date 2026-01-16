const { generarToken } = require('../utilities/jwt');
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { poolPromise } = require('../../config/db');

router.post('/', async (req, res) => {
    try {

        const pool = await poolPromise;

        if (!pool) {
            return res.status(500).json({ error: 'No hay conexión a la base de datos' });
        }

        const { nombreUsuario, clave } = req.body;
        const usuarioValido = await verificarCredenciales(nombreUsuario, clave, pool);

        if (!usuarioValido) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = generarToken({
            nombreUsuario: usuarioValido.nombreUsuario
        });

        res.json({
            token,
            usuarioValido
        });
  } catch (err) {
    console.error('Error en el login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

async function verificarCredenciales(nombreUsuario, password, pool) {
  try {

    // Validar que se proporcionen valores para CI y contraseña
    if (!nombreUsuario || !password) {
      return false;
    }

    // Realiza la consulta a la base de datos para obtener el usuario correspondiente
    const usuario = await pool
        .request()
        .input('nombreUsuario', sql.VarChar, nombreUsuario)
        .query(`
            SELECT U.nombreUsuario, U.clave, R.identificador, R.nombre
            FROM Usuario U
            JOIN Usuario_Rol UR ON U.nombreUsuario = UR.nombreUsuario
            JOIN Rol R ON UR.identificadorRol = R.identificador 
            WHERE U.nombreUsuario = @nombreUsuario
        `);
    const rows = usuario.recordset;
    let user = {};
    let roles;

    if (rows.length === 0) {
      // El usuario no existe en la base de datos
      return false;
    }

    /*
    const claveHashDB = rows[0].clave;
    // compara la contrasenia en texto plano recibida, con el hash almacenado en las base de datos 
    const claveValida = await bcrypt.compare(password, claveHashDB);
    if(!claveValida) {
      // la clave no es valida
      return false;
    }
    */
    const claveBase = rows[0].clave;
    if (!(password === claveBase)) {
        // la clave no es valida
        return false;
    }

    roles = rows.map(row => ({
        identificador: row.identificador,
        nombre: row.nombre
    }));
    
    //crear el objeto para devolver
    user = {
      nombreUsuario: rows[0].nombreUsuario,
      roles: roles
    }
    return user;
  
  } catch (error) {
    console.error('Error al verificar las credenciales:', error);
    throw error;
  }
}

module.exports = router;