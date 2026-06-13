require('dotenv').config({ override: true });
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { 
        origin: '*',  // Allow any device on the network
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

const userSockets = new Map();

// Daily game earning limit
const DAILY_GAME_LIMIT = 100; // Max PëKs per day from games

app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors({
    origin: '*',  // Allow any device on the network
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Session expired' });
        
        const { data: user, error } = await db.from('users').select('id').eq('id', decoded.id).single();
        if (error || !user) {
            return res.status(401).json({ error: 'User not found' });
        }
        req.userId = decoded.id;
        req.username = decoded.username;
        next();
    });
};

const USERNAME_RE = /^[a-zA-Z0-9_]{2,24}$/;

// ========== HELPER FUNCTIONS ==========

async function awardPeks(userId, amount, reason) {
    await db.rpc('increment_peks', { user_id_param: userId, amount });
    await db.from('peks_history').insert([{ user_id: userId, amt: amount, reason }]);
    
    const socketId = userSockets.get(userId);
    if (socketId) {
        const { data: user } = await db.from('users').select('peks').eq('id', userId).single();
        if (user) {
            io.to(socketId).emit('balanceUpdate', { peks: user.peks, reason, amt: amount });
        }
    }
    // Broadcast leaderboard refresh to all clients
    io.emit('leaderboardUpdate');
}

async function awardPeksWithCommunity(userId, amount, reason, postId = null) {
    // Award user
    await db.rpc('increment_peks', { user_id_param: userId, amount });
    await db.from('peks_history').insert([{ user_id: userId, amt: amount, reason }]);
    
    // Community earnings (platform gets 20% of every earning)
    const communityAmount = Math.floor(amount * 0.2);
    if (communityAmount > 0) {
        const { data: fund } = await db.from('community_fund').select('amount').single();
        if (fund) {
            await db.from('community_fund').update({ amount: (fund.amount || 0) + communityAmount }).eq('id', 1);
        }
    }
    
    // Record transaction
    await db.from('transactions').insert([{
        user_id: userId,
        amount: amount,
        type: 'earn',
        reason: reason,
        post_id: postId,
        created_at: new Date().toISOString()
    }]);
    
    // Notify user via socket
    const socketId = userSockets.get(userId);
    if (socketId) {
        const { data: user } = await db.from('users').select('peks').eq('id', userId).single();
        if (user) {
            io.to(socketId).emit('balanceUpdate', { peks: user.peks, reason, amt: amount });
        }
    }
    // Broadcast leaderboard refresh to all clients
    io.emit('leaderboardUpdate');
    
    return { userAmount: amount, communityAmount };
}

// Check and update daily game earnings
async function checkDailyGameLimit(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's game earnings
    const { data: todayEarnings } = await db.from('game_history')
        .select('prize')
        .eq('user_id', userId)
        .gte('played_at', today)
        .lte('played_at', today + 'T23:59:59.999Z');
    
    const totalEarned = (todayEarnings || []).reduce((sum, g) => sum + (g.prize > 0 ? g.prize : 0), 0);
    const remaining = Math.max(0, DAILY_GAME_LIMIT - totalEarned);
    
    return { totalEarned, remaining, canEarn: remaining > 0 };
}

// ========== AUTH ENDPOINTS ==========

app.post('/api/auth/login', async (req, res) => {
    const { username, email } = req.body;
    if (!username || !USERNAME_RE.test(username)) {
        return res.status(400).json({ error: 'Username must be 2-24 characters (letters, numbers, underscore)' });
    }

    const { data: user, error } = await db.from('users').select('*').eq('username', username).maybeSingle();
    
    if (user) {
        const today = new Date().toISOString().split('T')[0];
        let newStreak = user.streak || 1;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (user.last_login !== today) {
            if (user.last_login === yesterday) newStreak++;
            else newStreak = 1;
            await db.from('users').update({ streak: newStreak, last_login: today }).eq('id', user.id);
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { ...user, streak: newStreak }, isNewUser: false });
    } else {
        const avatarColor = ['#E8531F', '#7C3AED', '#0D9488', '#2563EB', '#10B981', '#F5A623', '#EF4444', '#00C9B1'][Math.floor(Math.random() * 8)];
        const today = new Date().toISOString().split('T')[0];
        
        const { data: newUser, error: insertError } = await db.from('users').insert([
            { username, email: email || '', peks: 100, avatar_color: avatarColor, streak: 1, last_login: today, streak_freezes: 0 }
        ]).select().single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return res.status(500).json({ error: 'Failed to create user' });
        }
        
        await db.from('user_badges').insert([{ user_id: newUser.id, badge_id: 'founder' }]);
        await db.from('peks_history').insert([{ user_id: newUser.id, amt: 100, reason: 'Welcome bonus — Founder! 🌟' }]);
        
        const token = jwt.sign({ id: newUser.id, username }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { ...newUser }, isNewUser: true });
    }
});

