let studentVacanciesCache = [];
let studentVacancyFiltersOpen = false;

function studentVacancyDateLabel(value) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

function studentVacancyMetaLine(vacancy) {
  const items = [
    vacancy.city,
    catalogWorkFormatLabel(vacancy.work_format),
    catalogEmploymentTypeLabel(vacancy.employment_type),
    directionLabel(vacancy.direction),
  ].filter(Boolean);

  return items.map((item) => safe(item)).join(' · ');
}

function companyMini(company) {
  if (!company) {
    return `
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-slate-100"></div>
        <div>
          <div class="font-black text-slate-900">Компания не указана</div>
          <div class="text-sm text-slate-500">Статус неизвестен</div>
        </div>
      </div>
    `;
  }

  const firstLetter = company.company_name ? company.company_name[0] : 'К';

  return `
    <div class="flex items-center gap-4">
      ${
        company.avatar_url
          ? `<img src="${company.avatar_url}" class="w-14 h-14 rounded-2xl object-cover border border-slate-200" />`
          : `<div class="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-xl font-black text-blue-700">${safe(firstLetter)}</div>`
      }

      <div>
        <div class="font-black text-slate-900">${safe(company.company_name)}</div>
        <div class="text-sm text-slate-500">${statusLabel(company.status)}</div>
      </div>
    </div>
  `;
}

