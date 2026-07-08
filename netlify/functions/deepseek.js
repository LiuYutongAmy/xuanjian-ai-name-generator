const { buildBaziProfile, clean } = require("./bazi-utils");

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const NAME_EXAMPLE = {
  birthAnalysis: {
    baziSummary: "四柱概述",
    dayMasterAnalysis: "日主强弱与月令分析",
    fiveElementPattern: "五行格局，不机械按缺什么补什么",
    usefulGodReasoning: "喜用神/喜用倾向推导，必须说明依据",
    namingStrategy: "命名补益策略",
    riskControl: "避坑规则"
  },
  topPick: { name: "首推全名", reason: "首推理由" },
  comparison: {
    bestOverall: "综合首推",
    bestBaziFit: "最合八字",
    mostLiterary: "最有书卷气",
    mostModern: "最适合现代场景"
  },
  recommendedNames: [
    {
      name: "全名",
      pinyin: "拼音",
      score: 92,
      tags: ["2-5个标签"],
      baziFit: "为什么符合八字与五行格局",
      usefulGodFit: "为什么符合喜用倾向",
      characterAnalysis: [
        { char: "字", meaning: "字义", element: "五行/意象参考", shape: "结构", tone: "声调" }
      ],
      overallMeaning: "整体寓意，至少70字",
      poeticSource: {
        type: "明确出处或意象参考",
        title: "作品名/意象主题",
        quote: "能确定才写短句，否则写不引用原句",
        explanation: "典故为什么适合"
      },
      phonetics: "音律分析",
      visualAnalysis: "字形结构分析",
      modernUsage: "现代社交、校园、职场、证件、英文环境适配",
      nickname: "小名建议",
      englishFit: "英文/拼音环境说明",
      selfIntro: { style: "不同风格标签", text: "专属自我介绍，不能套模板，80-120字" },
      riskNotes: ["风险提示"]
    }
  ],
  nextQuestions: ["继续优化需要补充的问题"],
  disclaimer: "固定边界提醒"
};

const DIAGNOSE_EXAMPLE = {
  nameSummary: {
    name: "全名",
    pinyin: "拼音",
    overallScore: 86,
    oneLiner: "一句话总评",
    selfIntro: "这个名字可用的专属自我介绍"
  },
  birthAnalysis: {
    nameElementPattern: "姓名用字五行/意象倾向",
    baziFitConclusion: "姓名是否补益八字喜用倾向",
    usefulGodReasoning: "喜用神推导与姓名适配说明"
  },
  scores: [
    { label: "读音", score: 0, comment: "读音说明" },
    { label: "字形", score: 0, comment: "字形说明" },
    { label: "语义", score: 0, comment: "语义说明" },
    { label: "文化典故", score: 0, comment: "典故说明" },
    { label: "八字适配", score: 0, comment: "排盘适配说明" },
    { label: "使用场景", score: 0, comment: "长期使用说明" }
  ],
  analysisSections: [
    { title: "综合分析", content: "不少于120字" },
    { title: "优势", content: "具体优势" },
    { title: "短板", content: "具体短板" }
  ],
  risks: ["风险提示"],
  improvements: ["优化建议"],
  alternatives: [
    { name: "替代名", reason: "替代理由", fit: "适合度" }
  ],
  conclusion: "适合保留/可以微调/建议重构",
  disclaimer: "固定边界提醒"
};

function json(statusCode, body) {
  return { statusCode, headers, body: JSON.stringify(body) };
}

function cleanPayload(payload = {}) {
  const birth = payload.birth || {};
  return {
    surname: clean(payload.surname, 8),
    fullName: clean(payload.fullName, 16),
    gender: clean(payload.gender, 12),
    birth: {
      calendarType: birth.calendarType === "lunar" ? "lunar" : "solar",
      year: clean(birth.year, 6),
      month: clean(birth.month, 4),
      day: clean(birth.day, 4),
      time: clean(birth.time, 12),
      isLeapMonth: Boolean(birth.isLeapMonth),
      birthPlace: clean(birth.birthPlace, 40) || "北京",
      useTrueSolar: Boolean(birth.useTrueSolar)
    },
    style: clean(payload.style, 40),
    nameLength: clean(payload.nameLength, 24),
    preference: clean(payload.preference, 100),
    avoidChars: clean(payload.avoidChars, 100),
    goal: clean(payload.goal, 100),
    count: 4
  };
}

