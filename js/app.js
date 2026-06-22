let LESSONS = [];
let PRACTICAL_NOTES = {};
let ALL_IDS = [];
let currentLesson = 0;
let completedLessons = new Set();
let quizAnswered = false;

const LEARNING_AREAS = [
  { label: '1단계 - 기초 개념', ids: [0, 1] },
  { label: '2단계 - 데이터와 문제 정의', ids: [33] },
  { label: '3단계 - 평가 지표', ids: [34, 2, 3, 32, 35] },
  { label: '4단계 - 콘텐츠 기반', ids: [4, 5, 6, 7] },
  { label: '5단계 - 협업 필터링', ids: [8, 9, 10, 11, 12, 13, 14, 15, 16] },
  { label: '6단계 - 하이브리드 / 컨텍스트', ids: [17, 18, 19, 20] },
  { label: '7단계 - 딥러닝 기반', ids: [21, 22, 23, 24, 25, 26] },
  { label: '8단계 - 실서비스 & 멀티모달', ids: [27, 28, 29, 30, 31] }
];

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
  if (name === 'learn') renderLesson(currentLesson);
  if (name === 'quiz') renderQuiz(currentLesson);
  if (name === 'map') renderSearchResults(document.getElementById('lesson-search-input')?.value || '');
  if (name === 'pipeline') checkPipeApiStatus();
}

function getLessonData(idx) {
  return LESSONS.find(l => l.id === idx) || LESSONS[0];
}

function buildSelector(selectId, onchange) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = LESSONS.map(l => `<option value="${l.id}" ${l.id === currentLesson ? 'selected' : ''}>[${l.ch}] ${l.title}</option>`).join('');
  sel.onchange = function() { onchange(parseInt(this.value)); };
}

function goLesson(idx) {
  currentLesson = idx;
  showScreen('learn');
}

