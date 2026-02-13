import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 3000);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div style={{
                position: 'fixed',
                bottom: '2rem',
                right: '2rem',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
            }}>
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type} slide-up`} style={{
                        padding: '1rem 1.5rem',
                        borderRadius: 'var(--radius)',
                        background: 'white',
                        boxShadow: 'var(--shadow-lg)',
                        borderLeft: `4px solid ${toast.type === 'success' ? 'var(--success)' :
                                toast.type === 'error' ? 'var(--danger)' :
                                    toast.type === 'warning' ? 'var(--accent)' : 'var(--primary)'
                            }`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        minWidth: '300px'
                    }}>
                        <span style={{ fontWeight: 500 }}>{toast.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
