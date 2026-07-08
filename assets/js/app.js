const $ = (id) => document.getElementById(id);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

const escapeHTML = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&#39;",
  '"': "&quot;"
}[char]));

const clampScore = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
};

const arr = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const text = (value, fallback = "暂无") => escapeHTML(value || fallback);

function haptic(pattern = 12) {
  if (!prefersReducedMotion && "vibrate" in navigator) navigator.vibrate(pattern);
}

function shake(element) {
  if (!element) return;
  element.classList.remove("shake");
  void element.offsetWidth;
  element.classList.add("shake");
}

function setMode(mode) {
  const isName = mode === "name";
  document.body.classList.toggle("mode-name", isName);
  document.body.classList.toggle("mode-diagnose", !isName);
  document.querySelectorAll(".mode-tab").forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  $("namePanel").hidden = !isName;
  $("diagnosePanel").hidden = isName;
  $("workspaceTitle").textContent = isName ? "智能起名" : "姓名诊断";
  $("workspaceHint").textContent = isName
    ? "适合从 0 到 1 生成 4 个深度候选名，并获得完整解释。"
    : "适合检查已有姓名的排盘适配、音形义、典故与长期使用场景。";
  haptic(8);
}

function fillNumberOptions(select, start, end, suffix = "", selected) {
  select.innerHTML = "";
  for (let value = start; value <= end; value += 1) {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = `${value}${suffix}`;
    if (String(value) === String(selected)) option.selected = true;
    select.appendChild(option);
  }
}

function fillYear(select) {
  const currentYear = new Date().getFullYear();
  select.innerHTML = "";
  for (let year = currentYear + 2; year >= 1940; year -= 1) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = `${year}年`;
    if (year === currentYear) option.selected = true;
    select.appendChild(option);
  }
}

function updateDays(yearId, monthId, dayId) {
  const year = Number($(yearId).value);
  const month = Number($(monthId).value);
  const daySelect = $(dayId);
  const oldDay = Number(daySelect.value) || 1;
  const days = new Date(year, month, 0).getDate();
  fillNumberOptions(daySelect, 1, days, "日", Math.min(oldDay, days));
}

function initDateControls(prefix = "") {
  const yearId = prefix ? `${prefix}Year` : "year";
  const monthId = prefix ? `${prefix}Month` : "month";
  const dayId = prefix ? `${prefix}Day` : "day";
  fillYear($(yearId));
  fillNumberOptions($(monthId), 1, 12, "月", new Date().getMonth() + 1);
  updateDays(yearId, monthId, dayId);
  $(yearId).addEventListener("change", () => updateDays(yearId, monthId, dayId));
  $(monthId).addEventListener("change", () => updateDays(yearId, monthId, dayId));
}

function getActiveValue(groupId) {
  return document.querySelector(`#${groupId} .seg-btn.is-active`)?.dataset.value || "未指定";
}

function setButtonLoading(button, loading, loadingText, normalText) {
  button.disabled = loading;
  button.querySelector("span:first-child").textContent = loading ? loadingText : normalText;
  button.querySelector(".cta-orb").textContent = loading ? "…" : "→";
}

function renderLoading(title) {
  const region = $("resultsRegion");
  region.hidden = false;
  region.innerHTML = `
    <div class="result-topline">
      <div>
        <span class="section-label">GENERATING</span>
        <h2>${escapeHTML(title)}</h2>
        <p>正在完成后端排盘、构建结构化 prompt 并调用 DeepSeek。深度报告通常需要数秒。</p>
      </div>
    </div>
    <div class="loading-wrap">
      <div class="loading-card"><div class="skeleton title"></div><div class="skeleton"></div><div class="skeleton short"></div><div class="skeleton"></div></div>
      <div class="loading-card"><div class="skeleton title"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton short"></div></div>
    </div>`;
  region.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
}