function filterRoadmap(type) {
  document.querySelectorAll('.type-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });

  document.querySelectorAll('#screen-map .chip').forEach(chip => {
    const match = (chip.getAttribute('onclick') || '').match(/goLesson\((\d+)\)/);
    if (!match) return;
    const lesson = LESSONS.find(l => l.id === parseInt(match[1]));
    chip.style.display = (type === 'all' || (lesson && lesson.type === type)) ? '' : 'none';
  });

  document.querySelectorAll('.roadmap-section').forEach(section => {
    const hasVisible = [...section.querySelectorAll('.chip')].some(c => c.style.display !== 'none');
    section.style.display = hasVisible ? '' : 'none';
  });
}

const TYPE_LABEL = { model: '모델', algorithm: '알고리즘', concept: '개념', methodology: '방법론', metric: '평가지표' };

function renderLesson(idx) {
  const l = getLessonData(idx);
  const notes = PRACTICAL_NOTES[idx] || [];
  const deepDive = l.deepDive || [];
  const terms = l.terms || [];
  const formulas = l.formulas || [];
  const learningGoals = l.learningGoals || [];
  const prerequisites = l.prerequisites || [];
  const workedExample = l.workedExample || null;
  const missions = l.missions || [];
  const pitfalls = l.pitfalls || [];
  const bridge = l.bridge || '';
  buildSelector('ch-selector', goLesson);
  const done = completedLessons.has(idx);
  const typeBadge = l.type ? `<span class="type-badge type-${l.type}">${TYPE_LABEL[l.type]}</span>` : '';
  document.getElementById('lesson-body').innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
      <span class="badge ${l.badge}">${l.badgeText}</span>
      ${typeBadge}
      ${done ? '<span style="color:var(--green);font-size:12px;font-weight:600;">✓ 완료</span>' : ''}
    </div>
    <div class="lesson-title" style="margin-top:8px;">${l.ch}. ${l.title}</div>
    <div class="lesson-meta">
      <span>${l.concepts.length}개 핵심 개념 · ${notes.length}개 실무 노트</span>
    </div>
    ${bridge ? `<div class="learning-bridge">${bridge}</div>` : ''}
    ${learningGoals.length || prerequisites.length ? `<div class="learning-guide-grid">
      ${learningGoals.length ? `<div class="learning-guide"><h3>학습 목표</h3><ul>${learningGoals.map(item => `<li>${item}</li>`).join('')}</ul></div>` : ''}
      ${prerequisites.length ? `<div class="learning-guide"><h3>먼저 알면 좋은 것</h3><ul>${prerequisites.map(item => `<li>${item}</li>`).join('')}</ul></div>` : ''}
    </div>` : ''}
    <div class="section-label" style="margin-top:4px;margin-bottom:8px;">📚 핵심 개념</div>
    ${l.concepts.map((c, i) => `<div class="concept"><span class="concept-num">${String(i+1).padStart(2,'0')}</span><h3>${c.h}</h3><p>${c.p}</p></div>`).join('')}
    ${deepDive.length ? `<div class="section-label" style="margin-top:16px;margin-bottom:8px;">🔎 심화 설명</div><div class="deep-list">${deepDive.map(item => `<div class="deep-item">${item}</div>`).join('')}</div>` : ''}
    ${terms.length ? `<div class="section-label" style="margin-top:16px;margin-bottom:8px;">🧩 처음 보는 용어</div><div class="term-list">${terms.map(t => `<div class="term-item"><h3>${t.term}</h3><p>${t.meaning}</p><p class="term-use">${t.use}</p></div>`).join('')}</div>` : ''}
    ${formulas.length ? `<div class="section-label" style="margin-top:16px;margin-bottom:8px;">∑ 공식과 사용법</div><div class="formula-list">${formulas.map(f => `<div class="formula-item"><h3>${f.name}</h3><code>${f.expression}</code><p>${f.howToUse}</p></div>`).join('')}</div>` : ''}
    ${workedExample ? `<div class="section-label" style="margin-top:16px;margin-bottom:8px;">🧮 손계산 예제</div><div class="worked-example"><h3>${workedExample.title}</h3><p>${workedExample.body}</p>${workedExample.steps ? `<ol>${workedExample.steps.map(step => `<li>${step}</li>`).join('')}</ol>` : ''}</div>` : ''}
    ${missions.length ? `<div class="section-label" style="margin-top:16px;margin-bottom:8px;">🛠️ 실습 미션</div><div class="mission-list">${missions.map(item => `<div class="mission-item">${item}</div>`).join('')}</div>` : ''}
    ${pitfalls.length ? `<div class="section-label" style="margin-top:16px;margin-bottom:8px;">⚠️ 흔한 오해</div><div class="pitfall-list">${pitfalls.map(item => `<div class="pitfall-item">${item}</div>`).join('')}</div>` : ''}
    ${notes.length ? `<div class="section-label" style="margin-top:16px;margin-bottom:8px;">⚙️ 실무 노트</div>${notes.map(n => `<div class="dev-note"><h3>${n.h}</h3><ul>${n.items.map(item => `<li>${item}</li>`).join('')}</ul></div>`).join('')}` : ''}
    <div class="btn-row">
      <button class="btn" onclick="markDone(${idx})">${done ? '✓ 완료됨' : '학습 완료'}</button>
      <button class="btn primary" onclick="goQuiz(${idx})">퀴즈 풀기 →</button>
    </div>
  `;
}

function markDone(idx) {
  completedLessons.add(idx);
  updateProgress();
  renderLesson(idx);
  updateChips();
}

function updateChips() {
  document.querySelectorAll('.chip').forEach(chip => {
    const btn = chip;
    const onclickStr = btn.getAttribute('onclick') || '';
    const match = onclickStr.match(/goLesson\((\d+)\)/);
    if (match) {
      const id = parseInt(match[1]);
      btn.classList.remove('done', 'current');
      if (completedLessons.has(id)) btn.classList.add('done');
      else if (id === currentLesson) btn.classList.add('current');
    }
  });
}

function updateProgress() {
  const total = LESSONS.length;
  const pct = Math.round((completedLessons.size / total) * 100);
  document.getElementById('prog-fill').style.width = pct + '%';
  document.getElementById('prog-label').textContent = completedLessons.size + ' / ' + total + ' 챕터 완료';
}

function goQuiz(idx) {
  currentLesson = idx;
  quizAnswered = false;
  showScreen('quiz');
}

function renderQuiz(idx) {
  currentLesson = idx;
  buildSelector('quiz-selector', (id) => { quizAnswered = false; renderQuiz(id); });
  const l = getLessonData(idx);
  const q = l.quiz;
  document.getElementById('quiz-body').innerHTML = `
    <div class="card">
      <div class="quiz-q">${q.q}</div>
      ${q.opts.map((o, i) => `<button class="opt" id="opt-${i}" onclick="checkAns(${i}, ${q.ans}, \`${q.exp}\`, ${idx})">${String.fromCharCode(65+i)}. ${o}</button>`).join('')}
      <div class="feedback" id="q-fb"></div>
    </div>
    <div class="btn-row">
      <button class="btn" onclick="goLesson(${idx})">← 다시 학습</button>
      <button class="btn primary" onclick="nextChapter()">다음 챕터 →</button>
    </div>
  `;
  quizAnswered = false;
}

function checkAns(sel, ans, exp, lessonIdx) {
  if (quizAnswered) return;
  quizAnswered = true;
  const fb = document.getElementById('q-fb');
  document.querySelectorAll('.opt').forEach((b, i) => {
    b.disabled = true;
    if (i === ans) b.classList.add('correct');
    else if (i === sel && sel !== ans) b.classList.add('wrong');
  });
  if (sel === ans) {
    fb.className = 'feedback show ok';
    fb.innerHTML = '✓ 정답! ' + exp;
    completedLessons.add(lessonIdx);
    updateProgress();
    updateChips();
  } else {
    fb.className = 'feedback show bad';
    fb.innerHTML = '✗ 오답. ' + exp;
  }
}

function nextChapter() {
  const pos = LESSONS.findIndex(l => l.id === currentLesson);
  if (pos < LESSONS.length - 1) {
    currentLesson = LESSONS[pos + 1].id;
    quizAnswered = false;
    renderQuiz(currentLesson);
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getLearningArea(lessonId) {
  return LEARNING_AREAS.find(area => area.ids.includes(lessonId))?.label || '기타 학습 영역';
}

function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\s\-_/–—·.()[\]{}:;,'"!?@#$%^&*+=~`|\\<>]+/g, '');
}

