import React, { useState, useEffect } from "react";
import axios from "axios";
import { IoSave } from "react-icons/io5";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";

const SemesterLimits = () => {
    const [limits, setLimits] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        fetchLimits();
    }, []);

    const fetchLimits = async () => {
        try {
            const res = await axios.get("http://localhost:5000/semester-limits");
            setLimits(res.data);
            setLoading(false);
        } catch (error) {
            addToast("Failed to fetch limits", "error");
            setLoading(false);
        }
    };

    const handleUpdate = async (semester, newLimit) => {
        try {
            await axios.put(`http://localhost:5000/semester-limits/${semester}`, { credit_limit: newLimit });
            addToast(`Limit for Semester ${semester} updated to ${newLimit}`, "success");
            fetchLimits();
        } catch (error) {
            addToast("Update failed", "error");
        }
    };

    const handleChange = (index, value) => {
        const newLimits = [...limits];
        newLimits[index].credit_limit = value;
        setLimits(newLimits);
    };

    return (
        <div>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Semester Credit Limits</h2>
            <Card>
                <div className="table-container shadow-sm">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Semester</th>
                                <th style={{ width: '30%' }}>Credit Limit</th>
                                <th style={{ width: '30%' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                            ) : (
                                limits.map((limit, index) => (
                                    <tr key={limit.semester}>
                                        <td style={{ fontWeight: 500 }}>Semester {limit.semester}</td>
                                        <td>
                                            <input
                                                type="number"
                                                value={limit.credit_limit}
                                                onChange={(e) => handleChange(index, e.target.value)}
                                                style={{ width: '100px' }}
                                            />
                                        </td>
                                        <td>
                                            <Button
                                                variant="primary"
                                                onClick={() => handleUpdate(limit.semester, limit.credit_limit)}
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                                            >
                                                <IoSave /> Save
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {loading && <p style={{ padding: '1rem' }}>Loading limits...</p>}
            </Card>
        </div>
    );
};

export default SemesterLimits;
