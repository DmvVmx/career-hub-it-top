function vacancyDateLabel(value) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

function vacancyMetaLine(vacancy) {
  const items = [
    vacancy.city,
    catalogWorkFormatLabel(vacancy.work_format),
    catalogEmploymentTypeLabel(vacancy.employment_type),
    directionLabel(vacancy.direction),
  ].filter(Boolean);

  return items.map((item) => safe(item)).join(' · ');
}

function vacancyRejectionBlock(vacancy) {
  if (!vacancy || !vacancy.rejection_reason) {
    return '';
  }

  return `
    <div class="mt-5 app-alert-danger">
      <div class="font-black">Вакансия отклонена администратором</div>
      <p class="text-sm mt-2 whitespace-pre-wrap">${safe(vacancy.rejection_reason)}</p>
      <p class="text-sm mt-3">
        Исправьте вакансию и сохраните изменения. После сохранения старая причина будет очищена.
      </p>
    </div>
  `;
}

function renderVacancySkillTags(skills, limit = null) {
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
    ${
      hiddenCount > 0
        ? `<span class="app-tag">+${hiddenCount}</span>`
        : ''
    }
  `;
}

function employerVacancyCard(vacancy) {
  return `
    <article class="app-card hover:shadow-lg transition">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap mb-3">
            ${statusBadge(vacancy.status)}
            <span class="app-tag">${vacancyDateLabel(vacancy.created_at)}</span>
          </div>

          <h3 class="text-2xl font-black text-slate-900 tracking-tight break-words">
            ${safe(vacancy.title)}
          </h3>

          <p class="mt-2 text-sm font-semibold text-slate-500">
            ${vacancyMetaLine(vacancy)}
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

      <div class="mt-5">
        <div class="flex flex-wrap gap-2">
          ${renderVacancySkillTags(vacancy.skills, 10)}
        </div>
      </div>

      ${vacancyRejectionBlock(vacancy)}

      <div class="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
        <div class="text-sm text-slate-500">
          Обновлено: ${formatDateTime(vacancy.updated_at)}
        </div>

        <div class="flex gap-2 flex-wrap">
          <button data-employer-vacancy-view="${vacancy.id}" class="app-button app-button-primary">
            Открыть
          </button>

          <button data-employer-vacancy-edit="${vacancy.id}" class="app-button">
            Редактировать
          </button>

          ${
            vacancy.status !== 'archived'
              ? `
                <button data-employer-vacancy-archive="${vacancy.id}" class="app-button">
                  В архив
                </button>
              `
              : `
                <button data-employer-vacancy-restore="${vacancy.id}" class="app-button app-button-primary">
                  Вернуть
                </button>
              `
          }

          <button data-employer-vacancy-delete="${vacancy.id}" class="app-button app-button-danger">
            Удалить
          </button>
        </div>
      </div>
    </article>
  `;
}
function employerVacancyDetailView(vacancy) {
  return `
    <div class="space-y-5">
      <button id="backToEmployerVacanciesBtn" class="app-button">
        ← Назад к моим вакансиям
      </button>

      <article class="app-card">
        <div class="flex items-start justify-between gap-5 flex-wrap">
          <div class="min-w-0 flex-1">
            <div class="flex gap-2 flex-wrap">
              ${statusBadge(vacancy.status)}
              <span class="app-tag">Создана ${vacancyDateLabel(vacancy.created_at)}</span>
              <span class="app-tag">${directionLabel(vacancy.direction)}</span>
            </div>

            <h3 class="mt-4 text-3xl md:text-4xl font-black text-slate-900 tracking-tight break-words">
              ${safe(vacancy.title)}
            </h3>

            <p class="mt-3 text-slate-600 font-semibold">
              ${vacancyMetaLine(vacancy)}
            </p>
          </div>

          <div class="rounded-3xl bg-slate-50 border border-slate-200 px-5 py-4 min-w-[220px]">
            <div class="text-xs text-slate-500 font-bold">Зарплата</div>
            <div class="mt-1 text-2xl font-black text-slate-900">
              ${formatSalary(vacancy)}
            </div>
          </div>
        </div>

        ${vacancyRejectionBlock(vacancy)}

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
                  <div class="text-slate-500">Обновлена</div>
                  <div class="font-bold text-slate-900">${formatDateTime(vacancy.updated_at)}</div>
                </div>
              </div>
            </div>

            <div class="rounded-3xl bg-slate-50 border border-slate-200 p-5">
              <h4 class="font-black text-slate-900">Навыки</h4>

              <div class="mt-3 flex flex-wrap gap-2">
                ${renderVacancySkillTags(vacancy.skills)}
              </div>
            </div>
          </aside>
        </div>
      </article>
    </div>
  `;
}    

async function renderEmployerVacanciesTab() {
  try {
    const response = await getEmployerVacancies();

    if (!response.ok) {
      return placeholderBlock('Мои вакансии', 'Не удалось загрузить ваши вакансии.');
    }

    const vacancies = await response.json();
    const visibleVacancies = vacancies.filter((vacancy) => vacancy.status !== 'deleted');

    if (!visibleVacancies.length) {
      return `
        <div class="app-card">
          <h3 class="text-xl font-black">Вакансий пока нет</h3>
          <p class="text-slate-600 mt-2">
            Создайте первую вакансию, чтобы студенты могли откликаться.
          </p>

          <button id="goToCreateVacancyBtn" class="app-button app-button-primary mt-5">
            Создать вакансию
          </button>
        </div>
      `;
    }

    return `
      <div class="space-y-4">
        ${visibleVacancies.map((vacancy) => employerVacancyCard(vacancy)).join('')}
      </div>
    `;
  } catch {
    return placeholderBlock('Мои вакансии', 'Сервер недоступен.');
  }
}

async function renderCreateVacancyTab() {
  const profileResponse = await getEmployerProfile();

  if (!profileResponse.ok) {
    return placeholderBlock('Создать вакансию', 'Не удалось проверить профиль компании.');
  }

  const profile = await profileResponse.json();

  if (!profile) {
    return `
      <div class="app-card">
        <h3 class="text-xl font-black">Создать вакансию</h3>

        <p class="text-slate-600 mt-2">
          Сначала заполните профиль компании. После этого можно будет создавать вакансии.
        </p>

        <button id="goToCompanyProfileBtn" class="app-button app-button-primary mt-5">
          Перейти к профилю компании
        </button>
      </div>
    `;
  }

  return `
    <div class="app-card">
      <div class="mb-6">
        <h3 class="text-xl font-black text-slate-900">Создать вакансию</h3>
        <p class="text-sm text-slate-500 mt-1">
          Заполните основные данные. Город, направление и навыки выбираются из справочника.
        </p>
      </div>

      <form id="createVacancyForm" class="grid md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-bold text-slate-700 mb-1">Название вакансии *</label>
          <input
            id="vacancyTitle"
            type="text"
            required
            placeholder="Junior Python Developer"
            class="app-input"
          />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-bold text-slate-700 mb-1">Описание *</label>
          <textarea
            id="vacancyDescription"
            rows="5"
            required
            placeholder="Опишите задачи, условия работы и чем будет заниматься студент"
            class="app-textarea"
          ></textarea>
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-bold text-slate-700 mb-1">Требования *</label>
          <textarea
            id="vacancyRequirements"
            rows="4"
            required
            placeholder="Ответственность, желание учиться, базовые знания..."
            class="app-textarea"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">Зарплата от</label>
          <input
            id="salaryFrom"
            type="number"
            min="0"
            placeholder="Можно не указывать"
            class="app-input"
          />
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">Зарплата до</label>
          <input
            id="salaryTo"
            type="number"
            min="0"
            placeholder="Можно не указывать"
            class="app-input"
          />
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">Город *</label>
          ${renderCityInput('vacancyCity', 'Сочи')}
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">Направление *</label>
          ${renderDirectionSelect('vacancyDirection')}
        </div>

        ${renderSkillsPicker('vacancy')}

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">Формат работы *</label>
          ${renderWorkFormatSelect('workFormat')}
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">Тип занятости *</label>
          ${renderEmploymentTypeSelect('employmentType')}
        </div>

        <div class="md:col-span-2">
          <button type="submit" class="app-button app-button-primary w-full">
            Создать вакансию
          </button>
        </div>
      </form>

      <div id="createVacancyResult" class="mt-4 text-sm whitespace-pre-wrap"></div>
    </div>
  `;
}

function validateVacancyPayload(payload, result, salaryFrom, salaryTo) {
  if (payload.title.length < 2) {
    showMessage(result, 'Название вакансии должно содержать минимум 2 символа.', true);
    return false;
  }

  if (payload.description.length < 10) {
    showMessage(result, 'Описание должно содержать минимум 10 символов.', true);
    return false;
  }

  if (payload.requirements.length < 2) {
    showMessage(result, 'Требования обязательны для заполнения.', true);
    return false;
  }

  if (!validateCatalogCity(payload.city)) {
    showMessage(result, 'Выберите город из списка.', true);
    return false;
  }

  if (!validateCatalogDirection(payload.direction)) {
    showMessage(result, 'Выберите направление.', true);
    return false;
  }

  if (!validateCatalogSkills(payload.skills)) {
    showMessage(result, 'Выберите хотя бы один навык из списка.', true);
    return false;
  }

  if (!payload.work_format) {
    showMessage(result, 'Выберите формат работы.', true);
    return false;
  }

  if (!payload.employment_type) {
    showMessage(result, 'Выберите тип занятости.', true);
    return false;
  }

  if (salaryFrom !== null && salaryTo !== null && salaryFrom > salaryTo) {
    showMessage(result, 'Зарплата “от” не может быть больше зарплаты “до”.', true);
    return false;
  }

  return true;
}

function bindCreateVacancyForm() {
  const form = document.getElementById('createVacancyForm');
  if (!form) return;

  bindSkillsPicker('vacancy');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const result = document.getElementById('createVacancyResult');
    result.className = 'mt-4 text-sm text-slate-600 whitespace-pre-wrap';
    result.textContent = 'Проверяем данные...';

    const salaryFromValue = document.getElementById('salaryFrom').value;
    const salaryToValue = document.getElementById('salaryTo').value;
    const salaryFrom = salaryFromValue ? Number(salaryFromValue) : null;
    const salaryTo = salaryToValue ? Number(salaryToValue) : null;

    const payload = {
      title: document.getElementById('vacancyTitle').value.trim(),
      description: document.getElementById('vacancyDescription').value.trim(),
      requirements: document.getElementById('vacancyRequirements').value.trim(),
      salary_from: salaryFrom,
      salary_to: salaryTo,
      city: document.getElementById('vacancyCity').value.trim(),
      direction: document.getElementById('vacancyDirection').value,
      skills: getSkillsPickerValue('vacancy'),
      work_format: document.getElementById('workFormat').value,
      employment_type: document.getElementById('employmentType').value,
    };

    if (!validateVacancyPayload(payload, result, salaryFrom, salaryTo)) {
      return;
    }

    result.textContent = 'Создаем вакансию...';

    try {
      const response = await createEmployerVacancy(payload);
      const data = await response.json();

      if (!response.ok) {
        showMessage(result, getApiErrorMessage(data, 'Ошибка создания вакансии.'), true);
        return;
      }

      showToast('Вакансия создана');
      await renderEmployerDashboard(currentUser, 'vacancies');
    } catch {
      showMessage(result, 'Сервер недоступен или возникла ошибка сети.', true);
    }
  });
}

function renderVacancyEditForm(vacancy) {
  dashboardContent.innerHTML = `
    <div class="space-y-5">
      <button id="backToEmployerVacanciesFromEditBtn" class="app-button">
        ← Назад к вакансиям
      </button>

      <div class="app-card">
        <div class="mb-6">
          <h3 class="text-xl font-black text-slate-900">Редактировать вакансию</h3>
          <p class="text-sm text-slate-500 mt-1">
            После исправления отклонённой вакансии старая причина будет очищена.
          </p>
        </div>

        ${vacancyRejectionBlock(vacancy)}

        <form id="editVacancyForm" class="grid md:grid-cols-2 gap-4 mt-5">
          <div class="md:col-span-2">
            <label class="block text-sm font-bold text-slate-700 mb-1">Название вакансии *</label>
            <input id="editVacancyTitle" type="text" required value="${inputValue(vacancy.title)}" class="app-input" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-bold text-slate-700 mb-1">Описание *</label>
            <textarea id="editVacancyDescription" rows="5" required class="app-textarea">${safe(vacancy.description)}</textarea>
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-bold text-slate-700 mb-1">Требования *</label>
            <textarea id="editVacancyRequirements" rows="4" required class="app-textarea">${safe(vacancy.requirements)}</textarea>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Зарплата от</label>
            <input id="editSalaryFrom" type="number" min="0" value="${vacancy.salary_from ?? ''}" class="app-input" />
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Зарплата до</label>
            <input id="editSalaryTo" type="number" min="0" value="${vacancy.salary_to ?? ''}" class="app-input" />
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Город *</label>
            ${renderCityInput('editVacancyCity', vacancy.city || 'Сочи')}
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Направление *</label>
            ${renderDirectionSelect('editVacancyDirection', vacancy.direction || '')}
          </div>

          ${renderSkillsPicker('editVacancy', vacancy.skills || '')}

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Формат работы *</label>
            ${renderWorkFormatSelect('editWorkFormat', vacancy.work_format || '')}
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Тип занятости *</label>
            ${renderEmploymentTypeSelect('editEmploymentType', vacancy.employment_type || '')}
          </div>

          <div class="md:col-span-2">
            <button type="submit" class="app-button app-button-primary w-full">
              Сохранить изменения
            </button>
          </div>
        </form>

        <div id="editVacancyResult" class="mt-4 text-sm whitespace-pre-wrap"></div>
      </div>
    </div>
  `;

  document.getElementById('backToEmployerVacanciesFromEditBtn').addEventListener('click', async () => {
    await renderEmployerDashboard(currentUser, 'vacancies');
  });

  bindSkillsPicker('editVacancy');
  bindEditVacancyForm(vacancy.id);
}

function bindEditVacancyForm(vacancyId) {
  const form = document.getElementById('editVacancyForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const result = document.getElementById('editVacancyResult');
    result.className = 'mt-4 text-sm text-slate-600 whitespace-pre-wrap';
    result.textContent = 'Проверяем данные...';

    const salaryFromValue = document.getElementById('editSalaryFrom').value;
    const salaryToValue = document.getElementById('editSalaryTo').value;
    const salaryFrom = salaryFromValue ? Number(salaryFromValue) : null;
    const salaryTo = salaryToValue ? Number(salaryToValue) : null;

    const payload = {
      title: document.getElementById('editVacancyTitle').value.trim(),
      description: document.getElementById('editVacancyDescription').value.trim(),
      requirements: document.getElementById('editVacancyRequirements').value.trim(),
      salary_from: salaryFrom,
      salary_to: salaryTo,
      city: document.getElementById('editVacancyCity').value.trim(),
      direction: document.getElementById('editVacancyDirection').value,
      skills: getSkillsPickerValue('editVacancy'),
      work_format: document.getElementById('editWorkFormat').value,
      employment_type: document.getElementById('editEmploymentType').value,
    };

    if (!validateVacancyPayload(payload, result, salaryFrom, salaryTo)) {
      return;
    }

    result.textContent = 'Сохраняем изменения...';

    try {
      const response = await updateEmployerVacancy(vacancyId, payload);
      const data = await response.json();

      if (!response.ok) {
        showMessage(result, getApiErrorMessage(data, 'Ошибка обновления вакансии.'), true);
        return;
      }

      showToast('Вакансия обновлена');
      await renderEmployerDashboard(currentUser, 'vacancies');
    } catch {
      showMessage(result, 'Сервер недоступен или возникла ошибка сети.', true);
    }
  });
}

function bindEmployerVacancyActions() {
  const goToCreateVacancyBtn = document.getElementById('goToCreateVacancyBtn');

  if (goToCreateVacancyBtn) {
    goToCreateVacancyBtn.addEventListener('click', async () => {
      await renderEmployerDashboard(currentUser, 'create-vacancy');
    });
  }

  document.querySelectorAll('[data-employer-vacancy-view]').forEach((button) => {
    button.addEventListener('click', async () => {
      const vacancyId = button.dataset.employerVacancyView;
      const response = await getEmployerVacancies();

      if (!response.ok) {
        showToast('Не удалось открыть вакансию', 'error');
        return;
      }

      const vacancies = await response.json();
      const vacancy = vacancies.find((item) => String(item.id) === String(vacancyId));

      if (!vacancy) {
        showToast('Вакансия не найдена', 'error');
        return;
      }

      dashboardContent.innerHTML = employerVacancyDetailView(vacancy);

      document.getElementById('backToEmployerVacanciesBtn').addEventListener('click', async () => {
        await renderEmployerDashboard(currentUser, 'vacancies');
      });
    });
  });

  document.querySelectorAll('[data-employer-vacancy-archive]').forEach((button) => {
    button.addEventListener('click', async () => {
      const vacancyId = button.dataset.employerVacancyArchive;

      const confirmed = await showConfirmModal({
        title: 'Перенести вакансию в архив?',
        message: 'Вакансия пропадет из публичного списка, но останется в истории работодателя.',
        confirmText: 'В архив',
      });

      if (!confirmed) return;

      const response = await archiveEmployerVacancy(vacancyId);

      if (!response.ok) {
        showToast('Не удалось архивировать вакансию', 'error');
        return;
      }

      showToast('Вакансия перенесена в архив');
      await renderEmployerDashboard(currentUser, 'vacancies');
    });
  });

  document.querySelectorAll('[data-employer-vacancy-restore]').forEach((button) => {
    button.addEventListener('click', async () => {
      const vacancyId = button.dataset.employerVacancyRestore;

      const confirmed = await showConfirmModal({
        title: 'Вернуть вакансию из архива?',
        message: 'Вакансия снова появится в публичном списке для студентов.',
        confirmText: 'Вернуть',
      });

      if (!confirmed) return;

      const response = await restoreEmployerVacancy(vacancyId);

      if (!response.ok) {
        showToast('Не удалось восстановить вакансию', 'error');
        return;
      }

      showToast('Вакансия восстановлена');
      await renderEmployerDashboard(currentUser, 'vacancies');
    });
  });

  document.querySelectorAll('[data-employer-vacancy-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      const vacancyId = button.dataset.employerVacancyDelete;

      const confirmed = await showConfirmModal({
        title: 'Удалить вакансию?',
        message: 'Вакансия будет скрыта, но сохранится в истории системы. Это мягкое удаление.',
        confirmText: 'Удалить',
        danger: true,
      });

      if (!confirmed) return;

      const response = await deleteEmployerVacancy(vacancyId);

      if (!response.ok) {
        showToast('Не удалось удалить вакансию', 'error');
        return;
      }

      showToast('Вакансия удалена');
      await renderEmployerDashboard(currentUser, 'vacancies');
    });
  });

  document.querySelectorAll('[data-employer-vacancy-edit]').forEach((button) => {
    button.addEventListener('click', async () => {
      const vacancyId = button.dataset.employerVacancyEdit;
      const response = await getEmployerVacancies();

      if (!response.ok) {
        showToast('Не удалось загрузить вакансию', 'error');
        return;
      }

      const vacancies = await response.json();
      const vacancy = vacancies.find((item) => String(item.id) === String(vacancyId));

      if (!vacancy) {
        showToast('Вакансия не найдена', 'error');
        return;
      }

      renderVacancyEditForm(vacancy);
    });
  });
}