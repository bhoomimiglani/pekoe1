import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fmt, ini, tier } from '../../utils/helpers';

const BADGES = [
  { id: 'founder', icon: '🌟', label: 'Founder', desc: "Among PëKœ's first members" },
  { id: 'first_post', icon: '✍️', label: 'First Post', desc: 'Created your first post' },
  { id: 'first_vote', icon: '▲', label: 'First Vote', desc: 'Voted for the first time' },
  { id: 'streak_3', icon: '🔥', label: 'On a Roll', desc: '3-day login streak' },
  { id: 'streak_7', icon: '🌊', label: 'Week Warrior', desc: '7-day login streak' },
];

const ProfilePage = () => {
  const { user, peksLog, badges, fetchProfile } = useApp();

  useEffect(() => {
    fetchProfile();
  }, []);

  const t = tier(user?.peks || 0);
  const nt = tier((user?.peks || 0) + 100);
  const prog = nt ? Math.min(100, Math.round(((user?.peks || 0) - t.min) / (nt.min - t.min) * 100)) : 100;
  const userBadges = BADGES.filter(b => badges.has(b.id));

  return (
    <div>
      <div className="phead">
        <div className="pavbig" style={{ background: user?.avatar_color || '#E8531F' }}>{ini(user?.username)}</div>
        <div className="pname">{user?.username}</div>
        <div className="ptier" style={{ color: t.color, borderColor: t.color }}>{t.name}</div>
        <div className="tier-bar"><div className="tier-fill" style={{ width: `${prog}%`, background: t.color }}></div></div>
        <p className="tier-hint">{nt ? fmt(nt.min - (user?.peks || 0)) + ' PëKs to ' + nt.name : 'Max tier reached'}</p>
        <div className="pksbig">{fmt(user?.peks || 0)}</div>
        <div className="pklbl">PëKs earned · 🔥 {user?.streak || 0} day streak</div>
      </div>

      {userBadges.length > 0 && (
        <div className="badges-panel">
          <h3 className="panel-h">Badges</h3>
          <div className="badges-grid">
            {userBadges.map(b => (
              <div key={b.id} className="badge-chip" title={b.desc}>
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="plog">
        <h3 className="panel-h">PëKs history</h3>
        {peksLog.length === 0 ? (
          <p className="plog-empty">No earnings yet — start posting!</p>
        ) : (
          peksLog.map((l, i) => (
            <div key={i} className="logitem">
              <div className="logdesc">{l.reason}</div>
              <div className="logpts">+{l.amt}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProfilePage;