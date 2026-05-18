let publicResumeLimit = 50;
let publicResumeOffset = 0;
let publicResumesCache = [];
let employerResumeFiltersOpen = false;

function employerResumeDateLabel(value) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

function publicResumeTextBlock(title, value) {
  return `
    <section>
      <h4 class="text-lg font-black text-slate-900">${safe(title)}</h4>
      <div class="mt-3 rounded-3xl bg-slate-50 border border-slate-200 p-5">
        <div class="whitespace-pre-wrap leading-8 text-slate-700">${safe(value)}</div>
      </div>
    </section>
  `;
}

function publicResumeStudentAvatar(student) {
  if (student && student.photo_url) {
    return `
      <img
        src="${student.photo_url}"
        class="w-16 h-16 rounded-2xl object-cover border border-slate-200"
        alt="Фото студента"
      />
    `;
  }

  const letter = student && student.full_name ? student.full_name[0] : 'С';

  return `
    <div class="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-xl font-bold text-purple-700">
      ${safe(letter)}
    </div>
  `;
}

function publicResumeLargeStudentAvatar(student) {
  if (student && student.photo_url) {
    return `
      <img
        src="${student.photo_url}"
        class="w-24 h-24 rounded-3xl object-cover border border-slate-200"
        alt="Фото студента"
      />
    `;
  }

  const letter = student && student.full_name ? student.full_name[0] : 'С';

  return `
    <div class="w-24 h-24 rounded-3xl bg-purple-100 flex items-center justify-center text-3xl font-black text-purple-700">
      ${safe(letter)}
    </div>
  `;
}

function publicResumeSkillTags(skills, limit = null) {
  const list = skillsToArray(skills);
  const visibleList = limit ? list.slice(0, limit) : list;
  const hiddenCount = limit && list.length > limit ? list.length - limit : 0;

  if (!visibleList.length) {
    return '<span class="text-sm text-slate-500">Навыки не указаны</span>';
  }

  return `
    ${visibleList.map((skill) => `<span class="app-tag app-tag-purple">${safe(skill)}</span>`).join('')}
    ${hiddenCount > 0 ? `<span class="app-tag">+${hiddenCount}</span>` : ''}
  `;
}

function publicResumeMatchesFilters(resume, filters) {
  const student = resume.student || {};

  const search = filters.search.toLowerCase();
  const resumeText = [
    resume.title,
    resume.about,
    resume.skills,
    resume.experience,
    resume.education,
    resume.contacts,
    resume.city,
    directionLabel(resume.direction),
    student.full_name,
    student.group_name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (search && !resumeText.includes(search)) {
    return false;
  }

  if (filters.city && resume.city !== filters.city) {
    return false;
  }

  if (filters.direction && resume.direction !== filters.direction) {
    return false;
  }

  if (filters.skills.length) {
    const resumeSkills = skillsToArray(resume.skills);
    const hasAllSkills = filters.skills.every((skill) => resumeSkills.includes(skill));

    if (!hasAllSkills) {
      return false;
    }
  }

  return true;
}

function getEmployerResumeFilters() {
  return {
    search: document.getElementById('employerResumeSearch')?.value.trim() || '',
    city: document.getElementById('employerResumeCityFilter')?.value.trim() || '',
    direction: document.getElementById('employerResumeDirectionFilter')?.value || '',
    skills: skillsToArray(getSkillsPickerValue('employerResumeFilter')),
  };
}

function renderEmployerResumeActiveFilters(filters) {
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
      ${tags.map((tag) => `<span class="app-tag app-tag-purple">${safe(tag)}</span>`).join('')}
    </div>
  `;
}

function renderEmployerResumeFilters() {
  return `
    <div class="app-card">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 class="text-xl font-black text-slate-900">Резюме студентов</h3>
          <p class="text-slate-600 mt-1">
            Быстро найдите подходящих студентов по имени, навыкам, городу или направлению.
          </p>
        </div>

        <div class="flex gap-2 flex-wrap">
          <button id="toggleEmployerResumeFiltersBtn" class="app-button">
            ${employerResumeFiltersOpen ? 'Скрыть фильтры' : 'Фильтры'}
          </button>

          <button id="clearEmployerResumeFiltersBtn" class="app-button">
            Очистить
          </button>
        </div>
      </div>

      <div class="mt-5">
        <label class="block text-sm font-bold text-slate-700 mb-1">Быстрый поиск</label>
        <input
          id="employerResumeSearch"
          type="text"
          placeholder="Имя, группа, Python, Figma, SEO..."
          class="app-input"
        />
      </div>

      <div id="employerResumeActiveFilters" class="mt-4">
        ${renderEmployerResumeActiveFilters({
          search: '',
          city: '',
          direction: '',
          skills: [],
        })}
      </div>

      <div id="employerResumeFiltersPanel" class="${employerResumeFiltersOpen ? '' : 'hidden'} mt-5 border-t border-slate-200 pt-5">
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Город</label>
            <input
              id="employerResumeCityFilter"
              type="text"
              list="employerResumeCityFilterList"
              placeholder="Все города"
              class="app-input"
            />

            <datalist id="employerResumeCityFilterList">
              ${CATALOG_CITIES.map((city) => `<option value="${inputValue(city)}"></option>`).join('')}
            </datalist>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Направление</label>
            <select id="employerResumeDirectionFilter" class="app-select">
              <option value="">Все направления</option>
              ${CATALOG_DIRECTIONS.map((direction) => `
                <option value="${direction.value}">${direction.label}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="mt-4">
          ${renderSkillsPicker('employerResumeFilter')}
        </div>
      </div>
    </div>
  `;
}

function renderPublicResumeList(resumes) {
  if (!resumes.length) {
    return `
      <div class="app-card">
        <h3 class="text-xl font-black text-slate-900">Резюме не найдены</h3>
        <p class="text-slate-600 mt-2">
          Попробуйте изменить фильтры или очистить поиск.
        </p>
      </div>
    `;
  }

  return `
    <div class="space-y-4">
      ${resumes.map(publicResumeCard).join('')}
    </div>
  `;
}

function updatePublicResumeListByFilters() {
  const listBlock = document.getElementById('publicResumesList');
  const countBlock = document.getElementById('publicResumesCount');
  const activeFiltersBlock = document.getElementById('employerResumeActiveFilters');

  if (!listBlock) return;

  const filters = getEmployerResumeFilters();
  const filteredResumes = publicResumesCache.filter((resume) => publicResumeMatchesFilters(resume, filters));

  listBlock.innerHTML = renderPublicResumeList(filteredResumes);

  if (countBlock) {
    countBlock.textContent = `Найдено: ${filteredResumes.length}`;
  }

  if (activeFiltersBlock) {
    activeFiltersBlock.innerHTML = renderEmployerResumeActiveFilters(filters);
  }

  bindEmployerPublicResumeCardActions();
}

function bindEmployerResumeFilters() {
  bindSkillsPicker('employerResumeFilter');

  const searchInput = document.getElementById('employerResumeSearch');
  const cityInput = document.getElementById('employerResumeCityFilter');
  const directionInput = document.getElementById('employerResumeDirectionFilter');
  const clearBtn = document.getElementById('clearEmployerResumeFiltersBtn');
  const toggleBtn = document.getElementById('toggleEmployerResumeFiltersBtn');
  const panel = document.getElementById('employerResumeFiltersPanel');
  const skillSearchInput = document.getElementById('employerResumeFilterSkillSearch');
  const skillsList = document.getElementById('employerResumeFilterSkillsList');

  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => {
      employerResumeFiltersOpen = !employerResumeFiltersOpen;
      panel.classList.toggle('hidden', !employerResumeFiltersOpen);
      toggleBtn.textContent = employerResumeFiltersOpen ? 'Скрыть фильтры' : 'Фильтры';
    });
  }

  [searchInput, cityInput, directionInput].forEach((input) => {
    if (!input) return;

    input.addEventListener('input', updatePublicResumeListByFilters);
    input.addEventListener('change', updatePublicResumeListByFilters);
  });

  if (skillSearchInput) {
    skillSearchInput.addEventListener('input', () => {
      setTimeout(updatePublicResumeListByFilters, 0);
    });
  }

  if (skillsList) {
    skillsList.addEventListener('change', () => {
      setTimeout(updatePublicResumeListByFilters, 0);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (cityInput) cityInput.value = '';
      if (directionInput) directionInput.value = '';

      const hiddenSkillsInput = document.getElementById('employerResumeFilterSkillsValue');
      if (hiddenSkillsInput) hiddenSkillsInput.value = '';

      bindSkillsPicker('employerResumeFilter');
      updatePublicResumeListByFilters();
    });
  }

  updatePublicResumeListByFilters();
}

function publicResumeCard(resume) {
  const student = resume.student || {};

  return `
    <article class="app-card hover:shadow-lg transition">
      <div class="flex items-start gap-4">
        ${publicResumeStudentAvatar(student)}

        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="min-w-0">
              <div class="flex gap-2 flex-wrap mb-3">
                <span class="app-tag app-tag-purple">${directionLabel(resume.direction)}</span>
                <span class="app-tag">${safe(resume.city)}</span>
              </div>

              <h3 class="text-2xl font-black text-slate-900 tracking-tight break-words">
                ${safe(resume.title)}
              </h3>

              <p class="text-slate-600 mt-2">
                ${safe(student.full_name)} · ${safe(student.group_name)}
              </p>
            </div>

            ${statusBadge(resume.status)}
          </div>

          <p class="text-slate-700 mt-5 leading-7">
            ${shortText(resume.about || resume.experience || resume.skills, 220)}
          </p>

          <div class="mt-5 flex flex-wrap gap-2">
            ${publicResumeSkillTags(resume.skills, 10)}
          </div>

          <div class="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
            <div class="text-sm text-slate-500">
              Обновлено: ${employerResumeDateLabel(resume.updated_at)}
            </div>

            <div class="flex gap-3 flex-wrap">
              <button data-public-resume-view="${resume.id}" class="app-button app-button-primary">
                Открыть резюме
              </button>

              <button data-public-resume-pdf="${resume.id}" class="app-button app-button-purple">
                Скачать PDF
              </button>

              <button data-public-resume-invite="${resume.id}" class="app-button app-button-blue">
                Пригласить
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

function publicResumeDetail(resume) {
  const student = resume.student || {};

  return `
    <div class="space-y-5">
      <button id="backToPublicResumesBtn" class="app-button">
        ← Назад к резюме студентов
      </button>

      <article class="app-card">
        <div class="flex items-start justify-between gap-5 flex-wrap">
          <div class="flex items-start gap-5 min-w-0 flex-1">
            ${publicResumeLargeStudentAvatar(student)}

            <div class="min-w-0">
              <div class="flex gap-2 flex-wrap mb-4">
                ${statusBadge(resume.status)}
                ${
                  resume.is_public
                    ? '<span class="app-badge app-badge-success">Публичное</span>'
                    : '<span class="app-badge">Скрытое</span>'
                }
              </div>

              <h3 class="text-3xl md:text-4xl font-black text-slate-900 tracking-tight break-words">
                ${safe(resume.title)}
              </h3>

              <p class="mt-3 text-slate-600 font-semibold">
                ${safe(student.full_name)} · ${safe(student.group_name)}
              </p>

              <div class="mt-4 flex gap-2 flex-wrap">
                <span class="app-tag app-tag-purple">${directionLabel(resume.direction)}</span>
                <span class="app-tag">${safe(resume.city)}</span>
                <span class="app-tag">Обновлено ${employerResumeDateLabel(resume.updated_at)}</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3 min-w-[220px]">
            <button data-public-resume-invite="${resume.id}" class="app-button app-button-blue w-full">
              Пригласить студента
            </button>

            <button data-public-resume-pdf="${resume.id}" class="app-button app-button-purple w-full">
              Скачать PDF
            </button>
          </div>
        </div>

        <div class="mt-7 grid lg:grid-cols-[1fr_300px] gap-6">
          <div class="space-y-5">
            ${publicResumeTextBlock('О себе', resume.about)}
            ${publicResumeTextBlock('Опыт / проекты', resume.experience)}
            ${publicResumeTextBlock('Образование', resume.education)}
            ${publicResumeTextBlock('Контакты', resume.contacts)}
          </div>

          <aside class="space-y-4">
            <div class="rounded-3xl bg-slate-50 border border-slate-200 p-5">
              <h4 class="font-black text-slate-900">Кандидат</h4>

              <div class="mt-4 space-y-3 text-sm">
                <div>
                  <div class="text-slate-500">ФИО</div>
                  <div class="font-bold text-slate-900">${safe(student.full_name)}</div>
                </div>

                <div>
                  <div class="text-slate-500">Группа</div>
                  <div class="font-bold text-slate-900">${safe(student.group_name)}</div>
                </div>

                <div>
                  <div class="text-slate-500">Город</div>
                  <div class="font-bold text-slate-900">${safe(resume.city)}</div>
                </div>

                <div>
                  <div class="text-slate-500">Направление</div>
                  <div class="font-bold text-slate-900">${directionLabel(resume.direction)}</div>
                </div>

                <div>
                  <div class="text-slate-500">Дата создания</div>
                  <div class="font-bold text-slate-900">${employerResumeDateLabel(resume.created_at)}</div>
                </div>
              </div>
            </div>

            <div class="rounded-3xl bg-slate-50 border border-slate-200 p-5">
              <h4 class="font-black text-slate-900">Навыки</h4>

              <div class="mt-3 flex flex-wrap gap-2">
                ${publicResumeSkillTags(resume.skills)}
              </div>
            </div>
          </aside>
        </div>
      </article>
    </div>
  `;
}

async function renderPublicResumesForEmployerTab() {
  try {
    const response = await getPublicResumes(publicResumeLimit, publicResumeOffset);

    if (!response.ok) {
      return placeholderBlock('Резюме студентов', 'Не удалось загрузить резюме студентов.');
    }

    const data = await response.json();
    publicResumesCache = data.items || [];

    return `
      <div class="space-y-6">
        ${renderEmployerResumeFilters()}

        <div class="flex items-center justify-between gap-4 flex-wrap">
          <div id="publicResumesCount" class="text-sm text-slate-600">
            Найдено: ${publicResumesCache.length}
          </div>

          <div class="text-sm text-slate-500">
            Загружено ${data.items.length} из ${data.total}
          </div>
        </div>

        <div id="publicResumesList">
          ${
            publicResumesCache.length
              ? renderPublicResumeList(publicResumesCache)
              : placeholderBlock('Резюме студентов', 'Пока нет публичных резюме.')
          }
        </div>

        ${renderPublicResumePagination(data)}
      </div>
    `;
  } catch {
    return placeholderBlock('Резюме студентов', 'Сервер недоступен.');
  }
}

function renderPublicResumePagination(data) {
  const hasPrev = data.offset > 0;
  const hasNext = data.offset + data.limit < data.total;

  return `
    <div class="flex items-center justify-between gap-4 flex-wrap bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div class="text-sm text-slate-600">
        Показано ${data.items.length} из ${data.total}
      </div>

      <div class="flex gap-3">
        <button
          id="publicResumePrevPageBtn"
          ${!hasPrev ? 'disabled' : ''}
          class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          Назад
        </button>

        <button
          id="publicResumeNextPageBtn"
          ${!hasNext ? 'disabled' : ''}
          class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          Еще
        </button>
      </div>
    </div>
  `;
}

async function downloadEmployerPublicResumePdf(resumeId) {
  try {
    const response = await downloadPublicResumePdf(resumeId);

    if (!response.ok) {
      let message = 'Не удалось скачать PDF резюме';

      try {
        const data = await response.json();
        message = getApiErrorMessage(data, message);
      } catch {
        // Если backend вернул не JSON, оставляем стандартное сообщение.
      }

      showToast(message, 'error');
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `resume_${resumeId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch {
    showToast('Сервер недоступен или возникла ошибка сети', 'error');
  }
}

async function showInviteStudentModal(resumeId) {
  let vacancies = [];

  try {
    const response = await getEmployerVacancies();

    if (!response.ok) {
      showToast('Не удалось загрузить вакансии работодателя', 'error');
      return;
    }

    const allVacancies = await response.json();
    vacancies = allVacancies.filter((vacancy) => vacancy.status === 'published');
  } catch {
    showToast('Сервер недоступен', 'error');
    return;
  }

  if (!vacancies.length) {
    showToast('Сначала создайте опубликованную вакансию', 'error');
    return;
  }

  const oldModal = document.getElementById('inviteStudentModal');
  if (oldModal) oldModal.remove();

  const modal = document.createElement('div');
  modal.id = 'inviteStudentModal';
  modal.className = 'fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm px-4 py-6 overflow-y-auto';

  modal.innerHTML = `
    <div class="min-h-full flex items-center justify-center">
      <div class="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl border border-slate-200 my-6">
        <div class="flex items-start justify-between gap-4 mb-5">
          <div>
            <div class="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 text-xs font-bold">
              Приглашение
            </div>

            <h3 class="mt-4 text-2xl font-black text-slate-900">Пригласить студента</h3>
            <p class="text-sm text-slate-500 mt-2">
              Выберите вакансию и отправьте студенту приглашение.
            </p>
          </div>

          <button id="closeInviteStudentModalBtn" type="button"
            class="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center text-2xl leading-none transition">
            ×
          </button>
        </div>

        <form id="inviteStudentForm" class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Вакансия</label>
            <select id="inviteVacancyId" required class="app-select">
              <option value="" disabled selected>Выберите вакансию</option>
              ${
                vacancies
                  .map((vacancy) => `
                    <option value="${vacancy.id}">
                      ${safe(vacancy.title)} · ${safe(vacancy.city)} · ${directionLabel(vacancy.direction)} · ${catalogEmploymentTypeLabel(vacancy.employment_type)}
                    </option>
                  `)
                  .join('')
              }
            </select>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Сообщение студенту</label>
            <textarea
              id="inviteMessage"
              rows="5"
              maxlength="2000"
              placeholder="Здравствуйте! Мы посмотрели ваше резюме и хотим пригласить вас на вакансию..."
              class="app-textarea"
            ></textarea>
          </div>

          <button type="submit" class="app-button app-button-blue w-full">
            Отправить приглашение
          </button>
        </form>

        <div id="inviteStudentResult" class="mt-4 text-sm whitespace-pre-wrap"></div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  function closeModal() {
    modal.remove();
  }

  document.getElementById('closeInviteStudentModalBtn').addEventListener('click', closeModal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.getElementById('inviteStudentForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const result = document.getElementById('inviteStudentResult');
    const vacancyId = Number(document.getElementById('inviteVacancyId').value);
    const message = document.getElementById('inviteMessage').value.trim() || null;

    if (!vacancyId) {
      showMessage(result, 'Выберите вакансию.', true);
      return;
    }

    result.className = 'mt-4 text-sm text-slate-600 whitespace-pre-wrap';
    result.textContent = 'Отправляем приглашение...';

    try {
      const response = await inviteStudentByResume(resumeId, {
        vacancy_id: vacancyId,
        message,
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(
          result,
          getApiErrorMessage(data, 'Не удалось отправить приглашение.'),
          true
        );
        return;
      }

      showToast('Приглашение отправлено студенту');
      closeModal();
      await renderEmployerDashboard(currentUser, 'applications');
    } catch {
      showMessage(result, 'Сервер недоступен или возникла ошибка сети.', true);
    }
  });
}

function bindEmployerPublicResumeCardActions() {
  document.querySelectorAll('[data-public-resume-view]').forEach((button) => {
    button.addEventListener('click', async () => {
      const resumeId = button.dataset.publicResumeView;
      const response = await getPublicResumeById(resumeId);

      if (!response.ok) {
        showToast('Не удалось открыть резюме', 'error');
        return;
      }

      const resume = await response.json();
      dashboardContent.innerHTML = publicResumeDetail(resume);

      document.getElementById('backToPublicResumesBtn').addEventListener('click', async () => {
        await renderEmployerDashboard(currentUser, 'students');
      });

      bindEmployerPublicResumeCardActions();
    });
  });

  document.querySelectorAll('[data-public-resume-invite]').forEach((button) => {
    button.addEventListener('click', async () => {
      const resumeId = button.dataset.publicResumeInvite;
      await showInviteStudentModal(resumeId);
    });
  });

  document.querySelectorAll('[data-public-resume-pdf]').forEach((button) => {
    button.addEventListener('click', async () => {
      const resumeId = button.dataset.publicResumePdf;
      await downloadEmployerPublicResumePdf(resumeId);
    });
  });
}

function bindEmployerPublicResumeActions() {
  bindEmployerResumeFilters();
  bindEmployerPublicResumeCardActions();

  const prevBtn = document.getElementById('publicResumePrevPageBtn');
  if (prevBtn) {
    prevBtn.addEventListener('click', async () => {
      publicResumeOffset = Math.max(0, publicResumeOffset - publicResumeLimit);
      await renderEmployerDashboard(currentUser, 'students');
    });
  }

  const nextBtn = document.getElementById('publicResumeNextPageBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', async () => {
      publicResumeOffset += publicResumeLimit;
      await renderEmployerDashboard(currentUser, 'students');
    });
  }
}