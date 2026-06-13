import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { fmt } from '../../utils/helpers';
import PostModal from '../Feed/PostModal';

const Topbar = () => {
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { liveUsers, user } = useApp();
  const location = useLocation();

  const getTitle = () => {
    const titles = {
      '/': 'Home Feed',
      '/hottake': '🔥 Hot Takes',
      '/townhall': '⚔️ Townhall',
      '/circles': '🏘️ Circles',
      '/verify': '✅ Verify',
      '/quests': '🎯 Daily Quests',
      '/leaderboard': '🏆 Leaderboard',
      '/profile': '👤 Profile',
      '/games': '🎮 Games & Streaks',
    };
    return titles[location.pathname] || 'PëKœ';
  };

  const getSubtitle = () => {
    const subs = {
      '/': 'Discover what India is talking about',
      '/hottake': 'Bold opinions — vote before the timer runs out',
      '/townhall': 'Side A vs Side B — live debate bars',
      '/circles': 'Join communities that match your interests',
      '/verify': 'Fact-check flagged posts and earn PëKs',
      '/quests': 'Complete tasks for bonus rewards',
      '/games': 'Play mini-games and earn rewards!',
    };
    return subs[location.pathname] || '';
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    const sidebar = document.getElementById('main-sidebar');
    if (sidebar) {
      sidebar.style.transform = !sidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
    }
  };

  return (
    <>
      <div style={styles.topbar}>
        <button onClick={toggleSidebar} style={styles.menuBtn}>
          <span style={styles.menuLine}></span>
          <span style={styles.menuLine}></span>
          <span style={styles.menuLine}></span>
        </button>
        <div style={styles.titles}>
          <h1 style={styles.title}>{getTitle()}</h1>
          <p style={styles.subtitle}>{getSubtitle()}</p>
        </div>
        <div style={styles.live}>
          <div style={styles.pulse}></div>
          <span>{fmt(liveUsers)} online</span>
        </div>
        <button onClick={() => setShowModal(true)} style={styles.createBtn}>
          <span>+</span>
          <span style={styles.createLabel}>Create Post</span>
        </button>
      </div>
      <PostModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

const styles = {
  topbar: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: 'rgba(6,6,12,0.88)',
    backdropFilter: 'blur(28px) saturate(1.8)',
    borderBottom: '1px solid rgba(255,255,255,0.055)',
    padding: '0.75rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  menuBtn: {
    display: 'none',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '5px',
    width: '40px',
    height: '40px',
    padding: '8px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.055)',
    cursor: 'pointer',
    '@media (max-width: 768px)': { display: 'flex' }
  },
  menuLine: {
    display: 'block',
    height: '2px',
    background: 'rgba(245,242,236,0.62)',
    borderRadius: '2px',
  },
  titles: { flex: 1, minWidth: 0 },
  title: { fontFamily: "'Syne', sans-serif", fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.01em', margin: 0 },
  subtitle: { fontSize: '0.72rem', color: 'rgba(245,242,236,0.36)', margin: '0.15rem 0 0' },
  live: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.66rem',
    color: '#00C9B1',
    padding: '0.3rem 0.7rem',
    borderRadius: '999px',
    background: 'rgba(0,201,177,0.06)',
    border: '1px solid rgba(0,201,177,0.15)',
  },
  pulse: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#00C9B1',
    animation: 'pulse 1.6s ease-in-out infinite',
  },
  createBtn: {
    background: 'linear-gradient(135deg, #E8531F 0%, #7C3AED 100%)',
    border: 'none',
    color: '#fff',
    padding: '0.55rem 1.2rem',
    borderRadius: '12px',
    fontSize: '0.81rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  createLabel: { '@media (max-width: 768px)': { display: 'none' } }
};

// Add pulse animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(0,201,177,0.6), 0 0 8px #00C9B1; }
    50% { box-shadow: 0 0 0 6px rgba(0,201,177,0), 0 0 8px #00C9B1; }
  }
`;
document.head.appendChild(styleSheet);

export default Topbar;