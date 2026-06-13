require('dotenv').config({ override: true });
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_ANON_KEY || '').trim();

function createLocalDb() {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 3600000).toISOString();
    const expiresHot = new Date(now.getTime() + 3600000 * 2).toISOString();
    const nowIso = now.toISOString();

    const dbData = {
        users: [],
        user_badges: [],
        peks_history: [],
        game_history: [],
        transactions: [],
        boosts: [],
        stickers: [],
        user_stickers: [],
        post_stickers: [],
        peer_tips: [],
        streak_freezes: [],
        profile_customizations: [],
        coupons: [],
        user_coupons: [],
        community_fund: [{ id: 1, amount: 0 }],
        posts: [
            {
                id: 'post_demo_1',
                user_id: 'u_demo_1',
                username: 'DrMeeraK',
                avatar_color: '#0D9488',
                type: 'text',
                circle_id: 'policy',
                title: 'Should India adopt a four-day work week nationally?',
                body: 'Evidence from pilot programs in Kerala and Karnataka suggests productivity gains without harming output. The key is sector-specific rollout.',
                image_url: null,
                category: 'general',
                votes: 412,
                dn: 28,
                verified: 'verified',
                flagged: false,
                star_sum: 92,
                star_count: 22,
                sentiment_sum: 340,
                sentiment_count: 45,
                sideA: null,
                sideB: null,
                created_at: hourAgo,
                expires_at: null,
                poll_data: null,
                review_data: null,
                ranked_list_data: null,
                is_boosted: false,
                boost_expires_at: null,
            },
            {
                id: 'post_demo_2',
                user_id: 'u_demo_2',
                username: 'Priya_K',
                avatar_color: '#E8531F',
                type: 'text',
                circle_id: 'india',
                title: 'Why India should celebrate local startups more',
                body: 'Homegrown founders are building the next generation of communities, climate products, and creator economies.',
                image_url: null,
                category: 'business',
                votes: 284,
                dn: 12,
                verified: null,
                flagged: false,
                star_sum: 45,
                star_count: 12,
                sentiment_sum: 180,
                sentiment_count: 30,
                sideA: null,
                sideB: null,
                created_at: hourAgo,
                expires_at: null,
                poll_data: null,
                review_data: null,
                ranked_list_data: null,
                is_boosted: false,
                boost_expires_at: null,
            },
            {
                id: 'post_demo_3',
                user_id: 'u_demo_3',
                username: 'RohanV',
                avatar_color: '#2563EB',
                type: 'hot',
                circle_id: 'tech',
                title: 'Remote work killed Bangalore traffic — and nobody wants to admit it.',
                body: 'The city is quieter on weekdays but cafes are emptier. We traded gridlock for ghost neighbourhoods.',
                image_url: null,
                category: 'general',
                votes: 198,
                dn: 67,
                verified: null,
                flagged: false,
                star_sum: 0,
                star_count: 0,
                sentiment_sum: 0,
                sentiment_count: 0,
                sideA: null,
                sideB: null,
                created_at: hourAgo,
                expires_at: expiresHot,
                poll_data: null,
                review_data: null,
                ranked_list_data: null,
                is_boosted: false,
                boost_expires_at: null,
            },
            {
                id: 'post_demo_4',
                user_id: 'u_demo_4',
                username: 'TechGuru_Blr',
                avatar_color: '#7C3AED',
                type: 'hot',
                circle_id: 'tech',
                title: 'Cricket is still India\'s real national language — not Hindi or English.',
                body: 'You can bond with anyone over a match. No other cultural force comes close.',
                image_url: null,
                category: 'sports',
                votes: 156,
                dn: 44,
                verified: null,
                flagged: false,
                star_sum: 0,
                star_count: 0,
                sentiment_sum: 0,
                sentiment_count: 0,
                sideA: null,
                sideB: null,
                created_at: hourAgo,
                expires_at: expiresHot,
                poll_data: null,
                review_data: null,
                ranked_list_data: null,
                is_boosted: false,
                boost_expires_at: null,
            },
            {
                id: 'post_demo_5',
                user_id: 'u_demo_5',
                username: 'PolicyNerd_Dev',
                avatar_color: '#10B981',
                type: 'townhall',
                circle_id: 'policy',
                title: 'Which city deserves to be India\'s next tech capital?',
                body: '',
                image_url: null,
                category: 'general',
                votes: 1240,
                dn: 890,
                verified: null,
                flagged: false,
                star_sum: 0,
                star_count: 0,
                sentiment_sum: 0,
                sentiment_count: 0,
                sideA: 'Bengaluru',
                sideB: 'Hyderabad',
                created_at: hourAgo,
                expires_at: null,
                poll_data: null,
                review_data: null,
                ranked_list_data: null,
                is_boosted: false,
                boost_expires_at: null,
            },
            {
                id: 'post_demo_6',
                user_id: 'u_demo_6',
                username: 'mumbaikar_99',
                avatar_color: '#F5A623',
                type: 'townhall',
                circle_id: 'culture',
                title: 'Should Bollywood focus more on regional stories?',
                body: '',
                image_url: null,
                category: 'entertainment',
                votes: 720,
                dn: 680,
                verified: null,
                flagged: false,
                star_sum: 0,
                star_count: 0,
                sentiment_sum: 0,
                sentiment_count: 0,
                sideA: 'Yes — diversity wins',
                sideB: 'No — keep it pan-India',
                created_at: hourAgo,
                expires_at: null,
                poll_data: null,
                review_data: null,
                ranked_list_data: null,
                is_boosted: false,
                boost_expires_at: null,
            },
            {
                id: 'post_demo_7',
                user_id: 'u_demo_7',
                username: 'Deepa_S',
                avatar_color: '#10B981',
                type: 'poll',
                circle_id: 'culture',
                title: 'Which city has the best street food?',
                body: '',
                image_url: null,
                category: 'general',
                votes: 152,
                dn: 1,
                verified: null,
                flagged: false,
                star_sum: 20,
                star_count: 5,
                sentiment_sum: 0,
                sentiment_count: 0,
                sideA: null,
                sideB: null,
                created_at: hourAgo,
                expires_at: null,
                poll_data: {
                    options: [
                        { text: 'Mumbai', votes: 54 },
                        { text: 'Delhi', votes: 46 },
                        { text: 'Kolkata', votes: 38 },
                        { text: 'Chennai', votes: 14 },
                    ],
                    totalVotes: 152,
                },
                review_data: null,
                ranked_list_data: null,
                is_boosted: false,
                boost_expires_at: null,
            },
            {
                id: 'post_demo_8',
                user_id: 'u_demo_8',
                username: 'CricketBhai',
                avatar_color: '#EF4444',
                type: 'text',
                circle_id: 'sports',
                title: 'This viral claim about IPL ticket prices is misleading',
                body: 'The screenshot being shared is from 2019. Current prices are lower for most stands.',
                image_url: null,
                category: 'sports',
                votes: 89,
                dn: 5,
                verified: 'misleading',
                flagged: true,
                star_sum: 8,
                star_count: 3,
                sentiment_sum: 40,
                sentiment_count: 8,
                sideA: null,
                sideB: null,
                created_at: hourAgo,
                expires_at: null,
                poll_data: null,
                review_data: null,
                ranked_list_data: null,
                is_boosted: false,
                boost_expires_at: null,
            },
            {
                id: 'post_demo_review_1',
                user_id: 'u_demo_2',
                username: 'MovieBuff',
                avatar_color: '#7C3AED',
                type: 'review',
                circle_id: 'culture',
                title: 'Oppenheimer - A Cinematic Masterpiece',
                body: 'Nolan delivers his best work yet. The acting, cinematography, and storytelling are top-notch.',
                image_url: 'https://via.placeholder.com/300x200?text=Movie+Review',
                category: 'entertainment',
                votes: 234,
                dn: 12,
                verified: null,
                flagged: false,
                star_sum: 45,
                star_count: 10,
                sentiment_sum: 0,
                sentiment_count: 0,
                sideA: null,
                sideB: null,
                created_at: new Date(Date.now() - 7200000).toISOString(),
                expires_at: null,
                poll_data: null,
                review_data: { rating: 5, itemType: 'movie', itemName: 'Oppenheimer' },
                ranked_list_data: null,
                is_boosted: false,
                boost_expires_at: null,
            },
            {
                id: 'post_demo_list_1',
                user_id: 'u_demo_3',
                username: 'BookWorm',
                avatar_color: '#10B981',
                type: 'ranked_list',
                circle_id: 'culture',
                title: 'Top 5 Books to Read This Year',
                body: 'Must-read recommendations for every book lover.',
                image_url: null,
                category: 'general',
                votes: 156,
                dn: 8,
                verified: null,
                flagged: false,
                star_sum: 28,
                star_count: 7,
                sentiment_sum: 0,
                sentiment_count: 0,
                sideA: null,
                sideB: null,
                created_at: new Date(Date.now() - 7200000).toISOString(),
                expires_at: null,
                poll_data: null,
                review_data: null,
                ranked_list_data: {
                    items: [
                        { rank: 1, title: 'Project Hail Mary', description: 'Sci-fi masterpiece by Andy Weir' },
                        { rank: 2, title: 'The Seven Husbands of Evelyn Hugo', description: 'Drama and mystery' },
                        { rank: 3, title: 'Atomic Habits', description: 'Self-improvement classic' },
                        { rank: 4, title: 'Dune', description: 'Epic sci-fi saga' },
                        { rank: 5, title: 'The Silent Patient', description: 'Psychological thriller' }
                    ]
                },
                is_boosted: false,
                boost_expires_at: null,
            },
            {
                id: 'post_demo_text_1',
                user_id: 'u_demo_4',
                username: 'TechGuru_Blr',
                avatar_color: '#2563EB',
                type: 'text',
                circle_id: 'tech',
                title: 'The Future of AI in India',
                body: 'Artificial intelligence is transforming how we work and live. From healthcare to agriculture, AI applications are growing rapidly. This is a 150+ word post demonstrating the new text post feature with category selection and optional image attachment.',
                image_url: 'https://via.placeholder.com/400x200?text=AI+Future',
                category: 'technology',
                votes: 89,
                dn: 5,
                verified: null,
                flagged: false,
                star_sum: 15,
                star_count: 4,
                sentiment_sum: 0,
                sentiment_count: 0,
                sideA: null,
                sideB: null,
                created_at: new Date(Date.now() - 3600000).toISOString(),
                expires_at: null,
                poll_data: null,
                review_data: null,
                ranked_list_data: null,
                is_boosted: false,
                boost_expires_at: null,
            },
        ],
        post_votes: [],
        poll_votes: [],
        post_flags: [],
        post_ratings: [],
        post_sentiments: [],
        circles: [
            { id: 'india', name: 'India', icon: '🇮🇳', description: 'Main public square for national conversations.', members: 98230, created_at: nowIso },
            { id: 'tech', name: 'Tech', icon: '💻', description: 'Innovation, startups, AI, and future tech.', members: 75412, created_at: nowIso },
            { id: 'culture', name: 'Culture', icon: '🎭', description: 'Art, film, lifestyle, and creativity.', members: 61320, created_at: nowIso },
            { id: 'sports', name: 'Sports', icon: '🏏', description: 'Match talk, fandom, and predictions.', members: 84210, created_at: nowIso },
            { id: 'policy', name: 'Policy', icon: '⚖️', description: 'Governance, laws, and civic debate.', members: 50110, created_at: nowIso },
        ],
        stickers: [
            { id: 'sticker_1', name: '🔥 Fire', icon: '🔥', price: 10, creator_id: null },
            { id: 'sticker_2', name: '💯 100', icon: '💯', price: 10, creator_id: null },
            { id: 'sticker_3', name: '😂 Laugh', icon: '😂', price: 15, creator_id: null },
            { id: 'sticker_4', name: '❤️ Love', icon: '❤️', price: 10, creator_id: null },
            { id: 'sticker_5', name: '🎉 Celebration', icon: '🎉', price: 20, creator_id: null },
            { id: 'sticker_6', name: '⭐ Star', icon: '⭐', price: 15, creator_id: null },
            { id: 'sticker_7', name: '🏆 Trophy', icon: '🏆', price: 50, creator_id: null },
            { id: 'sticker_8', name: '👑 Crown', icon: '👑', price: 100, creator_id: null },
        ],
        user_stickers: [],
        post_stickers: [],
        peer_tips: [],
        streak_freezes: [],
        profile_customizations: [],
        coupons: [],
        user_coupons: [],
        user_circles: [],
        comments: [
            {
                id: uuidv4(),
                post_id: 'post_demo_1',
                user_id: 'u_demo_2',
                username: 'Priya_K',
                text: 'Strong agree — pilots in IT services showed real gains.',
                avatar_color: '#E8531F',
                created_at: hourAgo,
            },
        ],
    };

    const clone = (obj) => JSON.parse(JSON.stringify(obj));

    class LocalQuery {
        constructor(table) {
            this.table = table;
            this.filters = [];
            this.orderField = null;
            this.orderAsc = true;
            this.limitNum = null;
            this.insertedRows = null;
            this.pendingUpdate = null;
            this.pendingDelete = false;
        }

        select() { return this; }

        eq(field, value) {
            this.filters.push((row) => row[field] === value);
            return this;
        }

        in(field, values) {
            this.filters.push((row) => values.includes(row[field]));
            return this;
        }

        order(field, opts = {}) {
            this.orderField = field;
            this.orderAsc = opts.ascending !== false;
            return this;
        }

        limit(count) {
            this.limitNum = count;
            return this;
        }

        _mutate() {
            if (this.pendingDelete) {
                this.pendingDelete = false;
                const rows = this._rows();
                const keys = new Set(rows.map((r) => r.id || `${r.user_id}:${r.post_id}`));
                dbData[this.table] = (dbData[this.table] || []).filter((item) => {
                    const key = item.id || `${item.user_id}:${item.post_id}`;
                    return !keys.has(key);
                });
                return { data: rows.map(clone), error: null };
            }
            if (this.pendingUpdate) {
                const changes = this.pendingUpdate;
                this.pendingUpdate = null;
                const rows = this._rows();
                rows.forEach((row) => {
                    const idx = dbData[this.table].findIndex((item) => {
                        if (item.id && row.id) return item.id === row.id;
                        if (this.table === 'post_votes' || this.table === 'post_ratings' || this.table === 'post_sentiments') {
                            return item.user_id === row.user_id && item.post_id === row.post_id;
                        }
                        return false;
                    });
                    if (idx >= 0) {
                        dbData[this.table][idx] = { ...dbData[this.table][idx], ...changes };
                    }
                });
                return { data: rows.map(clone), error: null };
            }
            return { data: this._rows(), error: null };
        }

        then(resolve, reject) {
            try {
                resolve(this._mutate());
            } catch (e) {
                if (reject) reject(e);
                else throw e;
            }
        }

        _rows() {
            let rows = dbData[this.table] || [];
            rows = rows.filter((row) => this.filters.every((fn) => fn(row)));
            if (this.orderField) {
                rows = [...rows].sort((a, b) => {
                    const aVal = a[this.orderField];
                    const bVal = b[this.orderField];
                    if (aVal === bVal) return 0;
                    if (aVal === undefined || aVal === null) return 1;
                    if (bVal === undefined || bVal === null) return -1;
                    return this.orderAsc ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
                });
            }
            if (this.limitNum != null) {
                rows = rows.slice(0, this.limitNum);
            }
            return rows.map(clone);
        }

        maybeSingle() {
            if (this.insertedRows) {
                return { data: this.insertedRows[0] || null, error: null };
            }
            const { data: rows } = this._mutate();
            return { data: rows[0] || null, error: null };
        }

        single() {
            if (this.insertedRows) {
                return { data: this.insertedRows[0] || null, error: null };
            }
            const { data: rows } = this._mutate();
            if (rows.length === 0) return { data: null, error: new Error('No rows found') };
            return { data: rows[0], error: null };
        }

        insert(records, opts = {}) {
            const items = Array.isArray(records) ? records : [records];
            const inserted = [];
            items.forEach((item) => {
                const row = { ...item };
                if (!row.id && this.table !== 'post_votes' && this.table !== 'poll_votes' && this.table !== 'user_circles') {
                    row.id = uuidv4();
                }
                if (!row.created_at && ['users', 'posts', 'comments', 'peks_history', 'game_history', 'transactions', 'boosts', 'peer_tips'].includes(this.table)) {
                    row.created_at = new Date().toISOString();
                }
                const exists = opts.ignoreDuplicates && dbData[this.table].some((existing) => {
                    if (this.table === 'user_circles') {
                        return existing.user_id === row.user_id && existing.circle_id === row.circle_id;
                    }
                    if (this.table === 'post_votes') {
                        return existing.user_id === row.user_id && existing.post_id === row.post_id;
                    }
                    return false;
                });
                if (!exists) {
                    dbData[this.table].push(row);
                    inserted.push(clone(row));
                }
            });
            this.insertedRows = inserted;
            const chain = {
                select: () => chain,
                single: () => ({ data: inserted[0] || null, error: null }),
            };
            return { data: inserted, error: null, select: () => chain, single: () => ({ data: inserted[0] || null, error: null }) };
        }

        update(changes) {
            this.pendingUpdate = changes;
            return this;
        }

        delete() {
            this.pendingDelete = true;
            return this;
        }
    }

    function findPost(postId) {
        return dbData.posts.find((p) => p.id === postId);
    }

    return {
        from(table) {
            return new LocalQuery(table);
        },
        rpc(name, params) {
            if (name === 'increment_peks') {
                const user = dbData.users.find((u) => u.id === params.user_id_param);
                if (!user) return { data: null, error: new Error('User not found') };
                user.peks = (user.peks || 0) + params.amount;
                return { data: null, error: null };
            }
            if (name === 'increment_community_fund') {
                const fund = dbData.community_fund[0];
                if (fund) fund.amount = (fund.amount || 0) + params.amount;
                return { data: null, error: null };
            }
            if (name === 'increment_circle_members') {
                const circle = dbData.circles.find((c) => c.id === params.circle_id_param);
                if (circle) circle.members = (circle.members || 0) + 1;
                return { data: null, error: null };
            }
            if (name === 'increment_votes') {
                const post = findPost(params.post_id_param);
                if (post) post.votes = (post.votes || 0) + 1;
                return { data: null, error: null };
            }
            if (name === 'decrement_votes') {
                const post = findPost(params.post_id_param);
                if (post) post.votes = Math.max(0, (post.votes || 0) - 1);
                return { data: null, error: null };
            }
            if (name === 'increment_dn') {
                const post = findPost(params.post_id_param);
                if (post) post.dn = (post.dn || 0) + 1;
                return { data: null, error: null };
            }
            if (name === 'decrement_dn') {
                const post = findPost(params.post_id_param);
                if (post) post.dn = Math.max(0, (post.dn || 0) - 1);
                return { data: null, error: null };
            }
            return { data: null, error: new Error('Unknown RPC function') };
        },
    };
}

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_SUPABASE')) {
    console.warn('WARNING: Supabase credentials missing. Falling back to local in-memory database.');
    module.exports = createLocalDb();
} else {
    try {
        module.exports = createClient(supabaseUrl, supabaseKey);
    } catch (e) {
        console.error('FATAL ERROR: Supabase client failed to init.', e.message);
        module.exports = createLocalDb();
    }
}