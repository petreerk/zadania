const STORAGE_KEY = "math-studio-settings-v1";

const elements = {
  problemCount: document.getElementById("problemCount"),
  minValue: document.getElementById("minValue"),
  maxValue: document.getElementById("maxValue"),
  opPow: document.getElementById("opPow"),
  opRoot: document.getElementById("opRoot"),
  allowNegatives: document.getElementById("allowNegatives"),
  allowDecimals: document.getElementById("allowDecimals"),
  primaryColor: document.getElementById("primaryColor"),
  surfaceColor: document.getElementById("surfaceColor"),
  radius: document.getElementById("radius"),
  gap: document.getElementById("gap"),
  generateBtn: document.getElementById("generateBtn"),
  toggleAnswersBtn: document.getElementById("toggleAnswersBtn"),
  resetBtn: document.getElementById("resetBtn"),
  problemGrid: document.getElementById("problemGrid"),
  sheetMeta: document.getElementById("sheetMeta"),
  sheetWrap: document.querySelector(".sheet-wrap"),
  uwagaAnimBtn: document.getElementById("uwagaAnimBtn"),
};

const defaultSettings = {
  problemCount: 10,
  minValue: 1,
  maxValue: 20,
  opPow: true,
  opRoot: true,
  allowNegatives: false,
  allowDecimals: false,
  primaryColor: "#f97316",
  surfaceColor: "#fff7ed",
  radius: 20,
  gap: 14,
};

let showAnswers = false;

const worksheetMonkeyImages = [
  "https://loremflickr.com/1600/1000/monkey,face?lock=211",
  "https://loremflickr.com/1600/1000/monkey,face?lock=212",
  "https://loremflickr.com/1600/1000/monkey,face?lock=213",
  "https://loremflickr.com/1600/1000/monkey,face?lock=214",
  "https://loremflickr.com/1600/1000/monkey,face?lock=215",
  "https://loremflickr.com/1600/1000/monkey,face?lock=216",
];

function setRandomWorksheetImage() {
  if (!elements.sheetWrap) return;
  const randomImage =
    worksheetMonkeyImages[
      Math.floor(Math.random() * worksheetMonkeyImages.length)
    ];
  elements.sheetWrap.style.setProperty("--worksheet-image", `url("${randomImage}")`);
}

function getSettings() {
  return {
    problemCount: Number(elements.problemCount.value),
    minValue: Number(elements.minValue.value),
    maxValue: Number(elements.maxValue.value),
    opPow: elements.opPow.checked,
    opRoot: elements.opRoot.checked,
    allowNegatives: elements.allowNegatives.checked,
    allowDecimals: elements.allowDecimals.checked,
    primaryColor: elements.primaryColor.value,
    surfaceColor: elements.surfaceColor.value,
    radius: Number(elements.radius.value),
    gap: Number(elements.gap.value),
  };
}

function setSettings(settings) {
  Object.entries(settings).forEach(([key, value]) => {
    if (!(key in elements)) return;
    if (elements[key].type === "checkbox") {
      elements[key].checked = Boolean(value);
    } else {
      elements[key].value = value;
    }
  });
}

function applyTheme(settings) {
  document.documentElement.style.setProperty("--primary", settings.primaryColor);
  document.documentElement.style.setProperty("--surface", settings.surfaceColor);
  document.documentElement.style.setProperty("--radius", `${settings.radius}px`);
  document.documentElement.style.setProperty("--gap", `${settings.gap}px`);
}

function clampSettings(settings) {
  const safe = { ...defaultSettings, ...settings };
  safe.problemCount = Math.min(50, Math.max(1, safe.problemCount));
  safe.minValue = Number.isFinite(safe.minValue) ? safe.minValue : 1;
  safe.maxValue = Number.isFinite(safe.maxValue) ? safe.maxValue : 20;
  if (safe.maxValue < safe.minValue) {
    [safe.minValue, safe.maxValue] = [safe.maxValue, safe.minValue];
  }
  safe.radius = Math.min(40, Math.max(0, safe.radius));
  safe.gap = Math.min(40, Math.max(8, safe.gap));
  if (!safe.opPow && !safe.opRoot) {
    safe.opPow = true;
  }
  return safe;
}

function saveSettings() {
  const settings = clampSettings(getSettings());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function loadSettings() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultSettings;
  try {
    return clampSettings(JSON.parse(raw));
  } catch {
    return defaultSettings;
  }
}

