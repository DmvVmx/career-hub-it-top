let devFunGameState = null;
let devFunKeysBound = false;
let devFunKeys = new Set();

let devFunView = 'hub';
let devFunSelectedMode = 'normal';

let devFunCustomSettings = {
  targetScore: 100,
  lives: 3,
  time: 60,
  speedMultiplier: 1,
};

const DEV_FUN_MODES = {
  easy: {
    id: 'easy',
    label: 'Лёгкий',
    short: 'Для разминки',
    description: 'Больше времени, больше жизней и спокойная скорость.',
    targetScore: 80,
    lives: 5,
    time: 75,
    speedMultiplier: 0.8,
    emoji: '🌱',
    colorClass: 'border-green-200 bg-green-50',
    badgeClass: 'app-badge app-badge-success',
  },
  normal: {
    id: 'normal',
    label: 'Нормальный',
    short: 'Баланс',
    description: 'Оптимальный режим: не слишком легко и не слишком жёстко.',
    targetScore: 100,
    lives: 3,
    time: 60,
    speedMultiplier: 1,
    emoji: '⚡',
    colorClass: 'border-blue-200 bg-blue-50',
    badgeClass: 'app-badge app-badge-warning',
  },
  hard: {
    id: 'hard',
    label: 'Сложный',
    short: 'Для сильных',
    description: 'Быстрее предметы, меньше жизней и выше цель по XP.',
    targetScore: 130,
    lives: 2,
    time: 55,
    speedMultiplier: 1.35,
    emoji: '🔥',
    colorClass: 'border-red-200 bg-red-50',
    badgeClass: 'app-badge app-badge-danger',
  },
  custom: {
    id: 'custom',
    label: 'Кастомный',
    short: 'Свои правила',
    description: 'Настрой цель, жизни, время и скорость под себя.',
    targetScore: 100,
    lives: 3,
    time: 60,
    speedMultiplier: 1,
    emoji: '🛠️',
    colorClass: 'border-purple-200 bg-purple-50',
    badgeClass: 'app-badge',
  },
};

function renderStudentDevFunTab() {
  if (devFunView === 'pixel_battle') {
    return renderDevFunPixelBattleShell();
  }

  if (devFunView === 'internship_game') {
    return renderDevFunInternshipGameScreen();
  }

  return renderDevFunHub();
}

