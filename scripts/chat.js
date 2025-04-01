import { CONFIG } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');

    // 自动调整输入框高度
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        sendButton.disabled = this.value.trim() === '';
    });

    // 处理预设提示的点击
    document.querySelectorAll('.example-item').forEach(item => {
        item.addEventListener('click', function() {
            const prompt = this.dataset.prompt;
            chatInput.value = prompt;
            chatInput.style.height = 'auto';
            chatInput.style.height = (chatInput.scrollHeight) + 'px';
            sendButton.disabled = false;
            chatInput.focus();
        });
    });

    // 发送消息
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // 添加用户消息
        addMessage(message, 'user');
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendButton.disabled = true;

        // 添加思考中的消息
        const thinkingId = addThinkingMessage();

        try {
            const response = await fetch(CONFIG.apiEndpoint + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.apiKey}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [
                        { role: "system", content: CONFIG.systemPrompt },
                        { role: "user", content: message }
                    ],
                    temperature: 0.7
                })
            });

            // 检查响应状态
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = '请求失败';
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error?.message || errorData.message || errorText;
                } catch {
                    errorMessage = errorText || `HTTP错误: ${response.status}`;
                }
                updateThinkingMessage(thinkingId, `错误: ${errorMessage}`);
                return;
            }

            const data = await response.json();
            const reply = data.choices[0].message.content;
            updateThinkingMessage(thinkingId, reply);

        } catch (error) {
            console.error('API调用错误:', error);
            updateThinkingMessage(thinkingId, `发生错误: ${error.message || '请求失败，请检查网络连接'}`);
        }
    }

    // 添加消息到聊天区域
    function addMessage(text, sender) {
        const message = document.createElement('div');
        message.className = `message ${sender}`;
        message.innerHTML = `<div class="message-content">${text}</div>`;
        chatMessages.appendChild(message);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 添加思考中的消息
    function addThinkingMessage() {
        const id = Date.now().toString();
        const message = document.createElement('div');
        message.className = 'message ai';
        message.id = id;
        message.innerHTML = '<div class="thinking"><span></span><span></span><span></span></div>';
        chatMessages.appendChild(message);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return id;
    }

    // 更新思考中的消息
    function updateThinkingMessage(id, text) {
        const message = document.getElementById(id);
        if (message) {
            message.innerHTML = `<div class="message-content">${text}</div>`;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // 发送按钮点击事件
    sendButton.addEventListener('click', sendMessage);

    // 按Enter发送消息（Shift+Enter换行）
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!this.value.trim()) return;
            sendMessage();
        }
    });
});
