import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Department.css";

const DepartmentDashboard = () => {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);

  /* ================= FETCH ================= */
  const fetchDepartments = async () => {
    try {
      const res = await fetch("http://localhost:5000/departments");
      const data = await res.json();
      setDepartments(data); // ✅ backend returns array
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  /* ================= ADD / UPDATE ================= */
  const addOrUpdateDepartment = async () => {
    if (!name.trim()) return;

    if (editId) {
      await fetch(`http://localhost:5000/departments/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
    } else {
      await fetch("http://localhost:5000/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
    }

    setName("");
    setEditId(null);
    fetchDepartments();
  };

  /* ================= DELETE ================= */
  const deleteDepartment = async (id) => {
    if (!window.confirm("Delete this department?")) return;

    await fetch(`http://localhost:5000/departments/${id}`, {
      method: "DELETE"
    });

    fetchDepartments();
  };

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <h1>Manage Departments</h1>
        <p>Departments loaded from database</p>
      </header>

      {/* ADD / EDIT */}
      <div className="add-dept-card">
        <h3>{editId ? "Edit Department" : "Add Department"}</h3>

        <div className="add-dept-row">
          <input
            type="text"
            placeholder="Department name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={addOrUpdateDepartment}>
            {editId ? "Update" : "Add"}
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="dept-grid">
        {departments.length === 0 ? (
          <p>No departments found</p>
        ) : (
          departments.map((dept) => (
            <div className="dept-card" key={dept.id}>
              <h3
                onClick={() => navigate(`/departments/${dept.name}`)}
                style={{ cursor: "pointer" }}
              >
                {dept.name}
              </h3>

              <div className="dept-actions">
                <button
                  className="primary-btn"
                  onClick={() => {
                    setName(dept.name);
                    setEditId(dept.id);
                  }}
                >
                  Edit
                </button>

                <button
                  className="delete-btn"
                  onClick={() => deleteDepartment(dept.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DepartmentDashboard;
