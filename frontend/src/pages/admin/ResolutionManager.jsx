import React, { useState, useEffect } from 'react';
import { itemsAPI } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import { 
    CheckCircle, Package, MapPin, 
    Calendar, Search 
} from 'lucide-react';

const ResolutionManager = ({ darkMode }) => {
    const [resolutions, setResolutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const dm = darkMode;

    useEffect(() => {
        fetchResolutions();
    }, []);

    const fetchResolutions = async () => {
        try {
            setLoading(true);
            // Fetch items that are resolved/returned
            const { data } = await itemsAPI.getAll({ status: 'returned' });
            setResolutions(data.results || data || []);
        } catch (err) {
            console.error('Failed to fetch resolutions:', err);
        } finally {
            setLoading(false);
        }
    };

    const bg = dm ? '#0f172a' : '#fff';
    const border = dm ? '#1e293b' : '#e2e8f0';
    const text = dm ? '#f1f5f9' : '#1e293b';

    const filteredResolutions = resolutions.filter(r => 
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.location_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout darkMode={dm}>
            <div style={{ marginBottom: 32 }}>
                <h2 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 900 }}>Resolutions</h2>
                <p style={{ margin: 0, color: dm ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                    History of items successfully returned to their owners.
                </p>
            </div>

            <div style={{ 
                display: 'flex', gap: 16, marginBottom: 24,
                background: bg, padding: 16, borderRadius: 16, border: `1px solid ${border}`
            }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                        type="text"
                        placeholder="Search by title or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '12px 12px 12px 40px', borderRadius: 12,
                            border: `1px solid ${border}`, background: dm ? '#020617' : '#f8fafc',
                            color: text, outline: 'none'
                        }}
                    />
                </div>
            </div>

            <div style={{
                background: bg, borderRadius: 20, border: `1px solid ${border}`, overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: dm ? '#1e293b88' : '#f8fafc', borderBottom: `1px solid ${border}` }}>
                            <th style={{ padding: '20px 24px', fontSize: 13, fontWeight: 800, color: dm ? '#94a3b8' : '#64748b', textTransform: 'uppercase' }}>Item</th>
                            <th style={{ padding: '20px 24px', fontSize: 13, fontWeight: 800, color: dm ? '#94a3b8' : '#64748b', textTransform: 'uppercase' }}>Location</th>
                            <th style={{ padding: '20px 24px', fontSize: 13, fontWeight: 800, color: dm ? '#94a3b8' : '#64748b', textTransform: 'uppercase' }}>Date Resolved</th>
                            <th style={{ padding: '20px 24px', fontSize: 13, fontWeight: 800, color: dm ? '#94a3b8' : '#64748b', textTransform: 'uppercase' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>Loading resolutions...</td></tr>
                        ) : filteredResolutions.length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>No resolved items found.</td></tr>
                        ) : filteredResolutions.map(item => (
                            <tr key={item.id} style={{ borderBottom: `1px solid ${border}`, transition: 'background 0.2s' }}>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        {item.photos && item.photos[0] ? (
                                            <img src={item.photos[0].photo} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: 44, height: 44, borderRadius: 10, background: dm ? '#020617' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: dm ? `1px solid ${border}` : 'none' }}>
                                                <Package size={20} color="#94a3b8" />
                                            </div>
                                        )}
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{item.title}</p>
                                            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{item.category_display || 'Other'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
                                        <MapPin size={16} />
                                        <span style={{ fontSize: 14 }}>{item.location_name || 'Campus'}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
                                        <Calendar size={16} />
                                        <span style={{ fontSize: 14 }}>{new Date(item.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <span style={{ 
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        padding: '6px 12px', borderRadius: 20, 
                                        background: '#10b98115', color: '#10b981',
                                        fontSize: 12, fontWeight: 700
                                    }}>
                                        <CheckCircle size={14} /> Returned
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
};

export default ResolutionManager;
