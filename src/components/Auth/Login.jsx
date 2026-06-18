import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../services/supabaseClient';
import api from '../../services/api';

const Login = () => {
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, setUser, setToken } = useApp();

  // Handle Google OAuth callback — Supabase redirects back here after Google login
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session && session.user) {
        const googleUser = session.user;
        const rawName = googleUser.user_metadata?.full_name || googleUser.email || '';
        // Convert to valid username: letters/numbers/underscore, 2-24 chars
        const suggestedUsername = rawName
          .replace(/[^a-zA-Z0-9_]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')
          .slice(0, 24) || 'user';

        // Log in or register via our backend using Google identity
        try {
          const res = await api.post('/api/auth/google-login', {
            googleId: googleUser.id,
            email: googleUser.email,
            suggestedUsername,
            avatarUrl: googleUser.user_metadata?.avatar_url,
          });
          if (res.data.token) {
            localStorage.setItem('pk_token', res.data.token);
            api.defaults.headers.common['Authorization'] = res.data.token;
            setToken(res.data.token);
            setUser(res.data.user);
          }
        } catch (err) {
          console.error('Google login error:', err);
        }
      }
    };

    handleOAuthCallback();

    // Listen for auth state changes (handles the redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          handleOAuthCallback();
        }
      }
    );
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      alert('Google login failed: ' + error.message);
      setGoogleLoading(false);
    }
    // If no error, browser redirects to Google — no further action needed
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || username.length < 2) {
      alert('Username must be at least 2 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]{2,24}$/.test(username)) {
      alert('Username: 2-24 characters, letters/numbers/underscore only');
      return;
    }
    setLoading(true);
    const result = await login(username, email);
    setLoading(false);
    if (!result.success) alert('Login failed. Please try again.');
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Left — brand */}
        <div style={s.left}>
          <div style={s.logo}>PëKœ</div>
          <p style={s.tagline}>
            India's communal third space — where every voice finds its platform and its reward.
          </p>
          <div style={s.features}>
            <div style={s.feat}><span>🔥</span><div><strong>Hot Takes</strong><br /><span style={s.featSub}>Timed debates that matter</span></div></div>
            <div style={s.feat}><span>⚔️</span><div><strong>Townhall</strong><br /><span style={s.featSub}>Live Side A vs Side B</span></div></div>
            <div style={s.feat}><span>✦</span><div><strong>PëKs</strong><br /><span style={s.featSub}>Earn for posts, votes & verify</span></div></div>
          </div>
          <div style={s.trust}>
            <span>🔴 <strong>12K+</strong> online</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>🎁 <strong>100</strong> PëKs welcome bonus</span>
          </div>
        </div>

        {/* Right — form */}
        <div style={s.right}>
          <h2 style={s.formTitle}>Join the conversation</h2>

          {/* Tabs */}
          <div style={s.tabs}>
            <button style={s.tab(tab === 'login')} onClick={() => setTab('login')}>Sign In</button>
            <button style={s.tab(tab === 'signup')} onClick={() => setTab('signup')}>Create Account</button>
          </div>

          {/* Google Auth */}
          <button style={s.googleBtn} onClick={handleGoogleLogin} disabled={googleLoading}>
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 8 }}>
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
            </svg>
            {googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
          </button>

          <div style={s.divider}><span style={s.dividerText}>or</span></div>

          <form onSubmit={handleSubmit}>
            <label style={s.label}>Username</label>
            <input
              type="text" placeholder="e.g. priya_blr"
              value={username} onChange={e => setUsername(e.target.value)}
              style={s.input} maxLength="24" required
            />
            <label style={s.label}>
              Email {tab === 'login' && <span style={s.opt}>(optional)</span>}
            </label>
            <input
              type="email" placeholder="you@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
              style={s.input}
              required={tab === 'signup'}
            />
            <button type="submit" style={s.submitBtn} disabled={loading}>
              {loading ? 'Signing in…' : tab === 'signup' ? 'Create Account →' : 'Enter PëKœ →'}
            </button>
          </form>

          <p style={s.bonus}>🎁 New members: <strong>100 PëKs</strong> + Founder badge</p>
        </div>
      </div>
    </div>
  );
};

