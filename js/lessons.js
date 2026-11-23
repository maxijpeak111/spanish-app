(function () {
'use strict';
const ES = window.ES, h = ES.h, S = () => ES.state, C = () => window.ES_COURSE;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* =================== SPEECH (tap to hear, iPhone's Spanish voice) =================== */
let voice = null;
const pickVoice = () => { try { const vs = speechSynthesis.getVoices(); voice = vs.find(v => v.lang === 'es-ES') || vs.find(v => /^es/.test(v.lang)) || null; } catch (e) { /* no speech */ } };
try { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } catch (e) { /* ignore */ }
ES.say = text => {
  try {
    const u = new SpeechSynthesisUtterance(String(text).replace(/[¿¡]/g, '').replace(/\s*[·—]\s*/g, ', '));
    u.lang = 'es-ES'; if (voice) u.voice = voice; u.rate = 0.9;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) { ES.toast('Speech isn\'t available here'); }
};
// Spanish text you can tap to hear
ES.sp = (text, cls) => h('span', { class: 'sp ' + (cls || ''), onclick: e => { e.stopPropagation(); ES.say(text); } }, text, h('span', { class: 'spk', 'aria-hidden': 'true' }, ' 🔊'));
ES.tpl = s => String(s == null ? '' : s).replace(/\{name\}/g, S().settings.name || 'Alex');

/* =================== COURSE MODEL =================== */
// Course units come from js/course.js; units Claude writes later live in state.customUnits and replace the mapped version.
ES.units = () => C().units.map(u => { const cu = (S().customUnits || {})[u.id]; return cu ? Object.assign({}, u, cu, { custom: true }) : u; });
ES.unit = id => ES.units().find(u => u.id === id);
ES.lessonById = id => { for (const u of ES.units()) for (const l of (u.lessons || [])) if (l.id === id) return { u, l }; return null; };
const P = () => S().course = S().course || { done: {} };
ES.lessonDone = id => !!P().done[id];
ES.unitStatus = u => {
  if (!u.lessons) return 'unwritten';
  const n = u.lessons.filter(l => ES.lessonDone(l.id)).length;
  return n === u.lessons.length ? 'done' : n ? 'going' : 'new';
};
ES.currentUnit = () => ES.units().find(u => ES.unitStatus(u) !== 'done') || ES.units()[ES.units().length - 1];
ES.unitUnlocked = u => { const all = ES.units(), i = all.indexOf(u); return i <= 0 || ES.unitStatus(all[i - 1]) === 'done' || ES.unitStatus(u) !== 'new' && ES.unitStatus(u) !== 'unwritten'; };
ES.nextLesson = () => { const u = ES.currentUnit(); if (!u.lessons) return { u, needsWriting: true }; return { u, l: u.lessons.find(l => !ES.lessonDone(l.id)) }; };
// Rules relevant right now: this unit's and the one before (that's where mistakes get tied in).
ES.liveRules = () => {
  const all = ES.units(), u = ES.currentUnit(), i = all.indexOf(u);
  return [...new Set((u.rules || []).concat(i > 0 ? all[i - 1].rules || [] : []))].filter(r => ES.rule(r));
};
ES.doneRules = () => [...new Set(ES.units().filter(u => ES.unitStatus(u) !== 'new' && ES.unitStatus(u) !== 'unwritten').flatMap(u => u.rules || []))].filter(r => ES.rule(r));

// Turn a lesson into runner steps. Stories become read + questions.
ES.lessonSteps = (lessonId, seg) => {
  const f = ES.lessonById(lessonId); if (!f) return [];
  const out = [];
  f.l.screens.forEach((sc, i) => {
    out.push({ k: 'screen', lesson: lessonId, i, seg });
    if (sc.t === 'story') (sc.qs || []).forEach((q, j) => out.push({ k: 'screen', lesson: lessonId, i, qi: j, seg }));
  });
  out.push({ k: 'lessonEnd', lesson: lessonId, seg });
  return out;
};

// Finishing a lesson: words go into the Library (if new) and straight into flashcards for tomorrow.
const COURSE_FOLDER = 'course';
function learnWords(lesson) {
  const s = S(), t = ES.today(), tomorrow = ES.addDays(t, 1);
  const lists = lesson.screens.filter(x => x.t === 'words').flatMap(x => x.list);
  let added = 0;
  lists.forEach(([es, en, note]) => {
    es = ES.tpl(es);
    let w = s.words.find(x => ES.plain(x.es) === ES.plain(es)) || s.words.find(x => ES.plain(x.es.replace(/^(el|la|un|una|los|las) /, '')) === ES.plain(es.replace(/^(el|la|un|una|los|las) /, '')));
    if (!w) {
      if (!ES.folder(COURSE_FOLDER)) s.folders.unshift({ id: COURSE_FOLDER, name: 'From my lessons', icon: '🛤️' });
      w = { id: 'w' + ES.uid(), es, en, f: [COURSE_FOLDER], t: [], note, src: 'Lesson', added: t };
      s.words.push(w);
    }
    if (!s.srs[w.id]) { s.srs[w.id] = { due: tomorrow, ivl: 1, ease: 2.5, reps: 1, lapses: 0 }; added++; }
  });
  return added;
}
ES.finishLesson = (lessonId, score, total) => {
  const f = ES.lessonById(lessonId); if (!f) return 0;
  const n = learnWords(f.l);
  P().done[lessonId] = { date: ES.today(), score, total };
  ES.bump('lessons'); ES.save();
  return n;
};

/* =================== SCREENS =================== */
const ROLE = r => /verb|ser|tener|estar/i.test(r) ? 'r-verb' : /pronoun/i.test(r) ? 'r-pron' : /question/i.test(r) ? 'r-q' : /job|noun|name|place/i.test(r) ? 'r-noun' : 'r-other';
const cont = (label, fn) => h('button', { class: 'btn block big', onclick: fn }, label || 'Continue');
const rich = text => ES.rich(ES.tpl(text));
const norm = s => ES.plain(s).replace(/\s+/g, ' ').trim();

ES.renderScreen = function (st, next) {
  const R = ES.run, f = ES.lessonById(st.lesson);
  if (!f) { next(); return h('div'); }
  const sc = f.l.screens[st.i];
  const lane = C().lanes[f.l.lane] || ['', ''];
  const head = h('div', { class: 'run-tag' }, lane[0] + ' ' + ES.tpl(f.l.title));
  const res = ok => { R.results.push({ k: 'screen', lesson: st.lesson, ok }); };
  const wrongRule = rule => { if (rule) { ES.recordQuiz(rule, false); } };
  const rightRule = rule => { if (rule) ES.recordQuiz(rule, true); };
  const a = R.answered;

  // story questions
  if (sc.t === 'story' && st.qi != null) return mc(Object.assign({}, sc.qs[st.qi]), head, true);
  switch (sc.t) {
    case 'info': case 'tip':
      return h('div', { class: 'run lesson' }, head, sc.title ? h('h2', { class: 'l-title' }, ES.tpl(sc.title)) : null,
        h('div', { class: sc.t === 'tip' ? 'tip big' : 'l-body' }, sc.t === 'tip' ? [h('b', {}, '🧠 '), ES.tpl(sc.body)] : rich(sc.body)), cont(null, next));
    case 'ex': {
      const ex = pickVariant(sc);
      return h('div', { class: 'run lesson' }, head, h('div', { class: 'l-kicker' }, 'Example'),
        h('div', { class: 'l-ex' }, ES.sp(ES.tpl(ex.es), 'l-ex-es')), h('div', { class: 'l-ex-en' }, ES.tpl(ex.en)),
        ex.parts ? h('div', { class: 'chunks' }, ex.parts.filter(p => p[0] && p[0] !== '?').map(p => h('div', { class: 'chunk ' + ROLE(p[1]) }, h('b', {}, ES.tpl(p[0])), h('span', {}, p[1]), p[2] ? h('i', {}, p[2]) : null))) : null,
        cont(null, next));
    }
    case 'words':
      return h('div', { class: 'run lesson' }, head, h('div', { class: 'l-kicker' }, 'New words · tap to hear'),
        h('div', { class: 'wordlist' }, sc.list.map(([es, en, note]) => h('div', { class: 'wl' }, ES.sp(ES.tpl(es), 'wl-es'), h('div', { class: 'wl-en' }, en), note ? h('div', { class: 'wl-n' }, note) : null))),
        cont('Got them', next));
    case 'mc': return mc(sc, head);
    case 'build': return build(sc, head);
    case 'type': return typeIt(sc, head);
    case 'match': return match(sc, head);
    case 'story':
      return h('div', { class: 'run lesson' }, head, h('h2', { class: 'l-title' }, sc.title), h('p', { class: 'small muted' }, 'Tap a line to hear it. Tap "English" if you\'re stuck — try first.'),
        h('div', { class: 'story' }, sc.lines.map(([who, es, en]) => {
          const enEl = h('div', { class: 'st-en hidden' }, ES.tpl(en));
          return h('div', { class: 'st-line' + (ES.tpl(who) === ES.tpl('{name}') ? ' me' : '') }, h('div', { class: 'st-who' }, ES.tpl(who)), ES.sp(ES.tpl(es), 'st-es'),
            h('button', { class: 'st-show', onclick: e => { enEl.classList.toggle('hidden'); } }, 'English'), enEl);
        })), cont('Questions', next));
    case 'speak': {
      const shown = R.flipped;
      return h('div', { class: 'run lesson' }, head, h('div', { class: 'l-kicker' }, '🗣️ Say it out loud'),
        h('div', { class: 'prompt' }, ES.tpl(sc.en)),
        sc.hint && !shown ? h('p', { class: 'small muted' }, 'Hint: ' + sc.hint) : null,
        shown ? [h('div', { class: 'l-ex' }, ES.sp(ES.tpl(sc.es), 'l-ex-es')),
          h('div', { class: 'grades three' }, [['Missed', 0, 'again'], ['Close', 1, 'hard'], ['Got it', 2, 'good']].map(([l, g, c]) => h('button', { class: 'gbtn ' + c, onclick: () => { res(g === 2); next(); } }, h('b', {}, l))))]
          : cont('Check', () => { R.flipped = true; ES.render(); }));
    }
  }
  return h('div', {}, cont(null, next));

  function mc(q, headEl, story) {
    st.order = st.order || shuffle(q.o.map((_, i) => i));
    const pick = i => {
      if (R.answered) return;
      const right = i === q.a; R.answered = { pick: i, right }; res(right);
      right ? rightRule(q.rule) : wrongRule(q.rule); ES.save(); ES.render();
    };
    return h('div', { class: 'run lesson' }, headEl, story ? h('div', { class: 'l-kicker' }, 'About the story') : null,
      h('div', { class: 'prompt es' }, ES.tpl(q.q)),
      h('div', { class: 'opts' }, st.order.map(i => h('button', { class: 'opt' + (a ? (i === q.a ? ' right' : i === a.pick ? ' wrong' : ' dim') : ''), onclick: () => pick(i) }, ES.tpl(q.o[i])))),
      a ? [h('div', { class: 'verdict ' + (a.right ? 'ok' : 'bad') }, h('b', {}, a.right ? '✓ ¡Eso es!' : '✗ Not quite'), h('div', {}, ES.tpl(q.why || ''))), cont('Next', next)] : null);
  }
  function build(q, headEl) {
    const target = ES.tpl(q.es);
    const toks = target.replace(/[¿¡]/g, '').replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);
    st.pool = st.pool || shuffle(toks.concat(q.extra || []).map((w, i) => ({ w, i })));
    st.picked = st.picked || [];
    const check = () => {
      const got = st.picked.map(i => st.pool[i].w).join(' ');
      const right = norm(got) === norm(toks.join(' '));
      R.answered = { right }; res(right); right ? rightRule(q.rule) : wrongRule(q.rule); ES.save(); ES.render();
    };
    return h('div', { class: 'run lesson' }, headEl, h('div', { class: 'l-kicker' }, 'Build it in Spanish'),
      h('div', { class: 'prompt' }, ES.tpl(q.en)),
      h('div', { class: 'build-line' }, st.picked.length ? st.picked.map((pi, k) => h('button', { class: 'tok on', disabled: !!a, onclick: () => { st.picked.splice(k, 1); ES.render(); } }, st.pool[pi].w)) : h('span', { class: 'muted small' }, 'Tap the words in order')),
      h('div', { class: 'build-pool' }, st.pool.map((t, pi) => st.picked.includes(pi) ? h('span', { class: 'tok ghost' }, t.w) : h('button', { class: 'tok', disabled: !!a, onclick: () => { st.picked.push(pi); ES.render(); } }, t.w))),
      a ? [h('div', { class: 'verdict ' + (a.right ? 'ok' : 'bad') }, h('b', {}, a.right ? '✓ Perfect' : '✗ Not quite'), h('div', { class: 'want' }, ES.sp(target))), cont('Next', next)]
        : h('button', { class: 'btn block big', disabled: !st.picked.length, onclick: check }, 'Check'));
  }
  function typeIt(q, headEl) {
    let val = '';
    const want = ES.tpl(q.es);
    const submit = () => {
      if (R.answered) { next(); return; }
      const c = ES.check(val, want);
      R.answered = c; R.typedVal = val; res(c.ok === true); c.ok === true ? rightRule(q.rule) : wrongRule(q.rule); ES.save(); ES.render();
    };
    return h('div', { class: 'run lesson' }, headEl, h('div', { class: 'l-kicker' }, 'Type it in Spanish'),
      h('div', { class: 'prompt' }, ES.tpl(q.en)),
      h('form', { onsubmit: e => { e.preventDefault(); submit(); } },
        h('input', { class: 'answer', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', autocomplete: 'off', placeholder: 'Type the Spanish…', disabled: !!a, value: a ? R.typedVal : '', oninput: e => { val = e.target.value; } }),
        !a ? ES.accentBar() : null,
        a ? h('div', { class: 'verdict ' + (a.ok === true ? 'ok' : a.ok ? 'part' : 'bad') }, h('b', {}, a.ok === true ? '✓ Correct' : a.ok === 'accent' ? '≈ Nearly — watch the accent' : a.ok === 'article' ? '≈ Nearly — include the article' : '✗ Not quite'), a.ok !== true ? h('div', { class: 'want' }, ES.sp(want)) : null) : null,
        h('button', { class: 'btn block big', type: 'submit' }, a ? 'Next' : 'Check')));
  }
  function match(q, headEl) {
    st.left = st.left || shuffle(q.pairs.map((p, i) => i)); st.right = st.right || shuffle(q.pairs.map((p, i) => i));
    st.done = st.done || []; st.sel = st.sel == null ? null : st.sel; st.err = st.err || 0;
    const finished = st.done.length === q.pairs.length;
    const tapL = i => { if (st.done.includes(i)) return; st.sel = i; ES.say(ES.tpl(q.pairs[i][0])); ES.render(); };
    const tapR = i => {
      if (st.done.includes(i) || st.sel == null) return;
      if (st.sel === i) { st.done.push(i); st.sel = null; if (st.done.length === q.pairs.length) res(st.err < 2); }
      else { st.err++; st.flash = i; setTimeout(() => { st.flash = null; ES.render(); }, 350); }
      ES.render();
    };
    return h('div', { class: 'run lesson' }, headEl, h('div', { class: 'l-kicker' }, 'Match the pairs'),
      h('div', { class: 'match' },
        h('div', {}, st.left.map(i => h('button', { class: 'mt' + (st.done.includes(i) ? ' done' : st.sel === i ? ' sel' : ''), onclick: () => tapL(i) }, ES.tpl(q.pairs[i][0])))),
        h('div', {}, st.right.map(i => h('button', { class: 'mt' + (st.done.includes(i) ? ' done' : st.flash === i ? ' bad' : ''), onclick: () => tapR(i) }, q.pairs[i][1])))),
      finished ? cont('Next', next) : null);
  }
};
// Example screens can carry interest tags; pick the one that fits the learner.
function pickVariant(sc) { return sc; }
ES.interestScore = tags => { const mine = S().settings.interests || []; return (tags || []).filter(t => mine.includes(t)).length; };

/* =================== PATH (the road) =================== */
ES.views.path = function (app) {
  const units = ES.units(), cur = ES.currentUnit();
  const lv = ES.pathLevel = ES.pathLevel || cur.level;
  const L = C().levels;
  ES.fill(app,
    h('h1', {}, 'Your road'),
    h('div', { class: 'levels' }, L.map(l => {
      const us = units.filter(u => u.level === l.id), d = us.filter(u => ES.unitStatus(u) === 'done').length;
      return h('button', { class: 'lvl' + (l.id === lv ? ' on' : ''), onclick: () => { ES.pathLevel = l.id; ES.render(); } }, h('b', {}, l.id), h('span', {}, l.name), h('i', {}, d + '/' + us.length));
    })),
    h('p', { class: 'small muted' }, (L.find(l => l.id === lv) || {}).sub),
    units.filter(u => u.level === lv).map(u => unitCard(u, u === cur)));
};
function lanesRow(u, big) {
  return h('div', { class: 'road' + (big ? ' big' : '') }, (u.lessons || []).map((l, i) => [
    i ? h('span', { class: 'rl-line' + (ES.lessonDone(l.id) ? ' done' : '') }) : null,
    h('span', { class: 'node' + (ES.lessonDone(l.id) ? ' done' : (ES.nextLesson().l || {}).id === l.id ? ' cur' : ''), title: l.title }, (C().lanes[l.lane] || ['•'])[0])]));
}
function unitCard(u, isCur) {
  const st = ES.unitStatus(u), open = ES.unitUnlocked(u);
  const n = (u.lessons || []).filter(l => ES.lessonDone(l.id)).length;
  return h('a', { class: 'ucard' + (isCur ? ' cur' : '') + (open ? '' : ' locked'), href: '#unit/' + u.id },
    h('div', { class: 'uc-top' }, h('span', { class: 'uc-n' }, u.n), h('div', { class: 'grow' }, h('div', { class: 'uc-t' }, u.title), h('div', { class: 'uc-p' }, u.place)),
      h('span', { class: 'uc-s' }, st === 'done' ? '✓' : !open ? '🔒' : st === 'unwritten' ? '✨' : n + '/' + u.lessons.length)),
    isCur && u.lessons ? [lanesRow(u), h('div', { class: 'lane-labels' }, u.lessons.map(l => h('span', {}, (C().lanes[l.lane] || ['', ''])[1])))] : null,
    isCur && !u.lessons ? h('div', { class: 'small', style: 'margin-top:8px;color:var(--red);font-weight:700' }, 'Ready to be written for you ›') : null);
}

ES.views.unit = function (app, id) {
  const u = ES.unit(id); if (!u) { location.hash = '#path'; return; }
  const open = ES.unitUnlocked(u), nl = ES.nextLesson();
  ES.fill(app,
    h('a', { class: 'back', href: '#path' }, '‹ Your road'),
    h('div', { class: 'brand' }, u.level + ' · Unit ' + u.n),
    h('h1', {}, u.title),
    h('div', { class: 'u-place' }, '📍 ' + u.place),
    h('div', { class: 'can' }, h('b', {}, 'By the end you can'), h('ul', {}, u.can.map(c => h('li', {}, c)))),
    !open ? h('p', { class: 'small muted' }, '🔒 Opens when you finish the unit before. You can still peek.') : null,
    u.lessons ? h('div', { class: 'journey' }, u.lessons.map((l, i) => {
      const done = ES.lessonDone(l.id), cur = nl.l && nl.l.id === l.id, lane = C().lanes[l.lane] || ['•', ''];
      const d = P().done[l.id];
      return h('div', { class: 'jn ' + (i % 2 ? 'right' : 'left') + (done ? ' done' : '') + (cur ? ' cur' : ''), onclick: () => ES.startLesson(l.id) },
        h('div', { class: 'jn-dot' }, done ? '✓' : lane[0]),
        h('div', { class: 'jn-card' }, h('div', { class: 'jn-lane' }, lane[1] + ' · ' + l.mins + ' min'), h('div', { class: 'jn-t' }, ES.tpl(l.title)),
          d && d.total ? h('div', { class: 'jn-s' }, d.score + '/' + d.total) : cur ? h('div', { class: 'jn-s jn-go' }, 'Start ›') : null));
    })) : writeBox(u),
    (u.rules || []).filter(r => ES.rule(r)).length ? [h('h2', {}, 'Rule cards in this unit'), h('div', { class: 'list' }, u.rules.map(ES.rule).filter(Boolean).map(r => h('a', { class: 'item', href: '#rule/' + r.id }, h('div', { class: 'grow' }, h('div', { class: 't' }, r.title), h('div', { class: 'sub' }, r.sum)), h('span', { class: 'chev' }, '›'))))] : null,
    u.grammar && !u.lessons ? [h('h2', {}, 'What it covers'), h('div', { class: 'list', style: 'padding:12px 14px' }, h('p', {}, h('b', {}, 'Grammar: '), u.grammar), h('p', {}, h('b', {}, 'Words: '), u.words))] : null);
};
function writeBox(u) {
  return h('div', { class: 'card alert' }, h('b', {}, '✨ This unit gets written for you'),
    h('p', { class: 'small' }, 'When you reach it, Claude writes all six lessons using what you\'ve learned so far, the topics you found hard, and your interests — so it builds on you, not a textbook.'),
    h('button', { class: 'btn block', onclick: () => ES.writeUnit(u) }, 'Ask Claude to write Unit ' + u.n));
}
ES.startLesson = id => {
  const f = ES.lessonById(id); if (!f) return;
  ES.run = { mode: 'lesson', o: { lesson: id }, steps: ES.lessonSteps(id, 'new'), i: 0, results: [], flipped: false, answered: null, again: {}, dirs: {} };
  ES.closeAll(); location.hash = '#run'; ES.render();
};

/* =================== ASK CLAUDE TO WRITE A UNIT (adaptive) =================== */
ES.unitPrompt = u => {
  const s = S(), units = ES.units();
  const done = units.filter(x => x.lessons && ES.unitStatus(x) !== 'new').map(x => {
    const chk = (x.lessons.find(l => l.lane === 'check') || {}).id; const d = chk && P().done[chk];
    return 'Unit ' + x.n + ' ' + x.title + (d ? ' (check ' + d.score + '/' + d.total + ')' : '');
  });
  const weakRules = ES.state.rules.filter(r => { const q = s.quizStats[r.id]; return q && q.w && ES.ruleScore(r.id) < 0.75; }).map(r => r.id + ' (' + Math.round(100 * ES.ruleScore(r.id)) + '% right)');
  const missed = ES.mistakeList().filter(([, m]) => m.kind === 'item').slice(0, 25).map(([id]) => ES.item(id).es);
  const known = Object.keys(s.srs).map(ES.item).filter(Boolean).map(x => x.es).slice(0, 250);
  const interests = (s.settings.interests || []).map(k => (C().interests.find(i => i[0] === k) || [k, k])[1].replace(/^\S+\s/, '')).concat(s.settings.interestsText ? [s.settings.interestsText] : []);
  return [
    'Write the next unit of my Spanish course app. I\'m an English speaker learning Spain Spanish from zero, structure-first (I want to understand WHY, so I can build my own sentences). Keep explanations short, plain and friendly.',
    '',
    'UNIT TO WRITE: Unit ' + u.n + ' (' + u.level + ') "' + u.title + '" — situation: ' + u.place + '. Learner can afterwards: ' + u.can.join('; ') + '. Grammar: ' + u.grammar + '. Words: ' + u.words + '.',
    '',
    'ABOUT ME',
    '- Done so far: ' + (done.join('; ') || 'nothing yet'),
    '- Topics I find hard (bring them back inside this unit where they fit): ' + (weakRules.join(', ') || 'none yet'),
    '- Words I keep missing (reuse some): ' + (missed.join(', ') || 'none'),
    '- Words I already know (reuse these; introduce about 25–35 new ones): ' + (known.join(', ') || 'very few'),
    '- My interests (make examples, stories and words lean towards these): ' + (interests.join(', ') || 'everyday life'),
    '- Use {name} wherever my name goes.',
    '',
    'FORMAT — reply with ONLY one JSON code block:',
    '{"esUnit":1,"unit":{"id":"' + u.id + '","rules":["rule ids used"],"lessons":[LESSON x6]},"rules":[optional NEW rule cards],"quiz":[optional quiz questions]}',
    'LESSON = {"id":"' + u.id + '-sounds","lane":"sounds|words|grammar|story|speak|check","title":"…","mins":5,"rules":["…"],"screens":[SCREEN…]} — exactly one lesson per lane in that order; check lesson also has "check":true.',
    'SCREEN types:',
    '{"t":"info","title":"…","body":"…"}  body markup: "## heading", "- bullet", "| a | b |" table rows, "> tip", "= Spanish = English" example line, **bold**, \\n for new lines',
    '{"t":"ex","es":"…","en":"…","parts":[["chunk","role (verb/pronoun/noun/question word…)","why"]]}',
    '{"t":"words","list":[["Spanish with article","English","optional note"]]}  — every new word goes in a words screen (they become flashcards)',
    '{"t":"mc","q":"…","o":["…","…"],"a":0,"why":"…","rule":"rule id"}',
    '{"t":"build","en":"…","es":"Spanish sentence","extra":["1–2 wrong words"]}',
    '{"t":"type","en":"…","es":"…","rule":"rule id"}',
    '{"t":"match","pairs":[["es","en"],… 4 pairs]}',
    '{"t":"story","title":"…","lines":[["speaker","Spanish","English"]…6–8 lines],"qs":[mc questions without rule]}',
    '{"t":"speak","en":"…","es":"…","hint":"optional"}',
    '{"t":"tip","body":"…"}',
    'Aim for 8–14 screens per lesson (story and sounds can be shorter). Mix explaining with doing: never more than 2 info screens in a row. Check lesson: 7–9 mixed questions, including 2–3 on my hard topics.',
    'Rule card = {"id":"short-id","week":0,"area":"Verbs","title":"…","sum":"one line","body":"markup as above"}. Existing rule ids you can use: ' + s.rules.map(r => r.id).join(', ') + '.',
    'Quiz question = {"rule":"rule id","q":"…","o":["…"],"a":0,"why":"…"}.'
  ].join('\n');
};
ES.writeUnit = u => {
  let reply = '';
  const msg = h('p', { class: 'small', style: 'font-weight:700' });
  const sh = ES.sheet('Write Unit ' + u.n, h('div', {},
    h('p', { class: 'small muted' }, 'The request includes what you\'ve done, the topics you find hard, words you know and your interests, so this unit builds on you.'),
    h('button', { class: 'btn block', onclick: async () => { const ok = await ES.copy(ES.unitPrompt(u)); if (ok) ES.toast('Copied'); else ES.sheet('Copy this', h('textarea', { class: 'mono tall', value: ES.unitPrompt(u) })); } }, '📋 Copy request for Claude'),
    h('p', { class: 'small muted' }, 'Paste it into a Claude chat, then paste the whole reply here:'),
    h('textarea', { class: 'mono', placeholder: '{"esUnit":1, …}', oninput: e => { reply = e.target.value; } }), msg,
    h('button', { class: 'btn block', onclick: () => { const r = ES.applyUnit(reply, u.id); if (r.error) { msg.textContent = r.error; return; } sh.close(); ES.toast('Unit ' + u.n + ' is ready ✨'); ES.render(); } }, 'Add the unit')));
};
const LANES = ['sounds', 'words', 'grammar', 'story', 'speak', 'check'];
const SCREEN_TYPES = ['info', 'tip', 'ex', 'words', 'mc', 'build', 'type', 'match', 'story', 'speak'];
ES.applyUnit = (text, unitId) => {
  let o;
  try { const a = text.indexOf('{'), b = text.lastIndexOf('}'); o = JSON.parse(text.slice(a, b + 1)); } catch (e) { return { error: 'That isn\'t the JSON reply. Copy the whole code block.' }; }
  if (!o || !o.esUnit || !o.unit || !Array.isArray(o.unit.lessons)) return { error: 'That reply isn\'t a unit for this app.' };
  const lessons = o.unit.lessons.filter(l => l && LANES.includes(l.lane) && Array.isArray(l.screens)).map((l, i) => ({
    id: String(l.id || unitId + '-' + l.lane), lane: l.lane, title: String(l.title || l.lane), mins: Number(l.mins) || 5, rules: l.rules || [], check: l.lane === 'check',
    screens: l.screens.filter(x => x && SCREEN_TYPES.includes(x.t))
  })).filter(l => l.screens.length);
  if (lessons.length < 3) return { error: 'The unit came back incomplete. Ask Claude to send the full JSON again.' };
  const s = S();
  (o.rules || []).forEach(r => { if (r && r.id && r.title && !ES.rule(r.id)) s.rules.push({ id: String(r.id), week: 0, area: r.area || 'Extra', title: r.title, sum: r.sum || '', body: r.body || '' }); });
  (o.quiz || []).forEach(q => { if (q && q.rule && Array.isArray(q.o) && q.o[q.a] != null) s.quiz.push({ id: 'q' + ES.uid(), rule: q.rule, q: q.q, o: q.o, a: q.a, why: q.why || '' }); });
  s.customUnits = s.customUnits || {};
  s.customUnits[unitId] = { lessons, rules: (o.unit.rules || []).filter(r => ES.rule(r)) };
  ES.save();
  return { ok: true };
};

/* =================== TODAY'S SESSION (warm-up → new → practise → check) =================== */
const SIZES = { quick: { warm: 6, fix: 2, lessons: 1, quiz: 3, type: 2, label: 'Quick', mins: 10 }, normal: { warm: 12, fix: 3, lessons: 1, quiz: 5, type: 4, label: 'Normal', mins: 20 }, long: { warm: 25, fix: 5, lessons: 2, quiz: 8, type: 6, label: 'Long', mins: 40 } };
ES.SIZES = SIZES;
const segsDone = () => { const L = S().log[ES.today()] || {}; return L.segs || {}; };
ES.segDone = seg => { const L = S().log, t = ES.today(); L[t] = L[t] || {}; L[t].segs = L[t].segs || {}; L[t].segs[seg] = true; ES.save(); };
const quizFor = ruleId => { const qs = S().quiz.filter(q => q.rule === ruleId); return qs.length ? qs[Math.floor(Math.random() * qs.length)].id : null; };
// Mistakes tied to what you're learning now, plus anything missed yesterday.
ES.topicMistakes = () => {
  const live = new Set(ES.liveRules()), y = ES.addDays(ES.today(), -1);
  return ES.mistakeList().filter(([id, m]) => (m.kind === 'rule' && live.has(id)) || m.last >= y);
};
function buildSession(size) {
  const z = SIZES[size] || SIZES.normal, done = segsDone(), steps = [];
  if (!done.warm) {
    const fix = ES.topicMistakes().slice(0, z.fix).map(([id, m]) => m.kind === 'rule' ? (quizFor(id) ? { k: 'quiz', id: quizFor(id), fix: true } : null) : { k: 'card', id, fix: true, dir: 'en' }).filter(Boolean);
    const seen = new Set(fix.map(x => x.id));
    const cards = ES.dueIds().filter(id => !seen.has(id)).concat(ES.newIds(Math.min(ES.newLeft(), 5))).slice(0, z.warm).map(id => ({ k: 'card', id }));
    fix.concat(cards).forEach(x => steps.push(Object.assign(x, { seg: 'warm' })));
    if (!fix.length && !cards.length) ES.segDone('warm');
  }
  if (!done.new) {
    const u = ES.currentUnit();
    const todo = (u.lessons || []).filter(l => !ES.lessonDone(l.id)).slice(0, z.lessons);
    todo.forEach(l => ES.lessonSteps(l.id, 'new').forEach(x => steps.push(x)));
  }
  if (!done.practise) {
    const rules = ES.doneRules().concat(ES.liveRules());
    const pool = S().quiz.filter(q => rules.includes(q.rule));
    const qs = []; let last = null;
    for (const q of shuffle(pool)) { if (qs.length >= z.quiz) break; if (q.rule === last) continue; qs.push(q.id); last = q.rule; }
    qs.forEach(id => steps.push({ k: 'quiz', id, seg: 'practise' }));
  }
  if (!done.check) {
    const recent = Object.entries(S().srs).filter(([id, c]) => ES.word(id) && c.reps <= 2).map(([id]) => id);
    const chk = shuffle(recent).slice(0, z.type).map(id => ({ k: 'type', id, seg: 'check', dir: 'en' }));
    if (!chk.length) ES.liveRules().map(quizFor).filter(Boolean).slice(0, 2).forEach(id => chk.push({ k: 'quiz', id, seg: 'check' }));
    if (chk.length) chk.forEach(x => steps.push(x)); else ES.segDone('check');
  }
  return steps;
}
ES.todayPlan = size => {
  const z = SIZES[size] || SIZES.normal, done = segsDone(), nl = ES.nextLesson();
  return [
    { seg: 'warm', label: 'Warm-up', done: !!done.warm || !(ES.dueIds().length + ES.topicMistakes().length + ES.newIds(1).length), what: [ES.dueIds().length ? Math.min(z.warm, ES.dueIds().length) + ' cards' : '', ES.topicMistakes().length ? Math.min(z.fix, ES.topicMistakes().length) + ' mistakes to fix' : ''].filter(Boolean).join(' + ') || 'a few cards' },
    { seg: 'new', label: 'New', done: !!done.new || !nl.l, what: nl.l ? 'Unit ' + nl.u.n + ' · ' + ES.tpl(nl.l.title) : nl.needsWriting ? 'Unit ' + nl.u.n + ' needs writing' : 'All written lessons done' },
    { seg: 'practise', label: 'Practise', done: !!done.practise, what: z.quiz + ' rule questions' },
    { seg: 'check', label: 'Check', done: !!done.check, what: 'recall today\'s words' }
  ];
};
ES.startToday = size => {
  const steps = buildSession(size);
  if (!steps.length) {
    const nl = ES.nextLesson();
    if (nl.needsWriting) { location.hash = '#unit/' + nl.u.id; return; }
    ['warm', 'new', 'practise', 'check'].forEach(ES.segDone); ES.toast('¡Hecho! Done for today 🎉'); ES.render(); return;
  }
  ES.run = { mode: 'today', o: { size }, steps, i: 0, results: [], flipped: false, answered: null, again: {}, dirs: {} };
  ES.closeAll(); location.hash = '#run'; ES.render();
};
})();
