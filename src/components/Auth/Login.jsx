import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || username.length < 2) {
      alert('Username must be at least 2 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]{2,24}$/.test(username)) {
      alert('Username must be 2-24 characters (letters, numbers, underscore only)');
      return;
    }
    setLoading(true);
    const result = await login(username, email);
    setLoading(false);
    if (!result.success) {
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.orb1}></div>
      <div style={styles.orb2}></div>
      <div style={styles.orb3}></div>
      
      <div style={styles.loginCard}>
        <div style={styles.leftPanel}>
          <h1 style={styles.logo}>PëKœ</h1>
          <p style={styles.tagline}>India's communal third space — where every voice finds its platform and its reward.</p>
          <ul style={styles.features}>
            <li>🔥 <strong>Hot Takes</strong> — timed debates that matter</li>
            <li>⚔️ <strong>Townhall</strong> — live Side A vs Side B</li>
            <li>✦ <strong>PëKs</strong> — earn for posts, votes &amp; verify</li>
          </ul>
          <div style={styles.trustBadge}>
            <span>🔴 <strong>12K+</strong> online</span>
            <span style={styles.dot}>·</span>
            <span>🎁 <strong>100</strong> PëKs welcome bonus</span>
          </div>
        </div>
        
        <div style={styles.rightPanel}>
          <h2 style={styles.formTitle}>Join the conversation</h2>
          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              placeholder="e.g. priya_blr"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              maxLength="24"
              required
            />
            <label style={styles.label}>Email <span style={styles.optional}>(optional)</span></label>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'Signing in...' : 'Enter PëKœ →'}
            </button>
          </form>
          <p style={styles.bonus}>🎁 New members: <strong>100 PëKs</strong> + Founder badge</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    background: '#06060C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    overflow: 'auto',
  },
  orb1: {
    position: 'absolute',
    width: '420px',
    height: '420px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(232,83,31,0.35), transparent 70%)',
    top: '10%',
    left: '15%',
    animation: 'orbFloat 8s ease-in-out infinite',
  },
  orb2: {
    position: 'absolute',
    width: '320px',
    height: '320px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,0.28), transparent 70%)',
    bottom: '15%',
    right: '10%',
    animation: 'orbFloat 11s ease-in-out infinite reverse',
  },
  orb3: {
    position: 'absolute',
    width: '260px',
    height: '260px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,201,177,0.2), transparent 70%)',
    top: '55%',
    left: '55%',
    animation: 'orbFloat 14s ease-in-out infinite',
  },
  loginCard: {
    position: 'relative',
    background: 'rgba(11,11,22,0.92)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: '1000px',
    width: '100%',
    backdropFilter: 'blur(48px)',
    overflow: 'hidden',
  },
  leftPanel: {
    flex: 1,
    padding: '2rem',
    minWidth: '250px',
  },
  rightPanel: {
    flex: 1,
    padding: '2rem',
    minWidth: '280px',
    background: 'rgba(0,0,0,0.2)',
  },
  logo: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '3rem',
    fontWeight: 800,
    letterSpacing: '-0.06em',
    background: 'linear-gradient(135deg, #fff 0%, #FFC857 50%, #E8531F 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '1rem',
  },
  tagline: {
    fontSize: '0.9rem',
    color: 'rgba(245,242,236,0.62)',
    lineHeight: '1.5',
    marginBottom: '1.5rem',
  },
  features: {
    listStyle: 'none',
    marginBottom: '1.5rem',
  },
  trustBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.65rem 1rem',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.055)',
    fontSize: '0.78rem',
    fontFamily: "'JetBrains Mono', monospace",
  },
  dot: { opacity: 0.4 },
  formTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '1.2rem',
    fontWeight: 700,
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    fontSize: '0.74rem',
    fontWeight: 700,
    color: 'rgba(245,242,236,0.62)',
    marginBottom: '0.5rem',
  },
  optional: {
    color: 'rgba(245,242,236,0.36)',
    fontWeight: 'normal',
  },
  input: {
    width: '100%',
    padding: '0.85rem 1rem',
    borderRadius: '12px',
    border: '1.5px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)',
    color: '#F5F2EC',
    fontSize: '0.9rem',
    marginBottom: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '0.85rem',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #E8531F 0%, #7C3AED 100%)',
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'all 0.3s',
  },
  bonus: {
    marginTop: '1.25rem',
    padding: '0.75rem',
    borderRadius: '12px',
    background: 'rgba(0,201,177,0.06)',
    border: '1px solid rgba(0,201,177,0.18)',
    fontSize: '0.74rem',
    color: '#00C9B1',
    textAlign: 'center',
  },
};

// Add keyframes for animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes orbFloat {
    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.7; }
    50% { transform: translate(24px, -18px) scale(1.08); opacity: 1; }
  }
`;
document.head.appendChild(styleSheet);

export default Login;