const express = require('express');
const router = express.Router();


router.get('/lista', (req, res) => {
  res.json([
    { id: 1, nombre: 'Glucosa' },
    { id: 2, nombre: 'Presión' }
  ]);
});

module.exports = router;