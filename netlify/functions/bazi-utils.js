const STEMS = {
  甲: { element: "wood", elementCn: "木", yinYang: "阳", label: "甲木" },
  乙: { element: "wood", elementCn: "木", yinYang: "阴", label: "乙木" },
  丙: { element: "fire", elementCn: "火", yinYang: "阳", label: "丙火" },
  丁: { element: "fire", elementCn: "火", yinYang: "阴", label: "丁火" },
  戊: { element: "earth", elementCn: "土", yinYang: "阳", label: "戊土" },
  己: { element: "earth", elementCn: "土", yinYang: "阴", label: "己土" },
  庚: { element: "metal", elementCn: "金", yinYang: "阳", label: "庚金" },
  辛: { element: "metal", elementCn: "金", yinYang: "阴", label: "辛金" },
  壬: { element: "water", elementCn: "水", yinYang: "阳", label: "壬水" },
  癸: { element: "water", elementCn: "水", yinYang: "阴", label: "癸水" }
};

const BRANCH_HIDDEN = {
  子: [{ stem: "癸", weight: 0.9 }],
  丑: [{ stem: "己", weight: 0.55 }, { stem: "癸", weight: 0.3 }, { stem: "辛", weight: 0.15 }],
  寅: [{ stem: "甲", weight: 0.6 }, { stem: "丙", weight: 0.25 }, { stem: "戊", weight: 0.15 }],
  卯: [{ stem: "乙", weight: 0.9 }],
  辰: [{ stem: "戊", weight: 0.55 }, { stem: "乙", weight: 0.3 }, { stem: "癸", weight: 0.15 }],
  巳: [{ stem: "丙", weight: 0.55 }, { stem: "庚", weight: 0.25 }, { stem: "戊", weight: 0.2 }],
  午: [{ stem: "丁", weight: 0.7 }, { stem: "己", weight: 0.3 }],
  未: [{ stem: "己", weight: 0.55 }, { stem: "丁", weight: 0.25 }, { stem: "乙", weight: 0.2 }],
  申: [{ stem: "庚", weight: 0.55 }, { stem: "壬", weight: 0.3 }, { stem: "戊", weight: 0.15 }],
  酉: [{ stem: "辛", weight: 0.9 }],
  戌: [{ stem: "戊", weight: 0.55 }, { stem: "辛", weight: 0.25 }, { stem: "丁", weight: 0.2 }],
  亥: [{ stem: "壬", weight: 0.65 }, { stem: "甲", weight: 0.35 }]
};

const ELEMENT_CN = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };
const GENERATES = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
const CONTROLS = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };

const CITY_LONGITUDE = {
  北京: 116.4, 上海: 121.47, 广州: 113.27, 深圳: 114.06, 杭州: 120.16, 南京: 118.8, 苏州: 120.62,
  成都: 104.07, 重庆: 106.55, 西安: 108.94, 武汉: 114.31, 长沙: 112.94, 郑州: 113.62, 济南: 117.12,
  青岛: 120.38, 天津: 117.2, 合肥: 117.23, 福州: 119.3, 厦门: 118.09, 南昌: 115.86, 太原: 112.55,
  沈阳: 123.43, 大连: 121.61, 哈尔滨: 126.64, 长春: 125.32, 呼和浩特: 111.75, 银川: 106.23,
  兰州: 103.84, 西宁: 101.78, 乌鲁木齐: 87.62, 昆明: 102.83, 贵阳: 106.63, 南宁: 108.37,
  海口: 110.35, 三亚: 109.51, 拉萨: 91.13, 香港: 114.17, 澳门: 113.54, 台北: 121.56,
  新加坡: 103.85, Singapore: 103.85, HongKong: 114.17, Hongkong: 114.17
};

