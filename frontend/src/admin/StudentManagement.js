import React, { useEffect, useState } from "react";
import { IoAdd, IoTrash, IoPerson, IoArrowForward } from "react-icons/io5";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/ui/Toast";

function StudentManagement() {
    const [departments, setDepartments] = useState([]);
    const [students, setStudents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState(null);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    const [newStudent, setNewStudent] = useState({
        name: "",
        email: "",
        password: "",
        dept_id: "",
        semester: 1
    });

    const [bulkData, setBulkData] = useState({
        dept_id: "",
        current_semester: 1,
        new_semester: 2
    });
    const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [deptRes, stuRes] = await Promise.all([
                fetch("http://localhost:5000/departments"),
                fetch("http://localhost:5000/students")
            ]);

            if (!deptRes.ok || !stuRes.ok) throw new Error("Failed to fetch data");

            const departmentsData = await deptRes.json();
            const studentsData = await stuRes.json();

            setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
            setStudents(Array.isArray(studentsData) ? studentsData : []);
        } catch (err) {
            console.error(err);
            addToast("Failed to fetch data", "error");
            setDepartments([]);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newStudent),
            });

            if (response.ok) {
                setNewStudent({ name: "", email: "", password: "", dept_id: "", semester: 1 });
                setIsModalOpen(false);
                fetchData();
                addToast("Student created successfully", "success");
            } else {
                const data = await response.json();
                addToast(data.message, "error");
            }
        } catch (error) {
            addToast("Network error", "error");
        }
    };

    const confirmDelete = (id) => {
        setStudentToDelete(id);
        setIsDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!studentToDelete) return;
        try {
            await fetch(`http://localhost:5000/students/${studentToDelete}`, { method: "DELETE" });
            fetchData();
            addToast("Student deleted", "success");
            setIsDeleteOpen(false);
        } catch (error) {
            addToast("Failed to delete student", "error");
        }
    };

    const handleBulkUpdate = (e) => {
        e.preventDefault();
        if (parseInt(bulkData.new_semester) <= parseInt(bulkData.current_semester)) {
            addToast("New semester must be greater than current semester", "error");
            return;
        }
        setIsBulkConfirmOpen(true);
    };

    const executeBulkUpdate = async () => {
        setIsBulkConfirmOpen(false);
        try {
            const response = await fetch("http://localhost:5000/students/promote", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bulkData),
            });
            const data = await response.json();
            if (response.ok) {
                addToast(`${data.updatedCount} students updated successfully`, "success");
                await fetchData();
            } else {
                addToast(data.message, "error");
            }
        } catch (error) {
            addToast("An error occurred during update", "error");
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Students</h2>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <IoAdd style={{ fontSize: '1.2rem' }} /> Add Student
                </button>
            </div>

            <div className="table-container shadow-sm mb-8" style={{ marginBottom: '2rem' }}>
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email / Username</th>
                            <th>Department</th>
                            <th style={{ textAlign: 'center' }}>Semester</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No students found.</td></tr>
                        ) : (
                            students.map(s => (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 500 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E0E7FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <IoPerson />
                                            </div>
                                            {s.name}
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{s.email}</td>
                                    <td>
                                        <span className="badge badge-indigo">{s.dept_name || '-'}</span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className="badge badge-blue">Sem {s.semester}</span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-danger" style={{ padding: '0.4rem', fontSize: '0.75rem' }} onClick={() => confirmDelete(s.id)}>
                                            <IoTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="card" style={{ padding: '2rem', border: '1px solid var(--border)', background: 'linear-gradient(to right, #ffffff, #F9FAFB)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '8px', color: 'white' }}>
                        <IoArrowForward size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Bulk Promotion</h3>
                        <p style={{ fontSize: '0.875rem' }}>Promote all students from one semester to the next</p>
                    </div>
                </div>

                <form onSubmit={handleBulkUpdate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Department (Optional)</label>
                        <select value={bulkData.dept_id} onChange={e => setBulkData({ ...bulkData, dept_id: e.target.value })}>
                            <option value="">All Departments</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Current Semester</label>
                        <select value={bulkData.current_semester} onChange={e => setBulkData({ ...bulkData, current_semester: e.target.value })}>
                            {[...Array(8)].map((_, i) => <option key={i + 1} value={i + 1}>Sem {i + 1}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">New Semester</label>
                        <select value={bulkData.new_semester} onChange={e => setBulkData({ ...bulkData, new_semester: e.target.value })}>
                            {[...Array(8)].map((_, i) => <option key={i + 1} value={i + 1}>Sem {i + 1}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
                        Promote Students
                    </button>
                </form>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Student">
                <form onSubmit={handleAdd}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            placeholder="e.g. John Doe"
                            value={newStudent.name}
                            onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email (Username)</label>
                        <input
                            type="email"
                            placeholder="e.g. john@example.com"
                            value={newStudent.email}
                            onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={newStudent.password}
                            onChange={e => setNewStudent({ ...newStudent, password: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Department</label>
                        <select value={newStudent.dept_id} onChange={e => setNewStudent({ ...newStudent, dept_id: e.target.value })} required>
                            <option value="">Select Dept</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Create Student</button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                message="Are you sure you want to delete this student?"
            />

            <ConfirmDialog
                isOpen={isBulkConfirmOpen}
                onClose={() => setIsBulkConfirmOpen(false)}
                onConfirm={executeBulkUpdate}
                message={`Are you sure you want to promote all students from Semester ${bulkData.current_semester} to Semester ${bulkData.new_semester}?`}
            />
        </div>
    );
}

export default StudentManagement;
