(function () {
'use strict';
const ES = window.ES, h = ES.h, S = () => ES.state;
const back = (href, label) => h('a', { class: 'back', href }, '‹ ' + label);
const tagIcons = t => (t || []).filter(x => ES.TAGS[x]).map(x => h('span', { class: 'ti', title: ES.TAGS[x][1] }, ES.TAGS[x][0]));
const empty = text => h('div', { class: 'empty' }, text);

/* =================== TODAY (Hoy) — one button + four tiles =================== */
ES.views.today = function (app) {
  const s = S();
  const fix = ES.mistakeList().length, due = ES.dueIds().length, fresh = ES.newIds(ES.newLeft()).length;
  const inbox = ES.inbox().length, wk = s.weeks.find(w => w.n === s.week.current) || s.weeks[0], wp = weekProgress(wk);
  const streak = ES.streak(), doneToday = (s.log[ES.today()] || {}).cards || 0;
  const todo = Math.min(fix, 8) + due + fresh;
  const parts = [fix ? Math.min(fix, 8) + ' to fix' : null, due ? due + ' due' : null, fresh ? fresh + ' new' : null].filter(Boolean);
  const tile = (num, label, href, onclick, accent) => h(href ? 'a' : 'button', { class: 'tile' + (accent ? ' accent' : ''), href, onclick },
    h('span', { class: 't-num' }, num), h('span', { class: 't-lab' }, label));
  const d = new Date();
  ES.fill(app,
    h('div', { class: 'top' },
      h('div', { class: 'grow' }, h('div', { class: 'brand' }, h('span', { class: 'flag' }), d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })),
        h('h1', {}, s.settings.name ? 'Hoy, ' + s.settings.name : 'Hoy')),
      h('button', { class: 'icon-btn', onclick: ES.settings, 'aria-label': 'Settings' }, '⚙')),
    todo ? h('button', { class: 'go', onclick: () => ES.start('today') },
        h('span', { class: 'go-t' }, doneToday ? 'Carry on today\'s session' : 'Start today\'s session'),
        h('span', { class: 'go-s' }, parts.join(' · ') + ' · about ' + Math.max(2, Math.round(todo * 0.25)) + ' min'),
        h('span', { class: 'go-arrow' }, '▶'))
      : h('div', { class: 'go done' }, h('span', { class: 'go-t' }, '✓ Done for today'), h('span', { class: 'go-s' }, 'Anything extra is a bonus'),
        h('button', { class: 'btn ghost small', style: 'margin-top:10px', onclick: ES.deckPicker }, 'Practise more')),
    h('div', { class: 'tiles' },
      tile(fix, 'Mistakes to fix', '#mistakes', null, fix > 0),
      tile(due + fresh, 'Cards', null, ES.deckPicker),
      tile(inbox, 'Want to know', '#library/inbox', null, inbox > 0),
      h('a', { class: 'tile', href: '#week/' + wk.n }, h('span', { class: 't-num' }, 'W' + wk.n), h('span', { class: 't-lab' }, 'This week · ' + Math.round(wp.pct * 100) + '%'))),
    h('p', { class: 'foot' }, '🔥 ' + streak + (streak === 1 ? ' day' : ' days') + '  ·  ' + ES.known() + ' known  ·  ' + s.words.length + ' words'));
};
function scoreLine(id) {
  const q = S().quizStats[id] || {};
  const n = (q.r || 0) + (q.w || 0);
  return q.flag && !q.r ? 'Flagged in your Notion log' : n ? Math.round(100 * (q.r || 0) / n) + '% right over ' + n + ' answers' : '';
}
const progress = p => h('div', { class: 'bar' }, h('i', { style: 'width:' + Math.round(100 * p.pct) + '%' }));
function weekPill(n) {
  const w = S().week;
  if (w.done[n]) return ['✓ Done', 'ok'];
  if (n === w.current) return [(w.plan || {})[n] === 'review' ? 'Reviewing now' : 'Learning now', 'red'];
  if ((w.plan || {})[n] === 'review') return ['Review', 'warn'];
  return n < w.current ? ['Open', ''] : ['Later', ''];
}
function weekProgress(wk) {
  const rv = S().week.reviewed[wk.n] || {};
  const n = wk.topics.filter((t, i) => rv[i]).length;
  return { pct: n / Math.max(1, wk.topics.length), label: n + ' of ' + wk.topics.length + ' topics ticked off' };
}

