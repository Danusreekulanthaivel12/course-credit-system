import mysql from "mysql2";
import { config } from "dotenv";
config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "course_credit_system"
});

console.log("Testing DB query...");
db.query("SELECT * FROM admins WHERE username = ? AND password = ?", ["admin", "admin123"], (err, result) => {
    if (err) {
        console.error("Query Error:", err);
    } else {
        console.log("Query Result:", result);
    }
    db.end();
});
