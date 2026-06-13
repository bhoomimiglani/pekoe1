import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fmt, ago, ini, esc } from '../../utils/helpers';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PostCard = ({ post }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [userVote, setUserVote] = useState(post.user_vote);
  const [votes, setVotes] = useState(post.votes || 0);
  const [dns, setDns] = useState(post.dn || 0);
  const [userStar, setUserStar] = useState(post.user_star);
  const [starAvg, setStarAvg] = useState(post.star_avg || 0);
  const [starCount, setStarCount] = useState(post.star_count || 0);
  const [userStickers, setUserStickers] = useState([]);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [stickers, setStickers] = useState([]);
  
  const { circles, flagPost, user } = useApp();
  const circle = circles.find(c => c.id === post.circle_id) || { name: post.circle_id, icon: '🏘️' };
  const isScholar = post.username === 'DrMeeraK';

  // Load stickers
  useEffect(() => {
    loadStickers();
    loadUserStickers();
  }, []);

  const loadStickers = async () => {
    try {
      const res = await api.get('/api/stickers');
      setStickers(res.data || []);
    } catch (error) {
      console.error('Failed to load stickers', error);
    }
  };

  const loadUserStickers = async () => {
    try {
      const res = await api.get('/api/user/stickers');
      setUserStickers(res.data || []);
    } catch (error) {
      console.error('Failed to load user stickers', error);
    }
  };

  const handleVote = async (type) => {
    try {
      const res = await api.post(`/api/posts/${post.id}/vote`, { type });
      if (res.data.success) {
        setUserVote(type);
        setVotes(res.data.votes);
        setDns(res.data.dn);
        toast.success(type === 'up' ? 'Upvoted! +1 PëK' : 'Vote recorded');
      }
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/api/posts/${post.id}/comment`, { text: commentText });
      if (res.data) {
        setComments(prev => [res.data, ...prev]);
        setCommentText('');
        toast.success('Comment added! +4 PëKs');
      }
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const loadComments = async () => {
    try {
      const res = await api.get(`/api/posts/${post.id}/comments`);
      setComments(res.data || []);
    } catch (error) {
      console.error('Failed to load comments', error);
    }
  };

  const handleRate = async (stars) => {
    try {
      const res = await api.post(`/api/posts/${post.id}/rate`, { stars });
      if (res.data.success) {
        setUserStar(stars);
        setStarAvg(res.data.star_avg);
        setStarCount(res.data.star_count);
        toast.success(`Rated ${stars} stars! +2 PëKs`);
      }
    } catch (error) {
      toast.error('Failed to rate');
    }
  };

  const handleFlag = async () => {
    try {
      const res = await api.post(`/api/posts/${post.id}/flag`);
      if (res.data.success) {
        toast.success('Post flagged! +10 PëKs');
      }
    } catch (error) {
      toast.error('Failed to flag post');
    }
  };

  const handleBoost = async () => {
    const hours = prompt('How many hours to boost? (1-24 hours, 10 PëKs per hour)', '24');
    if (!hours) return;
    const hoursNum = parseInt(hours);
    if (hoursNum < 1 || hoursNum > 24) {
      toast.error('Boost must be between 1 and 24 hours');
      return;
    }
    try {
      const res = await api.post(`/api/posts/${post.id}/boost`, { hours: hoursNum });
      if (res.data.success) {
        toast.success(`Post boosted for ${hoursNum} hours! -${res.data.boostCost} PëKs`);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to boost post');
    }
  };

  const handleUseSticker = async (stickerId) => {
    try {
      const res = await api.post(`/api/posts/${post.id}/sticker`, { stickerId });
      if (res.data.success) {
        toast.success('Sticker added to post!');
        setShowStickerPicker(false);
      }
    } catch (error) {
      toast.error('Failed to add sticker');
    }
  };

  useEffect(() => {
    if (showComments && comments.length === 0) {
      loadComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showComments]);

  const getBadgeClass = (type) => {
    const classes = { hot: 'bh', sage: 'bs', townhall: 'bt', text: 'br', poll: 'bp', review: 'bv', ranked_list: 'bp' };
    return classes[type] || 'br';
  };

  const getBadgeLabel = (type) => {
    const labels = { 
      hot: '🔥 Hot Take', 
      sage: '🧠 Sage Q&A', 
      townhall: '⚔️ Townhall', 
      text: '📝 Text Post', 
      poll: '📊 Poll',
      review: '⭐ Review',
      ranked_list: '📋 Ranked List'
    };
    return labels[type] || '💬 Post';
  };

  // Render Image
  const renderImage = () => {
    if (!post.image_url) return null;
    return (
      <div style={styles.postImage}>
        <img src={post.image_url} alt="Post attachment" style={styles.image} onError={(e) => e.target.style.display = 'none'} />
      </div>
    );
  };

  // Render Review Post
  const renderReview = () => {
    if (post.type !== 'review' || !post.review_data) return null;
    const review = post.review_data;
    return (
      <div style={styles.reviewCard}>
        <div style={styles.reviewHeader}>
          <span style={styles.reviewType}>
            {review.itemType === 'movie' && '🎬'}
            {review.itemType === 'book' && '📚'}
            {review.itemType === 'product' && '🛍️'}
            {review.itemType === 'music' && '🎵'}
            {review.itemType === 'game' && '🎮'}
          </span>
          <span style={styles.reviewItemName}>{review.itemName}</span>
        </div>
        <div style={styles.reviewRating}>
          {[1, 2, 3, 4, 5].map(star => (
            <span key={star} style={{ color: star <= review.rating ? '#FFC857' : 'rgba(255,255,255,0.2)' }}>★</span>
          ))}
          <span style={styles.reviewRatingText}>({review.rating}/5)</span>
        </div>
      </div>
    );
  };

  // Render Ranked List
  const renderRankedList = () => {
    if (post.type !== 'ranked_list' || !post.ranked_list_data) return null;
    const list = post.ranked_list_data;
    return (
      <div style={styles.rankedList}>
        {list.items.map((item, idx) => (
          <div key={idx} style={styles.rankedItem}>
            <div style={styles.rankedNumber}>#{item.rank}</div>
            <div style={styles.rankedContent}>
              <div style={styles.rankedTitle}>{item.title}</div>
              {item.description && <div style={styles.rankedDesc}>{item.description}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Poll
  const renderPoll = () => {
    if (post.type !== 'poll' || !post.poll_data) return null;
    const poll = post.poll_data;
    const totalVotes = poll.totalVotes || 0;
    const userVoteOption = post.user_poll_vote;
    
    return (
      <div className="poll-wrap">
        {poll.options.map((opt, i) => {
          const pct = totalVotes === 0 ? 0 : Math.round((opt.votes || 0) / totalVotes * 100);
          return (
            <div key={i} className={`poll-option ${userVoteOption !== null ? 'voted' : ''}`}>
              <div className="poll-bar" style={{ width: `${pct}%` }}></div>
              <div className="poll-circle"></div>
              <div className="poll-text">{opt.text}</div>
              <div className="poll-pct">{userVoteOption !== null ? pct + '%' : '—'}</div>
            </div>
          );
        })}
        <div className="poll-meta">{fmt(totalVotes)} votes · {userVoteOption !== null ? 'Results shown' : 'Tap to vote'}</div>
      </div>
    );
  };

  // Render Townhall Bars
  const renderTownhall = () => {
    if (post.type !== 'townhall') return null;
    const total = (post.votes || 0) + (post.dn || 0);
    const pctA = total === 0 ? 50 : Math.round((post.votes || 0) / total * 100);
    const pctB = total === 0 ? 50 : Math.round((post.dn || 0) / total * 100);
    
    return (
      <div className="vbars">
        <div className="vbrow">
          <div className="vblabel">{post.sideA || 'Side A'}</div>
          <div className="vbtrack">
            <div className="vbfill" style={{ width: `${pctA}%`, background: 'var(--grad-ember)' }}></div>
          </div>
          <div className="vbpct">{pctA}%</div>
        </div>
        <div className="vbrow">
          <div className="vblabel">{post.sideB || 'Side B'}</div>
          <div className="vbtrack">
            <div className="vbfill" style={{ width: `${pctB}%`, background: 'var(--blue)' }}></div>
          </div>
          <div className="vbpct">{pctB}%</div>
        </div>
        <div style={{ fontSize: '.68rem', color: 'var(--text3)', paddingTop: '.25rem' }}>
          {fmt(total)} votes cast · live
        </div>
      </div>
    );
  };

  const vStatus = () => {
    if (post.verified === 'verified') return { cls: 'bv', lbl: '✅ Verified' };
    if (post.verified === 'false') return { cls: 'bf', lbl: '❌ False' };
    if (post.verified === 'misleading') return { cls: 'bf', lbl: '⚠️ Misleading' };
    if (post.flagged) return { cls: 'bf', lbl: '🔍 Under Review' };
    return null;
  };

  const vs = vStatus();
  const userOwnedStickers = stickers.filter(s => userStickers.some(us => us.sticker_id === s.id));

  return (
    <div className="card">
      {/* Header */}
      <div className="ch">
        <div className="av" style={{ background: post.avatar_color || '#E8531F' }}>
          {ini(post.username)}
        </div>
        <div className="ch-main">
          <div className="puser">
            {post.username}
            {isScholar && <span className="schip">🧠 Scholar</span>}
          </div>
          <div className="pcirc">{circle.icon} {circle.name}</div>
        </div>
        <div className="ptime">{ago(post.created_at)}</div>
      </div>

      {/* Badges */}
      <div className="badge-row">
        <span className={`pbadge ${getBadgeClass(post.type)}`}>
          {getBadgeLabel(post.type)}
        </span>
        {post.category && post.type === 'text' && (
          <span className="pbadge br" style={{ background: 'rgba(0,201,177,0.1)' }}>
            #{post.category}
          </span>
        )}
        {post.is_boosted && new Date(post.boost_expires_at) > new Date() && (
          <span className="pbadge" style={{ background: 'rgba(245,166,35,0.2)', color: '#F5A623' }}>
            🚀 Boosted
          </span>
        )}
        {vs && <span className={`pbadge ${vs.cls}`}>{vs.lbl}</span>}
      </div>

      {/* Content */}
      <div className="ptitle">{esc(post.title)}</div>
      {post.body && <div className="pbody">{esc(post.body)}</div>}
      
      {renderImage()}
      {renderReview()}
      {renderRankedList()}
      {renderPoll()}
      {renderTownhall()}

      {/* Star Rating */}
      <div className="star-row">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${userStar ? (star <= userStar ? 'filled' : '') : (starAvg >= star ? 'filled' : '')}`}
            onClick={() => !userStar && handleRate(star)}
          >
            ★
          </span>
        ))}
        <span className="star-count">{starAvg > 0 ? starAvg.toFixed(1) : '—'} ({starCount})</span>
      </div>

      {/* Actions */}
      <div className="pacts">
        <button className={`abtn ${userVote === 'up' ? 'vup' : ''}`} onClick={() => handleVote('up')}>
          ▲ <span>{fmt(votes)}</span>
        </button>
        <button className={`abtn ${userVote === 'down' ? 'vdn' : ''}`} onClick={() => handleVote('down')}>
          ▼ <span>{fmt(dns)}</span>
        </button>
        <button className="abtn" onClick={() => setShowComments(!showComments)}>
          💬 <span>{post.comment_count || comments.length}</span>
        </button>
        <button className="abtn" onClick={handleBoost} style={{ color: '#F5A623' }}>
          🚀 Boost
        </button>
        <button className="abtn" onClick={() => setShowStickerPicker(!showStickerPicker)} style={{ color: '#00C9B1' }}>
          🎨 Sticker
        </button>
        <button className={`flbtn ${post.user_flagged ? 'flagged' : ''}`} onClick={handleFlag}>
          🔍 Flag
        </button>
        <button className="abtn" onClick={() => toast.success('Link copied!')}>
          ↗
        </button>
      </div>

      {/* Sticker Picker */}
      {showStickerPicker && (
        <div style={styles.stickerPicker}>
          <div style={styles.stickerPickerHeader}>
            <span>Choose a sticker</span>
            <button onClick={() => setShowStickerPicker(false)} style={styles.closePicker}>✕</button>
          </div>
          <div style={styles.stickerGrid}>
            {userOwnedStickers.map(sticker => (
              <button
                key={sticker.id}
                onClick={() => handleUseSticker(sticker.id)}
                style={styles.stickerOption}
              >
                <span style={styles.stickerIcon}>{sticker.icon}</span>
                <span style={styles.stickerName}>{sticker.name}</span>
              </button>
            ))}
            {userOwnedStickers.length === 0 && (
              <div style={styles.noStickers}>No stickers owned. Buy some from the Wallet!</div>
            )}
          </div>
        </div>
      )}

      {/* Comments */}
      {showComments && (
        <div className="csec">
          <div className="cir">
            <input
              className="cin"
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              onKeyPress={(e) => e.key === 'Enter' && handleComment()}
            />
            <button className="bsm" onClick={handleComment}>Reply +4</button>
          </div>
          <div>
            {comments.length === 0 ? (
              <div className="cempty">No comments yet — be first!</div>
            ) : (
              comments.map(c => (
                <div key={c.id} className="citem">
                  <div className="cav" style={{ background: c.avatar_color || '#E8531F' }}>{ini(c.username)}</div>
                  <div>
                    <div className="cmeta">
                      {c.username} <span className="cmeta-time">{ago(c.created_at)}</span>
                    </div>
                    <div className="ctext">{c.text}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  postImage: { marginBottom: '1rem' },
  image: { maxWidth: '100%', maxHeight: '300px', borderRadius: '12px', objectFit: 'cover' },
  reviewCard: {
    background: 'rgba(245,166,35,0.05)',
    border: '1px solid rgba(245,166,35,0.15)',
    borderRadius: '12px',
    padding: '1rem',
    marginBottom: '1rem',
  },
  reviewHeader: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' },
  reviewType: { fontSize: '1.2rem' },
  reviewItemName: { fontSize: '0.9rem', fontWeight: 600, color: '#F5A623' },
  reviewRating: { display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '1rem' },
  reviewRatingText: { fontSize: '0.7rem', color: 'rgba(245,242,236,0.36)', marginLeft: '0.5rem' },
  rankedList: {
    background: 'rgba(124,58,237,0.05)',
    border: '1px solid rgba(124,58,237,0.15)',
    borderRadius: '12px',
    padding: '1rem',
    marginBottom: '1rem',
  },
  rankedItem: { display: 'flex', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  rankedNumber: { fontSize: '1.1rem', fontWeight: 700, color: '#7C3AED', minWidth: '40px' },
  rankedContent: { flex: 1 },
  rankedTitle: { fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' },
  rankedDesc: { fontSize: '0.75rem', color: 'rgba(245,242,236,0.62)' },
  stickerPicker: {
    marginTop: '0.5rem',
    padding: '0.5rem',
    background: '#1a1a2e',
    border: '1px solid rgba(232,83,31,0.3)',
    borderRadius: '12px',
  },
  stickerPickerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  closePicker: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem' },
  stickerGrid: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem' },
  stickerOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0.5rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    cursor: 'pointer',
    minWidth: '60px',
  },
  stickerIcon: { fontSize: '1.5rem' },
  stickerName: { fontSize: '0.6rem', marginTop: '0.25rem', color: 'rgba(245,242,236,0.62)' },
  noStickers: { textAlign: 'center', padding: '1rem', color: 'rgba(245,242,236,0.36)' },
};

export default PostCard;