// ========== POSTS ENDPOINTS ==========

app.get('/api/posts', async (req, res) => {
    const { sort, type, category } = req.query;
    const token = req.headers['authorization'];
    let userId = null;

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            userId = decoded.id;
        } catch (e) {}
    }

    let query = db.from('posts').select('*');
    
    if (type) {
        query = query.eq('type', type);
    }
    if (category && category !== 'all') {
        query = query.eq('category', category);
    }
    
    if (sort === 'top') {
        query = query.order('votes', { ascending: false });
    } else if (sort === 'hot') {
        query = query.order('votes', { ascending: false });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    const { data: posts, error } = await query.limit(100);
    if (error) {
        console.error('Fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch posts' });
    }
    
    const postsWithComments = await Promise.all((posts || []).map(async (post) => {
        const { count } = await db.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
        return { ...post, comment_count: count || 0 };
    }));
    
    res.json(postsWithComments);
});

app.post('/api/posts', authenticate, async (req, res) => {
    const { id, type, circle_id, title, body, sideA, sideB, poll_data, isAnonymous, imageUrl, reviewData, rankedListData, category } = req.body;
    const userId = req.userId;
    const username = req.username;

    const { data: user } = await db.from('users').select('avatar_color').eq('id', userId).single();
    const avatarColor = user?.avatar_color || '#E8531F';
    
    const displayUsername = isAnonymous ? 'Anonymous 🎭' : username;
    const displayAvatar = isAnonymous ? '#6B7280' : avatarColor;
    
    const expires_at = type === 'hot' ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() : null;
    
    const { error: insertError } = await db.from('posts').insert([{
        id, user_id: userId, username: displayUsername, real_username: isAnonymous ? username : null,
        avatar_color: displayAvatar, type, circle_id, title, body: body || '',
        sideA: sideA || null, sideB: sideB || null, poll_data: poll_data || null,
        image_url: imageUrl || null, review_data: reviewData || null, 
        ranked_list_data: rankedListData || null, category: category || 'general',
        votes: 0, dn: 0, expires_at, star_sum: 0, star_count: 0,
        sentiment_sum: 0, sentiment_count: 0, flagged: false, is_anonymous: isAnonymous || false,
        created_at: new Date().toISOString(),
        is_boosted: false, boost_expires_at: null
    }]);

    if (insertError) {
        console.error('Insert error:', insertError);
        return res.status(500).json({ error: 'Failed to publish post' });
    }
    
    await awardPeksWithCommunity(userId, 5, 'Created a post ✍️', id);
    
    io.emit('newPost', { 
        id, user_id: userId, username: displayUsername, avatar_color: displayAvatar, 
        type, circle_id, title, body, image_url: imageUrl, category,
        created_at: new Date().toISOString(),
        votes: 0, dn: 0, comment_count: 0
    });
    
    res.json({ success: true });
});

app.post('/api/posts/:id/vote', authenticate, async (req, res) => {
    const postId = req.params.id;
    const { type } = req.body;
    const userId = req.userId;

    const { data: existingVote } = await db.from('post_votes').select('type').eq('user_id', userId).eq('post_id', postId).maybeSingle();
    
    if (existingVote) {
        if (existingVote.type === type) {
            await db.from('post_votes').delete().eq('user_id', userId).eq('post_id', postId);
            if (type === 'up') await db.rpc('decrement_votes', { post_id_param: postId });
            else await db.rpc('decrement_dn', { post_id_param: postId });
        } else {
            await db.from('post_votes').update({ type }).eq('user_id', userId).eq('post_id', postId);
            if (type === 'up') {
                await db.rpc('increment_votes', { post_id_param: postId });
                await db.rpc('decrement_dn', { post_id_param: postId });
            } else {
                await db.rpc('increment_dn', { post_id_param: postId });
                await db.rpc('decrement_votes', { post_id_param: postId });
            }
        }
    } else {
        await db.from('post_votes').insert([{ user_id: userId, post_id: postId, type }]);
        if (type === 'up') await db.rpc('increment_votes', { post_id_param: postId });
        else await db.rpc('increment_dn', { post_id_param: postId });
        if (type === 'up') await awardPeks(userId, 1, 'Upvoted a post ▲');
    }

    const { data: post } = await db.from('posts').select('votes, dn').eq('id', postId).single();
    io.emit('voteUpdate', { postId, votes: post.votes, dn: post.dn });
    res.json({ success: true, votes: post.votes, dn: post.dn });
});

