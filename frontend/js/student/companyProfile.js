function companyProfileDateLabel(value) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

function companyPublicAvatar(company) {
  if (company && company.avatar_url) {
    return `
      <img
        src="${company.avatar_url}"
        class="w-28 h-28 rounded-[2rem] object-cover border border-slate-200 shadow-sm"
        alt="Логотип компании"
      />
    `;
  }

  const letter = company && company.company_name ? company.company_name[0] : 'К';

  return `
    <div class="w-28 h-28 rounded-[2rem] bg-blue-100 flex items-center justify-center text-4xl font-black text-blue-700 shadow-sm">
      ${safe(letter)}
    </div>
  `;
}

function companyVacancySkillTags(skills, limit = 8) {
  const list = skillsToArray(skills);
  const visibleList = list.slice(0, limit);
  const hiddenCount = list.length - visibleList.length;

  if (!visibleList.length) {
    return '<span class="text-sm text-slate-500">Навыки не указаны</span>';
  }

  return `
    ${visibleList.map((skill) => `<span class="app-tag app-tag-blue">${safe(skill)}</span>`).join('')}
    ${hiddenCount > 0 ? `<span class="app-tag">+${hiddenCount}</span>` : ''}
  `;
}

function companyVacancyMetaLine(vacancy) {
  const items = [
    vacancy.city,
    catalogWorkFormatLabel(vacancy.work_format),
    catalogEmploymentTypeLabel(vacancy.employment_type),
    directionLabel(vacancy.direction),
  ].filter(Boolean);

  return items.map((item) => safe(item)).join(' · ');
}

function companyVacancyMiniCard(vacancy) {
  return `
    <article class="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 hover:shadow-md transition">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div class="min-w-0 flex-1">
          <div class="flex gap-2 flex-wrap">
            <span class="app-tag">${companyProfileDateLabel(vacancy.created_at)}</span>
            <span class="app-tag app-tag-blue">${directionLabel(vacancy.direction)}</span>
          </div>

          <h4 class="mt-3 text-xl font-black text-slate-900 tracking-tight break-words">
            ${safe(vacancy.title)}
          </h4>

          <p class="mt-2 text-sm font-semibold text-slate-500">
            ${companyVacancyMetaLine(vacancy)}
          </p>
        </div>

        <div class="text-left md:text-right">
          <div class="text-xs text-slate-500 font-bold">Зарплата</div>
          <div class="mt-1 text-lg font-black text-slate-900 whitespace-nowrap">
            ${formatSalary(vacancy)}
          </div>
        </div>
      </div>

      <p class="mt-4 text-slate-700 leading-7">
        ${shortText(vacancy.description || vacancy.requirements, 220)}
      </p>

      <div class="mt-4 flex flex-wrap gap-2">
        ${companyVacancySkillTags(vacancy.skills)}
      </div>

      <div class="mt-5 pt-5 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
        <div class="text-sm text-slate-500">
          Опубликовано: ${companyProfileDateLabel(vacancy.created_at)}
        </div>

        <button
          data-company-vacancy-view="${vacancy.id}"
          class="app-button app-button-primary"
        >
          Открыть вакансию
        </button>
      </div>
    </article>
  `;
}

function companyProfileInfoBlock(company) {
  return `
    <section class="app-card">
      <div class="flex items-start gap-6 flex-wrap">
        ${companyPublicAvatar(company)}

        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div class="flex gap-2 flex-wrap mb-3">
                ${statusBadge(company.status)}
                <span class="app-tag">Публичный профиль</span>
              </div>

              <h2 class="text-3xl md:text-4xl font-black tracking-tight text-slate-900 break-words">
                ${safe(company.company_name)}
              </h2>

              <p class="mt-2 text-slate-600">
                Работодатель на Career Hub IT TOP
              </p>
            </div>
          </div>

          <div class="mt-6 grid md:grid-cols-3 gap-3">
            ${card('ИНН', company.inn)}
            ${card('Телефон', company.phone)}
            ${card('Статус', statusLabel(company.status))}
          </div>
        </div>
      </div>

      <div class="mt-6 rounded-3xl bg-slate-50 border border-slate-200 p-5">
        <div class="text-sm font-bold text-slate-500">Описание компании</div>
        <div class="mt-2 whitespace-pre-wrap leading-8 text-slate-800">
          ${safe(company.description)}
        </div>
      </div>
    </section>
  `;
}

