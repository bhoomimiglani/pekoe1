import React, { useEffect, useState, useCallback } from 'react';
import { fmt, ago, esc } from '../../utils/helpers';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import toast from 'react-hot-toast';

const HotTakesPage = () => {
  const [takes, setTakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useApp();

  const fetchHotTakes = useCallback(async () => {
    try {
      const res = await api.get('/api/posts?type=hot&sort=hot');
      setTakes(res.data || []);
    } catch (error) {
      console.error('Failed to fetch hot takes', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotTakes();
  }, [fetchHotTakes]);

  // Real-time updates via socket
  useEffect(() => {
    if (!socket) return;

    // Live vote updates
    socket.on('voteUpdate', (data) => {
      setTakes(prev => prev.map(t =>
        t.id === data.postId ? { ...t, votes: data.votes, dn: data.dn } : t
      ));
    });

    // New hot take posted
    socket.on('newPost', (post) => {
      if (post.type === 'hot') {
        setTakes(prev => {
          if (prev.some(t => t.id === post.id)) return prev;
          return [post, ...prev];
        });
      }
    });

    return () => {
      socket.off('voteUpdate');
      socket.off('newPost');
    };
  }, [socket]);

  const voteHotTake = async (id, type) => {
    try {
      const res = await api.post(`/api/posts/${id}/vote`, { type });
      if (res.data.success) {
        setTakes(prev => prev.map(take =>
          take.id === id 
            ? { ...take, votes: res.data.votes, dn: res.data.dn, user_vote: type }
            : take
        ));
        toast.success(`Voted! +5 PëKs`);
      }
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const getCountdown = (expiresAt) => {
    if (!expiresAt) return '🔥 Voting open';
    const left = new Date(expiresAt) - new Date();
    if (left <= 0) return '⏱ Voting closed';
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    return `⏱ ${m}m ${String(s).padStart(2, '0')}s left`;
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="page-loading-spinner"></div>
        <span>Stoking the fire… 🔥</span>
      </div>
    );
  }

  return (
    <div className="tklayout">
      {takes.length === 0 ? (
        <div className="page-empty page-empty--wide">
          <div className="page-empty-icon">🔥</div>
          <div className="page-empty-title">No hot takes yet</div>
          <p>Create a <strong>Hot Take</strong> post to start the debate.</p>
        </div>
      ) : (
        takes.map(take => {
          const upCls = take.user_vote === 'up' ? ' myvote' : '';
          const dnCls = take.user_vote === 'down' ? ' myvote' : '';
          return (
            <div key={take.id} className="tkcard">
              <div className="tkh">
                <div className="tktitle">{esc(take.title)}</div>
                <div className="tkmeta">
                  @{esc(take.username)} · {take.circle_id} · {ago(take.created_at)}
                </div>
              </div>
              <div className="tkbody">
                <div className="tk-excerpt">{esc(take.body || '')}</div>
                <div className={`tkoption${upCls}`} onClick={() => voteHotTake(take.id, 'up')}>
                  <div className="tktext">👍 Agree</div>
                  <div className="tkvotes">{fmt(take.votes || 0)}</div>
                </div>
                <div className={`tkoption${dnCls}`} onClick={() => voteHotTake(take.id, 'down')}>
                  <div className="tktext">👎 Disagree</div>
                  <div className="tkvotes">{fmt(take.dn || 0)}</div>
                </div>
              </div>
              <div className="tktimer">
                {getCountdown(take.expires_at)} · {fmt((take.votes || 0) + (take.dn || 0))} live votes
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default HotTakesPage;