/* =================== PATH =================== */
ES.views.path = function (app) {
  const s = S();
  ES.fill(app,
    h('h1', {}, 'Your path'),
    h('p', { class: 'muted small' }, 'Hugo\'s Spanish in 3 Months, one week at a time. Weeks stay open until they\'re solid. You\'re restarting with a review of Weeks 1–3; Week 4 onwards is new.'),
    h('details', { class: 'how' },
      h('summary', {}, 'How each week works'),
      h('ol', { class: 'flow' },
        h('li', {}, h('b', {}, 'Read the rule cards'), ' — short decision rules, not lists'),
        h('li', {}, h('b', {}, 'Quiz the rules'), ' — mixed questions beat one topic at a time'),
        h('li', {}, h('b', {}, 'Use them'), ' — your own sentences and phrases, broken down'),
        h('li', {}, h('b', {}, 'Let flashcards bring it back'), ' — spaced over days and weeks'),
        h('li', {}, h('b', {}, 'Tick topics off'), ' and mark the week done'))),
    s.weeks.map(wk => {
      const p = weekPill(wk.n), wp = weekProgress(wk);
      return h('a', { class: 'card tap week-row' + (wk.n === s.week.current ? ' now' : ''), href: '#week/' + wk.n },
        h('div', { class: 'wk-n' }, wk.n),
        h('div', { class: 'grow' }, h('div', { class: 't' }, wk.title), progress(wp)),
        h('span', { class: 'pill ' + p[1] }, p[0]));
    }),
    h('h2', {}, 'Extra'),
    h('a', { class: 'card tap', href: '#rule/glossary' }, h('b', {}, '📘 Grammar words glossary'), h('div', { class: 'small muted' }, 'Infinitive, conjugation, stem change…')));
};

ES.views.week = function (app, n) {
  const s = S(), wk = s.weeks.find(w => w.n === Number(n));
  if (!wk) { location.hash = '#path'; return; }
  const rv = s.week.reviewed[wk.n] = s.week.reviewed[wk.n] || {};
  const rules = wk.rules.map(ES.rule).filter(Boolean);
  const qs = s.quiz.filter(q => wk.rules.includes(q.rule));
  const ICON = { solid: ['⚓', 'Already solid'], taught: ['🟡', 'Taught — needs practice'], new: ['🆕', 'New'] };
  const phrases = s.sentences.filter(x => (x.rules || []).some(r => wk.rules.includes(r)));
  ES.fill(app,
    back('#path', 'Path'),
    h('div', { class: 'brand' }, 'Week ' + wk.n), h('h1', {}, wk.title),
    h('span', { class: 'pill ' + weekPill(wk.n)[1] }, weekPill(wk.n)[0]),
    h('h2', {}, '1 · Rule cards'),
    rules.length ? rules.map(r => h('a', { class: 'card tap', href: '#rule/' + r.id }, h('div', { class: 't' }, r.title), h('div', { class: 'small muted' }, r.sum)))
      : empty('Rule cards for this week get added when you reach it (Claude writes them from your book notes).'),
    h('h2', {}, '2 · Quiz the rules'),
    qs.length ? h('button', { class: 'btn block', onclick: () => ES.start('quiz', { week: wk.n }) }, '🧩 Quiz Week ' + wk.n + ' (' + Math.min(qs.length, 12) + ' questions)') : empty('No quiz questions for this week yet.'),
    h('h2', {}, '3 · See it used'),
    phrases.length ? h('div', { class: 'list' }, phrases.slice(0, 8).map(itemRow)) : empty('Sentences you add that use these rules show up here.'),
    h('h2', {}, '4 · Topics'),
    h('div', { class: 'list' }, wk.topics.map((t, i) => h('label', { class: 'item' },
      h('input', { type: 'checkbox', checked: !!rv[i], onchange: e => { rv[i] = e.target.checked; ES.bump('reviewed'); ES.save(); ES.render(); } }),
      h('div', { class: 'grow' }, h('div', { class: 't' }, t.t), h('div', { class: 'sub' }, ICON[t.s][0] + ' ' + ICON[t.s][1]))))),
    h('p', { class: 'small muted' }, 'Tick a topic once you\'ve reviewed it and can explain it in your own words.'),
    s.week.done[wk.n]
      ? h('button', { class: 'btn ghost block', onclick: () => { delete s.week.done[wk.n]; ES.save(); ES.render(); } }, 'Reopen this week')
      : h('button', { class: 'btn block', onclick: () => ES.confirm('Mark Week ' + wk.n + ' as done and move on to Week ' + (wk.n + 1) + '? Its words and rules keep coming back in flashcards and quizzes.', () => {
          s.week.done[wk.n] = true; if (s.week.current === wk.n && wk.n < 13) s.week.current = wk.n + 1; ES.save(); location.hash = '#path'; ES.toast('Week ' + wk.n + ' done 🎉');
        }, 'Mark done') }, '✓ Mark Week ' + wk.n + ' done'),
    wk.n !== s.week.current ? h('button', { class: 'btn ghost block', onclick: () => { s.week.current = wk.n; ES.save(); ES.toast('Week ' + wk.n + ' is now your current week'); ES.render(); } }, 'Make this my current week') : null
  );
};

