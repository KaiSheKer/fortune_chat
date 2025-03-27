let config = {
    apiKey: '',
    apiEndpoint: 'https://api.deepseek.com/v1',
    model: 'sk-cdad7bfde0174f749beee8a6a5d29de1',
    systemPrompt: `请你作为一名资深命理学家，熟读《三命通会》、《渊海子平》，《滴天髓征义》、《穷通宝鉴》和《子平真诠评注》等命理经典，请根据以下信息进行深度命盘解析：
【基础信息】
• 生辰：[出生时间（具体到分钟）]，
• 性别：[男/女]
• 出生地：[XX省XX市]

【专项分析请求】
请重点解读：
(1) 整体分析格局，考虑身强身弱，分析十神关系，体用平衡。注意逻辑合理，综合各种信息文本判断准确的关系模型，交叉验证，多次迭代后输出最终正确的结果。
(2) 绘制命盘能量分布图（用ASCII字符呈现五行强弱）
(3) 排出大运和流年，并列出命主的历史事件，尽量详细，细节丰富，以验证推算的准确性
(4) 根据未来五年的大运和流年，推测命主未来的运势，并提供指导方针

【解析要求】
大运数的起法，以三天折合一岁计。根阳年生男、阴年生女顺行，阴年生男、阳年生女逆行。据出生日与上一个节气（逆行时）或下一个节气（顺行时）之间的天数来计算，然后根据阴阳顺逆的原则来确定大运的走向。

【输出格式】
用白话文分段论述，既有术语又能让人听懂。`
};

// 加载保存的配置
function loadConfig() {
    const savedConfig = localStorage.getItem('minglixConfig');
    if (savedConfig) {
        config = JSON.parse(savedConfig);
        document.getElementById('api-key').value = config.apiKey || '';
        document.getElementById('api-endpoint').value = config.apiEndpoint || '';
        document.getElementById('system-prompt').value = config.systemPrompt || '';
    } else {
        document.getElementById('system-prompt').value = config.systemPrompt;
        document.getElementById('api-endpoint').value = config.apiEndpoint;
    }
}

// 保存配置
function saveConfig() {
    config.apiKey = document.getElementById('api-key').value;
    config.apiEndpoint = document.getElementById('api-endpoint').value;
    config.systemPrompt = document.getElementById('system-prompt').value;
    localStorage.setItem('minglixConfig', JSON.stringify(config));
    alert('设置已保存');
    document.getElementById('settings-panel').classList.remove('active');
}

// 添加消息到聊天界面
function addMessage(content, role) {
    const messagesContainer = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'avatar';
    
    const iconElement = document.createElement('i');
    iconElement.className = role === 'user' ? 'fas fa-user' : 'fas fa-user-astronaut';
    avatarDiv.appendChild(iconElement);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    contentDiv.innerHTML = `<p>${content}</p>`;
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 添加加载中的消息
function addLoadingMessage() {
    const messagesContainer = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant loading';
    messageDiv.id = 'loading-message';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'avatar';
    
    const iconElement = document.createElement('i');
    iconElement.className = 'fas fa-user-astronaut';
    avatarDiv.appendChild(iconElement);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    contentDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 移除加载中的消息
function removeLoadingMessage() {
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

// 发送消息到API
async function sendToAPI(userMessage) {
    if (!config.apiKey) {
        alert('请先在设置中配置API密钥');
        document.getElementById('settings-panel').classList.add('active');
        return;
    }
    
    addLoadingMessage();
    
    const messages = [
        { role: "system", content: config.systemPrompt },
        { role: "user", content: userMessage }
    ];
    
    try {
        const response = await fetch(config.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages: messages,
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            removeLoadingMessage();
            addMessage(`错误: ${data.error.message}`, 'assistant');
            return;
        }
        
        const assistantResponse = data.choices[0].message.content;
        removeLoadingMessage();
        addMessage(assistantResponse, 'assistant');
        
    } catch (error) {
        removeLoadingMessage();
        addMessage(`发生错误: ${error.message}`, 'assistant');
    }
}

// 处理发送消息
function handleSendMessage() {
    const userInput = document.getElementById('user-input');
    const userMessage = userInput.value.trim();
    
    if (userMessage) {
        addMessage(userMessage, 'user');
        userInput.value = '';
        adjustTextareaHeight(userInput);
        sendToAPI(userMessage);
    }
}

// 调整文本框高度
function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
    if (textarea.scrollHeight > 200) {
        textarea.style.height = '200px';
        textarea.style.overflowY = 'auto';
    } else {
        textarea.style.overflowY = 'hidden';
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    
    // 发送按钮事件
    document.getElementById('send-button').addEventListener('click', handleSendMessage);
    
    // 输入框回车发送
    document.getElementById('user-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // 输入框自动调整高度
    document.getElementById('user-input').addEventListener('input', function() {
        adjustTextareaHeight(this);
    });
    
    // 设置按钮事件
    document.getElementById('settings-button').addEventListener('click', () => {
        document.getElementById('settings-panel').classList.add('active');
    });
    
    // 关闭设置面板
    document.getElementById('close-settings').addEventListener('click', () => {
        document.getElementById('settings-panel').classList.remove('active');
    });
    
    // 保存设置
    document.getElementById('save-settings').addEventListener('click', saveConfig);
});
