import { useNavigate, useParams } from "react-router-dom";
import "./Department.css";

const semesters = [1,2,3,4,5,6,7,8];

const SelectSemester = () => {
  const { dept } = useParams();
  const navigate = useNavigate();

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <h1>{dept} — Select Semester</h1>
        <p>Choose a semester to add courses and credits.</p>
      </header>

      <div className="sem-grid">
        {semesters.map((sem) => (
          <div
            key={sem}
            className="sem-card"
            onClick={() => navigate(`/departments/${dept}/semester/${sem}`)}
          >
            <h3>Semester {sem}</h3>
            <p>Manage courses & credits</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectSemester;
