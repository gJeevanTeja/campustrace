import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import {
    Building, Plus, Edit2, Trash2,
    CheckCircle, XCircle,
    Image as ImageIcon, Save, X, Mail
} from 'lucide-react';

const CollegeManager = ({ darkMode }) => {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCollege, setEditingCollege] = useState(null);
    const [formData, setFormData] = useState({
        name: '', email_domain: '', is_active: true
    });
    const [logoFile, setLogoFile] = useState(null);
    const dm = darkMode;

    useEffect(() => {
        fetchColleges();
    }, []);

    const fetchColleges = async () => {
        try {
            setLoading(true);
            const { data } = await adminAPI.getColleges();
            setColleges(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('email_domain', formData.email_domain);
            data.append('is_active', formData.is_active);
            if (logoFile) data.append('logo', logoFile);

            if (editingCollege) {
                await adminAPI.updateCollege(editingCollege.id, data);
            } else {
                await adminAPI.createCollege(data);
            }

            setShowModal(false);
            setEditingCollege(null);
            setFormData({ name: '', email_domain: '', is_active: true });
            setLogoFile(null);
            fetchColleges();
        } catch (err) {
            alert('Failed to save college.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Warning: Deleting a college will affect all linked users and items. Continue?')) return;
        try {
            await adminAPI.deleteCollege(id);
            fetchColleges();
        } catch (err) {
            alert('Failed to delete college.');
        }
    };

    const bg = dm ? '#1e293b' : '#fff';
    const border = dm ? '#334155' : '#e2e8f0';
    const text = dm ? '#f1f5f9' : '#1e293b';

    return (
        <AdminLayout darkMode={dm}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                <button
                    onClick={() => { setEditingCollege(null); setFormData({ name: '', email_domain: '', is_active: true }); setShowModal(true); }}
                    style={{
                        padding: '12px 20px', borderRadius: 12, background: '#2563eb', color: '#fff',
                        border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer'
                    }}
                >
                    <Plus size={20} /> Register College
                </button>
            </div>

            <div style={{
                background: bg, borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${border}`, background: dm ? '#33415544' : '#f8fafc' }}>
                            <th style={{ padding: '16px', fontSize: 13, color: dm ? '#94a3b8' : '#64748b' }}>College / University</th>
                            <th style={{ padding: '16px', fontSize: 13, color: dm ? '#94a3b8' : '#64748b' }}>Email Domain</th>
                            <th style={{ padding: '16px', fontSize: 13, color: dm ? '#94a3b8' : '#64748b' }}>Status</th>
                            <th style={{ padding: '16px', fontSize: 13, color: dm ? '#94a3b8' : '#64748b' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: 40, textAlign: 'center' }}>Loading colleges...</td></tr>
                        ) : colleges.length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: 40, textAlign: 'center' }}>No colleges registered.</td></tr>
                        ) : colleges.map(c => (
                            <tr key={c.id} style={{ borderBottom: `1px solid ${border}` }}>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 10, background: '#f1f5f9',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                                        }}>
                                            {c.logo ? <img src={c.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Building size={24} color="#64748b" />}
                                        </div>
                                        <p style={{ margin: 0, fontWeight: 700 }}>{c.name}</p>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: 8, background: dm ? '#334155' : '#f1f5f9',
                                        fontSize: 13, fontWeight: 600, color: '#2563eb'
                                    }}>
                                        @{c.email_domain}
                                    </span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    {c.is_active ? (
                                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 13 }}>
                                            <CheckCircle size={16} /> Active
                                        </span>
                                    ) : (
                                        <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 13 }}>
                                            <XCircle size={16} /> Deactivated
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button
                                            onClick={() => { setEditingCollege(c); setFormData(c); setShowModal(true); }}
                                            style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', padding: 4 }}
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(c.id)}
                                            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 100, backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: bg, width: '100%', maxWidth: 460, borderRadius: 20,
                        padding: 32, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{editingCollege ? 'Edit College' : 'Register College'}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: dm ? '#94a3b8' : '#64748b' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: dm ? '#94a3b8' : '#64748b' }}>College Name</label>
                                <div style={{ position: 'relative' }}>
                                    <Building size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: dm ? '#94a3b8' : '#64748b' }} />
                                    <input
                                        type="text" required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 10, border: `1px solid ${border}`, background: dm ? '#0f172a' : '#f8fafc', color: text }}
                                        placeholder="e.g. Stanford University"
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: dm ? '#94a3b8' : '#64748b' }}>Email Domain (without @)</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: dm ? '#94a3b8' : '#64748b' }} />
                                    <input
                                        type="text" required
                                        value={formData.email_domain}
                                        onChange={e => setFormData({ ...formData, email_domain: e.target.value })}
                                        style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 10, border: `1px solid ${border}`, background: dm ? '#0f172a' : '#f8fafc', color: text }}
                                        placeholder="e.g. stanford.edu"
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: dm ? '#94a3b8' : '#64748b' }}>College Logo (Optional)</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="file" accept="image/*"
                                        onChange={e => setLogoFile(e.target.files[0])}
                                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                    />
                                    <div style={{
                                        padding: '12px', borderRadius: 10, border: `2px dashed ${border}`,
                                        textAlign: 'center', color: dm ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                    }}>
                                        <ImageIcon size={20} />
                                        {logoFile ? logoFile.name : 'Upload logo'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                <input
                                    type="checkbox" id="is_active"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="is_active" style={{ fontSize: 14, fontWeight: 600 }}>Active - Users can login from this college</label>
                            </div>

                            <button type="submit" style={{
                                width: '100%', padding: '14px', borderRadius: 12, background: '#2563eb', color: '#fff',
                                border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer'
                            }}>
                                <Save size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                                {editingCollege ? 'Update College' : 'Register College'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default CollegeManager;
