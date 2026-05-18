function employerDashboardTitle(activeTab) {
  const titles = {
    company: 'Компания',
    vacancies: 'Мои вакансии',
    'create-vacancy': 'Создать вакансию',
    applications: 'Отклики',
    students: 'Студенты',
    chats: 'Чаты',
  };

  const subtitles = {
    company: 'Профиль компании, статус проверки и причина отклонения.',
    vacancies: 'Созданные вакансии, архив и редактирование.',
    'create-vacancy': 'Форма создания новой вакансии для студентов.',
    applications: 'Отклики студентов и приглашения на вакансии.',
    students: 'Публичные резюме студентов.',
    chats: 'Переписка со студентами.',
  };

  return `
    <div class="mb-6">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 class="app-title">${titles[activeTab] || 'Кабинет работодателя'}</h2>
          <p class="app-subtitle">${subtitles[activeTab] || 'Рабочая панель работодателя.'}</p>
        </div>

        <div class="hidden md:flex items-center gap-2 rounded-2xl bg-white/80 border border-slate-200 px-4 py-2 text-sm text-slate-600">
          <span class="font-bold text-slate-900">Роль:</span>
          <span>работодатель</span>
        </div>
      </div>
    </div>
  `;
}

function employerDashboardSidebar(tabs, activeTab) {
  return `
    <aside class="app-sidebar">
      <div class="mb-5 px-1">
        <div class="flex items-center gap-3">
         

          <div class="min-w-0">
            <div class="font-black text-slate-900 truncate">Работодатель</div>
            <div class="text-sm text-slate-500 truncate">Кабинет компании</div>
          </div>
        </div>
      </div>

      ${createTabs(tabs, activeTab)}
    </aside>
  `;
}

async function renderEmployerDashboard(user, activeTab = 'company') {
  const tabs = [
    { id: 'company', label: 'Компания' },
    { id: 'vacancies', label: 'Мои вакансии' },
    { id: 'create-vacancy', label: 'Создать вакансию' },
    { id: 'applications', label: 'Отклики' },
    { id: 'students', label: 'Студенты' },
    { id: 'chats', label: 'Чаты' },
  ];

  let content = '';

  if (activeTab === 'company') {
    content = await renderEmployerCompanyTab(user);
  }

  if (activeTab === 'vacancies') {
    content = await renderEmployerVacanciesTab();
  }

  if (activeTab === 'create-vacancy') {
    content = await renderCreateVacancyTab();
  }

  if (activeTab === 'applications') {
    content = await renderEmployerApplicationsTab();
  }

  if (activeTab === 'students') {
    content = await renderPublicResumesForEmployerTab();
  }

  if (activeTab === 'chats') {
    content = await renderChatsTab('employer');
  }

  dashboardContent.innerHTML = `
    <div class="app-layout">
      ${employerDashboardSidebar(tabs, activeTab)}

      <main class="app-main">
        ${employerDashboardTitle(activeTab)}
        ${content}
      </main>
    </div>
  `;

  bindDashboardTabs('employer');
  bindEmployerProfileForm();
  bindCreateVacancyForm();
  bindEmployerVacancyActions();
  bindEmployerPublicResumeActions();
  bindEmployerApplicationActions();
  bindChatActions('employer');

  const goToCompanyProfileBtn = document.getElementById('goToCompanyProfileBtn');

  if (goToCompanyProfileBtn) {
    goToCompanyProfileBtn.addEventListener('click', async () => {
      await renderEmployerDashboard(currentUser, 'company');
    });
  }
}