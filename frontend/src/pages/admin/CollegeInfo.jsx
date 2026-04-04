import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import { 
    Building2, Calendar, MapPin, Globe2
} from 'lucide-react';

const CollegeInfo = ({ darkMode }) => {
    const { user } = useAuth();
    const [college, setCollege] = useState(null);
    const [loading, setLoading] = useState(true);
    const dm = darkMode;

    useEffect(() => {
        if (user?.college_data) {
            setCollege(user.college_data);
            setLoading(false);
        }
    }, [user]);

    const bg = dm ? '#0f172a' : '#fff';
    const border = dm ? '#1e293b' : '#e2e8f0';
    const text = dm ? '#f1f5f9' : '#1e293b';

    if (loading) return (
        <AdminLayout darkMode={dm}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
                Loading college information...
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout darkMode={dm}>
            <div style={{ marginBottom: 32 }}>
                <h2 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 900, color: text, transition: 'color 0.2s' }}>College Info</h2>
                <p style={{ margin: 0, color: dm ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                    Details about your institution and domain settings.
                </p>
            </div>

            <div style={{ maxWidth: 800 }}>
                <div style={{
                    background: bg, borderRadius: 24, border: `1px solid ${border}`, overflow: 'hidden',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ 
                        height: 120, background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                        display: 'flex', alignItems: 'flex-end', padding: '0 32px 24px'
                    }}>
                        <div style={{
                            width: 100, height: 100, borderRadius: 24, background: dm ? '#0f172a' : '#fff',
                            border: `4px solid ${bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: dm ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: -50, zIndex: 1
                        }}>
                            {college?.logo ? (
                                <img src={college.logo} alt="" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                            ) : (
                                <Building2 size={48} color="#2563eb" />
                            )}
                        </div>
                    </div>

                    <div style={{ padding: '70px 32px 32px' }}>
                        <h3 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: text, transition: 'color 0.2s' }}>{college?.name || 'N/A'}</h3>
                        <p style={{ margin: '0 0 32px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MapPin size={16} /> Campus Headquarters
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                            <div style={{ 
                                padding: 20, borderRadius: 16, background: dm ? '#0f172a' : '#f8fafc',
                                border: `1px solid ${border}`
                            }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase' }}>
                                    <Globe2 size={16} /> Email Domain
                                </label>
                                <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: dm ? '#f1f5f9' : '#1e293b' }}>{college?.email_domain || 'N/A'}</p>
                            </div>

                            <div style={{ 
                                padding: 20, borderRadius: 16, background: dm ? '#0f172a' : '#f8fafc',
                                border: `1px solid ${border}`
                            }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase' }}>
                                    <Calendar size={16} /> Partner Since
                                </label>
                                <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: dm ? '#f1f5f9' : '#1e293b' }}>
                                    {college?.created_at ? new Date(college.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div style={{ marginTop: 32, padding: 24, borderRadius: 20, background: dm ? '#2563eb15' : '#2563eb08', border: '1px solid #2563eb22' }}>
                            <p style={{ margin: 0, fontSize: 14, color: '#2563eb', fontWeight: 700, lineHeight: 1.6 }}>
                                💡 Settings for logo and name can only be modified by Super Admins. Contact support if you need to update your institution's profile.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default CollegeInfo;
