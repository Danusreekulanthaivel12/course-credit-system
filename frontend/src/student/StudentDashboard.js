import React, { useEffect, useState } from "react";
import { IoCheckmarkCircle, IoInformationCircle, IoBook, IoAlertCircle, IoAddCircle, IoWarning, IoPersonCircle } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/Modal";
import { useToast } from "../components/ui/Toast";

function StudentDashboard() {
    const [student] = useState(JSON.parse(localStorage.getItem("user")) || {});
    const [courses, setCourses] = useState([]);
    const [registeredCourses, setRegisteredCourses] = useState([]);
    const [requests, setRequests] = useState([]);
    const [specializationType, setSpecializationType] = useState('none'); // 'none', 'minor', 'honor'

    // Modal States
    const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
    const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
    const [requestForm, setRequestForm] = useState({ course_name: '', details: '', course_type: '', credits: '' });

    const { addToast } = useToast();
    const navigate = useNavigate();

    // Derived Lists
    const regularCourses = courses.filter(c => c.type === 'Regular' && c.dept_id === student.dept_id);
    const electiveCourses = courses.filter(c => c.type === 'Elective' && c.dept_id === student.dept_id);

    // Filter Specialization based on selection


    // Limits and Totals
    const [creditLimit, setCreditLimit] = useState(25);
    const [usedCredits, setUsedCredits] = useState(0);

    useEffect(() => {
        if (!student.id) return;
        Promise.all([
            fetch(`http://localhost:5000/courses?semester=${student.semester}`).then(r => r.json()),
            fetch(`http://localhost:5000/registrations/${student.id}`).then(r => r.json()),
            fetch(`http://localhost:5000/requests/${student.id}`).then(r => r.json()),
            fetch("http://localhost:5000/semester-limits").then(r => r.json())
        ]).then(([coursesData, regData, requestsData, limitsData]) => {
            setCourses(Array.isArray(coursesData) ? coursesData : []);
            const regs = Array.isArray(regData) ? regData : [];
            setRegisteredCourses(regs);
            setRequests(Array.isArray(requestsData) ? requestsData : []);

            // Set initial specialization selection based on existing registrations
            const hasMinor = regs.some(c => c.type === 'Minor');
            const hasHonor = regs.some(c => c.type === 'Honors');
            if (hasMinor) setSpecializationType('minor');
            else if (hasHonor) setSpecializationType('honor');

            const limitObj = (Array.isArray(limitsData) ? limitsData : []).find(l => l.semester === student.semester);
            if (limitObj) setCreditLimit(limitObj.credit_limit);
        });
    }, [student]);

    // Recalculate Credits - STRICTLY Regular + Elective ONLY
    useEffect(() => {
        const regularSum = regularCourses.reduce((sum, c) => sum + parseInt(c.credits || 0), 0);
        const electiveSum = registeredCourses
            .filter(c => c.type === 'Elective')
            .reduce((sum, c) => sum + parseInt(c.credits || 0), 0);

        // Honor, Minor, Add-on, Exception are EXCLUDED
        setUsedCredits(regularSum + electiveSum);
    }, [registeredCourses, regularCourses]);

    const fetchRegisteredCourses = async () => {
        const res = await fetch(`http://localhost:5000/registrations/${student.id}`);
        const data = await res.json();
        setRegisteredCourses(Array.isArray(data) ? data : []);
    };

    const fetchRequests = async () => {
        const res = await fetch(`http://localhost:5000/requests/${student.id}`);
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
    }

    const handleRegister = async (course) => {
        if (!student.id) return;

        // Credit Check only for Electives
        if (course.type === 'Elective') {
            const courseCredits = parseInt(course.credits);
            // Current usedCredits includes Regular + Registered Electives.
            // Check if adding this elective exceeds the total limit.
            // Note: The limit (e.g. 25) usually covers the semester load (Regular + Elective).
            if (usedCredits + courseCredits > creditLimit) {
                addToast(`Credit limit exceeded! Limit: ${creditLimit}, Current: ${usedCredits}, New: ${usedCredits + courseCredits}`, "error");
                return;
            }
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

    const handleRequestSubmit = async (type) => {
        if (type === 'addon' && !requestForm.course_type) return addToast("Please select a Course Type", "error");
        if (!requestForm.course_name) return addToast("Course name is required", "error");
        if (type === 'addon' && !requestForm.credits) return addToast("Credits are required", "error");

        try {
            const res = await fetch("http://localhost:5000/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    student_id: student.id,
                    course_name: requestForm.course_name,
                    request_type: type, // 'addon' or 'exception'
                    details: {
                        description: requestForm.details,
                        course_type: requestForm.course_type,
                        credits: requestForm.credits
                    }
                })
            });

            if (res.ok) {
                addToast("Request submitted successfully", "success");
                setIsAddonModalOpen(false);
                setIsExceptionModalOpen(false);
                setRequestForm({ course_name: '', details: '', course_type: '', credits: '' });
                fetchRequests();
            } else {
                addToast("Failed to submit request", "error");
            }
        } catch (err) {
            addToast("Network error", "error");
        }
    };
    const toggleSpecialization = (type) => {
        if (specializationType === type) {
            setSpecializationType('none'); // Toggle off
        } else {
            setSpecializationType(type);
        }
    };

    // Filter Specialization based on selection
    const displayedSpecializationCourses = courses.filter(c => {
        // Enforce Department and Semester Match
        if (c.dept_id !== student.dept_id || c.semester !== student.semester) {
            return false;
        }

        if (specializationType === 'minor') return c.type === 'Minor';
        if (specializationType === 'honor') return c.type === 'Honors';
        return false;
    });

    const creditPercentage = Math.min((usedCredits / creditLimit) * 100, 100);

    return (
        <div>
            {/* Top Actions: Add-On Request */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <Button variant="secondary" onClick={() => setIsAddonModalOpen(true)}>
                    <IoAddCircle size={20} /> Ask for Add-On Course
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3">
                {/* Sidebar Stats */}
                <div style={{ gridColumn: 'span 1' }}>
                    <Card style={{ position: 'sticky', top: '100px' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <IoBook /> Credit Status
                        </h3>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <span>Total Credits (Reg + Elec)</span>
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
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                * Honor, Minor, and Add-on courses are not included in credit calculation.
                            </p>
                        </div>

                        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Registered Courses</h4>
                        {registeredCourses.filter(c => c.type === 'Elective').length === 0 ? (
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No elective courses registered yet.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', marginBottom: '1.5rem' }}>
                                {registeredCourses.filter(c => c.type === 'Elective').map(c => (
                                    <li key={c.id} style={{
                                        padding: '0.75rem 0',
                                        borderBottom: '1px solid var(--border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.9rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <IoCheckmarkCircle style={{ color: 'var(--success)', flexShrink: 0, fontSize: '1.2rem' }} />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text)' }}>{c.course_name}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                                                    {c.course_code}
                                                    <span className="badge badge-gray" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>{c.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {(() => {
                            const hasMinor = registeredCourses.some(c => c.type === 'Minor');
                            const hasHonor = registeredCourses.some(c => c.type === 'Honors');
                            const activeSpec = hasMinor ? 'Minor' : (hasHonor ? 'Honors' : null);

                            if (!activeSpec) return null;

                            // 1. Current semester specialization courses
                            const currentSpecCourses = courses.filter(c => c.dept_id === student.dept_id && c.semester === student.semester && c.type === activeSpec);

                            // 2. Previous semester registered specialization courses
                            const prevSpecCourses = registeredCourses.filter(rc => rc.type === activeSpec && parseInt(rc.semester) < parseInt(student.semester));

                            // Combine and filter out those used for exceptions
                            const specCourses = [...currentSpecCourses, ...prevSpecCourses].filter(c => {
                                // Exclude if used for an exception
                                const isExcepted = requests.some(r => r.request_type === 'exception' && r.status === 'approved' && r.details && r.details.description === c.course_name);
                                return !isExcepted;
                            });

                            if (specCourses.length === 0) return null;

                            return (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', textTransform: 'capitalize' }}>
                                        Selected Specialization ({activeSpec === 'Honors' ? 'Honor' : 'Minor'})
                                    </h4>
                                    <ul style={{ listStyle: 'none' }}>
                                        {specCourses.map(c => {
                                            const reg = registeredCourses.find(rc => rc.id === c.id);
                                            let status = 'Pending';
                                            if (reg) {
                                                status = reg.status ? (reg.status.charAt(0).toUpperCase() + reg.status.slice(1)) : 'Registered';
                                                if (status.toLowerCase() === 'approved') status = 'Completed';
                                            } else {
                                                const isExcepted = requests.some(r => r.course_name === c.course_name && r.request_type === 'exception' && r.status === 'approved');
                                                if (isExcepted) status = 'Excepted';
                                            }

                                            return (
                                                <li key={c.id} style={{
                                                    padding: '0.75rem 0',
                                                    borderBottom: '1px solid var(--border)',
                                                    fontSize: '0.9rem',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}>{c.course_code}</div>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{c.course_name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{c.credits} Credits</div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            );
                        })()}

                        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>My Add-On / Requests</h4>
                        {requests.length === 0 ? (
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No active requests.</p>
                        ) : (
                            <ul style={{ listStyle: 'none' }}>
                                {requests.map(r => {
                                    let displayStatus = r.status === 'approved' ? 'Completed' : r.status;

                                    if (r.request_type === 'exception' && r.status === 'approved') {
                                        displayStatus = 'Course Excepted';
                                    } else if (r.request_type === 'addon' && r.status === 'approved') {
                                        const isExcepted = requests.some(req => req.request_type === 'exception' && req.status === 'approved' && req.details && req.details.description === r.course_name);
                                        if (isExcepted) displayStatus = 'EXCEPTED';
                                    }

                                    return (
                                        <li key={r.id} style={{
                                            padding: '0.75rem 0',
                                            borderBottom: '1px solid var(--border)',
                                            fontSize: '0.9rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text)' }}>{r.course_name}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'capitalize', marginTop: '0.2rem' }}>{r.request_type}</div>
                                            </div>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: r.status === 'pending' ? 'var(--accent)' : 'var(--success)' }}>
                                                {displayStatus}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Card>
                </div>

                {/* Main Content */}
                <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ marginBottom: '1rem' }}>Available Courses</h2>

                        {/* Regular (Core) Courses - Always Visible */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Core Courses</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                {regularCourses.map(course => (
                                    <Card key={course.id} style={{ borderLeft: '4px solid var(--primary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div>
                                                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text)' }}>{course.course_name}</h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                    {course.course_code}
                                                    <span className="badge badge-indigo" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>Regular</span>
                                                </div>
                                            </div>
                                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{course.credits} Credits</span>
                                        </div>
                                        <Button variant="secondary" disabled style={{ width: '100%', fontSize: '0.85rem' }}>Pre-Assigned</Button>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Elective Courses - Always Visible */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Electives</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                {electiveCourses.map(course => {
                                    const isRegistered = registeredCourses.some(rc => rc.id === course.id);
                                    return (
                                        <Card key={course.id}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                <div>
                                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text)' }}>{course.course_name}</h4>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                        {course.course_code}
                                                        <span className="badge badge-yellow" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>Elective</span>
                                                    </div>
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{course.credits} Credits</span>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <Button
                                                    variant={isRegistered ? "secondary" : "primary"}
                                                    disabled={isRegistered}
                                                    onClick={() => handleRegister(course)}
                                                    style={{ flex: 1 }}
                                                >
                                                    {isRegistered ? "Registered" : "Register"}
                                                </Button>
                                                {/* Sem 7 Exception Request */}
                                                {parseInt(student.semester) === 7 && !isRegistered && (
                                                    // Check if course is already excepted
                                                    requests.some(r => r.course_name === course.course_name && r.request_type === 'exception' && r.status === 'approved') ? (
                                                        <span style={{ color: 'var(--success)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', padding: '0 0.5rem' }}>Course Excepted</span>
                                                    ) : (
                                                        <Button variant="secondary" onClick={() => {
                                                            setRequestForm({ ...requestForm, course_name: course.course_name });
                                                            setIsExceptionModalOpen(true);
                                                        }} title="Request as Exception">
                                                            <IoWarning />
                                                        </Button>
                                                    )
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Specialization Selection */}
                        {[5, 6, 7].includes(parseInt(student.semester)) && (
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Specialization (Honor / Minor)</h3>

                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <Button
                                        variant={specializationType === 'honor' ? 'primary' : 'secondary'}
                                        onClick={() => toggleSpecialization('honor')}
                                        style={{ flex: 1, padding: '1rem' }}
                                    >
                                        View Honors Courses
                                    </Button>
                                    <Button
                                        variant={specializationType === 'minor' ? 'primary' : 'secondary'}
                                        onClick={() => toggleSpecialization('minor')}
                                        style={{ flex: 1, padding: '1rem' }}
                                    >
                                        View Minors Courses
                                    </Button>
                                </div>

                                {specializationType !== 'none' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 fade-in">
                                        {displayedSpecializationCourses.length === 0 ? (
                                            <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'var(--bg-white)', borderRadius: 'var(--radius)' }}>
                                                No {specializationType} courses available.
                                            </div>
                                        ) : displayedSpecializationCourses.map(course => {
                                            const isRegistered = registeredCourses.some(rc => rc.id === course.id);
                                            const hasMinor = registeredCourses.some(c => c.type === 'Minor');
                                            const hasHonor = registeredCourses.some(c => c.type === 'Honors');
                                            const isMinor = course.type === 'Minor';

                                            let isDisabled = isRegistered;
                                            if (!isRegistered) {
                                                // Mutually Exclusive Logic
                                                if (isMinor && hasHonor) isDisabled = true;
                                                if (!isMinor && hasMinor) isDisabled = true; // Honors disabled if Minor taken
                                                if (isMinor && hasMinor) isDisabled = true;  // Minor disabled if Minor taken (only 1 allowed usually, or logic allows multiple minors?) 
                                                // User ref: "Allow selection of ONLY ONE (Honor OR Minor)" -> Singular.
                                                if (!isMinor && hasHonor) isDisabled = true; // Honors disabled if Honors taken
                                            }

                                            return (
                                                <Card key={course.id}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                        <span className={`badge ${course.type === 'Minor' ? 'badge-blue' : 'badge-green'}`}>{course.type}</span>
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
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add-On Course Modal */}
            <Modal isOpen={isAddonModalOpen} onClose={() => setIsAddonModalOpen(false)} title="Request Add-On Course">
                {/* 1. Course Type (Radio Buttons) */}
                <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                        Course Type <span style={{ color: 'red' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {['NPTEL Exam', 'Internship', 'Add On Course'].map((type) => (
                            <label key={type} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                border: requestForm.course_type === type ? '1px solid var(--primary)' : '1px solid var(--border)',
                                borderRadius: '4px',
                                background: requestForm.course_type === type ? 'var(--bg-main)' : 'white',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="radio"
                                    name="courseType"
                                    value={type}
                                    checked={requestForm.course_type === type}
                                    onChange={(e) => setRequestForm({ ...requestForm, course_type: e.target.value })}
                                    style={{ accentColor: 'var(--primary)' }}
                                />
                                {type}
                            </label>
                        ))}
                    </div>
                </div>

                {/* 2. Course Name */}
                <div className="form-group">
                    <label className="form-label">Course Name <span style={{ color: 'red' }}>*</span></label>
                    <input
                        type="text"
                        value={requestForm.course_name}
                        onChange={(e) => setRequestForm({ ...requestForm, course_name: e.target.value })}
                        placeholder="e.g. Advanced Python"
                    />
                </div>

                {/* 3. Course Credit */}
                <div className="form-group">
                    <label className="form-label">Course Credit <span style={{ color: 'red' }}>*</span></label>
                    <input
                        type="number"
                        value={requestForm.credits}
                        onChange={(e) => setRequestForm({ ...requestForm, credits: e.target.value })}
                        placeholder="e.g. 3"
                        min="1"
                    />
                </div>

                {/* 4. Duration / Details */}
                <div className="form-group">
                    <label className="form-label">Duration / Details</label>
                    <input
                        type="text"
                        value={requestForm.details}
                        onChange={(e) => setRequestForm({ ...requestForm, details: e.target.value })}
                        placeholder="e.g. 4 Weeks"
                    />
                </div>

                <Button variant="primary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => handleRequestSubmit('addon')}>
                    Submit Request
                </Button>
            </Modal>

            {/* Exception Request Modal */}
            <Modal isOpen={isExceptionModalOpen} onClose={() => setIsExceptionModalOpen(false)} title="Request Exception">
                <div className="form-group">
                    <label className="form-label">Course Name (Elective to Replace)</label>
                    <input
                        type="text"
                        value={requestForm.course_name}
                        readOnly
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Select the course to be exempted</label>
                    {(() => {
                        const approvedAddons = requests.filter(r => r.request_type === 'addon' && r.status === 'approved');

                        // Check if an exception already uses this addon
                        // We must find addons that are NOT already mapped by an exception request.
                        const unusedAddons = approvedAddons.filter(addon => {
                            return !requests.some(req =>
                                req.request_type === 'exception' &&
                                req.status === 'approved' &&
                                req.details &&
                                req.details.description === addon.course_name
                            );
                        });

                        // Auto-select the first unused option if details is empty
                        const unusedOptions = [...unusedAddons];

                        // Add eligible previous Honor courses
                        // Rules: course_type = HONOR, completed (registered from previous sem), unused for exception
                        // NEW FIX: If a student has completed AT LEAST ONE Honor course, all previous semester Honor courses from their dept become available.
                        let eligibleHonorCourses = [];
                        const hasCompletedHonor = registeredCourses.some(rc => {
                            if (rc.type !== 'Honors') return false;
                            const st = rc.status ? rc.status.toLowerCase() : 'registered';
                            return st === 'registered' || st === 'approved' || st === 'completed';
                        });

                        if (hasCompletedHonor) {
                            eligibleHonorCourses = courses.filter(c => {
                                if (c.type !== 'Honors') return false;
                                if (c.dept_id !== student.dept_id) return false;
                                if (parseInt(c.semester) >= parseInt(student.semester)) return false;

                                // Check if already used for exception
                                const isUsed = requests.some(req =>
                                    req.request_type === 'exception' &&
                                    req.status === 'approved' &&
                                    req.details &&
                                    req.details.description === c.course_name
                                );
                                return !isUsed;
                            });
                        }

                        unusedOptions.push(...eligibleHonorCourses);

                        if (unusedOptions.length === 0) {
                            return (
                                <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                    Not eligible for exemption (No available Add-On courses found)
                                </div>
                            );
                        }

                        if (!requestForm.details && unusedOptions.length > 0) {
                            setRequestForm(prev => ({ ...prev, details: unusedOptions[0].course_name }));
                        }

                        return (
                            <select
                                className="form-input"
                                value={requestForm.details}
                                onChange={(e) => setRequestForm({ ...requestForm, details: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid var(--border)',
                                    borderRadius: '4px',
                                    outline: 'none',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <option value="" disabled>Select the course to be exempted</option>
                                {unusedOptions.map(opt => (
                                    <option key={opt.id || opt.course_code || opt.course_name} value={opt.course_name}>
                                        {opt.course_name} {opt.type === 'Honors' ? '(Honor)' : '(Add-On)'}
                                    </option>
                                ))}
                            </select>
                        );
                    })()}
                </div>
                <Button
                    variant="primary"
                    style={{ width: '100%' }}
                    disabled={!requestForm.details}
                    onClick={() => handleRequestSubmit('exception')}
                >
                    Submit Exception Request
                </Button>
            </Modal>
        </div>
    );
}

export default StudentDashboard;
