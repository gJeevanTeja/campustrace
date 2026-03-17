import React from 'react';

const ClaimRequestCard = ({ claim, onApprove, onReject, darkMode }) => {
    const dm = darkMode;
    const colors = {
        card: dm ? '#1e293b' : '#ffffff',
        text: dm ? '#e2e8f0' : '#1e293b',
        muted: dm ? '#94a3b8' : '#64748b',
        border: dm ? '#334155' : '#e2e8f0',
        accent: '#3b82f6',
        success: '#10b981',
        danger: '#ef4444',
    };

    const getResultColor = (label) => {
        switch (label) {
            case "PERFECT MATCH": return '#10b981';
            case "GOOD MATCH": return '#3b82f6';
            case "PARTIAL MATCH": return '#f59e0b';
            case "INACCURATE": return '#ef4444';
            default: return colors.muted;
        }
    };

    return (
        <div style={{
            background: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            border: `1px solid ${colors.border}`,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: dm ? '#334155' : '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: colors.accent
                }}>
                    {claim.claimant?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.text }}>
                        {claim.claimant?.name || 'Unknown User'}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: colors.muted }}>
                        Claimed {new Date(claim.created_at).toLocaleDateString()}
                    </p>
                </div>
                {claim.ai_result_label && (
                    <div style={{
                        padding: '4px 10px', borderRadius: 20,
                        background: `${getResultColor(claim.ai_result_label)}15`,
                        color: getResultColor(claim.ai_result_label),
                        fontSize: 11, fontWeight: 800
                    }}>
                        {claim.ai_result_label}
                    </div>
                )}
            </div>

            {claim.status === 'pending' || claim.status === 'awaiting_approval' ? (
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={() => onReject(claim.id)}
                        style={{
                            flex: 1, padding: '10px', borderRadius: 10,
                            border: `1px solid ${colors.danger}`, background: 'none',
                            color: colors.danger, fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        Reject
                    </button>
                    <button
                        onClick={() => onApprove(claim.id)}
                        style={{
                            flex: 2, padding: '10px', borderRadius: 10,
                            border: 'none', background: colors.success,
                            color: '#fff', fontWeight: 700, cursor: 'pointer'
                        }}
                    >
                        Approve Owner
                    </button>
                </div>
            ) : (
                <div style={{
                    textAlign: 'center', padding: '8px', borderRadius: 10,
                    background: dm ? '#0f172a' : '#f8fafc',
                    color: colors.muted, fontSize: 13, fontWeight: 600
                }}>
                    Status: {claim.status?.toUpperCase()}
                </div>
            )}
        </div>
    );
};

export default ClaimRequestCard;