function renderDevFunPixelBattleShell() {
  return `
    <div id="pixelBattleRoot">
      <div class="app-card">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-3xl bg-purple-100 flex items-center justify-center text-3xl">
            🟪
          </div>

          <div>
            <h3 class="text-2xl font-black text-slate-900">
              Загружаем Pixel Battle...
            </h3>
            <p class="text-slate-600 mt-1">
              Получаем кланы, сезон, полотно и лидерборд.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderDevFunHub() {
  return `
    <div class="space-y-6">
      <section class="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-6 md:p-8 shadow-xl">
        <div class="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-purple-500/30 blur-3xl"></div>
        <div class="absolute bottom-0 left-20 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl"></div>
        <div class="absolute inset-0 opacity-[0.08]" style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 28px 28px;"></div>

        <div class="relative flex items-start justify-between gap-6 flex-wrap">
          <div class="max-w-3xl">
            <div class="inline-flex items-center rounded-full bg-white/10 text-white border border-white/15 px-3 py-1 text-xs font-bold">
              🎮 Вкладка от разработчика
            </div>

            <h3 class="mt-5 text-4xl md:text-5xl font-black text-white tracking-tight">
              Приколы разработчика
            </h3>

            <p class="mt-4 text-slate-300 max-w-2xl leading-8">
              Тут будут мини-игры, пасхалки, полезные карточки и маленькие штуки,
              которые делают Career Hub живым, а не просто таблицей вакансий.
            </p>

            <div class="mt-6 flex gap-3 flex-wrap">
              <span class="rounded-2xl bg-white/10 border border-white/15 px-4 py-2 text-sm font-bold text-white">
                mini-games
              </span>
              <span class="rounded-2xl bg-white/10 border border-white/15 px-4 py-2 text-sm font-bold text-white">
                pixel style
              </span>
              <span class="rounded-2xl bg-white/10 border border-white/15 px-4 py-2 text-sm font-bold text-white">
                dev fun
              </span>
            </div>
          </div>

          <div class="w-full md:w-[280px] rounded-[2rem] bg-white/10 border border-white/15 p-5 backdrop-blur">
            <div class="text-xs text-slate-300 font-bold uppercase tracking-wide">
              Dev build
            </div>
            <div class="mt-2 text-3xl font-black text-white">
              fun_03
            </div>
            <div class="mt-2 text-sm text-slate-300 leading-6">
              Раздел с мини-играми, Pixel Battle и будущими пасхалками.
            </div>
          </div>
        </div>
      </section>

      <section class="grid xl:grid-cols-[1.2fr_0.8fr] gap-5">
        ${renderDevFunFeaturedGameCard()}

        <div class="grid gap-5">
          ${renderDevFunPixelBattleCard()}

          ${renderDevFunSoonMiniCard({
            icon: '💡',
            title: 'Совет дня',
            text: 'Короткие советы по резюме, откликам, собеседованиям и первым проектам.',
          })}

          ${renderDevFunSoonMiniCard({
            icon: '🏆',
            title: 'Квесты Career Hub',
            text: 'Достижения за резюме, первый отклик, скачанный PDF и принятые приглашения.',
          })}
        </div>
      </section>
    </div>
  `;
}

function renderDevFunFeaturedGameCard() {
  return `
    <article class="relative overflow-hidden rounded-[2rem] border border-purple-100 bg-white shadow-sm">
      <div class="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50"></div>
      <div class="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-purple-200 blur-3xl opacity-60"></div>
      <div class="absolute -left-16 bottom-0 w-52 h-52 rounded-full bg-blue-200 blur-3xl opacity-50"></div>

      <div class="relative p-6 md:p-7">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-4">
            <div class="w-20 h-20 rounded-[1.7rem] bg-slate-950 text-white flex items-center justify-center text-4xl shadow-xl">
              🎮
            </div>

            <div>
              <span class="app-badge app-badge-success">Доступно</span>
              <h4 class="mt-2 text-3xl font-black text-slate-900 tracking-tight">
                Собери стажировку
              </h4>
            </div>
          </div>

          <div class="rounded-2xl bg-white/80 border border-slate-200 px-4 py-3 text-sm">
            <div class="font-black text-slate-900">Цель</div>
            <div class="text-slate-500">100 XP = оффер</div>
          </div>
        </div>

        <p class="mt-5 text-slate-600 leading-8 max-w-3xl">
          Пиксельная мини-игра про путь студента к первой стажировке:
          собирай навыки, резюме и интервью, избегай багов, дедлайнов и ошибки 500.
        </p>

        <div class="mt-6 grid md:grid-cols-3 gap-3">
          <div class="rounded-3xl bg-white/80 border border-slate-200 p-4">
            <div class="text-3xl">🧠</div>
            <div class="mt-3 font-black text-slate-900">Собирай навыки</div>
            <div class="mt-1 text-sm text-slate-500 leading-6">
              HTML, CSS, JS, Python и Git дают XP.
            </div>
          </div>

          <div class="rounded-3xl bg-white/80 border border-slate-200 p-4">
            <div class="text-3xl">📄</div>
            <div class="mt-3 font-black text-slate-900">Лови резюме</div>
            <div class="mt-1 text-sm text-slate-500 leading-6">
              Resume и Interview дают больше всего очков.
            </div>
          </div>

          <div class="rounded-3xl bg-white/80 border border-slate-200 p-4">
            <div class="text-3xl">🐞</div>
            <div class="mt-3 font-black text-slate-900">Избегай багов</div>
            <div class="mt-1 text-sm text-slate-500 leading-6">
              Bug, Deadline, undefined и 500 отнимают жизни.
            </div>
          </div>
        </div>

        <div class="mt-7 flex items-center justify-between gap-4 flex-wrap">
          <button
            type="button"
            data-dev-fun-open-game="internship_game"
            class="app-button app-button-primary"
          >
            Играть
          </button>

          <div class="text-sm text-slate-500">
            Управление: стрелки или A / D
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderDevFunPixelBattleCard() {
  return `
    <article class="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-white p-5 shadow-sm hover:shadow-lg transition">
      <div class="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-blue-100 blur-2xl opacity-80"></div>
      <div class="absolute -left-10 bottom-0 w-32 h-32 rounded-full bg-purple-100 blur-2xl opacity-70"></div>

      <div class="relative">
        <div class="flex items-start gap-4">
          <div class="w-16 h-16 rounded-3xl bg-slate-950 text-white flex items-center justify-center text-3xl shadow-lg">
            🟪
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-3">
              <h4 class="text-xl font-black text-slate-900">
                Pixel Battle IT TOP
              </h4>

              <span class="app-badge app-badge-success">Доступно</span>
            </div>

            <p class="mt-2 text-sm text-slate-600 leading-6">
              Общее пиксельное полотно студентов. Выбери клан, ставь пиксели раз в 20 секунд и борись за лидерство сезона.
            </p>
          </div>
        </div>

        <div class="mt-5 grid grid-cols-3 gap-2">
          <div class="rounded-2xl bg-white/80 border border-slate-200 p-3 text-center">
            <div class="text-lg">🎨</div>
            <div class="mt-1 text-xs font-black text-slate-900">Палитра</div>
          </div>

          <div class="rounded-2xl bg-white/80 border border-slate-200 p-3 text-center">
            <div class="text-lg">⏱️</div>
            <div class="mt-1 text-xs font-black text-slate-900">20 сек</div>
          </div>

          <div class="rounded-2xl bg-white/80 border border-slate-200 p-3 text-center">
            <div class="text-lg">🏆</div>
            <div class="mt-1 text-xs font-black text-slate-900">Кланы</div>
          </div>
        </div>

        <button
          type="button"
          data-dev-fun-open-game="pixel_battle"
          class="app-button app-button-blue mt-5 w-full"
        >
          Открыть Pixel Battle
        </button>
      </div>
    </article>
  `;
}

function renderDevFunSoonMiniCard({ icon, title, text }) {
  return `
    <article class="app-card">
      <div class="flex items-start gap-4">
        <div class="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center text-3xl">
          ${icon}
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-3">
            <h4 class="text-xl font-black text-slate-900">
              ${safe(title)}
            </h4>

            <span class="app-badge">Скоро</span>
          </div>

          <p class="mt-2 text-sm text-slate-600 leading-6">
            ${safe(text)}
          </p>
        </div>
      </div>
    </article>
  `;
}

function renderDevFunInternshipGameScreen() {
  const mode = getDevFunCurrentMode();

  return `
    <div class="space-y-6">
      <section class="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 md:p-7 shadow-sm">
        <div class="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-blue-100 blur-3xl opacity-80"></div>

        <div class="relative">
          <button
            id="backToDevFunHubBtn"
            type="button"
            class="app-button mb-5"
          >
            ← Назад к приколам
          </button>

          <div class="flex items-start justify-between gap-5 flex-wrap">
            <div>
              <div class="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 text-xs font-bold">
                Мини-игра
              </div>

              <h3 class="mt-4 text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                Собери стажировку
              </h3>

              <p class="mt-3 text-slate-600 max-w-3xl leading-8">
                Выбери режим сложности, нажми старт и собери нужное количество XP.
                Хорошие предметы дают очки, плохие отнимают жизни.
              </p>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div class="app-mini-stat">
                <div class="app-mini-stat-label">XP</div>
                <div id="devFunScore" class="app-mini-stat-value">0</div>
              </div>

              <div class="app-mini-stat">
                <div class="app-mini-stat-label">Жизни</div>
                <div id="devFunLives" class="app-mini-stat-value">${mode.lives}</div>
              </div>

              <div class="app-mini-stat">
                <div class="app-mini-stat-label">Время</div>
                <div id="devFunTime" class="app-mini-stat-value">${mode.time}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      ${renderDevFunModePanel()}

      <section class="rounded-[2rem] border border-slate-200 bg-white shadow-xl overflow-hidden">
        <div class="p-5 md:p-6 border-b border-slate-200 bg-slate-950 text-white">
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="rounded-2xl bg-white/10 border border-white/15 px-3 py-1 text-sm font-black">
                  ${mode.emoji} ${mode.label}
                </span>
                <span class="rounded-2xl bg-white/10 border border-white/15 px-3 py-1 text-sm font-black">
                  Цель: ${mode.targetScore} XP
                </span>
                <span class="rounded-2xl bg-white/10 border border-white/15 px-3 py-1 text-sm font-black">
                  Скорость: x${mode.speedMultiplier}
                </span>
              </div>

              <p class="mt-3 text-sm text-slate-300">
                ${safe(mode.description)}
              </p>
            </div>

            <button
              id="devFunStartBtn"
              type="button"
              class="rounded-2xl bg-white text-slate-950 px-5 py-3 font-black hover:bg-slate-100 transition"
            >
              Начать игру
            </button>
          </div>
        </div>

        <div class="relative bg-slate-950">
          <canvas
            id="devFunGameCanvas"
            width="1100"
            height="620"
            class="w-full block"
            style="image-rendering: pixelated;"
          ></canvas>

          <div
            id="devFunOverlay"
            class="absolute inset-0 flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-5"
          >
            <div class="w-full max-w-xl rounded-[2rem] bg-white p-7 text-center shadow-2xl border border-slate-200">
              <div class="w-20 h-20 mx-auto rounded-[1.7rem] bg-slate-950 text-white flex items-center justify-center text-4xl">
                🎮
              </div>

              <h3 id="devFunModalTitle" class="mt-5 text-3xl font-black text-slate-900">
                Готов к стажировке?
              </h3>

              <p id="devFunModalText" class="mt-3 text-slate-600 leading-7">
                Выбери режим сложности и нажми “Старт”. Собери XP и не поймай баги.
              </p>

              <button
                id="devFunOverlayStartBtn"
                type="button"
                class="app-button app-button-primary mt-6"
              >
                Старт
              </button>
            </div>
          </div>
        </div>

        <div class="p-4 md:p-5 border-t border-slate-200 bg-white">
          <div class="flex items-center justify-between gap-3 flex-wrap text-sm text-slate-500">
            <div>
              Управление:
              <span class="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-xl bg-white border border-slate-200 font-black text-slate-900">←</span>
              <span class="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-xl bg-white border border-slate-200 font-black text-slate-900">→</span>
              или
              <span class="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-xl bg-white border border-slate-200 font-black text-slate-900">A</span>
              <span class="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-xl bg-white border border-slate-200 font-black text-slate-900">D</span>
            </div>

            <div class="font-bold text-slate-700">
              ${mode.targetScore} XP = оффер на стажировку
            </div>
          </div>
        </div>
      </section>

      ${renderDevFunLegendPanel()}
    </div>
  `;
}

function renderDevFunModePanel() {
  return `
    <section class="app-card">
      <div class="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <h4 class="text-2xl font-black text-slate-900">
            Выбор сложности
          </h4>

          <p class="mt-2 text-slate-600 leading-7">
            Сложность влияет на цель XP, количество жизней, время и скорость падения предметов.
          </p>
        </div>
      </div>

      <div class="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        ${Object.values(DEV_FUN_MODES).map((mode) => renderDevFunModeCard(mode)).join('')}
      </div>

      <div id="devFunCustomSettingsBlock" class="${devFunSelectedMode === 'custom' ? '' : 'hidden'} mt-5 rounded-[2rem] border border-purple-100 bg-purple-50 p-5">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h5 class="text-xl font-black text-purple-950">
              Кастомный режим
            </h5>
            <p class="mt-1 text-sm text-purple-800">
              Настрой игру под себя.
            </p>
          </div>

          <span class="app-badge">custom</span>
        </div>

        <div class="mt-5 grid md:grid-cols-4 gap-4">
          ${renderDevFunCustomInput('targetScore', 'Цель XP', 40, 300, devFunCustomSettings.targetScore)}
          ${renderDevFunCustomInput('lives', 'Жизни', 1, 10, devFunCustomSettings.lives)}
          ${renderDevFunCustomInput('time', 'Время', 20, 180, devFunCustomSettings.time)}
          ${renderDevFunCustomInput('speedMultiplier', 'Скорость', 0.5, 2.5, devFunCustomSettings.speedMultiplier, 0.1)}
        </div>
      </div>
    </section>
  `;
}

function renderDevFunModeCard(mode) {
  const selected = devFunSelectedMode === mode.id;

  return `
    <button
      type="button"
      data-dev-fun-mode="${mode.id}"
      class="text-left rounded-[1.7rem] border p-5 transition ${
        selected
          ? `${mode.colorClass} shadow-md ring-4 ring-blue-100`
          : 'bg-white border-slate-200 hover:bg-slate-50'
      }"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl">
          ${mode.emoji}
        </div>

        ${selected ? '<span class="app-badge app-badge-success">Выбран</span>' : ''}
      </div>

      <div class="mt-4 text-xl font-black text-slate-900">
        ${mode.label}
      </div>

      <div class="mt-1 text-sm font-bold text-slate-500">
        ${mode.short}
      </div>

      <div class="mt-4 grid grid-cols-3 gap-2 text-center">
        <div class="rounded-2xl bg-white/80 border border-slate-200 p-2">
          <div class="text-xs text-slate-500 font-bold">XP</div>
          <div class="font-black text-slate-900">${mode.targetScore}</div>
        </div>

        <div class="rounded-2xl bg-white/80 border border-slate-200 p-2">
          <div class="text-xs text-slate-500 font-bold">❤️</div>
          <div class="font-black text-slate-900">${mode.lives}</div>
        </div>

        <div class="rounded-2xl bg-white/80 border border-slate-200 p-2">
          <div class="text-xs text-slate-500 font-bold">сек</div>
          <div class="font-black text-slate-900">${mode.time}</div>
        </div>
      </div>
    </button>
  `;
}

function renderDevFunCustomInput(key, label, min, max, value, step = 1) {
  return `
    <div>
      <label class="block text-sm font-bold text-purple-900 mb-1">
        ${label}
      </label>
      <input
        type="number"
        data-dev-fun-custom="${key}"
        min="${min}"
        max="${max}"
        step="${step}"
        value="${value}"
        class="app-input bg-white"
      />
    </div>
  `;
}

function renderDevFunLegendPanel() {
  return `
    <section class="grid md:grid-cols-2 gap-4">
      <div class="app-card bg-green-50 border-green-100">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-3xl bg-white border border-green-100 flex items-center justify-center text-3xl">
            ✅
          </div>

          <div>
            <h4 class="text-xl font-black text-green-900">Лови</h4>
            <p class="mt-2 text-sm text-green-800 leading-6">
              HTML, CSS, JS, Python, Git, Resume и Interview дают XP.
            </p>
          </div>
        </div>
      </div>

      <div class="app-card bg-red-50 border-red-100">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-3xl bg-white border border-red-100 flex items-center justify-center text-3xl">
            ❌
          </div>

          <div>
            <h4 class="text-xl font-black text-red-900">Избегай</h4>
            <p class="mt-2 text-sm text-red-800 leading-6">
              Bug, Deadline, undefined и 500 отнимают жизни.
            </p>
          </div>
        </div>
      </div>
    </section>
  `;
}

function bindStudentDevFunActions() {
  if (devFunView === 'pixel_battle') {
    mountPixelBattleScreen();
    return;
  }

  document.querySelectorAll('[data-dev-fun-open-game]').forEach((button) => {
    button.addEventListener('click', async () => {
      stopDevFunGame();

      if (typeof stopPixelBattle === 'function') {
        stopPixelBattle();
      }

      devFunView = button.dataset.devFunOpenGame;
      await renderStudentDashboard(currentUser, 'dev_fun');
    });
  });

  const backBtn = document.getElementById('backToDevFunHubBtn');
  if (backBtn) {
    backBtn.addEventListener('click', async () => {
      stopDevFunGame();
      devFunView = 'hub';
      await renderStudentDashboard(currentUser, 'dev_fun');
    });
  }

  document.querySelectorAll('[data-dev-fun-mode]').forEach((button) => {
    button.addEventListener('click', async () => {
      stopDevFunGame();
      devFunSelectedMode = button.dataset.devFunMode;
      await renderStudentDashboard(currentUser, 'dev_fun');
    });
  });

  document.querySelectorAll('[data-dev-fun-custom]').forEach((input) => {
    input.addEventListener('input', () => {
      const key = input.dataset.devFunCustom;
      const value = Number(input.value);

      if (Number.isNaN(value)) return;

      devFunCustomSettings[key] = value;
      syncDevFunStatsFromMode();
      drawDevFunStartScreen();
    });
  });

  const startBtn = document.getElementById('devFunStartBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      startDevFunGame();
    });
  }

  const overlayStartBtn = document.getElementById('devFunOverlayStartBtn');
  if (overlayStartBtn) {
    overlayStartBtn.addEventListener('click', () => {
      startDevFunGame();
    });
  }

  const canvas = document.getElementById('devFunGameCanvas');
  if (canvas) {
    drawDevFunStartScreen();
    syncDevFunStatsFromMode();
  }

  if (!devFunKeysBound) {
    window.addEventListener('keydown', (event) => {
      devFunKeys.add(event.key);
    });

    window.addEventListener('keyup', (event) => {
      devFunKeys.delete(event.key);
    });

    devFunKeysBound = true;
  }
}

