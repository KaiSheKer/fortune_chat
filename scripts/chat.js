import { CONFIG } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');

    // 从本地存储加载历史记录
    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        history.forEach(item => {
            addMessage(item.text, item.sender, false);
        });
    }

    // 保存消息到历史记录
    function saveToHistory(text, sender) {
        const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        history.push({ text, sender, timestamp: Date.now() });
        localStorage.setItem('chatHistory', JSON.stringify(history));
    }

    // 添加消息到聊天区域
    function addMessage(text, sender, save = true) {
        const message = document.createElement('div');
        message.className = `message ${sender}`;
        message.innerHTML = `<div class="message-content">${formatText(text)}</div>`;
        chatMessages.appendChild(message);
        requestAnimationFrame(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });

        // 只有新消息才保存到历史记录
        if (save) {
            saveToHistory(text, sender);
        }
    }

    // 添加思考中的消息
    function addThinkingMessage() {
        const id = Date.now().toString();
        const message = document.createElement('div');
        message.className = 'message ai';
        message.id = id;
        message.innerHTML = `
            <div class="message-content">
                <div class="loading-text">正在推算命盘</div>
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>`;
        chatMessages.appendChild(message);
        requestAnimationFrame(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
        return id;
    }

    // 更新思考中的消息
    function updateThinkingMessage(id, text) {
        const message = document.getElementById(id);
        if (message) {
            const formattedText = formatText(text);
            message.innerHTML = `<div class="message-content">${formattedText}</div>`;
            requestAnimationFrame(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            });
        }
    }

    // 格式化文本
    function formatText(text) {
        if (!text) return '';
        
        // 处理换行
        text = text.replace(/\n\n+/g, '\n\n'); // 将多个连续换行减少为两个
        
        // 处理 Markdown 样式
        text = text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // 粗体
            .replace(/\*(.+?)\*/g, '<em>$1</em>') // 斜体
            .replace(/^### (.+)$/gm, '<h3>$1</h3>') // h3
            .replace(/^## (.+)$/gm, '<h2>$1</h2>') // h2
            .replace(/^# (.+)$/gm, '<h1>$1</h1>') // h1
            .replace(/\n/g, '<br>'); // 换行
        
        return text;
    }

    // 发送消息
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // 添加用户消息
        addMessage(message, 'user');

        // 清空输入框
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendButton.disabled = true;

        try {
            // 添加思考中的消息
            const thinkingId = addThinkingMessage();

            // 发送请求到 API
            const requestBody = {
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: CONFIG.systemPrompt },
                    { role: "user", content: message }
                ],
                temperature: 0.7
            };
            console.log('Request body:', requestBody);

            const response = await fetch(CONFIG.apiEndpoint + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Response status:', response.status);
            const responseText = await response.text();
            console.log('Response text:', responseText);

            // 检查响应状态
            if (!response.ok) {
                let errorMessage = '请求失败';
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error?.message || errorData.message || responseText;
                } catch {
                    errorMessage = responseText || `HTTP错误: ${response.status}`;
                }
                console.error('API错误:', errorMessage);
                updateThinkingMessage(thinkingId, `错误: ${errorMessage}`);
                return;
            }

            try {
                const data = JSON.parse(responseText);
                console.log('Parsed response:', data);
                if (!data.choices?.[0]?.message?.content) {
                    throw new Error('API返回了无效的响应格式');
                }
                const reply = data.choices[0].message.content;
                updateThinkingMessage(thinkingId, reply);
                saveToHistory(reply, 'ai');
            } catch (error) {
                console.error('解析响应失败:', error);
                updateThinkingMessage(thinkingId, `错误: 无法解析API响应 - ${error.message}`);
            }

        } catch (error) {
            console.error('API调用错误:', error);
            updateThinkingMessage(thinkingId, `发生错误: ${error.message || '请求失败，请检查网络连接'}`);
        }
    }

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

    // 添加欢迎消息
    if (!localStorage.getItem('chatHistory')) {
        addMessage('敢问缘主生于何年何月何日何时？天干地支定位，五行流转方显真机。', 'ai');
    } else {
        loadHistory();
    }
});
