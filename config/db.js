const { Sequelize } = require('sequelize');
require('dotenv').config();

// Destructure env variables
const {
  DB_HOST,
  DB_USER,
  DB_PASS,
  DB_NAME,
  DB_PORT // Optional: if Railway gives a custom port (usually something like 40699)
} = process.env;

// Create Sequelize instance
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT || 3306,
  dialect: 'mysql',
  logging: false, // Set to true to see raw SQL queries in console
});

module.exports = sequelize;
