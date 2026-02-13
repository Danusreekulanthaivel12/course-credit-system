import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { IoSchool, IoBook, IoPeople, IoLogOut } from "react-icons/io5";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navItems = [
    { path: "departments", label: "Departments", icon: <IoSchool /> },
    { path: "courses", label: "Courses", icon: <IoBook /> },
    { path: "students", label: "Students", icon: <IoPeople /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Admin Portal</h2>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <IoLogOut /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="top-bar">
          <h2>Dashboard</h2>
          <div className="user-profile">
            <div className="avatar">A</div>
            <span>Administrator</span>
          </div>
        </div>

        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
