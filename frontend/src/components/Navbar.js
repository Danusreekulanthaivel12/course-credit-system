import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUniversity, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import Button from './ui/Button';

const Navbar = () => {
    const navigate = useNavigate();
    const role = localStorage.getItem("role");
    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : {};

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            localStorage.clear();
            navigate("/");
        }
    };

    if (!role) return null;

    return (
        <nav style={{
            background: 'white',
            borderBottom: '1px solid var(--border)',
            padding: '1rem 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'var(--shadow-sm)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <FaUniversity size={28} color="var(--primary)" />
                <div>
                    <h1 style={{ fontSize: '1.25rem', margin: 0, lineHeight: 1 }}>Course Credit System</h1>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Course Registration System</span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'right', display: 'none', flexDirection: 'column', '@media(min-width: 640px)': { display: 'flex' } }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name || role.toUpperCase()}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{role}</span>
                    </div>
                    <FaUserCircle size={32} color="var(--text-light)" />
                </div>
                {role !== 'admin' && (
                    <Button variant="secondary" onClick={handleLogout} style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}>
                        <FaSignOutAlt /> Logout
                    </Button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
