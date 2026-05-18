let studentApplicationsLimit = 50;
let studentApplicationsOffset = 0;
let studentApplicationsCache = [];

let studentApplicationsFilters = {
  search: '',
  status: '',
  vacancyId: '',
};

function applicationStatusLabel(status) {
  const labels = {
    sent: 'Отправлен',
    viewed: 'Просмотрен',
    invited: 'Приглашение',
    accepted: 'Принято',
    rejected: 'Отклонён работодателем',
    student_rejected: 'Вы отклонили',
  };

  return labels[status] || status || '—';
}

function studentApplicationDateLabel(value) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

function studentApplicationStatusBadge(status) {
  const classes = {
    sent: 'app-badge app-badge-warning',
    viewed: 'app-badge',
    invited: 'app-badge app-badge-warning',
    accepted: 'app-badge app-badge-success',
    rejected: 'app-badge app-badge-danger',
    student_rejected: 'app-badge app-badge-danger',
  };

  return `
    <span class="${classes[status] || 'app-badge'}">
      ${applicationStatusLabel(status)}
    </span>
  `;
}

function studentApplicationCompanyLogo(company) {
  if (company && company.avatar_url) {
    return `
      <img
        src="${company.avatar_url}"
        class="w-16 h-16 rounded-2xl object-cover border border-slate-200"
        alt="Логотип компании"
      />
    `;
  }

  const letter = company && company.company_name ? company.company_name[0] : 'К';

  return `
    <div class="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-xl font-black text-blue-700">
      ${safe(letter)}
    </div>
  `;
}

function studentApplicationMainAction(application) {
  if (application.status === 'invited') {
    return `
      <div class="rounded-3xl bg-yellow-50 border border-yellow-100 p-5">
        <div class="font-black text-yellow-900">Работодатель пригласил вас</div>
        <p class="mt-2 text-sm text-yellow-800 leading-6">
          Если предложение вам подходит, примите приглашение. После принятия откроется чат по этой вакансии.
        </p>

        <div class="mt-4 flex gap-3 flex-wrap">
          <button
            data-student-app-status="${application.id}"
            data-status="accepted"
            class="app-button app-button-primary"
          >
            Принять приглашение
          </button>

          <button
            data-student-app-status="${application.id}"
            data-status="student_rejected"
            class="app-button app-button-danger"
          >
            Отклонить
          </button>
        </div>
      </div>
    `;
  }

  if (application.status === 'accepted') {
    return `
      <div class="rounded-3xl bg-green-50 border border-green-100 p-5">
        <div class="font-black text-green-800">Приглашение принято</div>
        <p class="mt-2 text-sm text-green-700 leading-6">
          Теперь доступен чат с работодателем по этой конкретной вакансии.
        </p>

        <button
          data-create-chat-from-application="${application.id}"
          class="app-button app-button-primary mt-4"
        >
          Открыть чат
        </button>
      </div>
    `;
  }

  if (application.status === 'rejected') {
    return `
      <div class="rounded-3xl bg-red-50 border border-red-100 p-5">
        <div class="font-black text-red-800">Работодатель отклонил отклик</div>
        <p class="mt-2 text-sm text-red-700 leading-6">
          По этой вакансии чат недоступен. Вы можете откликнуться на другие вакансии.
        </p>
      </div>
    `;
  }

  if (application.status === 'student_rejected') {
    return `
      <div class="rounded-3xl bg-red-50 border border-red-100 p-5">
        <div class="font-black text-red-800">Вы отклонили приглашение</div>
        <p class="mt-2 text-sm text-red-700 leading-6">
          Чат по этой вакансии не открыт. Если работодатель пригласит вас повторно, вы сможете принять приглашение.
        </p>
      </div>
    `;
  }

  if (application.status === 'viewed') {
    return `
      <div class="rounded-3xl bg-blue-50 border border-blue-100 p-5">
        <div class="font-black text-blue-800">Отклик просмотрен</div>
        <p class="mt-2 text-sm text-blue-700 leading-6">
          Работодатель уже посмотрел ваш отклик. Если он пригласит вас, здесь появятся кнопки принятия или отклонения.
        </p>
      </div>
    `;
  }

  return `
    <div class="rounded-3xl bg-slate-50 border border-slate-200 p-5">
      <div class="font-black text-slate-900">Отклик отправлен</div>
      <p class="mt-2 text-sm text-slate-600 leading-6">
        Работодатель ещё не принял решение. Чат появится только после приглашения работодателя и вашего согласия.
      </p>
    </div>
  `;
}

