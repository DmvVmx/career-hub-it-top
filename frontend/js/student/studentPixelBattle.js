// frontend/js/student/studentPixelBattle.js
// Pixel Battle в стиле HTML-шаблона: большая игровая карточка + правая панель.
// Вкладка в studentDashboard.js должна называться: developer_fun

const STUDENT_DEV_FUN_TAB_ID = 'developer_fun';

let pixelBattleState = {
  loaded: false,
  clans: [],
  myState: null,
  season: null,
  pixels: new Map(),
  leaderboard: [],
  selectedColor: '#3b82f6',
  selectedCell: null,
  hoveredCell: null,
  ws: null,
  cooldownTimer: null,
  refreshTimer: null,

  cooldownSecondsLeft: 0,

  scale: 1,
  panX: 0,
  panY: 0,
  isDragging: false,
  dragStarted: false,
  dragStartX: 0,
  dragStartY: 0,
  dragPanX: 0,
  dragPanY: 0,

  // Размер одной игровой клетки на экране ДО zoom.
  // Пиксели квадратные, потому что cellSize одинаковый по X и Y.
  cellSize: 12,
};

const PIXEL_BATTLE_COLORS = [
  '#000000',
  '#4a4a4a',
  '#9b9b9b',
  '#ffffff',
  '#ef4444',

  '#f97316',
  '#facc15',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',

  '#7c3aed',
  '#ec4899',
  '#8b5e3c',
  '#fdba74',
  '#a78bfa',
];

function pixelBattleKey(x, y) {
  return `${x}:${y}`;
}

function pixelBattleNumber(value) {
  return new Intl.NumberFormat('ru-RU').format(Number(value || 0));
}

