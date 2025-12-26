// server/index.js

// ==========================================
// 1. 引入 Sentry (必须在最顶部)
// ==========================================
const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

// 引入其他依赖
const express = require('express');
const cors = require('cors');
const db = require('./db'); 

// ==========================================
// 2. 初始化 Express 实例 (必须在 Sentry.init 之前！)
// ==========================================
const app = express();

// ==========================================
// 3. 初始化 Sentry (v8 新写法)
// ==========================================
Sentry.init({
  // 👇👇👇【重要】请确认这里填的是你的后端 DSN 👇👇👇
  dsn: process.env.SENTRY_DSN || "https://42e77723c7b68c3c82577a4bc1444fcb@o4510600053522432.ingest.us.sentry.io/4510600228765696", 
  
  integrations: [
    // 启用 HTTP 调用跟踪
    Sentry.httpIntegration(),
    // 🔥 v8 关键：在这里传入 app，它会自动帮你做请求和追踪拦截，不用手动写 app.use 了
    Sentry.expressIntegration({ app }),
    nodeProfilingIntegration(),
  ],
  
  // 性能追踪采样率
  tracesSampleRate: 1.0, 
  // 性能分析采样率
  profilesSampleRate: 1.0, 
});

// --- 原有的中间件 ---
app.use(cors({
    origin: [
    'http://localhost:5173',           // 允许本地开发
    'https://www.campus-quest.top',    // 允许带 www 的新域名
    'https://campus-quest.top',        // 允许不带 www 的新域名
    'https://campus-quest-nu.vercel.app' 
  ],
    credentials: true
}));
app.use(express.json());

// --- 辅助函数 ---
const ensureProfile = async (email) => {
    const check = await db.query('SELECT * FROM profiles WHERE email = $1', [email]);
    if (check.rows.length === 0) {
        const nickname = `同学${Math.floor(Math.random()*1000)}`;
        await db.query('INSERT INTO profiles (email, nickname) VALUES ($1, $2)', [email, nickname]);
    }
};

// ==========================================
// 所有的业务路由
// ==========================================

// 1. 获取用户信息
app.get('/api/profile', async (req, res) => {
    const { email } = req.query; 
    await ensureProfile(email);
    const result = await db.query('SELECT * FROM profiles WHERE email = $1', [email]);
    res.json(result.rows[0]);
});

