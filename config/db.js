const sql = require('mssql');

const dbConfig = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    trustServerCertificate: true
  }
};

const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log('✅ Conectado a SQL Server (SQL Auth)');
    return pool;
  })
  .catch(err => {
    console.error('❌ Error conexión DB:', err);
    return null;
  });

module.exports = {
  sql,
  poolPromise,
};