function studentApplicationVacancyMiniDetail(vacancy) {
  if (!vacancy) {
    return placeholderBlock('Вакансия', 'Данные вакансии не найдены.');
  }

  return `
    <div class="space-y-5">
      <button id="backToStudentApplicationsBtn" class="app-button">
        ← Назад к откликам
      </button>

      <article class="app-card">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div class="app-badge app-badge-success">Вакансия из отклика</div>

            <h2 class="mt-4 text-3xl font-black text-slate-900">
              ${safe(vacancy.title)}
            </h2>

            <p class="mt-2 text-slate-600">
              ${safe(vacancy.city)} · ${directionLabel(vacancy.direction)}
            </p>
          </div>

          ${vacancy.status ? statusBadge(vacancy.status) : ''}
        </div>

        <div class="mt-6 grid md:grid-cols-2 gap-3">
          ${card('Город', vacancy.city)}
          ${card('Направление', directionLabel(vacancy.direction))}
          ${card('Формат', catalogWorkFormatLabel(vacancy.work_format))}
          ${card('Занятость', catalogEmploymentTypeLabel(vacancy.employment_type))}
          ${card('Зарплата', formatSalary(vacancy))}
        </div>

        <div class="mt-6 grid lg:grid-cols-2 gap-5">
          <section class="rounded-3xl bg-slate-50 border border-slate-200 p-5">
            <h4 class="font-black text-slate-900">Описание</h4>
            <div class="mt-3 whitespace-pre-wrap leading-7 text-slate-700">
              ${safe(vacancy.description)}
            </div>
          </section>

          <section class="rounded-3xl bg-slate-50 border border-slate-200 p-5">
            <h4 class="font-black text-slate-900">Требования</h4>
            <div class="mt-3 whitespace-pre-wrap leading-7 text-slate-700">
              ${safe(vacancy.requirements)}
            </div>
          </section>
        </div>

        ${
          vacancy.skills
            ? `
              <div class="mt-6 rounded-3xl bg-blue-50 border border-blue-100 p-5">
                <h4 class="font-black text-blue-950">Навыки</h4>
                <div class="mt-3 flex flex-wrap gap-2">
                  ${skillsToArray(vacancy.skills)
                    .map((skill) => `<span class="app-tag app-tag-blue">${safe(skill)}</span>`)
                    .join('')}
                </div>
              </div>
            `
            : ''
        }
      </article>
    </div>
  `;
}

function studentApplicationCard(application) {
  const vacancy = application.vacancy || {};
  const company = application.company || {};
  const resume = application.resume || {};

  return `
    <article class="app-card hover:shadow-lg transition">
      <div class="flex items-start justify-between gap-5 flex-wrap">
        <div class="flex items-start gap-4 min-w-0">
          ${studentApplicationCompanyLogo(company)}

          <div class="min-w-0">
            <div class="flex gap-2 flex-wrap mb-3">
              ${studentApplicationStatusBadge(application.status)}
              <span class="app-tag">${studentApplicationDateLabel(application.created_at)}</span>
            </div>

            <h3 class="text-2xl font-black text-slate-900 tracking-tight break-words">
              ${safe(vacancy.title)}
            </h3>

            <p class="mt-1 text-slate-600">
              ${safe(company.company_name)}
            </p>
          </div>
        </div>

        <div class="text-left md:text-right">
          <div class="text-xs text-slate-500 font-bold">Статус</div>
          <div class="mt-1 font-black text-slate-900">
            ${applicationStatusLabel(application.status)}
          </div>
        </div>
      </div>

      <div class="mt-6 grid md:grid-cols-3 gap-3">
        ${card('Вакансия', vacancy.title)}
        ${card('Резюме', resume.title || 'Без резюме')}
        ${card('Дата отклика', studentApplicationDateLabel(application.created_at))}
      </div>

      <div class="mt-5 flex gap-3 flex-wrap">
        <button
          data-student-application-vacancy-view="${application.id}"
          class="app-button app-button-blue"
        >
          Открыть вакансию
        </button>
      </div>

      ${
        application.message
          ? `
            <div class="mt-5 rounded-3xl bg-slate-50 border border-slate-200 p-5">
              <div class="text-sm font-bold text-slate-500">Ваше сообщение</div>
              <div class="mt-2 whitespace-pre-wrap leading-7 text-slate-800">
                ${safe(application.message)}
              </div>
            </div>
          `
          : `
            <div class="mt-5 rounded-3xl bg-slate-50 border border-slate-200 p-5">
              <div class="text-sm text-slate-500">Вы отправили отклик без сообщения.</div>
            </div>
          `
      }

      <div class="mt-5">
        ${studentApplicationMainAction(application)}
      </div>
    </article>
  `;
}