function pixelBattleDateLabel(value) {
  if (!value) return '—';

  try {
    return new Date(value).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function pixelBattleCooldownLabel(seconds) {
  const value = Number(seconds || 0);

  if (value <= 0) {
    return 'Сейчас';
  }

  const minutes = Math.floor(value / 60);
  const secs = value % 60;

  if (minutes > 0) {
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }

  return `00:${String(secs).padStart(2, '0')}`;
}

function pixelBattleProgress() {
  const seconds = Number(pixelBattleState.cooldownSecondsLeft || 0);

  if (seconds <= 0) return 100;

  return Math.max(4, Math.min(100, Math.round(((20 - seconds) / 20) * 100)));
}

function pixelBattleInjectStyles() {
  if (document.getElementById('pixelBattleStyles')) return;

  const style = document.createElement('style');
  style.id = 'pixelBattleStyles';

  style.textContent = `
    .pixel-battle-page {
      --pb-bg-main: #f4f7fb;
      --pb-card: #ffffff;
      --pb-primary: #5c4dff;
      --pb-primary-hover: #4a3be0;
      --pb-text: #1e2329;
      --pb-muted: #828b99;
      --pb-border: #e2e8f0;
      --pb-soft: #f8fafc;
      --pb-grid-line: rgba(15, 23, 42, 0.12);
      --pb-shadow: 0 16px 45px rgba(15, 23, 42, 0.06);
      color: var(--pb-text);
      width: 100%;
    }

    .app-layout.pb-immersive-layout {
      display: block !important;
    }

    .app-layout.pb-immersive-layout .app-sidebar {
      display: none !important;
    }

    .app-layout.pb-immersive-layout .app-main {
      width: 100% !important;
      max-width: none !important;
    }

    .pb-dev-hero {
      position: relative;
      overflow: hidden;
      border-radius: 2rem;
      border: 1px solid var(--pb-border);
      background: #fff;
      padding: 28px;
      box-shadow: var(--pb-shadow);
    }

    .pb-dev-hero::before {
      content: "";
      position: absolute;
      inset: -80px -80px auto auto;
      width: 260px;
      height: 260px;
      background: rgba(92, 77, 255, 0.12);
      border-radius: 999px;
      filter: blur(35px);
    }

    .pb-dev-title,
    .pb-title {
      font-size: clamp(30px, 4vw, 46px);
      line-height: 1.05;
      font-weight: 950;
      letter-spacing: -0.04em;
      color: #0f172a;
      margin-top: 16px;
    }

    .pb-dev-text,
    .pb-subtitle {
      color: #64748b;
      margin-top: 10px;
      font-size: 15px;
      line-height: 1.75;
      max-width: 760px;
    }

    .pb-game-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
      margin-top: 22px;
    }

    .pb-game-preview-card {
      position: relative;
      overflow: hidden;
      border-radius: 26px;
      border: 1px solid var(--pb-border);
      background: #fff;
      padding: 22px;
      box-shadow: var(--pb-shadow);
    }

    .pb-game-preview-card::after {
      content: "";
      position: absolute;
      right: -40px;
      top: -40px;
      width: 130px;
      height: 130px;
      border-radius: 999px;
      background: rgba(92, 77, 255, 0.10);
      filter: blur(20px);
    }

    .pb-game-emoji {
      width: 64px;
      height: 64px;
      border-radius: 24px;
      background: #f1f5f9;
      border: 1px solid var(--pb-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    }

    .pb-topbar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 18px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }

    .pb-back-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid var(--pb-border);
      background: #fff;
      color: #64748b;
      border-radius: 16px;
      padding: 12px 16px;
      font-weight: 800;
      font-size: 14px;
      transition: 0.2s;
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
    }

    .pb-back-button:hover {
      transform: translateY(-1px);
      color: #0f172a;
      border-color: #cbd5e1;
      box-shadow: 0 12px 25px rgba(15, 23, 42, 0.08);
    }

    .pb-season-row {
      display: grid;
      grid-template-columns: repeat(3, minmax(150px, 1fr));
      gap: 12px;
      min-width: min(100%, 620px);
    }

    .pb-mini-stat {
      background: #fff;
      border: 1px solid var(--pb-border);
      border-radius: 22px;
      padding: 15px 16px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
    }

    .pb-mini-stat-label {
      color: #94a3b8;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.14em;
    }

    .pb-mini-stat-value {
      color: #0f172a;
      font-size: 16px;
      font-weight: 950;
      margin-top: 7px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .pb-mini-stat-note {
      color: #94a3b8;
      font-size: 12px;
      font-weight: 700;
      margin-top: 3px;
    }

    .pb-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      align-items: start;
    }

    .pb-game-card,
    .pb-widget {
      background: var(--pb-card);
      border: 1px solid var(--pb-border);
      border-radius: 26px;
      box-shadow: var(--pb-shadow);
    }

    .pb-game-card {
      overflow: hidden;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .pb-game-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--pb-border);
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .pb-game-header h4 {
      font-size: 22px;
      font-weight: 950;
      color: #0f172a;
    }

    .pb-game-header p {
      color: #64748b;
      font-size: 14px;
      margin-top: 5px;
      line-height: 1.6;
    }

    .pb-canvas-viewport {
      position: relative;
      width: 100%;
      height: min(58vh, 560px);
      min-height: 420px;
      background:
        radial-gradient(circle at top left, rgba(92, 77, 255, 0.08), transparent 28%),
        radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.10), transparent 30%),
        #e8eef5;
      overflow: hidden;
      cursor: crosshair;
      display: flex;
      align-items: center;
      justify-content: center;
      touch-action: none;
      user-select: none;
      padding: 14px;
    }

    .pb-canvas-viewport.is-dragging {
      cursor: grabbing;
    }

    .pb-canvas-container {
      position: relative;
      transform-origin: center;
      background: #fff;
      box-shadow:
        0 0 0 1px rgba(15, 23, 42, 0.08),
        0 22px 60px rgba(15, 23, 42, 0.18);
      border-radius: 18px;
      overflow: hidden;
    }

    .pb-canvas-container canvas {
      display: block;
      image-rendering: pixelated;
      cursor: crosshair;
      background: #ffffff;
    }

    .pb-hover-label {
      position: absolute;
      top: 18px;
      left: 18px;
      pointer-events: none;
      z-index: 3;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(15, 23, 42, 0.84);
      color: #fff;
      border-radius: 16px;
      padding: 10px 12px;
      font-size: 13px;
      font-weight: 900;
      backdrop-filter: blur(12px);
    }

    .pb-drag-hint {
      position: absolute;
      top: 18px;
      right: 18px;
      z-index: 3;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 16px;
      padding: 10px 12px;
      font-size: 12px;
      font-weight: 900;
      color: #64748b;
      background: rgba(255, 255, 255, 0.88);
      border: 1px solid rgba(226, 232, 240, 0.95);
      backdrop-filter: blur(12px);
      pointer-events: none;
    }

    .pb-game-footer {
      padding: 16px 20px;
      border-top: 1px solid var(--pb-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }

    .pb-coordinate-pill {
      border: 1px solid var(--pb-border);
      background: var(--pb-soft);
      border-radius: 18px;
      padding: 12px 14px;
      color: #64748b;
      font-size: 14px;
      font-weight: 800;
    }

    .pb-coordinate-pill strong {
      color: var(--pb-primary);
    }

    .pb-zoom-controls {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: var(--pb-soft);
      border: 1px solid var(--pb-border);
      border-radius: 18px;
      padding: 7px 10px;
    }

    .pb-zoom-button {
      width: 36px;
      height: 36px;
      border: 0;
      border-radius: 14px;
      background: #fff;
      color: #475569;
      font-size: 18px;
      font-weight: 950;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
      transition: 0.2s;
    }

    .pb-zoom-button:hover {
      background: #f1f5f9;
      color: #0f172a;
      transform: translateY(-1px);
    }

    .pb-zoom-value {
      min-width: 52px;
      text-align: center;
      font-size: 13px;
      font-weight: 950;
      color: #334155;
    }

    .pb-primary-button {
      border: 0;
      border-radius: 18px;
      background: var(--pb-primary);
      color: #fff;
      padding: 13px 18px;
      font-weight: 950;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 14px 30px rgba(92, 77, 255, 0.28);
      transition: 0.2s;
    }

    .pb-primary-button:hover {
      background: var(--pb-primary-hover);
      transform: translateY(-1px);
    }

    .pb-primary-button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .pb-side {
      display: grid;
      grid-template-columns: repeat(5, minmax(180px, 1fr));
      gap: 16px;
      align-items: stretch;
    }

    .pb-widget {
      padding: 20px;
    }

    .pb-widget-title {
      font-size: 14px;
      font-weight: 950;
      color: #0f172a;
      margin-bottom: 14px;
    }

    .pb-clan-card-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .pb-clan-icon {
      width: 46px;
      height: 46px;
      border-radius: 16px;
      background: #eff6ff;
      border: 1px solid #dbeafe;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex: 0 0 auto;
    }

    .pb-timer-main {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 20px;
      color: #0f172a;
      font-weight: 950;
    }

    .pb-timer-note {
      margin-top: 8px;
      color: #94a3b8;
      font-size: 12px;
      line-height: 1.55;
      font-weight: 700;
    }

    .pb-timer-bar {
      margin-top: 12px;
      height: 7px;
      border-radius: 999px;
      background: #eef2ff;
      overflow: hidden;
    }

    .pb-timer-progress {
      height: 100%;
      border-radius: 999px;
      background: var(--pb-primary);
      transition: width 0.25s;
    }

    .pb-palette {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
    }

    .pb-color-button {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 12px;
      border: 0;
      cursor: pointer;
      position: relative;
      transition: 0.14s;
      box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
    }

    .pb-color-button:hover {
      transform: scale(1.08);
    }

    .pb-color-button.is-active::after {
      content: "✓";
      color: white;
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 950;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
    }

    .pb-color-button.is-white.is-active::after {
      color: #0f172a;
      text-shadow: none;
    }

    .pb-pixel-info-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid var(--pb-border);
      font-size: 14px;
    }

    .pb-pixel-info-row:last-child {
      border-bottom: 0;
    }

    .pb-pixel-info-row span:first-child {
      color: var(--pb-muted);
      font-weight: 700;
    }

    .pb-pixel-info-row span:last-child {
      color: var(--pb-text);
      font-weight: 900;
      text-align: right;
      word-break: break-word;
    }

    .pb-leader-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 11px 0;
      border-bottom: 1px solid var(--pb-border);
      font-size: 14px;
    }

    .pb-leader-item:last-child {
      border-bottom: 0;
    }

    .pb-leader-name {
      min-width: 0;
      color: #334155;
      font-weight: 850;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .pb-leader-score {
      color: var(--pb-primary);
      font-weight: 950;
      flex: 0 0 auto;
    }

    .pb-clans-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 80;
      background: rgba(15, 23, 42, 0.48);
      backdrop-filter: blur(10px);
      padding: 20px;
      overflow-y: auto;
    }

    .pb-clans-modal-shell {
      min-height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pb-clans-modal {
      width: min(980px, 100%);
      max-height: calc(100vh - 40px);
      overflow: hidden;
      border-radius: 32px;
      background: #ffffff;
      border: 1px solid rgba(226, 232, 240, 0.95);
      box-shadow: 0 28px 80px rgba(15, 23, 42, 0.28);
      display: flex;
      flex-direction: column;
    }

    .pb-clans-modal-header {
      padding: 22px 24px;
      border-bottom: 1px solid var(--pb-border);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 18px;
    }

    .pb-clans-modal-title {
      color: #0f172a;
      font-size: 24px;
      line-height: 1.15;
      font-weight: 950;
      letter-spacing: -0.03em;
    }

    .pb-clans-modal-subtitle {
      color: #64748b;
      font-size: 14px;
      line-height: 1.6;
      margin-top: 6px;
    }

    .pb-clans-modal-close {
      width: 42px;
      height: 42px;
      border: 0;
      border-radius: 16px;
      background: #f1f5f9;
      color: #64748b;
      font-size: 26px;
      line-height: 1;
      cursor: pointer;
      transition: 0.2s;
      flex: 0 0 auto;
    }

    .pb-clans-modal-close:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .pb-clans-modal-body {
      padding: 18px;
      overflow-y: auto;
    }

    .pb-clans-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .pb-clans-list-item {
      border: 1px solid var(--pb-border);
      background: #ffffff;
      border-radius: 22px;
      padding: 16px;
      display: grid;
      grid-template-columns: 54px minmax(0, 1fr) auto;
      gap: 14px;
      align-items: center;
      transition: 0.2s;
    }

    .pb-clans-list-item:hover {
      transform: translateY(-1px);
      border-color: #c7d2fe;
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
    }

    .pb-clans-list-emoji {
      width: 54px;
      height: 54px;
      border-radius: 20px;
      background: #f8fafc;
      border: 1px solid var(--pb-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
    }

    .pb-clans-list-name {
      color: #0f172a;
      font-size: 16px;
      font-weight: 950;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .pb-clans-list-desc {
      color: #64748b;
      font-size: 13px;
      line-height: 1.45;
      margin-top: 4px;
    }

    .pb-clans-list-badge {
      border-radius: 999px;
      background: #eef2ff;
      border: 1px solid #e0e7ff;
      color: #5c4dff;
      padding: 7px 10px;
      font-size: 11px;
      font-weight: 950;
      white-space: nowrap;
    }

    .pb-clans-list-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }

    .pb-clans-list-stat {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border-radius: 999px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #475569;
      padding: 6px 8px;
      font-size: 11px;
      font-weight: 900;
    }

    .pb-clans-modal-empty {
      border: 1px dashed #cbd5e1;
      background: #f8fafc;
      color: #64748b;
      border-radius: 22px;
      padding: 18px;
      text-align: center;
      font-size: 14px;
      font-weight: 800;
    }

    @media (max-width: 768px) {
      .pb-clans-list {
        grid-template-columns: 1fr;
      }

      .pb-clans-list-item {
        grid-template-columns: 48px minmax(0, 1fr);
      }

      .pb-clans-list-badge {
        grid-column: 1 / -1;
        width: max-content;
      }
    }

    @media (max-width: 1280px) {
      .pb-side {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 768px) {
      .pb-season-row {
        grid-template-columns: 1fr;
        min-width: 0;
        width: 100%;
      }

      .pb-canvas-viewport {
        height: 58vh;
        min-height: 360px;
        padding: 10px;
      }

      .pb-side {
        grid-template-columns: 1fr;
      }

      .pb-drag-hint {
        display: none;
      }

      .pb-game-list {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(style);
}

function renderStudentDeveloperFunHub() {
  pixelBattleInjectStyles();

  return `
    <div class="pixel-battle-page">
      <section class="pb-dev-hero">
        <div class="relative">
          <div class="inline-flex items-center rounded-full bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 text-xs font-black">
            От разраба
          </div>

          <h3 class="pb-dev-title">
            Приколы разработчика
          </h3>

          <p class="pb-dev-text">
            Здесь будут мини-игры и сезонные активности для студентов. Начинаем с Pixel Battle:
            выбирай клан, ставь пиксели и забирай лидерство.
          </p>
        </div>
      </section>

      <section class="pb-game-list">
        <article class="pb-game-preview-card">
          <div class="relative">
            <div class="pb-game-emoji">🟪</div>

            <h4 class="mt-5 text-2xl font-black text-slate-900">
              Pixel Battle
            </h4>

            <p class="mt-3 text-slate-600 leading-7">
              Общее пиксельное полотно, кланы, таймеры, перекрашивание и таблица лидеров.
            </p>

            <button
              type="button"
              data-dev-fun-open="pixel_battle"
              class="app-button app-button-primary mt-5"
            >
              Открыть
            </button>
          </div>
        </article>

        <article class="pb-game-preview-card">
          <div class="relative">
            <div class="pb-game-emoji">🎮</div>

            <h4 class="mt-5 text-2xl font-black text-slate-900">
              Собери стажировку
            </h4>

            <p class="mt-3 text-slate-600 leading-7">
              Мини-игра с карточками, собеседованиями и дедлайнами. Добавим позже.
            </p>

            <button type="button" class="app-button mt-5" disabled>
              Скоро
            </button>
          </div>
        </article>
      </section>
    </div>
  `;
}

function setPixelBattleImmersiveMode(enabled) {
  const layout = document.querySelector('.app-layout');

  if (!layout) return;

  layout.classList.toggle('pb-immersive-layout', Boolean(enabled));
}

async function renderStudentDeveloperFunTab() {
  setPixelBattleImmersiveMode(false);

  if (devFunView === 'pixel_battle') {
    return renderPixelBattleScreen();
  }

  return renderStudentDeveloperFunHub();
}

function renderPixelBattleClanSelect() {
  pixelBattleInjectStyles();

  return `
    <div class="pixel-battle-page space-y-6">
      <section class="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-purple-100 blur-3xl opacity-90"></div>
        <div class="absolute -bottom-24 left-24 w-72 h-72 rounded-full bg-blue-100 blur-3xl opacity-80"></div>

        <div class="relative">
          <button id="backToDevFunFromPixelBattleBtn" type="button" class="pb-back-button">
            ← Вернуться к приколам
          </button>

          <div class="mt-6 max-w-3xl">
            <div class="inline-flex items-center rounded-full bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 text-xs font-black">
              🟪 Pixel Battle IT TOP
            </div>

            <h3 class="pb-title">
              Выбери свой клан
            </h3>

            <p class="pb-subtitle">
              Клан выбирается один раз. Потом ты ставишь пиксели за свою команду,
              перекрашиваешь поле и помогаешь клану подняться в таблице лидеров.
            </p>
          </div>
        </div>
      </section>

      <section class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        ${pixelBattleState.clans.map(renderPixelBattleClanCard).join('')}
      </section>
    </div>
  `;
}

function renderPixelBattleClanCard(clan) {
  return `
    <article class="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg transition">
      <div class="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-purple-100 blur-2xl opacity-80"></div>

      <div class="relative">
        <div class="flex items-start justify-between gap-4">
          <div class="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-4xl border border-slate-200">
            ${safe(clan.emoji)}
          </div>

          <span class="app-badge">Клан</span>
        </div>

        <h4 class="mt-5 text-2xl font-black text-slate-900">
          ${safe(clan.emoji)} ${safe(clan.name)}
        </h4>

        <p class="mt-3 text-slate-600 leading-7 min-h-[84px]">
          ${safe(clan.description || 'Описание клана скоро появится.')}
        </p>

        <button
          type="button"
          data-pixel-battle-join-clan="${clan.id}"
          class="app-button app-button-primary mt-5 w-full justify-center"
        >
          Выбрать клан
        </button>
      </div>
    </article>
  `;
}

function renderPixelBattleGame() {
  pixelBattleInjectStyles();

  const clan = pixelBattleState.myState?.clan || {};
  const season = pixelBattleState.season || {};
  const canPlace = pixelBattleState.cooldownSecondsLeft <= 0;

  return `
    <div class="pixel-battle-page">
      <div class="pb-topbar">
        <div>
          <button id="backToDevFunFromPixelBattleBtn" type="button" class="pb-back-button">
            ← Вернуться к приколам
          </button>

          <h3 class="pb-title">
            Pixel Battle 🖌️
          </h3>

          <p class="pb-subtitle">
            Создаём пиксельный шедевр и защищаем свою территорию. Выбери цвет,
            нажми на клетку и поставь пиксель за свой клан.
          </p>
        </div>

        <div class="pb-season-row">
          <div class="pb-mini-stat">
            <div class="pb-mini-stat-label">Сезон</div>
            <div class="pb-mini-stat-value">${safe(season.title || 'Сезон #1')}</div>
            <div class="pb-mini-stat-note">Первый код</div>
          </div>

          <div class="pb-mini-stat">
            <div class="pb-mini-stat-label">Полотно</div>
            <div class="pb-mini-stat-value">${season.width} × ${season.height}</div>
            <div class="pb-mini-stat-note">${pixelBattleNumber((season.width || 0) * (season.height || 0))} пикселей</div>
          </div>

          <div class="pb-mini-stat">
            <div class="pb-mini-stat-label">Мой клан</div>
            <div class="pb-mini-stat-value">${safe(clan.emoji || '🎯')} ${safe(clan.name || 'Клан')}</div>
            <div class="pb-mini-stat-note">Клан закреплён</div>
          </div>
        </div>
      </div>

      <section class="pb-layout">
        <main class="pb-game-card">
          <div class="pb-game-header">
            <div>
              <h4>Пиксельное полотно</h4>
              <p>
                ЛКМ/тап — выбрать клетку. Колёсико — масштаб. Shift + перетаскивание, ПКМ или средняя кнопка — двигать полотно.
              </p>
            </div>

            <div class="pb-zoom-controls">
              <button id="pixelBattleZoomOutBtn" type="button" class="pb-zoom-button">−</button>

              <span id="pixelBattleScaleLabel" class="pb-zoom-value">
                100%
              </span>

              <button id="pixelBattleZoomInBtn" type="button" class="pb-zoom-button">+</button>
              <button id="pixelBattleResetViewBtn" type="button" class="pb-zoom-button" title="Сбросить вид">⌂</button>
            </div>
          </div>

          <div id="pixelBattleViewport" class="pb-canvas-viewport">
            <div id="pixelBattleHoverLabel" class="pb-hover-label">
              Координаты: —
            </div>

            <div class="pb-drag-hint">
              ✚ Плюсик — поставить · Shift/ПКМ/колёсико — двигать
            </div>

            <div id="pixelBattleCanvasContainer" class="pb-canvas-container">
              <canvas id="pixelBattleCanvas"></canvas>
            </div>
          </div>

          <div class="pb-game-footer">
            <div id="pixelBattleBottomInfo" class="pb-coordinate-pill">
              ${renderPixelBattleBottomInfo()}
            </div>

            <button
              id="pixelBattlePlaceBtn"
              type="button"
              class="pb-primary-button"
              ${canPlace ? '' : 'disabled'}
            >
              Поставить пиксель
            </button>
          </div>
        </main>

        <aside class="pb-side">
          ${renderPixelBattleClanWidget()}
          ${renderPixelBattleTimerWidget()}
          ${renderPixelBattlePaletteWidget()}
          ${renderPixelBattleSelectedPixelWidget()}
          ${renderPixelBattleLeaderboardWidget()}
        </aside>
      </section>
    </div>
  `;
}

function renderPixelBattleClanWidget() {
  const clan = pixelBattleState.myState?.clan || {};

  return `
    <section class="pb-widget">
      <div class="flex items-center justify-between gap-3 mb-4">
        <div class="pb-widget-title !mb-0">Ваш клан</div>

        <button
          id="pixelBattleShowClansBtn"
          type="button"
          class="text-xs font-black text-purple-700 hover:text-purple-900"
        >
          Кланы и статистика →
        </button>
      </div>

      <div class="pb-clan-card-row">
        <div class="pb-clan-icon">
          ${safe(clan.emoji || '🎯')}
        </div>

        <div class="min-w-0">
          <div class="font-black text-slate-900 truncate">
            ${safe(clan.name || 'Клан не выбран')}
          </div>
          <div class="text-sm text-slate-500 mt-1">
            ${safe(clan.description || 'Вы уже играете за этот клан.')}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderPixelBattleClansModal() {
  const currentClanId = pixelBattleState.myState?.clan?.id;

  return `
    <div id="pixelBattleClansModal" class="pb-clans-modal-backdrop">
      <div class="pb-clans-modal-shell">
        <div class="pb-clans-modal">
          <div class="pb-clans-modal-header">
            <div>
              <div class="inline-flex items-center rounded-full bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 text-xs font-black">
                Кланы Pixel Battle
              </div>

              <h3 class="pb-clans-modal-title mt-3">
                Кланы и статистика
              </h3>

              <p class="pb-clans-modal-subtitle">
                Быстрый просмотр твоего клана остаётся на панели. Здесь полный список кланов,
                их место и сколько пикселей они поставили в текущем сезоне.
              </p>
            </div>

            <button id="closePixelBattleClansModalBtn" type="button" class="pb-clans-modal-close">
              ×
            </button>
          </div>

          <div class="pb-clans-modal-body">
            <div class="pb-clans-list">
              ${pixelBattleState.clans.map((clan) => renderPixelBattleClanListItem(clan, currentClanId)).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getPixelBattleClanStats(clanId) {
  const index = pixelBattleState.leaderboard.findIndex((item) => {
    const itemClan = item.clan || {};
    return Number(itemClan.id || item.clan_id) === Number(clanId);
  });

  if (index === -1) {
    return {
      rank: '—',
      score: 0,
    };
  }

  const item = pixelBattleState.leaderboard[index];
  const score = item.placed_count || item.score || item.controlled_count || 0;

  return {
    rank: item.rank || item.place || index + 1,
    score,
  };
}

function renderPixelBattleClanListItem(clan, currentClanId = null) {
  const isCurrent = Number(clan.id) === Number(currentClanId);
  const stats = getPixelBattleClanStats(clan.id);

  return `
    <article class="pb-clans-list-item">
      <div class="pb-clans-list-emoji">
        ${safe(clan.emoji || '🎯')}
      </div>

      <div class="min-w-0">
        <div class="pb-clans-list-name">
          ${safe(clan.name || 'Клан')}
        </div>

        <div class="pb-clans-list-desc">
          ${safe(clan.description || 'Описание клана скоро появится.')}
        </div>

        <div class="pb-clans-list-stats">
          <span class="pb-clans-list-stat">🏆 место: ${safe(stats.rank)}</span>
          <span class="pb-clans-list-stat">🧩 пикселей: ${pixelBattleNumber(stats.score)}</span>
        </div>
      </div>

      ${
        isCurrent
          ? '<div class="pb-clans-list-badge">Ваш клан</div>'
          : '<div class="pb-clans-list-badge">Клан</div>'
      }
    </article>
  `;
}

async function showPixelBattleClansModal() {
  await refreshPixelBattleLeaderboard(false);

  closePixelBattleClansModal();

  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderPixelBattleClansModal();

  const modal = wrapper.firstElementChild;
  document.body.appendChild(modal);

  const closeBtn = document.getElementById('closePixelBattleClansModalBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closePixelBattleClansModal);
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closePixelBattleClansModal();
    }
  });

  document.addEventListener('keydown', handlePixelBattleClansModalKeydown);
}

function closePixelBattleClansModal() {
  const modal = document.getElementById('pixelBattleClansModal');

  if (modal) {
    modal.remove();
  }

  document.removeEventListener('keydown', handlePixelBattleClansModalKeydown);
}

function handlePixelBattleClansModalKeydown(event) {
  if (event.key === 'Escape') {
    closePixelBattleClansModal();
  }
}

function renderPixelBattleTimerWidget() {
  return `
    <section class="pb-widget">
      <div class="pb-widget-title">До следующего пикселя</div>

      <div class="pb-timer-main">
        <span>⏱</span>
        <span id="pixelBattleCooldownText">
          ${pixelBattleCooldownLabel(pixelBattleState.cooldownSecondsLeft)}
        </span>
      </div>

      <div class="pb-timer-note">
        ${
          pixelBattleState.cooldownSecondsLeft <= 0
            ? 'Можно поставить пиксель прямо сейчас.'
            : 'Поставьте пиксель, когда таймер достигнет нуля.'
        }
      </div>

      <div class="pb-timer-bar">
        <div
          id="pixelBattleCooldownProgress"
          class="pb-timer-progress"
          style="width:${pixelBattleProgress()}%"
        ></div>
      </div>
    </section>
  `;
}

function renderPixelBattlePaletteWidget() {
  return `
    <section class="pb-widget">
      <div class="flex items-start justify-between gap-3 mb-4">
        <div>
          <div class="pb-widget-title !mb-1">Выбор цвета</div>
          <div class="text-xs text-slate-500 font-bold">
            Сейчас: <span id="pixelBattleSelectedColorText">${safe(pixelBattleState.selectedColor)}</span>
          </div>
        </div>

        <div
          id="pixelBattleSelectedColorPreview"
          class="w-9 h-9 rounded-xl border border-slate-200 shadow-sm"
          style="background:${pixelBattleState.selectedColor}"
        ></div>
      </div>

      <div id="pixelBattlePalette" class="pb-palette">
        ${PIXEL_BATTLE_COLORS.map(renderPixelBattleColorButton).join('')}
      </div>
    </section>
  `;
}

function renderPixelBattleColorButton(color) {
  const selected = color.toLowerCase() === pixelBattleState.selectedColor.toLowerCase();
  const isWhite = color.toLowerCase() === '#ffffff';

  return `
    <button
      type="button"
      data-pixel-battle-color="${color}"
      class="pb-color-button ${selected ? 'is-active' : ''} ${isWhite ? 'is-white' : ''}"
      style="background:${color}; ${isWhite ? 'box-shadow: inset 0 0 0 1px #cbd5e1;' : ''}"
      title="${color}"
    ></button>
  `;
}

function renderPixelBattleSelectedPixelWidget() {
  const cell = pixelBattleState.selectedCell;
  const pixel = cell
    ? pixelBattleState.pixels.get(pixelBattleKey(cell.x, cell.y))
    : null;

  return `
    <section class="pb-widget">
      <div class="pb-widget-title">Выбранный пиксель</div>

      <div id="pixelBattleSelectedPixelInfo">
        ${renderPixelBattleSelectedPixelInfo(cell, pixel)}
      </div>
    </section>
  `;
}

function renderPixelBattleSelectedPixelInfo(cell, pixel) {
  if (!cell) {
    return `
      <div class="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center">
        <div class="text-3xl">🧩</div>
        <div class="mt-2 font-black text-slate-900">Пиксель не выбран</div>
        <div class="text-sm text-slate-500 mt-1">
          Нажми на клетку полотна.
        </div>
      </div>
    `;
  }

  if (!pixel) {
    return `
      <div>
        ${renderPixelBattleInfoRow('Координаты', `(${cell.x}, ${cell.y})`)}
        ${renderPixelBattleInfoRow('Цвет', pixelBattleState.selectedColor)}
        ${renderPixelBattleInfoRow('Кто поставил', 'Пиксель пустой')}
      </div>
    `;
  }

  return `
    <div>
      ${renderPixelBattleInfoRow('Координаты', `(${cell.x}, ${cell.y})`)}
      ${renderPixelBattleInfoRow('Цвет', pixel.color)}
      ${renderPixelBattleInfoRow('Кто поставил', pixel.updated_by_name)}
      ${renderPixelBattleInfoRow('Клан', `${pixel.clan?.emoji || '🎯'} ${pixel.clan?.name || 'Без клана'}`)}
      ${renderPixelBattleInfoRow('Когда', pixelBattleDateLabel(pixel.updated_at))}
    </div>
  `;
}

function renderPixelBattleInfoRow(label, value) {
  return `
    <div class="pb-pixel-info-row">
      <span>${safe(label)}</span>
      <span>${safe(value)}</span>
    </div>
  `;
}

function renderPixelBattleLeaderboardWidget() {
  const top = pixelBattleState.leaderboard.slice(0, 5);

  return `
    <section class="pb-widget">
      <div class="flex items-center justify-between gap-3 mb-2">
        <div class="pb-widget-title !mb-0">
          Лидеры кланов
        </div>

        <button
          id="pixelBattleRefreshLeaderboardBtn"
          type="button"
          class="text-xs font-black text-purple-700 hover:text-purple-900"
        >
          ↻
        </button>
      </div>

      <div id="pixelBattleLeaderboardList">
        ${
          top.length
            ? top.map(renderPixelBattleLeaderboardItem).join('')
            : `
              <div class="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-500 text-center">
                Пока нет активности.
              </div>
            `
        }
      </div>
    </section>
  `;
}

function renderPixelBattleLeaderboardItem(item) {
  const clan = item.clan || {};
  const rank = item.rank || item.place || 1;
  const score = item.placed_count || item.score || item.controlled_count || 0;

  return `
    <div class="pb-leader-item">
      <div class="pb-leader-name">
        ${rank} ${safe(clan.emoji || item.clan_emoji || '🎯')} ${safe(clan.name || item.clan_name || 'Клан')}
      </div>

      <div class="pb-leader-score">
        ${pixelBattleNumber(score)}
      </div>
    </div>
  `;
}

function renderPixelBattleBottomInfo() {
  const cell = pixelBattleState.selectedCell;
  const pixel = cell
    ? pixelBattleState.pixels.get(pixelBattleKey(cell.x, cell.y))
    : null;

  if (!cell) {
    return `
      Координаты: <strong>—</strong>
    `;
  }

  return `
    Координаты:
    <strong>(${cell.x}, ${cell.y})</strong>
    ${
      pixel
        ? ` · ${safe(pixel.updated_by_name)}`
        : ' · пустой пиксель'
    }
  `;
}

function normalizePixelBattlePixel(pixel) {
  return {
    x: Number(pixel.x),
    y: Number(pixel.y),
    color: pixel.color || '#000000',
    updated_by_name:
      pixel.updated_by_name ||
      pixel.student_name ||
      pixel.user_name ||
      pixel.full_name ||
      'Неизвестно',
    clan: pixel.clan || {
      id: pixel.clan_id || pixel.updated_by_clan_id || null,
      emoji: pixel.clan_emoji || '🎯',
      name: pixel.clan_name || 'Без клана',
    },
    updated_at: pixel.updated_at || pixel.created_at || null,
  };
}

async function loadPixelBattleData() {
  const [clansResponse, meResponse, canvasResponse, leaderboardResponse] = await Promise.all([
    getPixelBattleClans(),
    getPixelBattleMyState(),
    getPixelBattleCanvas(),
    getPixelBattleLeaderboard(),
  ]);

  if (!clansResponse.ok) {
    throw new Error('Не удалось загрузить кланы.');
  }

  if (!meResponse.ok) {
    throw new Error('Не удалось загрузить состояние игрока.');
  }

  if (!canvasResponse.ok) {
    throw new Error('Не удалось загрузить полотно Pixel Battle.');
  }

  if (!leaderboardResponse.ok) {
    throw new Error('Не удалось загрузить таблицу кланов.');
  }

  const clans = await clansResponse.json();
  const me = await meResponse.json();
  const canvas = await canvasResponse.json();
  const leaderboard = await leaderboardResponse.json();

  pixelBattleState.clans = clans || [];
  pixelBattleState.myState = me;
  pixelBattleState.season = canvas.season;
  pixelBattleState.leaderboard = leaderboard.items || [];
  pixelBattleState.cooldownSecondsLeft = Number(me.cooldown_seconds_left || 0);

  pixelBattleState.pixels = new Map();

  (canvas.pixels || []).forEach((pixel) => {
    const normalized = normalizePixelBattlePixel(pixel);
    pixelBattleState.pixels.set(pixelBattleKey(normalized.x, normalized.y), normalized);
  });

  pixelBattleState.loaded = true;
}

async function renderPixelBattleScreen() {
  try {
    await loadPixelBattleData();

    if (!pixelBattleState.myState.clan) {
      return renderPixelBattleClanSelect();
    }

    return renderPixelBattleGame();
  } catch (error) {
    return placeholderBlock(
      'Pixel Battle',
      error.message || 'Не удалось загрузить Pixel Battle.'
    );
  }
}

function setupPixelBattleCanvas() {
  const canvas = document.getElementById('pixelBattleCanvas');
  const container = document.getElementById('pixelBattleCanvasContainer');
  const viewport = document.getElementById('pixelBattleViewport');

  if (!canvas || !container || !viewport || !pixelBattleState.season) return;

  const season = pixelBattleState.season;
  const size = pixelBattleState.cellSize;
  const dpr = window.devicePixelRatio || 1;

  const boardWidth = season.width * size;
  const boardHeight = season.height * size;

  canvas.width = Math.floor(boardWidth * dpr);
  canvas.height = Math.floor(boardHeight * dpr);

  canvas.style.width = `${boardWidth}px`;
  canvas.style.height = `${boardHeight}px`;

  container.style.width = `${boardWidth}px`;
  container.style.height = `${boardHeight}px`;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;

  resetPixelBattleView();
  drawPixelBattleCanvas();
  updatePixelBattleTransform();

  viewport.removeEventListener('mousedown', handlePixelBattleMouseDown);
  window.removeEventListener('mousemove', handlePixelBattleMouseMove);
  window.removeEventListener('mouseup', handlePixelBattleMouseUp);

  viewport.addEventListener('mousedown', handlePixelBattleMouseDown);
  window.addEventListener('mousemove', handlePixelBattleMouseMove);
  window.addEventListener('mouseup', handlePixelBattleMouseUp);

  viewport.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      changePixelBattleZoom(event.deltaY > 0 ? -0.15 : 0.15);
    },
    { passive: false }
  );

  viewport.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });

  viewport.addEventListener(
    'touchstart',
    (event) => {
      const touch = event.touches[0];

      pixelBattleState.isDragging = true;
      pixelBattleState.dragStarted = false;
      pixelBattleState.dragStartX = touch.clientX;
      pixelBattleState.dragStartY = touch.clientY;
      pixelBattleState.dragPanX = pixelBattleState.panX;
      pixelBattleState.dragPanY = pixelBattleState.panY;
    },
    { passive: true }
  );

  viewport.addEventListener(
    'touchmove',
    (event) => {
      const touch = event.touches[0];
      const dx = touch.clientX - pixelBattleState.dragStartX;
      const dy = touch.clientY - pixelBattleState.dragStartY;

      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        pixelBattleState.dragStarted = true;
      }

      pixelBattleState.panX = pixelBattleState.dragPanX + dx;
      pixelBattleState.panY = pixelBattleState.dragPanY + dy;

      updatePixelBattleTransform();
    },
    { passive: true }
  );

  viewport.addEventListener(
    'touchend',
    (event) => {
      pixelBattleState.isDragging = false;

      const touch = event.changedTouches[0];

      if (pixelBattleState.dragStarted) return;

      const cell = getPixelBattleCellFromPoint(touch.clientX, touch.clientY);
      if (!cell) return;

      setPixelBattleSelectedCell(cell);
    },
    { passive: true }
  );
}

function resetPixelBattleView() {
  const viewport = document.getElementById('pixelBattleViewport');
  const season = pixelBattleState.season;

  if (!viewport || !season) return;

  const size = pixelBattleState.cellSize;
  const boardWidth = season.width * size;
  const boardHeight = season.height * size;
  const viewportRect = viewport.getBoundingClientRect();

  const fitByWidth = viewportRect.width / boardWidth;
  const fitByHeight = viewportRect.height / boardHeight;
  const fitScale = Math.max(fitByWidth * 0.98, Math.min(fitByHeight, fitByWidth) * 0.92);

  pixelBattleState.scale = Math.max(0.45, Math.min(5, fitScale));
  pixelBattleState.panX = 0;
  pixelBattleState.panY = 0;

  updatePixelBattleTransform();
  updatePixelBattleZoomLabel();
}

function updatePixelBattleTransform() {
  const container = document.getElementById('pixelBattleCanvasContainer');

  if (!container) return;

  container.style.transform = `
    translate(${pixelBattleState.panX}px, ${pixelBattleState.panY}px)
    scale(${pixelBattleState.scale})
  `;
}

function updatePixelBattleZoomLabel() {
  const label = document.getElementById('pixelBattleScaleLabel');

  if (!label) return;

  label.textContent = `${Math.round(pixelBattleState.scale * 100)}%`;
}

function changePixelBattleZoom(delta) {
  pixelBattleState.scale = Math.max(
    0.45,
    Math.min(8, pixelBattleState.scale + delta)
  );

  updatePixelBattleTransform();
  updatePixelBattleZoomLabel();
}

function shouldPixelBattleStartDrag(event) {
  return event.button === 1 || event.button === 2 || event.shiftKey;
}

function handlePixelBattleMouseDown(event) {
  const viewport = document.getElementById('pixelBattleViewport');

  if (shouldPixelBattleStartDrag(event)) {
    pixelBattleState.isDragging = true;
    pixelBattleState.dragStarted = false;
    pixelBattleState.dragStartX = event.clientX;
    pixelBattleState.dragStartY = event.clientY;
    pixelBattleState.dragPanX = pixelBattleState.panX;
    pixelBattleState.dragPanY = pixelBattleState.panY;

    if (viewport) {
      viewport.classList.add('is-dragging');
    }

    event.preventDefault();
    return;
  }

  if (event.button !== 0) {
    return;
  }

  const cell = getPixelBattleCellFromPoint(event.clientX, event.clientY);
  if (!cell) return;

  setPixelBattleSelectedCell(cell);
  event.preventDefault();
}

function handlePixelBattleMouseMove(event) {
  if (pixelBattleState.isDragging) {
    const dx = event.clientX - pixelBattleState.dragStartX;
    const dy = event.clientY - pixelBattleState.dragStartY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      pixelBattleState.dragStarted = true;
    }

    pixelBattleState.panX = pixelBattleState.dragPanX + dx;
    pixelBattleState.panY = pixelBattleState.dragPanY + dy;

    updatePixelBattleTransform();
    return;
  }

  const cell = getPixelBattleCellFromPoint(event.clientX, event.clientY);
  pixelBattleState.hoveredCell = cell;

  updatePixelBattleHoverLabel();
  drawPixelBattleCanvas();
}

function handlePixelBattleMouseUp(event) {
  const viewport = document.getElementById('pixelBattleViewport');

  if (viewport) {
    viewport.classList.remove('is-dragging');
  }

  if (!pixelBattleState.isDragging) return;

  pixelBattleState.isDragging = false;
}

function getPixelBattleCellFromPoint(clientX, clientY) {
  const canvas = document.getElementById('pixelBattleCanvas');
  const season = pixelBattleState.season;

  if (!canvas || !season) return null;

  const rect = canvas.getBoundingClientRect();

  const cellWidth = rect.width / season.width;
  const cellHeight = rect.height / season.height;

  const x = Math.floor((clientX - rect.left) / cellWidth);
  const y = Math.floor((clientY - rect.top) / cellHeight);

  if (x < 0 || y < 0 || x >= season.width || y >= season.height) {
    return null;
  }

  return { x, y };
}

function setPixelBattleSelectedCell(cell) {
  pixelBattleState.selectedCell = cell;
  pixelBattleState.hoveredCell = cell;

  updatePixelBattleHoverLabel();
  updatePixelBattleBottomInfo();
  updatePixelBattleSelectedPixelInfo();
  drawPixelBattleCanvas();
}

function updatePixelBattleHoverLabel() {
  const label = document.getElementById('pixelBattleHoverLabel');
  const cell = pixelBattleState.hoveredCell || pixelBattleState.selectedCell;

  if (!label) return;

  if (!cell) {
    label.textContent = 'Координаты: —';
    return;
  }

  label.textContent = `Координаты: (${cell.x}, ${cell.y})`;
}

function updatePixelBattleBottomInfo() {
  const block = document.getElementById('pixelBattleBottomInfo');

  if (!block) return;

  block.innerHTML = renderPixelBattleBottomInfo();
}

function updatePixelBattleSelectedPixelInfo() {
  const block = document.getElementById('pixelBattleSelectedPixelInfo');

  if (!block) return;

  const cell = pixelBattleState.selectedCell;
  const pixel = cell
    ? pixelBattleState.pixels.get(pixelBattleKey(cell.x, cell.y))
    : null;

  block.innerHTML = renderPixelBattleSelectedPixelInfo(cell, pixel);
}

function drawPixelBattleCanvas() {
  const canvas = document.getElementById('pixelBattleCanvas');

  if (!canvas || !pixelBattleState.season) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = pixelBattleState.cellSize;
  const season = pixelBattleState.season;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;

  const boardWidth = season.width * size;
  const boardHeight = season.height * size;

  ctx.clearRect(0, 0, boardWidth, boardHeight);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, boardWidth, boardHeight);

  pixelBattleState.pixels.forEach((pixel) => {
    ctx.fillStyle = pixel.color;
    ctx.fillRect(pixel.x * size, pixel.y * size, size, size);
  });

  drawPixelBattleGrid(ctx);

  if (pixelBattleState.hoveredCell) {
    drawPixelBattleHoverCell(ctx, pixelBattleState.hoveredCell);
  }

  if (pixelBattleState.selectedCell) {
    drawPixelBattleSelectedCell(ctx, pixelBattleState.selectedCell);
  }
}

function drawPixelBattleGrid(ctx) {
  const season = pixelBattleState.season;
  const size = pixelBattleState.cellSize;
  const boardWidth = season.width * size;
  const boardHeight = season.height * size;

  ctx.save();

  ctx.strokeStyle = 'rgba(15, 23, 42, 0.18)';
  ctx.lineWidth = 1;

  for (let x = 0; x <= season.width; x += 1) {
    const px = x * size + 0.5;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, boardHeight);
    ctx.stroke();
  }

  for (let y = 0; y <= season.height; y += 1) {
    const py = y * size + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(boardWidth, py);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPixelBattleHoverCell(ctx, cell) {
  const size = pixelBattleState.cellSize;
  const x = cell.x * size;
  const y = cell.y * size;
  const existingPixel = pixelBattleState.pixels.get(pixelBattleKey(cell.x, cell.y));

  ctx.save();

  if (!existingPixel) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = pixelBattleState.selectedColor;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);

  ctx.restore();
}

function drawPixelBattleSelectedCell(ctx, cell) {
  const size = pixelBattleState.cellSize;
  const x = cell.x * size;
  const y = cell.y * size;

  ctx.save();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);

  ctx.strokeStyle = '#5c4dff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 4, y + 4, size - 8, size - 8);

  ctx.restore();
}

function drawPixelBattleStarterArt(ctx) {
  const season = pixelBattleState.season;
  const width = season.width;
  const height = season.height;

  ctx.fillStyle = '#93c5fd';
  drawPixelRect(ctx, 0, 0, width, height);

  ctx.fillStyle = '#ffffff';
  drawPixelRect(ctx, Math.floor(width * 0.08), Math.floor(height * 0.14), 12, 3);
  drawPixelRect(ctx, Math.floor(width * 0.48), Math.floor(height * 0.12), 14, 3);
  drawPixelRect(ctx, Math.floor(width * 0.76), Math.floor(height * 0.16), 13, 3);

  ctx.fillStyle = '#84cc16';
  drawPixelRect(ctx, 0, Math.floor(height * 0.72), width, Math.ceil(height * 0.08));

  ctx.fillStyle = '#8b5cf6';
  drawPixelRect(ctx, 0, Math.floor(height * 0.80), width, Math.ceil(height * 0.20));

  ctx.fillStyle = '#4c1d95';
  drawPixelRect(
    ctx,
    Math.floor(width * 0.09),
    Math.floor(height * 0.20),
    Math.floor(width * 0.32),
    Math.floor(height * 0.28)
  );

  ctx.fillStyle = '#ffffff';
  drawPixelText(ctx, 'CODE', Math.floor(width * 0.14), Math.floor(height * 0.25), 5);
  drawPixelText(ctx, 'IS', Math.floor(width * 0.17), Math.floor(height * 0.35), 5);
  drawPixelText(ctx, 'MAGIC', Math.floor(width * 0.14), Math.floor(height * 0.45), 5);

  const dinoX = Math.floor(width * 0.62);
  const dinoY = Math.floor(height * 0.38);

  ctx.fillStyle = '#22c55e';
  drawPixelRect(ctx, dinoX, dinoY, 22, 17);

  ctx.fillStyle = '#16a34a';
  drawPixelRect(ctx, dinoX + 15, dinoY + 5, 18, 12);
  drawPixelRect(ctx, dinoX + 4, dinoY + 17, 28, 10);
  drawPixelRect(ctx, dinoX + 8, dinoY + 27, 30, 7);

  ctx.fillStyle = '#0f172a';
  drawPixelRect(ctx, dinoX + 18, dinoY + 8, 7, 2);
  drawPixelRect(ctx, dinoX + 27, dinoY + 8, 7, 2);

  ctx.fillStyle = '#374151';
  const laptopX = Math.floor(width * 0.47);
  const laptopY = Math.floor(height * 0.58);

  drawPixelRect(ctx, laptopX, laptopY, 20, 12);

  ctx.fillStyle = '#f8fafc';
  drawPixelText(ctx, '</>', laptopX + 4, laptopY + 3, 4);
}

function drawPixelRect(ctx, x, y, width, height) {
  const size = pixelBattleState.cellSize;

  ctx.fillRect(
    x * size,
    y * size,
    width * size,
    height * size
  );
}

function drawPixelText(ctx, text, x, y, fontSize = 5) {
  const size = pixelBattleState.cellSize;

  ctx.save();
  ctx.font = `900 ${fontSize * size}px monospace`;
  ctx.textBaseline = 'top';
  ctx.imageSmoothingEnabled = false;
  ctx.fillText(text, x * size, y * size);
  ctx.restore();
}

function getPixelBattleWsUrl() {
  const token = getAccessToken();
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

  return `${protocol}://${window.location.host}/ws/pixel-battle?token=${encodeURIComponent(token || '')}`;
}

function stopPixelBattle() {
  if (pixelBattleState.ws) {
    pixelBattleState.ws.close();
    pixelBattleState.ws = null;
  }

  if (pixelBattleState.cooldownTimer) {
    clearInterval(pixelBattleState.cooldownTimer);
    pixelBattleState.cooldownTimer = null;
  }

  if (pixelBattleState.refreshTimer) {
    clearInterval(pixelBattleState.refreshTimer);
    pixelBattleState.refreshTimer = null;
  }

  const viewport = document.getElementById('pixelBattleViewport');
  if (viewport) {
    viewport.classList.remove('is-dragging');
  }

  closePixelBattleClansModal();
}

async function pixelBattleConfirm({ title, message, confirmText = 'Подтвердить' }) {
  if (typeof showConfirmModal === 'function') {
    return showConfirmModal({
      title,
      message,
      confirmText,
    });
  }

  return window.confirm(`${title}\n\n${message}`);
}

function bindPixelBattleActions() {
  document.querySelectorAll('[data-pixel-battle-join-clan]').forEach((button) => {
    button.addEventListener('click', async () => {
      const clanId = button.dataset.pixelBattleJoinClan;
      const clan = pixelBattleState.clans.find((item) => Number(item.id) === Number(clanId));

      const confirmed = await pixelBattleConfirm({
        title: 'Выбрать клан?',
        message: `Вы выбираете клан ${clan ? `${clan.emoji} ${clan.name}` : ''}. Потом изменить клан нельзя.`,
        confirmText: 'Выбрать',
      });

      if (!confirmed) return;

      try {
        const response = await joinPixelBattleClan(clanId);
        const data = await response.json();

        if (!response.ok) {
          showToast(getApiErrorMessage(data, 'Не удалось выбрать клан'), 'error');
          return;
        }

        showToast('Клан выбран');
        await openPixelBattleFromDevFun();
      } catch {
        showToast('Сервер недоступен или возникла ошибка сети', 'error');
      }
    });
  });

  const backBtn = document.getElementById('backToDevFunFromPixelBattleBtn');
  if (backBtn) {
    backBtn.addEventListener('click', async () => {
      stopPixelBattle();
      setPixelBattleImmersiveMode(false);
      devFunView = 'hub';

      await renderStudentDashboard(currentUser, STUDENT_DEV_FUN_TAB_ID);

      // Страховка: если из-за конфликта старого studentDevFun.js контент оказался пустым,
      // сразу дорисовываем страницу приколов и биндим кнопки.
      const mainBlock = document.querySelector('.app-main');
      if (mainBlock && !mainBlock.textContent.trim()) {
        mainBlock.innerHTML = `
          ${typeof studentDashboardTitle === 'function' ? studentDashboardTitle(STUDENT_DEV_FUN_TAB_ID) : ''}
          ${renderStudentDeveloperFunHub()}
        `;
        bindStudentDeveloperFunActions();
      }
    });
  }

  document.querySelectorAll('[data-pixel-battle-color]').forEach((button) => {
    button.addEventListener('click', () => {
      pixelBattleState.selectedColor = button.dataset.pixelBattleColor;
      updatePixelBattlePaletteUi();
      updatePixelBattleSelectedPixelInfo();
      updatePixelBattleBottomInfo();
      drawPixelBattleCanvas();
    });
  });

  const zoomOutBtn = document.getElementById('pixelBattleZoomOutBtn');
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      changePixelBattleZoom(-0.2);
    });
  }

  const zoomInBtn = document.getElementById('pixelBattleZoomInBtn');
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      changePixelBattleZoom(0.2);
    });
  }

  const resetBtn = document.getElementById('pixelBattleResetViewBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetPixelBattleView();
    });
  }

  const placeBtn = document.getElementById('pixelBattlePlaceBtn');
  if (placeBtn) {
    placeBtn.addEventListener('click', async () => {
      await handlePixelBattlePlacePixel();
    });
  }

  const refreshLeaderboardBtn = document.getElementById('pixelBattleRefreshLeaderboardBtn');
  if (refreshLeaderboardBtn) {
    refreshLeaderboardBtn.addEventListener('click', async () => {
      await refreshPixelBattleLeaderboard();
    });
  }

  const showClansBtn = document.getElementById('pixelBattleShowClansBtn');
  if (showClansBtn) {
    showClansBtn.addEventListener('click', async () => {
      await showPixelBattleClansModal();
    });
  }

  setupPixelBattleCanvas();
  setPixelBattleImmersiveMode(true);
  connectPixelBattleWebSocket();
  startPixelBattleCooldownTimer();
  startPixelBattleRefreshTimer();
}

