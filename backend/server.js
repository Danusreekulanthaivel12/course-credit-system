import express from "express";
import cors from "cors";
import mysql from "mysql2";

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "DanuK@05",
  database: "course_credit_system"
});

db.connect(err => {
  if (err) {
    console.error("DB connection failed:", err);
    return;
  }
  console.log("MySQL connected");
});

/* ================= AUTHENTICATION ================= */

app.post("/login", (req, res) => {
  const { username, password, role } = req.body;

  if (role === "admin") {
    db.query("SELECT * FROM admins WHERE username = ? AND password = ?", [username, password], (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length > 0) {
        res.json({ success: true, role: "admin", user: result[0] });
      } else {
        res.status(401).json({ message: "Invalid Admin Credentials" });
      }
    });
  } else if (role === "student") {
    db.query("SELECT * FROM students WHERE email = ? AND password = ?", [username, password], (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length > 0) {
        res.json({ success: true, role: "student", user: result[0] });
      } else {
        res.status(401).json({ message: "Invalid Student Credentials" });
      }
    });
  } else {
    res.status(400).json({ message: "Invalid Role" });
  }
});

/* ================= ADMIN MODULE ================= */

// --- Departments ---
app.get("/departments", (req, res) => {
  db.query("SELECT * FROM departments", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.post("/departments", (req, res) => {
  const { name } = req.body;
  db.query("INSERT INTO departments (name) VALUES (?)", [name], (err, result) => {
    if (err) return res.status(400).json({ message: "Department exists or invalid data" });
    res.json({ message: "Department added", id: result.insertId });
  });
});

// Update Department
app.put("/departments/:id", (req, res) => {
  const { name } = req.body;
  db.query("UPDATE departments SET name = ? WHERE id = ?", [name, req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Department updated" });
  });
});

// Delete Department
app.delete("/departments/:id", (req, res) => {
  db.query("DELETE FROM departments WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Department deleted" });
  });
});

// --- Semester Limits ---
app.get("/semester-limits", (req, res) => {
  db.query("SELECT * FROM semester_limits", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.put("/semester-limits/:semester", (req, res) => {
  const { credit_limit } = req.body;
  db.query(
    "UPDATE semester_limits SET credit_limit = ? WHERE semester = ?",
    [credit_limit, req.params.semester],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Limit updated" });
    }
  );
});

// --- Courses ---
app.get("/courses", (req, res) => {
  const { dept_id, semester } = req.query;
  let sql = "SELECT * FROM courses WHERE 1=1";
  const params = [];

  if (dept_id) {
    sql += " AND dept_id = ?";
    params.push(dept_id);
  }
  if (semester) {
    sql += " AND semester = ?";
    params.push(semester);
  }

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.post("/courses", (req, res) => {
  const { course_code, course_name, credits, dept_id, semester, type } = req.body;
  db.query(
    "INSERT INTO courses (course_code, course_name, credits, dept_id, semester, type) VALUES (?, ?, ?, ?, ?, ?)",
    [course_code, course_name, credits, dept_id, semester, type || 'Regular'],
    (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Course code must be unique" });
        return res.status(500).json(err);
      }
      res.json({ message: "Course added" });
    }
  );
});

// Update Course
app.put("/courses/:id", (req, res) => {
  const { course_code, course_name, credits, type } = req.body;
  db.query(
    "UPDATE courses SET course_code = ?, course_name = ?, credits = ?, type = ? WHERE id = ?",
    [course_code, course_name, credits, type, req.params.id],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Course code must be unique" });
        return res.status(500).json(err);
      }
      res.json({ message: "Course updated successfully" });
    }
  );
});

// Delete Course (with check)
app.delete("/courses/:id", (req, res) => {
  // Check if any students are registered
  db.query("SELECT count(*) as count FROM registrations WHERE course_id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result[0].count > 0) {
      return res.status(400).json({ message: "Cannot delete course: Students are registered." });
    }

    db.query("DELETE FROM courses WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Course deleted successfully" });
    });
  });
});


// --- Students Management ---
app.get("/students", (req, res) => {
  db.query(`
        SELECT s.*, d.name as dept_name 
        FROM students s 
        LEFT JOIN departments d ON s.dept_id = d.id`,
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    });
});

app.post("/students", (req, res) => {
  const { name, email, password, dept_id, semester } = req.body;
  db.query(
    "INSERT INTO students (name, email, password, dept_id, semester) VALUES (?, ?, ?, ?, ?)",
    [name, email, password, dept_id, semester],
    (err) => {
      if (err) return res.status(400).json({ message: "Email already exists" });
      res.json({ message: "Student added" });
    }
  );
});

app.delete("/students/:id", (req, res) => {
  db.query("DELETE FROM students WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Student deleted" });
  });
});

// --- Registration Stats ---
app.get("/registrations/stats", (req, res) => {
  const stats = {};
  const q1 = "SELECT d.name, COUNT(r.id) as count FROM registrations r JOIN students s ON r.student_id = s.id JOIN departments d ON s.dept_id = d.id GROUP BY d.id";
  const q2 = "SELECT s.semester, COUNT(r.id) as count FROM registrations r JOIN students s ON r.student_id = s.id GROUP BY s.semester";

  db.query(q1, (err, deptStats) => {
    if (err) return res.status(500).json(err);
    stats.department = deptStats;

    db.query(q2, (err, semStats) => {
      if (err) return res.status(500).json(err);
      stats.semester = semStats;
      res.json(stats);
    });
  });
});


/* ================= STUDENT MODULE ================= */

// Get Student's Registered Courses
app.get("/registrations/:student_id", (req, res) => {
  db.query(
    `SELECT c.* FROM registrations r 
         JOIN courses c ON r.course_id = c.id 
         WHERE r.student_id = ?`,
    [req.params.student_id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
});

// Register Course
app.post("/registrations", (req, res) => {
  const { student_id, course_id } = req.body;
  const CREDIT_LIMIT = 25;

  // 1. Check if already registered
  db.query("SELECT * FROM registrations WHERE student_id = ? AND course_id = ?", [student_id, course_id], (err, exists) => {
    if (err) return res.status(500).json(err);
    if (exists.length > 0) return res.status(400).json({ message: "Already registered" });

    // 2. Get current total credits
    db.query(
      `SELECT SUM(c.credits) as total_credits FROM registrations r 
             JOIN courses c ON r.course_id = c.id 
             WHERE r.student_id = ?`,
      [student_id],
      (err, result) => {
        if (err) return res.status(500).json(err);

        const currentCredits = result[0].total_credits || 0;

        // 3. Get new course credits & Dynamic Limit
        db.query("SELECT credits, semester FROM courses WHERE id = ?", [course_id], (err, courseRes) => {
          if (err) return res.status(500).json(err);
          if (courseRes.length === 0) return res.status(404).json({ message: "Course not found" });

          const newCredits = courseRes[0].credits;
          const courseSem = courseRes[0].semester;

          // Fetch limit for this semester
          db.query("SELECT credit_limit FROM semester_limits WHERE semester = ?", [courseSem], (err, limitRes) => {
            if (err) return res.status(500).json(err);
            const limit = limitRes.length > 0 ? limitRes[0].credit_limit : 25; // Default 25

            if (currentCredits + newCredits > limit) {
              return res.status(400).json({ message: `Credit limit exceeded (Max ${limit})` });
            }

            // 4. Register
            db.query("INSERT INTO registrations (student_id, course_id) VALUES (?, ?)", [student_id, course_id], (err) => {
              if (err) return res.status(500).json(err);
              res.json({ message: "Registration successful" });
            });
          });
        });
      }
    );
  });
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
