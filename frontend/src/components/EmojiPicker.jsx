import React, { useState } from 'react';

const EMOJI_CATEGORIES = {
  '😀': ['😀','😂','🥹','😊','😍','🥰','😎','🤩','😢','😭','😤','😡','🥺','😏','😴','🤔','🫡','👀','💀','🔥'],
  '👋': ['👋','👍','👎','❤️','🙏','💪','✌️','🤝','👏','🫶','💯','🎉','✅','❌','⭐','💡','📌','🔔','📢','💬'],
  '🌍': ['🌍','🌞','🌧️','🌈','🍕','🍔','🎵','🎮','📱','💻','🚗','✈️','🏠','🏫','📚','🎒','🔑','💼','📷','⚽'],
};

const EmojiPicker = ({ onSelect, onClose }) => {
  const [activeTab, setActiveTab] = useState('😀');

  return (
    <div style={{
      position: 'absolute', bottom: '100%', right: 0, marginBottom: 8,
      background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      width: 300, zIndex: 100, overflow: 'hidden',
      border: '1px solid #e4e6eb',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e4e6eb', padding: '6px 8px', gap: 4 }}>
        {Object.keys(EMOJI_CATEGORIES).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            background: activeTab === tab ? '#e8f0fe' : 'transparent',
            border: 'none', borderRadius: 8, padding: '6px 10px',
            fontSize: 18, cursor: 'pointer', transition: 'background 0.15s',
          }}>
            {tab}
          </button>
        ))}
        <button onClick={onClose} style={{
          marginLeft: 'auto', background: 'none', border: 'none',
          fontSize: 16, cursor: 'pointer', color: '#65676b', padding: '4px 8px',
        }}>✕</button>
      </div>

      {/* Emoji Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 2, padding: 8, maxHeight: 200, overflowY: 'auto',
      }}>
        {EMOJI_CATEGORIES[activeTab].map(emoji => (
          <button key={emoji} onClick={() => { onSelect(emoji); }} style={{
            background: 'none', border: 'none', fontSize: 24,
            cursor: 'pointer', padding: 4, borderRadius: 8,
            transition: 'background 0.1s', lineHeight: 1,
          }}
            onMouseEnter={e => e.target.style.background = '#f0f2f5'}
            onMouseLeave={e => e.target.style.background = 'none'}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;