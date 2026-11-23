(function () {
'use strict';
const ES = window.ES, h = ES.h, S = () => ES.state;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ready = x => x && x.en && x.es;

/* =================== PRACTISE PAGE =================== */
ES.views.practise = function (app) {
  const s = S(), due = ES.dueIds().length, fresh = ES.newIds(ES.newLeft()).length;
  const tests = s.tests.slice(-6).reverse();
  const mode = (icon, title, sub, onclick, extra) => h('div', { class: 'card tap mode', onclick }, h('div', { class: 'm-icon' }, icon), h('div', { class: 'grow' }, h('div', { class: 't' }, title), h('div', { class: 'small muted' }, sub)), extra || h('span', { class: 'chev' }, '›'));
  ES.fill(app,
    h('h1', {}, 'Practise'),
    h('p', { class: 'small muted' }, 'Flashcards space things out so they come back just before you\'d forget. Quizzes mix topics, which is harder in the moment but sticks better.'),
    mode('🃏', 'Flashcards', due + ' due · ' + fresh + ' new today', () => ES.start('cards', { srs: true }), due + fresh ? h('span', { class: 'count big' }, due + fresh) : null),
    mode('⌨️', 'Type the translation', 'Spanish → English or English → Spanish, accents checked', () => typeSetup()),
    mode('🧩', 'Rule quiz', 'Mixed questions on your trouble spots, or one rule', () => quizSetup()),
    mode('📝', 'Cold test', 'No hints, scored out of 20 at the end', () => ES.testSetup()),
    h('h2', {}, 'Cold test history'),
    tests.length ? h('div', { class: 'card' }, tests.map(t => h('div', { class: 'item' },
      h('div', { class: 'grow' }, h('div', { class: 't' }, t.score + ' / ' + t.total + '  ·  ' + t.label), h('div', { class: 'sub' }, ES.niceDate(t.date))),
      h('div', { class: 'score-bar' }, h('i', { style: 'width:' + Math.round(100 * t.score / t.total) + '%' })))))
      : h('div', { class: 'empty' }, 'Your test scores will show here, so you can see the trend.'));
};

/* ----- setup sheets ----- */
function poolPicker(cur, onPick) {
  const s = S();
  const opts = [['all', 'All words'], ['stuck', '🧩 Stuck words'], ['sent', '💬 My sentences'], ['learned', '🧠 Words I\'m learning']].concat(s.folders.map(f => ['f:' + f.id, f.icon + ' ' + f.name]));
  return ES.chips(opts, cur, v => onPick(v || 'all'));
}
function poolIds(pool) {
  const s = S();
  if (pool === 'stuck') return s.words.filter(w => (w.t || []).includes('stuck') && ready(w)).map(w => w.id);
  if (pool === 'sent') return s.sentences.filter(ready).map(x => x.id);
  if (pool === 'learned') return Object.keys(s.srs).filter(id => ready(ES.item(id)));
  if (pool.startsWith('f:')) return ES.inFolder(pool.slice(2)).filter(ready).map(w => w.id);
  return s.words.filter(ready).map(w => w.id);
}
const poolLabel = pool => pool === 'all' ? 'All words' : pool === 'stuck' ? 'Stuck words' : pool === 'sent' ? 'Sentences' : pool === 'learned' ? 'Learning' : (ES.folder(pool.slice(2)) || {}).name || 'Folder';

function typeSetup() {
  const d = { pool: 'all', dir: 'en', n: 15 };
  const sh = ES.sheet('Type the translation', h('div', {},
    ES.field('From', poolPicker(d.pool, v => { d.pool = v; })),
    ES.field('Direction', ES.chips([['en', 'English → Spanish'], ['es', 'Spanish → English']], d.dir, v => { d.dir = v || 'en'; })),
    ES.field('How many', ES.chips([[10, '10'], [15, '15'], [25, '25']], d.n, v => { d.n = v || 15; })),
    h('button', { class: 'btn block', onclick: () => { sh.close(); ES.start('type', { ids: poolIds(d.pool), dir: d.dir, n: d.n, title: poolLabel(d.pool) }); } }, 'Start')));
}
function quizSetup() {
  const s = S(), withQ = s.rules.filter(r => s.quiz.some(q => q.rule === r.id));
  const sh = ES.sheet('Rule quiz', h('div', {},
    h('button', { class: 'btn block', onclick: () => { sh.close(); ES.start('quiz', { mix: true, n: 12 }); } }, '🔀 Mixed — weighted to trouble spots (recommended)'),
    h('button', { class: 'btn ghost block', onclick: () => { sh.close(); ES.start('quiz', { mix: true, n: 20, all: true }); } }, '🎯 Big mix — 20 from everything'),
    h('h2', {}, 'Or one rule'),
    h('div', { class: 'card' }, withQ.map(r => h('div', { class: 'item tap', onclick: () => { sh.close(); ES.start('quiz', { rule: r.id }); } },
      h('div', { class: 'grow' }, h('div', { class: 't' }, r.title), h('div', { class: 'sub' }, s.quiz.filter(q => q.rule === r.id).length + ' questions')), h('span', { class: 'chev' }, '›'))))));
}
ES.testSetup = function () {
  const d = { pool: 'all', dir: 'en' };
  const sh = ES.sheet('Cold test — 20 questions', h('div', {},
    h('p', { class: 'small muted' }, 'No hints and no feedback until the end. Then you see your score out of 20 and every miss, and can send the misses to today\'s flashcards.'),
    ES.field('From', poolPicker(d.pool, v => { d.pool = v; })),
    ES.field('Direction', ES.chips([['en', 'English → Spanish (harder)'], ['es', 'Spanish → English']], d.dir, v => { d.dir = v || 'en'; })),
    h('button', { class: 'btn block', onclick: () => { sh.close(); ES.start('test', { ids: poolIds(d.pool), dir: d.dir, n: 20, title: poolLabel(d.pool) }); } }, 'Start test')));
};

/* =================== RUNNER =================== */
// One practice run at a time lives in ES.run; the #run route draws it.
ES.start = function (mode, o) {
  o = o || {};
  const s = S(); let items = [];
  if (mode === 'cards') {
    if (o.srs) items = ES.dueIds().concat(ES.newIds(ES.newLeft()));
    else items = shuffle((o.ids || []).filter(id => ready(ES.item(id))));
    items = items.slice(0, o.srs ? 200 : 40);
    if (!items.length) { ES.toast(o.srs ? 'All caught up for today 🎉' : 'Nothing to practise here yet'); return; }
  } else if (mode === 'type' || mode === 'test') {
    items = shuffle((o.ids || []).filter(id => ready(ES.item(id)))).slice(0, o.n || 15);
    if (items.length < (mode === 'test' ? 5 : 1)) { ES.toast('Not enough words with meanings in that set yet'); return; }
  } else if (mode === 'quiz') {
    let pool = s.quiz;
    if (o.rule) pool = pool.filter(q => q.rule === o.rule);
    else if (o.week) { const wk = s.weeks.find(w => w.n === o.week); pool = pool.filter(q => wk.rules.includes(q.rule)); }
    items = o.mix ? mixQuiz(pool, o.n || 12, !o.all) : shuffle(pool).slice(0, o.n || 12);
    if (!items.length) { ES.toast('No questions for that yet'); return; }
  }
  ES.run = { mode, o, items, i: 0, results: [], flipped: false, answered: null, again: {} };
  ES.closeAll(); location.hash = '#run'; ES.render();
};
// Interleave: no two questions on the same rule in a row; trouble spots appear more often.
function mixQuiz(pool, n, weighted) {
  const trouble = new Set(ES.troubleRules().map(r => r.id));
  const bag = [];
  shuffle(pool).forEach(q => { const k = weighted && trouble.has(q.rule) ? 3 : 1; for (let i = 0; i < k; i++) bag.push(q); });
  const out = [], used = new Set();
  for (const q of shuffle(bag)) {
    if (out.length >= n) break;
    if (used.has(q.id) || (out.length && out[out.length - 1].rule === q.rule)) continue;
    out.push(q); used.add(q.id);
  }
  return out.map(q => q.id);
}

ES.views.run = function (app) {
  const R = ES.run;
  if (!R) { location.hash = '#practise'; return; }
  document.body.classList.add('running');
  const total = R.items.length, done = Math.min(R.i, total);
  const head = h('div', { class: 'run-head' },
    h('button', { class: 'icon-btn', onclick: () => finish(true), 'aria-label': 'Stop' }, '✕'),
    h('div', { class: 'bar grow' }, h('i', { style: 'width:' + Math.round(100 * done / Math.max(1, total)) + '%' })),
    h('span', { class: 'small muted run-count' }, done + '/' + total));
  if (R.i >= total) { ES.fill(app, head, summary()); return; }
  const id = R.items[R.i];
  ES.fill(app, head, R.mode === 'cards' ? card(id) : R.mode === 'quiz' ? question(id) : typed(id));
  const inp = app.querySelector('input.answer'); if (inp && !R.answered) setTimeout(() => inp.focus(), 50);
};
function next() { const R = ES.run; R.i++; R.flipped = false; R.answered = null; ES.render(); window.scrollTo(0, 0); }

/* ----- flashcards ----- */
function card(id) {
  const R = ES.run, x = ES.item(id), isW = !!ES.word(id);
  R.dirs = R.dirs || {};
  if (!R.dirs[id]) { const c = S().srs[id]; R.dirs[id] = R.o.dir || (c && c.reps >= 2 && c.reps % 2 === 0 ? 'en' : 'es'); }
  const dir = R.dirs[id];
  const front = dir === 'en' ? x.en : x.es, backTxt = dir === 'en' ? x.es : x.en;
  const isNew = !S().srs[id];
  const grade = g => {
    ES.grade(id, g); ES.bump('cards');
    R.results.push({ id, g });
    if (g === 0) { R.again[id] = (R.again[id] || 0) + 1; if (R.again[id] < 4) R.items.splice(Math.min(R.items.length, R.i + 4), 0, id); }
    next();
  };
  return h('div', { class: 'run' },
    h('div', { class: 'run-tag' }, isNew ? '🆕 New card' : '🔁 Review', dir === 'en' ? ' · say it in Spanish' : '', R.o.title ? ' · ' + R.o.title : ''),
    h('div', { class: 'flash' + (R.flipped ? ' flipped' : ''), onclick: () => { if (!R.flipped) { R.flipped = true; ES.render(); } } },
      h('div', { class: 'f-front' + (dir === 'en' ? '' : ' es') }, front),
      R.flipped ? [h('div', { class: 'f-line' }), h('div', { class: 'f-back' + (dir === 'en' ? ' es' : '') }, backTxt),
        isW && x.ex ? h('div', { class: 'ex' }, h('div', { class: 'ex-es' }, x.ex), x.exEn ? h('div', { class: 'ex-en' }, x.exEn) : null) : null,
        !isW && x.pattern ? h('div', { class: 'tip small' }, x.pattern) : null,
        x.note ? h('div', { class: 'tip small' }, x.note) : null]
        : h('div', { class: 'f-hint' }, 'Say it out loud, then tap to check')),
    R.flipped ? h('div', { class: 'grades' }, [['Again', 0, 'again'], ['Hard', 1, 'hard'], ['Good', 2, 'good'], ['Easy', 3, 'easy']].map(([l, g, c]) =>
      h('button', { class: 'gbtn ' + c, onclick: () => grade(g) }, h('b', {}, l), h('span', {}, ES.nextIvl(id, g)))))
      : h('button', { class: 'btn block big', onclick: () => { R.flipped = true; ES.render(); } }, 'Show answer'));
}

/* ----- type the translation & cold test ----- */
function typed(id) {
  const R = ES.run, x = ES.item(id), test = R.mode === 'test';
  const prompt = R.o.dir === 'en' ? x.en : x.es, want = R.o.dir === 'en' ? x.es : x.en;
  let val = '';
  const submit = () => {
    if (R.answered) { next(); return; }
    const c = ES.check(val, want);
    R.results.push({ id, you: val, ok: c.ok, want });
    ES.bump(test ? 'test' : 'typed');
    if (test) { next(); return; }
    R.answered = c;
    if (ES.state.srs[id] || c.ok !== true) ES.grade(id, c.ok === true ? 2 : c.ok ? 1 : 0);
    ES.render();
  };
  const a = R.answered;
  return h('div', { class: 'run' },
    h('div', { class: 'run-tag' }, test ? '📝 Cold test' : '⌨️ Type it', ' · ', R.o.dir === 'en' ? 'in Spanish' : 'in English'),
    h('div', { class: 'prompt' + (R.o.dir === 'en' ? '' : ' es') }, prompt),
    h('form', { onsubmit: e => { e.preventDefault(); submit(); } },
      h('input', { class: 'answer', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', autocomplete: 'off', placeholder: R.o.dir === 'en' ? 'Type the Spanish…' : 'Type the English…', disabled: !!a,
        value: a ? R.results[R.results.length - 1].you : '', oninput: e => { val = e.target.value; } }),
      R.o.dir === 'en' && !a ? accentBar() : null,
      a ? h('div', { class: 'verdict ' + (a.ok === true ? 'ok' : a.ok ? 'part' : 'bad') },
        h('b', {}, a.ok === true ? '✓ Correct' : a.ok === 'accent' ? '≈ Nearly — watch the accent' : a.ok === 'article' ? '≈ Nearly — include the article (it tells you the gender)' : '✗ Not quite'),
        a.ok !== true ? h('div', { class: 'want' }, want) : (ES.variants(want).length > 1 ? h('div', { class: 'small muted' }, 'Also: ' + want) : null)) : null,
      h('button', { class: 'btn block big', type: 'submit' }, a ? 'Next' : test ? (val ? 'Next' : 'Next') : 'Check'),
      !a && !test ? h('button', { class: 'btn ghost block', type: 'button', onclick: () => { val = ''; submit(); } }, 'I don\'t know') : null));
}
// Quick buttons for Spanish letters, so accents are easy on the iPhone keyboard.
function accentBar() {
  return h('div', { class: 'accents' }, ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'].map(ch => h('button', { type: 'button', class: 'acc', onclick: e => {
    const inp = e.target.closest('form').querySelector('input.answer');
    const p = inp.selectionStart != null ? inp.selectionStart : inp.value.length;
    inp.value = inp.value.slice(0, p) + ch + inp.value.slice(inp.selectionEnd != null ? inp.selectionEnd : p);
    inp.dispatchEvent(new Event('input')); inp.focus(); inp.setSelectionRange(p + 1, p + 1);
  } }, ch)));
}