async function mountPixelBattleScreen() {
  const root = document.getElementById('pixelBattleRoot');

  if (!root) return;

  try {
    const html = await renderPixelBattleScreen();
    root.innerHTML = html;
    bindStudentPixelBattleActions();
  } catch {
    root.innerHTML = placeholderBlock(
      'Pixel Battle',
      'Не удалось открыть Pixel Battle.'
    );
  }
}

function getDevFunCurrentMode() {
  if (devFunSelectedMode === 'custom') {
    return {
      ...DEV_FUN_MODES.custom,
      targetScore: clampNumber(devFunCustomSettings.targetScore, 40, 300),
      lives: clampNumber(devFunCustomSettings.lives, 1, 10),
      time: clampNumber(devFunCustomSettings.time, 20, 180),
      speedMultiplier: clampNumber(devFunCustomSettings.speedMultiplier, 0.5, 2.5),
    };
  }

  return DEV_FUN_MODES[devFunSelectedMode] || DEV_FUN_MODES.normal;
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || min));
}

function syncDevFunStatsFromMode() {
  const mode = getDevFunCurrentMode();

  const scoreEl = document.getElementById('devFunScore');
  const livesEl = document.getElementById('devFunLives');
  const timeEl = document.getElementById('devFunTime');

  if (scoreEl) scoreEl.textContent = '0';
  if (livesEl) livesEl.textContent = mode.lives;
  if (timeEl) timeEl.textContent = mode.time;
}

