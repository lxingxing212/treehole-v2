const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

// 新增：配置你的学号（替换为自己的真实学号）
const STUDENT_ID = '239210118'; 
// 新增：创建子路由器
const router = express.Router();

// 原有中间件保留（JSON 解析+静态文件）
app.use(express.json());
// 修改：静态文件路径关联学号（解决 CSS/JS 404 问题）
app.use('/' + STUDENT_ID, express.static('public'));

// 开启 JSON 解析中间件（关键！）
app.use(express.json());
app.use(express.static('public'));

// 初始化数据库
// 初始化数据库（已修改建表语句，保留不变）
const db = new sqlite3.Database('treehole.db');
db.run("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT, time TEXT, likes INTEGER DEFAULT 0)");

// 1. 原有接口：获取所有留言（app.get → router.get）
router.get('/api/messages', (req, res) => {
    db.all("SELECT * FROM messages ORDER BY id DESC", (err, rows) => {
        console.log('GET /api/messages/', rows);
        res.json(rows);
    });
});

// 2. 原有接口：提交新留言（app.post → router.post）
router.post('/api/messages', (req, res) => {
    const content = req.body.content;
    console.log('POST /api/messages/', content);
    const time = new Date().toLocaleString();

    if(!content) { return res.status(400).json({error: "内容不能为空"}); }

    const stmt = db.prepare("INSERT INTO messages (content, time) VALUES (?, ?)");
    stmt.run(content, time, function(err) {
        res.json({ id: this.lastID, content: content, time: time, likes: 0 }); // 新增返回 likes 字段
    });
    stmt.finalize();
});

// 3. 原有接口：删除留言（app.delete → router.delete）
router.delete('/api/messages/:id', (req, res) => {
    const id = req.params.id;
    console.log('DELETE /api/messages/', id);
    const stmt = db.prepare("DELETE FROM messages WHERE id = ?");
    stmt.run(id, function(err) {
        if (err) { return res.status(500).json({ error: '删除失败' }); }
        if (this.changes === 0) { return res.status(404).json({ error: '未找到消息' }); }
        res.json({ success: true });
    });
    stmt.finalize();
});

// 新增：4. 点赞 API 接口（处理前端点赞请求）
router.post('/api/like', (req, res) => {
    const { id } = req.body; // 接收前端传递的留言 ID
    if (!id) { return res.status(400).json({ error: '留言 ID 不能为空' }); }

    // 数据库更新：点赞数 +1
    const stmt = db.prepare("UPDATE messages SET likes = likes + 1 WHERE id = ?");
    stmt.run(id, function(err) {
        if (err) { return res.status(500).json({ error: '点赞失败' }); }
        if (this.changes === 0) { return res.status(404).json({ error: '未找到该留言' }); }
        res.json({ success: true });
    });
    stmt.finalize();
});

// 新增：5. 首页路由（访问 /学号 时返回 index.html）
router.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// 关键：挂载子路由（所有 /学号 开头的请求都交给 router 处理）
app.use('/' + STUDENT_ID, router);

// 客户端页面的 DOM 交互（fetch / 按钮事件）位于 `public/script.js` 中，由浏览器加载并执行。

app.listen(port, () => console.log(`树洞启动: http://localhost:${port}/${STUDENT_ID}`));