/* =================== LIBRARY =================== */
const lib = ES.lib = { tab: 'words', kind: 'all', q: '' };
ES.views.library = function (app, sub) {
  if (sub === 'inbox') { lib.tab = 'sent'; lib.kind = 'want'; lib.q = ''; history.replaceState(null, '', '#library'); }
  const s = S();
  const results = h('div', {});
  const box = h('input', { class: 'search', type: 'search', placeholder: 'Find a word, phrase or rule…', value: lib.q, autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false',
    oninput: e => { lib.q = e.target.value; drawResults(); } });
  function drawResults() {
    if (!lib.q.trim()) { ES.fill(results, browse()); return; }
    const hits = ES.search(lib.q);
    ES.fill(results, hits.length ? h('div', { class: 'list' }, hits.map(x => x.type === 'r' ? ruleRow(ES.rule(x.id)) : itemRow(ES.item(x.id))))
      : h('div', {}, empty('Nothing yet for "' + lib.q + '".'), h('button', { class: 'btn block', onclick: () => ES.quickAdd(lib.q) }, '＋ Add "' + lib.q + '"')));
  }
  function browse() {
    if (lib.tab === 'words') return [
      h('div', { class: 'folders' }, s.folders.map(f => h('a', { class: 'folder', href: '#folder/' + f.id },
        h('div', { class: 'f-icon' }, f.icon || '📁'), h('div', { class: 'f-name' }, f.name), h('div', { class: 'f-count' }, ES.inFolder(f.id).length)))),
      h('button', { class: 'btn ghost block', onclick: ES.newFolder }, '＋ New folder'),
      unsorted().length ? h('a', { class: 'card tap', href: '#folder/_none', style: 'margin-top:10px' }, h('b', {}, '📥 Not in a folder yet'), ' ', h('span', { class: 'muted' }, '(' + unsorted().length + ')')) : null];
    if (lib.tab === 'sent') {
      const kinds = [['all', 'All'], ['want', '❓ Want to know'], ['heard', '🎧 Heard'], ['phrase', '💬 Phrases'], ['work', '🏨 Work'], ['lyric', '🎵 Lyrics']];
      let list = s.sentences.slice().reverse();
      if (lib.kind === 'want') list = ES.inbox(); else if (lib.kind !== 'all') list = list.filter(x => x.kind === lib.kind);
      return [h('div', { class: 'chips' }, kinds.map(([k, l]) => h('span', { class: 'chip' + (lib.kind === k ? ' on' : ''), onclick: () => { lib.kind = k; ES.render(); } }, l))),
        lib.kind === 'want' ? ES.inboxPanel() : null,
        list.length ? h('div', { class: 'list' }, list.map(itemRow)) : empty(lib.kind === 'want' ? 'Nothing waiting. Anything you add without a meaning lands here.' : lib.kind === 'lyric' ? 'Add lyric lines you hear with ＋ → Lyric.' : 'Nothing here yet.')];
    }
    const areas = [...new Set(s.rules.map(r => r.area))];
    return areas.map(a => [h('h2', {}, a), h('div', { class: 'list' }, s.rules.filter(r => r.area === a).map(ruleRow))]);
  }
  ES.fill(app,
    h('h1', {}, 'Library'),
    box,
    ES.seg([['words', 'Words'], ['sent', 'Sentences'], ['rules', 'Rules']], lib.tab, v => { lib.tab = v; if (v === 'sent' && lib.kind === 'want' && !ES.inbox().length) lib.kind = 'all'; ES.render(); }),
    results);
  drawResults();
};
const unsorted = () => S().words.filter(w => !(w.f || []).length);

