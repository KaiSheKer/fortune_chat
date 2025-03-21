// 监听页面加载完成事件[3](@ref)
document.addEventListener('DOMContentLoaded', () => {
    console.log('玄机系统启动...紫微斗数初始化完成');

    // 示例调用
    getFortune({
        date: "1990-05-15 14:30",
        gender: "男",
        address: "江苏省南京市"
    }).then(console.log);
});

async function getFortune(birthInfo) {
    try {
        const prompt = `角色设定：你作为一名资深命理学家，熟读《三命通会》、《渊海子平》，《滴天髓征义》、《穷通宝鉴》和《子平真诠评注》等命理经典，请根据以下信息进行深度命盘解析：
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
用白话文分段论述，既有术语又能让人听懂

        【命主信息】
        • 生辰：阳历${birthInfo.date}（需转换为干支）
        • 性别：${birthInfo.gender}
        • 出生地：${birthInfo.address}（东经118°46'，北纬32°03'）

        【推算要求】
        1. 排盘要求：
           - 按真太阳时校准出生时间
           - 使用《子平真诠》的格局分析法
        2. 大运推算：
           - 起运数：${birthInfo.date}与最近节气相差天数/3
           - 顺逆判定：阳年${birthInfo.gender === '男' ? '顺行' : '逆行'}
        3. 流年分析：
           - 重点标注${new Date().getFullYear()}年太岁方位`;

        const response = await fetch('https://api.deepseek.com/v1/chat/completionshttps://ark.cn-beijing.volces.com/api/v3/chat/completions ', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer 03bd97eb-2a5a-45a5-905d-08f404716aa8', // 替换真实API密钥
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: "你是一个严谨的命理分析专家" },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3, // 控制输出稳定性
                max_tokens: 2000
            })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
        
    } catch (error) {
        console.error('天机不可泄露:', error);
        return { error: "推演失败，请检查网络连接后重试" };
    }
}