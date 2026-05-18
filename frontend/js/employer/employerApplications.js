let employerApplicationsLimit = 50;
let employerApplicationsOffset = 0;
let employerApplicationsCache = [];

let employerApplicationsFilters = {
  search: '',
  status: '',
  vacancyId: '',
};

function employerApplicationStatusLabel(status) {
  const labels = {
    sent: 'Новый отклик',
    viewed: 'Просмотрен',
    invited: 'Ожидает ответа студента',
    accepted: 'Принято студентом',
    rejected: 'Отклонён работодателем',
    student_rejected: 'Отклонено студентом',
  };

  return labels[status] || status || '—';
}

function employerApplicationDateLabel(value) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

function employerApplicationAvatar(application) {
  const student = application.student || {};

  if (student.photo_url) {
    return `
      <img
        src="${student.photo_url}"
        class="w-16 h-16 rounded-2xl object-cover border border-slate-200"
        alt="Фото студента"
      />
    `;
  }

  const letter = student.full_name ? student.full_name[0] : 'С';

  return `
    <div class="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-xl font-black text-purple-700">
      ${safe(letter)}
    </div>
  `;
}

function employerApplicationStatusBadge(status) {
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
      ${employerApplicationStatusLabel(status)}
    </span>
  `;
}

function employerApplicationMainAction(application) {
  if (application.status === 'rejected') {
    return `
      <div class="rounded-3xl bg-red-50 border border-red-100 p-5">
        <div class="font-black text-red-800">Вы отклонили отклик</div>
        <p class="mt-2 text-sm text-red-700 leading-6">
          Чат по этой вакансии не открыт. Если решение изменилось, вы можете снова пригласить студента.
        </p>

        <button
          data-employer-app-status="${application.id}"
          data-status="invited"
          class="app-button app-button-primary mt-4"
        >
          Пригласить снова
        </button>
      </div>
    `;
  }

  if (application.status === 'student_rejected') {
    return `
      <div class="rounded-3xl bg-red-50 border border-red-100 p-5">
        <div class="font-black text-red-800">Студент отклонил приглашение</div>
        <p class="mt-2 text-sm text-red-700 leading-6">
          Чат по этой вакансии не открыт. Вы можете пригласить студента повторно, если предложение всё ещё актуально.
        </p>

        <button
          data-employer-app-status="${application.id}"
          data-status="invited"
          class="app-button app-button-primary mt-4"
        >
          Пригласить снова
        </button>
      </div>
    `;
  }

  if (application.status === 'accepted') {
    return `
      <div class="rounded-3xl bg-green-50 border border-green-100 p-5">
        <div class="font-black text-green-800">Студент принял приглашение</div>
        <p class="mt-2 text-sm text-green-700 leading-6">
          Теперь доступен чат по этой конкретной вакансии.
        </p>

        <div class="mt-4 flex gap-3 flex-wrap">
          <button
            data-create-chat-from-application="${application.id}"
            class="app-button app-button-primary"
          >
            Открыть чат
          </button>

          <button
            data-employer-app-status="${application.id}"
            data-status="rejected"
            class="app-button app-button-danger"
          >
            Закрыть / отклонить
          </button>
        </div>
      </div>
    `;
  }

  if (application.status === 'invited') {
    return `
      <div class="rounded-3xl bg-yellow-50 border border-yellow-100 p-5">
        <div class="font-black text-yellow-900">Ожидаем ответ студента</div>
        <p class="mt-2 text-sm text-yellow-800 leading-6">
          Вы пригласили студента. Чат откроется только после того, как студент примет приглашение.
        </p>

        <button
          data-employer-app-status="${application.id}"
          data-status="rejected"
          class="app-button app-button-danger mt-4"
        >
          Отменить приглашение
        </button>
      </div>
    `;
  }

  if (application.status === 'viewed') {
    return `
      <div class="rounded-3xl bg-blue-50 border border-blue-100 p-5">
        <div class="font-black text-blue-800">Отклик просмотрен</div>
        <p class="mt-2 text-sm text-blue-700 leading-6">
          Вы посмотрели отклик. Теперь можно пригласить студента или отклонить отклик.
        </p>

        <div class="mt-4 flex gap-3 flex-wrap">
          <button
            data-employer-app-status="${application.id}"
            data-status="invited"
            class="app-button app-button-primary"
          >
            Пригласить
          </button>

          <button
            data-employer-app-status="${application.id}"
            data-status="rejected"
            class="app-button app-button-danger"
          >
            Отклонить
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="rounded-3xl bg-slate-50 border border-slate-200 p-5">
      <div class="font-black text-slate-900">Новый отклик</div>
      <p class="mt-2 text-sm text-slate-600 leading-6">
        Посмотрите резюме студента. Чат откроется только после приглашения и согласия студента.
      </p>

      <div class="mt-4 flex gap-3 flex-wrap">
        <button
          data-employer-app-status="${application.id}"
          data-status="viewed"
          class="app-button"
        >
          Отметить просмотренным
        </button>

        <button
          data-employer-app-status="${application.id}"
          data-status="invited"
          class="app-button app-button-primary"
        >
          Пригласить
        </button>

        <button
          data-employer-app-status="${application.id}"
          data-status="rejected"
          class="app-button app-button-danger"
        >
          Отклонить
        </button>
      </div>
    </div>
  `;
}

function employerApplicationResumeBlock(application) {
  if (!application.resume) {
    return `
      <div class="rounded-3xl bg-slate-50 border border-slate-200 p-5">
        <div class="font-black text-slate-900">Резюме не прикреплено</div>
        <p class="mt-2 text-sm text-slate-600">
          Студент отправил отклик без доступного резюме.
        </p>
      </div>
    `;
  }

  return `
    <div class="rounded-3xl bg-purple-50 border border-purple-100 p-5">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div class="min-w-0 flex-1">
          <div class="text-xs font-black text-purple-700 uppercase tracking-wide">
            Прикреплённое резюме
          </div>

          <h4 class="mt-2 text-xl font-black text-purple-950 break-words">
            ${safe(application.resume.title)}
          </h4>

          <p class="mt-2 text-sm text-purple-800 leading-6">
            ${shortText(application.resume.about || application.resume.skills, 220)}
          </p>

          ${
            application.resume.skills
              ? `
                <div class="mt-4 flex flex-wrap gap-2">
                  ${skillsToArray(application.resume.skills)
                    .slice(0, 10)
                    .map((skill) => `<span class="app-tag app-tag-purple">${safe(skill)}</span>`)
                    .join('')}
                </div>
              `
              : ''
          }
        </div>

        <button
          data-application-resume-view="${application.resume.id}"
          class="app-button app-button-purple"
        >
          Открыть резюме
        </button>
      </div>
    </div>
  `;
}

function employerApplicationVacancyMiniDetail(vacancy) {
  if (!vacancy) {
    return placeholderBlock('Вакансия', 'Данные вакансии не найдены.');
  }

  return `
    <div class="space-y-5">
      <button id="backToEmployerApplicationsBtn" class="app-button">
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

function employerApplicationCard(application) {
  const student = application.student || {};
  const vacancy = application.vacancy || {};
  const resume = application.resume || {};

  return `
    <article class="app-card hover:shadow-lg transition">
      <div class="flex items-start justify-between gap-5 flex-wrap">
        <div class="flex items-start gap-4 min-w-0">
          ${employerApplicationAvatar(application)}

          <div class="min-w-0">
            <div class="flex gap-2 flex-wrap mb-3">
              ${employerApplicationStatusBadge(application.status)}
              <span class="app-tag">${employerApplicationDateLabel(application.created_at)}</span>
            </div>

            <h3 class="text-2xl font-black text-slate-900 tracking-tight break-words">
              ${safe(student.full_name)}
            </h3>

            <p class="mt-1 text-slate-600">
              ${safe(student.group_name)}
            </p>
          </div>
        </div>

        <div class="text-left md:text-right">
          <div class="text-xs text-slate-500 font-bold">Вакансия</div>
          <div class="mt-1 font-black text-slate-900 max-w-sm break-words">
            ${safe(vacancy.title)}
          </div>
        </div>
      </div>

      <div class="mt-6 grid md:grid-cols-3 gap-3">
        ${card('Вакансия', vacancy.title)}
        ${card('Резюме', resume.title || 'Без резюме')}
        ${card('Дата отклика', employerApplicationDateLabel(application.created_at))}
      </div>

      <div class="mt-5 flex gap-3 flex-wrap">
        <button
          data-application-vacancy-view="${application.id}"
          class="app-button app-button-blue"
        >
          Открыть вакансию
        </button>
      </div>

      ${
        application.message
          ? `
            <div class="mt-5 rounded-3xl bg-slate-50 border border-slate-200 p-5">
              <div class="text-sm font-bold text-slate-500">Сообщение</div>
              <div class="mt-2 whitespace-pre-wrap leading-7 text-slate-800">
                ${safe(application.message)}
              </div>
            </div>
          `
          : `
            <div class="mt-5 rounded-3xl bg-slate-50 border border-slate-200 p-5">
              <div class="text-sm text-slate-500">Сообщения нет.</div>
            </div>
          `
      }

      <div class="mt-5">
        ${employerApplicationResumeBlock(application)}
      </div>

      <div class="mt-5">
        ${employerApplicationMainAction(application)}
      </div>
    </article>
  `;
}

function getEmployerApplicationVacancyOptions(applications) {
  const map = new Map();

  applications.forEach((application) => {
    const vacancy = application.vacancy;
    if (vacancy && vacancy.id) {
      map.set(String(vacancy.id), vacancy.title || `Вакансия #${vacancy.id}`);
    }
  });

  return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
}

function employerApplicationMatchesFilters(application) {
  const search = employerApplicationsFilters.search.toLowerCase();
  const vacancy = application.vacancy || {};
  const student = application.student || {};
  const resume = application.resume || {};

  const text = [
    student.full_name,
    student.group_name,
    vacancy.title,
    vacancy.city,
    directionLabel(vacancy.direction),
    resume.title,
    resume.skills,
    application.message,
    employerApplicationStatusLabel(application.status),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (search && !text.includes(search)) {
    return false;
  }

  if (employerApplicationsFilters.status && application.status !== employerApplicationsFilters.status) {
    return false;
  }

  if (
    employerApplicationsFilters.vacancyId &&
    String(vacancy.id) !== String(employerApplicationsFilters.vacancyId)
  ) {
    return false;
  }

  return true;
}

function getFilteredEmployerApplications() {
  return employerApplicationsCache.filter(employerApplicationMatchesFilters);
}

function renderEmployerApplicationsFilters(applications) {
  const vacancies = getEmployerApplicationVacancyOptions(applications);

  return `
    <div class="app-card">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 class="text-xl font-black text-slate-900">Фильтры откликов</h3>
          <p class="text-slate-600 mt-1">
            Найдите нужный отклик по студенту, вакансии, резюме или статусу.
          </p>
        </div>

        <button id="clearEmployerApplicationsFiltersBtn" class="app-button">
          Очистить
        </button>
      </div>

      <div class="mt-5 grid lg:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">Поиск</label>
          <input
            id="employerApplicationsSearch"
            type="text"
            value="${inputValue(employerApplicationsFilters.search)}"
            placeholder="Студент, группа, вакансия, резюме..."
            class="app-input"
          />
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">Статус</label>
          <select id="employerApplicationsStatusFilter" class="app-select">
            <option value="">Все статусы</option>
            <option value="sent" ${employerApplicationsFilters.status === 'sent' ? 'selected' : ''}>Новые</option>
            <option value="viewed" ${employerApplicationsFilters.status === 'viewed' ? 'selected' : ''}>Просмотренные</option>
            <option value="invited" ${employerApplicationsFilters.status === 'invited' ? 'selected' : ''}>Ожидают ответа</option>
            <option value="accepted" ${employerApplicationsFilters.status === 'accepted' ? 'selected' : ''}>Приняты студентом</option>
            <option value="rejected" ${employerApplicationsFilters.status === 'rejected' ? 'selected' : ''}>Отклонены работодателем</option>
            <option value="student_rejected" ${employerApplicationsFilters.status === 'student_rejected' ? 'selected' : ''}>Отклонены студентом</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">Вакансия</label>
          <select id="employerApplicationsVacancyFilter" class="app-select">
            <option value="">Все вакансии</option>
            ${
              vacancies.map((vacancy) => `
                <option
                  value="${vacancy.id}"
                  ${String(employerApplicationsFilters.vacancyId) === String(vacancy.id) ? 'selected' : ''}
                >
                  ${safe(vacancy.title)}
                </option>
              `).join('')
            }
          </select>
        </div>
      </div>

      <div id="employerApplicationsFilterCount" class="mt-4 text-sm text-slate-500"></div>
    </div>
  `;
}

function renderEmployerApplicationsList() {
  const list = document.getElementById('employerApplicationsList');
  const count = document.getElementById('employerApplicationsFilterCount');

  if (!list) return;

  const filtered = getFilteredEmployerApplications();

  list.innerHTML = filtered.length
    ? `<div class="space-y-4">${filtered.map(employerApplicationCard).join('')}</div>`
    : placeholderBlock('Отклики студентов', 'По выбранным фильтрам отклики не найдены.');

  if (count) {
    count.textContent = `Показано по фильтрам: ${filtered.length} из ${employerApplicationsCache.length}`;
  }

  bindEmployerApplicationCardActions();
}

function bindEmployerApplicationsFilters() {
  const searchInput = document.getElementById('employerApplicationsSearch');
  const statusSelect = document.getElementById('employerApplicationsStatusFilter');
  const vacancySelect = document.getElementById('employerApplicationsVacancyFilter');
  const clearBtn = document.getElementById('clearEmployerApplicationsFiltersBtn');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      employerApplicationsFilters.search = searchInput.value.trim();
      renderEmployerApplicationsList();
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', () => {
      employerApplicationsFilters.status = statusSelect.value;
      renderEmployerApplicationsList();
    });
  }

  if (vacancySelect) {
    vacancySelect.addEventListener('change', () => {
      employerApplicationsFilters.vacancyId = vacancySelect.value;
      renderEmployerApplicationsList();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      employerApplicationsFilters = {
        search: '',
        status: '',
        vacancyId: '',
      };

      if (searchInput) searchInput.value = '';
      if (statusSelect) statusSelect.value = '';
      if (vacancySelect) vacancySelect.value = '';

      renderEmployerApplicationsList();
    });
  }

  renderEmployerApplicationsList();
}

