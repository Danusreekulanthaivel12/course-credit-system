import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import AdminDashboard from "./admin/AdminDashboard";
import StudentDashboard from "./student/StudentDashboard";
import Navbar from "./components/Navbar";
import { ToastProvider } from "./components/ui/Toast";
import DepartmentManagement from "./admin/DepartmentManagement";
import CourseManagement from "./admin/CourseManagement";
import StudentManagement from "./admin/StudentManagement";

// Simple Protected Route
const ProtectedRoute = ({ children, role }) => {
  const userRole = localStorage.getItem("role");
  if (!userRole || userRole !== role) {
    return <Navigate to="/" />;
  }
  return children;
};

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Navbar />
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="departments" replace />} />
              <Route path="departments" element={<DepartmentManagement />} />
              <Route path="courses" element={<CourseManagement />} />
              <Route path="students" element={<StudentManagement />} />
            </Route>
            <Route
              path="/student/*"
              element={
                <ProtectedRoute role="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            {/* Catch all - Redirect to Login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
