import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';

const SpinWheel = () => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef(null);
  const { spinWheel } = useApp();

  const handleSpin = async () => {
    if (spinning) return;
    
    setSpinning(true);
    
    // Random spin amount (5-10 full rotations + random angle)
    const randomSpins = 5 + Math.random() * 5;
    const randomAngle = Math.random() * 360;
    const newRotation = rotation + (randomSpins * 360) + randomAngle;
    
    // Apply animation
    setRotation(newRotation);
    
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${newRotation}deg)`;
    }
    
    // Call API to get prize
    const result = await spinWheel();
    
    // Stop spinning after animation (4 seconds)
    setTimeout(() => {
      setSpinning(false);
    }, 4000);
  };

  // Wheel segments with colors
  const segments = [
    { color: '#E8531F', label: '10', angle: 0 },
    { color: '#F5A623', label: '20', angle: 72 },
    { color: '#00C9B1', label: '50', angle: 144 },
    { color: '#7C3AED', label: '100', angle: 216 },
    { color: '#2563EB', label: '500', angle: 288 },
  ];

  return (
    <div className="game-card">
      <h3 className="game-title">
        <span>🎡</span>
        <span>Lucky Spin</span>
      </h3>
      <p className="game-desc">Spin the wheel to win up to 500 PëKs! One spin per day.</p>
      <div className="wheel-container">
        <div className="wheel-pointer"></div>
        <div 
          className="wheel" 
          ref={wheelRef}
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4s cubic-bezier(0.25, 0.1, 0.15, 1)' : 'none',
            position: 'relative',
            borderRadius: '50%',
            background: `conic-gradient(from 0deg, 
              #E8531F 0deg 72deg, 
              #F5A623 72deg 144deg, 
              #00C9B1 144deg 216deg, 
              #7C3AED 216deg 288deg, 
              #2563EB 288deg 360deg)`
          }}
        >
          <div className="wheel-center">SPIN</div>
        </div>
      </div>
      <button 
        className="spin-btn" 
        onClick={handleSpin} 
        disabled={spinning}
      >
        {spinning ? '🎰 Spinning...' : '🎰 SPIN WHEEL 🎰'}
      </button>
    </div>
  );
};

export default SpinWheel;