app.post('/api/posts/:id/comment', authenticate, async (req, res) => {
    const postId = req.params.id;
    const { text } = req.body;
    const userId = req.userId;
    const username = req.username;

    const { data: user } = await db.from('users').select('avatar_color').eq('id', userId).single();
    const { data: post } = await db.from('posts').select('user_id').eq('id', postId).single();
    
    const { data: comment, error } = await db.from('comments').insert([
        { post_id: postId, user_id: userId, username, text, avatar_color: user.avatar_color, created_at: new Date().toISOString() }
    ]).select().single();

    if (error) {
        console.error('Comment error:', error);
        return res.status(500).json({ error: 'Failed to post comment' });
    }
    
    await awardPeksWithCommunity(userId, 4, 'Commented on a post 💬', postId);
    if (post && post.user_id !== userId) {
        await awardPeksWithCommunity(post.user_id, 1, 'Someone commented on your post 💬', postId);
    }
    
    io.emit('newComment', comment);
    res.json(comment);
});

app.get('/api/posts/:id/comments', async (req, res) => {
    const { data: comments, error } = await db.from('comments').select('*').eq('post_id', req.params.id).order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Failed to fetch comments' });
    res.json(comments || []);
});

app.post('/api/posts/:id/flag', authenticate, async (req, res) => {
    const postId = req.params.id;
    const userId = req.userId;

    const { data: existing } = await db.from('post_flags').select('post_id').eq('user_id', userId).eq('post_id', postId).maybeSingle();
    if (existing) return res.json({ success: true, alreadyFlagged: true });

    await db.from('post_flags').insert([{ user_id: userId, post_id: postId }]);
    await db.from('posts').update({ flagged: true }).eq('id', postId);
    await awardPeks(userId, 10, 'Flagged post for Verify 🔍');
    res.json({ success: true });
});

app.post('/api/posts/:id/rate', authenticate, async (req, res) => {
    const postId = req.params.id;
    const userId = req.userId;
    const stars = Math.min(5, Math.max(1, parseInt(req.body.stars, 10) || 0));

    const { data: post } = await db.from('posts').select('star_sum, star_count').eq('id', postId).single();
    const { data: existing } = await db.from('post_ratings').select('stars').eq('user_id', userId).eq('post_id', postId).maybeSingle();
    
    let starSum = post.star_sum || 0;
    let starCount = post.star_count || 0;

    if (existing) {
        starSum = starSum - existing.stars + stars;
        await db.from('post_ratings').update({ stars }).eq('user_id', userId).eq('post_id', postId);
    } else {
        starSum += stars;
        starCount += 1;
        await db.from('post_ratings').insert([{ user_id: userId, post_id: postId, stars }]);
        await awardPeks(userId, 2, 'Rated a post ⭐');
    }

    await db.from('posts').update({ star_sum: starSum, star_count: starCount }).eq('id', postId);
    const starAvg = starCount > 0 ? Math.round((starSum / starCount) * 10) / 10 : 0;
    
    io.emit('ratingUpdate', { postId, star_avg: starAvg, star_count: starCount });
    res.json({ success: true, star_avg: starAvg, star_count: starCount });
});

app.post('/api/posts/:id/sentiment', authenticate, async (req, res) => {
    const postId = req.params.id;
    const userId = req.userId;
    const value = Math.min(100, Math.max(0, parseInt(req.body.value, 10)));

    const { data: post } = await db.from('posts').select('sentiment_sum, sentiment_count').eq('id', postId).single();
    const { data: existing } = await db.from('post_sentiments').select('value').eq('user_id', userId).eq('post_id', postId).maybeSingle();
    
    if (existing) return res.status(400).json({ error: 'You already submitted sentiment for this post' });

    const sentimentSum = (post.sentiment_sum || 0) + value;
    const sentimentCount = (post.sentiment_count || 0) + 1;
    await db.from('post_sentiments').insert([{ user_id: userId, post_id: postId, value }]);
    await db.from('posts').update({ sentiment_sum: sentimentSum, sentiment_count: sentimentCount }).eq('id', postId);
    await awardPeks(userId, 1, 'Shared community sentiment 🌡️');

    const sentimentAvg = Math.round(sentimentSum / sentimentCount);
    io.emit('sentimentUpdate', { postId, sentiment_avg: sentimentAvg, sentiment_count: sentimentCount });
    res.json({ success: true, user_sentiment: value, sentiment_avg: sentimentAvg, sentiment_count: sentimentCount });
});

app.post('/api/posts/:id/poll-vote', authenticate, async (req, res) => {
    const postId = req.params.id;
    const { optionIndex } = req.body;
    const userId = req.userId;

    const { data: post } = await db.from('posts').select('*').eq('id', postId).single();
    if (!post || post.type !== 'poll') return res.status(404).json({ error: 'Poll not found' });
    
    const pollData = (typeof post.poll_data === 'string' ? JSON.parse(post.poll_data) : post.poll_data) || { options: [] };
    
    const { data: existingVote } = await db.from('poll_votes').select('option_index').eq('user_id', userId).eq('post_id', postId).maybeSingle();
    if (existingVote) return res.status(400).json({ error: 'You have already voted in this poll' });

    await db.from('poll_votes').insert([{ user_id: userId, post_id: postId, option_index: optionIndex }]);
    
    if (pollData.options[optionIndex]) {
        pollData.options[optionIndex].votes = (pollData.options[optionIndex].votes || 0) + 1;
        pollData.totalVotes = (pollData.totalVotes || 0) + 1;
    }

    await db.from('posts').update({ poll_data: pollData }).eq('id', postId);
    await awardPeks(userId, 8, 'Voted in a poll 📊');
    
    io.emit('pollUpdate', { postId, pollData });
    res.json({ success: true, pollData });
});

