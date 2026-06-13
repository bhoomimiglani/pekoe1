import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const CoinFlip = () => {
  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState(null);
  const [flipping, setFlipping] = useState(false);
  const { flipCoin } = useApp();

  const handleFlip = async () => {
    if (!choice) {
      alert('Select Heads or Tails first!');
      return;
    }
    if (bet < 5 || bet > 100) {
      alert('Bet must be between 5 and 100 PëKs');
      return;
    }
    setFlipping(true);
    await flipCoin(bet, choice);
    setTimeout(() => setFlipping(false), 800);
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>🪙 Coin Flip</h3>
      <p style={styles.desc}>Double or nothing! Bet 5-100 PëKs on Heads or Tails.</p>
      <div style={styles.coinContainer}>
        <div style={{ ...styles.coin, animation: flipping ? 'coinFlip 0.6s ease-in-out' : 'none' }}>
          <div style={styles.coinInner}>🪙</div>
        </div>
      </div>
      <input
        type="number"
        value={bet}
        onChange={(e) => setBet(Math.min(100, Math.max(5, parseInt(e.target.value) || 5)))}
        style={styles.input}
        min="5"
        max="100"
      />
      <div style={styles.choiceBtns}>
        <button onClick={() => setChoice('heads')} style={styles.choiceBtn(choice === 'heads')}>🪙 Heads</button>
        <button onClick={() => setChoice('tails')} style={styles.choiceBtn(choice === 'tails')}>🪙 Tails</button>
      </div>
      <button onClick={handleFlip} disabled={flipping} style={styles.flipBtn}>
        {flipping ? 'Flipping...' : 'Flip Coin!'}
      </button>
    </div>
  );
};

const styles = {
  card: {
    background: 'linear-gradient(145deg, rgba(17,17,30,0.95), rgba(11,11,22,0.98))',
    border: '1px solid rgba(255,255,255,0.055)',
    borderRadius: '16px',
    padding: '1.5rem',
    textAlign: 'center',
  },
  title: { fontFamily: "'Syne', sans-serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' },
  desc: { fontSize: '0.8rem', color: 'rgba(245,242,236,0.62)', marginBottom: '1rem' },
  coinContainer: { width: '120px', height: '120px', margin: '1rem auto' },
  coin: { width: '100%', height: '100%', cursor: 'pointer' },
  coinInner: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FFD700, #DAA520)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3rem',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    margin: '0.5rem 0',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#F5F2EC',
    fontSize: '1rem',
  },
  choiceBtns: { display: 'flex', gap: '1rem', margin: '1rem 0' },
  choiceBtn: (active) => ({
    flex: 1,
    padding: '0.6rem',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: active ? 'rgba(232,83,31,0.2)' : 'rgba(255,255,255,0.05)',
    color: active ? '#E8531F' : '#F5F2EC',
    fontWeight: 600,
    cursor: 'pointer',
  }),
  flipBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #E8531F 0%, #7C3AED 100%)',
    border: 'none',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
};

// Add keyframes
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes coinFlip {
    0% { transform: rotateY(0deg); }
    100% { transform: rotateY(720deg); }
  }
`;
document.head.appendChild(styleSheet);

export default CoinFlip;