function renderError(message) {
  const region = $("resultsRegion");
  region.hidden = false;
  region.innerHTML = `
    <div class="result-topline">
      <div>
        <span class="section-label">ERROR</span>
        <h2>生成失败</h2>
        <p>${escapeHTML(message)}</p>
      </div>
    </div>
    <div class="alert-box">请确认已经部署到 Netlify，并在环境变量里配置 <strong>DEEPSEEK_API_KEY</strong>。如果你只是本地双击打开 HTML，函数接口不会生效；可以使用 <code>netlify dev</code> 本地启动。</div>`;
}

async function callAI(mode, payload) {
  const response = await fetch("/api/deepseek", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, payload })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `请求失败：${response.status}`);
  if (!data.result || typeof data.result !== "object") throw new Error("AI 返回结构异常，请稍后重试。");
  return data;
}

function renderPillList(items) {
  return arr(items).map((item) => `<span class="next-chip">${escapeHTML(item)}</span>`).join("");
}

function renderElementBars(elements = {}) {
  const source = elements.weighted || elements.scores || elements;
  const labels = [
    ["wood", "木"], ["fire", "火"], ["earth", "土"], ["metal", "金"], ["water", "水"]
  ];
  const values = labels.map(([key]) => Number(source[key]) || 0);
  const max = Math.max(...values, 1);
  return `<div class="element-bars">${labels.map(([key, label], index) => {
    const value = values[index];
    const width = Math.round((value / max) * 100);
    return `<div class="element-row"><span>${label}</span><div class="element-track"><span class="element-fill" style="--w:${width}"></span></div><b>${value.toFixed(1)}</b></div>`;
  }).join("")}</div>`;
}

function renderBaziPanel(baziProfile) {
  if (!baziProfile) return "";
  const pillars = baziProfile.pillars || {};
  const meta = baziProfile.meta || {};
  const dayMaster = baziProfile.dayMaster || {};
  const elements = baziProfile.fiveElements || {};
  const warnings = arr(baziProfile.warnings);
  return `
    <section class="bazi-panel">
      <div class="panel-head">
        <div>
          <span class="section-label">BAZI PROFILE</span>
          <h2>生辰排盘结果</h2>
          <p>${text(meta.summary, "已完成四柱与五行结构计算。")}</p>
        </div>
        <span class="pill-soft">${text(meta.calendarLabel, "公历")}</span>
      </div>
      <div class="pillar-grid">
        <div class="pillar-card"><span>年柱</span><strong>${text(pillars.year, "—")}</strong></div>
        <div class="pillar-card"><span>月柱</span><strong>${text(pillars.month, "—")}</strong></div>
        <div class="pillar-card"><span>日柱</span><strong>${text(pillars.day, "—")}</strong></div>
        <div class="pillar-card"><span>时柱</span><strong>${text(pillars.hour, "—")}</strong></div>
      </div>
      <div class="bazi-meta">
        <div class="meta-box"><small>日主</small><strong>${text(dayMaster.label || dayMaster.stem, "—")}</strong><p>${text(dayMaster.description, "日主用于后续喜用倾向推导。")}</p></div>
        <div class="meta-box"><small>农历 / 生肖</small><strong>${text(meta.lunarDate, "—")}</strong><p>${text(meta.zodiac ? `生肖：${meta.zodiac}` : "", "")}</p></div>
        <div class="meta-box"><small>纳音</small><strong>${text(arr(baziProfile.nayin).join(" · "), "—")}</strong><p>${text(meta.solarTimeUsed, "")}</p></div>
      </div>
      <div class="bazi-meta" style="margin-top:12px">
        <div class="meta-box" style="grid-column:span 2"><small>五行权重</small>${renderElementBars(elements)}</div>
        <div class="meta-box"><small>十神参考</small><p>${text(arr(baziProfile.tenGods).slice(0, 8).join("、"), "—")}</p>${warnings.length ? `<p>${renderPillList(warnings)}</p>` : ""}</div>
      </div>
    </section>`;
}

function renderStrategyCard(title, content) {
  return `<article class="strategy-card"><strong>${escapeHTML(title)}</strong><p>${escapeHTML(content || "暂无")}</p></article>`;
}

