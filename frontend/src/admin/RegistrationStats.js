import React, { useEffect, useState } from "react";
import { IoPerson } from "react-icons/io5";
import StatsCard from "../components/StatsCard";
import Card from "../components/ui/Card";
import { useToast } from "../components/ui/Toast";

function RegistrationStats() {
    const [stats, setStats] = useState({ department: [], semester: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("http://localhost:5000/registrations/stats");
                if (!res.ok) throw new Error("Failed to fetch statistics");

                const data = await res.json();

                // Defensive check: Ensure data structure is correct
                if (!data || !Array.isArray(data.department) || !Array.isArray(data.semester)) {
                    throw new Error("Invalid data format received");
                }

                setStats(data);
                setLoading(false);
            } catch (err) {
                console.error("Stats Error:", err);
                setError(err.message);
                addToast("Failed to load registration statistics", "error");
                setLoading(false);
            }
        };

        fetchStats();
    }, [addToast]);

    // Derived safely
    const semesterData = stats.semester || [];
    const departmentData = stats.department || [];
    const maxSemCount = semesterData.length > 0
        ? Math.max(...semesterData.map(s => s.count || 0))
        : 1;

    if (loading) return <p style={{ padding: '2rem', textAlign: 'center' }}>Loading statistics...</p>;

    if (error) return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
            <p>Error loading statistics. Please try refreshing.</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{error}</p>
        </div>
    );

    return (
        <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1.5rem' }}>Registration Statistics</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* By Department */}
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>By Department</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {departmentData.length === 0 ? <p className="text-secondary">No registrations recorded.</p> : (
                            departmentData.map((item, index) => (
                                <StatsCard
                                    key={index}
                                    label={item.name}
                                    value={item.count}
                                    icon={<IoPerson />}
                                    color="indigo"
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* By Semester */}
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>By Semester</h3>
                    <Card>
                        {semesterData.length === 0 ? <p className="text-secondary">No semester data available.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {semesterData.map((item, index) => (
                                    <div key={index}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                                            <span style={{ fontWeight: 500 }}>Semester {item.semester}</span>
                                            <span style={{ color: 'var(--text-secondary)' }}>{item.count} Students</span>
                                        </div>
                                        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div
                                                style={{
                                                    width: `${(item.count / maxSemCount) * 100}%`,
                                                    height: '100%',
                                                    backgroundColor: 'var(--primary)',
                                                    borderRadius: '4px',
                                                    transition: 'width 0.5s ease-out'
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

            </div>
        </div>
    );
}

export default RegistrationStats;
