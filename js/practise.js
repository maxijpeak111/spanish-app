(function () {
'use strict';
const ES = window.ES, h = ES.h, S = () => ES.state;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ready = x => x && x.en && x.es;
const ids = list => list.filter(ready).map(x => x.id);

/* =================== DECKS =================== */
// A deck is a list of item ids. Word-type decks map to the folders that came from Notion.
ES.DECKS = {
  today: ['📅', 'Today\'s mix', 'Due, then new'],
  random: ['🔀', 'Random words', '20 from everything'],
  mistakes: ['⚠️', 'My mistakes', 'Things you missed'],
  hotel: ['🏨', 'Hotel', 'Words + work phrases'],
  stuck: ['🧩', 'Stuck words', 'With memory tricks']
};
const TYPES = [['verbs', 'Verbs'], ['nouns', 'Nouns'], ['adj', 'Adjectives'], ['adverbs', 'Adverbs'], ['phrases', 'Phrases'], ['top75', 'Top 75'], ['questions', 'Question words'], ['pronouns', 'Pronouns']];
ES.deckIds = function (deck) {
  const s = S();
  if (deck === 'today') return ES.dueIds().concat(ES.newIds(ES.newLeft()));
  if (deck === 'random') return shuffle(ids(s.words)).slice(0, 20);
  if (deck === 'mistakes') return ES.mistakeList().filter(([, m]) => m.kind === 'item').map(([id]) => id);
  if (deck === 'hotel') return ids(ES.inFolder('hotel')).concat(ids(s.sentences.filter(x => x.kind === 'work')));
  if (deck === 'stuck') return ids(s.words.filter(w => (w.t || []).includes('stuck')));
  if (deck === 'phrases') return ids(s.sentences);
  if (deck.startsWith('f:')) return ids(ES.inFolder(deck.slice(2)));
  return ids(ES.inFolder(deck));
};
const deckName = d => !d ? '' : ES.DECKS[d] ? ES.DECKS[d][1] : (TYPES.find(t => t[0] === d) || [])[1] || (ES.folder(d.replace(/^f:/, '')) || {}).name || '';

ES.deckPicker = function () {
  const d = { deck: 'today', dir: 'auto', n: 20 };
  const startBtn = h('button', { class: 'btn block big', onclick: () => { sh.close(); ES.start('cards', { deck: d.deck, dir: d.dir, n: d.n }); } });
  const draw = () => {
    const n = ES.deckIds(d.deck).length;
    ES.fill(startBtn, n ? 'Start · ' + (d.deck === 'today' ? n : Math.min(n, d.n)) + ' cards' : 'Nothing in this deck yet');
    startBtn.disabled = !n;
  };
  const decks = h('div', { class: 'decks' });
  const drawDecks = () => ES.fill(decks, Object.entries(ES.DECKS).map(([k, v]) => h('button', { class: 'deck' + (d.deck === k ? ' on' : ''), onclick: () => { d.deck = k; refresh(); } },
    h('span', { class: 'd-i' }, v[0]), h('span', { class: 'd-t' }, v[1]), h('span', { class: 'd-n' }, ES.deckIds(k).length))));
  const typesBox = h('div', {});
  const drawTypes = () => ES.fill(typesBox, ES.chips(TYPES, TYPES.some(t => t[0] === d.deck) ? d.deck : null, v => { d.deck = v || 'today'; refresh(); }));
  const folders = h('select', { onchange: e => { if (e.target.value) { d.deck = 'f:' + e.target.value; refresh(); } } },
    h('option', { value: '' }, 'Or any folder…'), S().folders.map(f => h('option', { value: f.id }, f.name + ' (' + ES.inFolder(f.id).length + ')')));
  const refresh = () => { drawDecks(); drawTypes(); draw(); if (!d.deck.startsWith('f:')) folders.value = ''; };
  const sh = ES.sheet('Flashcards', h('div', {},
    decks,
    h('label', { class: 'f' }, 'Word type'), typesBox, folders,
    h('label', { class: 'f' }, 'Show me'),
    ES.chips([['auto', 'Mixed'], ['es', 'Spanish first'], ['en', 'English first']], d.dir, v => { d.dir = v || 'auto'; }),
    h('label', { class: 'f' }, 'How many'),
    ES.chips([[10, '10'], [20, '20'], [40, '40']], d.n, v => { d.n = v || 20; draw(); }),
    startBtn));
  refresh();
};

/* =================== PRACTISE PAGE =================== */
ES.views.practise = function (app) {
  const tests = S().tests.slice(-5).reverse();
  const mode = (icon, title, sub, onclick) => h('button', { class: 'mode', onclick }, h('span', { class: 'm-icon' }, icon), h('span', { class: 'grow' }, h('span', { class: 'm-t' }, title), h('span', { class: 'm-s' }, sub)), h('span', { class: 'chev' }, '›'));
  ES.fill(app,
    h('h1', {}, 'Practise'),
    h('div', { class: 'list' },
      mode('🃏', 'Flashcards', 'Today, random, mistakes, hotel or a word type', ES.deckPicker),
      mode('⌨️', 'Type the translation', 'Accents and articles checked', typeSetup),
      mode('🧩', 'Rule quiz', 'Mixed topics, or one rule', quizSetup),
      mode('📝', 'Cold test', '20 questions, score at the end', ES.testSetup),
      mode('⚠️', 'My mistakes', ES.mistakeList().length + ' to fix', () => { location.hash = '#mistakes'; })),
    h('h2', {}, 'Cold test scores'),
    tests.length ? h('div', { class: 'list' }, tests.map(t => h('div', { class: 'item' },
      h('div', { class: 'grow' }, h('div', { class: 't' }, t.score + ' / ' + t.total), h('div', { class: 'sub' }, ES.niceDate(t.date) + ' · ' + t.label)),
      h('div', { class: 'score-bar' }, h('i', { style: 'width:' + Math.round(100 * t.score / t.total) + '%' })))))
      : h('p', { class: 'muted small' }, 'Your scores will show here so you can see the trend.'));
};

/* ----- setup sheets ----- */
function poolPicker(cur, onPick) {
  const opts = [['all', 'All words'], ['mistakes', 'My mistakes'], ['stuck', 'Stuck words'], ['hotel', 'Hotel']].concat(TYPES);
  return ES.chips(opts, cur, v => onPick(v || 'all'));
}
const poolIds = pool => pool === 'all' ? ids(S().words) : ES.deckIds(pool);
const poolLabel = pool => pool === 'all' ? 'All words' : deckName(pool);
function typeSetup() {
  const d = { pool: 'all', dir: 'en', n: 15 };
  const sh = ES.sheet('Type the translation', h('div', {},
    h('label', { class: 'f' }, 'From'), poolPicker(d.pool, v => { d.pool = v; }),
    h('label', { class: 'f' }, 'Direction'), ES.chips([['en', 'English → Spanish'], ['es', 'Spanish → English']], d.dir, v => { d.dir = v || 'en'; }),
    h('label', { class: 'f' }, 'How many'), ES.chips([[10, '10'], [15, '15'], [25, '25']], d.n, v => { d.n = v || 15; }),
    h('button', { class: 'btn block big', onclick: () => { sh.close(); ES.start('type', { ids: poolIds(d.pool), dir: d.dir, n: d.n, title: poolLabel(d.pool) }); } }, 'Start')));
}
function quizSetup() {
  const s = S(), withQ = s.rules.filter(r => s.quiz.some(q => q.rule === r.id));
  const sh = ES.sheet('Rule quiz', h('div', {},
    h('button', { class: 'btn block big', onclick: () => { sh.close(); ES.start('quiz', { mix: true, n: 12 }); } }, 'Mixed · leans on your weak spots'),
    h('button', { class: 'btn ghost block', onclick: () => { sh.close(); ES.start('quiz', { mix: true, n: 20, all: true }); } }, 'Big mix · 20 from everything'),
    h('label', { class: 'f' }, 'Or one rule'),
    h('div', { class: 'list' }, withQ.map(r => h('div', { class: 'item tap', onclick: () => { sh.close(); ES.start('quiz', { rule: r.id }); } },
      h('div', { class: 'grow' }, h('div', { class: 't' }, r.title)), h('span', { class: 'chev' }, '›'))))));
}
ES.testSetup = function () {
  const d = { pool: 'all', dir: 'en' };
  const sh = ES.sheet('Cold test', h('div', {},
    h('p', { class: 'small muted' }, '20 questions with no hints. You get your score and every miss at the end, and misses go into My mistakes.'),
    h('label', { class: 'f' }, 'From'), poolPicker(d.pool, v => { d.pool = v; }),
    h('label', { class: 'f' }, 'Direction'), ES.chips([['en', 'English → Spanish'], ['es', 'Spanish → English']], d.dir, v => { d.dir = v || 'en'; }),
    h('button', { class: 'btn block big', onclick: () => { sh.close(); ES.start('test', { ids: poolIds(d.pool), dir: d.dir, n: 20, title: poolLabel(d.pool) }); } }, 'Start test')));
};

/* =================== MISTAKES PAGE =================== */
ES.views.mistakes = function (app) {
  const list = ES.mistakeList();
  ES.fill(app,
    h('a', { class: 'back', href: '#today' }, '‹ Hoy'),
    h('h1', {}, 'My mistakes'),
    h('p', { class: 'muted small' }, 'Anything you miss lands here. Get it right twice in a row and it leaves the list.'),
    list.length ? [h('button', { class: 'btn block big', onclick: () => ES.start('fix') }, 'Fix them now'),
      h('div', { class: 'list', style: 'margin-top:14px' }, list.map(([id, m]) => {
        const isRule = m.kind === 'rule', x = isRule ? ES.rule(id) : ES.item(id);
        return h('div', { class: 'item' },
          h('div', { class: 'grow tap', onclick: () => isRule ? (location.hash = '#rule/' + id) : ES.word(id) ? ES.wordSheet(id) : (location.hash = '#s/' + id) },
            h('div', { class: 't' }, isRule ? x.title : x.es), h('div', { class: 'sub' }, (isRule ? 'Rule' : x.en) + ' · ' + (m.from ? 'from your Notion log' : 'missed ' + m.n + '×'))),
          h('button', { class: 'x-btn', 'aria-label': 'Remove', onclick: () => { delete S().mistakes[id]; ES.save(); ES.render(); } }, '✕'));
      }))]
      : h('div', { class: 'empty' }, 'No mistakes to fix. Nice.'));
};

/* =================== RUNNER =================== */
// A run is a list of steps {k: 'card' | 'type' | 'quiz', id, fix}. Today's session mixes them.
const quizFor = ruleId => { const qs = S().quiz.filter(q => q.rule === ruleId); return qs.length ? qs[Math.floor(Math.random() * qs.length)].id : null; };
function fixSteps(max) {
  return ES.mistakeList().slice(0, max).map(([id, m]) => {
    if (m.kind !== 'rule') return { k: 'card', id, fix: true, dir: 'en' };
    const q = quizFor(id); return q ? { k: 'quiz', id: q, fix: true } : null;
  }).filter(Boolean);
}
ES.start = function (mode, o) {
  o = o || {};
  const s = S(); let steps = [];
  if (mode === 'today') {
    const fix = fixSteps(8), seen = new Set(fix.map(x => x.id));
    steps = fix.concat(ES.deckIds('today').filter(id => !seen.has(id)).map(id => ({ k: 'card', id })));
    if (!steps.length) { ES.toast('All done for today 🎉'); return; }
  } else if (mode === 'fix') {
    steps = fixSteps(30);
    if (!steps.length) { ES.toast('No mistakes to fix'); return; }
  } else if (mode === 'cards') {
    let list = o.ids || ES.deckIds(o.deck || 'today');
    if (o.deck !== 'today') list = shuffle(list).slice(0, o.n || 40);
    steps = list.filter(id => ready(ES.item(id))).map(id => ({ k: 'card', id }));
    if (!steps.length) { ES.toast('Nothing in that deck yet'); return; }
  } else if (mode === 'type' || mode === 'test') {
    steps = shuffle((o.ids || []).filter(id => ready(ES.item(id)))).slice(0, o.n || 15).map(id => ({ k: 'type', id }));
    if (steps.length < (mode === 'test' ? 5 : 1)) { ES.toast('Not enough words with meanings in that set yet'); return; }
  } else if (mode === 'quiz') {
    let pool = s.quiz;
    if (o.rule) pool = pool.filter(q => q.rule === o.rule);
    else if (o.week) { const wk = s.weeks.find(w => w.n === o.week); pool = pool.filter(q => wk.rules.includes(q.rule)); }
    steps = (o.mix ? mixQuiz(pool, o.n || 12, !o.all) : shuffle(pool).slice(0, o.n || 12).map(q => q.id)).map(id => ({ k: 'quiz', id }));
    if (!steps.length) { ES.toast('No questions for that yet'); return; }
  }
  ES.run = { mode, o, steps, i: 0, results: [], flipped: false, answered: null, again: {}, dirs: {} };
  ES.closeAll(); location.hash = '#run'; ES.render();
};
// Interleave: no two questions on the same rule in a row; weak spots appear more often.
function mixQuiz(pool, n, weighted) {
  const weak = new Set(ES.troubleRules().map(r => r.id).concat(ES.mistakeList().filter(([, m]) => m.kind === 'rule').map(([id]) => id)));
  const bag = [];
  shuffle(pool).forEach(q => { const k = weighted && weak.has(q.rule) ? 3 : 1; for (let i = 0; i < k; i++) bag.push(q); });
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
  const total = R.steps.length, done = Math.min(R.i, total);
  const head = h('div', { class: 'run-head' },
    h('button', { class: 'icon-btn', onclick: () => finish(true), 'aria-label': 'Stop' }, '✕'),
    h('div', { class: 'bar grow' }, h('i', { style: 'width:' + Math.round(100 * done / Math.max(1, total)) + '%' })),
    h('span', { class: 'small muted run-count' }, done + '/' + total));
  if (R.i >= total) { ES.fill(app, head, summary()); return; }
  const st = R.steps[R.i];
  if (st.k === 'lessonEnd') { ES.fill(app, head, lessonEnd(st)); return; }
  ES.fill(app, head, st.k === 'card' ? card(st) : st.k === 'quiz' ? question(st) : st.k === 'screen' ? ES.renderScreen(st, next) : typed(st));
  const inp = app.querySelector('input.answer'); if (inp && !R.answered) setTimeout(() => inp.focus(), 50);
};
function next() {
  const R = ES.run, cur = R.steps[R.i], nx = R.steps[R.i + 1];
  if (cur && cur.seg && (!nx || nx.seg !== cur.seg)) ES.segDone(cur.seg);
  R.i++; R.flipped = false; R.answered = null; ES.render(); window.scrollTo(0, 0);
}
ES.runNext = next;
function lessonEnd(st) {
  const R = ES.run;
  if (!st.saved) {
    const mine = R.results.filter(x => x.k === 'screen' && x.lesson === st.lesson);
    st.score = mine.filter(x => x.ok).length; st.total = mine.length;
    st.words = ES.finishLesson(st.lesson, st.score, st.total); st.saved = true;
  }
  const f = ES.lessonById(st.lesson);
  return h('div', { class: 'run done' }, h('div', { class: 'cele-big' }, f && f.l.check ? '🏁' : '✅'),
    h('div', { class: 'big-score' }, f ? ES.tpl(f.l.title) : 'Lesson done'),
    st.total ? h('p', {}, st.score + ' / ' + st.total + ' right') : null,
    st.words ? h('p', { class: 'small muted' }, st.words + ' new words added to your flashcards — first review tomorrow.') : null,
    h('button', { class: 'btn block big', onclick: next }, R.i + 1 < R.steps.length ? 'Continue' : 'Finish'));
}
function stageLabel(st) {
  const R = ES.run;
  if (st.fix) return '⚠️ Fixing a mistake';
  if (R.mode === 'today') return S().srs[st.id] ? '🔁 Review' : '🆕 New';
  return deckName(R.o.deck) || R.o.title || '🃏 Flashcards';
}

/* ----- flashcards ----- */
function card(st) {
  const R = ES.run, id = st.id, x = ES.item(id), isW = !!ES.word(id);
  if (!R.dirs[id]) {
    const want = st.dir || (R.o.dir && R.o.dir !== 'auto' ? R.o.dir : null);
    const c = S().srs[id];
    R.dirs[id] = want || (c && c.reps >= 2 && Math.random() < 0.5 ? 'en' : 'es');
  }
  const dir = R.dirs[id];
  const front = dir === 'en' ? x.en : x.es, backTxt = dir === 'en' ? x.es : x.en;
  const grade = g => {
    ES.grade(id, g); ES.bump('cards');
    if (g === 0) ES.markMistake(id, false); else if (g >= 2) ES.markMistake(id, true);
    R.results.push({ k: 'card', id, g });
    if (g === 0) { R.again[id] = (R.again[id] || 0) + 1; if (R.again[id] < 4) R.steps.splice(Math.min(R.steps.length, R.i + 4), 0, { k: 'card', id }); }
    ES.save(); next();
  };
  return h('div', { class: 'run' },
    h('div', { class: 'run-tag' }, stageLabel(st), dir === 'en' ? ' · say it in Spanish' : ''),
    h('div', { class: 'flash' + (R.flipped ? ' flipped' : ''), onclick: () => { if (!R.flipped) { R.flipped = true; ES.render(); } } },
      h('div', { class: 'f-front' + (dir === 'en' ? '' : ' es') }, front),
      R.flipped ? [h('div', { class: 'f-line' }), h('div', { class: 'f-back' + (dir === 'en' ? ' es' : '') }, backTxt),
        isW && x.ex ? h('div', { class: 'ex' }, h('div', { class: 'ex-es' }, x.ex), x.exEn ? h('div', { class: 'ex-en' }, x.exEn) : null) : null,
        !isW && x.pattern ? h('div', { class: 'tip small' }, x.pattern) : null,
        x.note ? h('div', { class: 'tip small' }, x.note) : null]
        : h('div', { class: 'f-hint' }, 'Say it, then tap to check')),
    R.flipped ? h('div', { class: 'grades' }, [['Again', 0, 'again'], ['Hard', 1, 'hard'], ['Good', 2, 'good'], ['Easy', 3, 'easy']].map(([l, g, c]) =>
      h('button', { class: 'gbtn ' + c, onclick: () => grade(g) }, h('b', {}, l), h('span', {}, ES.nextIvl(id, g)))))
      : h('button', { class: 'btn block big', onclick: () => { R.flipped = true; ES.render(); } }, 'Show answer'));
}

/* ----- type the translation & cold test ----- */
function typed(st) {
  const R = ES.run, id = st.id, x = ES.item(id), test = R.mode === 'test';
  const dir = st.dir || R.o.dir || 'en';
  const prompt = dir === 'en' ? x.en : x.es, want = dir === 'en' ? x.es : x.en;
  let val = '';
  const submit = () => {
    if (R.answered) { next(); return; }
    const c = ES.check(val, want);
    R.results.push({ k: 'type', id, you: val, ok: c.ok, want });
    ES.bump(test ? 'test' : 'typed');
    ES.markMistake(id, c.ok === true);
    if (test) { ES.save(); next(); return; }
    R.answered = c;
    if (S().srs[id] || c.ok !== true) ES.grade(id, c.ok === true ? 2 : c.ok ? 1 : 0);
    ES.save(); ES.render();
  };
  const a = R.answered;
  return h('div', { class: 'run' },
    h('div', { class: 'run-tag' }, test ? '📝 Cold test' : '⌨️ Type it', ' · ', dir === 'en' ? 'in Spanish' : 'in English'),
    h('div', { class: 'prompt' + (dir === 'en' ? '' : ' es') }, prompt),
    h('form', { onsubmit: e => { e.preventDefault(); submit(); } },
      h('input', { class: 'answer', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', autocomplete: 'off', placeholder: dir === 'en' ? 'Type the Spanish…' : 'Type the English…', disabled: !!a,
        value: a ? R.results[R.results.length - 1].you : '', oninput: e => { val = e.target.value; } }),
      dir === 'en' && !a ? accentBar() : null,
      a ? h('div', { class: 'verdict ' + (a.ok === true ? 'ok' : a.ok ? 'part' : 'bad') },
        h('b', {}, a.ok === true ? '✓ Correct' : a.ok === 'accent' ? '≈ Nearly — watch the accent' : a.ok === 'article' ? '≈ Nearly — include the article (it shows the gender)' : '✗ Not quite'),
        a.ok !== true ? h('div', { class: 'want' }, want) : null) : null,
      h('button', { class: 'btn block big', type: 'submit' }, a || test ? 'Next' : 'Check'),
      !a && !test ? h('button', { class: 'btn ghost block', type: 'button', onclick: () => { val = ''; submit(); } }, 'I don\'t know') : null));
}
// Quick buttons for Spanish letters, so accents are easy on the iPhone keyboard.
ES.accentBar = () => accentBar();
function accentBar() {
  return h('div', { class: 'accents' }, ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'].map(ch => h('button', { type: 'button', class: 'acc', onclick: e => {
    const inp = e.target.closest('form').querySelector('input.answer');
    const p = inp.selectionStart != null ? inp.selectionStart : inp.value.length;
    inp.value = inp.value.slice(0, p) + ch + inp.value.slice(inp.selectionEnd != null ? inp.selectionEnd : p);
    inp.dispatchEvent(new Event('input')); inp.focus(); inp.setSelectionRange(p + 1, p + 1);
  } }, ch)));
}

