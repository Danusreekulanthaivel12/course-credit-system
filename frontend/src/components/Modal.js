import React from 'react';
import { IoClose } from 'react-icons/io5';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-secondary)' }}>
                        <IoClose />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default Modal;