const s = {
  page: {
    minHeight: '100vh', background: '#FAFAF8',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
  },
  card: {
    background: '#fff', border: '1px solid rgba(26,26,24,0.1)',
    borderRadius: 20, display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
    maxWidth: 960, width: '100%',
    boxShadow: '0 4px 40px rgba(0,0,0,0.08)',
  },
  left: {
    flex: 1, padding: '2.5rem 2rem', minWidth: 260,
    background: '#FAFAF8', borderRadius: '20px 0 0 20px',
    borderRight: '1px solid rgba(26,26,24,0.08)',
  },
  logo: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '2.5rem', fontWeight: 800, color: '#C8401A',
    letterSpacing: '-0.04em', marginBottom: '1rem',
  },
  tagline: {
    fontFamily: "'Source Serif 4', Georgia, serif",
    fontSize: '0.95rem', color: '#4A4845', lineHeight: 1.7, marginBottom: '1.5rem',
  },
  features: { display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.5rem' },
  feat: { display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.85rem', fontWeight: 500 },
  featSub: { fontSize: '0.75rem', color: '#8A8680', fontWeight: 400 },
  trust: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.6rem 0.9rem', borderRadius: 10,
    background: 'rgba(200,64,26,0.05)', border: '1px solid rgba(200,64,26,0.12)',
    fontSize: '0.76rem', color: '#4A4845',
  },
  right: { flex: 1, padding: '2.5rem 2rem', minWidth: 280 },
  formTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem', color: '#1A1A18',
  },
  tabs: { display: 'flex', gap: 0, marginBottom: '1.25rem', border: '1px solid rgba(26,26,24,0.1)', borderRadius: 10, overflow: 'hidden' },
  tab: (active) => ({
    flex: 1, padding: '0.6rem', border: 'none', cursor: 'pointer',
    background: active ? '#C8401A' : '#fff',
    color: active ? '#fff' : '#8A8680',
    fontWeight: active ? 600 : 400, fontSize: '0.83rem', transition: 'all 0.15s',
  }),
  googleBtn: {
    width: '100%', padding: '0.75rem', borderRadius: 10,
    border: '1px solid rgba(26,26,24,0.15)', background: '#fff',
    color: '#1A1A18', fontSize: '0.85rem', fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', marginBottom: '1rem', transition: 'background 0.15s',
  },
  divider: { position: 'relative', textAlign: 'center', margin: '0.75rem 0' },
  dividerText: {
    background: '#fff', padding: '0 0.75rem',
    fontSize: '0.75rem', color: '#B8B4AE',
    position: 'relative', zIndex: 1,
  },
  label: { display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#4A4845', marginBottom: '0.4rem' },
  opt: { color: '#B8B4AE', fontWeight: 400 },
  input: {
    width: '100%', padding: '0.75rem 1rem', borderRadius: 10,
    border: '1px solid rgba(26,26,24,0.12)', background: '#FAFAF8',
    color: '#1A1A18', fontSize: '0.88rem', marginBottom: '1rem',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
  },
  submitBtn: {
    width: '100%', padding: '0.8rem', borderRadius: 10, border: 'none',
    background: '#C8401A', color: '#fff', fontSize: '0.88rem',
    fontWeight: 700, cursor: 'pointer', marginTop: '0.25rem',
    transition: 'background 0.15s',
  },
  bonus: {
    marginTop: '1.1rem', padding: '0.65rem', borderRadius: 10,
    background: 'rgba(13,122,110,0.05)', border: '1px solid rgba(13,122,110,0.15)',
    fontSize: '0.73rem', color: '#0D7A6E', textAlign: 'center',
  },
};

export default Login;