ES.views.folder = function (app, id) {
  const f = id === '_none' ? { id: '_none', name: 'Not in a folder yet', icon: '📥' } : ES.folder(id);
  if (!f) { location.hash = '#library'; return; }
  const words = id === '_none' ? unsorted() : ES.inFolder(id);
  ES.fill(app,
    back('#library', 'Library'),
    h('div', { class: 'top' }, h('h1', {}, f.icon + ' ' + f.name),
      id !== '_none' ? h('button', { class: 'icon-btn', onclick: () => ES.folderSheet(f) }, '✎') : null),
    words.length ? h('div', { class: 'grid2', style: 'margin-bottom:12px' },
      h('button', { class: 'btn small', onclick: () => ES.start('cards', { ids: words.map(w => w.id), title: f.name }) }, '🃏 Flashcards'),
      h('button', { class: 'btn ghost small', onclick: () => ES.start('type', { ids: words.map(w => w.id), dir: 'en', n: 15, title: f.name }) }, '⌨️ Type it')) : null,
    words.length ? h('div', { class: 'list' }, words.map(itemRow)) : empty('No words here yet. Add one with ＋.'));
};

const itemRow = x => {
  if (!x) return null;
  const isW = !!x.f || x.id[0] === 'w';
  return h('div', { class: 'item tap', onclick: () => isW ? ES.wordSheet(x.id) : (location.hash = '#s/' + x.id) },
    h('div', { class: 'grow' }, h('div', { class: 't es' }, x.es),
      h('div', { class: 'sub' }, x.want && !x.en ? '❓ waiting for a meaning' : x.en, !isW && ES.KINDS[x.kind] ? '  · ' + ES.KINDS[x.kind][0] : '')),
    h('span', { class: 'chev' }, '›'));
};
const ruleRow = r => r && h('a', { class: 'item', href: '#rule/' + r.id }, h('div', { class: 'grow' }, h('div', { class: 't' }, r.title), h('div', { class: 'sub' }, r.sum)), h('span', { class: 'chev' }, '›'));
ES.itemRow = itemRow;

/* =================== WORD SHEET =================== */
ES.wordSheet = function (id) {
  const w = ES.word(id); if (!w) return;
  const c = S().srs[w.id];
  const sh = ES.sheet('Word', h('div', {},
    h('div', { class: 'big-es' }, w.es), h('div', { class: 'big-en' }, w.en || '❓ No meaning yet'),
    h('div', {}, tagIcons(w.t).map(t => h('span', { class: 'pill' }, t, ' ', t.title)), (w.f || []).map(fid => ES.folder(fid) ? h('a', { class: 'pill', href: '#folder/' + fid, onclick: () => sh.close() }, ES.folder(fid).name) : null)),
    w.ex ? h('div', { class: 'ex' }, h('div', { class: 'ex-es' }, w.ex), w.exEn ? h('div', { class: 'ex-en' }, w.exEn) : null) : null,
    w.note ? h('div', { class: 'tip' }, w.note) : null,
    w.src ? h('p', { class: 'small muted' }, 'Source: ' + w.src) : null,
    h('p', { class: 'small muted' }, c ? (c.reps >= 2 ? '✓ Known · next flashcard ' + ES.inDays(c.due) : 'Learning · next flashcard ' + ES.inDays(c.due)) : 'Not in your flashcards yet — it\'ll come up as a new card.'),
    h('div', { class: 'grid2' },
      h('button', { class: 'btn small', onclick: () => { sh.close(); ES.editWord(w); } }, '✎ Edit'),
      h('button', { class: 'btn ghost small', onclick: () => { w.want = true; ES.save(); sh.close(); ES.toast('Added to Want to know'); ES.render(); } }, '❓ Ask Claude')),
    h('button', { class: 'btn ghost small block', onclick: () => { w.t = (w.t || []).includes('stuck') ? w.t.filter(x => x !== 'stuck') : (w.t || []).concat('stuck'); ES.save(); sh.close(); ES.render(); } }, (w.t || []).includes('stuck') ? 'Remove from stuck list' : '🧩 Add to stuck list')));
};