function getDevFunElements() {
  return {
    canvas: document.getElementById('devFunGameCanvas'),
    score: document.getElementById('devFunScore'),
    lives: document.getElementById('devFunLives'),
    time: document.getElementById('devFunTime'),
    overlay: document.getElementById('devFunOverlay'),
    modalTitle: document.getElementById('devFunModalTitle'),
    modalText: document.getElementById('devFunModalText'),
    startBtn: document.getElementById('devFunStartBtn'),
    overlayStartBtn: document.getElementById('devFunOverlayStartBtn'),
  };
}

function stopDevFunGame() {
  if (devFunGameState) {
    devFunGameState.running = false;
  }

  devFunGameState = null;
  devFunKeys.clear();
}

function startDevFunGame() {
  const elements = getDevFunElements();
  if (!elements.canvas) return;

  const mode = getDevFunCurrentMode();

  if (elements.overlay) {
    elements.overlay.classList.add('hidden');
  }

  devFunGameState = {
    canvas: elements.canvas,
    ctx: elements.canvas.getContext('2d'),
    mode,
    player: {
      x: elements.canvas.width / 2 - 32,
      y: elements.canvas.height - 106,
      w: 64,
      h: 78,
      speed: 520,
      blink: 0,
    },
    drops: [],
    particles: [],
    score: 0,
    lives: mode.lives,
    timeLeft: mode.time,
    targetScore: mode.targetScore,
    speedMultiplier: mode.speedMultiplier,
    running: true,
    lastTime: performance.now(),
    spawnTimer: 0,
    gameTimer: 0,
    backgroundOffset: 0,
  };

  syncDevFunStats();
  requestAnimationFrame(devFunLoop);
}

