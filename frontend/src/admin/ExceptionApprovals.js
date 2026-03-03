import React, { useEffect, useState } from 'react';
import { useToast } from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const ExceptionApprovals = () => {
    const [requests, setRequests] = useState([]);
    const { addToast } = useToast();

    const fetchRequests = async () => {
        try {
            const res = await fetch("http://localhost:5000/requests");
            const data = await res.json();
            if (Array.isArray(data)) {
                // Filter for Exception type requests
                setRequests(data.filter(r => r.request_type === 'exception'));
            }
        } catch (err) {
            addToast("Failed to fetch requests", "error");
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id, status) => {
        try {
            const res = await fetch(`http://localhost:5000/requests/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: status === 'Approve' ? 'approved' : 'rejected' })
            });
            const data = await res.json();
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
            <h2 style={{ marginBottom: '1.5rem' }}>Approve Course Exceptions</h2>
            <Card>
                {requests.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No exception requests found.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ padding: '1rem' }}>Student</th>
                                    <th style={{ padding: '1rem' }}>Department</th>
                                    <th style={{ padding: '1rem' }}>Course Name</th>
                                    <th style={{ padding: '1rem' }}>Reason / Details</th>
                                    <th style={{ padding: '1rem' }}>Status</th>
                                    <th style={{ padding: '1rem' }}>Actions</th>
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
                                            <td style={{ padding: '1rem' }}>{req.dept_name || 'N/A'}</td>
                                            <td style={{ padding: '1rem' }}>{req.course_name}</td>
                                            <td style={{ padding: '1rem' }}>{details.description || details.details || '-'}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span className={`badge ${req.status === 'Completed' ? 'badge-green' : req.status === 'Rejected' ? 'badge-red' : 'badge-yellow'}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                {req.status === 'pending' && (
                                                    <>
                                                        <Button size="sm" variant="success" onClick={() => handleAction(req.id, 'Approve')}>Approve</Button>
                                                        <Button size="sm" variant="danger" onClick={() => handleAction(req.id, 'Reject')}>Reject</Button>
                                                    </>
                                                )}
                                            </td>
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

export default ExceptionApprovals;