// ========== CIRCLES ENDPOINTS ==========

app.get('/api/circles', async (req, res) => {
    const { data: circles, error } = await db.from('circles').select('*');
    if (error) return res.status(500).json({ error: 'Failed to fetch circles' });
    res.json(circles || []);
});

app.post('/api/circles/join', authenticate, async (req, res) => {
    const { circle_id } = req.body;
    const userId = req.userId;

    const { error } = await db.from('user_circles').insert([{ user_id: userId, circle_id }], { ignoreDuplicates: true });
    
    if (!error) {
        await awardPeks(userId, 5, 'Joined a circle 🏘️');
        await db.rpc('increment_circle_members', { circle_id_param: circle_id });
    }
    res.json({ success: true });
});

// ========== USER PROFILE ENDPOINTS ==========

app.get('/api/user/profile', authenticate, async (req, res) => {
    const userId = req.userId;
    const { data: user, error: userError } = await db.from('users').select('id, username, email, peks, avatar_color, streak, last_login, created_at, streak_freezes, ad_free_until').eq('id', userId).single();
    if (userError) return res.status(500).json({ error: 'Failed to fetch profile' });

    const { data: circles } = await db.from('user_circles').select('circle_id').eq('user_id', userId);
    const { data: history } = await db.from('peks_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
    const { data: badges } = await db.from('user_badges').select('badge_id').eq('user_id', userId);
    const { data: stickers } = await db.from('user_stickers').select('sticker_id').eq('user_id', userId);

    res.json({ 
        user: { ...user, joinedCircles: circles ? circles.map(c => c.circle_id) : [] },
        history: history || [],
        badges: badges ? badges.map(b => b.badge_id) : [],
        stickers: stickers || []
    });
});

// ========== STREAK ENDPOINTS ==========

app.post('/api/user/claim-streak', authenticate, async (req, res) => {
    const userId = req.userId;
    const today = new Date().toISOString().split('T')[0];
    
    const { data: user } = await db.from('users').select('streak, last_login, peks').eq('id', userId).single();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (user.last_login === today) {
        return res.json({ success: true, alreadyClaimed: true, streak: user.streak });
    }
    
    let newStreak = user.last_login === yesterday ? (user.streak + 1) : 1;
    let bonusAmount = newStreak >= 7 ? 150 : newStreak >= 3 ? 75 : 50;
    let milestoneMessage = '';
    
    if (newStreak === 7) milestoneMessage = '🎉 7-day streak milestone! +200 bonus!';
    if (newStreak === 30) milestoneMessage = '🏆 30-day streak! Legendary!';
    
    const totalBonus = bonusAmount + (newStreak === 7 ? 200 : newStreak === 30 ? 500 : 0);
    
    await db.from('users').update({ 
        streak: newStreak, 
        last_login: today, 
        peks: (user.peks || 0) + totalBonus 
    }).eq('id', userId);
    
    await db.from('peks_history').insert([{ 
        user_id: userId, 
        amt: totalBonus, 
        reason: `Daily streak reward (Day ${newStreak}) 🔥 ${milestoneMessage}`
    }]);
    
    res.json({ success: true, streak: newStreak, bonus: totalBonus, totalPeks: (user.peks || 0) + totalBonus });
});

app.get('/api/user/streak-info', authenticate, async (req, res) => {
    const { data: user } = await db.from('users').select('streak, last_login, peks, streak_freezes').eq('id', req.userId).single();
    const today = new Date().toISOString().split('T')[0];
    const nextBonus = (user.streak + 1) >= 7 ? 150 : (user.streak + 1) >= 3 ? 75 : 50;
    res.json({ 
        streak: user.streak || 0, 
        claimedToday: user.last_login === today, 
        nextBonus: nextBonus,
        daysToMilestone: user.streak >= 7 ? null : (7 - user.streak),
        streakFreezes: user.streak_freezes || 0
    });
});

// ========== GAMES ENDPOINTS ==========

// Get daily game limit info
app.get('/api/games/limit', authenticate, async (req, res) => {
    const userId = req.userId;
    const { totalEarned, remaining } = await checkDailyGameLimit(userId);
    res.json({ 
        dailyLimit: DAILY_GAME_LIMIT, 
        earnedToday: totalEarned, 
        remainingToday: remaining,
        resetTime: 'midnight UTC'
    });
});

app.post('/api/games/spin-wheel', authenticate, async (req, res) => {
    const userId = req.userId;
    const today = new Date().toISOString().split('T')[0];
    
    // Check daily limit
    const { remaining, canEarn } = await checkDailyGameLimit(userId);
    if (!canEarn) {
        return res.json({ 
            success: false, 
            limitReached: true, 
            message: `Daily game limit of ${DAILY_GAME_LIMIT} PëKs reached! Come back tomorrow.` 
        });
    }
    
    const { data: lastGame } = await db.from('game_history').select('played_at').eq('user_id', userId).eq('game_type', 'wheel').order('played_at', { ascending: false }).limit(1).maybeSingle();
    
    if (lastGame && lastGame.played_at?.startsWith(today)) {
        return res.json({ success: false, alreadyPlayed: true });
    }
    
    const random = Math.random();
    let prize = Math.min(remaining, 10);
    let prizeLabel = '10 PëKs';
    
    if (random < 0.05 && remaining >= 500) { prize = Math.min(remaining, 500); prizeLabel = '500 PëKs - JACKPOT! 🎰'; }
    else if (random < 0.15 && remaining >= 100) { prize = Math.min(remaining, 100); prizeLabel = '100 PëKs'; }
    else if (random < 0.30 && remaining >= 50) { prize = Math.min(remaining, 50); prizeLabel = '50 PëKs'; }
    else if (random < 0.50 && remaining >= 20) { prize = Math.min(remaining, 20); prizeLabel = '20 PëKs'; }
    else { prize = Math.min(remaining, 10); prizeLabel = '10 PëKs'; }
    
    if (prize <= 0) {
        return res.json({ success: false, limitReached: true, message: 'Daily limit reached!' });
    }
    
    await awardPeks(userId, prize, `Spin Wheel Game - Won ${prizeLabel} 🎡`);
    await db.from('game_history').insert([{ user_id: userId, game_type: 'wheel', prize: prize, played_at: new Date().toISOString() }]);
    
    const { remaining: newRemaining } = await checkDailyGameLimit(userId);
    
    res.json({ success: true, prize, prizeLabel, remainingToday: newRemaining, dailyLimit: DAILY_GAME_LIMIT });
});

app.post('/api/games/coin-flip', authenticate, async (req, res) => {
    const userId = req.userId;
    const { bet, choice } = req.body;
    
    // Check daily limit for potential winnings
    const { remaining, canEarn } = await checkDailyGameLimit(userId);
    if (!canEarn) {
        return res.json({ 
            success: false, 
            limitReached: true, 
            message: `Daily game limit of ${DAILY_GAME_LIMIT} PëKs reached!` 
        });
    }
    
    if (!bet || bet < 5 || bet > 100) {
        return res.json({ success: false, error: 'Bet must be between 5 and 100 PëKs' });
    }
    
    const { data: user } = await db.from('users').select('peks').eq('id', userId).single();
    if (!user || user.peks < bet) {
        return res.json({ success: false, error: 'Insufficient PëKs!' });
    }
    
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = choice === result;
    const winAmount = won ? Math.min(bet, remaining) : 0;
    
    if (won && winAmount <= 0) {
        return res.json({ success: false, limitReached: true, message: 'Daily limit reached! Cannot win more today.' });
    }
    
    if (won) {
        await awardPeks(userId, winAmount, `Won Coin Flip! 🪙 Chose ${choice}, got ${result}`);
        res.json({ success: true, won: true, result, winAmount, newBalance: user.peks + winAmount });
    } else {
        await db.rpc('increment_peks', { user_id_param: userId, amount: -bet });
        await db.from('peks_history').insert([{ user_id: userId, amt: -bet, reason: `Lost Coin Flip 🪙 - Bet ${bet} PëKs` }]);
        res.json({ success: true, won: false, result, newBalance: user.peks - bet });
    }
    
    await db.from('game_history').insert([{ user_id: userId, game_type: 'coinflip', prize: won ? winAmount : -bet, played_at: new Date().toISOString() }]);
});

// Tic Tac Toe game - record win
app.post('/api/games/tictactoe', authenticate, async (req, res) => {
    const userId = req.userId;
    const { won, prize } = req.body;
    
    if (won && prize > 0) {
        const { remaining, canEarn } = await checkDailyGameLimit(userId);
        if (!canEarn) {
            return res.json({ success: false, limitReached: true, message: 'Daily game limit reached!' });
        }
        
        const actualPrize = Math.min(prize, remaining);
        if (actualPrize > 0) {
            await awardPeks(userId, actualPrize, `Won Tic Tac Toe game! 🎮`);
            await db.from('game_history').insert([{ user_id: userId, game_type: 'tictactoe', prize: actualPrize, played_at: new Date().toISOString() }]);
            res.json({ success: true, prize: actualPrize });
        } else {
            res.json({ success: false, limitReached: true });
        }
    } else {
        await db.from('game_history').insert([{ user_id: userId, game_type: 'tictactoe', prize: 0, played_at: new Date().toISOString() }]);
        res.json({ success: true, prize: 0 });
    }
});

// Connect 4 game - record win
app.post('/api/games/connect4', authenticate, async (req, res) => {
    const userId = req.userId;
    const { won, prize } = req.body;
    
    if (won && prize > 0) {
        const { remaining, canEarn } = await checkDailyGameLimit(userId);
        if (!canEarn) {
            return res.json({ success: false, limitReached: true, message: 'Daily game limit reached!' });
        }
        
        const actualPrize = Math.min(prize, remaining);
        if (actualPrize > 0) {
            await awardPeks(userId, actualPrize, `Won Connect 4 game! 🎮`);
            await db.from('game_history').insert([{ user_id: userId, game_type: 'connect4', prize: actualPrize, played_at: new Date().toISOString() }]);
            res.json({ success: true, prize: actualPrize });
        } else {
            res.json({ success: false, limitReached: true });
        }
    } else {
        await db.from('game_history').insert([{ user_id: userId, game_type: 'connect4', prize: 0, played_at: new Date().toISOString() }]);
        res.json({ success: true, prize: 0 });
    }
});

// ========== STICKERS SYSTEM ==========

app.get('/api/stickers', async (req, res) => {
    const { data: stickers } = await db.from('stickers').select('*');
    res.json(stickers || []);
});

app.get('/api/user/stickers', authenticate, async (req, res) => {
    const { data: stickers } = await db.from('user_stickers').select('*').eq('user_id', req.userId);
    res.json(stickers || []);
});

app.post('/api/stickers/buy', authenticate, async (req, res) => {
    const { stickerId } = req.body;
    const userId = req.userId;
    
    const { data: sticker } = await db.from('stickers').select('*').eq('id', stickerId).single();
    if (!sticker) return res.status(404).json({ error: 'Sticker not found' });
    
    const { data: user } = await db.from('users').select('peks').eq('id', userId).single();
    if (user.peks < sticker.price) {
        return res.status(400).json({ error: 'Insufficient PëKs' });
    }
    
    await db.rpc('increment_peks', { user_id_param: userId, amount: -sticker.price });
    await db.from('peks_history').insert([{ user_id: userId, amt: -sticker.price, reason: `Purchased sticker: ${sticker.name}` }]);
    await db.from('user_stickers').insert([{ user_id: userId, sticker_id: stickerId, purchased_at: new Date().toISOString() }]);
    
    if (sticker.creator_id) {
        await awardPeksWithCommunity(sticker.creator_id, 5, `Someone bought your sticker: ${sticker.name}`, null);
    }
    
    res.json({ success: true, sticker });
});

app.post('/api/posts/:id/sticker', authenticate, async (req, res) => {
    const postId = req.params.id;
    const { stickerId } = req.body;
    const userId = req.userId;
    
    const { data: userSticker } = await db.from('user_stickers').select('*').eq('user_id', userId).eq('sticker_id', stickerId).single();
    if (!userSticker) return res.status(400).json({ error: 'You don\'t own this sticker' });
    
    await db.from('post_stickers').insert([{ post_id: postId, user_id: userId, sticker_id: stickerId, created_at: new Date().toISOString() }]);
    
    const { data: sticker } = await db.from('stickers').select('creator_id').eq('id', stickerId).single();
    if (sticker && sticker.creator_id) {
        await awardPeksWithCommunity(sticker.creator_id, 5, `Someone used your sticker on a post`, postId);
    }
    
    io.emit('stickerUsed', { postId, stickerId, userId });
    res.json({ success: true });
});

// ========== BOOST SYSTEM ==========

app.post('/api/posts/:id/boost', authenticate, async (req, res) => {
    const postId = req.params.id;
    const userId = req.userId;
    const { hours = 24 } = req.body;
    
    const boostCost = hours * 10;
    if (boostCost < 10) return res.status(400).json({ error: 'Minimum boost is 1 hour (10 PëKs)' });
    
    const { data: user } = await db.from('users').select('peks').eq('id', userId).single();
    if (user.peks < boostCost) {
        return res.status(400).json({ error: 'Insufficient PëKs' });
    }
    
    await db.rpc('increment_peks', { user_id_param: userId, amount: -boostCost });
    await db.from('peks_history').insert([{ user_id: userId, amt: -boostCost, reason: `Boosted post for ${hours} hours 🚀` }]);
    
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    await db.from('boosts').insert([{ post_id: postId, user_id: userId, hours, expires_at: expiresAt, created_at: new Date().toISOString() }]);
    await db.from('posts').update({ is_boosted: true, boost_expires_at: expiresAt }).eq('id', postId);
    
    io.emit('postBoosted', { postId, userId, hours });
    res.json({ success: true, boostCost });
});

// ========== PEER TIPPING ==========

app.post('/api/tip', authenticate, async (req, res) => {
    const { recipientId, amount, message } = req.body;
    const senderId = req.userId;
    
    if (amount < 1) return res.status(400).json({ error: 'Minimum tip is 1 PëK' });
    if (amount > 1000) return res.status(400).json({ error: 'Maximum tip is 1000 PëKs' });
    
    const { data: sender } = await db.from('users').select('peks').eq('id', senderId).single();
    if (sender.peks < amount) {
        return res.status(400).json({ error: 'Insufficient PëKs' });
    }
    
    await db.rpc('increment_peks', { user_id_param: senderId, amount: -amount });
    await db.from('peks_history').insert([{ user_id: senderId, amt: -amount, reason: `Tipped ${amount} PëKs to user ${recipientId}` }]);
    await awardPeksWithCommunity(recipientId, amount, `Received a tip of ${amount} PëKs! 💝 ${message || ''}`, null);
    await db.from('peer_tips').insert([{
        sender_id: senderId,
        recipient_id: recipientId,
        amount,
        message: message || '',
        created_at: new Date().toISOString()
    }]);
    
    res.json({ success: true, amount });
});

// ========== STREAK FREEZE ==========

app.post('/api/streak-freeze/buy', authenticate, async (req, res) => {
    const userId = req.userId;
    const FREEZE_COST = 50;
    
    const { data: user } = await db.from('users').select('peks, streak_freezes').eq('id', userId).single();
    if (user.peks < FREEZE_COST) {
        return res.status(400).json({ error: 'Insufficient PëKs' });
    }
    
    await db.rpc('increment_peks', { user_id_param: userId, amount: -FREEZE_COST });
    await db.from('peks_history').insert([{ user_id: userId, amt: -FREEZE_COST, reason: `Purchased streak freeze 🧊` }]);
    
    const currentFreezes = user.streak_freezes || 0;
    await db.from('users').update({ streak_freezes: currentFreezes + 1 }).eq('id', userId);
    
    res.json({ success: true, freezes: currentFreezes + 1 });
});

app.post('/api/streak-freeze/use', authenticate, async (req, res) => {
    const userId = req.userId;
    
    const { data: user } = await db.from('users').select('streak, streak_freezes, last_login').eq('id', userId).single();
    if (user.streak_freezes < 1) {
        return res.status(400).json({ error: 'No streak freezes available' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (user.last_login !== yesterday && user.last_login !== today) {
        await db.from('users').update({ 
            streak_freezes: user.streak_freezes - 1,
            last_login: today
        }).eq('id', userId);
        
        await db.from('peks_history').insert([{ user_id: userId, amt: 0, reason: `Used streak freeze 🧊 - Streak preserved!` }]);
        
        res.json({ success: true, message: 'Streak freeze used! Your streak is preserved.' });
    } else {
        res.json({ success: false, message: 'No streak to freeze. You logged in yesterday.' });
    }
});

// ========== PROFILE CUSTOMIZATION ==========

app.post('/api/profile/customize', authenticate, async (req, res) => {
    const userId = req.userId;
    const { themeColor, avatarBorder, customBadge } = req.body;
    const cost = 200;
    
    const { data: user } = await db.from('users').select('peks').eq('id', userId).single();
    if (user.peks < cost) {
        return res.status(400).json({ error: 'Insufficient PëKs' });
    }
    
    await db.rpc('increment_peks', { user_id_param: userId, amount: -cost });
    await db.from('peks_history').insert([{ user_id: userId, amt: -cost, reason: `Purchased profile customization 🎨` }]);
    
    await db.from('profile_customizations').insert([{
        user_id: userId,
        theme_color: themeColor,
        avatar_border: avatarBorder,
        custom_badge: customBadge,
        purchased_at: new Date().toISOString()
    }]);
    
    await db.from('users').update({ 
        custom_theme: themeColor,
        avatar_border: avatarBorder
    }).eq('id', userId);
    
    res.json({ success: true });
});

// ========== COUPONS / DISCOUNTS ==========

app.post('/api/coupons/generate', authenticate, async (req, res) => {
    const userId = req.userId;
    const { discountPercent, expiresInDays = 7 } = req.body;
    
    const couponCode = `PEKOE${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
    
    await db.from('coupons').insert([{
        code: couponCode,
        discount_percent: discountPercent || 10,
        created_by: userId,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
    }]);
    
    res.json({ success: true, couponCode, discountPercent: discountPercent || 10, expiresAt });
});

app.post('/api/coupons/apply', authenticate, async (req, res) => {
    const { couponCode, purchaseAmount } = req.body;
    
    const { data: coupon } = await db.from('coupons').select('*').eq('code', couponCode).single();
    if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' });
    if (new Date(coupon.expires_at) < new Date()) return res.status(400).json({ error: 'Coupon expired' });
    
    const discount = Math.floor(purchaseAmount * (coupon.discount_percent / 100));
    const finalAmount = purchaseAmount - discount;
    
    res.json({ success: true, discount, finalAmount, couponCode });
});

// ========== COMMUNITY FUND ==========

app.get('/api/community/fund', async (req, res) => {
    const { data: fund } = await db.from('community_fund').select('amount').single();
    res.json({ total: fund?.amount || 0 });
});

// ========== USER BALANCE ==========

app.get('/api/user/balance', authenticate, async (req, res) => {
    const userId = req.userId;
    const { data: user } = await db.from('users').select('peks, streak, streak_freezes, username, ad_free_until').eq('id', userId).single();
    
    const { data: stickers } = await db.from('user_stickers').select('sticker_id').eq('user_id', userId);
    const { data: boosts } = await db.from('boosts').select('*').eq('user_id', userId);
    const { data: tips } = await db.from('peer_tips').select('*').eq('recipient_id', userId).order('created_at', { ascending: false }).limit(10);
    
    res.json({
        balance: user?.peks || 0,
        streak: user?.streak || 0,
        streakFreezes: user?.streak_freezes || 0,
        stickersOwned: stickers?.length || 0,
        activeBoosts: boosts?.filter(b => new Date(b.expires_at) > new Date()).length || 0,
        recentTips: tips || [],
        hasAdFree: user?.ad_free_until && new Date(user.ad_free_until) > new Date()
    });
});

// ========== AD-FREE EXPERIENCE ==========

app.post('/api/ad-free/purchase', authenticate, async (req, res) => {
    const userId = req.userId;
    const COST = 500;
    
    const { data: user } = await db.from('users').select('peks').eq('id', userId).single();
    if (user.peks < COST) {
        return res.status(400).json({ error: 'Insufficient PëKs' });
    }
    
    await db.rpc('increment_peks', { user_id_param: userId, amount: -COST });
    await db.from('peks_history').insert([{ user_id: userId, amt: -COST, reason: `Purchased ad-free experience (30 days) 🚫📢` }]);
    
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await db.from('users').update({ ad_free_until: expiresAt }).eq('id', userId);
    
    res.json({ success: true, expiresAt });
});

app.get('/api/ad-free/status', authenticate, async (req, res) => {
    const userId = req.userId;
    const { data: user } = await db.from('users').select('ad_free_until').eq('id', userId).single();
    
    const hasAdFree = user?.ad_free_until && new Date(user.ad_free_until) > new Date();
    res.json({ hasAdFree, expiresAt: user?.ad_free_until });
});

// ========== LEADERBOARD ==========

app.get('/api/leaderboard', async (req, res) => {
    const { data: rows, error } = await db.from('users').select('username, peks, avatar_color').order('peks', { ascending: false }).limit(12);
    if (error) return res.status(500).json({ error: 'Failed to fetch leaderboard' });
    // Map to shape expected by frontend LeaderboardPage (name + av)
    res.json((rows || []).map(r => ({ name: r.username, peks: r.peks, av: r.avatar_color })));
});

app.get('/api/stats/live', async (req, res) => {
    const { data: users } = await db.from('users').select('id');
    const memberCount = users?.length || 0;
    const online = Math.max(1200, memberCount * 12 + userSockets.size * 47);
    res.json({ online, members: memberCount });
});

app.get('/api/verify/posts', authenticate, async (req, res) => {
    const { data: posts } = await db.from('posts').select('*').order('created_at', { ascending: false }).limit(100);
    const flagged = (posts || []).filter((p) => p.flagged);
    res.json(flagged);
});

// ========== QUEST REWARDS ==========

app.post('/api/user/quest-reward', authenticate, async (req, res) => {
    const amount = Math.min(100, Math.max(1, parseInt(req.body.amount, 10) || 0));
    const reason = (req.body.reason || 'Daily quest complete 🎯').slice(0, 120);
    if (!amount) return res.status(400).json({ error: 'Invalid reward' });
    await awardPeks(req.userId, amount, reason);
    const { data: user } = await db.from('users').select('peks').eq('id', req.userId).single();
    res.json({ success: true, peks: user?.peks });
});

// ========== SOCKET.IO ==========

io.on('connection', (socket) => {
    console.log('Client connected');
    socket.on('register', (userId) => {
        userSockets.set(userId, socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`);
    });
    socket.on('disconnect', () => {
        for (let [uid, sid] of userSockets.entries()) {
            if (sid === socket.id) userSockets.delete(uid);
        }
    });
});

// ========== START SERVER ==========

server.listen(PORT, '0.0.0.0', () => {
    console.log(`PëKœ Server running on port ${PORT}`);
    console.log(`Local:   http://localhost:${PORT}`);
    console.log(`Network: http://192.168.1.13:${PORT}  (share with other devices)`);
    console.log(`JWT_SECRET loaded: ${JWT_SECRET ? 'Yes' : 'No'}`);
    console.log(`Daily game limit: ${DAILY_GAME_LIMIT} PëKs per day`);
});