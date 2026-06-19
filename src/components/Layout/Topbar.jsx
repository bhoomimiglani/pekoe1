import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { fmt } from '../../utils/helpers';
import PostModal from '../Feed/PostModal';

const PAGE_META = {
  '/':            { title: 'Explore',         sub: 'Feed · Townhall · Hot Takes — all in one place' },
  '/hottake':     { title: '🔥 Hot Takes',    sub: 'Bold opinions — vote before the timer runs out' },
  '/townhall':    { title: '⚔️ Townhall',     sub: 'Side A vs Side B — live debate bars' },
  '/circles':     { title: '🏘️ Circles',     sub: 'Join communities that match your interests' },
  '/verify':      { title: '✅ Verify',        sub: 'Fact-check flagged posts and earn PëKs' },
  '/quests':      { title: '🎯 Daily Quests', sub: 'Complete tasks for bonus rewards' },
  '/leaderboard': { title: '🏆 Leaderboard',  sub: 'Top earners across PëKœ' },
  '/games':       { title: '🎮 Games',        sub: 'Play mini-games and earn rewards' },
  '/wallet':      { title: '💰 Wallet',       sub: 'Your PëKs, stickers, and purchases' },
  '/profile':     { title: '👤 Profile',      sub: 'Your journey on PëKœ' },
};

const Topbar = () => {
  const [showModal, setShowModal] = useState(false);
  const { liveUsers } = useApp();
  const location = useLocation();
  const meta = PAGE_META[location.pathname] || { title: 'PëKœ', sub: '' };

  return (
    <>
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <div className="topbar-title">{meta.title}</div>
          {meta.sub && <div className="topbar-sub">{meta.sub}</div>}
        </div>
        <div className="topbar-live">
          <div className="topbar-live-dot" />
          <span>{fmt(liveUsers)} online</span>
        </div>
        <button className="topbar-create" onClick={() => setShowModal(true)}>
          + Create Post
        </button>
      </div>
      <PostModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export default Topbar;