function randomInRange(min, max, allowDecimals) {
  const value = Math.random() * (max - min) + min;
  if (allowDecimals) return Number(value.toFixed(1));
  return Math.round(value);
}

function getOperations(settings) {
  const ops = [];
  if (settings.opPow) ops.push("pow");
  if (settings.opRoot) ops.push("root");
  return ops;
}

function normalizeNumber(value, settings) {
  if (!settings.allowNegatives) {
    return Math.abs(value);
  }
  return value;
}

function formatNumber(value) {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1);
}

function createProblem(settings) {
  const ops = getOperations(settings);
  const op = ops[Math.floor(Math.random() * ops.length)];

  if (op === "pow") {
    let base = Math.round(randomInRange(settings.minValue, settings.maxValue, false));
    base = normalizeNumber(base, settings);
    if (settings.allowNegatives && Math.random() > 0.5) base *= -1;

    const exponent = Math.floor(Math.random() * 3) + 2; // 2..4
    const answer = Number((base ** exponent).toFixed(2));
    return {
      html: `<span class="power"><span>${formatNumber(base)}</span><sup>${exponent}</sup></span> =`,
      answer,
    };
  }

  const rootDegree = Math.random() > 0.5 ? 2 : 3;
  let rootResult = Math.max(
    1,
    Math.round(randomInRange(settings.minValue, settings.maxValue, false)),
  );
  rootResult = Math.min(rootResult, 12);
  let radicand = rootResult ** rootDegree;

  if (settings.allowNegatives && rootDegree === 3 && Math.random() > 0.5) {
    radicand *= -1;
    rootResult *= -1;
  }

  const degreeMarkup =
    rootDegree === 3 ? '<span class="root-degree">3</span>' : "";
  return {
    html: `<span class="root-expression">${degreeMarkup}<span class="root-sign">√</span><span class="root-radicand">${formatNumber(radicand)}</span></span> =`,
    answer: rootResult,
  };
}

function renderProblems() {
  const settings = clampSettings(getSettings());
  applyTheme(settings);
  saveSettings();

  const problems = Array.from({ length: settings.problemCount }, () =>
    createProblem(settings),
  );

  elements.problemGrid.innerHTML = "";
  problems.forEach((problem, i) => {
    const card = document.createElement("article");
    card.className = "problem-card";

    const q = document.createElement("p");
    q.className = "problem-text";
    q.innerHTML = `<span class="problem-index">${i + 1}.</span> ${problem.html}`;
    card.appendChild(q);

    if (showAnswers) {
      const ans = document.createElement("p");
      ans.className = "answer";
      ans.textContent = `Answer: ${problem.answer}`;
      card.appendChild(ans);
    }

    elements.problemGrid.appendChild(card);
  });

  const ops = getOperations(settings)
    .map((op) => (op === "pow" ? "powers" : "roots"))
    .join(" + ");
  elements.sheetMeta.textContent = `${settings.problemCount} problems • ${ops}`;
  elements.toggleAnswersBtn.textContent = showAnswers
    ? "Hide Answers"
    : "Show Answers";
}

function initialize() {
  const saved = loadSettings();
  setSettings(saved);
  applyTheme(saved);
  setRandomWorksheetImage();

  const controls = [
    elements.problemCount,
    elements.minValue,
    elements.maxValue,
    elements.opPow,
    elements.opRoot,
    elements.allowNegatives,
    elements.allowDecimals,
    elements.primaryColor,
    elements.surfaceColor,
    elements.radius,
    elements.gap,
  ];

  controls.forEach((input) => input.addEventListener("change", renderProblems));
  elements.generateBtn.addEventListener("click", renderProblems);
  elements.toggleAnswersBtn.addEventListener("click", () => {
    showAnswers = !showAnswers;
    renderProblems();
  });
  elements.resetBtn.addEventListener("click", () => {
    showAnswers = false;
    setSettings(defaultSettings);
    renderProblems();
  });
  elements.uwagaAnimBtn?.addEventListener("click", () => {
    const isAnimated = elements.uwagaAnimBtn.classList.toggle("is-animated");
    elements.uwagaAnimBtn.setAttribute("aria-pressed", String(isAnimated));
  });

  renderProblems();
}

initialize();
