/* The course: one road, A1 → A2 → B1, built from real-life situation units.
   Each unit has six steps (lanes): sounds, words, grammar, story, speak, check. Each step is a swipe-through lesson.
   Units with `lessons` are written; the rest are mapped (goal, grammar, words) and get written by Claude from how
   the owner is actually doing (see ES.unitPrompt). Content is Spain Spanish. Written for a complete beginner.
   Screen types: info {title, body} · ex {es, en, parts, tags} · words {list: [[es, en, note]]} · mc {q, o, a, why, rule}
   · build {en, es, extra} · type {en, es, rule} · match {pairs} · story {title, lines: [[who, es, en]], qs} · speak {en, es, hint}
   · tip {body}. Example screens can carry interest tags (work, fitness, travel, music, food, social). */
window.ES_COURSE = {
v: 1,
levels: [
  { id: 'A1', name: 'Starting out', sub: 'Talk about yourself and handle simple situations' },
  { id: 'A2', name: 'Getting by', sub: 'Past, plans and everyday tasks on your own' },
  { id: 'B1', name: 'Chatting', sub: 'Opinions, wishes, stories and what-ifs' }
],
lanes: {
  sounds: ['🔊', 'Sounds'], words: ['🗂️', 'Words'], grammar: ['🧩', 'Grammar'],
  story: ['📖', 'Story'], speak: ['🗣️', 'Speak'], check: ['🏁', 'Check']
},
// Extra rule cards the course needs (added to the Library if missing).
rules: [
  { id: 'sounds', week: 0, area: 'Sounds', title: 'How Spanish sounds', sum: 'Five pure vowels that never change, and every letter is read the same way every time.', body: `
| a | "ah" — casa |
| e | "eh" — mesa |
| i | "ee" — sí |
| o | "oh" — no |
| u | "oo" — tú |
- Vowels stay short and clean — never "ay-oo" glides like English
## Letters that surprise English speakers
| h | silent — hola = "ola" |
| j, and g before e/i | a breathy throat "h" — jamón, gente |
| ll, y | like "y" in yes — llamo, yo |
| ñ | "ny" as in canyon — España |
| c before e/i, and z | "th" as in think (Spain) — gracias, cerveza |
| qu | "k" — que, quiero |
| r | a quick tap — pero |
| rr, and r at the start | rolled — perro, Roma |
| b, v | the same soft "b" — vale, bien |
> If you can read it, you can say it. Spanish spelling doesn't lie.` },
  { id: 'stress', week: 0, area: 'Sounds', title: 'Where the stress goes', sum: 'Ends in a vowel, n or s → stress the second-to-last syllable. Anything else → the last. An accent mark overrides both.', body: `
= ca-sa · ha-blan · lu-nes = stress on the second-to-last
= ho-tel · co-mer · Ma-drid = stress on the last
= ca-fé · lá-piz · a-diós = the accent mark shows the exception
> The written accent isn't decoration — it tells you where to push.` },
  { id: 'tuusted', week: 1, area: 'Pronouns', title: 'tú or usted?', sum: 'tú = friends, colleagues, people your age. usted = guests, older people, formal moments. In Spain tú is very common.', body: `
| tú (friendly) | usted (polite) |
| ¿Cómo te llamas? | ¿Cómo se llama? |
| ¿De dónde eres? | ¿De dónde es? |
| ¿Qué quieres? | ¿Qué quiere? |
- usted uses the same verb form as él / ella
- vosotros = you all (friends) — used all over Spain · ustedes = you all (polite)
> At work with guests: start with usted. If they use tú with you, you can switch.` },
  { id: 'hayquiero', week: 1, area: 'Verbs', title: 'hay · quiero · quisiera', sum: 'hay = there is / there are (never changes). quiero = I want. quisiera = I\'d like (softer, polite).', body: `
= Hay una mesa libre = There's a free table
= Hay dos cervezas = There are two beers
= Quiero un café = I want a coffee
= Quisiera una mesa para dos = I'd like a table for two
- ¿Hay…? = Is there…? / Are there…? — perfect for asking at a bar or shop
- Ordering in Spain: Ponme… (give me…) is very common and friendly with staff you know` }
],
quiz: [
  { rule: 'sounds', q: 'How do you say the h in hola?', o: ['Like English h', 'Silent', 'Like j'], a: 1, why: 'h is always silent in Spanish.' },
  { rule: 'sounds', q: 'In Spain, gracias sounds like…', o: ['gra-see-as', 'gra-thee-as', 'gra-kee-as'], a: 1, why: 'c before e/i is "th" in Spain.' },
  { rule: 'sounds', q: 'Which word has a rolled r?', o: ['pero', 'perro'], a: 1, why: 'rr is always rolled. pero (but) has a quick tap.' },
  { rule: 'sounds', q: 'ñ in España sounds like…', o: ['n', 'ny (canyon)', 'gn (sign)'], a: 1, why: 'ñ = "ny".' },
  { rule: 'stress', q: 'Where is the stress in "hablan"?', o: ['HA-blan', 'ha-BLAN'], a: 0, why: 'Ends in n → second-to-last syllable.' },
  { rule: 'stress', q: 'Where is the stress in "hotel"?', o: ['HO-tel', 'ho-TEL'], a: 1, why: 'Ends in l (not vowel/n/s) → last syllable.' },
  { rule: 'tuusted', q: 'A guest at reception. You ask their name:', o: ['¿Cómo te llamas?', '¿Cómo se llama?'], a: 1, why: 'Guests → usted → se llama.' },
  { rule: 'tuusted', q: 'A new colleague your age. You ask where they\'re from:', o: ['¿De dónde eres?', '¿De dónde es usted?'], a: 0, why: 'Colleague → tú → eres.' },
  { rule: 'hayquiero', q: 'There are two free tables → ___ dos mesas libres.', o: ['Son', 'Hay', 'Están'], a: 1, why: 'hay = there is AND there are. It never changes.' },
  { rule: 'hayquiero', q: 'Politest way to order: ___ un café, por favor.', o: ['Quiero', 'Quisiera'], a: 1, why: 'quisiera = I\'d like — softer than quiero.' }
],
units: [
/* ======================= A1 ======================= */
{ id: 'u1', level: 'A1', n: 1, title: 'Sounds and hello', place: 'Meeting someone · greeting a guest', can: ['Read any Spanish word out loud', 'Say hello, goodbye, please and thanks', 'Ask someone\'s name and give yours'], rules: ['sounds', 'stress', 'tuusted'],
  lessons: [
  { id: 'u1-sounds', lane: 'sounds', title: 'Five vowels, one rule', mins: 5, rules: ['sounds', 'stress'], screens: [
    { t: 'info', title: 'Good news first', body: 'Spanish is written exactly how it sounds. Learn about 15 sounds and you can read any word out loud correctly — even ones you don\'t know yet.\n> Tap any Spanish in this app to hear it.' },
    { t: 'info', title: 'Five vowels', body: '| a | "ah" | casa |\n| e | "eh" | mesa |\n| i | "ee" | sí |\n| o | "oh" | no |\n| u | "oo" | tú |\n- Short and pure, always. English stretches vowels — Spanish never does.' },
    { t: 'ex', es: 'casa · mesa · sí · no · tú', en: 'house · table · yes · no · you' },
    { t: 'mc', q: 'Which sound does "e" make in mesa?', o: ['"ee" like see', '"eh" like bed', '"ay" like day'], a: 1, why: 'e = "eh", short and clean.', rule: 'sounds' },
    { t: 'info', title: 'The silent one', body: '**h** is always silent.\n= hola · hotel · hora = "ola" · "otel" · "ora"' },
    { t: 'info', title: 'The throat sound', body: '**j** — and **g** before e or i — is a breathy "h" from the back of the throat, like the ch in Scottish "loch".\n= jamón · gente · Jorge = ham · people · George' },
    { t: 'info', title: 'Spain\'s "th"', body: 'In Spain, **z** and **c** before e/i sound like "th" in think.\n= gracias · cerveza · cinco = thanks · beer · five\n- In Latin America they\'re an "s". Both are fine — this app uses Spain.' },
    { t: 'mc', q: 'How does "gracias" sound in Spain?', o: ['GRA-see-as', 'GRA-thee-as', 'GRA-kee-as'], a: 1, why: 'c before i = "th" in Spain.', rule: 'sounds' },
    { t: 'info', title: 'Three more', body: '| ll, y | "y" as in yes | me llamo, yo |\n| ñ | "ny" as in canyon | España, mañana |\n| qu | "k" | que, quiero |\n| b, v | the same soft b | vale, bien |' },
    { t: 'info', title: 'Tap r, rolled rr', body: 'One **r** in the middle of a word is a quick tap — like the "tt" in a fast "butter".\n**rr**, and an **r** at the start of a word, is rolled.\n= pero · perro = but · dog\n> Changing one sound changes the word. Practise pero / perro out loud.' },
    { t: 'mc', q: 'Which word means "dog"?', o: ['pero', 'perro'], a: 1, why: 'perro (rolled rr) = dog. pero = but.', rule: 'sounds' },
    { t: 'info', title: 'Where to push', body: 'Ends in a vowel, n or s → stress the second-to-last syllable.\nEnds in anything else → stress the last.\nA written accent always wins.\n= CA-sa · HA-blan · ho-TEL · ca-FÉ = house · they speak · hotel · coffee' },
    { t: 'mc', q: 'Where is the stress in "trabajo"?', o: ['TRA-ba-jo', 'tra-BA-jo', 'tra-ba-JO'], a: 1, why: 'Ends in a vowel → second-to-last syllable: tra-BA-jo.', rule: 'stress' },
    { t: 'mc', q: 'Where is the stress in "Madrid"?', o: ['MA-drid', 'ma-DRID'], a: 1, why: 'Ends in d → last syllable.', rule: 'stress' },
    { t: 'tip', body: 'Read every Spanish word you see out loud this week — signs, menus, songs. You already know how.' }
  ]},
  { id: 'u1-words', lane: 'words', title: 'Hello, please, thanks', mins: 5, screens: [
    { t: 'words', list: [['hola', 'hello'], ['buenos días', 'good morning'], ['buenas tardes', 'good afternoon / evening', 'until about 8–9pm in Spain'], ['buenas noches', 'good evening / good night'], ['adiós', 'goodbye'], ['hasta luego', 'see you later', 'used as a normal goodbye in Spain']] },
    { t: 'match', pairs: [['hola', 'hello'], ['adiós', 'goodbye'], ['buenos días', 'good morning'], ['hasta luego', 'see you later']] },
    { t: 'words', list: [['por favor', 'please'], ['gracias', 'thank you'], ['de nada', 'you\'re welcome'], ['perdón', 'sorry / excuse me'], ['disculpe', 'excuse me (polite)', 'to get a guest\'s attention']] },
    { t: 'mc', q: 'A guest says "gracias". You reply:', o: ['Por favor', 'De nada', 'Perdón'], a: 1, why: 'de nada = you\'re welcome. (Con mucho gusto = with pleasure, even warmer.)' },
    { t: 'words', list: [['¿Qué tal?', 'how\'s it going?'], ['bien', 'well / fine'], ['muy bien', 'very well'], ['¿y tú?', 'and you?'], ['vale', 'OK', 'you\'ll hear it constantly in Spain']] },
    { t: 'build', en: 'Very well, and you?', es: 'Muy bien, ¿y tú?', extra: ['bueno', 'gracias'] },
    { t: 'mc', q: 'It\'s 4pm. You greet a guest:', o: ['Buenos días', 'Buenas tardes', 'Buenas noches'], a: 1, why: 'Spain\'s "tarde" runs from lunch until about 8–9pm.' },
    { t: 'type', en: 'thank you', es: 'gracias' },
    { t: 'type', en: 'see you later', es: 'hasta luego' }
  ]},
  { id: 'u1-grammar', lane: 'grammar', title: 'What\'s your name?', mins: 6, rules: ['tuusted'], screens: [
    { t: 'info', title: 'Two ways to say "you"', body: '**tú** — friends, colleagues, people your age.\n**usted** — guests, older people, formal moments.\n> At the hotel with guests: start with usted.' },
    { t: 'ex', es: '¿Cómo te llamas?', en: 'What\'s your name? (tú)', parts: [['¿Cómo', 'question word', 'how'], ['te', 'pronoun', 'yourself'], ['llamas', 'verb', 'you call'], ['?', '', 'literally "how do you call yourself?"']] },
    { t: 'ex', es: '¿Cómo se llama?', en: 'What\'s your name? (usted)', parts: [['¿Cómo', 'question word', 'how'], ['se', 'pronoun', 'yourself (polite)'], ['llama', 'verb', 'you (polite) call']] },
    { t: 'ex', es: 'Me llamo {name}.', en: 'My name is {name}.', parts: [['Me', 'pronoun', 'myself'], ['llamo', 'verb', 'I call'], ['{name}', 'name', '']] },
    { t: 'mc', q: 'A guest at the bar. You ask their name:', o: ['¿Cómo te llamas?', '¿Cómo se llama?'], a: 1, why: 'Guest → usted → se llama.', rule: 'tuusted' },
    { t: 'info', title: 'Nice to meet you', body: '= Mucho gusto = Nice to meet you (anyone can say it)\n= Encantado · Encantada = Delighted (a man says encantado, a woman encantada)\n> Your first gender rule: words describing YOU match you. a man → encantado.' },
    { t: 'mc', q: 'A man meets someone. He says:', o: ['Encantada', 'Encantado'], a: 1, why: 'A man says encantado.' },
    { t: 'build', en: 'My name is {name}, nice to meet you.', es: 'Me llamo {name}, mucho gusto.', extra: ['te', 'llama'] },
    { t: 'type', en: 'What\'s your name? (friendly)', es: '¿Cómo te llamas?', rule: 'tuusted' },
    { t: 'tip', body: 'Spain uses vosotros for "you all" with friends: ¿Cómo os llamáis? You\'ll meet it properly soon.' }
  ]},
  { id: 'u1-story', lane: 'story', title: 'A new face at the bar', mins: 4, screens: [
    { t: 'story', title: 'Evening at the hotel bar', lines: [
      ['{name}', 'Buenas tardes. ¿Qué tal?', 'Good evening. How\'s it going?'],
      ['Lucía', 'Muy bien, gracias. ¿Y tú?', 'Very well, thanks. And you?'],
      ['{name}', 'Bien, bien. Me llamo {name}. ¿Cómo te llamas?', 'Good, good. I\'m {name}. What\'s your name?'],
      ['Lucía', 'Me llamo Lucía. Mucho gusto.', 'I\'m Lucía. Nice to meet you.'],
      ['{name}', 'Encantado. Bienvenida.', 'Delighted. Welcome.'],
      ['Lucía', 'Gracias. Hasta luego.', 'Thanks. See you later.'],
      ['{name}', '¡Hasta luego!', 'See you later!']],
      qs: [
        { q: 'How is Lucía?', o: ['Tired', 'Very well', 'Not great'], a: 1, why: 'Muy bien, gracias.' },
        { q: 'Why does {name} say "bienvenida" and not "bienvenido"?', o: ['Because it\'s evening', 'Because Lucía is a woman', 'Because it\'s polite'], a: 1, why: 'Words describing a person match them: bienvenida for a woman.' }
      ] }
  ]},
  { id: 'u1-speak', lane: 'speak', title: 'Say it out loud', mins: 4, screens: [
    { t: 'info', title: 'How this works', body: 'Read the English, say the Spanish OUT LOUD, then tap to check. Mark yourself honestly.\n> Speaking is the part most learners skip. It\'s also the one that makes you feel fluent.' },
    { t: 'speak', en: 'Good morning! How\'s it going?', es: '¡Buenos días! ¿Qué tal?' },
    { t: 'speak', en: 'My name is {name}. What\'s your name? (to a guest)', es: 'Me llamo {name}. ¿Cómo se llama?' },
    { t: 'speak', en: 'Nice to meet you.', es: 'Mucho gusto.' },
    { t: 'speak', en: 'Thank you very much. — You\'re welcome.', es: 'Muchas gracias. — De nada.' },
    { t: 'speak', en: 'Excuse me. (getting a guest\'s attention)', es: 'Disculpe.', hint: 'dis-KUL-peh' },
    { t: 'speak', en: 'See you later!', es: '¡Hasta luego!' }
  ]},
  { id: 'u1-check', lane: 'check', title: 'Unit 1 check', mins: 4, check: true, screens: [
    { t: 'mc', q: 'cerveza in Spain sounds like…', o: ['ser-VAY-sa', 'ther-BE-tha', 'ker-VE-za'], a: 1, why: 'z = "th", v = soft b, stress on second-to-last.', rule: 'sounds' },
    { t: 'mc', q: 'Which is silent?', o: ['j', 'h', 'ñ'], a: 1, why: 'h is always silent.', rule: 'sounds' },
    { t: 'mc', q: 'An older guest arrives. "What\'s your name?"', o: ['¿Cómo te llamas?', '¿Cómo se llama?'], a: 1, why: 'Polite → usted → se llama.', rule: 'tuusted' },
    { t: 'match', pairs: [['buenas noches', 'good night'], ['de nada', 'you\'re welcome'], ['perdón', 'sorry'], ['vale', 'OK']] },
    { t: 'build', en: 'Good afternoon, how\'s it going?', es: 'Buenas tardes, ¿qué tal?', extra: ['días', 'noches'] },
    { t: 'type', en: 'please', es: 'por favor' },
    { t: 'mc', q: 'Where\'s the stress in "llamo"?', o: ['LLA-mo', 'lla-MO'], a: 0, why: 'Ends in a vowel → second-to-last.', rule: 'stress' }
  ]}
  ]},

{ id: 'u2', level: 'A1', n: 2, title: 'Who I am', place: 'Introducing yourself at work', can: ['Say who you are, where you\'re from and what you do', 'Ask other people the same', 'Count to 20 and say your age', 'Make anything negative or a question'], rules: ['pronouns', 'serestar', 'tener', 'negq'],
  lessons: [
  { id: 'u2-sounds', lane: 'sounds', title: 'Questions and rhythm', mins: 3, rules: ['negq'], screens: [
    { t: 'info', title: 'The upside-down question mark', body: 'Spanish questions open with **¿** and close with **?** — so you know it\'s a question before you start reading. Same for **¡ !**\n= ¿Eres inglés? = Are you English?\n= ¡Qué bien! = How great!' },
    { t: 'info', title: 'Your voice does the work', body: 'In speech, a statement becomes a question just by rising at the end.\n= Eres inglés. = You\'re English.\n= ¿Eres inglés? = Are you English? (voice goes up)' },
    { t: 'mc', q: 'How do you write "Are you Spanish?"', o: ['Eres español?', '¿Eres español?', '¿Eres español¿'], a: 1, why: 'Open with ¿, close with ?.', rule: 'negq' },
    { t: 'info', title: 'Syllable rhythm', body: 'English squashes some syllables. Spanish gives every syllable about the same time — like a machine gun, not a drum.\n= ma-ña-na · tra-ba-ja-dor = tomorrow · hard-working\n> Say each syllable evenly and you\'ll sound twice as natural.' }
  ]},
  { id: 'u2-words', lane: 'words', title: 'Jobs, countries, 0–20', mins: 7, screens: [
    { t: 'words', list: [['inglés / inglesa', 'English'], ['español / española', 'Spanish'], ['escocés / escocesa', 'Scottish'], ['irlandés / irlandesa', 'Irish'], ['de Mánchester', 'from Manchester']] },
    { t: 'info', title: 'Nationalities match you', body: 'Like encantado/encantada — a woman is **inglesa**, a man is **inglés**.\n- Nationalities are lowercase in Spanish: inglés, not Inglés.' },
    { t: 'words', list: [['el camarero / la camarera', 'waiter / bartender'], ['el encargado / la encargada', 'manager / supervisor'], ['el recepcionista / la recepcionista', 'receptionist'], ['el entrenador personal', 'personal trainer'], ['el estudiante / la estudiante', 'student']] },
    { t: 'match', pairs: [['camarero', 'waiter'], ['encargado', 'manager'], ['inglés', 'English'], ['entrenador', 'trainer']] },
    { t: 'words', list: [['cero', '0'], ['uno', '1'], ['dos', '2'], ['tres', '3'], ['cuatro', '4'], ['cinco', '5'], ['seis', '6'], ['siete', '7'], ['ocho', '8'], ['nueve', '9'], ['diez', '10']] },
    { t: 'words', list: [['once', '11'], ['doce', '12'], ['trece', '13'], ['catorce', '14'], ['quince', '15'], ['dieciséis', '16'], ['diecisiete', '17'], ['dieciocho', '18'], ['diecinueve', '19'], ['veinte', '20']] },
    { t: 'tip', body: '16–19 are "ten-and-six": dieci-séis, dieci-siete… Spot the pattern and you only learn one rule.' },
    { t: 'mc', q: 'quince = ?', o: ['5', '15', '50'], a: 1, why: 'quince = 15 (cinco = 5).' },
    { t: 'type', en: 'twelve', es: 'doce' },
    { t: 'type', en: 'seven', es: 'siete' }
  ]},
  { id: 'u2-grammar', lane: 'grammar', title: 'ser: I am, you are', mins: 8, rules: ['pronouns', 'serestar', 'tener', 'negq'], screens: [
    { t: 'info', title: 'To be (who you are)', body: 'Spanish has two verbs for "to be". Today: **ser** — for who or what something IS.\n| yo | soy | I am |\n| tú | eres | you are |\n| él / ella / usted | es | he / she is · you (polite) are |\n| nosotros | somos | we are |\n| vosotros | sois | you all are |\n| ellos / ellas / ustedes | son | they are |' },
    { t: 'info', title: 'Drop the "I"', body: 'The verb ending already says who: **soy** can only mean "I am". So Spanish usually drops yo and tú.\n= Soy {name}. = I\'m {name}.\n= ¿Eres inglés? = Are you English?' },
    { t: 'ex', es: 'Soy encargado en un hotel.', en: 'I\'m a manager in a hotel.', parts: [['Soy', 'ser, yo', 'I am — no "yo" needed'], ['encargado', 'job', 'no "un" before a job after ser'], ['en un hotel', 'place', 'in a hotel']], tags: ['work'] },
    { t: 'ex', es: 'Soy entrenador personal.', en: 'I\'m a personal trainer.', parts: [['Soy', 'ser, yo', 'I am'], ['entrenador personal', 'job', 'no "un" — jobs after ser drop the article']], tags: ['fitness'] },
    { t: 'mc', q: 'I\'m a waiter → ___', o: ['Soy un camarero.', 'Soy camarero.', 'Estoy camarero.'], a: 1, why: 'Job after ser: no article. And jobs use ser.', rule: 'gender' },
    { t: 'mc', q: 'We are English → ___ ingleses.', o: ['Son', 'Somos', 'Sois'], a: 1, why: 'nosotros → somos.', rule: 'pronouns' },
    { t: 'info', title: 'Where you\'re from', body: '**ser + de** = to be from.\n= Soy de Mánchester. = I\'m from Manchester.\n= ¿De dónde eres? = Where are you from? (friendly)\n= ¿De dónde es usted? = Where are you from? (polite)' },
    { t: 'info', title: 'No and questions', body: '**no** goes right before the verb.\n= No soy español. = I\'m not Spanish.\nQuestions: same words, add ¿? and lift your voice.\n= ¿Eres camarera? = Are you a waitress?' },
    { t: 'build', en: 'I\'m not from Madrid, I\'m from Manchester.', es: 'No soy de Madrid, soy de Mánchester.', extra: ['estoy', 'es'] },
    { t: 'info', title: 'Your age: tener, not ser', body: 'Spanish HAS years: **tener** (to have).\n= Tengo veintiocho años. = I\'m 28 (I have 28 years).\n= ¿Cuántos años tienes? = How old are you?\n> Never "soy 28" — age is something you have.' },
    { t: 'mc', q: 'I\'m 20 → ___ veinte años.', o: ['Soy', 'Tengo', 'Estoy'], a: 1, why: 'Age uses tener: tengo … años.', rule: 'tener' },
    { t: 'type', en: 'Where are you from? (friendly)', es: '¿De dónde eres?', rule: 'negq' },
    { t: 'type', en: 'I am English. (you\'re a man)', es: 'Soy inglés.', rule: 'pronouns' }
  ]},
  { id: 'u2-story', lane: 'story', title: 'The new colleague', mins: 4, screens: [
    { t: 'story', title: 'First shift together', lines: [
      ['Javi', 'Hola, soy Javi. Soy el nuevo camarero.', 'Hi, I\'m Javi. I\'m the new waiter.'],
      ['{name}', '¡Hola, Javi! Me llamo {name}. Soy el encargado del bar.', 'Hi Javi! I\'m {name}. I\'m the bar manager.'],
      ['Javi', 'Encantado. ¿Eres inglés?', 'Nice to meet you. Are you English?'],
      ['{name}', 'Sí, soy de Mánchester. ¿Y tú? ¿De dónde eres?', 'Yes, I\'m from Manchester. And you? Where are you from?'],
      ['Javi', 'Soy de Sevilla, pero vivo aquí.', 'I\'m from Seville, but I live here.'],
      ['{name}', '¡Qué bien! ¿Cuántos años tienes?', 'Great! How old are you?'],
      ['Javi', 'Tengo veinte años. Soy estudiante también.', 'I\'m 20. I\'m a student too.']],
      qs: [
        { q: 'Where is Javi from?', o: ['Madrid', 'Seville', 'Manchester'], a: 1, why: 'Soy de Sevilla.' },
        { q: 'How old is Javi?', o: ['12', '20', '28'], a: 1, why: 'Tengo veinte años.' },
        { q: 'Why "Soy el encargado" WITH "el" here?', o: ['Mistake', 'He means THE manager of this bar — a specific one'], a: 1, why: 'The article stays when it\'s a specific role: el encargado del bar.' }
      ] }
  ]},
  { id: 'u2-speak', lane: 'speak', title: 'Introduce yourself', mins: 4, screens: [
    { t: 'speak', en: 'Hi, I\'m {name}. I\'m from Manchester.', es: 'Hola, soy {name}. Soy de Mánchester.' },
    { t: 'speak', en: 'I\'m a bar manager.', es: 'Soy encargado de bar.', hint: 'no "un"' },
    { t: 'speak', en: 'I\'m English, I\'m not Spanish.', es: 'Soy inglés, no soy español.' },
    { t: 'speak', en: 'Where are you from? (to a guest)', es: '¿De dónde es usted?' },
    { t: 'speak', en: 'How old are you? (friendly)', es: '¿Cuántos años tienes?' },
    { t: 'speak', en: 'Now say your real age.', es: 'Tengo … años.', hint: 'tener + number + años' },
    { t: 'speak', en: 'I\'m a student too.', es: 'Soy estudiante también.' }
  ]},
  { id: 'u2-check', lane: 'check', title: 'Unit 2 check', mins: 5, check: true, screens: [
    { t: 'mc', q: 'They are Spanish → ___ españoles.', o: ['Somos', 'Son', 'Es'], a: 1, why: 'ellos → son.', rule: 'pronouns' },
    { t: 'mc', q: 'I\'m 30 → ___', o: ['Soy treinta años.', 'Tengo treinta años.'], a: 1, why: 'Age → tener.', rule: 'tener' },
    { t: 'mc', q: 'She\'s a receptionist → Es ___ recepcionista.', o: ['una', '(nothing)'], a: 1, why: 'Job after ser → no article.', rule: 'gender' },
    { t: 'build', en: 'Are you from Manchester?', es: '¿Eres de Mánchester?', extra: ['soy', 'en'] },
    { t: 'type', en: 'fifteen', es: 'quince' },
    { t: 'type', en: 'I\'m not English.', es: 'No soy inglés.', rule: 'negq' },
    { t: 'match', pairs: [['soy', 'I am'], ['eres', 'you are'], ['somos', 'we are'], ['son', 'they are']] }
  ]}
  ]},

{ id: 'u3', level: 'A1', n: 3, title: 'At the hotel bar', place: 'Ordering, offering, paying', can: ['Order and offer drinks and food', 'Use el / la / un / una correctly', 'Say what there is: hay', 'Talk about prices up to 100'], rules: ['gender', 'adjectives', 'hayquiero', 'numtime'],
  lessons: [
  { id: 'u3-sounds', lane: 'sounds', title: 'Linking words', mins: 3, rules: ['sounds'], screens: [
    { t: 'info', title: 'Words run together', body: 'Native speakers join a word ending in a vowel to the next one starting with a vowel. That\'s why fast Spanish sounds like one long word.\n= ¿Qué es esto? = sounds like "ke-es-esto"\n= una amiga = sounds like "u-na-mi-ga"' },
    { t: 'info', title: 'Hear it, then say it', body: '= Lo quiero ahora. = I want it now. ("lo-kie-roa-ora")\n> When a fast sentence loses you, it\'s usually linking — not new words.' },
    { t: 'mc', q: 'Why does fast Spanish sound like one long word?', o: ['People skip words', 'Vowels link between words', 'There are no spaces in Spanish'], a: 1, why: 'Vowel-to-vowel linking.', rule: 'sounds' }
  ]},
  { id: 'u3-words', lane: 'words', title: 'Drinks, food, money', mins: 7, screens: [
    { t: 'words', list: [['una cerveza', 'a beer'], ['una caña', 'a small draught beer', 'the classic order in Spain'], ['un vino tinto', 'a red wine'], ['un vino blanco', 'a white wine'], ['un agua', 'a water', 'feminine, but "un" before stressed a-'], ['un café', 'a coffee'], ['un zumo', 'a juice'], ['un refresco', 'a soft drink']] },
    { t: 'words', list: [['la carta', 'the menu'], ['la cuenta', 'the bill'], ['una mesa', 'a table'], ['unas tapas', 'some tapas'], ['el hielo', 'ice'], ['con / sin', 'with / without'], ['¿Qué le pongo?', 'What can I get you?', 'what bar staff say in Spain']] },
    { t: 'match', pairs: [['la cuenta', 'the bill'], ['la carta', 'the menu'], ['sin hielo', 'without ice'], ['una caña', 'a small beer']] },
    { t: 'words', list: [['veinte', '20'], ['treinta', '30'], ['cuarenta', '40'], ['cincuenta', '50'], ['sesenta', '60'], ['setenta', '70'], ['ochenta', '80'], ['noventa', '90'], ['cien', '100'], ['euros', 'euros'], ['libras', 'pounds']] },
    { t: 'info', title: 'In-between numbers', body: '21–29 are one word: **veintiuno, veintidós, veintitrés…**\nFrom 31: tens **y** units: **treinta y cinco** (35), **cuarenta y dos** (42).' },
    { t: 'mc', q: 'cuarenta y ocho = ?', o: ['38', '48', '84'], a: 1, why: 'cuarenta (40) y ocho (8).' },
    { t: 'type', en: 'twenty-five', es: 'veinticinco' },
    { t: 'type', en: 'the bill', es: 'la cuenta' }
  ]},
  { id: 'u3-grammar', lane: 'grammar', title: 'el, la, un, una + hay', mins: 9, rules: ['gender', 'adjectives', 'hayquiero'], screens: [
    { t: 'info', title: 'Every noun has a gender', body: 'Masculine or feminine — it\'s part of the word, not logic.\n| | masculine | feminine |\n| the | el | la |\n| a | un | una |\n| the (plural) | los | las |\n| some | unos | unas |\n- Usually **-o → masculine** (el vino), **-a → feminine** (la cerveza)' },
    { t: 'info', title: 'The exceptions you\'ll meet first', body: '= el día · el problema · el mapa = masculine despite -a\n= la mano · la foto = feminine despite -o\n> Learn every noun WITH its article: "la cuenta", never just "cuenta".' },
    { t: 'mc', q: '___ cuenta, por favor.', o: ['El', 'La'], a: 1, why: 'cuenta ends in -a → feminine → la.', rule: 'gender' },
    { t: 'mc', q: '___ problema', o: ['La', 'El'], a: 1, why: 'problema is a masculine exception.', rule: 'gender' },
    { t: 'info', title: 'Plurals', body: 'Ends in a vowel → **+s** (cervezas). Ends in a consonant → **+es** (hoteles). -z → **-ces** (luz → luces).\nThe article goes plural too: **las** cervezas, **los** hoteles.' },
    { t: 'info', title: 'Describing words come after', body: 'And they match the noun.\n= una cerveza fría · dos cervezas frías = a cold beer · two cold beers\n= un vino tinto · unos vinos blancos = a red wine · some white wines' },
    { t: 'mc', q: 'Two cold beers → dos cervezas ___', o: ['frío', 'fría', 'frías'], a: 2, why: 'cervezas = feminine plural → frías.', rule: 'adjectives' },
    { t: 'info', title: 'hay = there is / there are', body: 'One word, never changes.\n= Hay una mesa libre. = There\'s a free table.\n= ¿Hay tapas? = Are there any tapas?\n= No hay hielo. = There\'s no ice.' },
    { t: 'info', title: 'Ordering', body: '= Quiero una caña. = I want a small beer.\n= Quisiera un vino tinto. = I\'d like a red wine. (softer)\n= Ponme un café. = Give me a coffee. (friendly, very Spanish)\n= ¿Cuánto es? = How much is it?' },
    { t: 'build', en: 'Is there a free table?', es: '¿Hay una mesa libre?', extra: ['es', 'un'] },
    { t: 'build', en: 'I\'d like two red wines, please.', es: 'Quisiera dos vinos tintos, por favor.', extra: ['tinto', 'quiero'] },
    { t: 'type', en: 'the beers', es: 'las cervezas', rule: 'gender' },
    { t: 'type', en: 'There\'s no ice.', es: 'No hay hielo.', rule: 'hayquiero' }
  ]},
  { id: 'u3-story', lane: 'story', title: 'A busy Friday', mins: 4, screens: [
    { t: 'story', title: 'Friday night at the bar', lines: [
      ['Cliente', 'Buenas noches. ¿Hay una mesa libre?', 'Good evening. Is there a free table?'],
      ['{name}', 'Sí, claro. Aquí tiene la carta.', 'Yes, of course. Here\'s the menu.'],
      ['Cliente', 'Gracias. Quisiera una caña y un agua sin gas.', 'Thanks. I\'d like a small beer and a still water.'],
      ['{name}', '¿Algo más? Hay tapas hoy.', 'Anything else? There are tapas today.'],
      ['Cliente', 'No, gracias. ¿Cuánto es?', 'No, thanks. How much is it?'],
      ['{name}', 'Son seis euros con cincuenta.', 'That\'s six euros fifty.'],
      ['Cliente', 'Aquí tiene. ¡Gracias!', 'Here you go. Thanks!']],
      qs: [
        { q: 'What does the guest order?', o: ['Red wine and tapas', 'A small beer and a still water', 'Two coffees'], a: 1, why: 'Una caña y un agua sin gas.' },
        { q: 'How much is it?', o: ['€6.50', '€16.50', '€60'], a: 0, why: 'Seis euros con cincuenta.' },
        { q: '"Aquí tiene" means…', o: ['Here you go', 'Over there', 'Have a seat'], a: 0, why: 'Aquí tiene = here you have (it) — handing something over politely.' }
      ] }
  ]},
  { id: 'u3-speak', lane: 'speak', title: 'Run the bar', mins: 4, screens: [
    { t: 'speak', en: 'Good evening, what can I get you? (to a guest)', es: 'Buenas noches, ¿qué le pongo?', hint: 'the classic Spanish bar question' },
    { t: 'speak', en: 'Here\'s the menu.', es: 'Aquí tiene la carta.' },
    { t: 'speak', en: 'There are tapas today.', es: 'Hay tapas hoy.' },
    { t: 'speak', en: 'With or without ice?', es: '¿Con o sin hielo?' },
    { t: 'speak', en: 'That\'s twelve euros.', es: 'Son doce euros.' },
    { t: 'speak', en: 'Order for yourself: a coffee, please.', es: 'Un café, por favor.', hint: 'or: Ponme un café' }
  ]},
  { id: 'u3-check', lane: 'check', title: 'Unit 3 check', mins: 5, check: true, screens: [
    { t: 'mc', q: '___ agua está fría.', o: ['La', 'El'], a: 1, why: 'agua is feminine but takes el (stressed a-).', rule: 'gender' },
    { t: 'mc', q: 'Is there any ice? → ¿___ hielo?', o: ['Es', 'Hay', 'Está'], a: 1, why: 'hay = is there / are there.', rule: 'hayquiero' },
    { t: 'mc', q: 'Two white wines → dos vinos ___', o: ['blanco', 'blancos', 'blancas'], a: 1, why: 'vinos = masculine plural → blancos.', rule: 'adjectives' },
    { t: 'build', en: 'The bill, please.', es: 'La cuenta, por favor.', extra: ['el', 'carta'] },
    { t: 'type', en: 'thirty-five', es: 'treinta y cinco' },
    { t: 'type', en: 'a small beer', es: 'una caña' },
    { t: 'match', pairs: [['¿Cuánto es?', 'How much is it?'], ['Aquí tiene', 'Here you go'], ['¿Algo más?', 'Anything else?'], ['sin gas', 'still (water)']] }
  ]}
  ]},

/* ----- A1, mapped: written by Claude when you get there, from how you're doing ----- */
{ id: 'u4', level: 'A1', n: 4, title: 'Where and how', place: 'Directions in the hotel · how people feel', can: ['Say where things and people are', 'Say how you and others feel', 'Choose ser or estar'], grammar: 'estar (location, feelings, conditions) vs ser; al/del; possession with de', words: 'places in a hotel and city, feelings, aquí/ahí/allí', rules: ['serestar', 'aldel'] },
{ id: 'u5', level: 'A1', n: 5, title: 'My day', place: 'Your routine, shifts and training', can: ['Describe a normal day', 'Say what time things happen', 'Say how often you do things'], grammar: 'regular present tense -ar/-er/-ir, telling the time, days, frequency words', words: 'daily routine, times, days, work and training verbs', rules: ['verbs', 'numtime'] },
{ id: 'u6', level: 'A1', n: 6, title: 'Likes and wants', place: 'Food, music, free time', can: ['Say what you like and love', 'Say what you want and have to do', 'Make plans: voy a…'], grammar: 'gustar/encantar, querer/poder/tener que + infinitive, ir a + infinitive', words: 'hobbies, food, music, plans', rules: ['gustar', 'tener', 'ir'] },
{ id: 'u7', level: 'A1', n: 7, title: 'This, that, mine', place: 'Lost property · handing things over', can: ['Point at things near and far', 'Say whose something is', 'Describe things in detail'], grammar: 'este/ese/aquel, possessives mi/mío, adjective agreement', words: 'objects, colours, clothes, materials', rules: ['demos', 'possess', 'adjectives'] },
{ id: 'u8', level: 'A1', n: 8, title: 'Asking questions', place: 'Helping guests · small talk', can: ['Ask who, what, where, when, how, why', 'Choose qué or cuál', 'Ask about anything politely'], grammar: 'question words, qué vs cuál, prepositions before question words', words: 'question words, common answers', rules: ['cualque', 'prepq', 'accents'] },
{ id: 'u9', level: 'A1', n: 9, title: 'Going out', place: 'Meeting friends · getting around', can: ['Say where you\'re going and coming from', 'Make and change plans', 'Use the most common irregular verbs'], grammar: 'ir, venir, salir, hacer (g-club), boot verbs, a/en/de', words: 'transport, places, invitations', rules: ['verbs', 'aende', 'ir'] },
{ id: 'u10', level: 'A1', n: 10, title: 'A1 challenge', place: 'A full shift in Spanish', can: ['Hold a simple conversation about yourself', 'Handle a guest from arrival to bill'], grammar: 'review of everything in A1, with your weakest topics weighted', words: 'review', rules: [] },
/* ----- A2 ----- */
{ id: 'u11', level: 'A2', n: 11, title: 'My routine', place: 'Mornings, training, getting ready', can: ['Describe your routine with reflexive verbs'], grammar: 'reflexive verbs (me levanto, me ducho), stem changes in reflexives', words: 'body, getting ready, sleep', rules: ['verbs'] },
{ id: 'u12', level: 'A2', n: 12, title: 'Give it to me', place: 'Serving and passing things', can: ['Replace nouns with lo, la, le', 'Use two pronouns together'], grammar: 'direct and indirect object pronouns, se lo, personal a', words: 'service verbs: dar, traer, servir, pedir', rules: ['objpron'] },
{ id: 'u13', level: 'A2', n: 13, title: 'What I\'ve done today', place: 'End-of-shift handover', can: ['Say what you have done', 'Report on the day'], grammar: 'present perfect (he hecho), irregular participles', words: 'tasks, problems, results', rules: ['acabar'] },
{ id: 'u14', level: 'A2', n: 14, title: 'Last weekend', place: 'Telling a story', can: ['Say what happened at a point in the past'], grammar: 'preterite regular + top irregulars (fui, hice, tuve)', words: 'time expressions, events', rules: [] },
{ id: 'u15', level: 'A2', n: 15, title: 'When I was younger', place: 'Childhood and where you grew up', can: ['Describe how things used to be'], grammar: 'imperfect tense, imperfect vs preterite', words: 'family, places, habits', rules: [] },
{ id: 'u16', level: 'A2', n: 16, title: 'Better, faster, stronger', place: 'Training progress · comparing', can: ['Compare people and things', 'Say the best and the worst'], grammar: 'comparisons (más… que, tan… como), superlatives, mejor/peor', words: 'fitness, measurements, opinions', rules: ['muymucho'] },
{ id: 'u17', level: 'A2', n: 17, title: 'Plans and predictions', place: 'Goals, races, the future', can: ['Talk about the future and goals'], grammar: 'future tense, ir a vs future', words: 'goals, time ahead', rules: ['ir'] },
{ id: 'u18', level: 'A2', n: 18, title: 'Instructions', place: 'Coaching a client · recipes', can: ['Give instructions and advice'], grammar: 'imperative (tú and usted), deber, hay que', words: 'exercises, cooking, directions', rules: ['objpron'] },
{ id: 'u19', level: 'A2', n: 19, title: 'por or para?', place: 'Reasons, purposes, deadlines', can: ['Choose por or para every time'], grammar: 'por vs para in full', words: 'reasons, travel, time', rules: ['porpara'] },
{ id: 'u20', level: 'A2', n: 20, title: 'A2 challenge', place: 'Your life story in Spanish', can: ['Talk about past, present and future with confidence'], grammar: 'A2 review, weighted to your weakest topics', words: 'review', rules: [] },
/* ----- B1 ----- */
{ id: 'u21', level: 'B1', n: 21, title: 'I want you to…', place: 'Requests and wishes', can: ['Say what you want others to do'], grammar: 'present subjunctive after querer que, esperar que, ojalá', words: 'wishes, feelings', rules: ['gustar'] },
{ id: 'u22', level: 'B1', n: 22, title: 'I would…', place: 'Polite requests · dreams', can: ['Be extra polite', 'Talk about what you would do'], grammar: 'conditional (me gustaría, podría)', words: 'travel, ambitions', rules: [] },
{ id: 'u23', level: 'B1', n: 23, title: 'If I had…', place: 'Hypotheticals', can: ['Talk about imaginary situations'], grammar: 'si + imperfect subjunctive + conditional', words: 'money, choices, life', rules: [] },
{ id: 'u24', level: 'B1', n: 24, title: 'I think that…', place: 'Opinions and debates', can: ['Give and defend opinions', 'Agree and disagree'], grammar: 'creo que / no creo que, connectors (aunque, sino, sin embargo)', words: 'opinion phrases, connectors', rules: ['perosino', 'relatives'] },
{ id: 'u25', level: 'B1', n: 25, title: 'Telling it well', place: 'Stories with detail', can: ['Tell a story that flows'], grammar: 'past perfect, relative pronouns, time connectors', words: 'storytelling', rules: ['relatives'] },
{ id: 'u26', level: 'B1', n: 26, title: 'B1 challenge', place: 'Real conversations', can: ['Chat comfortably on familiar topics'], grammar: 'B1 review, weighted to your weakest topics', words: 'review', rules: [] }
],
// Listening suggestions by level (search these by name in Spotify / YouTube).
listen: {
  A1: ['Dreaming Spanish — Superbeginner videos', 'Coffee Break Spanish — Season 1', 'Language Transfer — Complete Spanish (audio)', 'Songs you already know — read the lyrics while you listen'],
  A2: ['Dreaming Spanish — Beginner', 'LearnCraft Spanish podcast', 'Españolistos podcast', 'Easy Spanish street interviews (YouTube)'],
  B1: ['Dreaming Spanish — Intermediate', 'Hoy Hablamos podcast', 'Spanish TV with Spanish subtitles', 'Native podcasts on topics you love']
},
interests: [['work', '🏨 Hotel & bar work'], ['fitness', '💪 Gym & training'], ['running', '🏃 Running'], ['combat', '🥊 Kickboxing & MMA'], ['music', '🎵 Music'], ['travel', '✈️ Travel'], ['food', '🍽️ Food & cooking'], ['social', '🎉 Going out & friends'], ['film', '🎬 TV & films'], ['business', '📈 Business & content']]
};
