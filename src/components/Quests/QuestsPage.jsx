import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DAILY_QUESTS = [
  { id: 'q_post', icon: '✍️', name: 'Post something', desc: 'Create 1 post', target: 1, stat: 'posts', reward: 30 },
  { id: 'q_vote', icon: '▲', name: 'Upvote 3 posts', desc: 'Vote on content', target: 3, stat: 'votes', reward: 20 },
  { id: 'q_comment', icon: '💬', name: 'Comment twice', desc: 'Join the conversation', target: 2, stat: 'comments', reward: 25 },
  { id: 'q_ht', icon: '🔥', name: 'Vote on Hot Take', desc: 'Weigh in on 1 take', target: 1, stat: 'htvotes', reward: 20 },
  { id: 'q_th', icon: '⚔️', name: 'Join Townhall', desc: 'Vote in a debate', target: 1, stat: 'ths', reward: 25 },
  { id: 'q_game', icon: '🎮', name: 'Gamer', desc: 'Play a mini-game', target: 1, stat: 'games', reward: 15 }
];

const QuestsPage = () => {
  const { stats } = useApp();
  const [claimed, setClaimed] = useState(() => {
    try {
      const saved = localStorage.getItem('pk_quests_claimed');
      if (!saved) return {};
      const { date, quests } = JSON.parse(saved);
      const today = new Date().toISOString().split('T')[0];
      return date === today ? quests : {};
    } catch { return {}; }
  });

  const getProgress = (stat, target) => Math.min(stats[stat] || 0, target);
  const getPercentage = (stat, target) => Math.round(((stats[stat] || 0) / target) * 100);

  const claimReward = async (quest) => {
    const progress = getProgress(quest.stat, quest.target);
    if (progress < quest.target) {
      toast.error(`Complete the quest first! (${progress}/${quest.target})`);
      return;
    }
    if (claimed[quest.id]) {
      toast('Already claimed!', { icon: '✓' });
      return;
    }
    try {
      const res = await api.post('/api/user/quest-reward', { amount: quest.reward, reason: `Quest: ${quest.name} 🎯` });
      if (res.data.success) {
        const newClaimed = { ...claimed, [quest.id]: true };
        setClaimed(newClaimed);
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('pk_quests_claimed', JSON.stringify({ date: today, quests: newClaimed }));
        toast.success(`+${quest.reward} PëKs! Quest complete 🎯`);
      }
    } catch (err) {
      toast.error('Failed to claim reward');
    }
  };

  const completedCount = DAILY_QUESTS.filter(q => claimed[q.id]).length;

  return (
    <div className="quests-panel">
      <div className="quest-title">
        🎯 Daily Quests
        <span className="quest-refresh">Resets at midnight</span>
      </div>
      <p className="quest-sub">{completedCount}/{DAILY_QUESTS.length} completed today</p>
      <div className="quest-list">
        {DAILY_QUESTS.map(q => {
          const current = getProgress(q.stat, q.target);
          const pct = getPercentage(q.stat, q.target);
          const complete = current >= q.target;
          const isClaimed = claimed[q.id];

          return (
            <div key={q.id} className={`quest-item ${isClaimed ? 'quest-done' : ''}`}>
              <div className="quest-icon">{q.icon}</div>
              <div className="quest-info">
                <div className="quest-name">{q.name}</div>
                <div className="quest-desc">{q.desc}</div>
                <div className="quest-prog">
                  <div className="quest-bar">
                    <div className="quest-fill" style={{ width: `${Math.min(pct, 100)}%` }}></div>
                  </div>
                  <div className="quest-progtext">{current}/{q.target}</div>
                </div>
              </div>
              <div>
                {isClaimed ? (
                  <div className="quest-reward">✓</div>
                ) : (
                  <button
                    onClick={() => claimReward(q)}
                    disabled={!complete}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: complete ? 'linear-gradient(135deg,#E8531F,#7C3AED)' : 'rgba(255,255,255,0.05)',
                      color: complete ? '#fff' : 'rgba(245,242,236,0.36)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: complete ? 'pointer' : 'default',
                    }}
                  >
                    +{q.reward}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestsPage;