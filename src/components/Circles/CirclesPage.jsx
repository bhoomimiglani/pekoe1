import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const CirclesPage = () => {
  const { circles, user, joinCircle, fetchCircles } = useApp();

  useEffect(() => {
    fetchCircles();
  }, []);

  const isJoined = (circleId) => {
    return user?.joinedCircles?.includes(circleId);
  };

  const handleJoin = async (circleId) => {
    await joinCircle(circleId);
  };

  return (
    <div className="cgrid">
      {circles.map(circle => (
        <div key={circle.id} className={`ccard ${isJoined(circle.id) ? 'joined' : ''}`}>
          <div className="cicbig">{circle.icon}</div>
          <div className="cname">{circle.name}</div>
          <div className="cdesc">{circle.description}</div>
          <button 
            className={`jbtn ${isJoined(circle.id) ? 'joined' : ''}`}
            onClick={() => handleJoin(circle.id)}
            disabled={isJoined(circle.id)}
          >
            {isJoined(circle.id) ? 'Joined' : 'Join Circle'}
          </button>
        </div>
      ))}
    </div>
  );
};

export default CirclesPage;