function syncDevFunStats() {
  const elements = getDevFunElements();
  if (!devFunGameState) return;

  if (elements.score) elements.score.textContent = devFunGameState.score;
  if (elements.lives) elements.lives.textContent = devFunGameState.lives;
  if (elements.time) elements.time.textContent = devFunGameState.timeLeft;
}

function devFunRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnDevFunDrop() {
  const goodItems = [
    { label: 'HTML', xp: 8, icon: '</>', color: '#2563eb' },
    { label: 'CSS', xp: 8, icon: '{}', color: '#7c3aed' },
    { label: 'JS', xp: 10, icon: 'JS', color: '#d97706' },
    { label: 'Python', xp: 12, icon: 'Py', color: '#059669' },
    { label: 'Git', xp: 10, icon: 'Git', color: '#ea580c' },
    { label: 'Resume', xp: 15, icon: 'CV', color: '#0f766e' },
    { label: 'Interview', xp: 18, icon: 'HR', color: '#be123c' },
  ];

  const badItems = [
    { label: 'Bug', damage: 1, icon: 'BUG', color: '#dc2626' },
    { label: 'Deadline', damage: 1, icon: '!!!', color: '#991b1b' },
    { label: 'undefined', damage: 1, icon: 'NaN', color: '#7f1d1d' },
    { label: '500', damage: 1, icon: '500', color: '#b91c1c' },
  ];

  const isGood = Math.random() > 0.35;
  const source = isGood ? goodItems : badItems;
  const item = source[Math.floor(Math.random() * source.length)];
  const canvas = devFunGameState.canvas;

  devFunGameState.drops.push({
    ...item,
    good: isGood,
    x: devFunRandom(40, canvas.width - 120),
    y: -70,
    w: isGood ? 88 : 102,
    h: 52,
    vy: (devFunRandom(135, 245) + Math.min(devFunGameState.score, 140)) * devFunGameState.speedMultiplier,
    wobble: devFunRandom(0, Math.PI * 2),
    rotation: devFunRandom(-0.05, 0.05),
  });
}

function devFunRectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function addDevFunParticles(x, y, text, good) {
  for (let i = 0; i < 14; i++) {
    devFunGameState.particles.push({
      x,
      y,
      text: i === 0 ? text : '•',
      vx: devFunRandom(-110, 110),
      vy: devFunRandom(-170, -45),
      life: 0.95,
      good,
    });
  }
}

function updateDevFunGame(dt) {
  const state = devFunGameState;
  const player = state.player;
  const canvas = state.canvas;

  if (
    devFunKeys.has('ArrowLeft') ||
    devFunKeys.has('a') ||
    devFunKeys.has('A') ||
    devFunKeys.has('ф') ||
    devFunKeys.has('Ф')
  ) {
    player.x -= player.speed * dt;
  }

  if (
    devFunKeys.has('ArrowRight') ||
    devFunKeys.has('d') ||
    devFunKeys.has('D') ||
    devFunKeys.has('в') ||
    devFunKeys.has('В')
  ) {
    player.x += player.speed * dt;
  }

  player.x = Math.max(16, Math.min(canvas.width - player.w - 16, player.x));

  state.backgroundOffset += dt * 28;
  state.spawnTimer += dt;
  state.gameTimer += dt;
  player.blink += dt;

  const spawnEvery = Math.max(0.25, 0.78 - state.score / 300) / state.speedMultiplier;

  if (state.spawnTimer >= spawnEvery) {
    state.spawnTimer = 0;
    spawnDevFunDrop();
  }

  if (state.gameTimer >= 1) {
    state.gameTimer = 0;
    state.timeLeft -= 1;
    syncDevFunStats();
  }

  state.drops.forEach((drop) => {
    drop.y += drop.vy * dt;
    drop.wobble += dt * 4;
    drop.x += Math.sin(drop.wobble) * 0.9;
  });

  state.drops = state.drops.filter((drop) => {
    if (devFunRectsOverlap(player, drop)) {
      if (drop.good) {
        state.score += drop.xp;
        addDevFunParticles(drop.x + drop.w / 2, drop.y, `+${drop.xp}`, true);
      } else {
        state.lives -= drop.damage;
        addDevFunParticles(drop.x + drop.w / 2, drop.y, '-1 жизнь', false);
      }

      syncDevFunStats();
      return false;
    }

    return drop.y < canvas.height + 100;
  });

  state.particles.forEach((particle) => {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 145 * dt;
    particle.life -= dt;
  });

  state.particles = state.particles.filter((particle) => particle.life > 0);

  if (state.score >= state.targetScore) {
    endDevFunGame(true);
  }

  if (state.lives <= 0 || state.timeLeft <= 0) {
    endDevFunGame(false);
  }
}

