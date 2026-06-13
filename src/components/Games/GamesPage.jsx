import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import SpinWheel from './SpinWheel';
import CoinFlip from './CoinFlip';
import TicTacToe from './TicTacToe';
import Connect4 from './Connect4';
import api from '../../services/api';
import { fmt } from '../../utils/helpers';

const GamesPage = () => {
  const [activeGame, setActiveGame] = useState('spin');
  const { streakInfo, claimStreak, user, gameHistory, fetchGameHistory, fetchStreakInfo } = useApp();
  const [dailyLimit, setDailyLimit] = useState({ earnedToday: 0, remainingToday: 100, dailyLimit: 100 });

  useEffect(() => {
    fetchGameHistory();
    fetchStreakInfo();
    loadDailyLimit();
  }, []);

  const loadDailyLimit = async () => {
    try {
      const res = await api.get('/api/games/limit');
      setDailyLimit(res.data);
    } catch (error) {
      console.error('Failed to load daily limit', error);
    }
  };

  const games = [
    { id: 'spin', name: '🎡 Spin Wheel', icon: '🎡', component: SpinWheel },
    { id: 'coin', name: '🪙 Coin Flip', icon: '🪙', component: CoinFlip },
    { id: 'tictactoe', name: '🎮 Tic Tac Toe', icon: '❌', component: TicTacToe },
    { id: 'connect4', name: '🟡 Connect 4', icon: '🟡', component: Connect4 },
  ];

  const ActiveComponent = games.find(g => g.id === activeGame)?.component || SpinWheel;

  return (
    <div style={styles.container}>
      {/* Daily Limit Banner */}
      <div style={styles.limitBanner}>
        <div style={styles.limitIcon}>🎯</div>
        <div style={styles.limitContent}>
          <div style={styles.limitTitle}>Daily Game Earnings</div>
          <div style={styles.limitProgress}>
            <span>{fmt(dailyLimit.earnedToday)} / {fmt(dailyLimit.dailyLimit)} PëKs earned today</span>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${(dailyLimit.earnedToday / dailyLimit.dailyLimit) * 100}%` }}></div>
            </div>
            <span style={styles.limitRemaining}>✨ {fmt(dailyLimit.remainingToday)} PëKs remaining today</span>
          </div>
        </div>
      </div>

      {/* Streak Card */}
      <div style={styles.streakCard}>
        <h3 style={styles.cardTitle}>🔥 Daily Streak</h3>
        <div style={styles.streakDisplay}>
          <div style={styles.streakNumber}>{streakInfo?.streak || user?.streak || 0}</div>
          <div style={styles.streakLabel}>Day Streak</div>
        </div>
        <div style={styles.streakBonus}>Next reward: +{streakInfo?.nextBonus || 50} PëKs</div>
        <button onClick={claimStreak} style={styles.claimBtn}>
          {streakInfo?.claimedToday ? '✓ Claimed Today' : 'Claim Daily Reward'}
        </button>
      </div>

      {/* Game Selector */}
      <div style={styles.gameSelector}>
        {games.map(game => (
          <button
            key={game.id}
            onClick={() => setActiveGame(game.id)}
            style={styles.gameTab(activeGame === game.id)}
          >
            <span style={styles.gameTabIcon}>{game.icon}</span>
            <span>{game.name}</span>
          </button>
        ))}
      </div>

      {/* Active Game */}
      <div style={styles.gameContainer}>
        <ActiveComponent />
      </div>

      {/* Game History */}
      <div style={styles.historyCard}>
        <h3 style={styles.cardTitle}>📜 Game History</h3>
        <div style={styles.historyList}>
          {gameHistory.length === 0 ? (
            <div style={styles.noHistory}>No games played yet. Try your luck!</div>
          ) : (
            gameHistory.map((game, idx) => (
              <div key={idx} style={styles.historyItem}>
                <span>
                  {game.game_type === 'wheel' && '🎡 Spin Wheel'}
                  {game.game_type === 'coinflip' && '🪙 Coin Flip'}
                  {game.game_type === 'tictactoe' && '🎮 Tic Tac Toe'}
                  {game.game_type === 'connect4' && '🟡 Connect 4'}
                </span>
                <span className={game.prize > 0 ? 'history-win' : 'history-loss'} style={game.prize > 0 ? styles.win : styles.loss}>
                  {game.prize > 0 ? '+' : ''}{game.prize} PëKs
                </span>
                <span style={styles.historyTime}>{new Date(game.played_at).toLocaleTimeString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '900px', margin: '0 auto' },
  limitBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    background: 'linear-gradient(135deg, rgba(232,83,31,0.15), rgba(124,58,237,0.1))',
    borderRadius: '16px',
    padding: '1rem',
    marginBottom: '1.5rem',
    border: '1px solid rgba(232,83,31,0.3)',
  },
  limitIcon: { fontSize: '2rem' },
  limitContent: { flex: 1 },
  limitTitle: { fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' },
  limitProgress: { fontSize: '0.7rem', color: 'rgba(245,242,236,0.62)' },
  progressBar: { height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', margin: '0.3rem 0', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(135deg, #E8531F, #F5A623)', borderRadius: '3px', transition: 'width 0.3s' },
  limitRemaining: { color: '#00C9B1' },
  streakCard: {
    background: 'linear-gradient(135deg, rgba(245,166,35,0.1), rgba(232,83,31,0.05))',
    border: '1px solid rgba(245,166,35,0.3)',
    borderRadius: '16px',
    padding: '1.5rem',
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  cardTitle: { fontFamily: "'Syne', sans-serif", fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' },
  streakDisplay: { marginBottom: '0.5rem' },
  streakNumber: { fontSize: '3rem', fontWeight: 800, color: '#F5A623', fontFamily: "'JetBrains Mono', monospace" },
  streakLabel: { fontSize: '0.8rem', color: 'rgba(245,242,236,0.62)' },
  streakBonus: { fontSize: '0.9rem', color: '#00C9B1', marginTop: '0.5rem' },
  claimBtn: {
    background: 'linear-gradient(135deg, #F5A623, #E8531F)',
    border: 'none',
    color: 'white',
    padding: '0.6rem 1.2rem',
    borderRadius: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '0.75rem',
  },
  gameSelector: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' },
  gameTab: (active) => ({
    flex: 1,
    minWidth: '100px',
    padding: '0.75rem',
    background: active ? 'linear-gradient(135deg, #E8531F, #7C3AED)' : 'rgba(255,255,255,0.03)',
    border: active ? 'none' : '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: active ? '#fff' : 'rgba(245,242,236,0.62)',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  }),
  gameTabIcon: { fontSize: '1.2rem' },
  gameContainer: { marginBottom: '1.5rem' },
  historyCard: {
    background: 'linear-gradient(145deg, rgba(17,17,30,0.95), rgba(11,11,22,0.98))',
    border: '1px solid rgba(255,255,255,0.055)',
    borderRadius: '16px',
    padding: '1.5rem',
  },
  historyList: { maxHeight: '300px', overflowY: 'auto' },
  historyItem: { display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.055)', fontSize: '0.75rem' },
  win: { color: '#10B981' },
  loss: { color: '#EF4444' },
  historyTime: { color: 'rgba(245,242,236,0.36)' },
  noHistory: { textAlign: 'center', padding: '1rem', color: 'rgba(245,242,236,0.36)' },
};

export default GamesPage;