function renderComparison(comparison = {}) {
  const entries = [
    ["综合首推", comparison.bestOverall],
    ["最合八字", comparison.bestBaziFit],
    ["最有书卷气", comparison.mostLiterary],
    ["最适合现代场景", comparison.mostModern]
  ].filter(([, value]) => value);
  if (!entries.length) return "";
  return `<section class="comparison-card"><h3>候选名对比结论</h3><div class="compare-grid">${entries.map(([k,v]) => `<div class="compare-item"><small>${escapeHTML(k)}</small><strong>${escapeHTML(v)}</strong></div>`).join("")}</div></section>`;
}

function renderCharCards(chars) {
  const items = arr(chars);
  if (!items.length) return "";
  return `<div class="char-grid">${items.map((item) => `
    <div class="char-card">
      <strong>${text(item.char || item.character, "字")}</strong>
      <p><b>字义：</b>${text(item.meaning)}</p>
      <p><b>五行/结构：</b>${text(item.element)} · ${text(item.shape)}</p>
      <p><b>声调：</b>${text(item.tone)}</p>
    </div>`).join("")}</div>`;
}

function renderNameCard(item, index) {
  const score = clampScore(item.score);
  const tags = arr(item.tags).slice(0, 5).map((tag) => `<span class="mini-tag">${escapeHTML(tag)}</span>`).join("");
  const source = item.poeticSource || {};
  return `
    <article class="name-card" style="animation-delay:${index * 70}ms">
      <div class="name-card-head">
        <div class="name-main">
          <span class="name-text">${text(item.name, "候选名")}</span>
          <span class="pinyin">${text(item.pinyin, "拼音待补充")}</span>
        </div>
        <button class="copy-btn" type="button" data-copy="${text(item.name, "")}">复制</button>
      </div>
      <div class="tag-row"><span class="tag">${score} 分</span>${tags}</div>
      <p class="name-summary"><b>核心寓意：</b>${text(item.overallMeaning || item.meaning)}</p>
      <p class="name-summary"><b>八字适配：</b>${text(item.baziFit || item.whyFitsBazi)}</p>
      <details class="analysis-details">
        <summary>展开完整解析</summary>
        <div class="detail-grid">
          <div class="detail-item"><b>喜用倾向匹配</b><p>${text(item.usefulGodFit)}</p></div>
          <div class="detail-item"><b>单字拆解</b>${renderCharCards(item.characterAnalysis)}</div>
          <div class="detail-item"><b>诗词典故 / 文化出处</b><p>${text([source.type, source.title, source.quote, source.explanation].filter(Boolean).join("｜"), item.source || item.imagery)}</p></div>
          <div class="detail-item"><b>音律分析</b><p>${text(item.phonetics || item.soundAnalysis)}</p></div>
          <div class="detail-item"><b>字形结构</b><p>${text(item.visualAnalysis || item.shape)}</p></div>
          <div class="detail-item"><b>现代使用场景</b><p>${text(item.modernUsage || item.usage)}</p></div>
          <div class="detail-item"><b>小名 / 英文环境</b><p>${text([item.nickname, item.englishFit].filter(Boolean).join("；"))}</p></div>
          <div class="detail-item"><b>专属自我介绍</b><p>${text(item.selfIntro?.text || item.selfIntro)}</p></div>
          <div class="detail-item"><b>风险提示</b><p>${text(arr(item.riskNotes).join("；"), item.risk)}</p></div>
        </div>
      </details>
    </article>`;
}

