document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    // 存储提示词模板，用于构造API请求
    const promptTemplate = `
    角色设定：你作为一名资深命理学家，熟读《三命通会》、《渊海子平》，《滴天髓征义》、《穷通宝鉴》和《子平真诠评注》等命理经典，请根据以下信息进行深度命盘解析：
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
用白话文分段论述，既有术语又能让人听懂。
    `;
    
    // 免费API接口信息 - 这里使用的是假设的接口，你需要替换成实际可用的免费API
    // 调用AI API获取回复
async function callAIAPI(userMessage) {
    try {
        const response = await fetch('https://api.deepseek.com/v1', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'sk-cdad7bfde0174f749beee8a6a5d29de1'  // 如果需要的话
            },
            body: JSON.stringify({
                prompt: promptTemplate + "\n\n用户信息: " + userMessage,
                max_tokens: 500,
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        return data.choices[0].text.trim();
    } catch (error) {
        console.error('调用AI API时出错:', error);
        return '抱歉，我暂时无法连接到命理系统，请稍后再试。';
    }
}
    
    // 当用户点击发送按钮或按下Enter键时
    function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;
        
        // 显示用户消息
        displayMessage(message, 'user');
        userInput.value = '';
        
        // 显示"正在思考"的消息
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'message assistant';
        thinkingDiv.textContent = '正在推算命理...';
        chatMessages.appendChild(thinkingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // 模拟API调用 - 在实际应用中，这里应该调用真实的AI API
        setTimeout(function() {
            // 移除"正在思考"的消息
            chatMessages.removeChild(thinkingDiv);
            
            // 在真实应用中，这里应该是API返回的结果
            const aiResponse = generateFakeResponse(message);
            displayMessage(aiResponse, 'assistant');
        }, 1500);
    }
    
    // 显示消息到聊天界面
    function displayMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // 模拟AI回复 - 在实际应用中，这应该替换为实际的API调用
    function generateFakeResponse(userMessage) {
        // 这只是一个简单的演示回复，实际应用中应该调用AI API
        if (userMessage.includes('出生') || userMessage.includes('生日')) {
            return "根据你提供的生辰信息，我看到你的八字中水木相生，但金气较弱。命主五行属水，个性灵活聪慧。今年财运尚可，事业上会有贵人相助。感情方面要注意沟通，避免口舌之争。健康需留意肺部和消化系统。";
        } else if (userMessage.includes('婚姻') || userMessage.includes('感情')) {
            return "你的感情线较为曲折，过去可能经历过波折。今年桃花运偏弱，已有伴侣的朋友需要增进沟通，单身者可能需要再等待一段时间。命中显示你适合晚婚，遇到的姻缘会较为稳定。";
        } else if (userMessage.includes('事业') || userMessage.includes('工作')) {
            return "命主事业宫有明显的贵人相助迹象，适合从事与人打交道的工作。今明两年是事业发展的关键期，建议把握机会，勇于尝试。财运方面需要稳健发展，不宜投机。";
        } else {
            return "我需要更多信息来为你解读命运。请告诉我你的出生年月日时辰，以及你想了解的具体方面（如事业、财运、感情等）。";
        }
    }
    
    // 绑定发送按钮点击事件
    sendButton.addEventListener('click', sendMessage);
    
    // 绑定输入框回车键事件
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 让输入框自动调整高度
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
});
