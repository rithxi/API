const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();

// Parse DB_URL (e.g., mysql://user:pass@host:port/dbname)
const dbUrl = new URL(process.env.DB_URL);

const pool = mysql.createPool({
  host: dbUrl.hostname,
  port: dbUrl.port,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.replace('/', ''),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