/* ----- rule quiz ----- */
function question(st) {
  const R = ES.run, q = S().quiz.find(x => x.id === st.id), r = ES.rule(q.rule);
  const a = R.answered;
  st.order = st.order || shuffle(q.o.map((_, i) => i)); // so the right answer isn't always in the same place
  const pick = i => {
    if (a) return;
    const right = i === q.a;
    R.answered = { pick: i, right };
    R.results.push({ k: 'quiz', id: q.id, rule: q.rule, ok: right });
    ES.recordQuiz(q.rule, right); ES.bump('quiz'); ES.save(); ES.render();
  };
  return h('div', { class: 'run' },
    h('div', { class: 'run-tag' }, st.fix ? '⚠️ Fixing a mistake · ' : '🧩 ', r ? r.title : 'Rule'),
    h('div', { class: 'prompt es' }, q.q),
    h('div', { class: 'opts' }, st.order.map(i => h('button', {
      class: 'opt' + (a ? (i === q.a ? ' right' : i === a.pick ? ' wrong' : ' dim') : ''), onclick: () => pick(i) }, q.o[i]))),
    a ? [h('div', { class: 'verdict ' + (a.right ? 'ok' : 'bad') }, h('b', {}, a.right ? '✓ ¡Correcto!' : '✗ Not this time'), h('div', {}, q.why)),
      r ? h('a', { class: 'small link', href: '#rule/' + r.id, onclick: leave }, 'Open the rule card ›') : null,
      h('button', { class: 'btn block big', onclick: next }, 'Next')] : null);
}

