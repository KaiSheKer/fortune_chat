import { CONFIG } from './config.js';

// 在顶层作用域先声明变量，以便在 DOMContentLoaded 回调函数中赋值和使用
let chatMessages, chatInput, sendButton;

document.addEventListener('DOMContentLoaded', function() {
    console.log('[chat.js] DOMContentLoaded event fired.');

    chatMessages = document.getElementById('chat-messages');
    chatInput = document.getElementById('chat-input');
    sendButton = document.getElementById('send-button');

    console.log('[chat.js] chatMessages element:', chatMessages);
    console.log('[chat.js] chatInput element:', chatInput);
    console.log('[chat.js] sendButton element:', sendButton);

    if (!chatInput || !sendButton || !chatMessages) {
        console.error('[chat.js] Critical DOM elements not found. Event listeners will not be attached.');
        return; // 如果关键元素找不到，后续操作无意义
    }

    // 从本地存储加载历史记录
    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        history.forEach(item => {
            addMessage(item.sender, item.text, item.sender === 'ai'); // Correctly set isBot based on sender
        });
    }

    // 保存消息到历史记录
    function saveToHistory(text, sender) {
        const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        history.push({ text, sender, timestamp: Date.now() });
        localStorage.setItem('chatHistory', JSON.stringify(history));
    }

    // 添加消息到聊天区域
    function addMessage(sender, text, isBot = false, isLoading = false) {
        console.log(`[chat.js] addMessage called by: ${sender}, isBot: ${isBot}, isLoading: ${isLoading}, text: "${text ? text.substring(0, 100) + (text.length > 100 ? '...' : '') : 'N/A'}"`); // Log first 100 chars of text
        const message = document.createElement('div');
        message.className = `message ${sender}`;
        message.innerHTML = `<div class="message-content">${formatText(text)}</div>`;
        chatMessages.appendChild(message);
        requestAnimationFrame(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });

        // 只有新消息才保存到历史记录
        if (!isBot && !isLoading) {
            saveToHistory(text, sender);
        }
    }

    // 添加思考中的消息
    function addThinkingMessage() {
        console.log('[chat.js] addThinkingMessage called.');
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
    async function sendMessage(messageText) {
        console.log('[chat.js] sendMessage called with messageText:', messageText);
        const message = messageText.trim(); // Use the passed messageText and trim it
        console.log('[chat.js] message (trimmed):', message);

        if (!message) {
            console.log('[chat.js] Message is empty, returning.');
            return;
        }
        console.log('[chat.js] Message is not empty, proceeding.');

        // 添加用户消息
        addMessage('user', message);

        // 清空输入框
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendButton.disabled = true;

        let thinkingId; // Declare thinkingId here to be accessible in catch
        try {
            // 添加思考中的消息
            thinkingId = addThinkingMessage(); // Assign to the outer scope variable

            // 发送请求到 API
            const requestBody = {
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: CONFIG.systemPrompt },
                    { role: "user", content: message }
                ],
                temperature: 0.7
            };
            console.log('[chat.js] Request body:', requestBody);

            const response = await fetch(CONFIG.apiEndpoint + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('[chat.js] Response status:', response.status);
            const responseText = await response.text();
            console.log('[chat.js] Response text:', responseText);

            // 检查响应状态
            if (!response.ok) {
                let errorMessage = '请求失败';
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error?.message || errorData.message || responseText;
                } catch {
                    errorMessage = responseText || `HTTP错误: ${response.status}`;
                }
                console.error('[chat.js] API错误:', errorMessage);
                updateThinkingMessage(thinkingId, `错误: ${errorMessage}`);
                return;
            }

            try {
                const data = JSON.parse(responseText);
                console.log('[chat.js] Parsed response:', data);
                if (!data.choices?.[0]?.message?.content) {
                    throw new Error('API返回了无效的响应格式');
                }
                const reply = data.choices[0].message.content;
                updateThinkingMessage(thinkingId, reply);
                saveToHistory(reply, 'ai');
            } catch (error) {
                console.error('[chat.js] 解析响应失败:', error);
                updateThinkingMessage(thinkingId, `错误: 无法解析API响应 - ${error.message}`);
            }

        } catch (error) {
            console.error('[chat.js] API调用错误:', error);
            // Ensure thinkingId is defined before trying to use it
            if (thinkingId) {
                updateThinkingMessage(thinkingId, `发生错误: ${error.message || '请求失败，请检查网络连接'}`);
            } else {
                addMessage(`发生错误: ${error.message || '请求失败，请检查网络连接'}`, 'ai');
            }

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
    sendButton.addEventListener('click', function() {
        console.log('[chat.js] Send button clicked.');
        const messageToSendFromClick = chatInput ? chatInput.value : '';
        console.log('[chat.js] Value from chatInput on click:', messageToSendFromClick);
        sendMessage(messageToSendFromClick);
    });

    // 按Enter发送消息（Shift+Enter换行）
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            console.log('[chat.js] Enter key pressed in chatInput.');
            const messageToSendFromEnter = this.value; // Get raw value first for logging
            console.log('[chat.js] Value from chatInput on Enter key (raw):', messageToSendFromEnter);
            const trimmedMessage = messageToSendFromEnter.trim();
            if (!trimmedMessage) {
                console.log('[chat.js] Message from Enter key is empty after trim, not sending.');
                return;
            }
            sendMessage(trimmedMessage);
        }
    });

    // 添加欢迎消息 和 加载历史记录
    if (localStorage.getItem('chatHistory') === null) { // 检查是否为 null，而不是检查 falsy
        if (CONFIG.welcomeMessage) {
            addMessage('ai', CONFIG.welcomeMessage, true);
        }
        if (CONFIG.initialPrompt) { // Add initialPrompt if it exists
            addMessage('ai', CONFIG.initialPrompt, true);
        }
    } else {
        loadHistory(); // 确保 loadHistory 可用
    }
});

// 注意：之前在全局作用域定义的 formatText, addMessage, addThinkingMessage, updateThinkingMessage, sendMessage 
// 以及 loadHistory, saveToHistory 现在都在 DOMContentLoaded 回调函数的作用域内。
// 如果有其他脚本或 HTML 内联脚本试图在 DOMContentLoaded 之前调用它们，可能会失败。
// 但在这个单文件应用场景下，将所有依赖 DOM 的操作放入 DOMContentLoaded 是更安全的做法。
