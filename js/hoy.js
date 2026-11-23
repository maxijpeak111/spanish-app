(function () {
'use strict';
const ES = window.ES, h = ES.h, S = () => ES.state, C = () => window.ES_COURSE;
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fechaES = d => { const s = DIAS[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()]; return s[0].toUpperCase() + s.slice(1); };
const dayNum = () => Math.floor(ES.parse(ES.today()) / 86400000);
const pickByDay = (list, salt) => list.length ? list[(dayNum() + (salt || 0)) % list.length] : null;

/* =================== HOY: guided session on top, daily feed underneath =================== */
ES.views.today = function (app) {
  const s = S(), size = s.settings.size || 'normal';
  const plan = ES.todayPlan(size), next = plan.find(p => !p.done), nl = ES.nextLesson();
  const streak = ES.streak(), d = new Date();
  const go = () => ES.startToday(size);
  ES.fill(app,
    h('div', { class: 'top' },
      h('div', { class: 'grow' }, h('div', { class: 'brand' }, h('span', { class: 'flag' }), fechaES(d)),
        h('h1', {}, s.settings.name ? 'Hoy, ' + s.settings.name : 'Hoy')),
      h('button', { class: 'icon-btn', onclick: ES.settings, 'aria-label': 'Settings' }, '⚙')),
    // session size
    h('div', { class: 'sizes' }, Object.entries(ES.SIZES).map(([k, z]) => h('button', { class: k === size ? 'on' : '', onclick: () => { s.settings.size = k; ES.save(); ES.render(); } }, h('b', {}, z.label), h('span', {}, '~' + z.mins + ' min')))),
    // the four steps
    h('div', { class: 'steps' }, plan.map(p => h('div', { class: 'stp' + (p.done ? ' done' : p === next ? ' cur' : '') }, h('span', { class: 'stp-dot' }, p.done ? '✓' : ''), h('span', { class: 'stp-l' }, p.label)))),
    next ? h('button', { class: 'go', onclick: go },
        h('span', { class: 'go-t' }, plan.every(p => !p.done) ? 'Start today' : 'Continue: ' + next.label.toLowerCase()),
        h('span', { class: 'go-s' }, plan.filter(p => !p.done).slice(0, 2).map(p => p.label + ': ' + p.what).join('  →  ')),
        h('span', { class: 'go-arrow' }, '▶'))
      : h('div', { class: 'go done' }, h('span', { class: 'go-t' }, '✓ ¡Hecho! Done for today'), h('span', { class: 'go-s' }, 'Anything extra is a bonus'),
        h('div', { class: 'grid2', style: 'margin-top:10px' }, h('button', { class: 'btn ghost small', onclick: ES.deckPicker }, 'More cards'), nl.l ? h('button', { class: 'btn ghost small', onclick: () => ES.startLesson(nl.l.id) }, 'Next lesson') : h('a', { class: 'btn ghost small', href: '#path' }, 'Your road'))),
    nl.needsWriting ? h('a', { class: 'card alert tap', href: '#unit/' + nl.u.id }, h('b', {}, '✨ Unit ' + nl.u.n + ' is ready to be written for you'), h('div', { class: 'small' }, 'One copy and paste with Claude — it builds the unit from how you\'re doing.')) : null,
    // feed
    h('div', { class: 'feed' },
      phraseOfDay(), quickCheck(), linkedMistake(), listenCard(), inboxCard(), unitCard()),
    h('p', { class: 'foot' }, '🔥 ' + streak + (streak === 1 ? ' day' : ' days') + '  ·  ' + ES.known() + ' words known  ·  ' + listenHours() + 'h listening'));
};

/* ----- phrase of the day: from your lessons' stories, leaning on your interests ----- */
function phraseOfDay() {
  const pool = [];
  ES.units().forEach(u => (u.lessons || []).forEach(l => l.screens.forEach(sc => { if (sc.t === 'story') sc.lines.forEach(ln => pool.push({ es: ES.tpl(ln[1]), en: ES.tpl(ln[2]), tags: ['work'], learned: ES.lessonDone(l.id) })); if (sc.t === 'ex') pool.push({ es: ES.tpl(sc.es), en: ES.tpl(sc.en), tags: sc.tags || [], learned: ES.lessonDone(l.id) }); })));
  S().sentences.filter(x => x.en && !x.want).forEach(x => pool.push({ es: x.es, en: x.en, id: x.id, tags: [x.kind === 'work' ? 'work' : x.kind === 'lyric' ? 'music' : 'social'], learned: !!S().srs[x.id] || !!x.added }));
  const isPhrase = p => !/[·\/]/.test(p.es) && p.es.replace(/[¿¡?!.,]/g, '').trim().split(/\s+/).length >= 3;
  const real = pool.filter(isPhrase);
  const learned = real.filter(p => p.learned);
  const fitted = learned.filter(p => ES.interestScore(p.tags) > 0);
  const p = pickByDay(fitted.length >= 3 ? fitted : learned.length ? learned : real.slice(0, 12));
  if (!p) return null;
  return h('div', { class: 'fcard' }, h('div', { class: 'f-k' }, 'Phrase of the day'),
    h('div', { class: 'f-es' }, ES.sp(p.es)), h('div', { class: 'f-en' }, p.en),
    p.id ? h('a', { class: 'f-link', href: '#s/' + p.id }, 'How it\'s built ›') : null);
}

/* ----- one quick question from what you're on now ----- */
let qc = null;
function quickCheck() {
  const rules = ES.liveRules().concat(ES.doneRules());
  const pool = S().quiz.filter(q => rules.includes(q.rule));
  if (!pool.length) return null;
  if (!qc || qc.day !== ES.today() || !pool.find(q => q.id === qc.id)) { const q = pickByDay(pool, 3); qc = { day: ES.today(), id: q.id, ans: null, order: q.o.map((_, i) => i).sort(() => Math.random() - 0.5) }; }
  const q = pool.find(x => x.id === qc.id), r = ES.rule(q.rule);
  const pick = i => { if (qc.ans != null) return; qc.ans = i; ES.recordQuiz(q.rule, i === q.a); ES.bump('quiz'); ES.save(); ES.render(); };
  return h('div', { class: 'fcard' }, h('div', { class: 'f-k' }, 'Quick check · ' + (r ? r.title : '')),
    h('div', { class: 'f-q' }, ES.tpl(q.q)),
    h('div', { class: 'f-opts' }, qc.order.map(i => h('button', { class: 'opt small' + (qc.ans != null ? (i === q.a ? ' right' : i === qc.ans ? ' wrong' : ' dim') : ''), onclick: () => pick(i) }, q.o[i]))),
    qc.ans != null ? h('div', { class: 'small', style: 'margin-top:8px' }, (qc.ans === q.a ? '✓ ' : '✗ ') + q.why) : null,
    qc.ans != null ? h('button', { class: 'f-link', onclick: () => { qc = null; const nq = pool[Math.floor(Math.random() * pool.length)]; qc = { day: ES.today(), id: nq.id, ans: null, order: nq.o.map((_, i) => i).sort(() => Math.random() - 0.5) }; ES.render(); } }, 'Another one ›') : null);
}

/* ----- a mistake that belongs to what you're learning now ----- */
function linkedMistake() {
  const m = ES.topicMistakes()[0]; if (!m) return null;
  const [id, info] = m, isRule = info.kind === 'rule', x = isRule ? ES.rule(id) : ES.item(id);
  if (!x) return null;
  return h('div', { class: 'fcard warn' }, h('div', { class: 'f-k' }, 'Your mistake · linked to today'),
    h('div', { class: 'f-es' }, isRule ? x.title : x.es), h('div', { class: 'f-en' }, isRule ? x.sum : x.en),
    h('div', { class: 'small' }, 'It\'s in today\'s warm-up' + (ES.topicMistakes().length > 1 ? ' with ' + (ES.topicMistakes().length - 1) + ' more' : '') + '.'),
    h('a', { class: 'f-link', href: '#mistakes' }, 'All my mistakes ›'));
}

/* ----- listening: log any amount, undo mistakes, work towards a weekly target; total hours show long-term level ----- */
const LST = () => { const L = S().listen = S().listen || { mins: 0, days: {} }; L.log = L.log || []; L.weekly = L.weekly || 180; return L; };
const listenMins = () => LST().mins || 0;
const listenHours = () => Math.round(listenMins() / 6) / 10;
const weekStart = () => { const d = ES.parse(ES.today()); const back = (d.getDay() + 6) % 7; return ES.addDays(ES.today(), -back); };
const weekMins = () => { const L = LST(), ws = weekStart(); return Object.entries(L.days).filter(([d]) => d >= ws).reduce((a, [, m]) => a + m, 0); };
const fmt = m => m >= 60 ? Math.floor(m / 60) + 'h' + (m % 60 ? ' ' + (m % 60) + 'm' : '') : m + ' min';
const MILESTONES = [[50, 'you know some common words'], [150, 'you can follow adapted topics'], [300, 'you understand patient speakers'], [600, 'you understand people speaking normally'], [1000, 'daily conversation feels comfortable']];
ES.logListen = (mins, what) => {
  mins = Math.round(Number(mins)); if (!mins || mins < 1 || mins > 600) { ES.toast('Enter minutes between 1 and 600'); return; }
  const L = LST(), t = ES.today();
  L.log.push({ id: ES.uid(), date: t, mins, what: what || '' }); L.mins += mins; L.days[t] = (L.days[t] || 0) + mins;
  ES.bump('listened', mins); ES.save(); ES.toast('+' + fmt(mins) + ' listening'); ES.render();
};
ES.unlogListen = id => {
  const L = LST(), e = L.log.find(x => x.id === id); if (!e) return;
  L.log = L.log.filter(x => x.id !== id); L.mins = Math.max(0, L.mins - e.mins); L.days[e.date] = Math.max(0, (L.days[e.date] || 0) - e.mins);
  if (!L.days[e.date]) delete L.days[e.date];
  ES.save(); ES.toast('Removed ' + fmt(e.mins)); ES.render();
};
function logSheet() {
  let mins = 30, what = '';
  const sh = ES.sheet('Log listening', h('div', {},
    h('label', { class: 'f' }, 'How long?'),
    ES.chips([[10, '10 min'], [15, '15 min'], [20, '20 min'], [30, '30 min'], [45, '45 min'], [60, '1 hour']], mins, v => { if (v) { mins = v; num.value = v; } }),
    ES.field('Or type the minutes', (num = h('input', { type: 'number', inputmode: 'numeric', min: 1, max: 600, value: mins, oninput: e => { mins = e.target.value; } }))),
    ES.field('What was it? (optional)', h('input', { placeholder: 'Podcast, series, song…', oninput: e => { what = e.target.value.trim(); } })),
    h('button', { class: 'btn block big', onclick: () => { sh.close(); ES.logListen(mins, what); } }, 'Add to today')));
  var num;
}
function targetSheet() {
  const L = LST(); let v = L.weekly;
  const sh = ES.sheet('Weekly listening target', h('div', {},
    h('p', { class: 'small muted' }, 'Easy listening you mostly understand builds your ear more than anything. Pick an amount you can hit most weeks.'),
    ES.chips([[60, '1 hour'], [120, '2 hours'], [180, '3 hours'], [300, '5 hours'], [420, '7 hours'], [600, '10 hours']], v, x => { if (x) { v = x; hrs.value = x / 60; } }),
    ES.field('Or type hours per week', (hrs = h('input', { type: 'number', inputmode: 'decimal', min: 0.5, max: 40, step: 0.5, value: v / 60, oninput: e => { v = Math.round(Number(e.target.value) * 60); } }))),
    h('button', { class: 'btn block big', onclick: () => { if (!v || v < 15) { ES.toast('Pick at least 15 minutes'); return; } L.weekly = v; ES.save(); sh.close(); ES.render(); } }, 'Save target')));
  var hrs;
}
function listenCard() {
  const L = LST(), lv = ES.currentUnit().level, list = (C().listen || {})[lv] || [];
  const wk = weekMins(), pct = Math.min(100, Math.round(100 * wk / L.weekly));
  const hrs = L.mins / 60, nextM = MILESTONES.find(m => hrs < m[0]) || MILESTONES[MILESTONES.length - 1];
  const todays = L.log.filter(x => x.date === ES.today());
  return h('div', { class: 'fcard' },
    h('div', { class: 'row between' }, h('div', { class: 'f-k', style: 'margin:0' }, 'Listening this week'), h('button', { class: 'f-link', style: 'margin:0', onclick: targetSheet }, 'Target ' + fmt(L.weekly) + ' ✎')),
    h('div', { class: 'l-week' }, h('b', {}, fmt(wk)), h('span', {}, ' of ' + fmt(L.weekly)), pct >= 100 ? h('span', { class: 'pill ok', style: 'margin-left:8px' }, '✓ Hit') : null),
    h('div', { class: 'bar' }, h('i', { style: 'width:' + pct + '%' })),
    todays.length ? h('div', { class: 'l-today' }, todays.map(e => h('span', { class: 'l-entry' }, fmt(e.mins) + (e.what ? ' · ' + e.what : ''), h('button', { class: 'x-mini', 'aria-label': 'Remove', onclick: () => ES.confirm('Remove ' + fmt(e.mins) + ' from today?', () => ES.unlogListen(e.id), 'Remove') }, '✕')))) : null,
    h('button', { class: 'btn small block', onclick: logSheet }, '＋ Log listening'),
    h('div', { class: 'small muted', style: 'margin-top:10px' }, 'Idea: ' + (pickByDay(list, 1) || 'anything in Spanish you enjoy')),
    h('div', { class: 'small muted' }, 'All time: ' + (Math.round(hrs * 10) / 10) + ' of ' + nextM[0] + ' hours → ' + nextM[1]));
}
function inboxCard() {
  const n = ES.inbox().length; if (!n) return null;
  return h('a', { class: 'fcard tap', href: '#library/inbox' }, h('div', { class: 'f-k' }, 'Want to know'), h('div', { class: 'f-es small-es' }, n + ' waiting for Claude to explain'), h('div', { class: 'f-link' }, 'Ask Claude ›'));
}
function unitCard() {
  const u = ES.currentUnit();
  const n = (u.lessons || []).filter(l => ES.lessonDone(l.id)).length;
  return h('a', { class: 'fcard tap', href: '#unit/' + u.id }, h('div', { class: 'f-k' }, 'Your road · ' + u.level + ' · Unit ' + u.n),
    h('div', { class: 'f-es small-es' }, u.title), h('div', { class: 'f-en' }, u.place),
    u.lessons ? h('div', { class: 'bar' }, h('i', { style: 'width:' + Math.round(100 * n / u.lessons.length) + '%' })) : null);
}
})();