/* ----- rule quiz ----- */
function question(qid) {
  const R = ES.run, q = S().quiz.find(x => x.id === qid), r = ES.rule(q.rule);
  const a = R.answered;
  const pick = i => {
    if (a) return;
    const right = i === q.a;
    R.answered = { pick: i, right };
    R.results.push({ id: qid, ok: right });
    ES.recordQuiz(q.rule, right); ES.bump('quiz'); ES.render();
  };
  return h('div', { class: 'run' },
    h('div', { class: 'run-tag' }, '🧩 ' + (r ? r.title : 'Rule')),
    h('div', { class: 'prompt es' }, q.q),
    h('div', { class: 'opts' }, q.o.map((o, i) => h('button', {
      class: 'opt' + (a ? (i === q.a ? ' right' : i === a.pick ? ' wrong' : ' dim') : ''), onclick: () => pick(i) }, o))),
    a ? [h('div', { class: 'verdict ' + (a.right ? 'ok' : 'bad') }, h('b', {}, a.right ? '✓ ¡Correcto!' : '✗ Not this time'), h('div', {}, q.why)),
      r ? h('a', { class: 'small link', href: '#rule/' + r.id, onclick: () => { ES.run = null; document.body.classList.remove('running'); } }, 'Open the rule card ›') : null,
      h('button', { class: 'btn block big', onclick: next }, 'Next')] : null);
}