ES.editWord = function (w) {
  const isNew = !w; w = w ? Object.assign({}, w) : { es: '', en: '', f: [], t: [] };
  const sh = ES.sheet(isNew ? 'New word' : 'Edit word', h('div', {},
    ES.field('Spanish', h('input', { value: w.es, autocapitalize: 'off', oninput: e => { w.es = e.target.value; } })),
    ES.field('English', h('input', { value: w.en || '', oninput: e => { w.en = e.target.value; } })),
    ES.field('Folders', ES.chips(S().folders.map(f => [f.id, f.name]), w.f, v => { w.f = v || []; }, true)),
    ES.field('Example (Spanish)', h('input', { value: w.ex || '', oninput: e => { w.ex = e.target.value; } })),
    ES.field('Example (English)', h('input', { value: w.exEn || '', oninput: e => { w.exEn = e.target.value; } })),
    ES.field('Memory trick / note', h('textarea', { value: w.note || '', oninput: e => { w.note = e.target.value; } })),
    h('button', { class: 'btn block', onclick: () => {
      if (!w.es.trim()) { ES.toast('Type the Spanish'); return; }
      if (isNew) { w.id = 'w' + ES.uid(); w.added = ES.today(); S().words.push(w); ES.bump('added'); }
      else Object.assign(ES.word(w.id), w);
      if (w.en && w.en.trim()) { const real = ES.word(w.id); real.want = false; }
      ES.save(); sh.close(); ES.render(); ES.toast('Saved');
    } }, 'Save'),
    isNew ? null : h('button', { class: 'btn danger block', onclick: () => ES.confirm('Delete "' + w.es + '"?', () => { S().words = S().words.filter(x => x.id !== w.id); delete S().srs[w.id]; ES.save(); sh.close(); ES.render(); }, 'Delete') }, 'Delete word')));
};

ES.newFolder = () => ES.folderSheet(null);
ES.folderSheet = function (f) {
  const isNew = !f; const d = { name: f ? f.name : '', icon: f ? f.icon : '📁' };
  const sh = ES.sheet(isNew ? 'New folder' : 'Folder', h('div', {},
    ES.field('Name', h('input', { value: d.name, placeholder: 'e.g. Food & drink', oninput: e => { d.name = e.target.value; } })),
    ES.field('Icon (one emoji)', h('input', { value: d.icon, oninput: e => { d.icon = e.target.value.trim() || '📁'; } })),
    h('button', { class: 'btn block', onclick: () => {
      if (!d.name.trim()) return;
      if (isNew) S().folders.push({ id: 'f' + ES.uid(), name: d.name.trim(), icon: d.icon }); else Object.assign(f, { name: d.name.trim(), icon: d.icon });
      ES.save(); sh.close(); ES.render();
    } }, 'Save'),
    isNew ? null : h('button', { class: 'btn danger block', onclick: () => ES.confirm('Delete the folder "' + f.name + '"? The words stay in your library.', () => {
      S().folders = S().folders.filter(x => x.id !== f.id); S().words.forEach(w => { w.f = (w.f || []).filter(x => x !== f.id); });
      ES.save(); sh.close(); location.hash = '#library';
    }, 'Delete') }, 'Delete folder')));
};

/* =================== SENTENCE PAGE =================== */
ES.views.s = function (app, id) {
  const x = ES.sent(id); if (!x) { location.hash = '#library'; return; }
  const c = S().srs[x.id];
  ES.fill(app,
    back('#library', 'Library'),
    h('div', { class: 'brand' }, (ES.KINDS[x.kind] || ['💬', 'Sentence'])[0] + ' ' + (ES.KINDS[x.kind] || ['', 'Sentence'])[1] + (x.song ? ' · ' + x.song : '') + (x.src && x.src !== 'Notion' ? ' · ' + x.src : '')),
    h('div', { class: 'sent-es' }, x.es),
    h('div', { class: 'sent-en' }, x.en || '❓ Waiting for a translation'),
    x.want ? h('div', { class: 'card alert' }, h('b', {}, '❓ In your Want to know list'), h('div', { class: 'small' }, 'Claude will add the translation and the breakdown.'),
      h('button', { class: 'btn small block', onclick: () => ES.askClaude() }, 'Ask Claude now')) : null,
    h('h2', {}, 'How it\'s built'),
    (x.parts || []).length ? h('div', { class: 'card parts' }, x.parts.map(p => h('div', { class: 'part' },
      h('div', { class: 'p-w' }, p[0]), h('div', { class: 'p-r' }, p[1]), p[2] ? h('div', { class: 'p-y' }, p[2]) : null)))
      : h('div', {}, empty('No breakdown yet.'), x.want ? null : h('button', { class: 'btn ghost block', onclick: () => { x.want = true; ES.save(); ES.render(); ES.toast('Added to Want to know'); } }, '❓ Ask Claude for a breakdown')),
    x.pattern ? [h('h2', {}, 'Reuse the pattern'), h('div', { class: 'tip' }, x.pattern)] : null,
    (x.rules || []).length ? [h('h2', {}, 'Rules in this sentence'), h('div', { class: 'list' }, x.rules.map(ES.rule).map(ruleRow))] : null,
    h('p', { class: 'small muted', style: 'margin-top:16px' }, c ? 'In your flashcards · next ' + ES.inDays(c.due) : x.en ? 'Will come up as a new flashcard.' : ''),
    h('div', { class: 'grid2' },
      h('button', { class: 'btn small', onclick: () => ES.editSentence(x) }, '✎ Edit'),
      h('button', { class: 'btn ghost small', onclick: () => ES.confirm('Delete this sentence?', () => { S().sentences = S().sentences.filter(y => y.id !== x.id); delete S().srs[x.id]; ES.save(); history.back(); }, 'Delete') }, 'Delete')));
};

