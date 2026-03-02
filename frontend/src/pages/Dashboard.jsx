import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { itemsAPI } from '../services/api';
import BottomNav from '../components/BottomNav';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { Frown, PartyPopper, CheckCircle2, Package, Search, Target, Hand, Target as TargetIcon, Search as SearchIcon, AlertTriangle, PlayCircle, Lock, ClipboardList, CheckCircle, Activity, XOctagon, Loader2, RefreshCw, Hand as HandIcon, Box, BarChart2 } from 'lucide-react';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const BAR_COLORS = { posted: '#3b82f6', claimed: '#10b981', returned: '#8b5cf6' };
// ─── Tiny stat card ──────────────────────────────────────────────────────
const StatCard = ({ emoji, label, value, color, bg }) => (
  <div style={{
    background: bg, borderRadius: 16, padding: '16px 14px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    flex: '1 1 120px', minWidth: 100,
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
  }}>
    <span style={{ display: 'flex', color }}>{emoji}</span>
    <span style={{ fontSize: 26, fontWeight: 800, color }}>{value}</span>
    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
  </div>
);

// ─── Section header ──────────────────────────────────────────────────────
const SectionTitle = ({ children, dm }) => (
  <p style={{
    margin: '20px 0 10px', fontSize: 13, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.8px',
    color: dm ? '#94a3b8' : '#64748b',
  }}>
    {children}
  </p>
);

