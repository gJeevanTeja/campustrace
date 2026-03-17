import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import {
    Grid, Plus, Edit2, Trash2,
    CheckCircle, XCircle, Type,
    Save, X, Hash
} from 'lucide-react';

const CategoryManager = ({ darkMode }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '', emoji: '', priority: 0, active: true
    });
    const dm = darkMode;

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data } = await adminAPI.getCategories();
            setCategories(data.results || data || []);
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
                    Authorization: `Bearer ${token}`
                }
            };

            if (editingCategory) {
                const { data } = await adminAPI.updateCategory(editingCategory.id, formData, config);
                if (data.success) {
                    // Success!
                }
            } else {
                const { data } = await adminAPI.createCategory(formData, config);
                if (data.success) {
                    // Success!
                }
            }

            setShowModal(false);
            setEditingCategory(null);
            setFormData({ name: '', emoji: '', priority: 0, active: true });
            fetchCategories();
        } catch (err) {
            console.error('Category save error:', err);
            alert('Failed to save category.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;
        try {
            await adminAPI.deleteCategory(id);
            fetchCategories();
        } catch (err) {
            alert('Failed to delete category.');
        }
    };

    const bg = dm ? '#1e293b' : '#fff';
    const border = dm ? '#334155' : '#e2e8f0';
    const text = dm ? '#f1f5f9' : '#1e293b';

    return (
        <AdminLayout darkMode={dm}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                <button
                    onClick={() => { setEditingCategory(null); setFormData({ name: '', emoji: '', priority: 0, active: true }); setShowModal(true); }}
                    style={{
                        padding: '12px 20px', borderRadius: 12, background: '#2563eb', color: '#fff',
                        border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                    }}
                >
                    <Plus size={20} /> Add Category
                </button>
            </div>

            <div style={{
                background: bg, borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${border}`, background: dm ? '#33415544' : '#f8fafc' }}>
                            <th style={{ padding: '16px', fontSize: 13, color: dm ? '#94a3b8' : '#64748b' }}>Category Name</th>
                            <th style={{ padding: '16px', fontSize: 13, color: dm ? '#94a3b8' : '#64748b' }}>Icon</th>
                            <th style={{ padding: '16px', fontSize: 13, color: dm ? '#94a3b8' : '#64748b' }}>Priority</th>
                            <th style={{ padding: '16px', fontSize: 13, color: dm ? '#94a3b8' : '#64748b' }}>Status</th>
                            <th style={{ padding: '16px', fontSize: 13, color: dm ? '#94a3b8' : '#64748b' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: 40, textAlign: 'center' }}>Loading categories...</td></tr>
                        ) : categories.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: 40, textAlign: 'center' }}>No categories defined yet.</td></tr>
                        ) : categories.map(c => (
                            <tr key={c.id} style={{ borderBottom: `1px solid ${border}` }}>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 10, background: '#2563eb11',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                                        }}>
                                            {c.emoji || '📦'}
                                        </div>
                                        <p style={{ margin: 0, fontWeight: 700 }}>{c.name}</p>
                                    </div>
                                </td>
                                <td style={{ padding: '16px', fontSize: 14 }}>{c.emoji}</td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        padding: '2px 8px', borderRadius: 6, background: dm ? '#334155' : '#f1f5f9',
                                        fontSize: 12, fontWeight: 700
                                    }}>
                                        Order: {c.priority}
                                    </span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    {c.active ? (
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
                                            onClick={() => { setEditingCategory(c); setFormData(c); setShowModal(true); }}
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
                        background: bg, width: '100%', maxWidth: 400, borderRadius: 20,
                        padding: 32, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: dm ? '#94a3b8' : '#64748b' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: dm ? '#94a3b8' : '#64748b' }}>Category Name</label>
                                <div style={{ position: 'relative' }}>
                                    <Type size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: dm ? '#94a3b8' : '#64748b' }} />
                                    <input
                                        type="text" required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 10, border: `1px solid ${border}`, background: dm ? '#0f172a' : '#f8fafc', color: text }}
                                        placeholder="e.g. Electronics"
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: dm ? '#94a3b8' : '#64748b' }}>Icon Emoji</label>
                                <div style={{ position: 'relative' }}>
                                    <Grid size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: dm ? '#94a3b8' : '#64748b' }} />
                                    <input
                                        type="text" required
                                        value={formData.emoji}
                                        onChange={e => setFormData({ ...formData, emoji: e.target.value })}
                                        style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 10, border: `1px solid ${border}`, background: dm ? '#0f172a' : '#f8fafc', color: text }}
                                        placeholder="e.g. 📱"
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: dm ? '#94a3b8' : '#64748b' }}>Sort Priority</label>
                                <div style={{ position: 'relative' }}>
                                    <Hash size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: dm ? '#94a3b8' : '#64748b' }} />
                                    <input
                                        type="number" required
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                                        style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 10, border: `1px solid ${border}`, background: dm ? '#0f172a' : '#f8fafc', color: text }}
                                        placeholder="Lower = Faster"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                <input
                                    type="checkbox" id="active"
                                    checked={formData.active}
                                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                />
                                <label htmlFor="active" style={{ fontSize: 14, fontWeight: 600 }}>This category is active</label>
                            </div>

                            <button type="submit" style={{
                                width: '100%', padding: '14px', borderRadius: 12, background: '#2563eb', color: '#fff',
                                border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer'
                            }}>
                                <Save size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                                {editingCategory ? 'Update Category' : 'Create Category'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default CategoryManager;
