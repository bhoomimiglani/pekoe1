import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TicTacToe = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState({ X: 0, O: 0 });
  const [gameCount, setGameCount] = useState(0);
  const [isAIPlaying, setIsAIPlaying] = useState(false);
  const [dailyLimit, setDailyLimit] = useState({ earnedToday: 0, remainingToday: 100, dailyLimit: 100 });
  // no context needed

  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

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

  const checkWinner = (boardState) => {
    for (let pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
        return { winner: boardState[a], line: pattern };
      }
    }
    return null;
  };

  const isBoardFull = (boardState) => {
    return boardState.every(cell => cell !== null);
  };

  const makeMove = (index, currentBoard, currentPlayer) => {
    if (winner || !gameStarted) return false;
    if (currentBoard[index]) return false;

    const newBoard = [...currentBoard];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      setGameStarted(false);
      
      if (result.winner === 'X') {
        setScore(prev => ({ ...prev, X: prev.X + 1 }));
        toast.success('You won! +15 PëKs! 🎉');
        awardGameWinnings(15);
      } else if (result.winner === 'O') {
        setScore(prev => ({ ...prev, O: prev.O + 1 }));
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

  const getBestAIMove = (currentBoard) => {
    // Check if AI can win
    for (let i = 0; i < 9; i++) {
      if (!currentBoard[i]) {
        const testBoard = [...currentBoard];
        testBoard[i] = 'O';
        if (checkWinner(testBoard)) return i;
      }
    }
    
    // Check if player can win and block
    for (let i = 0; i < 9; i++) {
      if (!currentBoard[i]) {
        const testBoard = [...currentBoard];
        testBoard[i] = 'X';
        if (checkWinner(testBoard)) return i;
      }
    }
    
    // Take center
    if (!currentBoard[4]) return 4;
    
    // Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => !currentBoard[i]);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }
    
    // Take any available edge
    const edges = [1, 3, 5, 7];
    const availableEdges = edges.filter(i => !currentBoard[i]);
    if (availableEdges.length > 0) {
      return availableEdges[Math.floor(Math.random() * availableEdges.length)];
    }
    
    return -1;
  };

  const aiMove = () => {
    if (!gameStarted || winner || isXTurn || isAIPlaying) return;
    
    setIsAIPlaying(true);
    
    // Small delay for visual feedback, but very short
    setTimeout(() => {
      const currentBoard = [...board];
      const move = getBestAIMove(currentBoard);
      
      if (move !== -1) {
        const gameEnded = makeMove(move, currentBoard, 'O');
        if (!gameEnded) {
          setIsXTurn(true);
        }
      }
      setIsAIPlaying(false);
    }, 100);
  };

  useEffect(() => {
    if (gameStarted && !winner && !isXTurn && !isAIPlaying && !winner) {
      aiMove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted, isXTurn, board]);

  const handleCellClick = (index) => {
    if (!gameStarted || winner || !isXTurn || isAIPlaying) return;
    if (board[index]) return;
    
    const gameEnded = makeMove(index, board, 'X');
    if (!gameEnded) {
      setIsXTurn(false);
    }
  };

  const awardGameWinnings = async (amount) => {
    try {
      const res = await api.post('/api/games/tictactoe', { won: true, prize: amount });
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
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
    setWinner(null);
    setWinningLine(null);
    setGameStarted(true);
    setGameCount(prev => prev + 1);
  };

  const resetScore = () => {
    setScore({ X: 0, O: 0 });
    setGameCount(0);
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
    setWinner(null);
    setWinningLine(null);
    setGameStarted(false);
    setIsAIPlaying(false);
  };

  const getCellStyle = (index) => {
    const baseStyle = styles.cell;
    if (winningLine && winningLine.includes(index)) {
      return { ...baseStyle, ...styles.winningCell };
    }
    return baseStyle;
  };

  const remainingPercent = (dailyLimit.remainingToday / dailyLimit.dailyLimit) * 100;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>🎮 Tic Tac Toe</h3>
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
          <span style={styles.scoreLabel}>You (X)</span>
          <span style={styles.scoreValue}>{score.X}</span>
        </div>
        <div style={styles.scoreCard}>
          <span style={styles.scoreLabel}>AI (O)</span>
          <span style={styles.scoreValue}>{score.O}</span>
        </div>
        <div style={styles.scoreCard}>
          <span style={styles.scoreLabel}>Draws</span>
          <span style={styles.scoreValue}>{gameCount - (score.X + score.O)}</span>
        </div>
      </div>

      <div style={styles.board}>
        {board.map((cell, index) => (
          <button
            key={index}
            style={getCellStyle(index)}
            onClick={() => handleCellClick(index)}
            disabled={!gameStarted || winner || cell !== null || isAIPlaying}
          >
            <span style={styles.cellContent(cell)}>{cell}</span>
          </button>
        ))}
      </div>

      <div style={styles.status}>
        {winner ? (
          winner === 'draw' ? (
            <span style={styles.statusText}>It's a draw! 🤝</span>
          ) : (
            <span style={styles.statusText}>
              {winner === 'X' ? '🎉 You won! +15 PëKs! 🎉' : '🤖 AI won! Better luck next time!'}
            </span>
          )
        ) : gameStarted ? (
          <span style={styles.statusText}>
            {isXTurn ? 'Your turn! (X)' : 'AI is thinking... 🤖'}
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
        <p>🎯 Win against AI to earn 15 PëKs per game!</p>
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
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    maxWidth: '300px',
    margin: '0 auto 1rem',
  },
  cell: {
    aspectRatio: '1',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    fontSize: '2rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  winningCell: { background: 'rgba(245,166,35,0.2)', borderColor: '#F5A623', boxShadow: '0 0 12px rgba(245,166,35,0.3)' },
  cellContent: (value) => ({ color: value === 'X' ? '#E8531F' : '#00C9B1' }),
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

export default TicTacToe;