import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { fmt, ini, tier } from '../../utils/helpers';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, streakInfo } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: '🏠', label: 'Home Feed' },
    { path: '/hottake', icon: '🔥', label: 'Hot Takes' },
    { path: '/townhall', icon: '⚔️', label: 'Townhall' },
    { path: '/circles', icon: '🏘️', label: 'Circles' },
    { path: '/verify', icon: '✅', label: 'Verify' },
    { path: '/quests', icon: '🎯', label: 'Daily Quests' },
    { path: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
    { path: '/games', icon: '🎮', label: 'Games & Streaks' },
    { path: '/wallet', icon: '💰', label: 'Wallet' },
  ];

  const handleNav = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const userTier = user ? tier(user.peks) : { name: 'Newcomer', color: '#6B7280' };

  return (
    <>
      <div style={styles.sidebar(isOpen)}>
        <div style={styles.sidebarHead}>
          <div style={styles.logo}>PëKœ</div>
          <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.streakCard}>
          <span style={styles.flame}>🔥</span>
          <div>
            <div style={styles.streakNum}>{streakInfo?.streak || user?.streak || 0}</div>
            <div style={styles.streakLabel}>Day Streak</div>
          </div>
        </div>

        <div style={styles.navGroup}>
          {navItems.map(item => (
            <div
              key={item.path}
              onClick={() => handleNav(item.path)}
              style={styles.navItem(location.pathname === item.path)}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div style={styles.sidebarBottom}>
          <div onClick={() => navigate('/profile')} style={styles.userChip}>
            <div style={styles.avatar(user?.avatar_color || '#E8531F')}>
              {ini(user?.username)}
            </div>
            <div>
              <div style={styles.userName}>{user?.username || '—'}</div>
              <div style={styles.userPeks}>{fmt(user?.peks || 0)} PëKs · {userTier.name}</div>
            </div>
          </div>
        </div>
      </div>

      {isOpen && <div onClick={() => setIsOpen(false)} style={styles.overlay} />}
    </>
  );
};

const styles = {
  sidebar: (isOpen) => ({
    width: '252px',
    flexShrink: 0,
    background: 'linear-gradient(180deg, rgba(6,6,12,0.96) 0%, rgba(11,11,22,0.96) 100%)',
    borderRight: '1px solid rgba(255,255,255,0.055)',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    padding: '1.5rem 0',
    backdropFilter: 'blur(24px)',
    transform: window.innerWidth <= 768 ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
  }),
  sidebarHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.2rem 0 1.4rem', marginBottom: '0.25rem' },
  closeBtn: { display: window.innerWidth <= 768 ? 'block' : 'none', background: 'none', border: 'none', color: 'rgba(245,242,236,0.36)', fontSize: '1.25rem', cursor: 'pointer' },
  logo: { fontFamily: "'Syne', sans-serif", fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.05em', background: 'linear-gradient(135deg, #fff 0%, #FFC857 70%, #E8531F 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  streakCard: { margin: '0.25rem 1rem 1.1rem', padding: '0.7rem 0.9rem', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(245,166,35,0.12) 0%, rgba(232,83,31,0.06) 100%)', border: '1px solid rgba(245,166,35,0.2)', display: 'flex', alignItems: 'center', gap: '0.7rem' },
  flame: { fontSize: '1.2rem', filter: 'drop-shadow(0 0 8px rgba(245,166,35,0.5))' },
  streakNum: { fontFamily: "'JetBrains Mono', monospace", fontSize: '1rem', fontWeight: 700, color: '#F5A623' },
  streakLabel: { fontSize: '0.58rem', color: 'rgba(245,242,236,0.36)', letterSpacing: '0.1em', textTransform: 'uppercase' },
  navGroup: { flex: '0 0 auto', marginTop: '0.5rem' },
  navItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.7rem 1.4rem', color: active ? '#E8531F' : 'rgba(245,242,236,0.62)', fontSize: '0.85rem', fontWeight: active ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s', borderLeft: active ? '2px solid #E8531F' : '2px solid transparent', background: active ? 'linear-gradient(90deg, rgba(232,83,31,0.12), transparent)' : 'none', borderRadius: '0 10px 10px 0', marginRight: '0.5rem'
  }),
  navIcon: { fontSize: '1.05rem', width: '1.3rem', textAlign: 'center' },
  sidebarBottom: { marginTop: 'auto', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.055)' },
  userChip: { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.7rem 0.85rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.055)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.25s' },
  avatar: (color) => ({ width: '36px', height: '36px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.92rem', fontWeight: 800, color: '#fff', fontFamily: "'Syne', sans-serif" }),
  userName: { fontSize: '0.82rem', fontWeight: 700 },
  userPeks: { fontSize: '0.66rem', fontFamily: "'JetBrains Mono', monospace", color: '#F5A623', marginTop: '0.15rem' },
  overlay: { position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' },
};

export default Sidebar;