import React from 'react';

export default function Modal({ isOpen, title, message, onClose, type = 'info' }) {
    if (!isOpen) return null;

    const getButtonColor = () => {
        switch (type) {
            case 'error': return 'btn-danger';
            case 'success': return 'btn-success';
            default: return 'btn-primary';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '30px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                animation: 'slideIn 0.3s ease-out'
            }}>
                {title && <h2 style={{ marginTop: 0, marginBottom: '15px' }}>{title}</h2>}
                <p style={{ color: '#555', marginBottom: '25px', lineHeight: '1.5' }}>{message}</p>
                <button onClick={onClose} className={getButtonColor()} style={{ width: '100%' }}>
                    Close
                </button>
            </div>
            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateY(-20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
