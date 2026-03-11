# Mission Control Backlog v2

## Next-10 (Visual WOW)

- #03 CRT SCANLINE THEME LAYER — швидкий глобальний “поліш” атмосфери без важкої графіки.
- #17 SYNTH PULSE HUD — додає живий ритм прогресу на Dashboard з мінімальною логікою.
- #43 NEON SPARKLINES — cheap-win: робить картки “дорогими” візуально майже без ризиків.
- #30 CALENDAR STREAK RIBBON (Upgrade) — підсилює календар, робить streak візуально відчутним.
- #59 CALENDAR “REPLAY” (Upgrade) — вау-анімація місяця, сильно піднімає “mission control” вайб.
- #34 VICTORY CEREMONY (Upgrade) — ключовий момент продукту, перетворює фініш у подію.
- #57 SKIA HOLOGRID BACKGROUND — фірмовий фон-стиль, але потребує оптимізації.
- #42 VAULT HEAT (Skia) — сильний Skia-візуал для дашборду/аналітики.
- #25 HOLO BADGES — візуально “продає” прогрес/нагороди в профілі.
- #39 VAULT MAP — дає відчуття “станції” і розблоковуваних модулів.

## EPIC: NEURAL COMMS (MINI CHAT) — NETRUNNER COACH

Hybrid: offline rule-based by default + optional Neural mode (API) when internet is available and user explicitly enabled it. Default privacy: BLACKOUT lens (numbers masked).

#MC-01 COMMS TAB + FLOATING PING — [M] [Impact:5] [UI] Окремий таб `COMMS` + плаваюча кнопка на Dashboard, яка відкриває чат з контекстом поточного goal.
#MC-02 BLACKOUT LENS (Default-On) — [S] [Impact:5] [UI] У чаті все за замовчуванням без сум: ████, тільки % прогресу і тренди; “Full numbers” вмикається окремим тумблером.
#MC-03 CONTEXT CAPSULE — [S] [Impact:4] [Analytics] Перед відповіддю показує 3–5 капсул: Drift, Confidence, Streak Risk, Last 7d Signal, щоб було ясно, на чому базується порада.
#MC-04 DRIFT DECODER — [M] [Impact:5] [Analytics] Пояснює “чому ти Behind/Ahead” і дає 1–2 конкретні дії без моралізаторства.
#MC-05 DEPOSIT RECOMMENDER (Today’s Move) — [M] [Impact:5] [Analytics] Радить суму на сьогодні (min/comfort/aggressive) з урахуванням темпу, плану, місій і контракту; завжди кнопка APPLY з підтвердженням.
#MC-06 WEEKLY MISSION FORGE — [L] [Impact:5] [Gamification] Генерує місії на тиждень “під тебе”: офлайн (rule-based) або Neural; показує прогноз складності й нагороду.
#MC-07 MONTHLY DEBRIEF REPORT — [M] [Impact:5] [Analytics] Місячний дебриф: що спрацювало, де були збої, топ-вектори/настрої, 3 рекомендації; кнопка EXPORT (Pro: Netrunner skin).
#MC-08 IMPORT TRIAGE CONSOLE — [M] [Impact:5] [Analytics] Після імпорту пояснює “що пішло не так” людською мовою і пропонує safe-fix варіанти; нічого не править без APPLY.
#MC-09 APPLY PATCH WORKFLOWS — [L] [Impact:5] [UI] Чат як patcher: створити Savings Plan, додати нотатку/тег/муд, запропонувати зміни; все через Preview -> Apply -> Undo.
#MC-10 UNDO BUFFER (Last 5 Ops) — [M] [Impact:5] [UI] Після будь-якого APPLY дає швидкий UNDO (локальний буфер останніх 5 операцій).
#MC-11 MOOD CORRELATION HINTS — [M] [Impact:4] [Analytics] Локально шукає зв’язки mood/теги -> стабільність/дріфт і підсвічує 1 конкретний патерн.
#MC-12 STREAK RISK BRIEF — [S] [Impact:4] [Gamification] Короткі ризик-бріфи: streak під загрозою, які щити/грейс доступні, що буде якщо пропустити (особливо для Rogue).
#MC-13 SMART REPLIES (One-Tap Chips) — [S] [Impact:4] [UI] Під відповіддю 3 швидкі чіпи: WHY?, SHOW TREND, APPLY PLAN, щоб чат був швидким.
#MC-14 NEURAL MODE GATE — [S] [Impact:5] [Monetization] Перемикач Neural: OFF/ON + пояснення, які дані підуть в API (агрегати/транзакції/повні числа) і ліміт free 5/день.
#MC-15 QUOTA + COOLdown HUD — [S] [Impact:4] [Monetization] Лічильник запитів (free/pro), cooldown і локальний кеш відповідей, щоб не спамити API.
#MC-16 PRO: WHAT-IF DIALOG FLOWS — [L] [Impact:5] [Monetization] У чаті запускається Pro-сценарій what-if: діапазони сум/днів/ризику, повертає bands і confidence.
#MC-17 PRO: EXPORT “NETRUNNER DOSSIER” — [M] [Impact:4] [Monetization] Експорт дебрифу/аналітики як styled report, без блокування базового експорту.
#MC-18 SAFETY RAILS (No Shame) — [S] [Impact:4] [UI] Стиль відповідей підтримуючий; для ризикових дій завжди Preview і м’яке попередження.
## Full List (60)

