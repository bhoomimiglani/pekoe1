import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { fmt, ini } from '../../utils/helpers';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const { fetchLeaderboard, user, socket } = useApp();

  const loadLeaderboard = async () => {
    const data = await fetchLeaderboard();
    setLeaderboard(data);
  };

  useEffect(() => {
    loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh leaderboard whenever any user's balance changes
  useEffect(() => {
    if (!socket) return;
    socket.on('balanceUpdate', () => {
      loadLeaderboard();
    });
    return () => {
      socket.off('balanceUpdate');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  return (
    <div className="lb-panel">
      <div className="lb-title">🏆 Top Members — All Time</div>
      <div id="lb-list">
        {leaderboard.map((u, i) => {
          const rank = i + 1;
          const crown = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
          return (
            <div key={u.name} className={`lb-row ${u.name === user?.username ? 'me' : ''}`}>
              <div className="lb-rank">{crown}</div>
              <div className="lb-av" style={{ background: u.av }}>{ini(u.name)}</div>
              <div style={{ flex: 1 }}>
                <div className="lb-name">{u.name}</div>
              </div>
              <div className="lb-peks">{fmt(u.peks)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeaderboardPage;