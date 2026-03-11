import React, { useEffect, useState } from "react";
import { IoAdd, IoTrash, IoPerson, IoPencil } from "react-icons/io5";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/ui/Toast";

function DepartmentHeadManagement() {
    const [departments, setDepartments] = useState([]);
    const [deptHeads, setDeptHeads] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [headToDelete, setHeadToDelete] = useState(null);
    const [editingHead, setEditingHead] = useState(null);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        password: "",
        department: "",
        role: "DEPARTMENT_HEAD"
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [deptRes, headRes] = await Promise.all([
                fetch("http://localhost:5000/departments"),
                fetch("http://localhost:5000/api/department-heads")
            ]);

            if (!deptRes.ok || !headRes.ok) throw new Error("Failed to fetch data");

            const departmentsData = await deptRes.json();
            const headsData = await headRes.json();

            setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
            setDeptHeads(Array.isArray(headsData) ? headsData : []);
        } catch (err) {
            console.error(err);
            addToast("Failed to fetch data", "error");
            setDepartments([]);
            setDeptHeads([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingHead 
            ? `http://localhost:5000/api/department-heads/${editingHead.id}`
            : "http://localhost:5000/api/department-heads";
        const method = editingHead ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                closeModal();
                fetchData();
                addToast(`Department Head ${editingHead ? 'updated' : 'created'} successfully`, "success");
            } else {
                const data = await response.json();
                addToast(data.message, "error");
            }
        } catch (error) {
            addToast("Network error", "error");
        }
    };

    const confirmDelete = (id) => {
        setHeadToDelete(id);
        setIsDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!headToDelete) return;
        try {
            await fetch(`http://localhost:5000/api/department-heads/${headToDelete}`, { method: "DELETE" });
            fetchData();
            addToast("Department Head deleted", "success");
            setIsDeleteOpen(false);
        } catch (error) {
            addToast("Failed to delete Department Head", "error");
        }
    };

    const openEditModal = (head) => {
        setEditingHead(head);
        setFormData({
            name: head.name,
            username: head.username,
            password: "", // intentionally leave blank for edit unless they want to change it
            department: head.department || head.dept_name,
            role: "DEPARTMENT_HEAD"
        });
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingHead(null);
        setFormData({ name: "", username: "", password: "", department: "", role: "DEPARTMENT_HEAD" });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingHead(null);
        setFormData({ name: "", username: "", password: "", department: "", role: "DEPARTMENT_HEAD" });
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Department Heads</h2>
                <button className="btn btn-primary" onClick={openAddModal}>
                    <IoAdd style={{ fontSize: '1.2rem' }} /> Add Dept Head
                </button>
            </div>

            <div className="table-container shadow-sm mb-8" style={{ marginBottom: '2rem' }}>
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Username</th>
                            <th>Department</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                        ) : deptHeads.length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No Department Heads found.</td></tr>
                        ) : (
                            deptHeads.map(h => (
                                <tr key={h.id}>
                                    <td style={{ fontWeight: 500 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E0E7FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <IoPerson />
                                            </div>
                                            {h.name}
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{h.username}</td>
                                    <td>
                                        <span className="badge badge-indigo">{h.dept_name || '-'}</span>
                                    </td>
                                    <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button className="btn btn-secondary" style={{ padding: '0.4rem', fontSize: '0.75rem' }} onClick={() => openEditModal(h)}>
                                            <IoPencil />
                                        </button>
                                        <button className="btn btn-danger" style={{ padding: '0.4rem', fontSize: '0.75rem' }} onClick={() => confirmDelete(h.id)}>
                                            <IoTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingHead ? "Edit Department Head" : "Register New Department Head"}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            placeholder="e.g. Dr. Jane Smith"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            placeholder="e.g. cs_head"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password {editingHead && "(Leave blank to keep unchanged)"}</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required={!editingHead}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Department</label>
                        <select value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} required>
                            <option value="">Select Dept</option>
                            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingHead ? "Save Changes" : "Create Department Head"}</button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                message="Are you sure you want to delete this Department Head?"
            />
        </div>
    );
}

export default DepartmentHeadManagement;