function renderEmployerApplicationsPagination(data) {
  const hasPrev = data.offset > 0;
  const hasNext = data.offset + data.limit < data.total;

  return `
    <div class="flex items-center justify-between gap-4 flex-wrap bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div class="text-sm text-slate-600">
        Показано ${data.items.length} из ${data.total}
      </div>

      <div class="flex gap-3">
        <button
          id="employerAppsPrevBtn"
          ${!hasPrev ? 'disabled' : ''}
          class="app-button disabled:opacity-50"
        >
          Назад
        </button>

        <button
          id="employerAppsNextBtn"
          ${!hasNext ? 'disabled' : ''}
          class="app-button disabled:opacity-50"
        >
          Еще
        </button>
      </div>
    </div>
  `;
}

async function renderEmployerApplicationsTab() {
  try {
    const response = await getEmployerApplications(employerApplicationsLimit, employerApplicationsOffset);

    if (!response.ok) {
      return placeholderBlock('Отклики студентов', 'Не удалось загрузить отклики.');
    }

    const data = await response.json();
    const applications = data.items || [];
    employerApplicationsCache = applications;

    const newCount = applications.filter((application) => application.status === 'sent').length;
    const waitingCount = applications.filter((application) => application.status === 'invited').length;
    const acceptedCount = applications.filter((application) => application.status === 'accepted').length;

    return `
      <div class="space-y-6">
        <div class="app-card">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 class="text-xl font-black text-slate-900">Отклики студентов</h3>
              <p class="text-slate-600 mt-1">
                Чат открывается только после приглашения работодателя и согласия студента.
              </p>
            </div>

            <div class="flex gap-3 flex-wrap">
              <div class="app-mini-stat">
                <div class="app-mini-stat-label">Новые</div>
                <div class="app-mini-stat-value">${newCount}</div>
              </div>

              <div class="app-mini-stat">
                <div class="app-mini-stat-label">Ожидают</div>
                <div class="app-mini-stat-value">${waitingCount}</div>
              </div>

              <div class="app-mini-stat">
                <div class="app-mini-stat-label">Приняты</div>
                <div class="app-mini-stat-value">${acceptedCount}</div>
              </div>
            </div>
          </div>
        </div>

        ${renderEmployerApplicationsFilters(applications)}

        <div id="employerApplicationsList"></div>

        ${renderEmployerApplicationsPagination(data)}
      </div>
    `;
  } catch {
    return placeholderBlock('Отклики студентов', 'Сервер недоступен.');
  }
}