function getStudentApplicationVacancyOptions(applications) {
  const map = new Map();

  applications.forEach((application) => {
    const vacancy = application.vacancy;
    if (vacancy && vacancy.id) {
      map.set(String(vacancy.id), vacancy.title || `Вакансия #${vacancy.id}`);
    }
  });

  return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
}

function studentApplicationMatchesFilters(application) {
  const search = studentApplicationsFilters.search.toLowerCase();
  const vacancy = application.vacancy || {};
  const company = application.company || {};
  const resume = application.resume || {};

  const text = [
    company.company_name,
    vacancy.title,
    vacancy.city,
    directionLabel(vacancy.direction),
    resume.title,
    resume.skills,
    application.message,
    applicationStatusLabel(application.status),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (search && !text.includes(search)) {
    return false;
  }

  if (studentApplicationsFilters.status && application.status !== studentApplicationsFilters.status) {
    return false;
  }

  if (
    studentApplicationsFilters.vacancyId &&
    String(vacancy.id) !== String(studentApplicationsFilters.vacancyId)
  ) {
    return false;
  }

  return true;
}

function getFilteredStudentApplications() {
  return studentApplicationsCache.filter(studentApplicationMatchesFilters);
}

function renderStudentApplicationsFilters(applications) {
  const vacancies = getStudentApplicationVacancyOptions(applications);

  return `
    <div class="app-card">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 class="text-xl font-black text-slate-900">Фильтры откликов</h3>
          <p class="text-slate-600 mt-1">
            Найдите нужный отклик по компании, вакансии, резюме или статусу.
          </p>
        </div>

        <button id="clearStudentApplicationsFiltersBtn" class="app-button">
          Очистить
        </button>
      </div>

      <div class="mt-5 grid lg:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">Поиск</label>
          <input
            id="studentApplicationsSearch"
            type="text"
            value="${inputValue(studentApplicationsFilters.search)}"
            placeholder="Компания, вакансия, резюме..."
            class="app-input"
          />
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">Статус</label>
          <select id="studentApplicationsStatusFilter" class="app-select">
            <option value="">Все статусы</option>
            <option value="sent" ${studentApplicationsFilters.status === 'sent' ? 'selected' : ''}>Отправлены</option>
            <option value="viewed" ${studentApplicationsFilters.status === 'viewed' ? 'selected' : ''}>Просмотрены</option>
            <option value="invited" ${studentApplicationsFilters.status === 'invited' ? 'selected' : ''}>Приглашения</option>
            <option value="accepted" ${studentApplicationsFilters.status === 'accepted' ? 'selected' : ''}>Приняты</option>
            <option value="rejected" ${studentApplicationsFilters.status === 'rejected' ? 'selected' : ''}>Отклонены работодателем</option>
            <option value="student_rejected" ${studentApplicationsFilters.status === 'student_rejected' ? 'selected' : ''}>Отклонены вами</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">Вакансия</label>
          <select id="studentApplicationsVacancyFilter" class="app-select">
            <option value="">Все вакансии</option>
            ${
              vacancies.map((vacancy) => `
                <option
                  value="${vacancy.id}"
                  ${String(studentApplicationsFilters.vacancyId) === String(vacancy.id) ? 'selected' : ''}
                >
                  ${safe(vacancy.title)}
                </option>
              `).join('')
            }
          </select>
        </div>
      </div>

      <div id="studentApplicationsFilterCount" class="mt-4 text-sm text-slate-500"></div>
    </div>
  `;
}

function renderStudentApplicationsList() {
  const list = document.getElementById('studentApplicationsList');
  const count = document.getElementById('studentApplicationsFilterCount');

  if (!list) return;

  const filtered = getFilteredStudentApplications();

  list.innerHTML = filtered.length
    ? `<div class="space-y-4">${filtered.map(studentApplicationCard).join('')}</div>`
    : placeholderBlock('Отклики', 'По выбранным фильтрам отклики не найдены.');

  if (count) {
    count.textContent = `Показано по фильтрам: ${filtered.length} из ${studentApplicationsCache.length}`;
  }

  bindStudentApplicationCardActions();
}

function bindStudentApplicationsFilters() {
  const searchInput = document.getElementById('studentApplicationsSearch');
  const statusSelect = document.getElementById('studentApplicationsStatusFilter');
  const vacancySelect = document.getElementById('studentApplicationsVacancyFilter');
  const clearBtn = document.getElementById('clearStudentApplicationsFiltersBtn');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      studentApplicationsFilters.search = searchInput.value.trim();
      renderStudentApplicationsList();
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', () => {
      studentApplicationsFilters.status = statusSelect.value;
      renderStudentApplicationsList();
    });
  }

  if (vacancySelect) {
    vacancySelect.addEventListener('change', () => {
      studentApplicationsFilters.vacancyId = vacancySelect.value;
      renderStudentApplicationsList();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      studentApplicationsFilters = {
        search: '',
        status: '',
        vacancyId: '',
      };

      if (searchInput) searchInput.value = '';
      if (statusSelect) statusSelect.value = '';
      if (vacancySelect) vacancySelect.value = '';

      renderStudentApplicationsList();
    });
  }

  renderStudentApplicationsList();
}

