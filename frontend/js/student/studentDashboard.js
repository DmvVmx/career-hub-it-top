function studentProfileReviewBlock(profile) {
  if (!profile) return '';

  if (profile.status === 'approved') {
    return `
      <div class="mb-5 rounded-2xl bg-green-50 border border-green-200 p-4">
        <div class="font-bold text-green-800">Профиль проверен</div>
        <p class="text-green-700 text-sm mt-1">
          Вы можете откликаться на вакансии, а работодатели могут видеть ваши публичные резюме.
        </p>
      </div>
    `;
  }

  if (profile.status === 'rejected') {
    return `
      <div class="mb-5 rounded-2xl bg-red-50 border border-red-200 p-4">
        <div class="font-bold text-red-800">Профиль отклонён</div>
        <p class="text-red-700 text-sm mt-2 whitespace-pre-wrap">
          ${safe(profile.rejection_reason || 'Администратор не указал причину.')}
        </p>
        <p class="text-red-700 text-sm mt-2">
          Пока профиль не проверен, отклики и публичная видимость резюме могут быть ограничены.
        </p>
      </div>
    `;
  }

  return `
    <div class="mb-5 rounded-2xl bg-yellow-50 border border-yellow-200 p-4">
      <div class="font-bold text-yellow-900">Профиль на проверке</div>
      <p class="text-yellow-800 text-sm mt-1">
        После подтверждения администратором вы сможете полноценно пользоваться платформой.
      </p>
    </div>
  `;
}

function studentDashboardTitle(activeTab) {
  const titles = {
    profile: 'Профиль',
    resume: 'Резюме',
    vacancies: 'Вакансии',
    applications: 'Отклики',
    teams: 'Команды',
    chats: 'Чаты',
    dev_fun: 'Приколы разработчика',
  };

  const subtitles = {
    profile: 'Данные студента из журнала IT TOP и статус проверки.',
    resume: 'Создание, редактирование и скачивание резюме.',
    vacancies: 'Доступные вакансии от проверенных работодателей.',
    applications: 'История ваших откликов и приглашений.',
    teams: 'Командные проекты будут добавлены позже.',
    chats: 'Переписка с работодателями.',
    dev_fun: 'Мини-игры, пасхалки и полезные штуки от разработчика.',
  };

  return `
    <div class="mb-6">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 class="app-title">${titles[activeTab] || 'Кабинет студента'}</h2>
          <p class="app-subtitle">${subtitles[activeTab] || 'Рабочая панель студента.'}</p>
        </div>

        <div class="hidden md:flex items-center gap-2 rounded-2xl bg-white/80 border border-slate-200 px-4 py-2 text-sm text-slate-600">
          <span class="font-bold text-slate-900">Роль:</span>
          <span>студент</span>
        </div>
      </div>
    </div>
  `;
}

function studentDashboardSidebar(tabs, activeTab, profile) {
  return `
    <aside class="app-sidebar">
      <div class="mb-5 px-1">
        <div class="flex items-center gap-3">
          ${
            profile.photo_url
              ? `<img src="${profile.photo_url}" class="w-11 h-11 rounded-2xl object-cover border border-slate-200" />`
              : `<div class="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">С</div>`
          }

          <div class="min-w-0">
            <div class="font-black text-slate-900 truncate">${safe(profile.full_name)}</div>
            <div class="text-sm text-slate-500 truncate">${safe(profile.group_name)}</div>
          </div>
        </div>
      </div>

      ${createTabs(tabs, activeTab)}
    </aside>
  `;
}

function studentProfileContent(user, profile) {
  const photo = profile.photo_url;

  return `
    ${studentProfileReviewBlock(profile)}

    <div class="grid lg:grid-cols-[280px_1fr] gap-5">
      <aside class="app-card">
        <div class="flex flex-col items-center text-center">
          ${
            photo
              ? `<img src="${photo}" alt="Фото студента" class="w-28 h-28 rounded-3xl object-cover border border-slate-200" />`
              : `<div class="w-28 h-28 rounded-3xl bg-purple-100 flex items-center justify-center text-4xl font-black text-purple-700">С</div>`
          }

          <h3 class="mt-4 text-xl font-black">${safe(profile.full_name)}</h3>
          <p class="text-slate-600 mt-1">${safe(profile.group_name)}</p>

          <div class="mt-4 flex gap-2 flex-wrap justify-center">
            <span class="app-badge app-badge-success">Студент</span>
            ${statusBadge(profile.status || 'pending')}
          </div>
        </div>
      </aside>

      <section class="app-card">
        <div class="flex items-start justify-between gap-4 flex-wrap mb-5">
          <div>
            <h3 class="text-xl font-black">Данные из журнала</h3>
            <p class="text-sm text-slate-500 mt-1">
              Эти данные подтягиваются из журнала IT TOP.
            </p>
          </div>
        </div>

        <div class="app-grid-2">
          ${card('ФИО', profile.full_name)}
          ${card('Группа', profile.group_name)}
          ${card('Дата рождения', profile.birthday)}
          ${card('Уровень', profile.level)}
          ${card('Статус проверки', statusLabel(profile.status || 'pending'))}
          ${card('Логин журнала', user.journal_login)}
        </div>
      </section>
    </div>
  `;
}

async function renderStudentDashboard(user, activeTab = 'profile') {
  const tabs = [
    { id: 'profile', label: 'Профиль' },
    { id: 'resume', label: 'Резюме' },
    { id: 'vacancies', label: 'Вакансии' },
    { id: 'applications', label: 'Отклики' },
    { id: 'teams', label: 'Команды' },
    { id: 'chats', label: 'Чаты' },
    { id: 'dev_fun', label: '🎮 Приколы разработчика' },
  ];

  const profile = user.student_profile || {};
  let content = '';

  if (activeTab === 'profile') {
    content = studentProfileContent(user, profile);
  }

  if (activeTab === 'resume') {
    content = await renderStudentResumeTab();
  }

  if (activeTab === 'vacancies') {
    content = await renderStudentVacanciesTab();
  }

  if (activeTab === 'applications') {
    content = await renderStudentApplicationsTab();
  }

  if (activeTab === 'teams') {
    content = placeholderBlock(
      'Команды',
      'Командные проекты будут добавлены позже.'
    );
  }

  if (activeTab === 'chats') {
    content = await renderChatsTab('student');
  }

  if (activeTab === 'dev_fun') {
    content = renderStudentDevFunTab();
  }

  dashboardContent.innerHTML = `
    <div class="app-layout">
      ${studentDashboardSidebar(tabs, activeTab, profile)}

      <main class="app-main">
        ${studentDashboardTitle(activeTab)}
        ${content}
      </main>
    </div>
  `;

  bindDashboardTabs('student');
  bindStudentVacancyActions();
  bindStudentResumeActions();
  bindStudentApplicationActions();
  bindChatActions('student');

  if (activeTab === 'dev_fun') {
    bindStudentDevFunActions();
  }
}