function baseSystemPrompt() {
  return [
    "你是严谨的中文姓名策划、八字命名解释与姓名语言分析顾问。",
    "你会收到由程序计算出的 baziProfile JSON。四柱、干支、纳音、五行权重、十神参考均为固定数据，你不得自行修改这些字段。",
    "你需要基于固定排盘进行喜用神/喜用倾向推导，但必须说明推导依据：日主、月令、季节、五行偏枯、调候、扶抑、通关、生克制化。不要机械地说缺什么补什么。",
    "姓名推荐必须同时考虑：八字适配、音律、字形、字义、诗词典故/文化意象、现代社交场景、证件场景、英文/拼音环境、重名与谐音风险。",
    "诗词典故必须谨慎：能确定出处才写作品名和短引文；不确定时必须写‘意象参考’，不得伪造《诗经》《楚辞》《唐诗》原句。",
    "避免生僻字、异体字、户籍录入高风险字、负面谐音、过度网红化、强烈歧义、低俗联想。",
    "每个候选名的 selfIntro 必须完全不同，有独立风格，不得套模板。",
    "不要使用恐吓、宿命论、绝对化语言；不要承诺改变命运。",
    "只返回严格 JSON 对象，不要 Markdown，不要 JSON 外文字。"
  ].join("\n");
}

function buildNameMessages(payload, baziProfile) {
  return [
    { role: "system", content: baseSystemPrompt() },
    {
      role: "user",
      content: [
        "请输出 json。根据以下用户输入和 baziProfile，生成 2 个高质量中文候选名和深度起名报告。",
        "候选名数量固定为 2 个。每个名字解释要丰富但不要啰嗦，重点体现为什么符合八字、五行、喜用倾向、寓意和典故。",
        "每个候选名的 overallMeaning 至少 70 字，selfIntro 60-90 字，且风格互不重复。",
        "若用户要求单字名优先，可给 1 个单字名；否则默认双字名为主。",
        `用户输入：${JSON.stringify(payload, null, 2)}`,
        `baziProfile：${JSON.stringify(baziProfile, null, 2)}`,
        `请严格返回类似以下结构的 JSON，不要省略字段：${JSON.stringify(NAME_EXAMPLE, null, 2)}`
      ].join("\n\n")
    }
  ];
}

function buildDiagnoseMessages(payload, baziProfile) {
  return [
    { role: "system", content: baseSystemPrompt() },
    {
      role: "user",
      content: [
        "请输出 json。根据以下用户输入和 baziProfile，诊断已有中文姓名，并给出可执行的优化建议。",
        "必须分析：姓名五行/意象倾向、是否补益喜用倾向、读音、字形、语义、文化典故、现代使用场景、风险和替代名。",
        "如果原名可以保留，请说明保留理由和微调方向；如果明显不足，请给出 2-4 个替代名。",
        "nameSummary.selfIntro 必须是一段可直接使用的名字自我介绍，80-120 字。",
        `用户输入：${JSON.stringify(payload, null, 2)}`,
        `baziProfile：${JSON.stringify(baziProfile, null, 2)}`,
        `请严格返回类似以下结构的 JSON，不要省略字段：${JSON.stringify(DIAGNOSE_EXAMPLE, null, 2)}`
      ].join("\n\n")
    }
  ];
}

function extractJSON(content) {
  const text = String(content || "").replace(/```json|```/g, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("DeepSeek 没有返回可解析的 JSON。");
  return JSON.parse(text.slice(start, end + 1));
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return json(500, { error: "DEEPSEEK_API_KEY is not configured in Netlify Environment Variables." });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON request body." });
  }

  const mode = body.mode === "diagnose" ? "diagnose" : "name";
  const payload = cleanPayload(body.payload || {});
  if (mode === "name" && !payload.surname) return json(400, { error: "surname is required." });
  if (mode === "diagnose" && !payload.fullName) return json(400, { error: "fullName is required." });

  let baziProfile;
  try {
    baziProfile = buildBaziProfile(payload.birth);
  } catch (error) {
    return json(400, { error: error.message || "八字排盘失败，请检查出生信息。" });
  }

  const messages = mode === "diagnose" ? buildDiagnoseMessages(payload, baziProfile) : buildNameMessages(payload, baziProfile);
  const temperature = mode === "diagnose" ? 0.48 : 0.62;
  const maxTokens = Number(process.env.DEEPSEEK_MAX_TOKENS || (mode === "diagnose" ? 4200 : 3600));
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        thinking: { type: "disabled" }
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return json(response.status, { error: data.error?.message || "DeepSeek API request failed.", detail: data });
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) return json(502, { error: "DeepSeek returned an empty response. Please retry." });

    let result;
    try {
      result = extractJSON(content);
    } catch (error) {
      return json(502, { error: error.message, raw: content.slice(0, 1600) });
    }

    return json(200, { mode, baziProfile, result, usage: data.usage || null, model });
  } catch (error) {
    return json(500, { error: error.message || "Unexpected server error." });
  }
};