// ─── Custom tooltip ──────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, dm }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: dm ? '#1e1e1e' : '#fff',
      border: `1px solid ${dm ? '#2d2d2d' : '#e2e8f0'}`,
      borderRadius: 10, padding: '8px 14px', fontSize: 13,
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    }}>
      {label && <p style={{ margin: '0 0 4px', fontWeight: 700, color: dm ? '#e2e8f0' : '#1e1e1e' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, color: p.color || p.fill }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const Dashboard = ({ darkMode }) => {
  const dm = darkMode;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('user');
  const [userStats, setUserStats] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const bg = dm ? '#121212' : '#f0f4ff';
  const card = dm ? '#1e1e1e' : '#ffffff';
  const text = dm ? '#e2e8f0' : '#1e1e1e';
  const muted = dm ? '#94a3b8' : '#64748b';
  const border = dm ? '#2d2d2d' : '#e2e8f0';

  // ── monthly data builder ─────────────────────────────────────
  const buildMonthlyData = (items) => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(), monthNum: d.getMonth(),
        lost: 0, found: 0, claimed: 0,
      });
    }
    items.forEach(item => {
      const d = new Date(item.created_at || item.date_posted);
      months.forEach(m => {
        if (d.getFullYear() === m.year && d.getMonth() === m.monthNum) {
          if (item.type === 'lost') m.lost++;
          if (item.type === 'found') m.found++;
          if (item.status === 'claimed') m.claimed++;
        }
      });
    });
    return months.map(({ month, lost, found, claimed }) => ({ month, lost, found, claimed }));
  };

  // ✅ FIX 1: useCallback so fetchData is stable and won't re-trigger useEffect infinitely
  // ✅ FIX 2: notificationsAPI import removed — was unused
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const myRes = await itemsAPI.getMyItems();
      const myItems = Array.isArray(myRes.data) ? myRes.data : (myRes.data?.results || []);

      setUserStats({
        lost: myItems.filter(i => i.type === 'lost').length,
        found: myItems.filter(i => i.type === 'found').length,
        claimed: myItems.filter(i => i.status === 'claimed').length,
        returned: myItems.filter(i => i.status === 'returned').length,
        active: myItems.filter(i => i.status === 'active').length,
        total: myItems.length,
        items: myItems,
      });

      if (user?.role === 'admin' || user?.is_staff) {
        try {
          const allRes = await itemsAPI.getAll({ page_size: 1000 });
          const all = Array.isArray(allRes.data) ? allRes.data : (allRes.data?.results || []);
          setAdminStats({
            total: all.length,
            lost: all.filter(i => i.type === 'lost').length,
            found: all.filter(i => i.type === 'found').length,
            claimed: all.filter(i => i.status === 'claimed').length,
            returned: all.filter(i => i.status === 'returned').length,
            active: all.filter(i => i.status === 'active').length,
            fraud: 0,
            monthlyData: buildMonthlyData(all),
          });
        } catch {
          // non-admin silently skips
        }
      }
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [user]); // user is the only real external dependency

  // ✅ FIX 2: fetchData in deps array — no more warning because it's wrapped in useCallback
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── chart data ────────────────────────────────────────────────
  const userPieData = userStats ? [
    { name: 'Lost', value: userStats.lost },
    { name: 'Found', value: userStats.found },
    { name: 'Claimed', value: userStats.claimed },
    { name: 'Returned', value: userStats.returned },
  ].filter(d => d.value > 0) : [];

  const adminPieData = adminStats ? [
    { name: 'Lost', value: adminStats.lost },
    { name: 'Found', value: adminStats.found },
    { name: 'Claimed', value: adminStats.claimed },
    { name: 'Returned', value: adminStats.returned },
  ].filter(d => d.value > 0) : [];

  const isAdmin = user?.role === 'admin' || user?.is_staff;

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', padding: '20px 16px 0', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>Dashboard</h1>
            <p style={{ margin: '3px 0 0', fontSize: 13, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 6 }}>
              Welcome back, {user?.name?.split(' ')[0] || 'User'} <HandIcon size={16} />
            </p>
          </div>
          <button onClick={fetchData}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, padding: '8px 14px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { id: 'user', icon: <TargetIcon size={16} />, label: 'My Stats' },
            ...(isAdmin ? [{ id: 'admin', icon: <SearchIcon size={16} />, label: 'Global' }] : []),
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 18px', border: 'none', borderRadius: '10px 10px 0 0',
                cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                background: activeTab === tab.id ? (dm ? '#1e1e1e' : '#f0f4ff') : 'rgba(255,255,255,0.15)',
                color: activeTab === tab.id ? '#2563eb' : 'rgba(255,255,255,0.85)',
                display: 'flex', alignItems: 'center', gap: 6
              }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 16px 0', maxWidth: 600, margin: '0 auto' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: muted }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><Loader2 size={40} className="animate-spin" /></div>
            <p>Loading your stats...</p>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 14 }}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {/* ── USER TAB ── */}
        {!loading && activeTab === 'user' && userStats && (
          <>
            <SectionTitle dm={dm}>Overview</SectionTitle>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <StatCard emoji={<Frown size={28} />} label="Items Lost" value={userStats.lost} color="#ef4444" bg={dm ? '#2d1b1b' : '#fef2f2'} />
              <StatCard emoji={<PartyPopper size={28} />} label="Items Found" value={userStats.found} color="#10b981" bg={dm ? '#1b2d25' : '#f0fdf4'} />
              <StatCard emoji={<CheckCircle2 size={28} />} label="Claimed" value={userStats.claimed} color="#f59e0b" bg={dm ? '#2d2510' : '#fffbeb'} />
              <StatCard emoji={<Box size={28} />} label="Returned" value={userStats.returned} color="#3b82f6" bg={dm ? '#1b2340' : '#eff6ff'} />
            </div>

            <div style={{ background: dm ? '#2d2d2d' : '#eff6ff', border: `1px solid ${dm ? '#2563eb44' : '#bfdbfe'}`, borderRadius: 14, padding: '12px 16px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: dm ? '#93c5fd' : '#1d4ed8', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}><PlayCircle size={16} /> Active listings</span>
              <span style={{ color: dm ? '#93c5fd' : '#1d4ed8', fontWeight: 800, fontSize: 22 }}>{userStats.active}</span>
            </div>

            {userPieData.length > 0 ? (
              <>
                <SectionTitle dm={dm}>Item Breakdown</SectionTitle>
                <div style={{ background: card, borderRadius: 16, padding: 16, border: `1px solid ${border}`, marginBottom: 4 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={userPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {userPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip dm={dm} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
                    {userPieData.map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i] }} />
                        <span style={{ fontSize: 12, color: muted }}>{d.name} ({d.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ background: card, borderRadius: 16, padding: 32, border: `1px solid ${border}`, textAlign: 'center', color: muted, marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><BarChart2 size={40} /></div>
                <p style={{ margin: 0 }}>No items yet — post your first item!</p>
              </div>
            )}

            {userStats.items.length > 0 && (
              <>
                <SectionTitle dm={dm}>Recent Items</SectionTitle>
                <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden', marginBottom: 4 }}>
                  {userStats.items.slice(0, 5).map((item, i) => {
                    const sc = ({ active: { bg: '#dcfce7', text: '#16a34a' }, claimed: { bg: '#fef3c7', text: '#d97706' }, returned: { bg: '#dbeafe', text: '#1d4ed8' } })[item.status] || { bg: '#f1f5f9', text: '#64748b' };
                    return (
                      <div key={item.id} onClick={() => navigate(`/item/${item.id}`)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', borderBottom: i < Math.min(userStats.items.length, 5) - 1 ? `1px solid ${border}` : 'none' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: text }}>{item.title}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: muted }}>{item.type?.toUpperCase()} · {item.time_ago || 'Recently'}</p>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.text }}>
                          {item.status?.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {userStats.items.length > 5 && (
                  <button onClick={() => navigate('/my-items')}
                    style={{ width: '100%', background: 'none', border: `1px solid ${border}`, borderRadius: 12, padding: '12px', color: '#2563eb', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginBottom: 4 }}>
                    View All Items →
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* ── ADMIN TAB ── */}
        {!loading && activeTab === 'admin' && (
          <>
            {!adminStats ? (
              <div style={{ background: '#fee2e2', borderRadius: 14, padding: 24, textAlign: 'center', color: '#dc2626', marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><Lock size={40} /></div>
                <p style={{ margin: 0, fontWeight: 600 }}>Admin access required</p>
              </div>
            ) : (
              <>
                <SectionTitle dm={dm}>Platform Overview</SectionTitle>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                  <StatCard emoji={<ClipboardList size={28} />} label="Total Items" value={adminStats.total} color="#6366f1" bg={dm ? '#1e1b4b' : '#eef2ff'} />
                  <StatCard emoji={<Frown size={28} />} label="Lost" value={adminStats.lost} color="#ef4444" bg={dm ? '#2d1b1b' : '#fef2f2'} />
                  <StatCard emoji={<PartyPopper size={28} />} label="Found" value={adminStats.found} color="#10b981" bg={dm ? '#1b2d25' : '#f0fdf4'} />
                  <StatCard emoji={<CheckCircle size={28} />} label="Claimed" value={adminStats.claimed} color="#f59e0b" bg={dm ? '#2d2510' : '#fffbeb'} />
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                  <StatCard emoji={<Package size={28} />} label="Returned" value={adminStats.returned} color="#3b82f6" bg={dm ? '#1b2340' : '#eff6ff'} />
                  <StatCard emoji={<Activity size={28} />} label="Active" value={adminStats.active} color="#10b981" bg={dm ? '#1b2d25' : '#f0fdf4'} />
                  <StatCard emoji={<XOctagon size={28} />} label="Fraud/Failed" value={adminStats.fraud} color="#dc2626" bg={dm ? '#2d1b1b' : '#fef2f2'} />
                </div>

                {adminStats.total > 0 && (
                  <div style={{ background: dm ? '#2d2d2d' : '#eff6ff', border: `1px solid ${dm ? '#2563eb44' : '#bfdbfe'}`, borderRadius: 14, padding: '14px 16px', marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: dm ? '#93c5fd' : '#1d4ed8', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}><BarChart2 size={16} /> Resolution Rate</span>
                      <span style={{ color: dm ? '#93c5fd' : '#1d4ed8', fontWeight: 800, fontSize: 18 }}>
                        {((adminStats.returned / adminStats.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ background: dm ? '#2d2d2d' : '#e2e8f0', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                      <div style={{ background: 'linear-gradient(90deg, #2563eb, #10b981)', width: `${(adminStats.returned / adminStats.total) * 100}%`, height: '100%', borderRadius: 99, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                )}

                {adminPieData.length > 0 && (
                  <>
                    <SectionTitle dm={dm}>Item Distribution</SectionTitle>
                    <div style={{ background: card, borderRadius: 16, padding: 16, border: `1px solid ${border}`, marginBottom: 4 }}>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={adminPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {adminPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip content={<CustomTooltip dm={dm} />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
                        {adminPieData.map((d, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i] }} />
                            <span style={{ fontSize: 12, color: muted }}>{d.name} ({d.value})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {adminStats.monthlyData?.length > 0 && (
                  <>
                    <SectionTitle dm={dm}>Monthly Activity (Last 6 Months)</SectionTitle>
                    <div style={{ background: card, borderRadius: 16, padding: '16px 8px 8px', border: `1px solid ${border}`, marginBottom: 4 }}>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={adminStats.monthlyData} barSize={14}>
                          <CartesianGrid strokeDasharray="3 3" stroke={dm ? '#2d2d2d' : '#f1f5f9'} />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: muted }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: muted }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip dm={dm} />} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="lost" name="Lost" fill={BAR_COLORS.lost} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="found" name="Found" fill={BAR_COLORS.found} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="claimed" name="Claimed" fill={BAR_COLORS.claimed} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

      </div>
      <BottomNav darkMode={dm} />
    </div>
  );
};

export default Dashboard;