import express from "express";
import cors from "cors";
import mysql from "mysql2";
import { config } from "dotenv";
config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "course_credit_system"
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
  } else if (role === "department_head") {
    db.query("SELECT * FROM department_heads WHERE username = ? AND password = ?", [username, password], (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length > 0) {
        res.json({ success: true, role: "department_head", user: result[0] });
      } else {
        res.status(401).json({ message: "Invalid Department Head Credentials" });
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

// --- Department Heads ---
app.get("/api/department-heads", (req, res) => {
  db.query(`
        SELECT dh.*, d.name as dept_name 
        FROM department_heads dh 
        LEFT JOIN departments d ON dh.dept_id = d.id`, 
    (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.post("/api/department-heads", (req, res) => {
  const { name, username, password, department, role } = req.body;
  const targetRole = role || 'DEPARTMENT_HEAD';

  db.query("SELECT id FROM departments WHERE name = ?", [department], (err, deptRes) => {
    const dept_id = deptRes && deptRes.length > 0 ? deptRes[0].id : null;
    
    db.query(
      "INSERT INTO department_heads (name, username, password, dept_id) VALUES (?, ?, ?, ?)",
      [name, username, password, dept_id],
      (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Username already exists" });
          return res.status(500).json(err);
        }
        res.json({ message: "Department head added", id: result.insertId });
      }
    );
  });
});

app.put("/api/department-heads/:id", (req, res) => {
  const { name, username, password, department, role } = req.body;
  const targetRole = role || 'DEPARTMENT_HEAD';

  db.query("SELECT id FROM departments WHERE name = ?", [department], (err, deptRes) => {
    const dept_id = deptRes && deptRes.length > 0 ? deptRes[0].id : null;

    if (!password || password.trim() === '') {
      db.query(
        "UPDATE department_heads SET name = ?, username = ?, dept_id = ? WHERE id = ?",
        [name, username, dept_id, req.params.id],
        (updateErr) => {
          if (updateErr) {
            if (updateErr.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Username already exists" });
            return res.status(500).json(updateErr);
          }
          res.json({ message: "Department head updated" });
        }
      );
    } else {
      db.query(
        "UPDATE department_heads SET name = ?, username = ?, password = ?, dept_id = ? WHERE id = ?",
        [name, username, password, dept_id, req.params.id],
        (updateErr) => {
          if (updateErr) {
            if (updateErr.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Username already exists" });
            return res.status(500).json(updateErr);
          }
          res.json({ message: "Department head updated" });
        }
      );
    }
  });
});

app.delete("/api/department-heads/:id", (req, res) => {
  db.query("DELETE FROM department_heads WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Department head deleted" });
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
  console.log("POST /courses payload:", req.body);

  // Validation
  if (!course_code || course_code.length > 20) {
    return res.status(400).json({ message: "Course code must be 1-20 characters" });
  }
  if (!course_name) {
    return res.status(400).json({ message: "Course name is required" });
  }
  const creditsInt = parseInt(credits);
  if (isNaN(creditsInt) || creditsInt <= 0) {
    return res.status(400).json({ message: "Credits must be a positive number" });
  }
  const semesterInt = parseInt(semester);
  if (isNaN(semesterInt) || semesterInt <= 0) {
    return res.status(400).json({ message: "Semester must be a valid number" });
  }
  const deptIdInt = parseInt(dept_id);
  if (isNaN(deptIdInt)) {
    return res.status(400).json({ message: "Invalid Department" });
  }

  const sql = "INSERT INTO courses (course_code, course_name, credits, dept_id, semester, type) VALUES (?, ?, ?, ?, ?, ?)";
  const values = [course_code, course_name, creditsInt, deptIdInt, semesterInt, type || 'Regular'];

  console.log("Executing SQL:", sql, "Values:", values);

  db.query(
    sql,
    values,
    (err, result) => {
      if (err) {
        console.error("Insert Error:", err);
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Course code must be unique" });
        if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: "Invalid Department ID" });
        return res.status(500).json(err);
      }
      console.log("Insert Result:", result);
      res.json({ message: "Course added", id: result.insertId });
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
  db.query("DELETE FROM courses WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Course deleted successfully" });
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

app.put("/students/promote", (req, res) => {
  console.log("Bulk Update Request:", req.body);

  // Normalize keys (handle camelCase vs snake_case)
  const currentSemesterVal = req.body.current_semester || req.body.currentSemester;
  const newSemesterVal = req.body.new_semester || req.body.newSemester;
  const deptVal = req.body.dept_id !== undefined ? req.body.dept_id : req.body.department;

  // Helper to extract number from string (e.g., "Sem 1" -> 1)
  const parseSemValue = (val) => {
    if (val === null || val === undefined || val === "") return NaN;
    const str = String(val);
    const match = str.match(/\d+/);
    return match ? parseInt(match[0]) : NaN;
  };

  const currentSem = parseSemValue(currentSemesterVal);
  const newSem = parseSemValue(newSemesterVal);

  // Handle Department
  let deptId = null;
  if (deptVal && deptVal !== "All Departments" && deptVal !== "") {
    deptId = parseInt(deptVal);
    if (isNaN(deptId)) deptId = null; // Fallback if parse fails
  }

  if (isNaN(newSem) || isNaN(currentSem)) {
    return res.status(400).json({ message: "Invalid semester values. Received: " + JSON.stringify(req.body) });
  }

  if (newSem <= currentSem) {
    return res.status(400).json({ message: "New semester must be greater than current semester" });
  }

  console.log(`Processing Update: Sem ${currentSem} -> ${newSem}, Dept: ${deptId} `);

  let sql = "UPDATE students SET semester = ? WHERE semester = ?";
  const params = [newSem, currentSem];

  if (deptId !== null) {
    sql += " AND dept_id = ?";
    params.push(deptId);
  }

  console.log("Executing SQL:", sql, "Params:", params);

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Bulk Update SQL Error:", err);
      return res.status(500).json({ message: "Database update failed", error: err });
    }
    console.log("Bulk Update Result:", result);

    if (result.affectedRows === 0) {
      return res.json({ message: "No students matches the criteria for update.", updatedCount: 0 });
    }

    res.json({ message: "Students updated successfully", updatedCount: result.affectedRows });
  });
});

app.delete("/students/:id", (req, res) => {
  db.query("DELETE FROM students WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Student deleted" });
  });
});

// --- Registration Stats ---
app.get("/registrations/stats", async (req, res) => {
  try {
    const [deptStats] = await db.promise().query(`
      SELECT d.name, COUNT(r.id) as count 
      FROM registrations r 
      JOIN students s ON r.student_id = s.id 
      JOIN departments d ON s.dept_id = d.id 
      GROUP BY d.name
    `);

    const [semStats] = await db.promise().query(`
      SELECT s.semester, COUNT(r.id) as count 
      FROM registrations r 
      JOIN students s ON r.student_id = s.id 
      GROUP BY s.semester 
      ORDER BY s.semester
    `);

    res.json({ department: deptStats, semester: semStats });
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ message: "Error fetching stats", error: err.message });
  }
});