function renderNameResult(data) {
  const result = data.result || data;
  const baziProfile = data.baziProfile || result.baziProfile;
  const birthAnalysis = result.birthAnalysis || {};
  const names = arr(result.recommendedNames || result.names);
  const topPick = result.topPick || result.top_pick || names[0] || {};
  const nextQuestions = arr(result.nextQuestions || result.next_questions);
  const topName = topPick.name || names[0]?.name;
  $("resultsRegion").hidden = false;
  $("resultsRegion").innerHTML = `
    <div class="result-topline">
      <div>
        <span class="section-label">NAMING REPORT</span>
        <h2>${topName ? `首推：${escapeHTML(topName)}` : "深度姓名报告"}</h2>
        <p>${text(topPick.reason || birthAnalysis.namingStrategy, "已生成候选名字，请重点比较排盘适配、读音、字形、语义、出处与长期使用场景。")}</p>
      </div>
    </div>
    ${renderBaziPanel(baziProfile)}
    <div class="strategy-grid">
      ${renderStrategyCard("四柱概述", birthAnalysis.baziSummary)}
      ${renderStrategyCard("日主分析", birthAnalysis.dayMasterAnalysis)}
      ${renderStrategyCard("五行格局", birthAnalysis.fiveElementPattern)}
      ${renderStrategyCard("喜用神推导", birthAnalysis.usefulGodReasoning)}
      ${renderStrategyCard("命名补益策略", birthAnalysis.namingStrategy)}
      ${renderStrategyCard("避坑规则", birthAnalysis.riskControl || "避开生僻字、负面谐音、过强网红感与不稳定出处。")}
    </div>
    ${renderComparison(result.comparison)}
    <div class="names-grid">${names.map(renderNameCard).join("") || `<div class="alert-box">没有收到候选名，请重新生成。</div>`}</div>
    ${nextQuestions.length ? `<div class="text-card" style="margin-top:18px"><h3>继续优化可以补充的信息</h3><div class="next-row">${renderPillList(nextQuestions)}</div></div>` : ""}
    <div class="alert-box" style="margin-top:18px">${text(result.disclaimer || "以上内容为中文姓名文化与传统命理解释的 AI 辅助建议，不作绝对命运判断；诗文出处、户籍可用字和笔画体系请在正式使用前复核。")}</div>`;
  haptic([8, 20, 8]);
}

function renderScores(scores) {
  return arr(scores).map((item) => {
    const score = clampScore(item.score);
    return `<article class="score-card" style="--score:${score}"><div class="score-line"><strong>${text(item.label || item.dimension, "维度")}</strong><span class="score-number">${score}</span></div><div class="score-track"><span class="score-fill"></span></div><p style="margin:12px 0 0;color:var(--body);font-size:14px;line-height:1.65">${text(item.comment)}</p></article>`;
  }).join("");
}

function renderTextSections(sections) {
  return arr(sections).map((section) => `<article class="text-card"><h3>${text(section.title)}</h3><p>${text(section.content)}</p></article>`).join("");
}

function renderAlternatives(alternatives) {
  const items = arr(alternatives);
  if (!items.length) return "";
  return `<div class="alt-grid">${items.map((item) => `<article class="alt-card"><h3>${text(item.name, "替代名")}</h3><p><b>理由：</b>${text(item.reason)}</p><p><b>适合度：</b>${text(item.fit)}</p></article>`).join("")}</div>`;
}

function renderDiagnosisResult(data) {
  const result = data.result || data;
  const baziProfile = data.baziProfile || result.baziProfile;
  const summary = result.nameSummary || result.name_summary || {};
  const birthAnalysis = result.birthAnalysis || {};
  const score = clampScore(summary.overallScore || summary.overall_score || result.overall_score);
  const risks = arr(result.risks);
  const improvements = arr(result.improvements);
  $("resultsRegion").hidden = false;
  $("resultsRegion").innerHTML = `
    <div class="result-topline">
      <div>
        <span class="section-label">DIAGNOSIS REPORT</span>
        <h2>${text(summary.name, "姓名")} · 姓名诊断</h2>
        <p>${text(summary.oneLiner || summary.one_liner || result.conclusion, "已完成姓名维度拆解。")}</p>
      </div>
      <div class="score-badge" style="--score:${score}"><span>${score}</span></div>
    </div>
    ${renderBaziPanel(baziProfile)}
    <div class="strategy-grid">
      ${renderStrategyCard("姓名五行倾向", birthAnalysis.nameElementPattern)}
      ${renderStrategyCard("八字适配判断", birthAnalysis.baziFitConclusion)}
      ${renderStrategyCard("喜用神推导", birthAnalysis.usefulGodReasoning)}
    </div>
    <div class="score-grid">${renderScores(result.scores)}</div>
    <div class="text-grid">${renderTextSections(result.analysisSections || result.analysis_sections)}</div>
    ${summary.selfIntro ? `<div class="text-card" style="margin-top:18px"><h3>这个名字的自我介绍</h3><p>${text(summary.selfIntro)}</p></div>` : ""}
    ${risks.length ? `<div class="text-card" style="margin-top:18px"><h3>风险提示</h3><div class="next-row">${renderPillList(risks)}</div></div>` : ""}
    ${improvements.length ? `<div class="text-card" style="margin-top:18px"><h3>优化建议</h3><div class="next-row">${renderPillList(improvements)}</div></div>` : ""}
    ${renderAlternatives(result.alternatives)}
    <div class="alert-box" style="margin-top:18px">${text(result.disclaimer || "评分仅用于辅助比较姓名的语言、文化与排盘适配维度，不代表真实命运。正式使用前请复核出处、户籍用字与实际社交语境。")}</div>`;
  haptic([8, 20, 8]);
}