// 修改用户昵称
app.put('/api/profile', async (req, res) => {
    const { email, nickname, avatar_url } = req.body;
    try {
        if (nickname && nickname.length > 10) {
            return res.status(400).json({ error: "昵称太长啦(最多10字)" });
        }
        const safeNickname = nickname === undefined ? null : nickname;
        const safeAvatar = avatar_url === undefined ? null : avatar_url;
        const result = await db.query(
            `UPDATE profiles SET nickname = COALESCE($1, nickname), avatar_url = COALESCE($2, avatar_url) WHERE email = $3 RETURNING *`,
            [safeNickname, safeAvatar, email] 
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error("更新失败:", err);
        res.status(500).json({ error: err.message });
    }
});

// 2. 获取任务列表 (带筛选)
app.get('/api/quests', async (req, res) => {
    try {
        const { q, category, location, type, sort } = req.query;
        let sql = `
            SELECT quests.*, profiles.nickname AS publisher_nickname, profiles.avatar_url AS publisher_avatar, profiles.rating AS publisher_rating
            FROM quests
            LEFT JOIN profiles ON quests.publisher_email = profiles.email
            WHERE quests.status = 'OPEN'
        `;
        const params = [];
        let paramIndex = 1;

        if (q) {
            sql += ` AND (quests.title ILIKE $${paramIndex} OR quests.description ILIKE $${paramIndex})`;
            params.push(`%${q}%`); paramIndex++;
        }
        if (category && category !== '全部') {
            sql += ` AND quests.category = $${paramIndex}`;
            params.push(category); paramIndex++;
        }
        if (location && location !== '全校') {
            sql += ` AND quests.location = $${paramIndex}`;
            params.push(location); paramIndex++;
        }
        if (type && type !== '全部') {
            sql += ` AND quests.type = $${paramIndex}`;
            params.push(type); paramIndex++;
        }
        if (sort === 'oldest') {
            sql += ` ORDER BY quests.created_at ASC`;
        } else {
            sql += ` ORDER BY quests.created_at DESC`; 
        }

        const result = await db.query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 3. 我的任务
app.get('/api/my-quests', async (req, res) => {
    const { email } = req.query;
    const sql = `
        SELECT q.*, p1.nickname as publisher_nickname, p2.nickname as provider_nickname
        FROM quests q
        LEFT JOIN profiles p1 ON q.publisher_email = p1.email
        LEFT JOIN profiles p2 ON q.provider_email = p2.email
        WHERE publisher_email = $1 OR provider_email = $1 
        ORDER BY created_at DESC
    `;
    const result = await db.query(sql, [email]);
    res.json(result.rows);
});

// 4. 发布任务
app.post('/api/quests', async (req, res) => {
    const { email, type, title, description, reward, category, image_url, location, contact_info } = req.body;
    try {
        await ensureProfile(email);
        const sql = `INSERT INTO quests (publisher_email, type, title, description, reward, category, image_url, location, contact_info) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;
        const result = await db.query(sql, [email, type, title, description, reward, category, image_url, location || '全校', contact_info]);
        res.json({ message: "发布成功", quest: result.rows[0] });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

// 5. 取消任务
app.delete('/api/quests/:id', async (req, res) => {
    const { id } = req.params; const { email } = req.body;
    try {
        const check = await db.query('SELECT * FROM quests WHERE id = $1', [id]);
        if (check.rows.length === 0) return res.status(404).json({error:"不存在"});
        if (check.rows[0].publisher_email !== email) return res.status(403).json({ error: "无权操作" });
        await db.query('DELETE FROM quests WHERE id = $1', [id]);
        res.json({ message: "任务已删除" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. 确认完成
app.post('/api/quests/:id/complete', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`UPDATE quests SET status = 'COMPLETED' WHERE id = $1`, [id]);
        res.json({ message: "交易完成" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 评价接口
app.post('/api/quests/:id/review', async (req, res) => {
    const { id } = req.params; 
    const { from_email, to_email, rating, comment } = req.body;
    try {
        if (!to_email) return res.status(400).json({ error: "评价对象(to_email)丢失" });
        await db.query('INSERT INTO reviews (quest_id, from_email, to_email, rating, comment) VALUES ($1, $2, $3, $4, $5)', [id, from_email, to_email, rating, comment]);
        res.json({ success: true });
    } catch (err) {
        console.error("评价失败:", err);
        res.status(500).json({ error: err.message });
    }
});

// 收藏相关
app.get('/api/favorites/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const result = await db.query('SELECT quest_id FROM favorites WHERE user_email = $1', [email]);
        res.json(result.rows.map(row => row.quest_id));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/favorites/toggle', async (req, res) => {
    const { user_email, quest_id } = req.body;
    try {
        const check = await db.query('SELECT * FROM favorites WHERE user_email = $1 AND quest_id = $2', [user_email, quest_id]);
        if (check.rows.length > 0) {
            await db.query('DELETE FROM favorites WHERE user_email = $1 AND quest_id = $2', [user_email, quest_id]);
            res.json({ is_favorited: false });
        } else {
            await db.query('INSERT INTO favorites (user_email, quest_id) VALUES ($1, $2)', [user_email, quest_id]);
            res.json({ is_favorited: true });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/', (req, res) => { res.send('Server is running!'); });

// 其他操作接口
app.post('/api/quests/:id/accept', async (req, res) => { const {id}=req.params; const {email}=req.body; const r=await db.query(`UPDATE quests SET status='LOCKED', provider_email=$1 WHERE id=$2 RETURNING *`,[email,id]); res.json(r.rows[0]); });
app.post('/api/quests/:id/drop', async (req, res) => { const {id}=req.params; const r=await db.query(`UPDATE quests SET status='OPEN', provider_email=NULL WHERE id=$1 RETURNING *`,[id]); res.json(r.rows[0]); });
app.post('/api/quests/:id/submit', async (req, res) => { const {id}=req.params; const r=await db.query(`UPDATE quests SET status='PENDING_REVIEW' WHERE id=$1 RETURNING *`,[id]); res.json(r.rows[0]); });
app.get('/api/leaderboard', async (req, res) => { const r=await db.query(`SELECT p.nickname, q.provider_email as email, COUNT(q.id) as task_count, COALESCE(AVG(r.rating), 0)::numeric(10,1) as avg_rating FROM quests q LEFT JOIN reviews r ON q.id=r.quest_id AND r.to_email=q.provider_email LEFT JOIN profiles p ON q.provider_email=p.email WHERE q.status='COMPLETED' GROUP BY q.provider_email, p.nickname ORDER BY task_count DESC LIMIT 5`); res.json(r.rows); });
app.get('/api/quests/:id/messages', async (req, res) => { const {id}=req.params; const r=await db.query('SELECT * FROM private_messages WHERE quest_id=$1 ORDER BY created_at ASC',[id]); res.json(r.rows); });
app.post('/api/quests/:id/messages', async (req, res) => { const {id}=req.params; const {email,content}=req.body; const r=await db.query('INSERT INTO private_messages (quest_id,sender_email,content) VALUES ($1,$2,$3) RETURNING *',[id,email,content]); res.json(r.rows[0]); });
app.get('/api/quests/:id/comments', async (req, res) => { const {id}=req.params; const r=await db.query(`SELECT * FROM comments WHERE quest_id=$1 ORDER BY created_at ASC`,[id]); res.json(r.rows); });
app.post('/api/quests/:id/comments', async (req, res) => { const {id}=req.params; const {email,content}=req.body; const r=await db.query(`INSERT INTO comments (quest_id,user_email,content) VALUES ($1,$2,$3) RETURNING *`,[id,email,content]); res.json(r.rows[0]); });

// ==========================================
// 4. 【关键】Sentry 错误捕获 (v8 新写法)
// ==========================================
// 必须在 app.listen 之前调用
Sentry.setupExpressErrorHandler(app);

// 7. 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`); });