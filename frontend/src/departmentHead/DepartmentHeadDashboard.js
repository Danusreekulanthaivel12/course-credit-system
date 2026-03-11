import React, { useEffect, useState } from 'react';
import { useToast } from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const DepartmentHeadDashboard = () => {
    const [requests, setRequests] = useState([]);
    const { addToast } = useToast();
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const role = localStorage.getItem("role");

    const fetchRequests = async () => {
        try {
            let url = "";
            if (role === "admin") {
                url = "http://localhost:5000/requests/all/department-pending";
            } else if (role === "department_head" && user.dept_id) {
                url = `http://localhost:5000/requests/department/${user.dept_id}`;
            } else {
                return; // Nothing to fetch
            }

            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) {
                setRequests(data);
            }
        } catch (err) {
            addToast("Failed to fetch requests", "error");
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [user.dept_id, role]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAction = async (id, status) => {
        if (role !== "department_head") return;
        try {
            const res = await fetch(`http://localhost:5000/requests/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: status === 'Approve' ? 'approved' : 'rejected', role: 'department_head' })
            });
            let data = {};
            try {
                data = await res.json();
            } catch (jsonErr) { }

            if (res.ok) {
                addToast(`Request ${status}d successfully`, "success");
                // Remove the processed request from the list
                setRequests(prev => prev.filter(req => req.id !== id));
            } else {
                addToast(data.message || "Action failed", "error");
            }
        } catch (err) {
            addToast("Network error", "error");
        }
    };

    return (
        <div>
            <h2 style={{ marginBottom: '1.5rem' }}>{role === 'admin' ? "Global Department Pending Requests" : "Department Head Approval Dashboard"}</h2>
            <Card>
                {requests.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No pending requests found.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ padding: '1rem' }}>Student</th>
                                    {role === 'admin' && <th style={{ padding: '1rem' }}>Department</th>}
                                    <th style={{ padding: '1rem' }}>Semester</th>
                                    <th style={{ padding: '1rem' }}>Request Type</th>
                                    <th style={{ padding: '1rem' }}>Course Type</th>
                                    <th style={{ padding: '1rem' }}>Course Name</th>
                                    <th style={{ padding: '1rem' }}>Credits</th>
                                    {role === 'department_head' && <th style={{ padding: '1rem' }}>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(req => {
                                    const details = typeof req.details === 'string' ? JSON.parse(req.details) : (req.details || {});
                                    return (
                                        <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 500 }}>{req.student_name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{req.email || 'N/A'}</div>
                                            </td>
                                            {role === 'admin' && <td style={{ padding: '1rem' }}>{req.dept_name || '-'}</td>}
                                            <td style={{ padding: '1rem' }}>{req.semester || 'N/A'}</td>
                                            <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{req.request_type}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span className="badge badge-blue">{details.course_type || (req.request_type === 'exception' ? 'Exception' : 'Add-On')}</span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>{req.course_name}</td>
                                            <td style={{ padding: '1rem' }}>{details.credits || '-'}</td>
                                            {role === 'department_head' && (
                                                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                    <Button size="sm" variant="success" onClick={() => handleAction(req.id, 'Approve')}>Approve</Button>
                                                    <Button size="sm" variant="danger" onClick={() => handleAction(req.id, 'Reject')}>Reject</Button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default DepartmentHeadDashboard;