function buildBirthPayload(prefix = "") {
  return {
    calendarType: $(prefix ? `${prefix}CalendarType` : "calendarType").value,
    year: $(prefix ? `${prefix}Year` : "year").value,
    month: $(prefix ? `${prefix}Month` : "month").value,
    day: $(prefix ? `${prefix}Day` : "day").value,
    time: $(prefix ? `${prefix}BirthTime` : "birthTime").value,
    isLeapMonth: $(prefix ? `${prefix}IsLeapMonth` : "isLeapMonth").checked,
    birthPlace: $(prefix ? `${prefix}BirthPlace` : "birthPlace").value.trim(),
    useTrueSolar: $(prefix ? `${prefix}UseTrueSolar` : "useTrueSolar").checked
  };
}

async function generateNames() {
  const surname = $("surname").value.trim();
  if (!surname) {
    shake($("surname")); haptic([20, 30, 20]); $("surname").focus(); return;
  }
  const payload = {
    surname,
    gender: getActiveValue("genderGroup"),
    birth: buildBirthPayload(""),
    style: $("nameStyle").value,
    nameLength: $("nameLength").value,
    preference: $("preference").value.trim(),
    avoidChars: $("avoidChars").value.trim(),
    count: 4
  };
  const button = $("generateBtn");
  setButtonLoading(button, true, "正在生成报告", "生成深度姓名报告");
  renderLoading("排盘与起名报告生成中");
  try {
    const data = await callAI("name", payload);
    renderNameResult(data);
  } catch (error) {
    renderError(error.message);
  } finally {
    setButtonLoading(button, false, "正在生成报告", "生成深度姓名报告");
  }
}

async function diagnoseName() {
  const fullName = $("diagnoseName").value.trim();
  if (!fullName) {
    shake($("diagnoseName")); haptic([20, 30, 20]); $("diagnoseName").focus(); return;
  }
  const payload = {
    fullName,
    gender: getActiveValue("diagGenderGroup"),
    birth: buildBirthPayload("diag"),
    goal: $("diagnoseGoal").value.trim()
  };
  const button = $("diagnoseBtn");
  setButtonLoading(button, true, "正在诊断结果", "诊断姓名与优化建议");
  renderLoading("姓名诊断报告生成中");
  try {
    const data = await callAI("diagnose", payload);
    renderDiagnosisResult(data);
  } catch (error) {
    renderError(error.message);
  } finally {
    setButtonLoading(button, false, "正在诊断结果", "诊断姓名与优化建议");
  }
}

const demoBazi = {
  meta: { summary: "示例：以公历 2026-05-22 08:30 北京时间，北京出生为输入完成排盘。", calendarLabel: "公历 / 北京时间", lunarDate: "四月初六", zodiac: "马", solarTimeUsed: "未启用真太阳时校正" },
  pillars: { year: "丙午", month: "癸巳", day: "乙未", hour: "庚辰" },
  dayMaster: { stem: "乙", label: "乙木日主", description: "乙木取象花草藤蔓，重视生发、柔韧、审美与持续成长。" },
  fiveElements: { weighted: { wood: 1.6, fire: 2.2, earth: 2.0, metal: 1.0, water: 1.1 } },
  nayin: ["天河水", "长流水", "沙中金", "白蜡金"],
  tenGods: ["伤官", "偏印", "正财", "正官"],
  warnings: ["示例数据", "正式结果以后端排盘为准"]
};