#01 BLACKOUT MODE — [S] [Impact:4] [UI] Швидкий тумблер “прибрати всі суми”: замість цифр показує ████ і лише % прогресу (для публічних місць).
#02 GHOST DEPOSIT — [S] [Impact:3] [Gamification] “Тихий депозит”: без анімацій, без звуків, мінімальний UX, але зараховує streak і місії.
#03 CRT SCANLINE THEME LAYER — [S] [Impact:3] [UI] Візуальний шар CRT: scanlines + легкий noise + chromatic aberration (без зміни логіки).
#04 NEON SOUND PACKS — [S] [Impact:4] [Monetization] Локальні sound‑паки (UI/Deposit/Victory/Failure) як косметика; базові звуки залишаються безкоштовними.
#05 HAPTIC PROFILES — [S] [Impact:3] [UI] Профілі вібрацій: Soft / Tactical / Brutal для депозитів, рекордів, попереджень.
#06 QUICK ACTION BAR — [S] [Impact:4] [UI] “Оперативна панель” на Dashboard: 3 кастомні кнопки швидких сум (користувач редагує).
#07 VAULT LOCK (BIOMETRIC) — [M] [Impact:5] [Gamification] Лок‑екран з expo-local-authentication: “доступ до сейфу” через біометрію/пін, опційно.
#08 DECOY VAULT — [M] [Impact:4] [Gamification] Фейковий “декой” профіль: інша тема, інші дані‑приманка (щоб безпечно показати UI друзям).
#09 DATA VAULT SNAPSHOTS — [M] [Impact:5] [Analytics] Авто‑снапшоти локальних даних (щодня/щотижня) з відкатом “Restore point” без імпорту файлів.
#10 SIGNAL HEALTH MONITOR — [S] [Impact:3] [Analytics] Невеликий індикатор “Health”: цілісність даних, остання зміна, розмір сховища, кількість транзакцій.
#11 OPERATOR NOTES — [M] [Impact:4] [Gamification] Нотатки до депозитів як “After‑Action Log” (швидкі теги + короткий текст), повністю офлайн.
#12 INTENT TAGS (VECTORS) — [M] [Impact:4] [Analytics] “Вектори інвестицій” для депозитів (наприклад GPU, PS5, FOCUS): фільтри, підсумки, топ‑вектори.
#13 TEMPTATION LEAKS — [M] [Impact:4] [Gamification] Опційні “витоки” (негативні події) як лор‑механіка: не бюджет, а “системні втрати” з аналітикою контролю.
#14 LEAK SHIELD — [M] [Impact:3] [Gamification] Раз на тиждень можна “заблокувати витік” (символічно) і отримати косметичну нагороду за самоконтроль.
#15 GOAL BLUEPRINTS — [M] [Impact:4] [Analytics] “Blueprint” план: користувач задає етапи (25/50/75/100 або власні), а UI показує прогрес по етапах.
#16 MULTI‑ITEM LOADOUT — [L] [Impact:5] [Analytics] Одна ціль як “loadout” з 3–8 предметів (ціни задає користувач), прогрес по кожному модулю і загальний.
#17 SYNTH PULSE HUD — [S] [Impact:3] [UI] На Dashboard тонкий “пульс‑бар” що реагує на прогрес: чим ближче до 100%, тим стабільніший ритм.
#18 VAULT TEMPERATURE — [M] [Impact:4] [Gamification] Локальна метрика “температури дисципліни”: росте від регулярності, падає від пропусків; впливає на візуали.
#19 OVERCLOCK SESSION — [M] [Impact:4] [Gamification] Режим на 7 днів: “депозит щодня мінімум X”, дає косметичні токени при успіху.
#20 FAIL‑SAFE RECOVERY FLOW — [M] [Impact:5] [Analytics] Вбудований “Data Recovery”: якщо імпорт/відновлення частково зламалося, пропонує відкат до останнього снапшоту.
#21 ANOMALY TIMELINE — [M] [Impact:4] [Analytics] Окрема шкала “аномалій”: дні зі стрибками/провалами, з поясненням на основі локальних правил.
#22 PERSONAL OPS SCORE — [M] [Impact:4] [Gamification] Загальний “оперативний рейтинг” (не гроші): комбо‑серії, виконані місії, дисципліна, стабільність.
#23 COSMETIC TOKENS SHOP — [M] [Impact:4] [Monetization] Крамниця косметики за токени: неонові рамки, фони, FX‑перемоги; Pro дає ексклюзиви.
#24 THEME MODS (PATCHES) — [M] [Impact:3] [UI] “Моди” до тем: додаткові ефекти (grain, bloom, gradient) як дрібні тумблери.
#25 HOLO BADGES — [S] [Impact:3] [UI] Колекція “бейджів” на профілі: значки за серії/етапи, з анімацією підсвічування.
#26 STREAK RELICS — [M] [Impact:4] [Gamification] “Реліквії” за streak‑рекорди: разові предмети, що дають косметичні ефекти або символічні бусти.
#27 TIMELINE REWIND VIEW — [M] [Impact:4] [Analytics] Перегляд “rewind”: прокрутка тижнів/місяців як стрічка подій з сумами, рекордами, нотатками.
#28 NEON TREND LENS — [M] [Impact:4] [Analytics] “Лінза” трендів: показує, які дні/часи найчастіше стаються депозити, без мережі.
#29 DUAL‑GOAL COUPLING (Upgrade) — [M] [Impact:4] [Analytics] Для dual goal: режим “coupled” (один депозит розподіляється за правилами: 70/30, за відставанням, по черзі).
#30 CALENDAR STREAK RIBBON (Upgrade) — [S] [Impact:3] [UI] У календарі візуальний “ribbon” ланцюжка streak‑днів (без нової логіки, лише richer UI).
#31 MOOD SPECTRUM (Upgrade) — [M] [Impact:4] [Analytics] Mood log: не просто список, а спектр (кольори) + кореляція “настрій → стабільність депозитів”.
#32 INSIGHTS PLAYBOOK (Upgrade) — [M] [Impact:4] [Analytics] Інсайти перетворюються на “playbook”: кожен інсайт має кнопку “застосувати” (налаштування/план/місію).
#33 SAVINGS PLAN COMPILER (Upgrade) — [L] [Impact:5] [Analytics] Savings plan як “компілятор”: бере ціль/дедлайн/дні тижня і генерує план‑графік + перевірку здійсненності.
#34 VICTORY CEREMONY (Upgrade) — [L] [Impact:5] [UI] Екран перемоги як церемонія: 3‑фазна анімація (scan, unlock, broadcast), локальний “сертифікат” рекорду.
#35 RECORDS GHOST RUN (Upgrade) — [M] [Impact:4] [Gamification] Records: “ghost run” порівняння з твоїм найкращим періодом (тиждень‑рекорд) як суперник‑привид.
#36 DAILY CHALLENGE CHAINS (Upgrade) — [L] [Impact:5] [Gamification] Daily challenge: ланцюжки 3/7/14 днів з “ризиком” і більшими нагородами, без мережі.
#37 MICRO‑RITUALS — [S] [Impact:3] [Gamification] Короткі “ритуали” перед депозитом: 1‑кнопкові підтвердження (“FOCUS”, “DISCIPLINE”), додають flavor і статистику.
#38 OPERATOR STATUS EFFECTS — [S] [Impact:3] [UI] Статуси “Calm/Focused/Overheated” змінюють підсвічування UI залежно від поведінки (стабільність/дріфт).
#39 VAULT MAP — [M] [Impact:4] [UI] Мапа прогресу як “станція”: модулі розблоковуються (Analytics Bay, Missions Hub, Themes Lab) візуально, але все локально.
#40 FOCUS TIMER (DEEP WORK) — [M] [Impact:4] [Gamification] Таймер “Focus Session” 10–25 хв: після завершення пропонує зробити депозит або планування, з локальною статистикою.
#41 STABILITY INDEX — [M] [Impact:5] [Analytics] Індекс стабільності: варіативність депозитів (частота/розкид сум) і короткі рекомендації без мережі.
#42 VAULT HEAT (Skia) — [L] [Impact:4] [UI] Skia‑візуал “heat field”: активність депозитів як пульсуюче поле на дашборді/аналітиці.
#43 NEON SPARKLINES — [S] [Impact:3] [UI] Маленькі sparkline‑графіки на картках (тиждень/місяць) з glow.
#44 BATCH OPS — [M] [Impact:4] [Analytics] Пакетні операції: “розбити депозит на 3 дні”, “злити 2 транзакції”, “перенести між цілями” з аудит‑логом.
#45 AUDIT TRAIL — [M] [Impact:4] [Analytics] Локальний журнал змін: хто/коли (тобто “операція”), що було змінено (edit/delete/import), для довіри.
#46 VAULT SIGNALS (Offline) — [M] [Impact:4] [Gamification] “Сигнали” як внутрішні події: коли ти відстаєш, система генерує локальні mini‑місії‑підказки (без нотіфікацій).
#47 PROVAULT COSMETICS — [M] [Impact:4] [Monetization] Pro дає “exclusive cosmetics”: holo‑рамки, glitch‑підписи, FX‑перемоги, але не блокує базові фічі.
#48 DATA COMPRESSION MODE — [S] [Impact:2] [Analytics] Опція “компресувати історію”: агрегує дуже старі записи у місячні підсумки (без втрати total), щоб UI був швидший.
#49 ARCHIVE REACTIVATION RITUAL (Upgrade) — [S] [Impact:3] [Gamification] Повернення архівної цілі як “ритуал”: коротка анімація + підтвердження правил.
#50 GOAL DNA — [M] [Impact:4] [Analytics] “DNA” цілі: профіль депозитів (частота, середня, стабільність, піки) як компактний неон‑паспорт.
#51 VECTOR RANKS — [M] [Impact:4] [Gamification] Ранги по “векторам” (наприклад GPU Vector Rank росте від депозитів з цим тегом), чисто косметично.
#52 OPERATOR LOADOUT (Profile) — [S] [Impact:3] [UI] Екран профілю як “loadout”: вибір аватара‑силуету, титулу, бейджів, теми, звуку.
#53 VAULT COMMS (Local) — [S] [Impact:2] [UI] “Comms feed” всередині апки: короткі системні повідомлення (unlock/records/alerts) як стрічка, без пушів.
#54 TERMINAL EXPORT STYLES — [M] [Impact:4] [Monetization] Експорт (локальний) з різними “скинами” звіту: Netrunner / Corporate / Minimal (Pro скіни).
#55 CHRONO FILTERS — [S] [Impact:3] [Analytics] Швидкі фільтри часу: Last 7 / 30 / Quarter / Custom, з неоновими чіпами та миттєвими підсумками.
#56 VAULT QUEST EDITOR — [L] [Impact:5] [Gamification] Редактор локальних місій: користувач створює власні контракти/квести (умова, нагорода, трекінг).
#57 SKIA HOLOGRID BACKGROUND — [L] [Impact:4] [UI] Анімований holo‑grid фон (Skia) з реакцією на скрол/тапи, без постійного навантаження.
#58 ANTI‑BURNOUT MODE — [M] [Impact:4] [Gamification] Режим проти вигорання: система сама знижує “тиск” місій, якщо бачить спад активності (офлайн евристики).
#59 CALENDAR “REPLAY” (Upgrade) — [M] [Impact:4] [UI] “Replay month”: місяць програється як анімація, підсвічуючи дні депозитів і ключові події.
#60 VAULT AI‑LESS COACH — [M] [Impact:5] [Analytics] Локальний “коуч” без AI: набір правил, що генерує короткі поради (стабільність, дріфт, ритуали), з кіберпанк‑лексикою.