function bindStudentDeveloperFunActions() {
  if (devFunView === 'pixel_battle') {
    bindPixelBattleActions();
    return;
  }

  document.querySelectorAll('[data-dev-fun-open]').forEach((button) => {
    button.addEventListener('click', async () => {
      const view = button.dataset.devFunOpen;

      if (view === 'pixel_battle') {
        await openPixelBattleFromDevFun();
        return;
      }

      showToast('Эта игра будет позже');
    });
  });
}

// На случай, если в dashboard ещё вызывается старое имя.
function bindStudentPixelBattleActions() {
  bindStudentDeveloperFunActions();
}

function updatePixelBattlePaletteUi() {
  const palette = document.getElementById('pixelBattlePalette');

  if (palette) {
    palette.innerHTML = PIXEL_BATTLE_COLORS.map(renderPixelBattleColorButton).join('');

    document.querySelectorAll('[data-pixel-battle-color]').forEach((button) => {
      button.addEventListener('click', () => {
        pixelBattleState.selectedColor = button.dataset.pixelBattleColor;
        updatePixelBattlePaletteUi();
        updatePixelBattleSelectedPixelInfo();
        updatePixelBattleBottomInfo();
        drawPixelBattleCanvas();
      });
    });
  }

  const preview = document.getElementById('pixelBattleSelectedColorPreview');
  if (preview) {
    preview.style.background = pixelBattleState.selectedColor;
  }

  const text = document.getElementById('pixelBattleSelectedColorText');
  if (text) {
    text.textContent = pixelBattleState.selectedColor;
  }
}

