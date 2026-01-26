require('dotenv').config();

const express = require('express');
const app = express();

// Para poder leer JSON en el cuerpo de las peticiones
app.use(express.json()); 

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando 🚀' });
});

// COMENTADISIMO PA

//Ruta Login
const loginRoutes = require('./routes/login');
app.use('/login', loginRoutes);

//Ruta Usuario
const usersRoutes = require('./routes/usuario');
app.use('/usuario', usersRoutes);

//Ruta Rol
const rolsRoutes = require('./routes/rol');
app.use('/rol', rolsRoutes);

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});