function renderStudentApplicationsPagination(data) {
  const hasPrev = data.offset > 0;
  const hasNext = data.offset + data.limit < data.total;

  return `
    <div class="flex items-center justify-between gap-4 flex-wrap bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div class="text-sm text-slate-600">
        Показано ${data.items.length} из ${data.total}
      </div>

      <div class="flex gap-3">
        <button
          id="studentAppsPrevBtn"
          ${!hasPrev ? 'disabled' : ''}
          class="app-button disabled:opacity-50"
        >
          Назад
        </button>

        <button
          id="studentAppsNextBtn"
          ${!hasNext ? 'disabled' : ''}
          class="app-button disabled:opacity-50"
        >
          Еще
        </button>
      </div>
    </div>
  `;
}

async function renderStudentApplicationsTab() {
  try {
    const response = await getMyApplications(studentApplicationsLimit, studentApplicationsOffset);

    if (!response.ok) {
      return placeholderBlock('Отклики', 'Не удалось загрузить отклики.');
    }

    const data = await response.json();
    const applications = data.items || [];
    studentApplicationsCache = applications;

    const invitedCount = applications.filter((application) => application.status === 'invited').length;
    const acceptedCount = applications.filter((application) => application.status === 'accepted').length;

    return `
      <div class="space-y-6">
        <div class="app-card">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 class="text-xl font-black text-slate-900">Мои отклики</h3>
              <p class="text-slate-600 mt-1">
                Здесь отображаются ваши отклики и приглашения работодателей.
              </p>
            </div>

            <div class="flex gap-3 flex-wrap">
              <div class="app-mini-stat">
                <div class="app-mini-stat-label">Приглашения</div>
                <div class="app-mini-stat-value">${invitedCount}</div>
              </div>

              <div class="app-mini-stat">
                <div class="app-mini-stat-label">Приняты</div>
                <div class="app-mini-stat-value">${acceptedCount}</div>
              </div>
            </div>
          </div>
        </div>

        ${renderStudentApplicationsFilters(applications)}

        <div id="studentApplicationsList"></div>

        ${renderStudentApplicationsPagination(data)}
      </div>
    `;
  } catch {
    return placeholderBlock('Отклики', 'Сервер недоступен.');
  }
}