async function openPixelBattleFromDevFun() {
  stopPixelBattle();
  devFunView = 'pixel_battle';
  await renderStudentDashboard(currentUser, STUDENT_DEV_FUN_TAB_ID);
}

async function handlePixelBattlePlacePixel() {
  if (!pixelBattleState.selectedCell) {
    showToast('Сначала выберите пиксель на полотне', 'error');
    return;
  }

  if (pixelBattleState.cooldownSecondsLeft > 0) {
    showToast(`Следующий пиксель можно поставить через ${pixelBattleState.cooldownSecondsLeft} сек.`, 'error');
    return;
  }

  try {
    const response = await placePixelBattlePixel({
      x: pixelBattleState.selectedCell.x,
      y: pixelBattleState.selectedCell.y,
      color: pixelBattleState.selectedColor,
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(getApiErrorMessage(data, 'Не удалось поставить пиксель'), 'error');
      return;
    }

    const normalized = normalizePixelBattlePixel(data);

    pixelBattleState.pixels.set(
      pixelBattleKey(normalized.x, normalized.y),
      normalized
    );

    pixelBattleState.cooldownSecondsLeft = 20;

    updatePixelBattleCooldownUi();
    updatePixelBattleBottomInfo();
    updatePixelBattleSelectedPixelInfo();
    drawPixelBattleCanvas();

    await refreshPixelBattleLeaderboard(false);

    showToast('Пиксель поставлен');
  } catch {
    showToast('Сервер недоступен или возникла ошибка сети', 'error');
  }
}

function connectPixelBattleWebSocket() {
  if (pixelBattleState.ws) {
    pixelBattleState.ws.close();
  }

  pixelBattleState.ws = new WebSocket(getPixelBattleWsUrl());

  pixelBattleState.ws.onmessage = async (event) => {
    try {
      const payload = JSON.parse(event.data);

      if (payload.type === 'pixel_updated' && payload.pixel) {
        const pixel = normalizePixelBattlePixel(payload.pixel);

        pixelBattleState.pixels.set(
          pixelBattleKey(pixel.x, pixel.y),
          pixel
        );

        updatePixelBattleBottomInfo();
        updatePixelBattleSelectedPixelInfo();
        drawPixelBattleCanvas();

        await refreshPixelBattleLeaderboard(false);
      }
    } catch {
      // ничего
    }
  };

  pixelBattleState.ws.onclose = () => {
    console.log('Pixel Battle WebSocket closed');
  };

  pixelBattleState.ws.onerror = () => {
    console.log('Pixel Battle WebSocket error');
  };
}

function startPixelBattleCooldownTimer() {
  if (pixelBattleState.cooldownTimer) {
    clearInterval(pixelBattleState.cooldownTimer);
  }

  updatePixelBattleCooldownUi();

  pixelBattleState.cooldownTimer = setInterval(() => {
    if (pixelBattleState.cooldownSecondsLeft > 0) {
      pixelBattleState.cooldownSecondsLeft -= 1;
      updatePixelBattleCooldownUi();
    }
  }, 1000);
}

function startPixelBattleRefreshTimer() {
  if (pixelBattleState.refreshTimer) {
    clearInterval(pixelBattleState.refreshTimer);
  }

  pixelBattleState.refreshTimer = setInterval(async () => {
    await refreshPixelBattleCanvas(false);
  }, 5000);
}

function updatePixelBattleCooldownUi() {
  const text = document.getElementById('pixelBattleCooldownText');
  const progress = document.getElementById('pixelBattleCooldownProgress');
  const button = document.getElementById('pixelBattlePlaceBtn');

  const canPlace = pixelBattleState.cooldownSecondsLeft <= 0;

  if (text) {
    text.textContent = pixelBattleCooldownLabel(pixelBattleState.cooldownSecondsLeft);
  }

  if (progress) {
    progress.style.width = `${pixelBattleProgress()}%`;
  }

  if (button) {
    button.disabled = !canPlace;
    button.classList.toggle('opacity-50', !canPlace);
    button.classList.toggle('cursor-not-allowed', !canPlace);
  }
}

async function refreshPixelBattleCanvas(showError = true) {
  try {
    const response = await getPixelBattleCanvas();

    if (!response.ok) {
      if (showError) {
        showToast('Не удалось обновить полотно', 'error');
      }
      return;
    }

    const canvas = await response.json();

    if (canvas.season) {
      pixelBattleState.season = canvas.season;
    }

    pixelBattleState.pixels = new Map();

    (canvas.pixels || []).forEach((pixel) => {
      const normalized = normalizePixelBattlePixel(pixel);
      pixelBattleState.pixels.set(pixelBattleKey(normalized.x, normalized.y), normalized);
    });

    updatePixelBattleBottomInfo();
    updatePixelBattleSelectedPixelInfo();
    drawPixelBattleCanvas();
  } catch {
    if (showError) {
      showToast('Сервер недоступен или возникла ошибка сети', 'error');
    }
  }
}

async function refreshPixelBattleLeaderboard(showError = true) {
  try {
    const response = await getPixelBattleLeaderboard();

    if (!response.ok) {
      if (showError) {
        showToast('Не удалось обновить лидерборд', 'error');
      }
      return;
    }

    const data = await response.json();
    pixelBattleState.leaderboard = data.items || [];

    const list = document.getElementById('pixelBattleLeaderboardList');

    if (list) {
      const top = pixelBattleState.leaderboard.slice(0, 5);

      list.innerHTML = top.length
        ? top.map(renderPixelBattleLeaderboardItem).join('')
        : `
          <div class="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-500 text-center">
            Пока нет активности.
          </div>
        `;
    }
  } catch {
    if (showError) {
      showToast('Сервер недоступен или возникла ошибка сети', 'error');
    }
  }
}