function flattenSearchFields(value, prefix = '') {
  if (value == null) return [];
  if (typeof value === 'string' || typeof value === 'number') {
    return [{ label: prefix || '내용', text: String(value) }];
  }
  if (Array.isArray(value)) {
    return value.flatMap(item => flattenSearchFields(item, prefix));
  }
  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => {
      const labelMap = {
        title: '제목',
        badgeText: '분류',
        h: '핵심 개념',
        p: '설명',
        q: '퀴즈',
        exp: '퀴즈 해설',
        term: '용어',
        meaning: '용어 설명',
        use: '활용',
        expression: '공식',
        howToUse: '공식 사용법',
        bridge: '연결 설명'
      };
      return flattenSearchFields(child, labelMap[key] || prefix);
    });
  }
  return [];
}

function makeSnippet(text, keyword) {
  const source = String(text);
  const sourceLower = source.toLocaleLowerCase();
  const keywordLower = keyword.toLocaleLowerCase();
  let index = sourceLower.indexOf(keywordLower);
  if (index < 0) {
    const firstKeywordPart = keywordLower.split(/[\s\-_/–—·.()[\]{}:;,'"!?@#$%^&*+=~`|\\<>]+/).find(Boolean);
    if (firstKeywordPart) index = sourceLower.indexOf(firstKeywordPart);
  }
  if (index < 0) return escapeHtml(source.slice(0, 110));
  const start = Math.max(0, index - 42);
  const end = Math.min(source.length, index + keyword.length + 70);
  const before = escapeHtml((start > 0 ? '...' : '') + source.slice(start, index));
  const match = escapeHtml(source.slice(index, Math.min(source.length, index + keyword.length)));
  const after = escapeHtml(source.slice(index + keyword.length, end) + (end < source.length ? '...' : ''));
  return `${before}<mark>${match}</mark>${after}`;
}

function buildLessonSearchRows(lesson, keyword) {
  const notes = PRACTICAL_NOTES[lesson.id] || [];
  const fields = [
    ...flattenSearchFields({
      title: lesson.title,
      badgeText: lesson.badgeText,
      concepts: lesson.concepts,
      quiz: lesson.quiz,
      deepDive: lesson.deepDive,
      terms: lesson.terms,
      formulas: lesson.formulas,
      learningGoals: lesson.learningGoals,
      prerequisites: lesson.prerequisites,
      workedExample: lesson.workedExample,
      missions: lesson.missions,
      pitfalls: lesson.pitfalls,
      bridge: lesson.bridge
    }),
    ...flattenSearchFields(notes, '실무 노트')
  ];

  return fields
    .filter(field => normalizeSearchText(field.text).includes(normalizeSearchText(keyword)))
    .slice(0, 3)
    .map(field => ({
      label: field.label,
      snippet: makeSnippet(field.text, keyword)
    }));
}

function renderSearchResults(rawKeyword = '') {
  const resultBox = document.getElementById('search-results');
  if (!resultBox) return;

  const keyword = rawKeyword.trim();
  if (!keyword) {
    resultBox.innerHTML = `
      <div class="search-empty">
        찾고 싶은 단어를 입력하면 해당 단어가 들어 있는 학습 영역과 챕터가 표시됩니다.
      </div>
    `;
    return;
  }

  if (!LESSONS.length) {
    resultBox.innerHTML = '<div class="search-empty">학습 데이터를 아직 불러오지 못했습니다. 로컬 서버로 실행한 뒤 다시 검색해주세요.</div>';
    return;
  }

  const matches = LESSONS
    .map(lesson => ({ lesson, rows: buildLessonSearchRows(lesson, keyword) }))
    .filter(result => result.rows.length);

  if (!matches.length) {
    resultBox.innerHTML = `<div class="search-empty">"${escapeHtml(keyword)}"가 포함된 학습 내용을 찾지 못했습니다.</div>`;
    return;
  }

  const grouped = matches.reduce((acc, result) => {
    const area = getLearningArea(result.lesson.id);
    if (!acc[area]) acc[area] = [];
    acc[area].push(result);
    return acc;
  }, {});

  resultBox.innerHTML = Object.entries(grouped).map(([area, results]) => `
    <div class="search-area">
      <div class="search-area-title">${escapeHtml(area)} <span>${results.length}개 챕터</span></div>
      <div class="search-result-list">
        ${results.map(({ lesson, rows }) => {
          const typeBadge = lesson.type ? `<span class="type-badge type-${lesson.type}">${TYPE_LABEL[lesson.type]}</span>` : '';
          return `
            <button class="search-result" onclick="goLesson(${lesson.id})">
              <div class="search-result-head">
                <div>
                  <div class="search-result-title">${escapeHtml(lesson.ch)}. ${escapeHtml(lesson.title)}</div>
                  <div class="search-result-meta">${escapeHtml(lesson.badgeText)} · ${escapeHtml(area)}</div>
                </div>
                ${typeBadge}
              </div>
              ${rows.map(row => `
                <div class="search-match">
                  <span>${escapeHtml(row.label)}</span>
                  <p>${row.snippet}</p>
                </div>
              `).join('')}
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');
}

function initSearch() {
  const input = document.getElementById('lesson-search-input');
  if (!input) return;
  input.addEventListener('input', () => renderSearchResults(input.value));
  renderSearchResults(input.value);
}

// ── 파이프라인 탭 ──
let pipeItemProfiles = {};

function togglePipeStep(n) {
  const steps = document.querySelectorAll('.pipe-step');
  const isOpen = steps[n].classList.contains('open');
  steps.forEach(function(s) { s.classList.remove('open'); });
  if (!isOpen) steps[n].classList.add('open');
}

async function checkPipeApiStatus() {
  const dot = document.getElementById('pipe-status-dot');
  const text = document.getElementById('pipe-status-text');
  const btn = document.getElementById('demo-run-btn');
  if (!dot) return;
  try {
    const res = await fetch('http://127.0.0.1:8000/health', {
      signal: AbortSignal.timeout(2000)
    });
    if (res.ok) {
      dot.className = 'pipe-status-dot online';
      text.textContent = '서버 연결됨 · localhost:8000';
      if (btn) btn.disabled = false;
      loadPipeItemProfiles();
    } else {
      setPipeOffline(dot, text, btn);
    }
  } catch (e) {
    setPipeOffline(dot, text, btn);
  }
}

function setPipeOffline(dot, text, btn) {
  dot.className = 'pipe-status-dot offline';
  text.textContent = '서버 오프라인';
  if (btn) btn.disabled = true;
}

async function loadPipeItemProfiles() {
  try {
    const res = await fetch('http://127.0.0.1:8000/item-profiles');
    if (res.ok) pipeItemProfiles = await res.json();
  } catch (e) {}
}

async function runDemo() {
  const userId = document.getElementById('demo-user-select').value;
  const model = document.getElementById('demo-model-select').value;
  const resultBox = document.getElementById('demo-result-box');
  const btn = document.getElementById('demo-run-btn');

  btn.disabled = true;
  btn.textContent = '로딩 중...';
  resultBox.innerHTML = '<div class="demo-empty">추천 결과를 가져오는 중...</div>';

  try {
    const res = await fetch(
      'http://127.0.0.1:8000/recommendations?user_id=' + userId + '&model=' + model + '&k=5'
    );
    const data = await res.json();

    let rows = '';
    data.items.forEach(function(item, i) {
      const p = pipeItemProfiles[item.item_id] || {};
      const meta = p.category
        ? '<div class="demo-item-meta">' + p.category + ' · ' + p.brand + '</div>'
        : '';
      rows += '<div class="demo-result-item">'
        + '<div><div class="demo-item-id">' + (i + 1) + '. ' + item.item_id + '</div>' + meta + '</div>'
        + '<div class="demo-item-score">' + item.score.toFixed(4) + '</div>'
        + '</div>';
    });

    const fallbackBadge = data.fallback_used
      ? '<span class="demo-fallback-badge">fallback</span>' : '';

    resultBox.innerHTML = '<div class="demo-result-header">'
      + userId + ' · ' + model.toUpperCase() + ' ' + fallbackBadge + '</div>'
      + '<div>' + rows + '</div>';
  } catch (e) {
    resultBox.innerHTML = '<div class="demo-empty">요청 실패. 서버를 확인해주세요.</div>';
    checkPipeApiStatus();
  } finally {
    btn.disabled = false;
    btn.textContent = '추천 받기';
  }
}

function initPipeline() {
  checkPipeApiStatus();
  setInterval(checkPipeApiStatus, 15000);
}

async function loadLearningData() {
  const [lessonsRes, notesRes] = await Promise.all([
    fetch("data/lessons.json"),
    fetch("data/practical-notes.json")
  ]);

  if (!lessonsRes.ok || !notesRes.ok) {
    throw new Error("학습 데이터를 불러오지 못했습니다.");
  }

  LESSONS = await lessonsRes.json();
  PRACTICAL_NOTES = await notesRes.json();
  ALL_IDS = LESSONS.map((lesson) => lesson.id);
}

async function initApp() {
  try {
    await loadLearningData();
    buildSelector("ch-selector", goLesson);
    buildSelector("quiz-selector", (id) => { quizAnswered = false; renderQuiz(id); });
    renderLesson(0);
    renderQuiz(0);
    initSearch();
    updateProgress();
  } catch (error) {
    document.getElementById("lesson-body").innerHTML = '<div class="card">학습 데이터를 불러오지 못했습니다. 로컬 서버로 실행해주세요.</div>';
    console.error(error);
  }
  initPipeline();
}

initApp();
