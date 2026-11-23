# Mi Español — Project Notes

A personal Spanish learning app for the owner (a beginner learning structure-first with Hugo's *Spanish in 3 Months*),
used as a home-screen web app on an iPhone. It stores and organises everything heard, learned or taught so it can be
revisited and revised. A teaching side gets added later. Separate from the PT app and Organised Hotel: don't link or merge them.

## How it works
- Plain HTML, CSS and vanilla JavaScript at the repo root. No build step, no backend.
- Hosted by GitHub Pages from `main` / root: https://maxijpeak111.github.io/spanish-app/
- Data lives in localStorage key `es.v1`. **Cloud save** (`js/sync.js`, ⚙ Settings) pushes every real change to the owner's
  own PRIVATE data repo as `spanish.json` (same repo and access key as the other two apps). `js/sync.js` is a copy of the PT app's
  (adapter at the top differs). Never put user data in this public repo.
- Publishing = commit and push to `main`. Claude does this from chat; explain things in plain language.
- Every release: bump `?v=N` on all script/css links in `index.html` and in `SHELL` in `sw.js`, and bump `V` in `sw.js`.

## The course (v3, Nov 2026) — the owner restarted from zero
- `js/course.js` = the road: levels A1 → A2 → B1, 26 situation units. Each unit has six lanes/lessons: sounds, words, grammar,
  story, speak, check. Units 1–3 are fully written; the rest are mapped (goal, grammar, words) and get written by Claude via
  "Ask Claude to write Unit N" (`ES.unitPrompt` builds a request from units done, check scores, weak rules, missed words, known
  words and interests → reply `{"esUnit":1,"unit":{id, rules, lessons:[6]}, "rules":[…], "quiz":[…]}` → `state.customUnits[id]`).
  This is how later units adapt to earlier ones. Hugo's book only influences content; don't name it in lessons.
- Lesson screens: info, tip, ex (colour-coded chunks), words (become flashcards when the lesson ends), mc, build (tap words),
  type, match, story (+ questions), speak (say aloud, self-rate). `{name}` = settings.name. Spain Spanish (vosotros, "th").
- `js/lessons.js` speech (`ES.say`, `ES.sp` tap-to-hear, es-ES voice), course model, lesson player (`ES.renderScreen`), Road
  (`#path`) and unit journey map (`#unit/id`), unit writing, today's session builder (`ES.startToday(size)`; Quick/Normal/Long;
  segments warm → new → practise → check, logged in `log[date].segs`; mistakes tied to the current + previous unit's rules).
- `js/hoy.js` Hoy (owner chose compact layout): Spanish date, size picker, four-step strip, Continue button, then pairs of tiles:
  daily goal ring (4 steps + today's share of weekly listening) | current unit · "Esta semana" L–D dots + weekly stats · quick check ·
  Fix this (linked mistake) | Another way (rotating alternative practice) · listening (log any minutes, remove entries, weekly
  target, all-time hour milestones) · Want to know. Phrase of the day was removed at his request.
  `state.listen = {mins, days, log:[{id,date,mins,what}], weekly}`.
- Interests: `settings.interests` (picked) + `settings.interestsText`; examples/phrases lean on them; unit requests include them.
- `ES.courseSetup` (core.js) ran once to reset progress (srs, mistakes, quiz stats, tests) and adds course rule cards/quiz.
  New flashcards come only from lessons (added straight to srs on finishing) and things the owner adds himself.

## Starting content
- `js/seed.js` is generated ONCE from the owner's Notion Spanish Study Log (Nov 2026) by `build/` scripts (vocab.txt + content.py,
  not in this repo): 503 words in 21 folders (Notion's folders), 47 sentences/phrases, 27 rule cards, 13 Hugo weeks, 85 quiz questions.
  It only fills a brand-new install. After that the app's own data (and cloud copy) is the source of truth. Notion and the app are
  independent from here on.
- The Notion content is course material (Library, rule cards, quiz bank, phrase pool), not progress.

## Files
- `js/core.js` state, DOM helper `ES.h` / `ES.fill`, sheets (stacking), answer checking (`ES.check`: accents and missing article
  get partial credit), spaced repetition (`ES.grade`, SM-2 style Again/Hard/Good/Easy, `state.srs[id]`), search, rule mini-markup (`ES.rich`).
- `js/views.js` (old Today/Path/week views are superseded by hoy.js and lessons.js) Library, Library (search, folders, sentences, rules), word sheet, sentence page
  ("How it's built" = `parts: [[word, role, why]]`, `pattern`, `rules`), rule page (+ owner's own notes `rule.mine`).
- `js/practise.js` Runs are lists of steps `{k: card|type|quiz, id, fix}`. Deck picker (`ES.deckPicker`, `ES.DECKS`: today, random, mistakes, hotel, stuck, + word types = Notion folders, + any folder; direction mixed/Spanish/English first). My mistakes (`state.mistakes[id] = {kind: item|rule, n, ok, last}`, `ES.markMistake`; cleared after 2 right in a row; seeded from Notion trouble spots + stuck list). Flashcards (due + new per day; known cards alternate direction), Type the translation (accent buttons),
  Rule quiz (interleaved, weighted to trouble spots, never the same rule twice in a row), Cold test (20, no feedback until the end, history in `state.tests`).
- `js/add.js` Quick add (+ button), "Want to know" inbox → Ask Claude (copy prompt, paste JSON back), Settings, paste-from-Claude.
- `js/app.js` router + nav (Hoy, Path, Library, Practise).

## Data shapes
- word `{id, es, en, f:[folderIds], t:[tags], ex, exEn, note, want, src, added}` · tags: `*` top 75, `ok` confirmed, `ear` heard in
  real content, `irr` irregular, `stuck` stuck list, `casual`, `vulgar`
- sentence `{id, es, en, kind: phrase|work|heard|lyric, src, song, pattern, parts, rules, want, added}`
- rule `{id, week, area, title, sum, body, mine}`. Body markup: `## head`, `- bullet`, `| table |`, `> 🧠 tip`, `= es = en`, `**bold**`
- `want: true` = waiting in the Want to know inbox.

## Claude ↔ app format (paste into the app)
- Fill the inbox: `{"esFill":1,"items":[{id, es, en, folder, parts, pattern, rules, note, register}],"newRules":[…]}`
- Add new material after a session: `{"esAdd":1,"words":[{es,en,folder,ex,exEn,note}],"sentences":[{es,en,kind,parts,pattern,rules}],"rules":[{id,week,area,title,sum,body}]}`

## Rules
- Look: same family as Organised Hotel (cream, white cards, warm brown text) with Spanish red (`--red`) and yellow highlights.
  Big tap targets, few taps. Relative paths only.
- Build DOM with `ES.h` (text is always text, never HTML).
- Never hard-code the owner's personal data; never add copyrighted song lyrics — the owner types the lines he hears.
- Learning design (from research): spaced retrieval for words, interleaved quizzes for grammar, words learned inside sentences,
  production (EN→ES) as well as recognition, and change method when something plateaus (e.g. the stuck list gets memory tricks).