// --- Course Requests (Add-On / Exception) ---

// Admin: Get All Requests (Only those approved by Dept Head)
app.get("/requests", (req, res) => {
  const sql = `
    SELECT r.*, s.name as student_name, s.email, d.name as dept_name 
    FROM course_requests r 
    JOIN students s ON r.student_id = s.id 
    LEFT JOIN departments d ON s.dept_id = d.id 
    WHERE r.status = 'Pending - Admin Approval'
    ORDER BY r.created_at DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// Admin: Get all requests pending Department Head approval across all departments
app.get("/requests/all/department-pending", (req, res) => {
  const sql = `
    SELECT r.*, s.name as student_name, s.email, s.semester, d.name as dept_name 
    FROM course_requests r 
    JOIN students s ON r.student_id = s.id 
    LEFT JOIN departments d ON s.dept_id = d.id 
    WHERE r.status = 'Pending - Department Head Approval'
    ORDER BY r.created_at DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// Dept Head: Get Requests for specific department
app.get("/requests/department/:dept_id", (req, res) => {
  const sql = `
    SELECT r.*, s.name as student_name, s.email, s.semester, d.name as dept_name 
    FROM course_requests r 
    JOIN students s ON r.student_id = s.id 
    LEFT JOIN departments d ON s.dept_id = d.id 
    WHERE s.dept_id = ? AND r.status = 'Pending - Department Head Approval'
    ORDER BY r.created_at DESC
  `;
  db.query(sql, [req.params.dept_id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.get("/requests/:student_id", (req, res) => {
  db.query("SELECT * FROM course_requests WHERE student_id = ? ORDER BY created_at DESC", [req.params.student_id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.post("/requests", (req, res) => {
  const { student_id, course_name, request_type, details } = req.body;
  if (!student_id || !course_name || !request_type) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Check for existing approved exception requests
  if (request_type === 'exception') {
    // 1. Check if the elective course already has an approved exception
    const checkElectiveSql = "SELECT * FROM course_requests WHERE student_id = ? AND course_name = ? AND request_type = 'exception' AND status = 'approved'";
    db.query(checkElectiveSql, [student_id, course_name], (checkErr, checkResult) => {
      if (checkErr) return res.status(500).json(checkErr);
      if (checkResult.length > 0) {
        return res.status(400).json({ message: "Exception already approved" });
      }

      // 2. Check if the selected Add-On course is already used in an approved exception
      const addonCourseName = typeof details === 'string' ? details : details.description;
      if (addonCourseName) {
        const checkAddonSql = "SELECT * FROM course_requests WHERE student_id = ? AND request_type = 'exception' AND status = 'approved' AND JSON_EXTRACT(details, '$.description') = ?";
        db.query(checkAddonSql, [student_id, addonCourseName], (addonErr, addonResult) => {
          if (addonErr) return res.status(500).json(addonErr);
          if (addonResult.length > 0) {
            return res.status(400).json({ message: "Add-On course already used for an exception" });
          }
          insertRequest();
        });
      } else {
        insertRequest();
      }
    });
  } else {
    insertRequest();
  }

  function insertRequest() {
    const sql = "INSERT INTO course_requests (student_id, course_name, request_type, details, status) VALUES (?, ?, ?, ?, 'Pending - Department Head Approval')";
    db.query(sql, [student_id, course_name, request_type, JSON.stringify(details || {})], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Request submitted successfully", id: result.insertId });
    });
  }
});

// Update Request Status
app.put("/requests/:id/status", (req, res) => {
  const { status, role } = req.body; // status is 'Approve' or 'Reject' from the frontend

  if (!['Approve', 'Reject', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  // 1. Fetch the request to check its type
  db.query("SELECT * FROM course_requests WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) return res.status(404).json({ message: "Request not found" });

    const request = result[0];
    let dbStatus = request.status; // Default to current status
    const currentStatus = request.status;

    // We normalize the incoming status to lowercase 'approve' or 'reject' for easier processing
    const action = status.toLowerCase() === 'approved' ? 'approve' : (status.toLowerCase() === 'rejected' ? 'reject' : status.toLowerCase());


    // 2. Logic based on Request Type & Action & Role
    if (currentStatus === 'Pending - Department Head Approval') {
      if (role !== 'department_head') return res.status(403).json({ message: "Unauthorized role for this action" });
      if (action === 'approve') {
        dbStatus = 'Pending - Admin Approval';
      } else if (action === 'reject') {
        dbStatus = 'Rejected by Department Head';
      }
    } else if (currentStatus === 'Pending - Admin Approval') {
      if (role !== 'admin') return res.status(403).json({ message: "Unauthorized role for this action" });
      if (action === 'approve') {
        // Final completion state
        if (request.request_type === 'addon') {
          dbStatus = 'Completed';
        } else {
          dbStatus = 'Excepted';
        }
      } else if (action === 'reject') {
        dbStatus = 'Rejected by Admin';
      }
    } else {
      // Support for existing basic 'pending' -> 'approved' / 'rejected' flow just in case of old data
      if (currentStatus === 'pending') {
        dbStatus = action === 'approve' ? 'approved' : 'rejected';
      }
    }

    // 3. Update DB
    db.query("UPDATE course_requests SET status = ? WHERE id = ?", [dbStatus, req.params.id], (updateErr) => {
      if (updateErr) return res.status(500).json(updateErr);
      res.status(200).json({ success: true, status: action.toUpperCase(), message: `Request status updated to ${dbStatus}` });
    });
  });
});

/* ================= STUDENT MODULE ================= */

// --- Registrations ---

app.get("/registrations/:student_id", (req, res) => {
  db.query(
    "SELECT r.id, 'Registered' as status, c.id as course_id, c.course_code, c.course_name, c.credits, c.type, c.semester FROM registrations r JOIN courses c ON r.course_id = c.id WHERE r.student_id = ?",
    [req.params.student_id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
});

app.post("/registrations", async (req, res) => {
  const { student_id, course_id } = req.body;
  console.log("Registration Request:", { student_id, course_id });

  if (!student_id || !course_id) {
    return res.status(400).json({ message: "Missing student_id or course_id" });
  }

  try {
    // 1. Fetch Course Details
    const [courses] = await db.promise().query("SELECT * FROM courses WHERE id = ?", [course_id]);
    if (courses.length === 0) return res.status(404).json({ message: "Course not found" });
    const course = courses[0];

    // 2. Fetch Student Details
    const [students] = await db.promise().query("SELECT * FROM students WHERE id = ?", [student_id]);
    if (students.length === 0) return res.status(404).json({ message: "Student not found" });
    const student = students[0];

    // 3. Duplicate Check
    const [existing] = await db.promise().query("SELECT * FROM registrations WHERE student_id = ? AND course_id = ?", [student_id, course_id]);
    if (existing.length > 0) return res.status(409).json({ message: "Already registered for this course" });

    // 4. Logic based on Course Type
    if (course.type === 'Elective') {
      // Fetch Semester Limit
      const [limits] = await db.promise().query("SELECT credit_limit FROM semester_limits WHERE semester = ?", [student.semester]);
      const creditLimit = limits.length > 0 ? limits[0].credit_limit : 25;

      // Note: User requested to EXCLUDE Regular credits from this check.
      // So we only check if (Registered Electives + New Elective) > Limit.

      // Fetch Registered Elective Credits
      const [registeredElectives] = await db.promise().query(`
            SELECT SUM(c.credits) as total 
            FROM registrations r 
            JOIN courses c ON r.course_id = c.id 
            WHERE r.student_id = ? AND c.type = 'Elective'`, [student_id]);
      
      const registeredElectiveCredits = parseInt(registeredElectives[0].total) || 0;
      const newCourseCredits = parseInt(course.credits) || 0;
      const totalCredits = registeredElectiveCredits + newCourseCredits;

      if (totalCredits > creditLimit) {
        return res.status(400).json({
          message: `Credit limit exceeded. Limit: ${creditLimit}, Current (Electives): ${registeredElectiveCredits}, New: ${course.credits}`
        });
      }
    }
    // Minor/Honor checks can be added here (e.g. mutual exclusion), but user asked to skip credit check for them.
    // Mutual exclusion is currently enforced on frontend, but could be added here for safety.

    // 5. Insert Registration
    const [result] = await db.promise().query("INSERT INTO registrations (student_id, course_id) VALUES (?, ?)", [student_id, course_id]);

    console.log("Registration Successful:", result.insertId);
    res.status(201).json({ message: "Registration successful", id: result.insertId });

  } catch (err) {
    console.error("Registration Logic Error:", err);
    res.status(500).json({ message: "Internal server error during registration", error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
