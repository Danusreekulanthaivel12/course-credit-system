import React, { useEffect, useState } from "react";
import { IoAdd, IoTrash, IoSchool, IoPencil } from "react-icons/io5";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/ui/Toast";

function DepartmentManagement() {
    const [departments, setDepartments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentDeptId, setCurrentDeptId] = useState(null);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deptToDelete, setDeptToDelete] = useState(null);
    const [newDept, setNewDept] = useState("");
    const [loading, setLoading] = useState(true);

    const { addToast } = useToast();

    const fetchDepartments = async () => {
        try {
            const res = await fetch("http://localhost:5000/departments");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setDepartments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch departments", err);
            addToast("Failed to fetch departments", "error");
            setDepartments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const openAddModal = () => {
        setNewDept("");
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const openEditModal = (dept) => {
        setNewDept(dept.name);
        setCurrentDeptId(dept.id);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newDept.trim()) return;

        const url = isEditMode
            ? `http://localhost:5000/departments/${currentDeptId}`
            : "http://localhost:5000/departments";

        const method = isEditMode ? "PUT" : "POST";

        try {
            await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newDept }),
            });

            setNewDept("");
            setIsModalOpen(false);
            fetchDepartments();
            addToast(`Department ${isEditMode ? "updated" : "created"} successfully`, "success");
        } catch (error) {
            addToast("Operation failed", "error");
        }
    };

    const confirmDelete = (id) => {
        setDeptToDelete(id);
        setIsDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!deptToDelete) return;
        try {
            await fetch(`http://localhost:5000/departments/${deptToDelete}`, { method: "DELETE" });
            fetchDepartments();
            addToast("Department deleted successfully", "success");
            setIsDeleteOpen(false);
        } catch (error) {
            addToast("Failed to delete department", "error");
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Departments</h2>
                <button className="btn btn-primary" onClick={openAddModal}>
                    <IoAdd style={{ fontSize: '1.2rem' }} /> Add Department
                </button>
            </div>

            <div className="table-container shadow-sm">
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th style={{ width: '10%' }}>ID</th>
                            <th>Department Name</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                        ) : departments.length === 0 ? (
                            <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No departments found.</td></tr>
                        ) : (
                            departments.map((dept) => (
                                <tr key={dept.id}>
                                    <td>#{dept.id}</td>
                                    <td style={{ fontWeight: 500 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                background: 'var(--primary-light)', color: 'var(--primary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <IoSchool />
                                            </div>
                                            {dept.name}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.4rem', marginRight: '0.5rem' }}
                                            onClick={() => openEditModal(dept)}
                                            title="Edit"
                                        >
                                            <IoPencil />
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            style={{ padding: '0.4rem' }}
                                            onClick={() => confirmDelete(dept.id)}
                                            title="Delete"
                                        >
                                            <IoTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Department" : "Add Department"}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Department Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Computer Science"
                            value={newDept}
                            onChange={(e) => setNewDept(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{isEditMode ? "Update" : "Create"}</button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                message="Are you sure you want to delete this department? This will delete all associated courses and students. This action cannot be undone."
            />
        </div>
    );
}

export default DepartmentManagement;
