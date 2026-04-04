import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import {
    MapPin, Plus, Edit2, Trash2,
    CheckCircle, XCircle, Image as ImageIcon,
    Save, X
} from 'lucide-react';

const BlockManager = ({ darkMode }) => {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBlock, setEditingBlock] = useState(null);
    const [formData, setFormData] = useState({
        name: '', latitude: '', longitude: '', is_active: true
    });
    const [imageFile, setImageFile] = useState(null);
    const dm = darkMode;

    useEffect(() => {
        fetchBlocks();
    }, []);

    const fetchBlocks = async () => {
        try {
            setLoading(true);
            const { data } = await adminAPI.getBlocks();
            setBlocks(data.results || data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('access_token');
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };

            const data = new FormData();
            data.append('name', formData.name);
            data.append('latitude', formData.latitude);
            data.append('longitude', formData.longitude);
            // Use aliases 'photo' and 'active' as requested
            data.append('active', formData.is_active);
            if (imageFile) data.append('photo', imageFile);

            if (editingBlock) {
                await adminAPI.updateBlock(editingBlock.id, data, config);
            } else {
                await adminAPI.createBlock(data, config);
            }

            setShowModal(false);
            setEditingBlock(null);
            setFormData({ name: '', latitude: '', longitude: '', is_active: true });
            setImageFile(null);
            fetchBlocks();
        } catch (err) {
            console.error('Block save error:', err);
            alert('Failed to save block.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this block?')) return;
        try {
            await adminAPI.deleteBlock(id);
            fetchBlocks();
        } catch (err) {
            alert('Failed to delete block.');
        }
    };

    const bg = dm ? '#0f172a' : '#fff';
    const border = dm ? '#1e293b' : '#e2e8f0';
    const text = dm ? '#f1f5f9' : '#1e293b';

    return (
        <AdminLayout darkMode={dm}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                <button
                    onClick={() => { setEditingBlock(null); setFormData({ name: '', latitude: '', longitude: '', is_active: true }); setShowModal(true); }}
                    style={{
                        padding: '12px 20px', borderRadius: 12, background: '#2563eb', color: '#fff',
                        border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                    }}
                >
                    <Plus size={20} /> Add New Block
                </button>
            </div>

            <div style={{
                background: bg, borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${border}`, background: dm ? '#1e293b88' : '#f8fafc' }}>
                            <th style={{ padding: '16px', fontSize: 13, color: dm ? '#94a3b8' : '#64748b' }}>Location Block</th>
                            <th style={{ padding: '16px', fontSize: 13, color: dm ? '#94a3b8' : '#64748b' }}>Coordinates</th>
                            <th style={{ padding: '16px', fontSize: 13, color: dm ? '#94a3b8' : '#64748b' }}>Status</th>
                            <th style={{ padding: '16px', fontSize: 13, color: dm ? '#94a3b8' : '#64748b' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: 40, textAlign: 'center' }}>Loading blocks...</td></tr>
                        ) : blocks.length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: 40, textAlign: 'center' }}>No blocks defined yet.</td></tr>
                        ) : blocks.map(b => (
                            <tr key={b.id} style={{ borderBottom: `1px solid ${border}` }}>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 48, height: 48, borderRadius: 10, background: dm ? '#020617' : '#f1f5f9',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                            border: dm ? `1px solid ${border}` : 'none'
                                        }}>
                                            {b.image ? <img src={b.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <MapPin size={24} color="#64748b" />}
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 700 }}>{b.name}</p>
                                            <p style={{ margin: 0, fontSize: 12, color: dm ? '#94a3b8' : '#64748b' }}>{b.college_name}</p>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <p style={{ margin: 0, fontSize: 13, fontFamily: 'monospace' }}>Lat: {b.latitude?.toFixed(4) || '0.0000'}</p>
                                    <p style={{ margin: 0, fontSize: 13, fontFamily: 'monospace' }}>Lng: {b.longitude?.toFixed(4) || '0.0000'}</p>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    {b.is_active ? (
                                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 13 }}>
                                            <CheckCircle size={16} /> Active
                                        </span>
                                    ) : (
                                        <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 13 }}>
                                            <XCircle size={16} /> Inactive
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button
                                            onClick={() => { setEditingBlock(b); setFormData(b); setShowModal(true); }}
                                            style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', padding: 4 }}
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(b.id)}
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
                        background: bg, width: '100%', maxWidth: 480, borderRadius: 20,
                        padding: 32, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{editingBlock ? 'Edit Block' : 'Add New Block'}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: dm ? '#94a3b8' : '#64748b' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: dm ? '#94a3b8' : '#64748b' }}>Block Name</label>
                                <input
                                    type="text" required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: 10, border: `1px solid ${border}`, background: dm ? '#0f172a' : '#f8fafc', color: text }}
                                    placeholder="e.g. Main Canteen"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: dm ? '#94a3b8' : '#64748b' }}>Latitude</label>
                                    <input
                                        type="number" step="any" required
                                        value={formData.latitude}
                                        onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: 10, border: `1px solid ${border}`, background: dm ? '#020617' : '#f8fafc', color: text, outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: dm ? '#94a3b8' : '#64748b' }}>Longitude</label>
                                    <input
                                        type="number" step="any" required
                                        value={formData.longitude}
                                        onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: 10, border: `1px solid ${border}`, background: dm ? '#020617' : '#f8fafc', color: text, outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: dm ? '#94a3b8' : '#64748b' }}>Block Photo (Optional)</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="file" accept="image/*"
                                        onChange={e => setImageFile(e.target.files[0])}
                                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                    />
                                    <div style={{
                                        padding: '12px', borderRadius: 10, border: `2px dashed ${border}`,
                                        textAlign: 'center', color: dm ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                    }}>
                                        <ImageIcon size={20} />
                                        {imageFile ? imageFile.name : 'Click to upload image'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                <input
                                    type="checkbox" id="is_active"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="is_active" style={{ fontSize: 14, fontWeight: 600 }}>This block is active and visible</label>
                            </div>

                            <button type="submit" style={{
                                width: '100%', padding: '14px', borderRadius: 12, background: '#2563eb', color: '#fff',
                                border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer'
                            }}>
                                <Save size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                                {editingBlock ? 'Update Block' : 'Create Block'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default BlockManager;