async function loadCompanyVacancies(companyId, company) {
  if (Array.isArray(company.vacancies)) {
    return company.vacancies;
  }

  try {
    const response = await getPublicVacancies();

    if (!response.ok) {
      return [];
    }

    const vacancies = await response.json();

    return (vacancies || []).filter((vacancy) => {
      return String(vacancy.company?.id) === String(companyId);
    });
  } catch {
    return [];
  }
}

async function openCompanyVacancyFromProfile(vacancyId, companyId) {
  const response = await getPublicVacancyById(vacancyId);

  if (!response.ok) {
    showToast('Не удалось открыть вакансию', 'error');
    return;
  }

  const vacancy = await response.json();

  dashboardContent.innerHTML = studentVacancyDetailView(vacancy);

  const backBtn = document.getElementById('backToStudentVacanciesBtn');
  if (backBtn) {
    backBtn.addEventListener('click', async () => {
      await renderCompanyPublicProfile(companyId);
    });
  }

  const openCompanyProfileBtn = document.getElementById('openCompanyProfileBtn');
  if (openCompanyProfileBtn) {
    openCompanyProfileBtn.addEventListener('click', async () => {
      await renderCompanyPublicProfile(companyId);
    });
  }

  const applyBtn = document.querySelector('[data-apply-vacancy]');
  if (applyBtn) {
    applyBtn.addEventListener('click', async () => {
      await openApplicationModal(applyBtn.dataset.applyVacancy);
    });
  }
}

function bindCompanyProfileActions(companyId) {
  const backBtn = document.getElementById('backToStudentVacancyBtn');

  if (backBtn) {
    backBtn.addEventListener('click', async () => {
      await renderStudentDashboard(currentUser, 'vacancies');
    });
  }

  document.querySelectorAll('[data-company-vacancy-view]').forEach((button) => {
    button.addEventListener('click', async () => {
      await openCompanyVacancyFromProfile(button.dataset.companyVacancyView, companyId);
    });
  });
}

async function renderCompanyPublicProfile(companyId) {
  const response = await getCompanyById(companyId);

  if (!response.ok) {
    showToast('Не удалось открыть профиль компании', 'error');
    return;
  }

  const company = await response.json();
  const vacancies = await loadCompanyVacancies(companyId, company);

  dashboardContent.innerHTML = `
    <div class="space-y-6">
      <button
        id="backToStudentVacancyBtn"
        class="app-button"
      >
        ← Назад к вакансиям
      </button>

      ${companyProfileInfoBlock(company)}

      <section class="app-card">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 class="text-2xl font-black text-slate-900 tracking-tight">
              Активные вакансии компании
            </h3>

            <p class="text-slate-600 mt-1">
              Можно открыть вакансию и откликнуться на неё.
            </p>
          </div>

          <div class="app-mini-stat">
            <div class="app-mini-stat-label">Вакансий</div>
            <div class="app-mini-stat-value">${vacancies.length}</div>
          </div>
        </div>

        <div class="mt-6">
          ${
            vacancies.length
              ? `<div class="space-y-4">${vacancies.map(companyVacancyMiniCard).join('')}</div>`
              : `
                <div class="rounded-3xl bg-slate-50 border border-slate-200 p-6">
                  <h4 class="font-black text-slate-900">Активных вакансий пока нет</h4>
                  <p class="text-slate-600 mt-2">
                    У этой компании сейчас нет опубликованных вакансий.
                  </p>
                </div>
              `
          }
        </div>
      </section>
    </div>
  `;

  bindCompanyProfileActions(companyId);
}