function showDemoName() {
  renderNameResult({
    baziProfile: demoBazi,
    result: {
      birthAnalysis: {
        baziSummary: "四柱显示火土气息较明显，日主为乙木，命名上不宜继续堆叠燥烈、厚重意象。",
        dayMasterAnalysis: "乙木日主更重柔韧、生发和审美秩序，名字宜保留清润、舒展、明净的气质。",
        fiveElementPattern: "示例五行中火土偏显，木水相对需要被看见，可用带有清润、生发、疏朗感的字义进行平衡。",
        usefulGodReasoning: "喜用倾向不按缺什么补什么机械判断，而是结合日主、月令和五行气势，倾向取水木意象来润泽、扶助与疏通。",
        namingStrategy: "本次命名以清润水木、轻盈字形、稳定读音为主，避免过热、过硬或过网红的字。",
        riskControl: "不用生僻字，不伪造典故，避免负面谐音和过强性别刻板。"
      },
      topPick: { name: "刘知澄", reason: "知有明理自省之意，澄有清明安定之象，整体能回应水木清润与现代书卷气。" },
      comparison: { bestOverall: "刘知澄", bestBaziFit: "刘沐言", mostLiterary: "刘景初", mostModern: "刘予安" },
      recommendedNames: [
        { name: "刘知澄", pinyin: "Liú Zhīchéng", score: 94, tags: ["清润", "书卷气", "水木意象"], baziFit: "名字以澄明、清润的语义回应乙木日主需要舒展和润泽的方向。", usefulGodFit: "澄含水意，知偏文气，能形成理性与清明并存的补益策略。", characterAnalysis: [{ char: "知", meaning: "明理、知觉、判断力", element: "偏木/文气", shape: "左右均衡", tone: "阴平" }, { char: "澄", meaning: "澄澈、安定、明净", element: "水", shape: "左右结构", tone: "阳平" }], overallMeaning: "愿其内心清明、判断稳健，既有知识的深度，也有澄澈的气质。", poeticSource: { type: "意象参考", title: "澄江、明月、清心一类古典意象", quote: "不写不可核对原句", explanation: "借清澄之象表达稳定与明净。" }, phonetics: "刘、知、澄声调有起伏，读来干净，不拗口。", visualAnalysis: "左右结构为主，视觉平衡，书写辨识度较好。", modernUsage: "适合校园、职场和公开介绍，气质清爽。", nickname: "知知、澄澄", englishFit: "Zhi Cheng 可分读，英文环境可接受。", selfIntro: { style: "清雅书卷型", text: "我是刘知澄，知是明理自省，澄是澄澈安定。这个名字提醒我既要保持清醒判断，也要守住内心的明净。" }, riskNotes: ["澄字笔画略多，但常见度高", "需核对本地户籍字库"] },
        { name: "刘沐言", pinyin: "Liú Mùyán", score: 91, tags: ["清润", "表达力", "现代"], baziFit: "沐有水木滋养之意，言补足表达与文气，整体轻盈。", usefulGodFit: "以水意润木，以言字增强表达和社会沟通维度。", characterAnalysis: [{ char: "沐", meaning: "润泽、洗濯、清新", element: "水", shape: "左右结构", tone: "去声" }, { char: "言", meaning: "表达、信用、文辞", element: "金/文气参考", shape: "独体", tone: "阳平" }], overallMeaning: "润泽而善言，有清爽气质和表达能力。", poeticSource: { type: "意象参考", title: "沐雨、言志意象", explanation: "表达受滋养后的清明言说。" }, phonetics: "去声接阳平，短促后打开，读感利落。", visualAnalysis: "沐繁言简，形成视觉轻重对比。", modernUsage: "适合偏现代和国际化的使用场景。", nickname: "沐沐", englishFit: "Muyan 较易读。", selfIntro: { style: "明亮自信型", text: "我是刘沐言，沐是被清风细雨滋养，言是认真表达。这个名字让我记得，温和也可以有清晰的声音。" }, riskNotes: ["沐字近年使用较多，需考虑重名感"] }
      ],
      nextQuestions: ["是否有家族字辈", "是否避开高重名字", "是否偏向更古典或更现代"],
      disclaimer: "示例结果用于预览页面结构，正式生成以后端排盘和 DeepSeek 返回为准。"
    }
  });
}

