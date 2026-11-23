(function () {
'use strict';
const ES = window.ES = { views: {} };

/* ---------- dates ---------- */
const pad = n => String(n).padStart(2, '0');
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
ES.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
ES.dstr = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
ES.today = () => ES.dstr(new Date());
ES.parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
ES.addDays = (s, n) => { const d = ES.parse(s); d.setDate(d.getDate() + n); return ES.dstr(d); };
ES.daysBetween = (a, b) => Math.round((ES.parse(b) - ES.parse(a)) / 86400000);
ES.niceDate = s => { const d = ES.parse(s); return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; };
ES.inDays = s => { const n = ES.daysBetween(ES.today(), s); return n <= 0 ? 'today' : n === 1 ? 'tomorrow' : 'in ' + n + ' days'; };

/* ---------- state ----------
   words:     {id, es, en, f:[folderIds], t:[tags], ex, exEn, note, want, src, added}
              tags: * top 75 · ok confirmed · ear heard in real content · irr irregular · stuck stuck list
   sentences: {id, es, en, kind: phrase|work|heard|lyric, src, song, pattern, parts:[[word, role, why]], rules:[ruleIds], want, added}
   rules:     {id, week, area, title, sum, body, mine}
   srs:       itemId -> {due, ivl, ease, reps, lapses}   (flashcard schedule; items not in here are "new")
   quizStats: ruleId -> {r, w}  right / wrong answers in rule quizzes
   tests:     [{date, kind, score, total, misses:[{id, you}]}]
   log:       date -> {cards, typed, quiz, test, added} */
const KEY = 'es.v1';
const TROUBLE = ['relatives', 'cualque', 'porpara', 'possess', 'verbs', 'prepron', 'accents']; // recurring misses from the Notion log
function defaults() {
  return {
    v: 1, seedV: 0,
    settings: { name: '', newPerDay: 10 },
    folders: [], words: [], sentences: [], rules: [], weeks: [], quiz: [],
    week: { current: 1, done: {}, reviewed: {} },
    srs: {}, quizStats: {}, tests: [], log: {}, mistakes: {}
  };
}
function seedInto(s) {
  const S = window.ES_SEED; if (!S) return s;
  const copy = o => JSON.parse(JSON.stringify(o));
  s.folders = copy(S.folders); s.words = copy(S.words); s.sentences = copy(S.sentences);
  s.rules = copy(S.rules); s.weeks = copy(S.weeks); s.quiz = copy(S.quiz);
  s.seedV = S.seedV;
  // Restarting after a pause: Weeks 1–3 are review, Week 4 is the next new one.
  s.week = { current: 1, done: {}, reviewed: {}, plan: { 1: 'review', 2: 'review', 3: 'review' } };
  // Words already confirmed in drills (✅) start as "known" cards, spread over the next two weeks so day one isn't a wall.
  // The owner learns from zero: Notion content is course material, not progress. (TROUBLE kept for reference.)
  s.mistakesV = 1;
  return s;
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const d = defaults(), o = JSON.parse(raw); return Object.assign(d, o, { settings: Object.assign(d.settings, o.settings || {}) }); }
  } catch (e) { console.warn('load failed', e); }
  return seedInto(defaults());
}
ES.state = load();
ES.save = () => {
  try { localStorage.setItem(KEY, JSON.stringify(ES.state)); return true; }
  catch (e) { alert('Could not save. Storage may be full or blocked in this browser.'); return false; }
};
// One-time: older installs get the Notion trouble spots and stuck words as starting mistakes.
if (!ES.state.mistakesV) {
  const s = ES.state, t = ES.today(); s.mistakes = s.mistakes || {};
  Object.entries(s.quizStats || {}).forEach(([r, q]) => { if (q.flag && !s.mistakes[r]) s.mistakes[r] = { kind: 'rule', n: 2, last: t, from: 'Notion' }; });
  (s.words || []).filter(w => (w.t || []).includes('stuck')).forEach(w => { if (!s.mistakes[w.id]) s.mistakes[w.id] = { kind: 'item', n: 2, last: t, from: 'Notion' }; });
  s.mistakesV = 1;
}
// Course v1 (Nov 2026): the owner restarts from zero on the new road. Progress resets once; his own words, sentences,
// inbox and notes stay. Course rule cards and quiz questions are added to the Library.
ES.courseSetup = function () {
  const s = ES.state, C = window.ES_COURSE; if (!C) return;
  if (!s.courseV) {
    s.srs = {}; s.mistakes = {}; s.quizStats = {}; s.tests = []; s.course = { done: {} };
    s.settings.size = s.settings.size || 'normal'; s.settings.interests = s.settings.interests || [];
    s.courseV = 1;
  }
  (C.rules || []).forEach(r => { if (!s.rules.find(x => x.id === r.id)) s.rules.push(Object.assign({}, r, { body: r.body.trim() })); });
  (C.quiz || []).forEach((q, i) => { const id = 'cq' + i; if (!s.quiz.find(x => x.id === id)) s.quiz.push(Object.assign({ id }, q)); });
  ES.save();
};
ES.courseSetup();
ES.replaceState = obj => { const d = defaults(); ES.state = Object.assign(d, obj, { settings: Object.assign(d.settings, obj.settings || {}) }); ES.courseSetup(); ES.save(); };
ES.save();

