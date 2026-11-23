(function () {
'use strict';
const ES = window.ES, h = ES.h, S = () => ES.state;
const SOURCES = ['Podcast', 'Vlog', 'Song', 'Work', 'Friend', 'Book / class', 'Out and about'];

/* =================== QUICK ADD =================== */
ES.quickAdd = function (prefill) {
  const d = { es: prefill || '', en: '', kind: null, folder: null, src: null, song: '', ask: true, askTouched: false };
  const autoKind = () => d.kind || (d.es.trim().split(/\s+/).length <= 2 ? 'word' : 'heard');
  const extra = h('div', {});
  const askBox = h('input', { type: 'checkbox', checked: true, onchange: e => { d.ask = e.target.checked; d.askTouched = true; } });
  const drawExtra = () => {
    const k = autoKind();
    ES.fill(extra,
      k === 'word' ? ES.field('Folder', ES.chips(S().folders.map(f => [f.id, f.icon + ' ' + f.name]), d.folder, v => { d.folder = v; })) : null,
      k === 'lyric' ? ES.field('Song', h('input', { value: d.song, placeholder: 'Song — artist', oninput: e => { d.song = e.target.value; } })) : null);
  };
  const kinds = [['word', '🔤 Word'], ['heard', '🎧 Heard'], ['phrase', '💬 Phrase'], ['lyric', '🎵 Lyric'], ['work', '🏨 Work']];
  const kindChips = h('div', {});
  const drawKinds = () => ES.fill(kindChips, ES.chips(kinds, autoKind(), v => { d.kind = v; drawKinds(); drawExtra(); }));
  const sh = ES.sheet('Add Spanish', h('div', { class: 'qa' },
    h('textarea', { class: 'qa-es', placeholder: 'What did you hear or learn?', autocapitalize: 'sentences', value: d.es, oninput: e => { d.es = e.target.value; if (!d.kind) { drawKinds(); drawExtra(); } } }),
    kindChips,
    ES.field('Meaning (if you know it)', h('input', { placeholder: 'Leave blank and Claude fills it in', oninput: e => { d.en = e.target.value; if (!d.askTouched) { d.ask = !d.en.trim(); askBox.checked = d.ask; } } })),
    extra,
    ES.field('Where from', ES.chips(SOURCES.map(x => [x, x]), d.src, v => { d.src = v; })),
    h('label', { class: 'ask-row' }, askBox, h('div', {}, h('b', {}, '❓ Ask Claude to explain it'), h('div', { class: 'small muted' }, 'Goes to Want to know for a translation and a "how it\'s built" breakdown.'))),
    h('button', { class: 'btn block big', onclick: () => {
      const es = d.es.trim(); if (!es) { ES.toast('Type the Spanish first'); return; }
      const k = autoKind(), t = ES.today();
      const want = d.ask || !d.en.trim();
      if (k === 'word') S().words.push({ id: 'w' + ES.uid(), es, en: d.en.trim(), f: d.folder ? [d.folder] : [], t: d.src ? ['ear'] : [], src: d.src || 'Me', want, added: t });
      else S().sentences.push({ id: 's' + ES.uid(), es, en: d.en.trim(), kind: k, src: d.src || 'Me', song: d.song.trim() || undefined, want, added: t });
      ES.bump('added'); ES.save(); sh.close(); ES.render();
      ES.toast(want ? '❓ Saved to Want to know' : '✓ Saved');
    } }, 'Save')));
  drawKinds(); drawExtra();
  setTimeout(() => { const ta = sh.layer.querySelector('.qa-es'); if (ta) ta.focus(); }, 80);
};

/* =================== WANT TO KNOW → CLAUDE =================== */
ES.inboxPanel = function () {
  const n = ES.inbox().length;
  return n ? h('div', { class: 'card alert' },
    h('b', {}, n + ' waiting'), h('div', { class: 'small' }, 'Copy them for Claude, then paste the reply back. Translations, breakdowns, folders and rule links all fill in at once.'),
    h('button', { class: 'btn block', onclick: ES.askClaude }, '✨ Ask Claude')) : null;
};

ES.claudePrompt = function () {
  const s = S(), items = ES.inbox();
  const list = items.map(x => {
    const isW = !!ES.word(x.id);
    const o = { id: x.id, type: isW ? 'word' : x.kind, es: x.es };
    if (x.en) o.myMeaning = x.en;
    if (x.src && x.src !== 'Me') o.heardIn = x.src;
    if (x.song) o.song = x.song;
    return o;
  });
  const wk = s.weeks.find(w => w.n === s.week.current);
  return [
    'I\'m learning Spanish from English (Hugo\'s "Spanish in 3 Months", currently on Week ' + s.week.current + (wk ? ': ' + wk.title : '') + '). I learn structure-first: I want to understand WHY a sentence works so I can build my own, not just memorise it.',
    '',
    'Below are words and sentences I heard or want to know, from my Spanish app. For each one, fill in what\'s missing. Reply with ONLY one JSON code block in exactly this format:',
    '',
    '{"esFill":1,"items":[{"id":"(same id)","es":"(corrected Spanish, with accents)","en":"(natural English meaning)","folder":"(words only: one folder id from the list)","parts":[["word or chunk","grammar role","why it works, in plain English"]],"pattern":"(how to reuse this pattern with other words)","rules":["(rule ids from the list that it uses)"],"note":"(optional short memory trick or warning)","register":"neutral | casual | vulgar"}]}',
    '',
    'Notes:',
    '- "parts" is for sentences and phrases: split into chunks and explain the grammar that makes each one work. Keep each "why" short and plain.',
    '- If something is beyond my level (past tenses, subjunctive), say so in "why" and suggest learning it as a chunk for now.',
    '- If my spelling was wrong, put the correct Spanish in "es" and mention the fix in "note".',
    '- For song lyrics, only explain the line I gave — don\'t add more lyrics.',
    '- If a sentence needs a rule that isn\'t in my list, you can add "newRules":[{"id":"short-id","week":0,"area":"Verbs","title":"…","sum":"one-line rule","body":"short explanation, - bullets allowed"}] next to "items".',
    '',
    'Folder ids: ' + s.folders.map(f => f.id + ' = ' + f.name).join('; '),
    '',
    'Rule ids: ' + s.rules.map(r => r.id + ' = ' + r.title).join('; '),
    '',
    'Items:',
    JSON.stringify(list, null, 1)
  ].join('\n');
};

ES.askClaude = function () {
  if (!ES.inbox().length) { ES.toast('Nothing waiting'); return; }
  let reply = '';
  const msg = h('p', { class: 'small', style: 'font-weight:700' });
  const sh = ES.sheet('Ask Claude', h('div', {},
    h('div', { class: 'stepper' }, h('b', {}, '1'), h('div', {}, h('b', {}, 'Copy the request'), h('div', { class: 'small muted' }, 'It lists your ' + ES.inbox().length + ' items plus your folders and rules, so Claude files everything in the right place.'))),
    h('button', { class: 'btn block', onclick: async () => { const ok = await ES.copy(ES.claudePrompt()); if (ok) ES.toast('Copied'); else ES.sheet('Copy this', h('textarea', { class: 'mono tall', value: ES.claudePrompt() })); } }, '📋 Copy for Claude'),
    h('div', { class: 'stepper' }, h('b', {}, '2'), h('div', {}, h('b', {}, 'Paste it into a Claude chat'), h('div', { class: 'small muted' }, 'Any chat works. Your Spanish project chat is a good place.'))),
    h('div', { class: 'stepper' }, h('b', {}, '3'), h('div', {}, h('b', {}, 'Paste Claude\'s reply here'))),
    h('textarea', { class: 'mono', placeholder: '{"esFill":1, …}', oninput: e => { reply = e.target.value; } }),
    msg,
    h('button', { class: 'btn block', onclick: () => {
      const r = ES.applyClaude(reply);
      if (r.error) { msg.textContent = r.error; return; }
      sh.close(); ES.render(); ES.toast('✨ Filled in ' + r.n + (r.n === 1 ? ' item' : ' items') + (r.rules ? ' + ' + r.rules + ' new rule' + (r.rules > 1 ? 's' : '') : ''));
    } }, 'Fill them in')));
};

// Accepts {"esFill":1,"items":[…],"newRules":[…]} and also {"esAdd":1,"words":[…],"sentences":[…],"rules":[…]} for adding new material.
ES.applyClaude = function (text) {
  const s = S();
  let o;
  try { const a = text.indexOf('{'), b = text.lastIndexOf('}'); o = JSON.parse(text.slice(a, b + 1)); }
  catch (e) { return { error: 'That doesn\'t look like Claude\'s JSON reply. Copy the whole code block and try again.' }; }
  if (!o || (!o.esFill && !o.esAdd)) return { error: 'That reply isn\'t in the Spanish app format.' };
  let n = 0, rules = 0;
  const regTag = (x, reg) => { if (reg === 'casual' || reg === 'vulgar') x.t = [...new Set((x.t || []).concat(reg))]; };
  const okRules = list => (list || []).filter(id => ES.rule(id));
  (o.newRules || o.rules || []).forEach(r => {
    if (!r || !r.id || !r.title || ES.rule(r.id)) return;
    s.rules.push({ id: String(r.id), week: Number(r.week) || 0, area: r.area || 'Extra', title: r.title, sum: r.sum || '', body: r.body || '' }); rules++;
  });
  (o.items || []).forEach(it => {
    const x = ES.item(it.id); if (!x) return;
    if (it.es) x.es = it.es;
    if (it.en) x.en = it.en;
    if (it.note) x.note = it.note;
    regTag(x, it.register);
    if (ES.word(x.id)) { if (it.folder && ES.folder(it.folder)) x.f = [...new Set((x.f || []).concat(it.folder))]; }
    else {
      if (Array.isArray(it.parts)) x.parts = it.parts.filter(p => Array.isArray(p) && p[0]).map(p => p.slice(0, 3).map(String));
      if (it.pattern) x.pattern = it.pattern;
      if (it.rules) x.rules = okRules(it.rules);
    }
    x.want = !x.en; n++;
  });
  (o.words || []).forEach(w => { if (!w || !w.es || !w.en) return; s.words.push({ id: 'w' + ES.uid(), es: w.es, en: w.en, f: (w.folder && ES.folder(w.folder)) ? [w.folder] : [], t: [], ex: w.ex, exEn: w.exEn, note: w.note, src: 'Claude', added: ES.today() }); n++; });
  (o.sentences || []).forEach(x => { if (!x || !x.es || !x.en) return; s.sentences.push({ id: 's' + ES.uid(), es: x.es, en: x.en, kind: ES.KINDS[x.kind] ? x.kind : 'phrase', src: 'Claude', parts: x.parts || [], pattern: x.pattern, rules: okRules(x.rules), added: ES.today() }); n++; });
  if (!n && !rules) return { error: 'Nothing in that reply matched your items. Was it for a different list?' };
  ES.save();
  return { n, rules };
};

/* =================== SETTINGS =================== */
ES.settings = function () {
  const s = S();
  const restore = h('input', { type: 'file', accept: '.json,application/json', style: 'display:none', onchange: e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(txt => { const o = JSON.parse(txt); if (!o || !Array.isArray(o.words)) throw new Error('bad'); ES.confirm('Replace everything in the app with this backup?', () => { ES.replaceState(o); ES.closeAll(); ES.render(); ES.toast('Restored'); }, 'Restore'); })
      .catch(() => ES.toast('That file isn\'t a Spanish app backup'));
  } });
  ES.sheet('Settings', h('div', {},
    ES.field('Your name (for the greeting)', h('input', { value: s.settings.name || '', onchange: e => { s.settings.name = e.target.value.trim(); ES.save(); ES.render(); } })),
    ES.field('New flashcards per day', ES.chips([[5, '5'], [10, '10'], [15, '15'], [20, '20']], Number(s.settings.newPerDay) || 10, v => { s.settings.newPerDay = v || 10; ES.save(); ES.render(); })),
    h('h2', {}, 'Cloud save'),
    h('div', { class: 'card' }, ES.cloud.card()),
    h('h2', {}, 'Backup file'),
    h('p', { class: 'small muted' }, ES.cloud.on() ? 'Cloud save is on, so this is just an extra copy if you want one.' : 'Without cloud save, everything lives only on this device. Turn on cloud save above, or save a backup file now and then.'),
    h('button', { class: 'btn ghost block', onclick: () => {
      const blob = new Blob([JSON.stringify(s)], { type: 'application/json' });
      const file = new File([blob], 'spanish-backup-' + ES.today() + '.json', { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file] }).catch(() => {});
      else { const a = h('a', { href: URL.createObjectURL(blob), download: file.name }); document.body.append(a); a.click(); a.remove(); }
    } }, 'Save backup file'),
    h('label', { class: 'btn ghost block' }, 'Restore from backup file', restore),
    h('h2', {}, 'Add from Claude'),
    h('p', { class: 'small muted' }, 'After a Spanish session, Claude can give you new words, sentences or rule cards as a block of text to paste here.'),
    h('button', { class: 'btn ghost block', onclick: () => {
      let t = ''; const m = h('p', { class: 'small' });
      const sh = ES.sheet('Paste from Claude', h('div', {}, h('textarea', { class: 'mono tall', placeholder: '{"esAdd":1, …}', oninput: e => { t = e.target.value; } }), m,
        h('button', { class: 'btn block', onclick: () => { const r = ES.applyClaude(t); if (r.error) { m.textContent = r.error; return; } sh.close(); ES.render(); ES.toast('Added ' + r.n + (r.rules ? ' + ' + r.rules + ' rules' : '')); } }, 'Add')));
    } }, 'Paste from Claude'),
    h('p', { class: 'small muted', style: 'margin-top:18px' }, 'Started from your Notion Spanish Study Log · ' + s.words.length + ' words · ' + s.sentences.length + ' sentences · ' + s.rules.length + ' rules')));
};
})();