function renderStudentVacancySkillTags(skills, limit = null) {
  const list = String(skills || '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);

  const visibleList = limit ? list.slice(0, limit) : list;
  const hiddenCount = limit && list.length > limit ? list.length - limit : 0;

  if (!visibleList.length) {
    return '<span class="text-sm text-slate-500">Навыки не указаны</span>';
  }

  return `
    ${visibleList.map((skill) => `<span class="app-tag app-tag-blue">${safe(skill)}</span>`).join('')}
    ${hiddenCount > 0 ? `<span class="app-tag">+${hiddenCount}</span>` : ''}
  `;
}

function studentVacancyMatchesFilters(vacancy, filters) {
  const search = filters.search.toLowerCase();

  const vacancyText = [
    vacancy.title,
    vacancy.description,
    vacancy.requirements,
    vacancy.company?.company_name,
    vacancy.city,
    directionLabel(vacancy.direction),
    vacancy.skills,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (search && !vacancyText.includes(search)) {
    return false;
  }

  if (filters.city && vacancy.city !== filters.city) {
    return false;
  }

  if (filters.direction && vacancy.direction !== filters.direction) {
    return false;
  }

  if (filters.skills.length) {
    const vacancySkills = skillsToArray(vacancy.skills);
    const hasAllSkills = filters.skills.every((skill) => vacancySkills.includes(skill));

    if (!hasAllSkills) {
      return false;
    }
  }

  return true;
}

function getStudentVacancyFilters() {
  return {
    search: document.getElementById('studentVacancySearch')?.value.trim() || '',
    city: document.getElementById('studentVacancyCityFilter')?.value.trim() || '',
    direction: document.getElementById('studentVacancyDirectionFilter')?.value || '',
    skills: skillsToArray(getSkillsPickerValue('studentVacancyFilter')),
  };
}

function renderStudentVacancyActiveFilters(filters) {
  const tags = [];

  if (filters.search) {
    tags.push(`Поиск: ${filters.search}`);
  }

  if (filters.city) {
    tags.push(`Город: ${filters.city}`);
  }

  if (filters.direction) {
    tags.push(`Направление: ${directionLabel(filters.direction)}`);
  }

  filters.skills.forEach((skill) => {
    tags.push(skill);
  });

  if (!tags.length) {
    return '<span class="text-sm text-slate-500">Фильтры не выбраны</span>';
  }

  return `
    <div class="flex flex-wrap gap-2">
      ${tags.map((tag) => `<span class="app-tag app-tag-blue">${safe(tag)}</span>`).join('')}
    </div>
  `;
}

function renderStudentVacancyFilters() {
  return `
    <div class="app-card">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 class="text-xl font-black text-slate-900">Вакансии</h3>
          <p class="text-slate-600 mt-1">
            Найдите подходящую вакансию по названию, компании, городу или навыкам.
          </p>
        </div>

        <div class="flex gap-2 flex-wrap">
          <button id="toggleStudentVacancyFiltersBtn" class="app-button">
            ${studentVacancyFiltersOpen ? 'Скрыть фильтры' : 'Фильтры'}
          </button>

          <button id="clearStudentVacancyFiltersBtn" class="app-button">
            Очистить
          </button>
        </div>
      </div>

      <div class="mt-5">
        <label class="block text-sm font-bold text-slate-700 mb-1">Быстрый поиск</label>
        <input
          id="studentVacancySearch"
          type="text"
          placeholder="Python, дизайнер, компания, стажировка..."
          class="app-input"
        />
      </div>

      <div id="studentVacancyActiveFilters" class="mt-4">
        ${renderStudentVacancyActiveFilters({
          search: '',
          city: '',
          direction: '',
          skills: [],
        })}
      </div>

      <div id="studentVacancyFiltersPanel" class="${studentVacancyFiltersOpen ? '' : 'hidden'} mt-5 border-t border-slate-200 pt-5">
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Город</label>
            <input
              id="studentVacancyCityFilter"
              type="text"
              list="studentVacancyCityFilterList"
              placeholder="Все города"
              class="app-input"
            />

            <datalist id="studentVacancyCityFilterList">
              ${CATALOG_CITIES.map((city) => `<option value="${inputValue(city)}"></option>`).join('')}
            </datalist>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Направление</label>
            <select id="studentVacancyDirectionFilter" class="app-select">
              <option value="">Все направления</option>
              ${CATALOG_DIRECTIONS.map((direction) => `
                <option value="${direction.value}">${direction.label}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="mt-4">
          ${renderSkillsPicker('studentVacancyFilter')}
        </div>
      </div>
    </div>
  `;
}

function renderStudentVacancyList(vacancies) {
  if (!vacancies.length) {
    return `
      <div class="app-card">
        <h3 class="text-xl font-black text-slate-900">Вакансии не найдены</h3>
        <p class="text-slate-600 mt-2">
          Попробуйте изменить фильтры или очистить поиск.
        </p>
      </div>
    `;
  }

  return `
    <div class="space-y-4">
      ${vacancies.map((vacancy) => studentVacancyCard(vacancy)).join('')}
    </div>
  `;
}

function updateStudentVacancyListByFilters() {
  const listBlock = document.getElementById('studentVacanciesList');
  const countBlock = document.getElementById('studentVacanciesCount');
  const activeFiltersBlock = document.getElementById('studentVacancyActiveFilters');

  if (!listBlock) return;

  const filters = getStudentVacancyFilters();
  const filteredVacancies = studentVacanciesCache.filter((vacancy) => studentVacancyMatchesFilters(vacancy, filters));

  listBlock.innerHTML = renderStudentVacancyList(filteredVacancies);

  if (countBlock) {
    countBlock.textContent = `Найдено: ${filteredVacancies.length}`;
  }

  if (activeFiltersBlock) {
    activeFiltersBlock.innerHTML = renderStudentVacancyActiveFilters(filters);
  }

  bindStudentVacancyCardActions();
}

function bindStudentVacancyFilters() {
  bindSkillsPicker('studentVacancyFilter');

  const searchInput = document.getElementById('studentVacancySearch');
  const cityInput = document.getElementById('studentVacancyCityFilter');
  const directionInput = document.getElementById('studentVacancyDirectionFilter');
  const clearBtn = document.getElementById('clearStudentVacancyFiltersBtn');
  const toggleBtn = document.getElementById('toggleStudentVacancyFiltersBtn');
  const panel = document.getElementById('studentVacancyFiltersPanel');
  const skillSearchInput = document.getElementById('studentVacancyFilterSkillSearch');
  const skillsList = document.getElementById('studentVacancyFilterSkillsList');

  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => {
      studentVacancyFiltersOpen = !studentVacancyFiltersOpen;
      panel.classList.toggle('hidden', !studentVacancyFiltersOpen);
      toggleBtn.textContent = studentVacancyFiltersOpen ? 'Скрыть фильтры' : 'Фильтры';
    });
  }

  [searchInput, cityInput, directionInput].forEach((input) => {
    if (!input) return;

    input.addEventListener('input', updateStudentVacancyListByFilters);
    input.addEventListener('change', updateStudentVacancyListByFilters);
  });

  if (skillSearchInput) {
    skillSearchInput.addEventListener('input', () => {
      setTimeout(updateStudentVacancyListByFilters, 0);
    });
  }

  if (skillsList) {
    skillsList.addEventListener('change', () => {
      setTimeout(updateStudentVacancyListByFilters, 0);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (cityInput) cityInput.value = '';
      if (directionInput) directionInput.value = '';

      const hiddenSkillsInput = document.getElementById('studentVacancyFilterSkillsValue');
      if (hiddenSkillsInput) hiddenSkillsInput.value = '';

      bindSkillsPicker('studentVacancyFilter');
      updateStudentVacancyListByFilters();
    });
  }

  updateStudentVacancyListByFilters();
}

function studentVacancyCard(vacancy) {
  return `
    <article class="app-card hover:shadow-lg transition">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div class="min-w-0 flex-1">
          ${companyMini(vacancy.company)}

          <div class="mt-5 flex items-center gap-2 flex-wrap">
            <span class="app-tag">${studentVacancyDateLabel(vacancy.created_at)}</span>
            <span class="app-tag">${directionLabel(vacancy.direction)}</span>
          </div>

          <h3 class="mt-3 text-2xl font-black text-slate-900 tracking-tight break-words">
            ${safe(vacancy.title)}
          </h3>

          <p class="mt-2 text-sm font-semibold text-slate-500">
            ${studentVacancyMetaLine(vacancy)}
          </p>
        </div>

        <div class="text-left md:text-right">
          <div class="text-xs text-slate-500 font-bold">Зарплата</div>
          <div class="mt-1 text-lg font-black text-slate-900 whitespace-nowrap">
            ${formatSalary(vacancy)}
          </div>
        </div>
      </div>

      <p class="mt-5 text-slate-700 leading-7">
        ${shortText(vacancy.description || vacancy.requirements, 260)}
      </p>

      <div class="mt-5 flex flex-wrap gap-2">
        ${renderStudentVacancySkillTags(vacancy.skills, 10)}
      </div>

      <div class="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
        <div class="text-sm text-slate-500">
          Опубликовано: ${studentVacancyDateLabel(vacancy.created_at)}
        </div>

        <button data-student-vacancy-view="${vacancy.id}" class="app-button app-button-primary">
          Открыть вакансию
        </button>
      </div>
    </article>
  `;
}

function studentVacancyDetailView(vacancy) {
  return `
    <div class="space-y-5">
      <button id="backToStudentVacanciesBtn" class="app-button">
        ← Назад к вакансиям
      </button>

      <article class="app-card">
        <div class="flex items-start justify-between gap-5 flex-wrap">
          <div class="min-w-0 flex-1">
            ${companyMini(vacancy.company)}

            <div class="mt-5 flex gap-2 flex-wrap">
              <span class="app-tag">Опубликовано ${studentVacancyDateLabel(vacancy.created_at)}</span>
              <span class="app-tag">${directionLabel(vacancy.direction)}</span>
            </div>

            <h3 class="mt-4 text-3xl md:text-4xl font-black text-slate-900 tracking-tight break-words">
              ${safe(vacancy.title)}
            </h3>

            <p class="mt-3 text-slate-600 font-semibold">
              ${studentVacancyMetaLine(vacancy)}
            </p>
          </div>

          <div class="flex flex-col gap-3 min-w-[220px]">
            <div class="rounded-3xl bg-slate-50 border border-slate-200 px-5 py-4">
              <div class="text-xs text-slate-500 font-bold">Зарплата</div>
              <div class="mt-1 text-2xl font-black text-slate-900">
                ${formatSalary(vacancy)}
              </div>
            </div>

            <button data-apply-vacancy="${vacancy.id}" class="app-button app-button-purple w-full">
              Откликнуться
            </button>
          </div>
        </div>

        <div class="mt-7 grid lg:grid-cols-[1fr_280px] gap-6">
          <div class="space-y-5">
            <section>
              <h4 class="text-lg font-black text-slate-900">Описание</h4>
              <div class="mt-3 rounded-3xl bg-slate-50 border border-slate-200 p-5">
                <div class="whitespace-pre-wrap leading-8 text-slate-700">${safe(vacancy.description)}</div>
              </div>
            </section>

            <section>
              <h4 class="text-lg font-black text-slate-900">Требования</h4>
              <div class="mt-3 rounded-3xl bg-slate-50 border border-slate-200 p-5">
                <div class="whitespace-pre-wrap leading-8 text-slate-700">${safe(vacancy.requirements)}</div>
              </div>
            </section>

            <section>
              <h4 class="text-lg font-black text-slate-900">Компания</h4>
              <div class="mt-3 rounded-3xl bg-blue-50 border border-blue-100 p-5">
                <p class="text-blue-800 text-sm leading-6">
                  Можно открыть публичную страницу работодателя и посмотреть информацию о компании.
                </p>

                ${
                  vacancy.company
                    ? `
                      <button
                        id="openCompanyProfileBtn"
                        data-company-profile="${vacancy.company.id}"
                        class="app-button app-button-blue mt-4"
                      >
                        Открыть профиль компании
                      </button>
                    `
                    : ''
                }
              </div>
            </section>
          </div>

          <aside class="space-y-4">
            <div class="rounded-3xl bg-slate-50 border border-slate-200 p-5">
              <h4 class="font-black text-slate-900">Кратко</h4>

              <div class="mt-4 space-y-3 text-sm">
                <div>
                  <div class="text-slate-500">Город</div>
                  <div class="font-bold text-slate-900">${safe(vacancy.city)}</div>
                </div>

                <div>
                  <div class="text-slate-500">Формат</div>
                  <div class="font-bold text-slate-900">${catalogWorkFormatLabel(vacancy.work_format)}</div>
                </div>

                <div>
                  <div class="text-slate-500">Занятость</div>
                  <div class="font-bold text-slate-900">${catalogEmploymentTypeLabel(vacancy.employment_type)}</div>
                </div>

                <div>
                  <div class="text-slate-500">Направление</div>
                  <div class="font-bold text-slate-900">${directionLabel(vacancy.direction)}</div>
                </div>

                <div>
                  <div class="text-slate-500">Дата публикации</div>
                  <div class="font-bold text-slate-900">${studentVacancyDateLabel(vacancy.created_at)}</div>
                </div>
              </div>
            </div>

            <div class="rounded-3xl bg-slate-50 border border-slate-200 p-5">
              <h4 class="font-black text-slate-900">Навыки</h4>

              <div class="mt-3 flex flex-wrap gap-2">
                ${renderStudentVacancySkillTags(vacancy.skills)}
              </div>
            </div>
          </aside>
        </div>
      </article>
    </div>
  `;
}

async function renderStudentVacanciesTab() {
  try {
    const response = await getPublicVacancies();

    if (!response.ok) {
      return placeholderBlock('Вакансии', 'Не удалось загрузить вакансии.');
    }

    const vacancies = await response.json();
    studentVacanciesCache = vacancies || [];

    if (!studentVacanciesCache.length) {
      return placeholderBlock('Вакансии', 'Пока нет опубликованных вакансий.');
    }

    return `
      <div class="space-y-6">
        ${renderStudentVacancyFilters()}

        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div id="studentVacanciesCount" class="text-sm text-slate-600">
            Найдено: ${studentVacanciesCache.length}
          </div>
        </div>

        <div id="studentVacanciesList">
          ${renderStudentVacancyList(studentVacanciesCache)}
        </div>
      </div>
    `;
  } catch {
    return placeholderBlock('Вакансии', 'Сервер недоступен.');
  }
}

function bindStudentVacancyCardActions() {
  document.querySelectorAll('[data-student-vacancy-view]').forEach((button) => {
    button.addEventListener('click', async () => {
      const vacancyId = button.dataset.studentVacancyView;

      const response = await getPublicVacancyById(vacancyId);

      if (!response.ok) {
        showToast('Не удалось открыть вакансию', 'error');
        return;
      }

      const vacancy = await response.json();
      dashboardContent.innerHTML = studentVacancyDetailView(vacancy);

      document.getElementById('backToStudentVacanciesBtn').addEventListener('click', async () => {
        await renderStudentDashboard(currentUser, 'vacancies');
      });

      const openCompanyProfileBtn = document.getElementById('openCompanyProfileBtn');

      if (openCompanyProfileBtn) {
        openCompanyProfileBtn.addEventListener('click', async () => {
          const companyId = openCompanyProfileBtn.dataset.companyProfile;
          await renderCompanyPublicProfile(companyId);
        });
      }

      const applyBtn = document.querySelector('[data-apply-vacancy]');
      if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
          await openApplicationModal(applyBtn.dataset.applyVacancy);
        });
      }
    });
  });
}

function bindStudentVacancyActions() {
  bindStudentVacancyFilters();
  bindStudentVacancyCardActions();
}

async function openApplicationModal(vacancyId) {
  const resumesResponse = await getMyResumes(50, 0);

  if (!resumesResponse.ok) {
    showToast('Не удалось загрузить ваши резюме', 'error');
    return;
  }

  const resumesData = await resumesResponse.json();
  const resumes = (resumesData.items || []).filter((resume) => {
    return resume.status === 'published' && resume.is_public;
  });

  if (!resumes.length) {
    showToast('Сначала создайте публичное опубликованное резюме', 'error');
    await renderStudentDashboard(currentUser, 'resume');
    return;
  }

  const oldModal = document.getElementById('applicationModal');
  if (oldModal) oldModal.remove();

  const modal = document.createElement('div');
  modal.id = 'applicationModal';
  modal.className = 'fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm px-4 py-6 overflow-y-auto';

  modal.innerHTML = `
    <div class="min-h-full flex items-center justify-center">
      <div class="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl border border-slate-200 my-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="inline-flex items-center rounded-full bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 text-xs font-bold">
              Отклик
            </div>

            <h3 class="mt-4 text-2xl font-black text-slate-900">
              Откликнуться на вакансию
            </h3>

            <p class="mt-2 text-slate-600">
              Выберите резюме и добавьте короткое сообщение работодателю.
            </p>
          </div>

          <button id="cancelApplicationBtn" type="button"
            class="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center text-2xl leading-none transition">
            ×
          </button>
        </div>

        <form id="applicationForm" class="mt-6 space-y-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Резюме</label>
            <select id="applicationResumeId" required class="app-select">
              ${
                resumes.map((resume) => `
                  <option value="${resume.id}">
                    ${safe(resume.title)} — ${safe(resume.city)} / ${directionLabel(resume.direction)}
                  </option>
                `).join('')
              }
            </select>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Сообщение</label>
            <textarea
              id="applicationMessage"
              rows="4"
              maxlength="2000"
              placeholder="Здравствуйте! Хочу откликнуться на вакансию..."
              class="app-textarea"
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 flex-wrap">
            <button type="button" id="cancelApplicationBtn2" class="app-button">
              Отмена
            </button>

            <button type="submit" class="app-button app-button-purple">
              Отправить отклик
            </button>
          </div>
        </form>

        <div id="applicationResult" class="mt-4 text-sm whitespace-pre-wrap"></div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  function closeModal() {
    modal.remove();
  }

  document.getElementById('cancelApplicationBtn').addEventListener('click', closeModal);
  document.getElementById('cancelApplicationBtn2').addEventListener('click', closeModal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.getElementById('applicationForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const result = document.getElementById('applicationResult');
    result.className = 'mt-4 text-sm text-slate-600 whitespace-pre-wrap';
    result.textContent = 'Отправляем отклик...';

    const payload = {
      vacancy_id: Number(vacancyId),
      resume_id: Number(document.getElementById('applicationResumeId').value),
      message: document.getElementById('applicationMessage').value.trim() || null,
    };

    try {
      const response = await createApplication(payload);
      const data = await response.json();

      if (!response.ok) {
        showMessage(
          result,
          getApiErrorMessage(data, 'Ошибка отправки отклика.'),
          true
        );
        return;
      }

      closeModal();
      showToast('Отклик отправлен');
      await renderStudentDashboard(currentUser, 'applications');
    } catch {
      showMessage(result, 'Сервер недоступен или возникла ошибка сети.', true);
    }
  });
}