/* ----- end of a run ----- */
function summary() {
  const R = ES.run, res = R.results;
  let title, body = [];
  if (R.mode === 'cards') {
    const firstTry = {}; res.forEach(x => { if (!(x.id in firstTry)) firstTry[x.id] = x.g; });
    const ids = Object.keys(firstTry), ok = ids.filter(id => firstTry[id] > 0).length;
    title = ids.length + ' cards done'; body.push(h('p', {}, ok + ' remembered first time · ' + (ids.length - ok) + ' needed another look.'));
  } else if (R.mode === 'quiz') {
    const ok = res.filter(x => x.ok).length;
    title = ok + ' / ' + res.length;
    const byRule = {}; res.forEach(x => { const q = S().quiz.find(y => y.id === x.id); byRule[q.rule] = byRule[q.rule] || [0, 0]; byRule[q.rule][x.ok ? 0 : 1]++; });
    body.push(h('div', { class: 'card' }, Object.entries(byRule).map(([rid, [r, w]]) => h('a', { class: 'item', href: '#rule/' + rid, onclick: leave },
      h('div', { class: 'grow' }, h('div', { class: 't' }, (ES.rule(rid) || {}).title)), h('span', { class: 'pill ' + (w ? 'red' : 'ok') }, r + '/' + (r + w))))));
  } else {
    const ok = res.filter(x => x.ok === true).length, near = res.filter(x => x.ok && x.ok !== true).length;
    const misses = res.filter(x => x.ok !== true);
    title = ok + ' / ' + res.length;
    if (near) body.push(h('p', { class: 'small muted' }, near + ' nearly right (accent or article) — counted as misses so they come back.'));
    if (R.mode === 'test' && !R.saved) {
      S().tests.push({ date: ES.today(), label: R.o.title || 'Words', dir: R.o.dir, score: ok, total: res.length, misses: misses.map(m => ({ id: m.id, you: m.you })) });
      R.saved = true; ES.save();
    }
    if (misses.length) body.push(h('h2', {}, 'To work on'), h('div', { class: 'card' }, misses.map(m => h('div', { class: 'item' },
      h('div', { class: 'grow' }, h('div', { class: 't es' }, m.want), h('div', { class: 'sub' }, (R.o.dir === 'en' ? ES.item(m.id).en : ES.item(m.id).es) + (m.you ? '  ·  you: ' + m.you : '  ·  skipped')))))),
      h('button', { class: 'btn block', onclick: () => { misses.forEach(m => { const c = S().srs[m.id]; if (c) { c.due = ES.today(); c.reps = 0; c.ivl = 0; } else ES.grade(m.id, 0); }); ES.save(); ES.toast('Added to today\'s flashcards'); } }, '🃏 Send misses to today\'s flashcards'));
  }
  return h('div', { class: 'run done' },
    h('div', { class: 'cele-big' }, '🎉'), h('div', { class: 'big-score' }, title),
    body,
    h('button', { class: 'btn block big', onclick: () => finish(false) }, 'Done'),
    R.mode !== 'cards' ? h('button', { class: 'btn ghost block', onclick: () => ES.start(R.mode, R.o) }, 'Go again') : null);
}
function leave() { ES.run = null; document.body.classList.remove('running'); }
function finish(early) {
  const R = ES.run;
  if (early && R && R.results.length && R.mode !== 'quiz' && R.i < R.items.length) { R.items = R.items.slice(0, R.i); ES.render(); return; }
  leave(); ES.save(); location.hash = R && R.mode === 'cards' && R.o.srs ? '#today' : '#practise';
}
})();