/* ---------- DOM helper (text is always text, never HTML) ---------- */
const PROPS = new Set(['value', 'checked', 'selected', 'disabled']);
ES.h = function (tag, props, ...kids) {
  const el = document.createElement(tag);
  const later = [];
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (PROPS.has(k)) later.push([k, v]);
    else el.setAttribute(k, v === true ? '' : v);
  }
  ES.append(el, kids);
  for (const [k, v] of later) el[k] = v;
  return el;
};
ES.append = (el, kids) => { kids.flat(Infinity).forEach(k => { if (k == null || k === false) return; el.append(k.nodeType ? k : document.createTextNode(String(k))); }); return el; };
ES.fill = (el, ...kids) => { el.replaceChildren(); return ES.append(el, kids); };
const h = ES.h;

/* ---------- sheets (stack), toasts ---------- */
ES.sheet = function (title, content) {
  const root = document.getElementById('modal');
  const layer = h('div', { class: 'sheet-layer' });
  const close = () => { layer.remove(); if (!root.children.length) document.body.classList.remove('noscroll'); };
  layer.append(h('div', { class: 'backdrop', onclick: close }),
    h('div', { class: 'sheet' }, h('div', { class: 'sheet-head' }, h('span', {}, title), h('button', { class: 'x', onclick: close, 'aria-label': 'Close' }, '✕')),
      h('div', { class: 'sheet-body' }, content)));
  root.append(layer); document.body.classList.add('noscroll');
  return { close, layer };
};
ES.closeAll = () => { ES.fill(document.getElementById('modal')); document.body.classList.remove('noscroll'); };
ES.confirm = (msg, yes, label) => {
  const s = ES.sheet('Are you sure?', h('div', {}, h('p', {}, msg),
    h('button', { class: 'btn block', onclick: () => { s.close(); yes(); } }, label || 'Yes'),
    h('button', { class: 'btn ghost block', onclick: () => s.close() }, 'Cancel')));
};
ES.toast = m => { document.querySelectorAll('.toast').forEach(x => x.remove()); const t = h('div', { class: 'toast' }, m); document.body.append(t); setTimeout(() => t.remove(), 1900); };
ES.copy = async text => { try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; } };

/* ---------- form helpers ---------- */
ES.field = (label, input) => h('div', {}, h('label', { class: 'f' }, label), input);
ES.chips = (opts, cur, onPick, multi) => {
  const wrap = h('div', { class: 'chips' });
  let val = cur;
  const isOn = v => multi ? (val || []).includes(v) : v === val;
  const draw = () => ES.fill(wrap, opts.map(([v, l]) => h('span', { class: 'chip' + (isOn(v) ? ' on' : ''), onclick: () => {
    if (multi) val = isOn(v) ? val.filter(x => x !== v) : (val || []).concat(v); else val = (val === v ? null : v);
    onPick(val); draw();
  } }, l)));
  draw();
  return wrap;
};
ES.seg = (opts, cur, onPick) => h('div', { class: 'seg' }, opts.map(([v, l]) => h('button', { class: v === cur ? 'on' : '', onclick: () => onPick(v) }, l)));

