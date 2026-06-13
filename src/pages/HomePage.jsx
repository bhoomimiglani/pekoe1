import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fmt } from '../utils/helpers';
import PostCard from '../components/Feed/PostCard';

const HomePage = () => {
  const [sort, setSort] = useState('new');
  const [category, setCategory] = useState('all');
  const { posts, fetchPosts, user, liveUsers, loading } = useApp();

  useEffect(() => {
    fetchPosts(sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  // Categories for filtering
  const categories = [
    { id: 'all', label: 'All', icon: '🌐' },
    { id: 'general', label: 'General', icon: '💬' },
    { id: 'technology', label: 'Tech', icon: '💻' },
    { id: 'politics', label: 'Politics', icon: '🏛️' },
    { id: 'sports', label: 'Sports', icon: '🏏' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { id: 'business', label: 'Business', icon: '📈' },
    { id: 'health', label: 'Health', icon: '💊' },
    { id: 'education', label: 'Education', icon: '📚' },
  ];

  // Post type filters (reserved for future filter UI)
  // const postTypes = [ ... ]

  const sortOptions = [
    { key: 'hot', label: '🔥 Hot' },
    { key: 'new', label: '✨ New' },
    { key: 'top', label: '⬆️ Top' },
  ];

  // Filter posts based on selected category and type
  const filteredPosts = posts.filter(post => {
    if (category !== 'all' && post.category !== category) return false;
    return true;
  });

  if (loading && posts.length === 0) {
    return (
      <div className="page-loading">
        <div className="page-loading-spinner"></div>
        <span>Loading posts...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="feed-hero">
        <div className="feed-hero-title">Welcome back, {user?.username || 'member'}! 👋</div>
        <p className="feed-hero-desc">
          Create text posts, share reviews, make ranked lists, launch polls, or voice your hot takes.
          Every action earns you PëKs!
        </p>
        <div className="feed-hero-stats">
          <span className="feed-stat"><strong>{fmt(user?.peks || 0)}</strong> PëKs</span>
          <span className="feed-stat">🔥 <strong>{user?.streak || 1}</strong> day streak</span>
          <span className="feed-stat"><strong>{fmt(liveUsers)}</strong> online</span>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div style={styles.categoryBar}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            style={styles.categoryBtn(category === cat.id)}
          >
            <span style={{ marginRight: '4px' }}>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sort Bar */}
      <div className="sbar">
        {sortOptions.map(opt => (
          <button
            key={opt.key}
            className={`sbtn ${sort === opt.key ? 'active' : ''}`}
            onClick={() => setSort(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="page-empty">
          <div className="page-empty-icon">✨</div>
          <div className="page-empty-title">No posts yet</div>
          <p>Be the first — hit <strong>Create Post</strong> above.</p>
        </div>
      ) : (
        filteredPosts.map(post => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
};

const styles = {
  categoryBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid rgba(255,255,255,0.055)',
  },
  categoryBtn: (active) => ({
    padding: '0.35rem 0.9rem',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: active ? 'linear-gradient(135deg, #E8531F 0%, #7C3AED 100%)' : 'rgba(255,255,255,0.03)',
    color: active ? '#fff' : 'rgba(245,242,236,0.62)',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
  }),
};

export default HomePage;