function drawDevFunPixelRect(ctx, x, y, w, h, fill, stroke = '#0f172a') {
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 4;
  ctx.strokeRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawDevFunBackground(ctx, canvas) {
  const state = devFunGameState;

  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#7dd3fc');
  sky.addColorStop(0.34, '#dbeafe');
  sky.addColorStop(0.35, '#86efac');
  sky.addColorStop(1, '#16a34a');

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawDevFunSun(ctx, canvas.width - 145, 86);
  drawDevFunCloud(ctx, 72, 78, 1.05);
  drawDevFunCloud(ctx, 230, 50, 1.25);
  drawDevFunCloud(ctx, 760, 72, 1.35);

  drawDevFunPixelRect(ctx, 54, 410, 170, 104, '#93c5fd', '#1d4ed8');
  drawDevFunPixelRect(ctx, 820, 380, 205, 134, '#93c5fd', '#1d4ed8');

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 24px Arial';
  ctx.fillText('IT TOP', 92, 472);
  ctx.fillText('CAREER', 860, 452);

  ctx.fillStyle = '#1e293b';
  for (let x = -50; x < canvas.width + 50; x += 48) {
    const offsetX = x + ((state ? state.backgroundOffset : 0) % 48);
    ctx.globalAlpha = 0.1;
    ctx.fillRect(offsetX, canvas.height - 42, 24, 11);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(0, 0, canvas.width, 14);
}

function drawDevFunSun(ctx, x, y) {
  ctx.fillStyle = '#facc15';
  ctx.fillRect(x - 28, y - 28, 56, 56);
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(x - 18, y - 18, 36, 36);
}

function drawDevFunCloud(ctx, x, y, scale) {
  ctx.fillStyle = 'rgba(255,255,255,0.76)';
  ctx.fillRect(x, y + 18 * scale, 92 * scale, 24 * scale);
  ctx.fillRect(x + 18 * scale, y, 36 * scale, 44 * scale);
  ctx.fillRect(x + 52 * scale, y + 8 * scale, 44 * scale, 36 * scale);
}

function drawDevFunPlayer(ctx, player) {
  const x = player.x;
  const y = player.y;
  const blink = Math.sin(player.blink * 8) > 0.97;

  ctx.fillStyle = 'rgba(15,23,42,0.18)';
  ctx.fillRect(x + 5, y + 84, 64, 12);

  drawDevFunPixelRect(ctx, x + 15, y, 38, 34, '#fde68a');
  drawDevFunPixelRect(ctx, x + 6, y + 32, 54, 40, '#2563eb');

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 24, y + 12, 6, blink ? 2 : 6);
  ctx.fillRect(x + 40, y + 12, 6, blink ? 2 : 6);
  ctx.fillRect(x + 29, y + 24, 16, 4);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + 16, y - 8, 38, 10);
  ctx.fillRect(x + 8, y + 72, 18, 12);
  ctx.fillRect(x + 42, y + 72, 18, 12);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 20, y + 42, 28, 17);
  ctx.fillStyle = '#2563eb';
  ctx.font = '900 11px Arial';
  ctx.fillText('CV', x + 28, y + 55);

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(x + 58, y + 39, 10, 24);
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 10px Arial';
  ctx.fillText('</>', x + 54, y + 34);
}

