import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const PostModal = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [circleId, setCircleId] = useState('india');
  const [postType, setPostType] = useState('text');
  const [category, setCategory] = useState('general');
  const [imageUrl, setImageUrl] = useState('');
  const [sideA, setSideA] = useState('');
  const [sideB, setSideB] = useState('');
  const [pollOptions, setPollOptions] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Review specific
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewItemType, setReviewItemType] = useState('movie');
  const [reviewItemName, setReviewItemName] = useState('');
  
  // Ranked List specific
  const [listItems, setListItems] = useState([{ rank: 1, title: '', description: '' }]);
  
  const { circles, createPost } = useApp();

  const addListItem = () => {
    setListItems([...listItems, { rank: listItems.length + 1, title: '', description: '' }]);
  };

  const updateListItem = (index, field, value) => {
    const updated = [...listItems];
    updated[index][field] = value;
    setListItems(updated);
  };

  const removeListItem = (index) => {
    const updated = listItems.filter((_, i) => i !== index);
    updated.forEach((item, i) => item.rank = i + 1);
    setListItems(updated);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;

    let poll_data = null;
    if (postType === 'poll') {
      const opts = pollOptions.split('\n').filter(o => o.trim());
      if (opts.length < 2) return;
      poll_data = {
        options: opts.map(o => ({ text: o.trim(), votes: 0 })),
        totalVotes: 0
      };
    }

    let review_data = null;
    if (postType === 'review') {
      review_data = {
        rating: reviewRating,
        itemType: reviewItemType,
        itemName: reviewItemName
      };
    }

    let ranked_list_data = null;
    if (postType === 'ranked_list') {
      const validItems = listItems.filter(item => item.title.trim());
      if (validItems.length < 2) return;
      ranked_list_data = { items: validItems };
    }

    const postData = {
      id: Math.random().toString(36).substr(2, 9),
      type: postType,
      circle_id: circleId,
      title: title.trim(),
      body: body.trim(),
      category: postType === 'text' ? category : null,
      sideA: postType === 'townhall' ? sideA : null,
      sideB: postType === 'townhall' ? sideB : null,
      poll_data,
      reviewData: review_data,
      rankedListData: ranked_list_data,
      imageUrl: imageUrl.trim(),
      isAnonymous
    };

    setLoading(true);
    const success = await createPost(postData);
    setLoading(false);
    
    if (success) {
      // Reset form
      setTitle('');
      setBody('');
      setCircleId('india');
      setPostType('text');
      setCategory('general');
      setImageUrl('');
      setSideA('');
      setSideB('');
      setPollOptions('');
      setIsAnonymous(false);
      setReviewRating(5);
      setReviewItemType('movie');
      setReviewItemName('');
      setListItems([{ rank: 1, title: '', description: '' }]);
      onClose();
    }
  };

  if (!isOpen) return null;

  const categories = ['general', 'technology', 'politics', 'sports', 'entertainment', 'business', 'health', 'education'];

  return (
    <div onClick={onClose} style={styles.overlay}>
      <div onClick={(e) => e.stopPropagation()} style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>Create a Post</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        <div style={styles.body}>
          <p style={styles.label}>Post type</p>
          <div style={styles.typeSelector}>
            <button onClick={() => setPostType('text')} style={styles.typeBtn(postType === 'text')}>📝 Text Post</button>
            <button onClick={() => setPostType('hot')} style={styles.typeBtn(postType === 'hot')}>🔥 Hot Take</button>
            <button onClick={() => setPostType('poll')} style={styles.typeBtn(postType === 'poll')}>📊 Poll</button>
            <button onClick={() => setPostType('review')} style={styles.typeBtn(postType === 'review')}>⭐ Review</button>
            <button onClick={() => setPostType('ranked_list')} style={styles.typeBtn(postType === 'ranked_list')}>📋 Ranked List</button>
            <button onClick={() => setPostType('townhall')} style={styles.typeBtn(postType === 'townhall')}>⚔️ Townhall</button>
          </div>

          <label style={styles.label}>Circle</label>
          <select value={circleId} onChange={(e) => setCircleId(e.target.value)} style={styles.select}>
            {circles.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>

          {postType === 'text' && (
            <>
              <label style={styles.label}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.select}>
                {categories.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </>
          )}

          <label style={styles.label}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's your take?"
            maxLength="200"
            style={styles.input}
          />

          {(postType === 'text' || postType === 'hot' || postType === 'review') && (
            <>
              <label style={styles.label}>Body <span style={styles.labelHint}>(150 words max)</span></label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Add more context…"
                rows="5"
                style={styles.textarea}
                maxLength="1000"
              />
            </>
          )}

          {(postType === 'text' || postType === 'review') && (
            <>
              <label style={styles.label}>Image URL <span style={styles.labelHint}>(optional - 1 image/GIF)</span></label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                style={styles.input}
              />
            </>
          )}

          {postType === 'review' && (
            <>
              <label style={styles.label}>Item Type</label>
              <select value={reviewItemType} onChange={(e) => setReviewItemType(e.target.value)} style={styles.select}>
                <option value="movie">🎬 Movie</option>
                <option value="book">📚 Book</option>
                <option value="product">🛍️ Product</option>
                <option value="music">🎵 Music</option>
                <option value="game">🎮 Game</option>
              </select>

              <label style={styles.label}>Item Name</label>
              <input
                type="text"
                value={reviewItemName}
                onChange={(e) => setReviewItemName(e.target.value)}
                placeholder="e.g., Oppenheimer, Atomic Habits"
                style={styles.input}
              />

              <label style={styles.label}>Rating (1-5)</label>
              <div style={styles.ratingSelector}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    onClick={() => setReviewRating(star)}
                    style={styles.reviewStar(star <= reviewRating)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </>
          )}

          {postType === 'ranked_list' && (
            <>
              <label style={styles.label}>Ranked List Items</label>
              {listItems.map((item, index) => (
                <div key={index} style={styles.listItem}>
                  <span style={styles.listRank}>#{item.rank}</span>
                  <div style={styles.listItemFields}>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateListItem(index, 'title', e.target.value)}
                      placeholder="Item title"
                      style={styles.listInput}
                    />
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateListItem(index, 'description', e.target.value)}
                      placeholder="Description (optional)"
                      style={styles.listInput}
                    />
                  </div>
                  <button onClick={() => removeListItem(index)} style={styles.removeBtn}>✕</button>
                </div>
              ))}
              <button onClick={addListItem} style={styles.addBtn}>+ Add Item</button>
            </>
          )}

          {postType === 'townhall' && (
            <>
              <label style={styles.label}>Side A label</label>
              <input type="text" value={sideA} onChange={(e) => setSideA(e.target.value)} placeholder="e.g. Bengaluru" style={styles.input} />
              <label style={styles.label}>Side B label</label>
              <input type="text" value={sideB} onChange={(e) => setSideB(e.target.value)} placeholder="e.g. Mumbai" style={styles.input} />
            </>
          )}

          {postType === 'poll' && (
            <label style={styles.label}>Poll options (one per line, 2–4 options)</label>
          )}
          {postType === 'poll' && (
            <textarea
              value={pollOptions}
              onChange={(e) => setPollOptions(e.target.value)}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
              rows="4"
              style={styles.textarea}
            />
          )}

          <div style={styles.anonymousCheckbox}>
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            <label htmlFor="anonymous">🎭 Post anonymously (hide my username)</label>
          </div>

          <div style={styles.footer}>
            <p style={styles.earn}>✦ Earn +5 PëKs for posting</p>
            <button onClick={handleSubmit} disabled={loading} style={styles.submitBtn}>
              {loading ? 'Publishing…' : 'Post it →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    zIndex: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(12px)',
  },
  modal: {
    background: 'linear-gradient(145deg, rgba(13,13,28,0.98), rgba(9,9,22,0.98))',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    width: 'min(650px, 93vw)',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 40px 100px rgba(0,0,0,0.65)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.3rem 1.6rem',
    borderBottom: '1px solid rgba(255,255,255,0.055)',
    position: 'sticky',
    top: 0,
    background: 'rgba(11,11,22,0.97)',
    zIndex: 1,
  },
  headerTitle: { fontFamily: "'Syne', sans-serif", fontSize: '1.05rem', fontWeight: 700 },
  closeBtn: { background: 'none', border: 'none', color: 'rgba(245,242,236,0.36)', fontSize: '1.5rem', cursor: 'pointer' },
  body: { padding: '1.6rem' },
  label: { fontSize: '0.74rem', fontWeight: 700, color: 'rgba(245,242,236,0.62)', marginBottom: '0.5rem', display: 'block' },
  labelHint: { color: 'rgba(245,242,236,0.36)', fontWeight: 400 },
  typeSelector: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.1rem' },
  typeBtn: (active) => ({
    padding: '0.45rem 0.9rem',
    borderRadius: '8px',
    border: '1.5px solid rgba(255,255,255,0.1)',
    background: active ? 'rgba(232,83,31,0.08)' : 'none',
    color: active ? '#E8531F' : 'rgba(245,242,236,0.62)',
    fontSize: '0.76rem',
    fontWeight: 600,
    cursor: 'pointer',
  }),
  select: {
    width: '100%',
    padding: '0.85rem 1.05rem',
    borderRadius: '12px',
    border: '1.5px solid rgba(255,255,255,0.1)',
    background: '#11111E',
    color: '#F5F2EC',
    fontSize: '0.88rem',
    marginBottom: '1.1rem',
  },
  input: {
    width: '100%',
    padding: '0.85rem 1.05rem',
    borderRadius: '12px',
    border: '1.5px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)',
    color: '#F5F2EC',
    fontSize: '0.88rem',
    marginBottom: '1.1rem',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '0.85rem 1.05rem',
    borderRadius: '12px',
    border: '1.5px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)',
    color: '#F5F2EC',
    fontSize: '0.88rem',
    marginBottom: '1.1rem',
    resize: 'vertical',
    outline: 'none',
    fontFamily: "'Manrope', sans-serif",
  },
  ratingSelector: { display: 'flex', gap: '0.5rem', marginBottom: '1.1rem' },
  reviewStar: (filled) => ({
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: filled ? '#FFC857' : 'rgba(255,255,255,0.2)',
    transition: 'all 0.2s',
  }),
  listItem: { display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' },
  listRank: { fontSize: '0.8rem', fontWeight: 'bold', color: '#F5A623', minWidth: '30px' },
  listItemFields: { flex: 1, display: 'flex', gap: '0.5rem', flexDirection: 'column' },
  listInput: {
    padding: '0.5rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)',
    color: '#F5F2EC',
    fontSize: '0.8rem',
    outline: 'none',
  },
  removeBtn: { background: 'rgba(239,68,68,0.2)', border: 'none', color: '#EF4444', borderRadius: '8px', padding: '0.3rem 0.6rem', cursor: 'pointer' },
  addBtn: { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', width: '100%', marginTop: '0.5rem' },
  anonymousCheckbox: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.055)' },
  earn: { fontSize: '0.73rem', color: '#00C9B1', fontWeight: 600, margin: 0 },
  submitBtn: {
    background: 'linear-gradient(135deg, #E8531F 0%, #7C3AED 100%)',
    border: 'none',
    color: '#fff',
    padding: '0.55rem 1.1rem',
    borderRadius: '8px',
    fontSize: '0.74rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
};

export default PostModal;