/* ---------- lookups ---------- */
ES.word = id => ES.state.words.find(w => w.id === id);
ES.sent = id => ES.state.sentences.find(s => s.id === id);
ES.rule = id => ES.state.rules.find(r => r.id === id);
ES.folder = id => ES.state.folders.find(f => f.id === id);
ES.item = id => ES.word(id) || ES.sent(id);
ES.inFolder = fid => ES.state.words.filter(w => (w.f || []).includes(fid));
ES.TAGS = { '*': ['⭐', 'Top 75'], ok: ['✅', 'Confirmed in a drill'], ear: ['🎧', 'Heard in real Spanish'], irr: ['🔀', 'Irregular'], stuck: ['🧩', 'Stuck list'] };
ES.KINDS = { phrase: ['💬', 'Phrase'], work: ['🏨', 'Work'], heard: ['🎧', 'Heard'], lyric: ['🎵', 'Lyric'] };
ES.inbox = () => ES.state.words.filter(w => w.want).concat(ES.state.sentences.filter(s => s.want));

/* ---------- comparing answers (accents and articles matter, but get partial credit) ---------- */
const strip = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const clean = s => String(s || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[¿?¡!.,;:"“”]/g, ' ').replace(/\s+/g, ' ').trim();
ES.plain = s => strip(clean(s));
// All acceptable answers for "bueno / buena", "time / weather", "to speak"…
ES.variants = text => {
  const out = new Set();
  String(text || '').split(/\s[\/·]\s|;|,(?=\s)/).forEach(p => {
    const c = clean(p); if (!c) return; out.add(c);
    if (c.startsWith('to ')) out.add(c.slice(3));
  });
  return [...out];
};
const ARTS = /^(el|la|los|las|un|una|unos|unas) /;
// -> {ok: true | 'accent' | 'article' | false, want}
ES.check = (answer, expected) => {
  const a = clean(answer); const vs = ES.variants(expected);
  if (!a) return { ok: false, want: vs[0] || expected };
  const parts = ES.variants(answer);
  if (parts.length > 1) { const rs = parts.map(p => ES.check(p, expected)); if (rs.every(r => r.ok === true)) return { ok: true, want: vs[0] }; const bad = rs.find(r => r.ok !== true); return bad; }
  for (const v of vs) if (a === v) return { ok: true, want: v };
  for (const v of vs) if (strip(a) === strip(v)) return { ok: 'accent', want: v };
  for (const v of vs) if (ARTS.test(v) && (a === v.replace(ARTS, '') || strip(a) === strip(v.replace(ARTS, '')))) return { ok: 'article', want: v };
  for (const v of vs) if (ARTS.test(a) && a.replace(ARTS, '') === v) return { ok: true, want: v };
  return { ok: false, want: vs[0] || expected };
};

/* ---------- spaced repetition (SM-2 style: Again / Hard / Good / Easy) ---------- */
ES.isDue = id => { const c = ES.state.srs[id]; return c && c.due <= ES.today(); };
ES.dueIds = () => Object.keys(ES.state.srs).filter(id => ES.isDue(id) && ES.item(id)).sort((a, b) => ES.state.srs[a].due.localeCompare(ES.state.srs[b].due));
ES.newToday = () => (ES.state.log[ES.today()] || {}).newSeen || 0;
// New cards in a sensible order: stuck words, your own captures, then Top 75, then your phrases, then everything else.
ES.newIds = n => {
  const s = ES.state, seen = id => s.srs[id];
  const ready = w => !w.want && w.en;
  const rank = w => w.t && w.t.includes('stuck') ? 0 : !w.t || !w.t.length || w.src ? 1 : w.t.includes('*') ? 2 : 4;
  const mine = x => x.added && x.src !== 'Lesson'; // things you added yourself (seed content has no date)
  const words = s.words.filter(w => !seen(w.id) && ready(w) && mine(w)).map((w, i) => [rank(w), i, w.id]);
  const sents = s.sentences.filter(x => !seen(x.id) && ready(x) && mine(x)).map((x, i) => [1, i, x.id]);
  return words.concat(sents).sort((a, b) => a[0] - b[0] || a[1] - b[1]).slice(0, Math.max(0, n)).map(x => x[2]);
};
ES.newLeft = () => Math.max(0, (Number(ES.state.settings.newPerDay) || 10) - ES.newToday());
ES.grade = (id, g) => { // g: 0 again, 1 hard, 2 good, 3 easy
  const s = ES.state, t = ES.today();
  let c = s.srs[id];
  if (!c) { c = s.srs[id] = { due: t, ivl: 0, ease: 2.5, reps: 0, lapses: 0 }; ES.bump('newSeen'); }
  if (g === 0) { c.lapses += c.reps ? 1 : 0; c.reps = 0; c.ivl = 0; c.ease = Math.max(1.3, c.ease - 0.2); c.due = t; }
  else if (!c.reps) { c.ivl = g === 3 ? 4 : 1; c.reps = 1; c.due = ES.addDays(t, c.ivl); }
  else {
    if (g === 1) { c.ivl = Math.max(1, c.ivl * 1.2); c.ease = Math.max(1.3, c.ease - 0.15); }
    if (g === 2) c.ivl = Math.max(c.ivl + 1, c.ivl * c.ease);
    if (g === 3) { c.ivl = Math.max(c.ivl + 2, c.ivl * c.ease * 1.3); c.ease += 0.15; }
    c.ivl = Math.round(c.ivl * (0.95 + Math.random() * 0.1)); c.reps += 1; c.due = ES.addDays(t, Math.max(1, c.ivl));
  }
  ES.save();
};
ES.nextIvl = (id, g) => { // label for the buttons
  const c = ES.state.srs[id];
  if (g === 0) return 'now';
  if (!c || !c.reps) return g === 3 ? '4d' : '1d';
  const n = g === 1 ? Math.max(1, c.ivl * 1.2) : g === 2 ? Math.max(c.ivl + 1, c.ivl * c.ease) : Math.max(c.ivl + 2, c.ivl * c.ease * 1.3);
  const d = Math.round(n); return d < 31 ? d + 'd' : Math.round(d / 30) + 'mo';
};
ES.known = () => Object.values(ES.state.srs).filter(c => c.reps >= 2).length;

/* ---------- activity log & streak ---------- */
ES.bump = (k, n) => { const L = ES.state.log, t = ES.today(); L[t] = L[t] || {}; L[t][k] = (L[t][k] || 0) + (n || 1); };
ES.streak = () => {
  const L = ES.state.log, act = d => L[d] && ['cards', 'typed', 'quiz', 'test', 'added', 'lessons', 'listened'].some(k => L[d][k]);
  let d = ES.today(), n = 0;
  if (!act(d)) d = ES.addDays(d, -1);
  while (act(d)) { n++; d = ES.addDays(d, -1); }
  return n;
};

/* ---------- rule quiz stats ---------- */
ES.ruleScore = id => { const q = ES.state.quizStats[id]; return q ? q.r / Math.max(1, q.r + q.w) : null; };
// Trouble = flagged from the Notion log until you've got it right 5+ times at 80%+, or under 75% right in quizzes.
ES.troubleRules = () => ES.state.rules.filter(r => { const q = ES.state.quizStats[r.id]; return q && (q.flag || (q.w > 0 && ES.ruleScore(r.id) < 0.75)); })
  .sort((a, b) => (ES.ruleScore(a.id) || 0) - (ES.ruleScore(b.id) || 0));
ES.recordQuiz = (ruleId, right) => {
  const s = ES.state.quizStats, q = s[ruleId] = s[ruleId] || { r: 0, w: 0 };
  right ? q.r++ : q.w++;
  ES.markMistake(ruleId, right, 'rule');
  if (q.flag && q.r >= 5 && ES.ruleScore(ruleId) >= 0.8) q.flag = false;
  ES.save();
};

/* ---------- my mistakes ----------
   Anything missed in flashcards, typing, tests or quizzes lands here; today's session fixes these first.
   An item clears after it's right twice in a row (once for words if it was a near-miss). */
ES.markMistake = (id, right, kind) => {
  const M = ES.state.mistakes = ES.state.mistakes || {};
  if (!right) { const m = M[id] = M[id] || { kind: kind || 'item', n: 0 }; m.n++; m.ok = 0; m.last = ES.today(); delete m.from; return; }
  const m = M[id]; if (!m) return;
  m.ok = (m.ok || 0) + 1; if (m.ok >= 2) delete M[id];
};
ES.mistakeList = () => Object.entries(ES.state.mistakes || {})
  .filter(([id, m]) => m.kind === 'rule' ? ES.rule(id) : ES.item(id) && ES.item(id).en)
  .sort((a, b) => (b[1].last || '').localeCompare(a[1].last || '') || b[1].n - a[1].n);

/* ---------- search across everything ---------- */
ES.search = term => {
  const q = ES.plain(term); if (!q) return [];
  const hit = (...xs) => xs.some(x => ES.plain(x).includes(q));
  const exact = (...xs) => xs.some(x => ES.variants(x).some(v => strip(v) === q));
  const s = ES.state, out = [];
  s.words.forEach(w => { if (hit(w.es, w.en)) out.push({ type: 'w', id: w.id, score: exact(w.es, w.en) ? 0 : 2 }); });
  s.sentences.forEach(x => { if (hit(x.es, x.en, x.song)) out.push({ type: 's', id: x.id, score: 1 }); });
  s.rules.forEach(r => { if (hit(r.title, r.sum, r.area)) out.push({ type: 'r', id: r.id, score: 1 }); else if (hit(r.body)) out.push({ type: 'r', id: r.id, score: 3 }); });
  return out.sort((a, b) => a.score - b.score).slice(0, 60);
};

/* ---------- rule text: tiny markup → DOM (## head, - bullet, | table |, > tip, = es = en, **bold**) ---------- */
const bold = text => text.split(/\*\*(.+?)\*\*/).map((p, i) => i % 2 ? h('b', {}, p) : p);
ES.rich = body => {
  const out = []; let table = null, list = null;
  const flush = () => { table = null; list = null; };
  String(body || '').split('\n').forEach(raw => {
    const line = raw.trim();
    if (!line) { flush(); return; }
    if (line.startsWith('|')) {
      const cells = line.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      if (!table) { table = h('table', { class: 'rt' }); out.push(h('div', { class: 'rt-wrap' }, table)); list = null; }
      table.append(h('tr', {}, cells.map(c => h('td', {}, bold(c)))));
      return;
    }
    table = null;
    if (/^(- |\d+\. )/.test(line)) {
      if (!list) { list = h('ul', { class: 'rl' }); out.push(list); }
      list.append(h('li', {}, bold(line.replace(/^(- |\d+\. )/, ''))));
      return;
    }
    list = null;
    if (line.startsWith('## ')) out.push(h('h3', { class: 'rh' }, line.slice(3)));
    else if (line.startsWith('> ')) out.push(h('div', { class: 'tip' }, h('b', {}, '🧠 '), bold(line.slice(2))));
    else if (line.startsWith('= ')) { const [es, en] = line.slice(2).split(' = '); out.push(h('div', { class: 'ex' }, h('div', { class: 'ex-es' }, bold(es || '')), en ? h('div', { class: 'ex-en' }, en) : null)); }
    else out.push(h('p', {}, bold(line)));
  });
  return out;
};
})();