function drawDevFunDrop(ctx, drop) {
  ctx.save();
  ctx.translate(drop.x + drop.w / 2, drop.y + drop.h / 2);
  ctx.rotate(drop.rotation);

  ctx.fillStyle = 'rgba(15,23,42,0.14)';
  ctx.fillRect(-drop.w / 2 + 6, -drop.h / 2 + 8, drop.w, drop.h);

  drawDevFunPixelRect(
    ctx,
    -drop.w / 2,
    -drop.h / 2,
    drop.w,
    drop.h,
    drop.good ? '#ffffff' : '#fecaca',
    drop.good ? drop.color : '#dc2626'
  );

  ctx.fillStyle = drop.good ? drop.color : '#991b1b';
  ctx.font = '900 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(drop.icon, 0, 7);

  ctx.font = '900 8px Arial';
  ctx.fillStyle = '#475569';
  ctx.fillText(drop.good ? 'SKILL' : 'DANGER', 0, 21);

  ctx.restore();
  ctx.textAlign = 'left';
}

function drawDevFunParticles(ctx) {
  devFunGameState.particles.forEach((particle) => {
    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.fillStyle = particle.good ? '#15803d' : '#dc2626';
    ctx.font = '900 17px Arial';
    ctx.fillText(particle.text, particle.x, particle.y);
    ctx.globalAlpha = 1;
  });
}

function drawDevFunGame() {
  const state = devFunGameState;
  if (!state) return;

  const ctx = state.ctx;
  const canvas = state.canvas;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawDevFunBackground(ctx, canvas);
  state.drops.forEach((drop) => drawDevFunDrop(ctx, drop));
  drawDevFunPlayer(ctx, state.player);
  drawDevFunParticles(ctx);
  drawDevFunHud(ctx, canvas);
}

function drawDevFunHud(ctx, canvas) {
  const state = devFunGameState;
  const percent = Math.min(1, state.score / state.targetScore);

  ctx.fillStyle = 'rgba(15,23,42,0.82)';
  ctx.fillRect(22, 22, 380, 52);

  ctx.fillStyle = '#dbeafe';
  ctx.fillRect(42, 42, 220, 14);

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(42, 42, 220 * percent, 14);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(42, 42, 220, 14);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 16px Arial';
  ctx.fillText(`${state.score}/${state.targetScore} XP`, 278, 56);

  ctx.fillText(`❤️ ${state.lives}`, 42, 96);
  ctx.fillText(`⏱ ${state.timeLeft}`, 122, 96);
}

function drawDevFunStartScreen() {
  const canvas = document.getElementById('devFunGameCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const mode = getDevFunCurrentMode();

  devFunGameState = {
    canvas,
    ctx,
    backgroundOffset: 0,
    drops: [],
    particles: [],
    player: {
      x: canvas.width / 2 - 32,
      y: canvas.height - 106,
      w: 64,
      h: 78,
      blink: 0,
    },
  };

  drawDevFunBackground(ctx, canvas);
  drawDevFunPlayer(ctx, devFunGameState.player);

  ctx.fillStyle = 'rgba(255,255,255,0.90)';
  ctx.fillRect(canvas.width / 2 - 280, 190, 560, 210);
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 6;
  ctx.strokeRect(canvas.width / 2 - 280, 190, 560, 210);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 42px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Собери стажировку', canvas.width / 2, 262);

  ctx.fillStyle = '#475569';
  ctx.font = '900 20px Arial';
  ctx.fillText('Выбери режим и нажми “Начать игру”', canvas.width / 2, 310);

  ctx.fillStyle = '#2563eb';
  ctx.font = '900 17px Arial';
  ctx.fillText(`${mode.label}: цель ${mode.targetScore} XP, жизни ${mode.lives}, время ${mode.time}`, canvas.width / 2, 350);

  ctx.textAlign = 'left';

  devFunGameState = null;
}

function devFunLoop(now) {
  if (!devFunGameState || !devFunGameState.running) return;

  const dt = Math.min(0.033, (now - devFunGameState.lastTime) / 1000);
  devFunGameState.lastTime = now;

  updateDevFunGame(dt);
  drawDevFunGame();

  requestAnimationFrame(devFunLoop);
}

function endDevFunGame(win) {
  const elements = getDevFunElements();

  if (!devFunGameState) return;

  devFunGameState.running = false;
  drawDevFunGame();

  if (elements.overlay) {
    elements.overlay.classList.remove('hidden');
  }

  if (elements.modalTitle) {
    elements.modalTitle.textContent = win ? 'Оффер получен! 🎉' : 'Стажировка убежала 😅';
  }

  if (elements.modalText) {
    elements.modalText.textContent = win
      ? 'Ты собрал нужные навыки, подготовил резюме и дошёл до интервью. Теперь можно отправлять отклик!'
      : 'Баги и дедлайны победили. Но настоящий разработчик просто нажимает “Попробовать ещё раз”.';
  }

  if (elements.startBtn) {
    elements.startBtn.textContent = 'Играть ещё раз';
  }

  if (elements.overlayStartBtn) {
    elements.overlayStartBtn.textContent = 'Играть ещё раз';
  }
}