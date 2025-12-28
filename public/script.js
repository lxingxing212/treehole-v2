/* 
 * 树洞前端逻辑（V2.0 升级：点赞功能+路径适配）
 */
// 1. 消息数据（新增 likes 字段）
let msgData = []; // 数据形状：{id, content, time, likes}

// 2. 获取DOM元素（保留原有）
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');
const msgList = document.getElementById('msgList');
const charCount = document.getElementById('charCount');

// 新增：获取昵称输入框（如果HTML中没有，后续会在HTML中添加）
const nicknameInput = document.getElementById('nicknameInput');

// 3. 渲染函数：新增点赞按钮渲染
function renderMessages() {
    msgList.innerHTML = ''; 
    msgData.slice().reverse().forEach(msg => {
        const li = document.createElement('li');
        li.className = 'message-card';

        // 留言内容（保留原有）
        const divContent = document.createElement('div');
        divContent.className = 'msg-content';
        divContent.textContent = msg.content; 

        // 新增：点赞区域（按钮+点赞数）
        const divLike = document.createElement('div');
        divLike.className = 'msg-like';
        divLike.innerHTML = `
            <button class="btn-like" onclick="likeMessage(${msg.id})">👍</button>
            <span class="like-count" id="like-${msg.id}">${msg.likes || 0}</span>
        `;

        // 元数据区（时间+删除按钮，保留原有）
        const divMeta = document.createElement('div');
        divMeta.className = 'msg-meta';
        divMeta.innerHTML = `
            <span class="time">${msg.time}</span>
            <button class="btn-delete" onclick="deleteMessage(${msg.id})">删除</button>
        `;

        // 组装（新增点赞区域）
        li.appendChild(divContent);
        li.appendChild(divLike);
        li.appendChild(divMeta);
        msgList.appendChild(li);
    });
}

// 4. 字数统计（保留原有）
msgInput.addEventListener('input', function() {
    const len = this.value.length;
    charCount.textContent = `${len}/200`;
    charCount.style.color = len >= 200 ? 'red' : '#888';
});

// 5. 删除功能（保留原有，适配路径）
window.deleteMessage = function(id) {
    if (!confirm("确定要删除这条树洞吗？")) return;
    // 修改：请求路径添加学号前缀（替换为自己的学号）
    fetch(`/239210118/api/messages/${id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('删除失败');
        return res.json();
      })
      .then(() => loadMessages())
      .catch(err => {
        console.error('删除失败', err);
        alert('删除失败，请稍后重试');
      });
};

// 新增：6. 点赞功能（核心）
window.likeMessage = function(id) {
    // 发送点赞请求（路径添加学号前缀）
    fetch('/239210118/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }) // 传递留言 ID
    })
    .then(res => {
        if (!res.ok) throw new Error('点赞失败');
        return res.json();
    })
    .then(() => {
        // 前端实时更新点赞数（无需刷新页面）
        const likeSpan = document.getElementById(`like-${id}`);
        likeSpan.textContent = parseInt(likeSpan.textContent) + 1;
    })
    .catch(err => {
        console.error('点赞失败', err);
        alert('点赞失败，请稍后重试');
    });
};

// 7. 完善：加载留言函数（适配路径+接收 likes 字段）
function loadMessages() {
    // 修改：请求路径添加学号前缀
    fetch('/239210118/api/messages')
        .then(res => {
            if (!res.ok) throw new Error('加载留言失败');
            return res.json();
        })
        .then(data => {
            msgData = data; // 存储数据（包含 likes 字段）
            renderMessages(); // 渲染留言列表
        })
        .catch(err => {
            console.error('加载留言失败', err);
            alert('加载留言失败，请刷新页面重试');
        });
}

// 8. 完善：发送留言事件（强化输入校验+适配路径）
sendBtn.onclick = () => {
    const nickname = nicknameInput.value.trim(); // 昵称校验
    const content = msgInput.value.trim(); // 内容校验

    // 新增：昵称+内容双重校验
    if (!nickname) {
        alert('请输入昵称哦~');
        nicknameInput.focus(); // 聚焦到昵称输入框
        return;
    }
    if (!content) {
        alert('请输入留言内容哦~');
        msgInput.focus(); // 聚焦到内容输入框
        return;
    }
    if (content.length > 200) {
        alert('留言内容不能超过200字~');
        return;
    }

    sendBtn.disabled = true; // 防止重复提交

    // 修改：请求路径添加学号前缀
    fetch('/239210118/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, nickname }) // 传递昵称和内容
    })
    .then(res => {
        if (!res.ok) throw new Error('发送失败');
        return res.json();
    })
    .then(() => {
        // 发送成功后重置输入框
        nicknameInput.value = '';
        msgInput.value = '';
        charCount.textContent = '0/200';
        loadMessages(); // 重新加载留言列表
    })
    .catch(err => {
        console.error('发送失败', err);
        alert('发送失败，请稍后重试');
    })
    .finally(() => {
        sendBtn.disabled = false; // 恢复按钮可点击
    });
};

// 页面一打开就加载留言
loadMessages();