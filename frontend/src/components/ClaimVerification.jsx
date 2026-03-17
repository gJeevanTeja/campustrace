import React, { useState } from 'react';

const ClaimVerification = ({ onVerify, loading, darkMode }) => {
    const [code, setCode] = useState('');
    const dm = darkMode;
    
    const colors = {
        card: dm ? '#1e293b' : '#ffffff',
        text: dm ? '#e2e8f0' : '#1e293b',
        muted: dm ? '#94a3b8' : '#64748b',
        border: dm ? '#334155' : '#e2e8f0',
        accent: '#3b82f6',
        success: '#10b981',
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (code.length === 6) {
            onVerify(code);
        }
    };

    return (
        <div style={{
            background: colors.card,
            borderRadius: 20,
            padding: 24,
            border: `2px solid ${colors.success}`,
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.1)',
            textAlign: 'center'
        }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🔑</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: colors.text }}>Enter Claim Code</h3>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: colors.muted }}>
                The owner has approved your claim! Please enter the 6-digit code to confirm you have received the item.
            </p>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    maxLength="6"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: 12,
                        border: `2px solid ${code.length === 6 ? colors.success : colors.border}`,
                        background: dm ? '#0f172a' : '#f8fafc',
                        color: colors.text,
                        fontSize: 24,
                        fontWeight: 800,
                        textAlign: 'center',
                        letterSpacing: '8px',
                        outline: 'none',
                        marginBottom: 20
                    }}
                />
                
                <button
                    type="submit"
                    disabled={code.length !== 6 || loading}
                    style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: 14,
                        border: 'none',
                        background: colors.success,
                        color: '#fff',
                        fontSize: 16,
                        fontWeight: 700,
                        cursor: code.length === 6 ? 'pointer' : 'not-allowed',
                        opacity: code.length === 6 ? 1 : 0.6,
                        transition: 'all 0.2s'
                    }}
                >
                    {loading ? 'Verifying...' : 'Confirm Receipt'}
                </button>
            </form>
        </div>
    );
};

export default ClaimVerification;
