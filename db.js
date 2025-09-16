// db.js
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "34.143.221.92",      // your MySQL host
  user: "versus",           // your MySQL username
  password: "xml3756",   // your MySQL password
  database: "versus_leasing",     // your database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
