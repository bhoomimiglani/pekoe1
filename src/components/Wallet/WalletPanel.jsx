import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import { fmt } from '../../utils/helpers';
import toast from 'react-hot-toast';

const WalletPanel = () => {
  const { user, fetchProfile } = useApp();
  const { socket } = useApp();
  const [balance, setBalance] = useState(0);
  const [streakFreezes, setStreakFreezes] = useState(0);
  const [stickers, setStickers] = useState([]);
  const [userStickers, setUserStickers] = useState([]);
  const [activeBoosts, setActiveBoosts] = useState([]);
  const [recentTips, setRecentTips] = useState([]);
  const [communityFund, setCommunityFund] = useState(0);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState(10);
  const [tipMessage, setTipMessage] = useState('');
  const [tipRecipient, setTipRecipient] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWalletData();
    loadStickers();
    loadCommunityFund();
  }, []);

  // Live balance sync
  useEffect(() => {
    if (!socket) return;
    socket.on('balanceUpdate', (data) => {
      setBalance(data.peks);
    });
    return () => {
      socket.off('balanceUpdate');
    };
  }, [socket]);

  const loadWalletData = async () => {
    try {
      const res = await api.get('/api/user/balance');
      setBalance(res.data.balance);
      setStreakFreezes(res.data.streakFreezes);
      setActiveBoosts(res.data.activeBoosts || []);
      setRecentTips(res.data.recentTips || []);
    } catch (error) {
      console.error('Failed to load wallet data', error);
    }
  };

  const loadStickers = async () => {
    try {
      const res = await api.get('/api/stickers');
      setStickers(res.data || []);
      const userStickersRes = await api.get('/api/user/stickers');
      setUserStickers(userStickersRes.data || []);
    } catch (error) {
      console.error('Failed to load stickers', error);
    }
  };

  const loadCommunityFund = async () => {
    try {
      const res = await api.get('/api/community/fund');
      setCommunityFund(res.data.total || 0);
    } catch (error) {
      console.error('Failed to load community fund', error);
    }
  };

  const purchaseSticker = async (stickerId, price) => {
    if (balance < price) {
      toast.error('Insufficient PëKs!');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/stickers/buy', { stickerId });
      if (res.data.success) {
        toast.success(`Purchased sticker! -${price} PëKs`);
        await loadWalletData();
        await loadStickers();
        fetchProfile();
      }
    } catch (error) {
      toast.error('Failed to purchase sticker');
    } finally {
      setLoading(false);
    }
  };

  const purchaseStreakFreeze = async () => {
    if (balance < 50) {
      toast.error('Need 50 PëKs to purchase streak freeze');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/streak-freeze/buy');
      if (res.data.success) {
        toast.success(`Purchased streak freeze! -50 PëKs`);
        await loadWalletData();
        fetchProfile();
      }
    } catch (error) {
      toast.error('Failed to purchase streak freeze');
    } finally {
      setLoading(false);
    }
  };

  const sendTip = async () => {
    if (!tipRecipient || tipAmount < 1) {
      toast.error('Enter a valid username and amount');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/tip', { 
        recipientId: tipRecipient, 
        amount: tipAmount, 
        message: tipMessage 
      });
      if (res.data.success) {
        toast.success(`Tipped ${tipAmount} PëKs to ${tipRecipient}!`);
        setShowTipModal(false);
        setTipRecipient('');
        setTipAmount(10);
        setTipMessage('');
        await loadWalletData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send tip');
    } finally {
      setLoading(false);
    }
  };

  const purchaseAdFree = async () => {
    if (balance < 500) {
      toast.error('Need 500 PëKs for ad-free experience');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/ad-free/purchase');
      if (res.data.success) {
        toast.success(`Ad-free experience activated! -500 PëKs`);
        await loadWalletData();
      }
    } catch (error) {
      toast.error('Failed to purchase ad-free');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Balance Card */}
      <div style={styles.balanceCard}>
        <div style={styles.balanceIcon}>💰</div>
        <div style={styles.balanceAmount}>{fmt(balance)}</div>
        <div style={styles.balanceLabel}>PëKs Balance</div>
        <div style={styles.streakInfo}>
          🔥 {user?.streak || 0} day streak | 🧊 {streakFreezes} freezes
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Quick Actions</h3>
        <div style={styles.actionGrid}>
          <button onClick={() => setShowTipModal(true)} style={styles.actionBtn}>
            💝 Send Tip
          </button>
          <button onClick={purchaseStreakFreeze} style={styles.actionBtn} disabled={loading}>
            🧊 Buy Streak Freeze (50)
          </button>
          <button onClick={purchaseAdFree} style={styles.actionBtn} disabled={loading}>
            🚫 Ad-Free (500)
          </button>
        </div>
      </div>

      {/* Community Fund */}
      <div style={styles.fundCard}>
        <div style={styles.fundIcon}>🏘️</div>
        <div style={styles.fundAmount}>{fmt(communityFund)} PëKs</div>
        <div style={styles.fundLabel}>Community Fund</div>
        <p style={styles.fundDesc}>20% of all earnings go to the community!</p>
      </div>

      {/* Stickers Shop */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>🎨 Sticker Shop</h3>
        <div style={styles.stickerGrid}>
          {stickers.map(sticker => {
            const owned = userStickers.some(us => us.sticker_id === sticker.id);
            return (
              <div key={sticker.id} style={styles.stickerCard}>
                <div style={styles.stickerIcon}>{sticker.icon}</div>
                <div style={styles.stickerName}>{sticker.name}</div>
                <div style={styles.stickerPrice}>{sticker.price} PëKs</div>
                <button 
                  onClick={() => purchaseSticker(sticker.id, sticker.price)}
                  disabled={owned || loading}
                  style={styles.buyBtn(owned)}
                >
                  {owned ? '✓ Owned' : 'Buy'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Tips */}
      {recentTips.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>💝 Recent Tips Received</h3>
          {recentTips.map((tip, idx) => (
            <div key={idx} style={styles.tipItem}>
              <span>💝 +{tip.amount} PëKs</span>
              <span>{tip.message}</span>
              <span style={styles.tipTime}>{new Date(tip.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tip Modal */}
      {showTipModal && (
        <div style={styles.modalOverlay} onClick={() => setShowTipModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>💝 Send a Tip</h3>
            <input
              type="text"
              placeholder="Username to tip"
              value={tipRecipient}
              onChange={(e) => setTipRecipient(e.target.value)}
              style={styles.modalInput}
            />
            <input
              type="number"
              placeholder="Amount (1-1000 PëKs)"
              value={tipAmount}
              onChange={(e) => setTipAmount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
              style={styles.modalInput}
            />
            <input
              type="text"
              placeholder="Message (optional)"
              value={tipMessage}
              onChange={(e) => setTipMessage(e.target.value)}
              style={styles.modalInput}
            />
            <div style={styles.modalButtons}>
              <button onClick={() => setShowTipModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={sendTip} style={styles.sendBtn} disabled={loading}>
                {loading ? 'Sending...' : 'Send Tip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '800px', margin: '0 auto' },
  balanceCard: {
    background: 'linear-gradient(135deg, rgba(232,83,31,0.2), rgba(124,58,237,0.2))',
    borderRadius: '20px',
    padding: '2rem',
    textAlign: 'center',
    marginBottom: '1.5rem',
    border: '1px solid rgba(232,83,31,0.3)',
  },
  balanceIcon: { fontSize: '3rem', marginBottom: '0.5rem' },
  balanceAmount: { fontSize: '3rem', fontWeight: 800, color: '#F5A623', fontFamily: "'JetBrains Mono', monospace" },
  balanceLabel: { fontSize: '0.8rem', color: 'rgba(245,242,236,0.62)' },
  streakInfo: { marginTop: '0.5rem', fontSize: '0.75rem', color: '#00C9B1' },
  section: { background: 'rgba(17,17,30,0.95)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.055)' },
  sectionTitle: { fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' },
  actionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' },
  actionBtn: {
    background: 'linear-gradient(135deg, #E8531F 0%, #7C3AED 100%)',
    border: 'none',
    color: '#fff',
    padding: '0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  fundCard: {
    background: 'rgba(0,201,177,0.1)',
    borderRadius: '16px',
    padding: '1.5rem',
    textAlign: 'center',
    marginBottom: '1.5rem',
    border: '1px solid rgba(0,201,177,0.3)',
  },
  fundIcon: { fontSize: '2rem', marginBottom: '0.5rem' },
  fundAmount: { fontSize: '1.5rem', fontWeight: 700, color: '#00C9B1' },
  fundLabel: { fontSize: '0.7rem', color: 'rgba(245,242,236,0.62)' },
  fundDesc: { fontSize: '0.7rem', marginTop: '0.5rem', color: '#F5A623' },
  stickerGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' },
  stickerCard: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    padding: '1rem',
    textAlign: 'center',
    border: '1px solid rgba(255,255,255,0.055)',
  },
  stickerIcon: { fontSize: '2rem', marginBottom: '0.5rem' },
  stickerName: { fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' },
  stickerPrice: { fontSize: '0.7rem', color: '#F5A623', marginBottom: '0.5rem' },
  buyBtn: (owned) => ({
    width: '100%',
    padding: '0.4rem',
    borderRadius: '8px',
    border: 'none',
    background: owned ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg, #E8531F 0%, #7C3AED 100%)',
    color: owned ? '#10B981' : '#fff',
    fontSize: '0.7rem',
    fontWeight: 600,
    cursor: owned ? 'default' : 'pointer',
  }),
  tipItem: { display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.055)' },
  tipTime: { fontSize: '0.65rem', color: 'rgba(245,242,236,0.36)' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#1a1a2e', borderRadius: '16px', padding: '1.5rem', width: '90%', maxWidth: '400px', border: '1px solid rgba(232,83,31,0.3)' },
  modalTitle: { fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' },
  modalInput: { width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff' },
  modalButtons: { display: 'flex', gap: '1rem' },
  cancelBtn: { flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#fff', cursor: 'pointer' },
  sendBtn: { flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #E8531F 0%, #7C3AED 100%)', color: '#fff', cursor: 'pointer' },
};

export default WalletPanel;