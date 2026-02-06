// const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const express = require("express");
const app = express();
app.use(cors());
app.use(express.json());

/* ================= MYSQL CONNECTION ================= */

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "DanuK@05",           // ✅ your MySQL password
  database: "course_credit_system" // ✅ confirm this DB name exists
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err.message);
    return;
  }
  console.log("✅ MySQL connected successfully");
});

/* ================= TEST ROUTE ================= */
// Use this to confirm DB + table + data
app.get("/test-db", (req, res) => {
  db.query("SELECT * FROM courses", (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    res.json(result);
  });
});

/* ================= COURSES ================= */

// Get courses by department & semester
app.get("/courses/:dept/:sem", (req, res) => {
  const { dept, sem } = req.params;
  
  const sql = `
    SELECT * 
    FROM courses 
    WHERE department = ? AND semester = ?
  `;

  db.query(sql, [dept, Number(sem)], (err, result) => {
    if (err) {
      console.error("❌ Query error:", err);
      return res.status(500).json(err);
    }
    console.log("✅ DB RESULT:", result);
    res.json(result);
  });
});

// Add course (persistent)
app.post("/courses", (req, res) => {
  const { department, semester, course_name, credit } = req.body;

  const sql = `
    INSERT INTO courses (department, semester, course_name, credit)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [department, Number(semester), course_name, Number(credit)],
    (err) => {
      if (err) {
        console.error("❌ Insert error:", err);
        return res.status(500).json(err);
      }
      res.json({ message: "Course added successfully" });
    }
  );
});

/* ================= DEPARTMENTS ================= */

// Get all departments
app.get("/departments", (req, res) => {
  db.query("SELECT name FROM departments", (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    res.json(result);
  });
});

// Add department
app.post("/departments", (req, res) => {
  const { name } = req.body;

  db.query(
    "INSERT INTO departments (name) VALUES (?)",
    [name],
    (err) => {
      if (err) {
        return res.status(400).json({ message: "Department already exists" });
      }
      res.json({ message: "Department added successfully" });
    }
  );
});

/* ================= SERVER ================= */

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
