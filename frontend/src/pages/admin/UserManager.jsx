import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import {
    Search, UserX, UserCheck, RefreshCw, Users, Mail, Phone, Calendar
} from 'lucide-react';

const UserManager = ({ darkMode }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [activity, setActivity] = useState(null);
    const dm = darkMode;

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await adminAPI.getUsers({ search, role: roleFilter });
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleAction = async (id, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
        try {
            await adminAPI.userAction(id, action);
            fetchUsers();
            if (selectedUser?.id === id) fetchActivity(id);
        } catch (err) {
            alert(`Failed to ${action} user.`);
        }
    };

    const fetchActivity = async (id) => {
        try {
            const { data } = await adminAPI.getUserActivity(id);
            setActivity(data);
        } catch (err) {
            console.error(err);
        }
    };

    const tableBg = dm ? '#1e293b' : '#fff';
    const borderColor = dm ? '#334155' : '#e2e8f0';
    const textColor = dm ? '#f1f5f9' : '#1e293b';
    const mutedText = dm ? '#94a3b8' : '#64748b';

    return (
        <AdminLayout darkMode={dm}>
            {/* Controls */}
            <div style={{
                display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap',
                background: tableBg, padding: 16, borderRadius: 16, border: `1px solid ${borderColor}`
            }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: mutedText }} />
                    <input
                        type="text"
                        placeholder="Search name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 10px 10px 40px', borderRadius: 10,
                            border: `1px solid ${borderColor}`, background: dm ? '#0f172a' : '#f8fafc',
                            color: textColor, outline: 'none'
                        }}
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    style={{
                        padding: '10px 16px', borderRadius: 10, border: `1px solid ${borderColor}`,
                        background: dm ? '#0f172a' : '#f8fafc', color: textColor, outline: 'none'
                    }}
                >
                    <option value="">All Roles</option>
                    <option value="student">Students</option>
                    <option value="faculty">Faculty</option>
                    <option value="moderator">Moderators</option>
                </select>
                <button onClick={fetchUsers} style={{
                    padding: '10px 16px', borderRadius: 10, background: '#2563eb', color: '#fff',
                    border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer'
                }}>
                    <RefreshCw size={18} /> Refresh
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedUser ? '1.5fr 1fr' : '1fr', gap: 24 }}>
                {/* User Table */}
                <div style={{
                    background: tableBg, borderRadius: 16, border: `1px solid ${borderColor}`, overflow: 'hidden'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${borderColor}`, background: dm ? '#33415544' : '#f8fafc' }}>
                                <th style={{ padding: '16px', fontSize: 13, color: mutedText }}>User</th>
                                <th style={{ padding: '16px', fontSize: 13, color: mutedText }}>Role</th>
                                <th style={{ padding: '16px', fontSize: 13, color: mutedText }}>Status</th>
                                <th style={{ padding: '16px', fontSize: 13, color: mutedText }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" style={{ padding: 40, textAlign: 'center', color: mutedText }}>Loading users...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan="4" style={{ padding: 40, textAlign: 'center', color: mutedText }}>No users found matching filters.</td></tr>
                            ) : users.map(u => (
                                <tr
                                    key={u.id}
                                    onClick={() => { setSelectedUser(u); fetchActivity(u.id); }}
                                    style={{
                                        borderBottom: `1px solid ${borderColor}`, cursor: 'pointer',
                                        background: selectedUser?.id === u.id ? (dm ? '#2563eb22' : '#2563eb08') : 'transparent'
                                    }}
                                >
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : <Users size={16} color="#64748b" />}
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{u.name}</p>
                                                <p style={{ margin: 0, fontSize: 12, color: mutedText }}>{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                                            padding: '2px 8px', borderRadius: 6,
                                            background: u.role === 'moderator' ? '#7c3aed22' : '#e2e8f0',
                                            color: u.role === 'moderator' ? '#7c3aed' : '#64748b'
                                        }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {u.is_blocked ? (
                                                <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Blocked</span>
                                            ) : (
                                                <span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Active</span>
                                            )}
                                            {u.is_verified && <UserCheck size={14} color="#2563eb" title="Verified" />}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }} onClick={e => e.stopPropagation()}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button
                                                onClick={() => handleAction(u.id, u.is_blocked ? 'unblock' : 'block')}
                                                title={u.is_blocked ? 'Unblock' : 'Block'}
                                                style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                                            >
                                                <UserX size={18} />
                                            </button>
                                            {!u.is_verified && (
                                                <button
                                                    onClick={() => handleAction(u.id, 'verify')}
                                                    title="Verify User"
                                                    style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', padding: 4 }}
                                                >
                                                    <UserCheck size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* User Details Sidebar */}
                {selectedUser && (
                    <div style={{
                        background: tableBg, borderRadius: 16, border: `1px solid ${borderColor}`, padding: 24, position: 'sticky', top: 24, alignSelf: 'start'
                    }}>
                        <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800 }}>User Profile</h3>

                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: '50%', background: '#f1f5f9',
                                margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: `4px solid ${borderColor}`
                            }}>
                                {selectedUser.avatar_url ? (
                                    <img src={selectedUser.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                ) : (
                                    <Users size={32} color="#94a3b8" />
                                )}
                            </div>
                            <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{selectedUser.name}</h4>
                            <p style={{ margin: 0, color: mutedText, fontSize: 14 }}>@{selectedUser.username || 'n/a'}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ color: '#2563eb' }}><Mail size={18} /></div>
                                <div>
                                    <p style={{ margin: 0, fontSize: 11, color: mutedText, fontWeight: 600 }}>Email Address</p>
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{selectedUser.email}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ color: '#2563eb' }}><Phone size={18} /></div>
                                <div>
                                    <p style={{ margin: 0, fontSize: 11, color: mutedText, fontWeight: 600 }}>Phone Number</p>
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{selectedUser.phone || 'Not provided'}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ color: '#2563eb' }}><Calendar size={18} /></div>
                                <div>
                                    <p style={{ margin: 0, fontSize: 11, color: mutedText, fontWeight: 600 }}>Joined On</p>
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {activity && (
                            <div style={{ background: dm ? '#0f172a' : '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 24 }}>
                                <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: mutedText, textTransform: 'uppercase' }}>User Activity</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#2563eb' }}>{activity.items_posted}</p>
                                        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: mutedText }}>Posts</p>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#10b981' }}>{activity.items_claimed}</p>
                                        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: mutedText }}>Returns</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <button
                                onClick={() => handleAction(selectedUser.id, selectedUser.role === 'moderator' ? 'demote' : 'promote')}
                                style={{
                                    padding: '10px', borderRadius: 10, border: `1px solid ${borderColor}`,
                                    background: 'none', color: textColor, fontWeight: 600, cursor: 'pointer', fontSize: 13
                                }}
                            >
                                {selectedUser.role === 'moderator' ? 'Demote User' : 'Promote Mod'}
                            </button>
                            <button
                                onClick={() => handleAction(selectedUser.id, selectedUser.is_blocked ? 'unblock' : 'block')}
                                style={{
                                    padding: '10px', borderRadius: 10, border: 'none',
                                    background: selectedUser.is_blocked ? '#dcfce7' : '#fee2e2',
                                    color: selectedUser.is_blocked ? '#16a34a' : '#dc2626',
                                    fontWeight: 600, cursor: 'pointer', fontSize: 13
                                }}
                            >
                                {selectedUser.is_blocked ? 'Unblock' : 'Block User'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default UserManager;
