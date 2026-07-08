# 玄鉴 AI 起名器｜Xuanjian AI Naming Studio

> 程序排盘 + DeepSeek API + Netlify Functions 的中文 AI 起名与姓名诊断网站。

玄鉴 AI 起名器是一个面向中文姓名文化场景的 AI 产品 Demo。项目围绕“结构化输入 → 程序排盘 → AI 深度解释 → 结果决策”的完整链路设计，支持智能起名与姓名诊断两个核心功能，重点展示 AI 产品设计、Prompt 结构化输出、前后端联动、API 接入、安全部署与用户体验优化能力。

## 在线演示

- Website: https://xuanjian-ai-name-generator.netlify.app/
- Repository: https://github.com/LiuYutongAmy/xuanjian-ai-name-generator
- GitHub Profile: https://github.com/LiuYutongAmy

## 项目定位

本项目不是简单的随机起名工具，而是一个强调解释性、结构化和用户决策辅助的 AI 姓名分析产品。用户输入姓氏、性别、出生日期、出生时间、出生地、起名风格、偏好意象和避用字后，系统会生成包含生辰排盘、五行权重、喜用神推导、姓名寓意、诗词典故、音形义分析、风险提示和专属自我介绍的深度姓名报告。

项目目标是把传统姓名文化中的复杂信息，转化为普通用户可理解、可比较、可选择的产品化结果。

## 页面展示

### 首页与产品链路

<img src="https://raw.githubusercontent.com/LiuYutongAmy/xuanjian-ai-name-generator/main/assets/screenshots/01-home.png" alt="首页与产品链路" width="900" />

### 智能起名输入区

<img src="https://raw.githubusercontent.com/LiuYutongAmy/xuanjian-ai-name-generator/main/assets/screenshots/02-name-form.png" alt="智能起名输入区" width="900" />

### 智能起名结果概览

<img src="https://raw.githubusercontent.com/LiuYutongAmy/xuanjian-ai-name-generator/main/assets/screenshots/03-name-report-overview.png" alt="智能起名结果概览" width="900" />

### 智能起名候选名详情

<img src="https://raw.githubusercontent.com/LiuYutongAmy/xuanjian-ai-name-generator/main/assets/screenshots/08-name-report-detail.png" alt="智能起名候选名详情" width="900" />

### 姓名诊断输入区

<img src="https://raw.githubusercontent.com/LiuYutongAmy/xuanjian-ai-name-generator/main/assets/screenshots/04-diagnose-form.png" alt="姓名诊断输入区" width="900" />

### 姓名诊断结果概览

<img src="https://raw.githubusercontent.com/LiuYutongAmy/xuanjian-ai-name-generator/main/assets/screenshots/05-diagnose-report-overview.png" alt="姓名诊断结果概览" width="900" />

### 姓名诊断评分维度

<img src="https://raw.githubusercontent.com/LiuYutongAmy/xuanjian-ai-name-generator/main/assets/screenshots/06-diagnose-scorecards.png" alt="姓名诊断评分维度" width="900" />

### 姓名诊断优化建议

<img src="https://raw.githubusercontent.com/LiuYutongAmy/xuanjian-ai-name-generator/main/assets/screenshots/07-diagnose-suggestions.png" alt="姓名诊断优化建议" width="900" />

## 核心功能

### 1. 智能起名

用户输入基础出生信息和命名偏好后，系统会生成多个候选姓名，并对每个姓名进行解释：

- 姓名与拼音
- 综合评分
- 八字与五行适配说明
- 喜用神倾向推导
- 单字字义拆解
- 整体寓意
- 诗词典故或文化意象
- 音律分析
- 字形结构分析
- 现代使用场景
- 专属自我介绍
- 风险提示与优化建议

### 2. 姓名诊断

用户可以输入已有姓名，系统会从传统文化和现代使用场景两个维度进行诊断：

- 总体评分
- 姓名五行倾向
- 与八字喜用倾向的匹配度
- 音律、字形、语义分析
- 文化意象与典故辨识
- 校园、职场、社交场景适配度
- 保留、微调或替换建议
- 替代姓名推荐
- 专属自我介绍文案

### 3. 程序排盘 + AI 解读

项目采用“确定性计算 + AI 生成解释”的链路，而不是完全依赖大模型自由推算。

```text
用户输入出生信息
→ Netlify Function 接收请求
→ lunar-javascript 计算四柱、干支、五行、纳音、十神参考
→ DeepSeek API 基于固定排盘结果生成深度姓名报告
→ 前端渲染为可读、可展开、可复制的结果卡片
```

这种方案将历法排盘与 AI 文案生成拆开：程序负责稳定计算，AI 负责喜用神推导、命名策略、典故解释、结果总结和个性化表达。

## 产品设计亮点

- 双功能入口：智能起名 / 姓名诊断
- 结构化输入表单，覆盖姓氏、姓名、出生时间、地点、偏好与避用字
- 生辰排盘结果可视化展示，包括四柱、日主、五行权重、纳音与十神参考
- 结果页采用“摘要 + 展开”的信息架构，避免长报告堆叠
- 候选名支持横向对比，帮助用户快速判断首推、书卷气、现代场景等差异
- 视觉上使用白色主画布、柔和圆角卡片、Rausch 风格主按钮和轻量阴影
- 加入 simple noise、背景淡入淡出、按钮反馈和卡片动效，提升消费级产品质感
- API Key 通过 Netlify Environment Variables 管理，不暴露在前端代码中
- 移动端响应式适配，保证小屏幕下的输入和结果阅读体验

## 技术栈

- HTML / CSS / JavaScript
- Netlify Functions
- DeepSeek API
- lunar-javascript
- GitHub
- Netlify Deployment

## 项目结构

```text
xuanjian-ai-name-generator/
├── index.html
├── assets/
│   ├── css/
│   ├── js/
│   ├── images/
│   └── screenshots/
├── netlify/
│   └── functions/
│       ├── deepseek.js
│       └── bazi-utils.js
├── netlify.toml
├── package.json
└── README.md
```

## 本地运行

```bash
npm install
npm run check
netlify dev
```

需要在本地 `.env` 文件或 Netlify 环境变量中配置：

```text
DEEPSEEK_API_KEY=your_api_key
```

## 我在项目中完成的工作

- 梳理 AI 起名和姓名诊断两个核心用户场景
- 设计从输入、排盘、AI 分析到结果展示的完整产品链路
- 设计 DeepSeek Prompt 结构，要求输出可解析的结构化 JSON
- 将八字、五行、纳音、十神等计算放在 Netlify Function 后端处理
- 设计姓名报告的信息架构，包括首推名、候选名对比、五行适配、典故、自我介绍和风险提示
- 完成前端页面、响应式布局、背景切换、动效和结果卡片渲染
- 使用 Netlify 环境变量管理 API Key，避免敏感信息暴露在前端
- 完成 GitHub 仓库管理与 Netlify 在线部署

## 项目价值

这个项目重点体现了我在数字化产品方向的以下能力：

- 能从真实用户场景出发拆解产品流程
- 能设计 AI 产品的信息输入、处理和输出结构
- 能将 Prompt 设计与前端结果展示结合起来
- 能理解 API 接入、环境变量、安全部署和后端函数等基础工程问题
- 能围绕用户体验优化页面视觉、交互反馈和结果可读性
- 能将一个 AI Demo 从想法推进到可访问、可演示、可复盘的线上项目

## 说明

本项目中的八字、五行和喜用神分析用于中文姓名文化与 AI 产品体验展示，不构成任何命运判断或现实决策依据。
