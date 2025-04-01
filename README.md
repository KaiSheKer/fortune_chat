# 生辰 - 命理解析系统

一个基于 AI 的命理解析系统，通过输入生辰八字信息获取详细的命理分析。

## 功能特点

- 纯前端实现，无需后端服务
- 支持输入生辰八字、性别、出生地等信息
- 提供详细的命理分析和建议
- 简洁直观的用户界面

## 使用方法

1. 复制 `scripts/config.example.js` 为 `scripts/config.js`
2. 在 `config.js` 中配置你的 API 密钥和其他设置
3. 在浏览器中打开 `fortunechat_副本.html`

## 配置说明

在 `scripts/config.js` 中配置：
- API 密钥
- API 端点
- 系统提示词
- 其他相关设置

## 注意事项

- 请勿将 API 密钥提交到代码仓库
- 建议在 .gitignore 中忽略 config.js
