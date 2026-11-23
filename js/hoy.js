(function () {
'use strict';
const ES = window.ES, h = ES.h, S = () => ES.state, C = () => window.ES_COURSE;
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
      h('div', { class: 'grow' }, h('div', { class: 'brand' }, h('span', { class: 'flag' }), d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })),
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
  const learned = pool.filter(p => p.learned && p.es.split(' ').length >= 2);
  const fitted = learned.filter(p => ES.interestScore(p.tags) > 0);
  const p = pickByDay(fitted.length >= 3 ? fitted : learned.length ? learned : pool.filter(x => x.es.split(' ').length >= 2).slice(0, 12));
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

/* ----- listening: suggestions by level + log your minutes (hours are the best progress measure) ----- */
const listenMins = () => (S().listen || {}).mins || 0;
const listenHours = () => Math.round(listenMins() / 6) / 10;
const MILESTONES = [[50, 'you know some common words'], [150, 'you can follow adapted topics'], [300, 'you understand patient speakers'], [600, 'you understand people speaking normally'], [1000, 'daily conversation feels comfortable']];
function listenCard() {
  const lv = ES.currentUnit().level, list = (C().listen || {})[lv] || [];
  const hrs = listenMins() / 60, nextM = MILESTONES.find(m => hrs < m[0]) || MILESTONES[MILESTONES.length - 1];
  const add = n => { const L = S().listen = S().listen || { mins: 0, days: {} }; L.mins += n; L.days[ES.today()] = (L.days[ES.today()] || 0) + n; ES.bump('listened', n); ES.save(); ES.toast('+' + n + ' min listening'); ES.render(); };
  return h('div', { class: 'fcard' }, h('div', { class: 'f-k' }, 'Listen today'),
    h('div', { class: 'f-es small-es' }, pickByDay(list, 1) || 'Something in Spanish you enjoy'),
    h('div', { class: 'f-en' }, 'Easy listening you mostly understand is what builds your ear. Log it here.'),
    h('div', { class: 'bar' }, h('i', { style: 'width:' + Math.min(100, Math.round(100 * hrs / nextM[0])) + '%' })),
    h('div', { class: 'small muted' }, (Math.round(hrs * 10) / 10) + ' of ' + nextM[0] + ' hours → ' + nextM[1]),
    h('div', { class: 'grid2', style: 'margin-top:8px' }, h('button', { class: 'btn ghost small', onclick: () => add(10) }, '+10 min'), h('button', { class: 'btn ghost small', onclick: () => add(30) }, '+30 min')));
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