/* ----- end of a run ----- */
function summary() {
  const R = ES.run, res = R.results, body = [];
  const cards = res.filter(x => x.k === 'card'), quiz = res.filter(x => x.k === 'quiz'), typedR = res.filter(x => x.k === 'type');
  let title = 'Done';
  if (cards.length) {
    const first = {}; cards.forEach(x => { if (!(x.id in first)) first[x.id] = x.g; });
    const n = Object.keys(first).length, ok = Object.values(first).filter(g => g > 0).length;
    title = n + ' cards';
    body.push(h('p', {}, ok + ' remembered first time · ' + (n - ok) + ' needed another look'));
  }
  if (quiz.length) {
    const ok = quiz.filter(x => x.ok).length;
    if (!cards.length) title = ok + ' / ' + quiz.length; else body.push(h('p', {}, 'Rule questions: ' + ok + ' / ' + quiz.length));
  }
  if (typedR.length) {
    const ok = typedR.filter(x => x.ok === true).length, misses = typedR.filter(x => x.ok !== true);
    title = ok + ' / ' + typedR.length;
    if (R.mode === 'test' && !R.saved) { S().tests.push({ date: ES.today(), label: R.o.title || 'Words', dir: R.o.dir, score: ok, total: typedR.length }); R.saved = true; ES.save(); }
    if (misses.length) body.push(h('p', { class: 'small muted' }, 'Misses and near-misses are in My mistakes, so they come back.'),
      h('div', { class: 'list', style: 'text-align:left' }, misses.map(m => h('div', { class: 'item' },
        h('div', { class: 'grow' }, h('div', { class: 't' }, m.want), h('div', { class: 'sub' }, (ES.plain(m.want) === ES.plain(ES.item(m.id).es) ? ES.item(m.id).en : ES.item(m.id).es) + (m.you ? ' · you: ' + m.you : ' · skipped')))))));
  }
  const lessons = res.filter(x => x.k === 'screen');
  if (lessons.length && !cards.length && !quiz.length && !typedR.length) title = 'Lesson done';
  if (R.mode === 'today') title = '¡Hecho!';
  return h('div', { class: 'run done' },
    h('div', { class: 'cele-big' }, '🎉'), h('div', { class: 'big-score' }, title), body,
    h('button', { class: 'btn block big', onclick: () => finish(false) }, 'Finish'),
    ['quiz', 'type', 'test'].includes(R.mode) ? h('button', { class: 'btn ghost block', onclick: () => ES.start(R.mode, R.o) }, 'Go again') : null);
}
function leave() { ES.run = null; document.body.classList.remove('running'); }
function finish(early) {
  const R = ES.run;
  if (early && R && R.results.length && R.i < R.steps.length) { R.steps = R.steps.slice(0, R.i); ES.render(); return; }
  leave(); ES.save(); location.hash = R && R.mode === 'lesson' ? '#unit/' + ((ES.lessonById(R.o.lesson) || {}).u || {}).id : R && ['today', 'fix', 'cards'].includes(R.mode) ? '#today' : '#practise';
}
})();
