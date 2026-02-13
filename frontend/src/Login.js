import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaUserGraduate, FaChalkboardTeacher, FaUniversity } from "react-icons/fa";
import Button from "./components/ui/Button";
import Card from "./components/ui/Card";
import { useToast } from "./components/ui/Toast";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/login", { username, password, role });
      if (res.data.success) {
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        addToast(`Welcome back, ${res.data.user.name || "User"}!`, "success");
        navigate(res.data.role === "admin" ? "/admin" : "/student");
      } else {
        addToast("Invalid credentials", "error");
      }
    } catch (err) {
      addToast("Login failed. Please check your credentials.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, var(--bg-main) 0%, #E0E7FF 100%)",
      padding: "1rem"
    }}>
      <Card style={{ width: "100%", maxWidth: "450px", padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: "80px", height: "80px", background: "var(--primary-light)",
            borderRadius: "50%", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 1rem"
          }}>
            <FaUniversity size={40} color="var(--primary)" />
          </div>
          <h2 style={{ marginBottom: "0.5rem", color: "var(--primary)" }}>Course Credit System</h2>
          <p>Sign in to access your dashboard</p>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem"
        }}>
          <div
            onClick={() => setRole("student")}
            style={{
              padding: "1rem", border: `2px solid ${role === 'student' ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: "var(--radius)", cursor: "pointer", textAlign: "center",
              background: role === 'student' ? 'var(--primary-light)' : 'white',
              transition: "all 0.2s"
            }}
          >
            <FaUserGraduate size={24} color={role === 'student' ? 'var(--primary)' : 'var(--text-light)'} />
            <div style={{ marginTop: "0.5rem", fontWeight: 600, fontSize: "0.9rem", color: role === 'student' ? 'var(--primary)' : 'var(--text-secondary)' }}>Student</div>
          </div>
          <div
            onClick={() => setRole("admin")}
            style={{
              padding: "1rem", border: `2px solid ${role === 'admin' ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: "var(--radius)", cursor: "pointer", textAlign: "center",
              background: role === 'admin' ? 'var(--primary-light)' : 'white',
              transition: "all 0.2s"
            }}
          >
            <FaChalkboardTeacher size={24} color={role === 'admin' ? 'var(--primary)' : 'var(--text-light)'} />
            <div style={{ marginTop: "0.5rem", fontWeight: 600, fontSize: "0.9rem", color: role === 'admin' ? 'var(--primary)' : 'var(--text-secondary)' }}>Admin</div>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username / Email</label>
            <input
              type="text"
              placeholder={role === "student" ? "student@uni.edu" : "admin_user"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" variant="primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Forgot password? <button type="button" style={{ background: 'none', border: 'none', color: "var(--primary)", fontWeight: 500, cursor: 'pointer', padding: 0 }} onClick={() => addToast("Please contact IT support to reset password", "info")}>Contact Support</button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
