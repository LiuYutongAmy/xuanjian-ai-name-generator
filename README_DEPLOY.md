# 玄鉴 AI 起名器 · 最终部署说明

## 项目结构

```text
ai-name-generator-final/
├─ index.html
├─ package.json
├─ netlify.toml
├─ assets/
│  ├─ css/styles.css
│  ├─ js/app.js
│  └─ images/
│     ├─ name-bg.jpg
│     └─ diagnose-bg.jpg
└─ netlify/functions/
   ├─ bazi-utils.js
   └─ deepseek.js
```

## 已完成能力

- 智能起名 / 姓名诊断双模式
- 两张本地 JPG 背景淡入淡出切换
- simple noise 纹理、鼠标柔光、卡片入场、按钮按压、错误 shake、移动端 vibration
- Netlify Function 后端代理 DeepSeek API，不在前端暴露 Key
- `lunar-javascript` 后端排盘：四柱、干支、纳音、五行权重、十神参考
- DeepSeek 只基于固定排盘做喜用神推导、姓名解释、典故、自我介绍与风险提示
- 页面提供“查看示例结果”按钮，即使 API 暂不可用也能展示产品效果

## Netlify 环境变量

在 Netlify → Site configuration → Environment variables 中添加：

```text
DEEPSEEK_API_KEY=你的 DeepSeek API Key
```

可选：

```text
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_MAX_TOKENS=4600
```

默认模型使用 `deepseek-v4-flash`，优先保证 Netlify 免费函数环境下的响应速度。想要更强质量时，可以把 `DEEPSEEK_MODEL` 改成 `deepseek-v4-pro`，但生成时间可能更长。

## 上传前检查

1. 不要把 API Key 写入任何前端文件或 GitHub。
2. 上传时以本文件所在目录作为项目根目录，不要再套一层同名文件夹。
3. Netlify 的 build command 可以留空，publish directory 为 `.`。
4. 部署后先点“查看示例结果”，确认静态页面正常。
5. 再填表点击“生成深度姓名报告”，验证 Function 和 DeepSeek 环境变量。

## 重要边界

本项目用于中文姓名文化、传统命理解释和 AI 产品 Demo。四柱等基础排盘由后端程序计算；喜用神为基于排盘的解释推导。页面避免使用“100%改命”“绝对准确”等不专业承诺。
