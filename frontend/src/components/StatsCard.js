import React from 'react';

const StatsCard = ({ label, value, icon, color = "primary" }) => {
    const colorMap = {
        primary: { bg: 'var(--primary-light)', text: 'var(--primary)' },
        indigo: { bg: 'var(--primary-light)', text: 'var(--primary)' },
        secondary: { bg: 'var(--secondary-light)', text: 'var(--secondary)' },
        green: { bg: '#D1FAE5', text: '#059669' }, // Emerald
        blue: { bg: '#DBEAFE', text: '#1D4ED8' }, // Blue
        amber: { bg: '#FEF3C7', text: '#D97706' }, // Amber
        red: { bg: '#FEE2E2', text: '#DC2626' }, // Red
    };

    const theme = colorMap[color] || colorMap.primary;

    return (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem', transition: 'transform 0.2s', borderLeft: `4px solid ${theme.text}` }}>
            <div
                style={{
                    width: '3.5rem',
                    height: '3.5rem',
                    borderRadius: '50%',
                    backgroundColor: theme.bg,
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                }}
            >
                {icon}
            </div>
            <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.025em', marginBottom: '0.25rem' }}>{label}</p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1 }}>{value}</h3>
            </div>
        </div>
    );
};

export default StatsCard;
