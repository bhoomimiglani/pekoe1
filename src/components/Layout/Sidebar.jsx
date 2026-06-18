import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { fmt, ini, tier } from '../../utils/helpers';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, streakInfo } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/',            icon: '🏠', label: 'Home Feed' },
    { path: '/hottake',     icon: '🔥', label: 'Hot Takes' },
    { path: '/townhall',    icon: '⚔️',  label: 'Townhall' },
    { path: '/circles',     icon: '🏘️', label: 'Circles' },
    { path: '/verify',      icon: '✅', label: 'Verify' },
    { path: '/quests',      icon: '🎯', label: 'Daily Quests' },
    { path: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
    { path: '/games',       icon: '🎮', label: 'Games & Streaks' },
    { path: '/wallet',      icon: '💰', label: 'Wallet' },
  ];

  const handleNav = (path) => { navigate(path); setIsOpen(false); };
  const userTier = user ? tier(user.peks) : { name: 'Newcomer', color: '#8A8680' };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">PëKœ</div>
      <div className="sidebar-divider" />

      <div className="sidebar-streak">
        <span style={{ fontSize: '1.1rem' }}>🔥</span>
        <div>
          <div className="sidebar-streak-num">{streakInfo?.streak || user?.streak || 0}</div>
          <div className="sidebar-streak-lbl">Day Streak</div>
        </div>
      </div>

      <nav>
        {navItems.map(item => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleNav(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      <div
        className="sidebar-user"
        onClick={() => navigate('/profile')}
      >
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: user?.avatar_color || '#C8401A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.82rem', fontWeight: 700, color: '#fff', flexShrink: 0
        }}>
          {ini(user?.username)}
        </div>
        <div>
          <div className="sidebar-username">{user?.username || '—'}</div>
          <div className="sidebar-peks">{fmt(user?.peks || 0)} PëKs · {userTier.name}</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
