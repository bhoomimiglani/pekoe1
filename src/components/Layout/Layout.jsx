import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = ({ children }) => {
  const { user, fetchCircles, fetchStreakInfo } = useApp();

  useEffect(() => {
    if (user) {
      fetchCircles();
      fetchStreakInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: '252px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Topbar />
        <div style={{ flex: 1, padding: '1.25rem 1.5rem 1rem', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
          {children}
        </div>
        <footer style={{ padding: '1rem 1.5rem 1.25rem', textAlign: 'center', fontSize: '0.68rem', color: 'rgba(245,242,236,0.36)', borderTop: '1px solid rgba(255,255,255,0.055)', background: 'rgba(6,6,12,0.5)' }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, background: 'linear-gradient(135deg, #FFC857, #E8531F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PëKœ</span>
          <span style={{ opacity: 0.4, margin: '0 0.35rem' }}>·</span>
          <span>Earn · Discuss · Verify</span>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
