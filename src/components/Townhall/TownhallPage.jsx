import React, { useEffect, useState, useCallback } from 'react';
import { fmt, esc } from '../../utils/helpers';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import toast from 'react-hot-toast';

const TownhallPage = () => {
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useApp();

  const fetchDebates = useCallback(async () => {
    try {
      const res = await api.get('/api/posts?type=townhall&sort=top');
      setDebates(res.data || []);
    } catch (error) {
      console.error('Failed to fetch debates', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDebates();
  }, [fetchDebates]);

  // Real-time updates via socket — no more polling
  useEffect(() => {
    if (!socket) return;

    // Live vote bars update instantly for all viewers
    socket.on('voteUpdate', (data) => {
      setDebates(prev => prev.map(d =>
        d.id === data.postId ? { ...d, votes: data.votes, dn: data.dn } : d
      ));
    });

    // New townhall debate created
    socket.on('newPost', (post) => {
      if (post.type === 'townhall') {
        setDebates(prev => {
          if (prev.some(d => d.id === post.id)) return prev;
          return [post, ...prev];
        });
      }
    });

    return () => {
      socket.off('voteUpdate');
      socket.off('newPost');
    };
  }, [socket]);

  const voteTownhall = async (id, type) => {
    try {
      const res = await api.post(`/api/posts/${id}/vote`, { type });
      if (res.data.success) {
        setDebates(prev => prev.map(debate =>
          debate.id === id 
            ? { ...debate, votes: res.data.votes, dn: res.data.dn, user_vote: type }
            : debate
        ));
        toast.success(`Vote cast! +5 PëKs`);
      }
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const calculatePercentage = (votes, dn, side) => {
    const total = (votes || 0) + (dn || 0);
    if (total === 0) return 50;
    return side === 'A' ? Math.round((votes || 0) / total * 100) : Math.round((dn || 0) / total * 100);
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="page-loading-spinner"></div>
        <span>Preparing the floor… ⚔️</span>
      </div>
    );
  }

  return (
    <div>
      {debates.length === 0 ? (
        <div className="page-empty">
          <div className="page-empty-icon">⚔️</div>
          <div className="page-empty-title">No debates yet</div>
          <p>Create a <strong>Townhall</strong> post with Side A vs Side B.</p>
        </div>
      ) : (
        debates.map(debate => {
          const pctA = calculatePercentage(debate.votes, debate.dn, 'A');
          const pctB = calculatePercentage(debate.votes, debate.dn, 'B');
          const total = (debate.votes || 0) + (debate.dn || 0);
          
          return (
            <div key={debate.id} className="thcard">
              <div className="thh">
                <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text3)' }}>
                  Live Debate · {debate.circle_id}
                </div>
                <div className="nicon">⚔️</div>
              </div>
              <div className="thq">{esc(debate.title)}</div>
              {debate.body && <div className="th-body">{esc(debate.body)}</div>}
              
              <div className="vbars">
                <div className="vbrow">
                  <div className="vblabel">{debate.sideA || debate.sidea || 'Side A'}</div>
                  <div className="vbtrack">
                    <div className="vbfill" style={{ width: `${pctA}%`, background: 'var(--grad-ember)' }}></div>
                  </div>
                  <div className="vbpct">{pctA}%</div>
                </div>
                <div className="vbrow">
                  <div className="vblabel">{debate.sideB || 'Side B'}</div>
                  <div className="vbtrack">
                    <div className="vbfill" style={{ width: `${pctB}%`, background: 'var(--blue)' }}></div>
                  </div>
                  <div className="vbpct">{pctB}%</div>
                </div>
                <div style={{ fontSize: '.68rem', color: 'var(--text3)', paddingTop: '.25rem' }}>
                  {fmt(total)} total votes · updating live
                </div>
              </div>
              
              <div className="thvbtns">
                <button 
                  className={`thvbtn thva ${debate.user_vote === 'up' ? 'voted' : ''}`}
                  onClick={() => voteTownhall(debate.id, 'up')}
                >
                  Support {debate.sideA || debate.sidea || 'Side A'}
                </button>
                <button 
                  className={`thvbtn thvb ${debate.user_vote === 'down' ? 'voted' : ''}`}
                  onClick={() => voteTownhall(debate.id, 'down')}
                >
                  Support {debate.sideB || 'Side B'}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default TownhallPage;