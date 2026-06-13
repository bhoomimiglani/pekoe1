import React, { useEffect, useState } from 'react';
import { ago, esc } from '../../utils/helpers';
import api from '../../services/api';

const VerifyPage = () => {
  const [flaggedPosts, setFlaggedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlaggedPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFlaggedPosts = async () => {
    try {
      const res = await api.get('/api/verify/posts');
      setFlaggedPosts(res.data || []);
    } catch (error) {
      console.error('Failed to fetch flagged posts', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="page-loading-spinner"></div>
        <span>Loading flagged posts...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="info-banner info-banner--verify">
        🛡️ <strong>Verify</strong> — community fact-checking. Flag misleading posts from the feed (+10 PëKs).
      </div>
      {flaggedPosts.length === 0 ? (
        <div className="page-empty">
          <div className="page-empty-icon">🔍</div>
          <div className="page-empty-title">Queue is clear</div>
          <p>No posts under review right now.</p>
        </div>
      ) : (
        flaggedPosts.map(post => (
          <div key={post.id} className="vccard">
            <div className="vstatus vs-pending">🔍 Under Review</div>
            <div className="ptitle vccard-title">{esc(post.title)}</div>
            <p className="vccard-meta">
              @{esc(post.username)} · {post.circle_id} · {ago(post.created_at)}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default VerifyPage;