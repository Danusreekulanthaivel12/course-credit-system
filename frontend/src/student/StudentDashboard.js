import React, { useEffect, useState } from "react";
import { IoCheckmarkCircle, IoInformationCircle, IoBook, IoAlertCircle } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";

function StudentDashboard() {
    const [student] = useState(JSON.parse(localStorage.getItem("user")) || {});
    const [courses, setCourses] = useState([]);
    const [registeredCourses, setRegisteredCourses] = useState([]);
    const { addToast } = useToast();
    const navigate = useNavigate();

    // Derived Lists
    const regularCourses = courses.filter(c => c.type === 'Regular');
    const electiveCourses = courses.filter(c => c.type === 'Elective');
    const specializationCourses = courses.filter(c => c.type === 'Minor' || c.type === 'Honors');

    // Limits and Totals
    const [creditLimit, setCreditLimit] = useState(25);
    const [usedCredits, setUsedCredits] = useState(0);

    useEffect(() => {
        if (!student.id) return;
        Promise.all([
            fetch(`http://localhost:5000/courses?dept_id=${student.dept_id}&semester=${student.semester}`).then(r => r.json()),
            fetch(`http://localhost:5000/registrations/${student.id}`).then(r => r.json()),
            fetch("http://localhost:5000/semester-limits").then(r => r.json())
        ]).then(([coursesData, regData, limitsData]) => {
            setCourses(Array.isArray(coursesData) ? coursesData : []);
            setRegisteredCourses(Array.isArray(regData) ? regData : []);
            const limitObj = (Array.isArray(limitsData) ? limitsData : []).find(l => l.semester === student.semester);
            if (limitObj) setCreditLimit(limitObj.credit_limit);
        });
    }, [student]);

    // Calculate total used credits (Regular + Registered Electives)
    useEffect(() => {
        const regularSum = regularCourses.reduce((sum, c) => sum + parseInt(c.credits || 0), 0);
        const electiveSum = registeredCourses
            .filter(c => c.type === 'Elective')
            .reduce((sum, c) => sum + parseInt(c.credits || 0), 0);

        setUsedCredits(regularSum + electiveSum);
    }, [registeredCourses, regularCourses]);

    const fetchRegisteredCourses = async () => {
        const res = await fetch(`http://localhost:5000/registrations/${student.id}`);
        const data = await res.json();
        setRegisteredCourses(Array.isArray(data) ? data : []);
    };

    const handleRegister = async (course) => {
        if (!student.id) {
            addToast("Session expired. Please login again.", "error");
            return;
        }

        const courseCredits = parseInt(course.credits);

        // 1. Credit Limit Check
        // usedCredits already includes Regular + Registered Electives
        if (course.type === 'Elective') {
            if (usedCredits + courseCredits > creditLimit) {
                addToast(`Credit limit exceeded! Limit: ${creditLimit}, Current: ${usedCredits}, New: ${usedCredits + courseCredits}`, "error");
                return;
            }
        }

        if (course.type === 'Minor' || course.type === 'Honors') {
            const hasMinor = registeredCourses.some(c => c.type === 'Minor');
            const hasHonor = registeredCourses.some(c => c.type === 'Honors');
            if (course.type === 'Minor' && hasHonor) return addToast("Cannot take Minor if Honors selected", "error");
            if (course.type === 'Honors' && hasMinor) return addToast("Cannot take Honors if Minor selected", "error");
            if (course.type === 'Minor' && hasMinor) return addToast("Already selected a Minor", "error");
            if (course.type === 'Honors' && hasHonor) return addToast("Already selected an Honors", "error");
        }

        try {
            const res = await fetch("http://localhost:5000/registrations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ student_id: student.id, course_id: course.id }),
            });
            const data = await res.json();

            if (res.status === 201) {
                await fetchRegisteredCourses();
                addToast("Course registered successfully!", "success");
            } else {
                addToast(data.message || "Registration failed", "error");
            }
        } catch (error) {
            addToast("Network error", "error");
        }
    };

    const creditPercentage = Math.min((usedCredits / creditLimit) * 100, 100);

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3">
                {/* Sidebar Stats */}
                <div style={{ gridColumn: 'span 1' }}>
                    <Card style={{ position: 'sticky', top: '100px' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <IoBook /> Credit Status
                        </h3>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <span>Elective Credits</span>
                                <span style={{ fontWeight: 600, color: usedCredits > creditLimit ? 'var(--danger)' : 'var(--primary)' }}>
                                    {usedCredits} / {creditLimit}
                                </span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${creditPercentage}%`,
                                    height: '100%',
                                    background: usedCredits >= creditLimit ? 'var(--danger)' : 'var(--primary)',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                        </div>

                        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Registered Courses</h4>
                        {registeredCourses.length === 0 ? (
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No courses registered yet.</p>
                        ) : (
                            <ul style={{ listStyle: 'none' }}>
                                {registeredCourses.map(c => (
                                    <li key={c.id} style={{
                                        padding: '0.5rem 0',
                                        borderBottom: '1px solid var(--border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.9rem'
                                    }}>
                                        <IoCheckmarkCircle style={{ color: 'var(--success)' }} />
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{c.course_code}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.course_name}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>

                {/* Main Content */}
                <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ marginBottom: '1rem' }}>Available Courses</h2>

                        {/* Regular Courses */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Core Courses</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                {regularCourses.map(course => (
                                    <Card key={course.id} style={{ borderLeft: '4px solid var(--primary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span className="badge badge-indigo">Regular</span>
                                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{course.credits} Credits</span>
                                        </div>
                                        <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{course.course_code}</h4>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{course.course_name}</p>
                                        <Button variant="secondary" disabled style={{ width: '100%', fontSize: '0.8rem' }}>Pre-Assigned</Button>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Elective Courses */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Electives</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                {electiveCourses.map(course => {
                                    const isRegistered = registeredCourses.some(rc => rc.id === course.id);
                                    return (
                                        <Card key={course.id}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span className="badge badge-yellow">Elective</span>
                                                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{course.credits} Credits</span>
                                            </div>
                                            <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{course.course_code}</h4>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{course.course_name}</p>
                                            <Button
                                                variant={isRegistered ? "secondary" : "primary"}
                                                disabled={isRegistered}
                                                onClick={() => handleRegister(course)}
                                                style={{ width: '100%' }}
                                            >
                                                {isRegistered ? "Registered" : "Register"}
                                            </Button>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Specialization Courses */}
                        {[5, 6, 7].includes(parseInt(student.semester)) && (
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Specialization (Minor / Honors)</h3>
                                <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}>
                                    <IoInformationCircle size={24} color="var(--primary)" />
                                    <p style={{ fontSize: '0.9rem', color: 'var(--primary-hover)' }}>
                                        You can select either one Minor OR one Honors course. This choice is mutually exclusive.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2">
                                    {specializationCourses.map(course => {
                                        const isRegistered = registeredCourses.some(rc => rc.id === course.id);
                                        const hasMinor = registeredCourses.some(c => c.type === 'Minor');
                                        const hasHonor = registeredCourses.some(c => c.type === 'Honors');
                                        const isMinor = course.type === 'Minor';

                                        let isDisabled = isRegistered;
                                        if (!isRegistered) {
                                            if (isMinor && hasHonor) isDisabled = true;
                                            if (!isMinor && hasMinor) isDisabled = true;
                                            if (isMinor && hasMinor) isDisabled = true;
                                            if (!isMinor && hasHonor) isDisabled = true;
                                        }

                                        return (
                                            <Card key={course.id}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <span className={`badge ${isMinor ? 'badge-blue' : 'badge-green'}`}>{course.type}</span>
                                                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{course.credits} Credits</span>
                                                </div>
                                                <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{course.course_code}</h4>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{course.course_name}</p>
                                                <Button
                                                    variant={isRegistered ? "secondary" : "primary"}
                                                    disabled={isDisabled}
                                                    onClick={() => handleRegister(course)}
                                                    style={{ width: '100%' }}
                                                >
                                                    {isRegistered ? "Registered" : (isDisabled ? "Unavailable" : "Select")}
                                                </Button>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;
