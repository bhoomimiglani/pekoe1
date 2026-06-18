import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = ({ children }) => {
  const { user, fetchCircles, fetchStreakInfo } = useApp();

  useEffect(() => {
    if (user) {
      Promise.all([fetchCircles(), fetchStreakInfo()]).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="content-area">
          {children}
        </div>
        <footer style={{
          padding: '1rem 2rem', textAlign: 'center',
          fontSize: '0.68rem', color: '#B8B4AE',
          borderTop: '1px solid rgba(26,26,24,0.08)',
          background: '#FAFAF8',
        }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#C8401A' }}>PëKœ</span>
          <span style={{ margin: '0 0.35rem', opacity: 0.4 }}>·</span>
          Earn · Discuss · Verify
        </footer>
      </div>
    </div>
  );
};

export default Layout;
