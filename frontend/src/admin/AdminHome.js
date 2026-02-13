import React, { useEffect, useState } from "react";
import { IoSchool, IoPeople, IoBook } from "react-icons/io5";
import StatsCard from "../components/StatsCard";

function AdminHome() {
    const [counts, setCounts] = useState({ departments: 0, students: 0, courses: 0 });

    useEffect(() => {
        const fetchData = async () => {
            // In a real app, I'd make a dedicated stats API or fetch all length
            // For now, I'll fetch lists and count. Not efficient for big data, but OK for this.
            const depts = await fetch("http://localhost:5000/departments").then(r => r.json());
            const students = await fetch("http://localhost:5000/students").then(r => r.json());
            // For courses, we need to try to get all. Current API filters by Dept/Sem.
            // I'll filter logically or just rely on the other endpoints for now.

            // Let's just create a quick aggregate endpoint in backend later if needed.
            // For now I'll just show what I can easily get or mock '0' if hard
            // Actually, I can update the backend to give me counts. 
            // But let's work with what we have for a sec.
            setCounts({
                departments: depts.length || 0,
                students: students.length || 0,
                courses: "View" // Placeholder as we don't have Get All Courses API without filters
            });
        };
        fetchData();
    }, []);

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <StatsCard
                    label="Active Departments"
                    value={counts.departments}
                    icon={<IoSchool />}
                    color="indigo"
                />
                <StatsCard
                    label="Total Students"
                    value={counts.students}
                    icon={<IoPeople />}
                    color="green"
                />
                <StatsCard
                    label="Courses Configured"
                    value={counts.courses}
                    icon={<IoBook />}
                    color="blue"
                />
            </div>

            <div className="card" style={{ background: 'linear-gradient(to right, #ffffff, #F3F4F6)', borderLeft: '4px solid var(--primary)' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>👋 Welcome, Administrator</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: 1.6 }}>
                    Manage departments, courses, and student records from the sidebar menu.
                    Use the <strong>Dashboard</strong> to get an overview of system activity.
                </p>
            </div>
        </div>
    );
}

export default AdminHome;
