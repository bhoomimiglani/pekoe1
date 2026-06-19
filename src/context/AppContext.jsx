import React, { createContext, useState, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';
import api, { SERVER_HOST } from '../services/api';
import toast from 'react-hot-toast';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('pk_token'));
  const [posts, setPosts] = useState([]);
  const [circles, setCircles] = useState([]);
  const [badges, setBadges] = useState(new Set());
  const [peksLog, setPeksLog] = useState([]);
  const [stats, setStats] = useState({
    posts: 0, votes: 0, comments: 0, ths: 0, htvotes: 0,
    joins: 0, flags: 0, polls: 0, stars: 0, sentis: 0
  });
  const [liveUsers, setLiveUsers] = useState(22400); // eslint-disable-line no-unused-vars
  const [streakInfo, setStreakInfo] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  // Initialize Socket.io — connects to whichever host served the app (LAN-aware)
  useEffect(() => {
    const newSocket = io(SERVER_HOST, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    setSocket(newSocket);

    if (user?.id) {
      newSocket.emit('register', user.id);
    }

    return () => newSocket.close();
  }, [user?.id]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('balanceUpdate', (data) => {
      if (user) {
        setUser(prev => ({ ...prev, peks: data.peks }));
        toast.success(`${data.reason} +${data.amt} PëKs!`);
      }
    });

    socket.on('voteUpdate', (data) => {
      setPosts(prev => prev.map(post =>
        post.id === data.postId ? { ...post, votes: data.votes, dn: data.dn } : post
      ));
    });

    socket.on('newPost', (post) => {
      setPosts(prev => {
        // avoid duplicates
        if (prev.some(p => p.id === post.id)) return prev;
        return [post, ...prev];
      });
      if (post.username !== user?.username) {
        toast(`New post from ${post.username}!`, { icon: '✨' });
      }
    });

    socket.on('newComment', (comment) => {
      setPosts(prev => prev.map(post =>
        post.id === comment.post_id
          ? { ...post, comment_count: (post.comment_count || 0) + 1 }
          : post
      ));
    });

    // Star rating updated by another user
    socket.on('ratingUpdate', (data) => {
      setPosts(prev => prev.map(post =>
        post.id === data.postId
          ? { ...post, star_avg: data.star_avg, star_count: data.star_count }
          : post
      ));
    });

    // Poll vote cast by another user
    socket.on('pollUpdate', (data) => {
      setPosts(prev => prev.map(post =>
        post.id === data.postId
          ? { ...post, poll_data: data.pollData }
          : post
      ));
    });

    // Sentiment updated
    socket.on('sentimentUpdate', (data) => {
      setPosts(prev => prev.map(post =>
        post.id === data.postId
          ? { ...post, sentiment_avg: data.sentiment_avg, sentiment_count: data.sentiment_count }
          : post
      ));
    });

    // Post got a boost badge
    socket.on('postBoosted', (data) => {
      setPosts(prev => prev.map(post =>
        post.id === data.postId
          ? { ...post, is_boosted: true }
          : post
      ));
    });

    // Sticker placed on a post
    socket.on('stickerUsed', (data) => {
      setPosts(prev => prev.map(post =>
        post.id === data.postId
          ? { ...post, sticker_count: (post.sticker_count || 0) + 1 }
          : post
      ));
    });

    // Leaderboard: re-fetch when any balance changes
    socket.on('leaderboardUpdate', () => {
      // signal to any listening component
      setLiveUsers(prev => prev); // no-op just to allow external refetch hook
    });

    return () => {
      socket.off('balanceUpdate');
      socket.off('voteUpdate');
      socket.off('newPost');
      socket.off('newComment');
      socket.off('ratingUpdate');
      socket.off('pollUpdate');
      socket.off('sentimentUpdate');
      socket.off('postBoosted');
      socket.off('stickerUsed');
      socket.off('leaderboardUpdate');
    };
  }, [socket, user]);

  // Set token in API headers
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = token;
      localStorage.setItem('pk_token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('pk_token');
    }
  }, [token]);

  const login = async (username, email, password = '', isSignup = false) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { username, email, password, isSignup });
      if (res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        api.defaults.headers.common['Authorization'] = res.data.token;
        Promise.all([fetchPosts('new'), fetchCircles(), fetchStreakInfo()]).catch(() => {});
        toast.success(`Welcome ${username}!`);
        return { success: true, isNewUser: res.data.isNewUser };
      }
      toast.error('Login failed: no token received');
      return { success: false };
    } catch (error) {
      const msg = error.response?.data?.error || 'Login failed';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('pk_token');
    toast.success('Logged out successfully');
  };

  const fetchPosts = async (sort = 'new') => {
    setLoading(true);
    try {
      const res = await api.get(`/api/posts?sort=${sort}`);
      setPosts(res.data);
    } catch (error) {
      console.error('Failed to fetch posts', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCircles = async () => {
    try {
      const res = await api.get('/api/circles');
      setCircles(res.data);
    } catch (error) {
      console.error('Failed to fetch circles', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/user/profile');
      if (res.data.user) {
        setUser(res.data.user);
        setPeksLog(res.data.history);
        setBadges(new Set(res.data.badges));
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/api/leaderboard');
      return res.data;
    } catch (error) {
      console.error('Failed to fetch leaderboard', error);
      return [];
    }
  };

  const fetchStreakInfo = async () => {
    try {
      const res = await api.get('/api/user/streak-info');
      setStreakInfo(res.data);
    } catch (error) {
      console.error('Failed to fetch streak info', error);
    }
  };

  const claimStreak = async () => {
    try {
      const res = await api.post('/api/user/claim-streak');
      if (res.data.success && !res.data.alreadyClaimed) {
        setUser(prev => ({ ...prev, peks: res.data.totalPeks, streak: res.data.streak }));
        toast.success(`🔥 Day ${res.data.streak}! +${res.data.bonus} PëKs!`);
        await fetchStreakInfo();
      } else if (res.data.alreadyClaimed) {
        toast('Already claimed today!', { icon: '⏰' });
      }
    } catch (error) {
      console.error('Failed to claim streak', error);
    }
  };

  const fetchGameHistory = async () => {
    try {
      const res = await api.get('/api/games/history');
      setGameHistory(res.data);
    } catch (error) {
      console.error('Failed to fetch game history', error);
    }
  };

  const spinWheel = async () => {
    try {
      const res = await api.post('/api/games/spin-wheel');
      if (res.data.success) {
        setUser(prev => ({ ...prev, peks: (prev?.peks || 0) + res.data.prize }));
        toast.success(`🎡 You won ${res.data.prizeLabel}!`);
        setStats(prev => ({ ...prev, games: prev.games + 1 }));
        await fetchGameHistory();
        return { success: true, prize: res.data.prize };
      } else if (res.data.alreadyPlayed) {
        toast('Already played today! Come back tomorrow!', { icon: '⏰' });
        return { success: false, alreadyPlayed: true };
      } else if (res.data.limitReached) {
        toast.error(res.data.message || 'Daily game limit reached!');
        return { success: false, limitReached: true };
      }
    } catch (error) {
      toast.error('Failed to spin wheel');
      return { success: false };
    }
  };

  const flipCoin = async (bet, choice) => {
    try {
      const res = await api.post('/api/games/coin-flip', { bet, choice });
      if (res.data.success) {
        setUser(prev => ({ ...prev, peks: res.data.newBalance }));
        if (res.data.won) {
          toast.success(`🪙 You won! +${res.data.winAmount} PëKs! Result: ${res.data.result}`);
        } else {
          toast.error(`🪙 You lost! -${bet} PëKs! Result: ${res.data.result}`);
        }
        setStats(prev => ({ ...prev, games: prev.games + 1 }));
        await fetchGameHistory();
        return res.data;
      } else if (res.data.limitReached) {
        toast.error(res.data.message || 'Daily game limit reached!');
        return { success: false };
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to flip coin');
      return { success: false };
    }
  };

  const createPost = async (postData) => {
    setLoading(true);
    try {
      const res = await api.post('/api/posts', postData);
      if (res.data.success) {
        toast.success(postData.isAnonymous ? 'Anonymous post published!' : 'Post published!');
        setStats(prev => ({ ...prev, posts: prev.posts + 1 }));
        await fetchPosts();
        return true;
      }
    } catch (error) {
      toast.error('Failed to publish post');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const votePost = async (postId, type) => {
    try {
      const res = await api.post(`/api/posts/${postId}/vote`, { type });
      if (res.data.success) {
        setPosts(prev => prev.map(post =>
          post.id === postId 
            ? { ...post, votes: res.data.votes, dn: res.data.dn, user_vote: res.data.userVote }
            : post
        ));
        if (type === 'up') setStats(prev => ({ ...prev, votes: prev.votes + 1, htvotes: prev.htvotes + 1 }));
        return true;
      }
    } catch (error) {
      toast.error('Failed to vote');
      return false;
    }
  };

  const addComment = async (postId, text) => {
    try {
      const res = await api.post(`/api/posts/${postId}/comment`, { text });
      if (res.data) {
        setPosts(prev => prev.map(post =>
          post.id === postId 
            ? { ...post, comment_count: (post.comment_count || 0) + 1 }
            : post
        ));
        setStats(prev => ({ ...prev, comments: prev.comments + 1 }));
        return res.data;
      }
    } catch (error) {
      toast.error('Failed to add comment');
      return null;
    }
  };

  const ratePost = async (postId, stars) => {
    try {
      const res = await api.post(`/api/posts/${postId}/rate`, { stars });
      if (res.data.success) {
        setPosts(prev => prev.map(post =>
          post.id === postId 
            ? { ...post, star_avg: res.data.star_avg, star_count: res.data.star_count, user_star: stars }
            : post
        ));
        toast.success(`⭐ Rated ${stars} stars! +2 PëKs`);
        return true;
      }
    } catch (error) {
      toast.error('Failed to rate');
      return false;
    }
  };

  const flagPost = async (postId) => {
    try {
      const res = await api.post(`/api/posts/${postId}/flag`);
      if (res.data.success) {
        setPosts(prev => prev.map(post =>
          post.id === postId ? { ...post, user_flagged: true, flagged: true } : post
        ));
        toast.success('🔍 Post flagged for review! +10 PëKs');
        return true;
      }
    } catch (error) {
      toast.error('Failed to flag post');
      return false;
    }
  };

  const joinCircle = async (circleId) => {
    try {
      const res = await api.post('/api/circles/join', { circle_id: circleId });
      if (res.data.success) {
        setUser(prev => ({
          ...prev,
          joinedCircles: [...(prev?.joinedCircles || []), circleId],
          peks: (prev?.peks || 0) + 5
        }));
        toast.success('Joined circle! +5 PëKs');
        return true;
      }
    } catch (error) {
      toast.error('Failed to join circle');
      return false;
    }
  };

  return (
    <AppContext.Provider value={{
      user, setUser,
      posts, setPosts,
      circles, setCircles,
      badges, peksLog, stats, liveUsers, streakInfo, gameHistory,
      loading, token, setToken,
      socket,
      login, logout,
      fetchPosts, fetchCircles, fetchProfile, fetchLeaderboard,
      fetchStreakInfo, claimStreak, fetchGameHistory,
      spinWheel, flipCoin,
      createPost, votePost, addComment, ratePost, flagPost, joinCircle
    }}>
      {children}
    </AppContext.Provider>
  );
};