import React, { useState, useEffect } from 'react';
import { adminRequestAPI } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import {
    Check, X, Search, Building2, Eye, ExternalLink
} from 'lucide-react';

const AdminRequestManager = ({ darkMode: dm }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('pending');
    const [selectedRequest, setSelectedRequest] = useState(null);

    useEffect(() => {
        const loadRequests = async () => {
            try {
                const res = await adminRequestAPI.getRequests();
                setRequests(res.data?.results || (Array.isArray(res.data) ? res.data : []));
            } catch (err) {
                console.error('Failed to load requests:', err);
            } finally {
                setLoading(false);
            }
        };
        loadRequests();
    }, []);

    const handleApprove = async (id) => {
        if (!window.confirm('Approve this admin? This will create their account and send login details.')) return;
        setActionLoading(id);
        try {
            const res = await adminRequestAPI.approveRequest(id);
            alert(res.data?.message || 'Admin approved successfully');
            setRequests(requests.map(r => r.id === id ? { ...r, status: 'approved' } : r));
            setSelectedRequest(null);
        } catch (err) {
            console.log("Full error:", err.response?.data);
            alert(err.response?.data?.error || "Approval failed");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Reject this request?')) return;
        setActionLoading(id);
        try {
            await adminRequestAPI.rejectRequest(id);
            setRequests(requests.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
            setSelectedRequest(null);
        } catch (err) {
            alert('Rejection failed.');
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = requests.filter(r =>
        r.status === activeTab &&
        (r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.college_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <AdminLayout darkMode={dm}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: dm ? '#f1f5f9' : '#1e293b', margin: 0, transition: 'color 0.2s' }}>Admin Requests</h1>
                <p style={{ color: dm ? '#94a3b8' : '#64748b', fontSize: 16, marginTop: 4, transition: 'color 0.2s' }}>Manage and verify college administrators.</p>
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: `1px solid ${dm ? '#1e293b' : '#e2e8f0'}` }}>
                {['pending', 'approved', 'rejected'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '12px 24px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '3px solid #2563eb' : '3px solid transparent',
                            color: activeTab === tab ? '#2563eb' : (dm ? '#94a3b8' : '#64748b'),
                            fontWeight: activeTab === tab ? 800 : 600,
                            fontSize: 15,
                            textTransform: 'capitalize',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div style={{ background: dm ? '#0f172a' : '#fff', borderRadius: 24, border: `1px solid ${dm ? '#1e293b' : '#f1f5f9'}`, overflow: 'hidden', boxShadow: dm ? 'none' : '0 4px 20px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>
                <div style={{ padding: '24px', borderBottom: `1px solid ${dm ? '#1e293b' : '#f1f5f9'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text" placeholder="Search applicants..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: 12, border: `1px solid ${dm ? '#1e293b' : '#e2e8f0'}`, outline: 'none', fontSize: 14, background: dm ? '#020617' : '#f8fafc', color: dm ? '#f1f5f9' : '#1e293b' }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner"></div></div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>No {activeTab} requests found.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                <tr>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Applicant</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>College</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((req) => (
                                    <tr key={req.id}
                                        style={{ borderBottom: `1px solid ${dm ? '#1e293b' : '#f1f5f9'}`, transition: 'background 0.2s' }}
                                    >
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontWeight: 700, color: dm ? '#f1f5f9' : '#1e293b' }}>{req.full_name}</div>
                                            <div style={{ fontSize: 12, color: dm ? '#94a3b8' : '#64748b' }}>{req.email}</div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontWeight: 600, color: dm ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Building2 size={14} /> {req.college_name}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => setSelectedRequest(req)}
                                                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: dm ? '#1e293b' : '#f1f5f9', color: '#2563eb', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                <Eye size={16} /> View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL */}
            {selectedRequest && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
                }}>
                        <div style={{
                        background: dm ? '#0f172a' : '#fff', borderRadius: 24, width: '100%', maxWidth: 700,
                        maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: dm ? '1px solid #1e293b' : 'none',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden'
                    }}>
                        {/* Modal Header */}
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${dm ? '#1e293b' : '#f1f5f9'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: dm ? '#1e293b88' : '#f8fafc' }}>
                            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: dm ? '#f1f5f9' : '#1e293b' }}>Verification Details</h2>
                            <button onClick={() => setSelectedRequest(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: dm ? '#94a3b8' : '#64748b', padding: 4 }}><X size={24} /></button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            {/* Section 1 */}
                            <div style={{ background: dm ? '#020617' : '#f8fafc', padding: 20, borderRadius: 16, marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, border: dm ? '1px solid #1e293b' : 'none' }}>
                                <div><p style={{ margin: '0 0 4px', fontSize: 12, color: dm ? '#94a3b8' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Full Name</p><p style={{ margin: 0, fontWeight: 700, color: dm ? '#f1f5f9' : '#1e293b' }}>{selectedRequest.full_name}</p></div>
                                <div><p style={{ margin: '0 0 4px', fontSize: 12, color: dm ? '#94a3b8' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Phone</p><p style={{ margin: 0, fontWeight: 700, color: dm ? '#f1f5f9' : '#1e293b' }}>{selectedRequest.phone_number}</p></div>
                                <div><p style={{ margin: '0 0 4px', fontSize: 12, color: dm ? '#94a3b8' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Email</p><p style={{ margin: 0, fontWeight: 700, color: dm ? '#f1f5f9' : '#1e293b' }}>{selectedRequest.email}</p></div>
                                <div><p style={{ margin: '0 0 4px', fontSize: 12, color: dm ? '#94a3b8' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Designation</p><p style={{ margin: 0, fontWeight: 700, color: dm ? '#f1f5f9' : '#1e293b' }}>{selectedRequest.designation || 'N/A'}</p></div>
                                <div style={{ gridColumn: 'span 2' }}><p style={{ margin: '0 0 4px', fontSize: 12, color: dm ? '#94a3b8' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>College</p><p style={{ margin: 0, fontWeight: 700, color: dm ? '#f1f5f9' : '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}><Building2 size={16} /> {selectedRequest.college_name}</p></div>
                            </div>

                            {/* Section 2 */}
                            <div style={{ marginBottom: 24 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 800, color: dm ? '#f1f5f9' : '#1e293b', borderBottom: `1px solid ${dm ? '#1e293b' : '#e2e8f0'}`, paddingBottom: 8, marginBottom: 16 }}>Reason for Request</h3>
                                <p style={{ margin: 0, color: dm ? '#cbd5e1' : '#475569', lineHeight: 1.6, background: dm ? '#020617' : '#f8fafc', padding: 16, borderRadius: 12, border: dm ? '1px solid #1e293b' : 'none' }}>{selectedRequest.reason}</p>
                            </div>

                            {/* Section 3 Documents */}
                            <div>
                                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 16 }}>Documents</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                                    <a href={selectedRequest.college_id_card} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, textDecoration: 'none', color: '#1e293b', fontWeight: 700, transition: 'all 0.2s' }}>
                                        <span>College ID Card</span>
                                        <ExternalLink size={18} color="#2563eb" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer Actions */}
                        {selectedRequest.status === 'pending' && (
                            <div style={{ padding: '20px 24px', borderTop: `1px solid ${dm ? '#1e293b' : '#f1f5f9'}`, display: 'flex', gap: 16, background: dm ? '#1e293b88' : '#f8fafc' }}>
                                <button
                                    disabled={actionLoading === selectedRequest.id}
                                    onClick={() => handleApprove(selectedRequest.id)}
                                    style={{ flex: 1, padding: '14px', borderRadius: 12, border: 'none', background: '#10b981', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                                >
                                    <Check size={20} /> Approve
                                </button>
                                <button
                                    disabled={actionLoading === selectedRequest.id}
                                    onClick={() => handleReject(selectedRequest.id)}
                                    style={{ flex: 1, padding: '14px', borderRadius: 12, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
                                >
                                    <X size={20} /> Reject
                                </button>
                            </div>
                        )}
                        {selectedRequest.status !== 'pending' && (
                            <div style={{ padding: '20px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', textAlign: 'center' }}>
                                <span style={{ padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 800, background: selectedRequest.status === 'approved' ? '#dcfce7' : '#fee2e2', color: selectedRequest.status === 'approved' ? '#166534' : '#991b1b' }}>
                                    Request is {selectedRequest.status.toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .spinner { width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #2563eb; borderRadius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </AdminLayout>
    );
};

export default AdminRequestManager;
