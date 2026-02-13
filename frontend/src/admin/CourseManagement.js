import React, { useEffect, useState } from "react";
import { IoAdd, IoTrash, IoPencil, IoSettings } from "react-icons/io5";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/ui/Toast";

function CourseManagement() {
    const [departments, setDepartments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedDept, setSelectedDept] = useState("");
    const [selectedSem, setSelectedSem] = useState(1);
    const [currentLimit, setCurrentLimit] = useState(25);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentCourseId, setCurrentCourseId] = useState(null);

    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [newLimit, setNewLimit] = useState(25);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState(null);
    const [loading, setLoading] = useState(false);

    const { addToast } = useToast();

    const [courseData, setCourseData] = useState({
        course_code: "",
        course_name: "",
        credits: 3,
        type: "Regular"
    });

    useEffect(() => {
        fetch("http://localhost:5000/departments")
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            })
            .then(data => {
                const depts = Array.isArray(data) ? data : [];
                setDepartments(depts);
                if (depts.length > 0) setSelectedDept(depts[0].id);
            })
            .catch(err => {
                console.error("Dept fetch error", err);
                setDepartments([]);
            });
    }, []);

    const fetchCoursesAndLimit = () => {
        if (!selectedDept || !selectedSem) return;
        setLoading(true);

        const fetchCourses = fetch(`http://localhost:5000/courses?dept_id=${selectedDept}&semester=${selectedSem}`)
            .then(r => { if (!r.ok) throw new Error("Courses fetch failed"); return r.json(); });

        const fetchLimits = fetch("http://localhost:5000/semester-limits")
            .then(r => { if (!r.ok) throw new Error("Limits fetch failed"); return r.json(); });

        Promise.all([fetchCourses, fetchLimits])
            .then(([coursesData, limitsData]) => {
                setCourses(Array.isArray(coursesData) ? coursesData : []);

                const limits = Array.isArray(limitsData) ? limitsData : [];
                const limitObj = limits.find(l => l.semester === parseInt(selectedSem));
                setCurrentLimit(limitObj ? limitObj.credit_limit : 25);
            })
            .catch(err => {
                console.error("Fetch Error:", err);
                addToast("Failed to fetch data", "error");
                setCourses([]);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchCoursesAndLimit();
    }, [selectedDept, selectedSem]);

    const openAddModal = () => {
        setCourseData({ course_code: "", course_name: "", credits: 3, type: "Regular" });
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const openEditModal = (course) => {
        setCourseData({
            course_code: course.course_code,
            course_name: course.course_name,
            credits: course.credits,
            type: course.type
        });
        setCurrentCourseId(course.id);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const url = isEditMode
            ? `http://localhost:5000/courses/${currentCourseId}`
            : "http://localhost:5000/courses";

        const method = isEditMode ? "PUT" : "POST";
        const body = isEditMode
            ? JSON.stringify({ ...courseData })
            : JSON.stringify({ ...courseData, dept_id: selectedDept, semester: selectedSem });

        try {
            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: body,
            });

            const data = await response.json();
            if (response.ok) {
                setIsModalOpen(false);
                fetchCoursesAndLimit();
                addToast(`Course ${isEditMode ? "updated" : "added"} successfully`, "success");
            } else {
                addToast(data.message || "Operation failed", "error");
            }
        } catch (error) {
            addToast("Network error", "error");
        }
    };

    const handleUpdateLimit = async (e) => {
        e.preventDefault();
        try {
            await fetch(`http://localhost:5000/semester-limits/${selectedSem}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credit_limit: newLimit })
            });
            setIsLimitModalOpen(false);
            fetchCoursesAndLimit();
            addToast("Credit limit updated", "success");
        } catch (error) {
            addToast("Failed to update limit", "error");
        }
    };

    const confirmDelete = (id) => {
        setCourseToDelete(id);
        setIsDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!courseToDelete) return;
        try {
            const res = await fetch(`http://localhost:5000/courses/${courseToDelete}`, { method: "DELETE" });
            const data = await res.json();

            if (res.ok) {
                fetchCoursesAndLimit();
                addToast("Course deleted", "success");
            } else {
                addToast(data.message, "error");
            }
        } catch (error) {
            addToast("Failed to delete course", "error");
        }
        setIsDeleteOpen(false);
    };

    const totalCredits = (Array.isArray(courses) ? courses : [])
        .filter(c => c.type === 'Regular')
        .reduce((sum, c) => sum + parseInt(c.credits), 0);
    const safeCourses = Array.isArray(courses) ? courses : [];
    const regularCourses = safeCourses.filter(c => c.type === 'Regular');
    const electiveCourses = safeCourses.filter(c => c.type === 'Elective');
    const minorCourses = safeCourses.filter(c => c.type === 'Minor');
    const honorsCourses = safeCourses.filter(c => c.type === 'Honors');
    const showElectives = selectedSem >= 5;

    const CourseTable = ({ data, title }) => (
        <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h4>
            <div className="table-container shadow-sm">
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th style={{ width: '15%' }}>Code</th>
                            <th>Name</th>
                            <th style={{ width: '10%', textAlign: 'center' }}>Credits</th>
                            <th style={{ width: '10%', textAlign: 'center' }}>Students</th>
                            <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No courses available.</td></tr>
                        ) : (
                            data.map(c => (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{c.course_code}</td>
                                    <td>{c.course_name}</td>
                                    <td style={{ textAlign: 'center' }}><span className="badge badge-gray">{c.credits}</span></td>
                                    <td style={{ textAlign: 'center' }}><span className="badge badge-blue">{c.student_count || 0}</span></td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-secondary" style={{ padding: '0.4rem', marginRight: '0.5rem' }} onClick={() => openEditModal(c)} title="Edit">
                                            <IoPencil />
                                        </button>
                                        <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => confirmDelete(c.id)} title="Delete">
                                            <IoTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Courses</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <select
                        value={selectedDept}
                        onChange={e => setSelectedDept(e.target.value)}
                        style={{ width: '250px' }}
                    >
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <button className="btn btn-primary" onClick={openAddModal} disabled={!selectedDept}>
                        <IoAdd style={{ fontSize: '1.2rem' }} /> Add Course
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
                {[...Array(8)].map((_, i) => {
                    const sem = i + 1;
                    const isActive = selectedSem === sem;
                    return (
                        <button
                            key={sem}
                            onClick={() => setSelectedSem(sem)}
                            style={{
                                padding: '0.6rem 1.5rem',
                                borderRadius: '2rem',
                                border: isActive ? 'none' : '1px solid var(--border)',
                                backgroundColor: isActive ? 'var(--primary)' : 'white',
                                color: isActive ? 'white' : 'var(--text-secondary)',
                                fontWeight: isActive ? 600 : 500,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                boxShadow: isActive ? '0 4px 6px -1px rgba(67, 56, 202, 0.4)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            Semester {sem}
                        </button>
                    )
                })}
            </div>

            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem',
                background: 'linear-gradient(to right, #EEF2FF, #ffffff)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #C7D2FE'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                    <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.1rem' }}>Sem {selectedSem} Overview</h4>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <span style={{ fontSize: '0.9rem' }}>Total Offered: <strong>{totalCredits} Credits</strong></span>
                        <span style={{ fontSize: '0.9rem' }}>Max Limit: <strong style={{ color: 'var(--secondary)' }}>{currentLimit} Credits</strong></span>
                    </div>
                </div>
                <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem' }}
                    onClick={() => { setNewLimit(currentLimit); setIsLimitModalOpen(true); }}
                >
                    <IoSettings /> Edit Limit
                </button>
            </div>

            {loading ? <p style={{ textAlign: 'center', padding: '2rem' }}>Loading courses...</p> : (
                <div className="fade-in">
                    {showElectives ? (
                        <>
                            <CourseTable data={regularCourses} title="Regular Courses" />
                            <CourseTable data={electiveCourses} title="Elective Courses" />
                            <CourseTable data={minorCourses} title="Minor Courses Available" />
                            <CourseTable data={honorsCourses} title="Honors Courses Available" />
                        </>
                    ) : (
                        <CourseTable data={courses} title="Regular Courses" />
                    )}
                </div>
            )}

            {/* Add/Edit Course Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Course" : `Add Course (Sem ${selectedSem})`}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Course Code</label>
                        <input
                            placeholder="e.g. CS101"
                            value={courseData.course_code}
                            onChange={e => setCourseData({ ...courseData, course_code: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Course Name</label>
                        <input
                            placeholder="e.g. Data Structures"
                            value={courseData.course_name}
                            onChange={e => setCourseData({ ...courseData, course_name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Credits</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={courseData.credits}
                            onChange={e => setCourseData({ ...courseData, credits: e.target.value })}
                            required
                        />
                    </div>
                    {showElectives && (
                        <div className="form-group">
                            <label className="form-label">Course Type</label>
                            <select value={courseData.type} onChange={e => setCourseData({ ...courseData, type: e.target.value })}>
                                <option value="Regular">Regular</option>
                                <option value="Elective">Elective</option>
                                <option value="Minor">Minor</option>
                                <option value="Honors">Honors</option>
                            </select>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{isEditMode ? "Update Course" : "Add Course"}</button>
                    </div>
                </form>
            </Modal>

            {/* Edit Limit Modal */}
            <Modal isOpen={isLimitModalOpen} onClose={() => setIsLimitModalOpen(false)} title={`Edit Credit Limit (Sem ${selectedSem})`}>
                <form onSubmit={handleUpdateLimit}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        Set the maximum number of credits a student can register for in this semester.
                    </p>
                    <div className="form-group">
                        <label className="form-label">Max Credits</label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={newLimit}
                            onChange={e => setNewLimit(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsLimitModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Update Limit</button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                message="Are you sure you want to delete this course?"
            />
        </div>
    );
}

export default CourseManagement;