ES.editSentence = function (x) {
  const d = Object.assign({}, x);
  let partsText = (x.parts || []).map(p => p.join(' | ')).join('\n');
  const sh = ES.sheet('Edit sentence', h('div', {},
    ES.field('Spanish', h('textarea', { value: d.es, oninput: e => { d.es = e.target.value; } })),
    ES.field('English', h('textarea', { value: d.en || '', oninput: e => { d.en = e.target.value; } })),
    ES.field('Type', ES.chips(Object.entries(ES.KINDS).map(([k, v]) => [k, v[0] + ' ' + v[1]]), d.kind, v => { d.kind = v || 'phrase'; })),
    d.kind === 'lyric' || x.song ? ES.field('Song', h('input', { value: d.song || '', oninput: e => { d.song = e.target.value; } })) : null,
    ES.field('How it\'s built — one line per piece: word | role | why', h('textarea', { class: 'mono', value: partsText, placeholder: 'Me | object pronoun | the feeling happens to me', oninput: e => { partsText = e.target.value; } })),
    ES.field('Reuse the pattern', h('textarea', { value: d.pattern || '', oninput: e => { d.pattern = e.target.value; } })),
    ES.field('Rules used', ES.chips(S().rules.map(r => [r.id, r.title]), d.rules || [], v => { d.rules = v || []; }, true)),
    h('button', { class: 'btn block', onclick: () => {
      d.parts = partsText.split('\n').map(l => l.split('|').map(p => p.trim())).filter(p => p[0]);
      if (d.en && d.en.trim() && d.parts.length) d.want = false;
      Object.assign(x, d); ES.save(); sh.close(); ES.render(); ES.toast('Saved');
    } }, 'Save')));
};

/* =================== RULE PAGE =================== */
ES.views.rule = function (app, id) {
  const r = ES.rule(id); if (!r) { location.hash = '#library'; return; }
  const qs = S().quiz.filter(q => q.rule === r.id);
  const used = S().sentences.filter(x => (x.rules || []).includes(r.id));
  const wk = S().weeks.find(w => w.n === r.week);
  ES.fill(app,
    h('a', { class: 'back', href: 'javascript:history.back()' }, '‹ Back'),
    h('div', { class: 'brand' }, r.area + (r.week ? ' · Week ' + r.week : '')),
    h('h1', {}, r.title),
    h('div', { class: 'sum' }, r.sum),
    scoreLine(r.id) ? h('p', { class: 'small muted' }, '🧩 ' + scoreLine(r.id)) : null,
    h('div', { class: 'rule-body' }, ES.rich(r.body)),
    qs.length ? h('button', { class: 'btn block', onclick: () => ES.start('quiz', { rule: r.id }) }, '🧩 Quiz me on this (' + qs.length + ')') : null,
    used.length ? [h('h2', {}, 'Your sentences using it'), h('div', { class: 'list' }, used.map(itemRow))] : null,
    h('h2', {}, 'My notes'),
    h('textarea', { placeholder: 'Your own words, examples, things that tripped you up…', value: r.mine || '', onchange: e => { r.mine = e.target.value; ES.save(); ES.toast('Saved'); } }));
};
})();