function showDemoDiagnosis() {
  renderDiagnosisResult({
    baziProfile: demoBazi,
    result: {
      nameSummary: { name: "刘雨彤", pinyin: "Liú Yǔtóng", overallScore: 82, oneLiner: "名字亲和、明亮，但重名感略高，文化辨识度可以继续增强。", selfIntro: "我是刘雨彤，雨是润泽，彤是明亮。这个名字像雨后透出的晨光，提醒我保持温柔，也保持向上的能量。" },
      birthAnalysis: { nameElementPattern: "雨偏水意，彤偏火色，形成水火并见的气质结构。", baziFitConclusion: "若排盘确需清润和明亮并存，该名有一定适配性；若忌火，则彤字需谨慎。", usefulGodReasoning: "示例中不机械按数量补五行，而结合乙木日主的润泽与舒展需求判断。" },
      scores: [{ label: "读音", score: 86, comment: "声调自然，日常称呼顺口。" }, { label: "字形", score: 78, comment: "雨与彤视觉差异明显，但整体略常见。" }, { label: "语义", score: 84, comment: "润泽与明亮并存，正向稳定。" }, { label: "文化意象", score: 76, comment: "意象清楚但典故独特性不足。" }, { label: "八字适配", score: 80, comment: "水火并见，需结合具体喜用判断。" }, { label: "使用场景", score: 88, comment: "校园、职场和社交中都较自然。" }],
      analysisSections: [{ title: "综合分析", content: "这个名字优势是亲和、易读、正向，劣势是近年来重名感偏强，文化记忆点不够尖锐。" }, { title: "保留建议", content: "若家庭偏好温柔明亮气质，可以保留；若希望更高级、更有辨识度，可以替换第二字或整体重构。" }],
      risks: ["重名感偏高", "彤字风格较明亮，可能不够清冷", "典故独特性一般"],
      improvements: ["保留雨字，替换第二字", "改用更书卷气的水木意象", "降低网红感"],
      alternatives: [{ name: "刘雨澄", reason: "保留雨的清润，澄增强清明和稳定。", fit: "更清雅" }, { name: "刘知雨", reason: "加入知字提升文气和辨识度。", fit: "更书卷" }],
      disclaimer: "示例结果用于预览页面结构，正式诊断以后端排盘和 DeepSeek 返回为准。"
    }
  });
}

function bindSegmentedGroup(groupId) {
  document.querySelectorAll(`#${groupId} .seg-btn`).forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(`#${groupId} .seg-btn`).forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      haptic(6);
    });
  });
}

function bindEvents() {
  document.querySelectorAll(".mode-tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
  bindSegmentedGroup("genderGroup");
  bindSegmentedGroup("diagGenderGroup");
  $("generateBtn").addEventListener("click", generateNames);
  $("diagnoseBtn").addEventListener("click", diagnoseName);
  $("demoNameBtn").addEventListener("click", showDemoName);
  $("demoDiagBtn").addEventListener("click", showDemoDiagnosis);
  $("resultsRegion").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy]");
    if (!button) return;
    const success = await copyText(button.dataset.copy);
    button.textContent = success ? "已复制" : "复制失败";
    haptic(success ? 8 : [20, 30, 20]);
    window.setTimeout(() => { button.textContent = "复制"; }, 1200);
  });
  if (!prefersReducedMotion) {
    window.addEventListener("pointermove", (event) => {
      document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
      document.documentElement.style.setProperty("--my", `${event.clientY}px`);
    }, { passive: true });
  }
}

function init() {
  initDateControls("");
  initDateControls("diag");
  bindEvents();
  ["./assets/images/name-bg.jpg", "./assets/images/diagnose-bg.jpg"].forEach((src) => { const image = new Image(); image.src = src; });
}

init();
