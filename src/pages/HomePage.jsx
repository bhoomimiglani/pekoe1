import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { fmt, esc, ago } from '../utils/helpers';
import PostCard from '../components/Feed/PostCard';
import api from '../services/api';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'feed',     label: 'Feed',      icon: '📰' },
  { id: 'townhall', label: 'Townhall',  icon: '⚔️' },
  { id: 'hottake',  label: 'Hot Takes', icon: '🔥' },
];

const CATEGORIES = [
  { id: 'all',           label: 'All',           icon: '🌐' },
  { id: 'general',       label: 'General',        icon: '💬' },
  { id: 'technology',    label: 'Tech',           icon: '💻' },
  { id: 'politics',      label: 'Politics',       icon: '🏛️' },
  { id: 'sports',        label: 'Sports',         icon: '🏏' },
  { id: 'entertainment', label: 'Entertainment',  icon: '🎬' },
  { id: 'business',      label: 'Business',       icon: '📈' },
];

// ─── Townhall Section ───────────────────────────────────────────────────────

const TownhallSection = ({ socket }) => {
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDebates = useCallback(async () => {
    try {
      const res = await api.get('/api/posts?type=townhall&sort=top');
      setDebates(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDebates(); }, [fetchDebates]);

  useEffect(() => {
    if (!socket) return;
    socket.on('voteUpdate', (data) => {
      setDebates(prev => prev.map(d => d.id === data.postId ? { ...d, votes: data.votes, dn: data.dn } : d));
    });
    socket.on('newPost', (post) => {
      if (post.type === 'townhall') setDebates(prev => prev.some(d => d.id === post.id) ? prev : [post, ...prev]);
    });
    return () => { socket.off('voteUpdate'); socket.off('newPost'); };
  }, [socket]);

  const vote = async (id, type) => {
    try {
      const res = await api.post(`/api/posts/${id}/vote`, { type });
      if (res.data.success) {
        setDebates(prev => prev.map(d => d.id === id ? { ...d, votes: res.data.votes, dn: res.data.dn, user_vote: type } : d));
        toast.success('Vote cast! +5 PëKs');
      }
    } catch { toast.error('Failed to vote'); }
  };

  if (loading) return <div className="page-loading"><div className="page-loading-spinner" /><span>Loading debates…</span></div>;

  if (debates.length === 0) return (
    <div className="page-empty">
      <div className="page-empty-icon">⚔️</div>
      <div className="page-empty-title">No debates yet</div>
      <p>Create a <strong>Townhall</strong> post with Side A vs Side B.</p>
    </div>
  );

  return (
    <div>
      {debates.map(d => {
        const total = (d.votes || 0) + (d.dn || 0);
        const pctA = total === 0 ? 50 : Math.round((d.votes || 0) / total * 100);
        const pctB = 100 - pctA;
        return (
          <div key={d.id} className="thcard">
            <div className="thh">
              <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text3)' }}>
                Live Debate · {d.circle_id}
              </div>
              <div className="nicon">⚔️</div>
            </div>
            <div className="thq">{esc(d.title)}</div>
            {d.body && <div className="th-body">{esc(d.body)}</div>}
            <div className="vbars" style={{ padding: '0.75rem 1.3rem 0.5rem' }}>
              <div className="vbrow">
                <div className="vblabel">{d.sideA || d.sidea || 'Side A'}</div>
                <div className="vbtrack"><div className="vbfill" style={{ width: `${pctA}%`, background: 'var(--grad-ember)' }} /></div>
                <div className="vbpct">{pctA}%</div>
              </div>
              <div className="vbrow">
                <div className="vblabel">{d.sideB || d.sideb || 'Side B'}</div>
                <div className="vbtrack"><div className="vbfill" style={{ width: `${pctB}%`, background: 'var(--blue)' }} /></div>
                <div className="vbpct">{pctB}%</div>
              </div>
              <div style={{ fontSize: '.68rem', color: 'var(--text3)', paddingTop: '.25rem' }}>{fmt(total)} votes · live</div>
            </div>
            <div className="thvbtns">
              <button className={`thvbtn thva ${d.user_vote === 'up' ? 'voted' : ''}`} onClick={() => vote(d.id, 'up')}>
                Support {d.sideA || d.sidea || 'Side A'}
              </button>
              <button className={`thvbtn thvb ${d.user_vote === 'down' ? 'voted' : ''}`} onClick={() => vote(d.id, 'down')}>
                Support {d.sideB || d.sideb || 'Side B'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Hot Takes Section ───────────────────────────────────────────────────────

const HotTakesSection = ({ socket }) => {
  const [takes, setTakes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTakes = useCallback(async () => {
    try {
      const res = await api.get('/api/posts?type=hot&sort=hot');
      setTakes(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTakes(); }, [fetchTakes]);

  useEffect(() => {
    if (!socket) return;
    socket.on('voteUpdate', (data) => setTakes(prev => prev.map(t => t.id === data.postId ? { ...t, votes: data.votes, dn: data.dn } : t)));
    socket.on('newPost', (post) => { if (post.type === 'hot') setTakes(prev => prev.some(t => t.id === post.id) ? prev : [post, ...prev]); });
    return () => { socket.off('voteUpdate'); socket.off('newPost'); };
  }, [socket]);

  const vote = async (id, type) => {
    try {
      const res = await api.post(`/api/posts/${id}/vote`, { type });
      if (res.data.success) {
        setTakes(prev => prev.map(t => t.id === id ? { ...t, votes: res.data.votes, dn: res.data.dn, user_vote: type } : t));
        toast.success('Voted! +5 PëKs');
      }
    } catch { toast.error('Failed to vote'); }
  };

  const countdown = (exp) => {
    if (!exp) return '🔥 Open';
    const left = new Date(exp) - new Date();
    if (left <= 0) return '⏱ Closed';
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    return `⏱ ${m}m ${String(s).padStart(2, '0')}s`;
  };

  if (loading) return <div className="page-loading"><div className="page-loading-spinner" /><span>Stoking the fire…</span></div>;

  if (takes.length === 0) return (
    <div className="page-empty">
      <div className="page-empty-icon">🔥</div>
      <div className="page-empty-title">No hot takes yet</div>
      <p>Create a <strong>Hot Take</strong> post to start the debate.</p>
    </div>
  );

  return (
    <div className="tklayout">
      {takes.map(t => (
        <div key={t.id} className="tkcard">
          <div className="tkh">
            <div className="tktitle">{esc(t.title)}</div>
            <div className="tkmeta">@{esc(t.username)} · {ago(t.created_at)}</div>
          </div>
          <div className="tkbody">
            {t.body && <div className="tk-excerpt">{esc(t.body)}</div>}
            <div className={`tkoption${t.user_vote === 'up' ? ' myvote' : ''}`} onClick={() => vote(t.id, 'up')}>
              <div className="tktext">👍 Agree</div>
              <div className="tkvotes">{fmt(t.votes || 0)}</div>
            </div>
            <div className={`tkoption${t.user_vote === 'down' ? ' myvote' : ''}`} onClick={() => vote(t.id, 'down')}>
              <div className="tktext">👎 Disagree</div>
              <div className="tkvotes">{fmt(t.dn || 0)}</div>
            </div>
          </div>
          <div className="tktimer">{countdown(t.expires_at)} · {fmt((t.votes || 0) + (t.dn || 0))} votes</div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Explore Page ────────────────────────────────────────────────────────

const HomePage = () => {
  const [tab, setTab] = useState('feed');
  const [sort, setSort] = useState('new');
  const [category, setCategory] = useState('all');
  const { posts, fetchPosts, user, liveUsers, loading, socket } = useApp();

  useEffect(() => {
    if (tab === 'feed') fetchPosts(sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, tab]);

  const filteredPosts = posts.filter(post => category === 'all' || post.category === category);

  return (
    <div>
      {/* Hero */}
      <div className="feed-hero">
        <div className="feed-hero-title">Explore PëKœ 🌐</div>
        <p className="feed-hero-desc">
          Browse posts, live debates, and hot takes — all in one place. Every action earns PëKs.
        </p>
        <div className="feed-hero-stats">
          <span className="feed-stat"><strong>{fmt(user?.peks || 0)}</strong> PëKs</span>
          <span className="feed-stat">🔥 <strong>{user?.streak || 1}</strong> day streak</span>
          <span className="feed-stat"><strong>{fmt(liveUsers)}</strong> online</span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={s.tabBar}>
        {TABS.map(t => (
          <button key={t.id} style={s.tab(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Feed tab — category + sort filters */}
      {tab === 'feed' && (
        <>
          <div style={s.catBar}>
            {CATEGORIES.map(c => (
              <button key={c.id} style={s.catBtn(category === c.id)} onClick={() => setCategory(c.id)}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
          <div className="sbar">
            {[{ key: 'hot', label: '🔥 Hot' }, { key: 'new', label: '✨ New' }, { key: 'top', label: '⬆️ Top' }].map(o => (
              <button key={o.key} className={`sbtn ${sort === o.key ? 'active' : ''}`} onClick={() => setSort(o.key)}>{o.label}</button>
            ))}
          </div>
          {loading && posts.length === 0 ? (
            <div className="page-loading"><div className="page-loading-spinner" /><span>Loading…</span></div>
          ) : filteredPosts.length === 0 ? (
            <div className="page-empty">
              <div className="page-empty-icon">✨</div>
              <div className="page-empty-title">No posts yet</div>
              <p>Be the first — hit <strong>Create Post</strong> above.</p>
            </div>
          ) : filteredPosts.map(post => <PostCard key={post.id} post={post} />)}
        </>
      )}

      {tab === 'townhall' && <TownhallSection socket={socket} />}
      {tab === 'hottake' && <HotTakesSection socket={socket} />}
    </div>
  );
};

const s = {
  tabBar: {
    display: 'flex', gap: '0.35rem', marginBottom: '1.25rem',
    borderBottom: '2px solid var(--border)', paddingBottom: '0',
  },
  tab: (active) => ({
    padding: '0.55rem 1.1rem',
    border: 'none', background: 'none', cursor: 'pointer',
    fontSize: '0.84rem', fontWeight: active ? 700 : 500,
    color: active ? 'var(--ember)' : 'var(--text3)',
    borderBottom: active ? '2px solid var(--ember)' : '2px solid transparent',
    marginBottom: '-2px', transition: 'all 0.15s',
    fontFamily: 'var(--fb)',
  }),
  catBar: {
    display: 'flex', flexWrap: 'wrap', gap: '0.4rem',
    marginBottom: '0.85rem',
  },
  catBtn: (active) => ({
    padding: '0.3rem 0.8rem', borderRadius: 'var(--r-full)',
    border: '1px solid', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 500,
    transition: 'all 0.15s',
    borderColor: active ? 'var(--ember)' : 'var(--border)',
    background: active ? 'rgba(200,64,26,0.07)' : 'var(--surface)',
    color: active ? 'var(--ember)' : 'var(--text3)',
  }),
};

export default HomePage;