async function openStudentChatFromApplication(applicationId) {
  const response = await createChatFromApplication(applicationId);
  const data = await response.json();

  if (!response.ok) {
    showToast(
      getApiErrorMessage(data, 'Не удалось открыть чат'),
      'error'
    );
    return;
  }

  showToast('Чат открыт');

  await renderStudentDashboard(currentUser, 'chats');

  setTimeout(async () => {
    if (typeof openChatInline === 'function') {
      await openChatInline(data.id, 'student');
    }
  }, 0);
}

function bindStudentApplicationCardActions() {
  document.querySelectorAll('[data-student-app-status]').forEach((button) => {
    button.addEventListener('click', async () => {
      const applicationId = button.dataset.studentAppStatus;
      const newStatus = button.dataset.status;

      let confirmed = true;

      if (newStatus === 'accepted') {
        confirmed = await showConfirmModal({
          title: 'Принять приглашение?',
          message: 'После принятия откроется чат с работодателем по этой вакансии.',
          confirmText: 'Принять',
        });
      }

      if (newStatus === 'student_rejected') {
        confirmed = await showConfirmModal({
          title: 'Отклонить приглашение?',
          message: 'Чат по этой вакансии не будет открыт.',
          confirmText: 'Отклонить',
          danger: true,
        });
      }

      if (!confirmed) return;

      try {
        const response = await updateStudentApplicationStatus(applicationId, newStatus);
        const data = await response.json();

        if (!response.ok) {
          showToast(
            getApiErrorMessage(data, 'Не удалось обновить статус'),
            'error'
          );
          return;
        }

        showToast(newStatus === 'accepted' ? 'Приглашение принято' : 'Приглашение отклонено');
        await renderStudentDashboard(currentUser, 'applications');
      } catch {
        showToast('Сервер недоступен или возникла ошибка сети', 'error');
      }
    });
  });

  document.querySelectorAll('[data-create-chat-from-application]').forEach((button) => {
    button.addEventListener('click', async () => {
      const applicationId = button.dataset.createChatFromApplication;

      try {
        await openStudentChatFromApplication(applicationId);
      } catch {
        showToast('Сервер недоступен или возникла ошибка сети', 'error');
      }
    });
  });

  document.querySelectorAll('[data-student-application-vacancy-view]').forEach((button) => {
    button.addEventListener('click', async () => {
      const applicationId = Number(button.dataset.studentApplicationVacancyView);
      const application = studentApplicationsCache.find((item) => Number(item.id) === applicationId);

      if (!application || !application.vacancy) {
        showToast('Вакансия не найдена', 'error');
        return;
      }

      dashboardContent.innerHTML = studentApplicationVacancyMiniDetail(application.vacancy);

      const backBtn = document.getElementById('backToStudentApplicationsBtn');
      if (backBtn) {
        backBtn.addEventListener('click', async () => {
          await renderStudentDashboard(currentUser, 'applications');
        });
      }
    });
  });
}

function bindStudentApplicationActions() {
  const prevBtn = document.getElementById('studentAppsPrevBtn');
  if (prevBtn) {
    prevBtn.addEventListener('click', async () => {
      studentApplicationsOffset = Math.max(0, studentApplicationsOffset - studentApplicationsLimit);
      await renderStudentDashboard(currentUser, 'applications');
    });
  }

  const nextBtn = document.getElementById('studentAppsNextBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', async () => {
      studentApplicationsOffset += studentApplicationsLimit;
      await renderStudentDashboard(currentUser, 'applications');
    });
  }

  bindStudentApplicationsFilters();
}