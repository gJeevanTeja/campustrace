import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const TERMS = [
  { icon:'📋', title:'Accurate Information',  text:'Users must provide accurate and truthful information when reporting lost or found items. False or misleading reports are strictly not permitted and may lead to account suspension.' },
  { icon:'🚫', title:'No False Claims',        text:'Fraudulent claims of item ownership are prohibited. All claims are subject to verification by both parties. CampusTrace reserves the right to review disputes.' },
  { icon:'⚠️', title:'Liability Disclaimer',  text:'CampusTrace is not responsible for any fraudulent activities, disputes, or losses that occur between users. Use the platform responsibly and meet in safe, public campus areas.' },
  { icon:'✅', title:'Item Verification',      text:'Claimed items must be verified by both parties before handover. We recommend meeting at well-lit, campus security-monitored locations for all item exchanges.' },
  { icon:'🔒', title:'Data Privacy',           text:'Your personal data is securely stored and encrypted. We never sell or share your data with third parties for commercial purposes. See our Privacy Policy for details.' },
  { icon:'💬', title:'Messaging Conduct',      text:'Users must not misuse the messaging system for spam, harassment, or any purpose unrelated to lost and found items. Violations will result in account suspension.' },
  { icon:'⛔', title:'Account Suspension',     text:'Repeated violations of these terms may lead to temporary or permanent account suspension at the sole discretion of CampusTrace administrators without prior notice.' },
  { icon:'🖼️', title:'Content Standards',      text:'All uploaded images and content must be appropriate and relevant to the reported item. Offensive, inappropriate, or unrelated content will be removed immediately.' },
  { icon:'🎓', title:'Campus Community Only',  text:'This platform is exclusively for verified members of the campus community. Providing false credentials during registration is a violation and access will be revoked.' },
  { icon:'📞', title:'Contact & Support',      text:'For any issues, disputes, or violations, contact the campus administration office. We are committed to maintaining a safe and helpful environment for all users.' },
];

const PRIVACY = [
  { icon:'📊', title:'Data Collection',   text:'We collect your name, email, phone number, and location data only as necessary to provide the lost and found service effectively. No additional data is collected.' },
  { icon:'🔐', title:'Data Security',     text:'All data is encrypted in transit (HTTPS) and at rest. We use industry-standard security practices and regularly audit our systems to protect your information.' },
  { icon:'🚫', title:'No Data Selling',   text:'We never sell, rent, or trade your personal information with third parties for commercial or advertising purposes. Your data is yours.' },
  { icon:'📍', title:'Location Data',     text:'Location data is used only to display item proximity and connect lost item owners with finders. Continuous location tracking is never performed.' },
  { icon:'🍪', title:'Cookies',           text:'We use minimal session cookies only for authentication (keeping you logged in). No advertising, tracking, or third-party cookies are used.' },
  { icon:'🗑️', title:'Data Deletion',     text:'You may request deletion of your account and all associated data at any time by contacting campus administration. Deletion is completed within 30 days.' },
  { icon:'📧', title:'Email Communications', text:'You will only receive emails related to your account activity, item notifications you opted into, and critical security updates. You can opt out of notifications anytime in Settings.' },
];

const TermsPage = ({ darkMode: dm }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [tab, setTab] = useState(location.pathname === '/privacy' ? 'privacy' : 'terms');

  const bg     = dm ? '#121212' : '#f8fafc';
  const card   = dm ? '#1e1e1e' : '#fff';
  const text   = dm ? '#e2e8f0' : '#1e1e1e';
  const muted  = dm ? '#94a3b8' : '#64748b';
  const border = dm ? '#2d2d2d' : '#e2e8f0';
  const items  = tab === 'terms' ? TERMS : PRIVACY;

  return (
    <div style={{ minHeight:'100vh', background:bg, paddingBottom:90 }}>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#1e40af,#7c3aed)', padding:'20px 16px', color:'#fff' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <button onClick={() => navigate(-1)}
            style={{ background:'rgba(255,255,255,.2)', border:'none', borderRadius:8, padding:'7px 12px', color:'#fff', cursor:'pointer', fontSize:16 }}>←</button>
          <div>
            <h1 style={{ margin:0, fontSize:20, fontWeight:700 }}>Legal</h1>
            <p style={{ margin:'2px 0 0', fontSize:12, opacity:.8 }}>CampusTrace Policies</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, background:'rgba(255,255,255,.15)', borderRadius:12, padding:4 }}>
          {[['terms','📋 Terms & Conditions'],['privacy','🔒 Privacy Policy']].map(([t, lbl]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex:1, padding:'9px', borderRadius:9, border:'none', cursor:'pointer', fontWeight:600, fontSize:13,
                background: tab===t ? '#fff' : 'transparent', color: tab===t ? '#1e40af' : '#fff' }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:16 }}>
        <div style={{ background:card, borderRadius:16, border:`1px solid ${border}`, overflow:'hidden', marginBottom:16 }}>
          <div style={{ padding:'14px 16px', borderBottom:`1px solid ${border}`, background: dm?'#162032':'#eff6ff' }}>
            <p style={{ margin:0, fontSize:13, color: dm?'#93c5fd':'#1d4ed8', fontWeight:500 }}>Last updated: February 2026 · CampusTrace v1.0</p>
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ padding:'16px', borderBottom: i < items.length-1 ? `1px solid ${border}` : 'none', display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={{ width:42, height:42, borderRadius:12, background: dm?'#121212':'#f0f4ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                {item.icon}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ margin:'0 0 4px', fontWeight:700, fontSize:15, color:text }}>{i+1}. {item.title}</p>
                <p style={{ margin:0, fontSize:14, color:muted, lineHeight:1.6 }}>{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: dm?'#162032':'#eff6ff', borderRadius:12, padding:'13px 16px', border:`1px solid ${dm?'#1d4070':'#bfdbfe'}` }}>
          <p style={{ margin:0, fontSize:13, color: dm?'#93c5fd':'#1d4ed8', lineHeight:1.6 }}>
            By using CampusTrace, you agree to all policies above. For questions contact campus administration or email <strong>support@campustrace.edu</strong>
          </p>
        </div>
      </div>

      <BottomNav darkMode={dm} />
    </div>
  );
};

export default TermsPage;