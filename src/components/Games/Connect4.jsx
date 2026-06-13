import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Connect4 = () => {
  const ROWS = 6;
  const COLS = 7;
  
  const [board, setBoard] = useState(Array(ROWS).fill().map(() => Array(COLS).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState('red');
  const [winner, setWinner] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState({ red: 0, yellow: 0 });
  const [gameCount, setGameCount] = useState(0);
  const [isAIPlaying, setIsAIPlaying] = useState(false);
  const [dailyLimit, setDailyLimit] = useState({ earnedToday: 0, remainingToday: 100, dailyLimit: 100 });
  const { user } = useApp();

  useEffect(() => {
    loadGameLimit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGameLimit = async () => {
    try {
      const res = await api.get('/api/games/limit');
      setDailyLimit(res.data);
    } catch (error) {
      console.error('Failed to load game limit', error);
    }
  };

  const getAvailableRow = (col, boardState) => {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!boardState[row][col]) return row;
    }
    return -1;
  };

  const checkWinner = (boardState, row, col, player) => {
    // Horizontal
    let count = 0;
    for (let c = 0; c < COLS; c++) {
      if (boardState[row][c] === player) {
        count++;
        if (count === 4) return true;
      } else {
        count = 0;
      }
    }
    
    // Vertical
    count = 0;
    for (let r = 0; r < ROWS; r++) {
      if (boardState[r][col] === player) {
        count++;
        if (count === 4) return true;
      } else {
        count = 0;
      }
    }
    
    // Diagonal (down-right)
    count = 0;
    let startRow = row - Math.min(row, col);
    let startCol = col - Math.min(row, col);
    for (let i = 0; startRow + i < ROWS && startCol + i < COLS; i++) {
      if (boardState[startRow + i][startCol + i] === player) {
        count++;
        if (count === 4) return true;
      } else {
        count = 0;
      }
    }
    
    // Diagonal (up-right)
    count = 0;
    startRow = row + Math.min(ROWS - 1 - row, col);
    startCol = col - Math.min(ROWS - 1 - row, col);
    for (let i = 0; startRow - i >= 0 && startCol + i < COLS; i++) {
      if (boardState[startRow - i][startCol + i] === player) {
        count++;
        if (count === 4) return true;
      } else {
        count = 0;
      }
    }
    
    return false;
  };

  const isBoardFull = (boardState) => {
    for (let col = 0; col < COLS; col++) {
      if (getAvailableRow(col, boardState) !== -1) return false;
    }
    return true;
  };

  const makeMove = (col, currentBoard, player, isAIMove = false) => {
    if (!gameStarted || winner || (!isAIMove && currentPlayer !== player)) return false;
    
    const row = getAvailableRow(col, currentBoard);
    if (row === -1) return false;
    
    const newBoard = currentBoard.map(r => [...r]);
    newBoard[row][col] = player;
    setBoard(newBoard);
    
    if (checkWinner(newBoard, row, col, player)) {
      setWinner(player);
      setGameStarted(false);
      
      if (player === 'red') {
        setScore(prev => ({ ...prev, red: prev.red + 1 }));
        toast.success('You won! +20 PëKs! 🎉');
        awardGameWinnings(20);
      } else {
        setScore(prev => ({ ...prev, yellow: prev.yellow + 1 }));
        toast.success('AI won! 🤖');
      }
      return true;
    } else if (isBoardFull(newBoard)) {
      setWinner('draw');
      setGameStarted(false);
      toast('Game drawn! 🤝');
      return true;
    }
    
    return false;
  };

  const getBestAIMove = useCallback((currentBoard) => {
    const availableCols = [];
    for (let col = 0; col < COLS; col++) {
      if (getAvailableRow(col, currentBoard) !== -1) {
        availableCols.push(col);
      }
    }
    
    if (availableCols.length === 0) return -1;
    
    // Try to win
    for (let col of availableCols) {
      const row = getAvailableRow(col, currentBoard);
      const testBoard = currentBoard.map(r => [...r]);
      testBoard[row][col] = 'yellow';
      if (checkWinner(testBoard, row, col, 'yellow')) return col;
    }
    
    // Try to block player
    for (let col of availableCols) {
      const row = getAvailableRow(col, currentBoard);
      const testBoard = currentBoard.map(r => [...r]);
      testBoard[row][col] = 'red';
      if (checkWinner(testBoard, row, col, 'red')) return col;
    }
    
    // Prefer center columns
    const centerCols = [3, 2, 4, 1, 5, 0, 6];
    for (let col of centerCols) {
      if (availableCols.includes(col)) return col;
    }
    
    return availableCols[Math.floor(Math.random() * availableCols.length)];
  }, []);

  const aiMove = useCallback(() => {
    if (!gameStarted || winner || currentPlayer !== 'yellow' || isAIPlaying) return;
    
    setIsAIPlaying(true);
    
    setTimeout(() => {
      const currentBoard = [...board];
      const col = getBestAIMove(currentBoard);
      
      if (col !== -1) {
        const gameEnded = makeMove(col, currentBoard, 'yellow', true);
        if (!gameEnded) {
          setCurrentPlayer('red');
        }
      }
      setIsAIPlaying(false);
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted, winner, currentPlayer, board, getBestAIMove, isAIPlaying]);

  useEffect(() => {
    if (gameStarted && !winner && currentPlayer === 'yellow' && !isAIPlaying) {
      aiMove();
    }
  }, [gameStarted, currentPlayer, winner, aiMove, isAIPlaying]);

  const handleColumnClick = (col) => {
    if (!gameStarted || winner || currentPlayer !== 'red' || isAIPlaying) return;
    
    const gameEnded = makeMove(col, board, 'red', false);
    if (!gameEnded) {
      setCurrentPlayer('yellow');
    }
  };

  const awardGameWinnings = async (amount) => {
    try {
      const res = await api.post('/api/games/connect4', { won: true, prize: amount });
      if (res.data.success) {
        await loadGameLimit();
      } else if (res.data.limitReached) {
        toast.warning('Daily game limit reached! Come back tomorrow.');
      }
    } catch (error) {
      console.error('Failed to award winnings', error);
    }
  };

  const startNewGame = () => {
    if (isAIPlaying) return;
    setBoard(Array(ROWS).fill().map(() => Array(COLS).fill(null)));
    setCurrentPlayer('red');
    setWinner(null);
    setGameStarted(true);
    setGameCount(prev => prev + 1);
  };

  const resetScore = () => {
    setBoard(Array(ROWS).fill().map(() => Array(COLS).fill(null)));
    setCurrentPlayer('red');
    setWinner(null);
    setGameStarted(false);
    setScore({ red: 0, yellow: 0 });
    setGameCount(0);
    setIsAIPlaying(false);
  };

  const getCellColor = (value) => {
    if (value === 'red') return '#E8531F';
    if (value === 'yellow') return '#F5A623';
    return '#1a1a2e';
  };

  const remainingPercent = (dailyLimit.remainingToday / dailyLimit.dailyLimit) * 100;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>🟡 Connect 4</h3>
        <div style={styles.limitBar}>
          <div style={styles.limitInfo}>
            <span>🎯 Daily: {dailyLimit.earnedToday}/{dailyLimit.dailyLimit} PëKs</span>
            <span>⭐ Remaining: {dailyLimit.remainingToday} PëKs</span>
          </div>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${remainingPercent}%` }}></div>
          </div>
        </div>
      </div>

      <div style={styles.scoreBoard}>
        <div style={styles.scoreCard}>
          <span style={styles.scoreLabel}>You (🔴)</span>
          <span style={styles.scoreValue}>{score.red}</span>
        </div>
        <div style={styles.scoreCard}>
          <span style={styles.scoreLabel}>AI (🟡)</span>
          <span style={styles.scoreValue}>{score.yellow}</span>
        </div>
        <div style={styles.scoreCard}>
          <span style={styles.scoreLabel}>Draws</span>
          <span style={styles.scoreValue}>{gameCount - (score.red + score.yellow)}</span>
        </div>
      </div>

      <div style={styles.currentPlayer}>
        {gameStarted && !winner && (
          <div style={styles.playerIndicator(currentPlayer)}>
            {currentPlayer === 'red' ? 'Your Turn! 🔴' : 'AI is thinking... 🤖'}
          </div>
        )}
      </div>

      <div style={styles.board}>
        {board.map((row, rowIndex) => (
          <div key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                style={{ ...styles.cell, background: getCellColor(cell) }}
              />
            ))}
          </div>
        ))}
      </div>

      <div style={styles.columns}>
        {[...Array(COLS)].map((_, col) => (
          <button
            key={col}
            style={styles.columnBtn}
            onClick={() => handleColumnClick(col)}
            disabled={!gameStarted || winner || currentPlayer !== 'red' || isAIPlaying || getAvailableRow(col, board) === -1}
          >
            ▼
          </button>
        ))}
      </div>

      <div style={styles.status}>
        {winner ? (
          winner === 'draw' ? (
            <span style={styles.statusText}>It's a draw! 🤝</span>
          ) : (
            <span style={styles.statusText}>
              {winner === 'red' ? '🎉 You won! +20 PëKs! 🎉' : '🤖 AI won! Better luck next time!'}
            </span>
          )
        ) : gameStarted ? (
          <span style={styles.statusText}>
            {currentPlayer === 'red' ? 'Drop your disc! 🔴' : 'AI is thinking... 🤖'}
          </span>
        ) : (
          <span style={styles.statusText}>Click "New Game" to start!</span>
        )}
      </div>

      <div style={styles.buttons}>
        <button onClick={startNewGame} style={styles.startBtn} disabled={gameStarted && !winner}>
          {gameStarted ? 'Game in Progress' : 'New Game'}
        </button>
        <button onClick={resetScore} style={styles.resetBtn}>
          Reset Score
        </button>
      </div>

      <div style={styles.instructions}>
        <p>🎯 Connect 4 discs in a row to win!</p>
        <p>💰 Win against AI: +20 PëKs per game!</p>
        <p>📊 Daily limit: {dailyLimit.dailyLimit} PëKs from all games</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    background: 'linear-gradient(145deg, rgba(17,17,30,0.95), rgba(11,11,22,0.98))',
    border: '1px solid rgba(255,255,255,0.055)',
    borderRadius: '16px',
    padding: '1.5rem',
  },
  header: { marginBottom: '1rem' },
  title: { fontFamily: "'Syne', sans-serif", fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' },
  limitBar: { marginTop: '0.5rem' },
  limitInfo: { display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(245,242,236,0.62)', marginBottom: '0.3rem' },
  progressBar: { height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(135deg, #E8531F, #F5A623)', transition: 'width 0.3s' },
  scoreBoard: { display: 'flex', justifyContent: 'space-around', marginBottom: '1rem', gap: '1rem' },
  scoreCard: { flex: 1, textAlign: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' },
  scoreLabel: { display: 'block', fontSize: '0.7rem', color: 'rgba(245,242,236,0.62)', marginBottom: '0.25rem' },
  scoreValue: { fontSize: '1.2rem', fontWeight: 700, color: '#F5A623' },
  currentPlayer: { textAlign: 'center', marginBottom: '0.5rem' },
  playerIndicator: (player) => ({
    display: 'inline-block',
    padding: '0.3rem 1rem',
    borderRadius: '20px',
    background: player === 'red' ? 'rgba(232,83,31,0.2)' : 'rgba(245,166,35,0.2)',
    color: player === 'red' ? '#E8531F' : '#F5A623',
    fontSize: '0.8rem',
    fontWeight: 600,
  }),
  board: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '0.5rem',
  },
  row: { display: 'flex', gap: '4px' },
  cell: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'all 0.2s',
  },
  columns: {
    display: 'flex',
    justifyContent: 'center',
    gap: '4px',
    marginBottom: '1rem',
  },
  columnBtn: {
    width: '40px',
    padding: '0.3rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'rgba(245,242,236,0.62)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  status: { textAlign: 'center', marginBottom: '1rem' },
  statusText: { fontSize: '0.9rem', color: '#F5A623' },
  buttons: { display: 'flex', gap: '1rem', marginBottom: '1rem' },
  startBtn: {
    flex: 1,
    padding: '0.6rem',
    background: 'linear-gradient(135deg, #E8531F, #7C3AED)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
  },
  resetBtn: {
    flex: 1,
    padding: '0.6rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'rgba(245,242,236,0.62)',
    fontWeight: 600,
    cursor: 'pointer',
  },
  instructions: { marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.055)', fontSize: '0.7rem', color: 'rgba(245,242,236,0.36)', textAlign: 'center' },
};

export default Connect4;