function getEmployerApplicationConfirmConfig(newStatus) {
  if (newStatus === 'rejected') {
    return {
      title: 'Отклонить?',
      message: 'Чат по этой вакансии будет недоступен. Студент увидит изменение статуса.',
      confirmText: 'Отклонить',
      danger: true,
    };
  }

  if (newStatus === 'invited') {
    return {
      title: 'Пригласить студента?',
      message: 'Студент получит приглашение и сможет принять или отклонить его. Чат откроется только после его согласия.',
      confirmText: 'Пригласить',
      danger: false,
    };
  }

  return null;
}

async function openEmployerChatFromApplication(applicationId) {
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

  await renderEmployerDashboard(currentUser, 'chats');

  setTimeout(async () => {
    if (typeof openChatInline === 'function') {
      await openChatInline(data.id, 'employer');
    }
  }, 0);
}

function bindEmployerApplicationCardActions() {
  document.querySelectorAll('[data-employer-app-status]').forEach((button) => {
    button.addEventListener('click', async () => {
      const applicationId = button.dataset.employerAppStatus;
      const newStatus = button.dataset.status;

      const confirmConfig = getEmployerApplicationConfirmConfig(newStatus);

      if (confirmConfig) {
        const confirmed = await showConfirmModal(confirmConfig);
        if (!confirmed) return;
      }

      try {
        const response = await updateApplicationStatus(applicationId, newStatus);
        const data = await response.json();

        if (!response.ok) {
          showToast(
            getApiErrorMessage(data, 'Не удалось обновить статус отклика'),
            'error'
          );
          return;
        }

        showToast('Статус отклика обновлён');
        await renderEmployerDashboard(currentUser, 'applications');
      } catch {
        showToast('Сервер недоступен или возникла ошибка сети', 'error');
      }
    });
  });

  document.querySelectorAll('[data-create-chat-from-application]').forEach((button) => {
    button.addEventListener('click', async () => {
      const applicationId = button.dataset.createChatFromApplication;

      try {
        await openEmployerChatFromApplication(applicationId);
      } catch {
        showToast('Сервер недоступен или возникла ошибка сети', 'error');
      }
    });
  });

  document.querySelectorAll('[data-application-resume-view]').forEach((button) => {
    button.addEventListener('click', async () => {
      const resumeId = button.dataset.applicationResumeView;

      try {
        const response = await getPublicResumeById(resumeId);

        if (!response.ok) {
          showToast('Не удалось открыть резюме', 'error');
          return;
        }

        const resume = await response.json();

        dashboardContent.innerHTML = publicResumeDetail(resume);

        const backBtn = document.getElementById('backToPublicResumesBtn');
        if (backBtn) {
          backBtn.addEventListener('click', async () => {
            await renderEmployerDashboard(currentUser, 'applications');
          });
        }

        bindEmployerPublicResumeCardActions();
      } catch {
        showToast('Сервер недоступен или возникла ошибка сети', 'error');
      }
    });
  });

  document.querySelectorAll('[data-application-vacancy-view]').forEach((button) => {
    button.addEventListener('click', async () => {
      const applicationId = Number(button.dataset.applicationVacancyView);
      const application = employerApplicationsCache.find((item) => Number(item.id) === applicationId);

      if (!application || !application.vacancy) {
        showToast('Вакансия не найдена', 'error');
        return;
      }

      dashboardContent.innerHTML = employerApplicationVacancyMiniDetail(application.vacancy);

      const backBtn = document.getElementById('backToEmployerApplicationsBtn');
      if (backBtn) {
        backBtn.addEventListener('click', async () => {
          await renderEmployerDashboard(currentUser, 'applications');
        });
      }
    });
  });
}

function bindEmployerApplicationActions() {
  const prevBtn = document.getElementById('employerAppsPrevBtn');
  if (prevBtn) {
    prevBtn.addEventListener('click', async () => {
      employerApplicationsOffset = Math.max(0, employerApplicationsOffset - employerApplicationsLimit);
      await renderEmployerDashboard(currentUser, 'applications');
    });
  }

  const nextBtn = document.getElementById('employerAppsNextBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', async () => {
      employerApplicationsOffset += employerApplicationsLimit;
      await renderEmployerDashboard(currentUser, 'applications');
    });
  }

  bindEmployerApplicationsFilters();
}