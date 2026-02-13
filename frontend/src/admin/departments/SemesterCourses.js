
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Department.css";

const SemesterCourses = () => {
  const { dept, sem } = useParams();
   const [course, setCourse] = useState(""); 
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [credit, setCredit] = useState("");
  const [courses, setCourses] = useState([]);

  const fetchCourses = () => {
    fetch(`http://localhost:5000/courses/${dept}/${sem}`)
      .then((res) => res.json())
      .then((data) => setCourses(data));
  };

  useEffect(() => {
    fetchCourses();
  }, [dept, sem]);

  const addCourse = async () => {
  if (!course.trim() || !credit) return;

  try {
    const res = await fetch("http://localhost:5000/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        department: dept,
        semester: Number(sem),       // ✅ FIX
        course_name: course.trim(),
        credit: Number(credit)       // ✅ FIX
      })
    });

    if (!res.ok) {
      console.error("Failed to add course");
      return;
    }

    await fetchCourses();           // ✅ WAIT for DB
    setCourse("");
    setCredit("");
  } catch (err) {
    console.error("Error:", err);
  }
};


  return (
    <div className="page-wrapper">
      <h1>
        {dept} — Semester {sem}
      </h1>

      {/* ADD COURSE FORM */}
      <div className="course-form">
        <input
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value)}
          placeholder="Course Code (CS101)"
        />

        <input
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          placeholder="Course Name"
        />

        <input
          value={credit}
          onChange={(e) => setCredit(e.target.value)}
          placeholder="Credit"
          type="number"
        />

        <button className="primary-btn" onClick={addCourse}>
          Add Course
        </button>
      </div>

      {/* COURSE TABLE */}
      <table className="course-table">
        <thead>
          <tr>
            <th>Course Code</th>
            <th>Course Name</th>
            <th>Credit</th>
          </tr>
        </thead>
        <tbody>
          {courses.length === 0 ? (
            <tr>
              <td colSpan="3" className="no-courses">
                No courses added
              </td>
            </tr>
          ) : (
            courses.map((c) => (
              <tr key={c.id}>
                <td>{c.course_code}</td>
                <td>{c.course_name}</td>
                <td>{c.credit}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SemesterCourses;
