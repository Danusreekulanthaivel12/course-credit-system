import React from 'react';
import Modal from './Modal';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, message }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm Action">
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>{message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button className="btn btn-danger" onClick={() => { onConfirm(); onClose(); }}>Confirm</button>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