function clean(value, max = 80) {
  return String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function parseIntSafe(value, fallback = 0) {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseTime(value) {
  const raw = clean(value, 12);
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const hour = Math.max(0, Math.min(23, Number(match[1])));
    const minute = Math.max(0, Math.min(59, Number(match[2])));
    return { hour, minute, label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
  }
  return { hour: 12, minute: 0, label: "12:00" };
}

function findLongitude(place) {
  const raw = clean(place, 40);
  if (!raw) return null;
  const numeric = raw.match(/(-?\d{1,3}(?:\.\d+)?)/);
  if (numeric) {
    const longitude = Number(numeric[1]);
    if (Number.isFinite(longitude) && longitude >= -180 && longitude <= 180) return longitude;
  }
  for (const [city, longitude] of Object.entries(CITY_LONGITUDE)) {
    if (raw.includes(city)) return longitude;
  }
  return null;
}

function addMinutesToCivil(year, month, day, hour, minute, offsetMinutes) {
  const ms = Date.UTC(year, month - 1, day, hour, minute) + Math.round(offsetMinutes * 60 * 1000);
  const d = new Date(ms);
  return {
    year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(),
    hour: d.getUTCHours(), minute: d.getUTCMinutes()
  };
}

function safeCall(target, method, fallback = "") {
  try {
    if (target && typeof target[method] === "function") return target[method]();
  } catch {}
  return fallback;
}

function safePillar(eightChar, methodName, ganMethod, zhiMethod) {
  const direct = safeCall(eightChar, methodName, "");
  if (direct) return direct;
  return `${safeCall(eightChar, ganMethod, "")}${safeCall(eightChar, zhiMethod, "")}`;
}

function splitPillar(pillar) {
  const value = clean(pillar, 4);
  return { stem: value.charAt(0), branch: value.charAt(1), value };
}

function getTenGod(dayStem, otherStem) {
  const day = STEMS[dayStem];
  const other = STEMS[otherStem];
  if (!day || !other) return "";
  const samePolarity = day.yinYang === other.yinYang;
  if (day.element === other.element) return samePolarity ? "比肩" : "劫财";
  if (GENERATES[day.element] === other.element) return samePolarity ? "食神" : "伤官";
  if (CONTROLS[day.element] === other.element) return samePolarity ? "偏财" : "正财";
  if (CONTROLS[other.element] === day.element) return samePolarity ? "七杀" : "正官";
  if (GENERATES[other.element] === day.element) return samePolarity ? "偏印" : "正印";
  return "";
}

function describeDayMaster(stem) {
  const data = STEMS[stem];
  if (!data) return "";
  const map = {
    甲: "甲木取象乔木，重生发、原则、向上与结构感。",
    乙: "乙木取象花草藤蔓，重柔韧、审美、持续成长与适应力。",
    丙: "丙火取象太阳，重表达、热度、外放能量与照明感。",
    丁: "丁火取象灯烛，重细腻、洞察、温度与专注感。",
    戊: "戊土取象高山厚土，重承载、稳定、边界与秩序。",
    己: "己土取象田园沃土，重包容、协调、滋养与执行。",
    庚: "庚金取象矿铁，重规则、决断、行动与锋芒。",
    辛: "辛金取象珠玉，重精致、审美、标准与辨识度。",
    壬: "壬水取象江河大海，重流动、格局、学习与变化。",
    癸: "癸水取象雨露，重细腻、润泽、感知与智慧。"
  };
  return map[stem] || `${data.label}日主。`;
}

function computeFiveElements(pillars) {
  const weighted = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const stems = [pillars.year, pillars.month, pillars.day, pillars.hour].map((p) => splitPillar(p).stem).filter(Boolean);
  const branches = [pillars.year, pillars.month, pillars.day, pillars.hour].map((p) => splitPillar(p).branch).filter(Boolean);
  stems.forEach((stem) => {
    const e = STEMS[stem]?.element;
    if (e) weighted[e] += 1;
  });
  branches.forEach((branch) => {
    (BRANCH_HIDDEN[branch] || []).forEach((hidden) => {
      const e = STEMS[hidden.stem]?.element;
      if (e) weighted[e] += hidden.weight;
    });
  });
  const entries = Object.entries(weighted).sort((a, b) => b[1] - a[1]);
  return {
    weighted,
    dominant: entries.slice(0, 2).map(([k]) => ELEMENT_CN[k]),
    weak: entries.slice(-2).map(([k]) => ELEMENT_CN[k])
  };
}

function parseNayin(fullString) {
  const match = clean(fullString, 2000).match(/纳音\[([^\]]+)\]/);
  return match ? match[1].split(/\s+/).filter(Boolean) : [];
}

function buildBaziProfile(inputBirth = {}) {
  let Solar;
  let Lunar;
  try {
    ({ Solar, Lunar } = require("lunar-javascript"));
  } catch (error) {
    throw new Error("缺少 lunar-javascript 依赖。请确认 package.json 已提交，并让 Netlify 重新构建安装依赖。");
  }

  const birth = inputBirth || {};
  const calendarType = birth.calendarType === "lunar" ? "lunar" : "solar";
  const year = parseIntSafe(birth.year);
  const month = parseIntSafe(birth.month);
  const day = parseIntSafe(birth.day);
  const { hour, minute, label: clockLabel } = parseTime(birth.time);
  const birthPlace = clean(birth.birthPlace || "北京", 40) || "北京";
  const useTrueSolar = Boolean(birth.useTrueSolar);
  const isLeapMonth = Boolean(birth.isLeapMonth);
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error("出生日期超出支持范围或格式不正确。请检查年月日。");
  }

  let y = year, m = month, d = day, h = hour, min = minute;
  let solar;
  let lunar;
  let trueSolarNote = "未启用真太阳时校正。";
  let longitude = findLongitude(birthPlace);

  if (calendarType === "lunar") {
    try {
      lunar = Lunar.fromYmdHms(year, isLeapMonth ? -month : month, day, hour, minute, 0);
    } catch {
      lunar = Lunar.fromYmdHms(year, month, day, hour, minute, 0);
    }
    solar = lunar.getSolar();
    y = safeCall(solar, "getYear", year);
    m = safeCall(solar, "getMonth", month);
    d = safeCall(solar, "getDay", day);
  }

  if (useTrueSolar) {
    if (longitude !== null) {
      const offset = (longitude - 120) * 4;
      const shifted = addMinutesToCivil(y, m, d, h, min, offset);
      y = shifted.year; m = shifted.month; d = shifted.day; h = shifted.hour; min = shifted.minute;
      trueSolarNote = `已按${birthPlace}经度约 ${longitude.toFixed(2)}°E 校正真太阳时（仅经度校正，未叠加均时差），用于排盘时间：${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}。`;
    } else {
      trueSolarNote = `未识别${birthPlace}经度，已按北京时间排盘；可输入城市名或经度数字。`;
    }
  }

  if (calendarType === "solar" || useTrueSolar) {
    solar = Solar.fromYmdHms(y, m, d, h, min, 0);
    lunar = solar.getLunar();
  }

  const eightChar = lunar.getEightChar();
  const pillars = {
    year: safePillar(eightChar, "getYear", "getYearGan", "getYearZhi") || safeCall(lunar, "getYearInGanZhiExact"),
    month: safePillar(eightChar, "getMonth", "getMonthGan", "getMonthZhi") || safeCall(lunar, "getMonthInGanZhiExact"),
    day: safePillar(eightChar, "getDay", "getDayGan", "getDayZhi") || safeCall(lunar, "getDayInGanZhi"),
    hour: safePillar(eightChar, "getTime", "getTimeGan", "getTimeZhi") || safeCall(lunar, "getTimeInGanZhi")
  };

  const full = safeCall(lunar, "toFullString", "");
  const dayStem = splitPillar(pillars.day).stem;
  const dayData = STEMS[dayStem] || {};
  const fiveElements = computeFiveElements(pillars);
  const tenGods = [];
  ["year", "month", "day", "hour"].forEach((key) => {
    const { stem, branch } = splitPillar(pillars[key]);
    if (stem && stem !== dayStem) tenGods.push(`${key}:${stem}${getTenGod(dayStem, stem)}`);
    (BRANCH_HIDDEN[branch] || []).forEach((hidden) => {
      const god = getTenGod(dayStem, hidden.stem);
      if (god) tenGods.push(`${branch}藏${hidden.stem}${god}`);
    });
  });

  const solarLabel = `${safeCall(solar, "getYear", y)}-${String(safeCall(solar, "getMonth", m)).padStart(2, "0")}-${String(safeCall(solar, "getDay", d)).padStart(2, "0")} ${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  const lunarText = safeCall(lunar, "toString", "");
  const zodiac = safeCall(lunar, "getYearShengXiao", safeCall(lunar, "getShengXiao", ""));

  return {
    meta: {
      calendarType,
      calendarLabel: calendarType === "lunar" ? "农历输入" : "公历输入",
      originalClockTime: clockLabel,
      birthPlace,
      longitude,
      solarDateTime: solarLabel,
      lunarDate: lunarText,
      zodiac,
      solarTimeUsed: trueSolarNote,
      summary: `${calendarType === "lunar" ? "农历" : "公历"}${year}年${month}月${day}日 ${clockLabel}，出生地：${birthPlace}；排盘使用时间：${solarLabel}。`
    },
    pillars,
    dayMaster: {
      stem: dayStem,
      label: dayData.label || dayStem,
      element: dayData.element || "",
      elementCn: dayData.elementCn || "",
      yinYang: dayData.yinYang || "",
      description: describeDayMaster(dayStem)
    },
    stems: Object.fromEntries(Object.entries(pillars).map(([k, v]) => [k, splitPillar(v).stem])),
    branches: Object.fromEntries(Object.entries(pillars).map(([k, v]) => [k, splitPillar(v).branch])),
    hiddenStems: Object.fromEntries(Object.entries(pillars).map(([k, v]) => [k, BRANCH_HIDDEN[splitPillar(v).branch] || []])),
    nayin: parseNayin(full),
    fiveElements,
    tenGods: [...new Set(tenGods)].slice(0, 16),
    raw: {
      lunarFullString: full
    },
    warnings: [
      "四柱等基础排盘由程序计算；喜用神为后续解释推导。",
      useTrueSolar ? trueSolarNote : "如出生地与北京时间差异较大，可启用真太阳时校正。"
    ]
  };
}

module.exports = { buildBaziProfile, clean };
