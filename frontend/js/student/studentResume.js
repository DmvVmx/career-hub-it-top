let studentResumeLimit = 6;
let studentResumeOffset = 0;

function resumeDateLabel(value) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

function resumePublicBadge(resume) {
  return resume.is_public
    ? '<span class="app-badge app-badge-success">Публичное</span>'
    : '<span class="app-badge">Скрытое</span>';
}

function resumeMetaLine(resume) {
  const items = [
    resume.city,
    directionLabel(resume.direction),
    resume.is_public ? 'публичное' : 'скрытое',
  ].filter(Boolean);

  return items.map((item) => safe(item)).join(' · ');
}

function resumeTextBlock(title, value) {
  return `
    <div class="rounded-3xl bg-slate-50 border border-slate-200 p-5">
      <div class="text-sm font-bold text-slate-500">${title}</div>
      <div class="mt-2 whitespace-pre-wrap leading-8 text-slate-700">${safe(value)}</div>
    </div>
  `;
}

function resumeRejectionBlock(resume) {
  if (!resume || !resume.rejection_reason) {
    return '';
  }

  return `
    <div class="mt-5 app-alert-danger">
      <div class="font-black">Резюме отклонено администратором</div>
      <p class="text-sm mt-2 whitespace-pre-wrap">${safe(resume.rejection_reason)}</p>
      <p class="text-sm mt-3">
        Исправьте резюме и сохраните изменения. После сохранения старая причина будет очищена.
      </p>
    </div>
  `;
}

function renderResumeSkillTags(skills, limit = null) {
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
    ${visibleList.map((skill) => `<span class="app-tag app-tag-purple">${safe(skill)}</span>`).join('')}
    ${hiddenCount > 0 ? `<span class="app-tag">+${hiddenCount}</span>` : ''}
  `;
}

function studentResumeCard(resume) {
  return `
    <article class="app-card hover:shadow-lg transition">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap mb-3">
            ${resumePublicBadge(resume)}
            ${statusBadge(resume.status)}
            <span class="app-tag">${resumeDateLabel(resume.created_at)}</span>
          </div>

          <h3 class="text-2xl font-black text-slate-900 tracking-tight break-words">
            ${safe(resume.title)}
          </h3>

          <p class="mt-2 text-sm font-semibold text-slate-500">
            ${resumeMetaLine(resume)}
          </p>
        </div>
      </div>

      <p class="mt-5 text-slate-700 leading-7">
        ${shortText(resume.about || resume.experience || resume.skills, 260)}
      </p>

      <div class="mt-5">
        <div class="flex flex-wrap gap-2">
          ${renderResumeSkillTags(resume.skills, 10)}
        </div>
      </div>

      ${resumeRejectionBlock(resume)}

      <div class="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
        <div class="text-sm text-slate-500">
          Обновлено: ${formatDateTime(resume.updated_at)}
        </div>

        <div class="flex gap-2 flex-wrap">
          <button data-my-resume-view="${resume.id}" class="app-button app-button-primary">
            Открыть
          </button>

          <button data-my-resume-edit="${resume.id}" class="app-button">
            Редактировать
          </button>

          <button data-resume-pdf="${resume.id}" class="app-button app-button-purple">
            PDF
          </button>

          ${
            resume.status !== 'archived'
              ? `
                <button data-my-resume-archive="${resume.id}" class="app-button">
                  В архив
                </button>
              `
              : `
                <button data-my-resume-restore="${resume.id}" class="app-button app-button-primary">
                  Вернуть
                </button>
              `
          }

          <button data-my-resume-delete="${resume.id}" class="app-button app-button-danger">
            Удалить
          </button>
        </div>
      </div>
    </article>
  `;
}

function studentResumeDetail(resume) {
  return `
    <div class="space-y-5">
      <button id="backToMyResumesBtn" class="app-button">
        ← Назад к резюме
      </button>

      <article class="app-card">
        <div class="flex items-start justify-between gap-5 flex-wrap">
          <div class="min-w-0 flex-1">
            <div class="flex gap-2 flex-wrap">
              ${resumePublicBadge(resume)}
              ${statusBadge(resume.status)}
              <span class="app-tag">Создано ${resumeDateLabel(resume.created_at)}</span>
              <span class="app-tag">${directionLabel(resume.direction)}</span>
            </div>

            <h3 class="mt-4 text-3xl md:text-4xl font-black text-slate-900 tracking-tight break-words">
              ${safe(resume.title)}
            </h3>

            <p class="mt-3 text-slate-600 font-semibold">
              ${resumeMetaLine(resume)}
            </p>
          </div>

          <button data-resume-pdf="${resume.id}" class="app-button app-button-purple">
            Скачать PDF
          </button>
        </div>

        ${resumeRejectionBlock(resume)}

        <div class="mt-7 grid lg:grid-cols-[1fr_280px] gap-6">
          <div class="space-y-5">
            <section>
              <h4 class="text-lg font-black text-slate-900">О себе</h4>
              <div class="mt-3 rounded-3xl bg-slate-50 border border-slate-200 p-5">
                <div class="whitespace-pre-wrap leading-8 text-slate-700">${safe(resume.about)}</div>
              </div>
            </section>

            <section>
              <h4 class="text-lg font-black text-slate-900">Опыт / проекты</h4>
              <div class="mt-3 rounded-3xl bg-slate-50 border border-slate-200 p-5">
                <div class="whitespace-pre-wrap leading-8 text-slate-700">${safe(resume.experience)}</div>
              </div>
            </section>

            <section>
              <h4 class="text-lg font-black text-slate-900">Образование</h4>
              <div class="mt-3 rounded-3xl bg-slate-50 border border-slate-200 p-5">
                <div class="whitespace-pre-wrap leading-8 text-slate-700">${safe(resume.education)}</div>
              </div>
            </section>

            <section>
              <h4 class="text-lg font-black text-slate-900">Контакты</h4>
              <div class="mt-3 rounded-3xl bg-slate-50 border border-slate-200 p-5">
                <div class="whitespace-pre-wrap leading-8 text-slate-700">${safe(resume.contacts)}</div>
              </div>
            </section>
          </div>

          <aside class="space-y-4">
            <div class="rounded-3xl bg-slate-50 border border-slate-200 p-5">
              <h4 class="font-black text-slate-900">Кратко</h4>

              <div class="mt-4 space-y-3 text-sm">
                <div>
                  <div class="text-slate-500">Город</div>
                  <div class="font-bold text-slate-900">${safe(resume.city)}</div>
                </div>

                <div>
                  <div class="text-slate-500">Направление</div>
                  <div class="font-bold text-slate-900">${directionLabel(resume.direction)}</div>
                </div>

                <div>
                  <div class="text-slate-500">Статус</div>
                  <div class="font-bold text-slate-900">${statusLabel(resume.status)}</div>
                </div>

                <div>
                  <div class="text-slate-500">Видимость</div>
                  <div class="font-bold text-slate-900">${resume.is_public ? 'Публичное' : 'Скрытое'}</div>
                </div>

                <div>
                  <div class="text-slate-500">Обновлено</div>
                  <div class="font-bold text-slate-900">${formatDateTime(resume.updated_at)}</div>
                </div>
              </div>
            </div>

            <div class="rounded-3xl bg-slate-50 border border-slate-200 p-5">
              <h4 class="font-black text-slate-900">Навыки</h4>

              <div class="mt-3 flex flex-wrap gap-2">
                ${renderResumeSkillTags(resume.skills)}
              </div>
            </div>
          </aside>
        </div>
      </article>
    </div>
  `;
}

function renderResumePagination(data) {
  const hasPrev = data.offset > 0;
  const hasNext = data.offset + data.limit < data.total;

  return `
    <div class="app-card flex items-center justify-between gap-4 flex-wrap">
      <div class="text-sm text-slate-600">
        Показано ${data.items.length} из ${data.total}
      </div>

      <div class="flex gap-3">
        <button id="resumePrevPageBtn" ${!hasPrev ? 'disabled' : ''} class="app-button">
          Назад
        </button>

        <button id="resumeNextPageBtn" ${!hasNext ? 'disabled' : ''} class="app-button">
          Еще
        </button>
      </div>
    </div>
  `;
}

async function renderStudentResumeTab() {
  try {
    const response = await getMyResumes(studentResumeLimit, studentResumeOffset);

    if (!response.ok) {
      return placeholderBlock('Резюме студента', 'Не удалось загрузить резюме.');
    }

    const data = await response.json();
    const resumes = data.items || [];

    return `
      <div class="space-y-6">
        <div class="app-card">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 class="text-xl font-black text-slate-900">Мои резюме</h3>
              <p class="text-slate-600 mt-1">
                Создавайте разные резюме под разные вакансии. Город, направление и навыки выбираются из справочника.
              </p>
            </div>

            <button id="createResumeBtn" class="app-button app-button-purple">
              Создать резюме
            </button>
          </div>
        </div>

        ${
          resumes.length
            ? `<div class="space-y-4">${resumes.map(studentResumeCard).join('')}</div>`
            : `
              <div class="app-card">
                <h3 class="text-xl font-black text-slate-900">Резюме еще не создано</h3>
                <p class="text-slate-600 mt-2">
                  Нажмите “Создать резюме”, заполните форму, и оно появится красивой карточкой.
                </p>

                <button id="createResumeBtn" class="app-button app-button-purple mt-5">
                  Создать резюме
                </button>
              </div>
            `
        }

        ${renderResumePagination(data)}
      </div>
    `;
  } catch {
    return placeholderBlock('Резюме студента', 'Сервер недоступен.');
  }
}

function renderResumeFormScreen(resume = null) {
  const isEdit = Boolean(resume);

  dashboardContent.innerHTML = `
    <div class="space-y-5">
      <button id="backToMyResumesFromFormBtn" class="app-button">
        ← Назад к резюме
      </button>

      <div class="app-card">
        <div class="mb-6">
          <h3 class="text-xl font-black text-slate-900">
            ${isEdit ? 'Редактировать резюме' : 'Создать резюме'}
          </h3>

          <p class="text-sm text-slate-500 mt-1">
            Заполните резюме аккуратно. Эти данные видит работодатель.
          </p>
        </div>

        ${isEdit ? resumeRejectionBlock(resume) : ''}

        <form id="resumeForm" class="grid md:grid-cols-2 gap-4 mt-5">
          <div class="md:col-span-2">
            <label class="block text-sm font-bold text-slate-700 mb-1">Желаемая должность *</label>
            <input
              id="resumeTitle"
              type="text"
              required
              value="${isEdit ? inputValue(resume.title) : ''}"
              placeholder="Junior Python Developer"
              class="app-input"
            />
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Город *</label>
            ${renderCityInput('resumeCity', isEdit ? resume.city || 'Сочи' : 'Сочи')}
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Направление *</label>
            ${renderDirectionSelect('resumeDirection', isEdit ? resume.direction || '' : '')}
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-bold text-slate-700 mb-1">О себе</label>
            <textarea
              id="resumeAbout"
              rows="4"
              placeholder="Кратко расскажите о себе"
              class="app-textarea"
            >${isEdit && resume.about ? safe(resume.about) : ''}</textarea>
          </div>

          ${renderSkillsPicker('resume', isEdit ? resume.skills || '' : '')}

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Опыт / проекты</label>
            <textarea
              id="resumeExperience"
              rows="5"
              placeholder="Учебные проекты, пет-проекты, практика"
              class="app-textarea"
            >${isEdit && resume.experience ? safe(resume.experience) : ''}</textarea>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Образование</label>
            <textarea
              id="resumeEducation"
              rows="5"
              placeholder="IT TOP College, группа..."
              class="app-textarea"
            >${isEdit && resume.education ? safe(resume.education) : ''}</textarea>
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-bold text-slate-700 mb-1">Контакты</label>
            <textarea
              id="resumeContacts"
              rows="4"
              placeholder="Telegram, email, телефон"
              class="app-textarea"
            >${isEdit && resume.contacts ? safe(resume.contacts) : ''}</textarea>
          </div>

          <label class="md:col-span-2 flex items-center gap-3 rounded-3xl bg-slate-50 border border-slate-200 p-4">
            <input id="resumeIsPublic" type="checkbox" ${!isEdit || resume.is_public ? 'checked' : ''} class="w-5 h-5" />
            <span>
              <span class="font-bold">Публичное резюме</span>
              <span class="block text-sm text-slate-500">
                Работодатели смогут видеть это резюме, если ваш профиль подтвержден администратором.
              </span>
            </span>
          </label>

          <div class="md:col-span-2">
            <button type="submit" class="app-button app-button-purple w-full">
              ${isEdit ? 'Сохранить изменения' : 'Создать резюме'}
            </button>
          </div>
        </form>

        <div id="resumeResult" class="mt-4 text-sm whitespace-pre-wrap"></div>
      </div>
    </div>
  `;

  document.getElementById('backToMyResumesFromFormBtn').addEventListener('click', async () => {
    await renderStudentDashboard(currentUser, 'resume');
  });

  bindSkillsPicker('resume');
  bindStudentResumeForm(isEdit ? resume.id : null);
}

function bindStudentResumeActions() {
  const createBtn = document.getElementById('createResumeBtn');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      renderResumeFormScreen(null);
    });
  }

  document.querySelectorAll('[data-resume-pdf]').forEach((button) => {
    button.addEventListener('click', async () => {
      const resumeId = button.dataset.resumePdf;

      try {
        const response = await downloadMyResumePdf(resumeId);

        if (!response.ok) {
          showToast('Не удалось скачать PDF', 'error');
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
        showToast('Ошибка скачивания PDF', 'error');
      }
    });
  });

  const prevBtn = document.getElementById('resumePrevPageBtn');
  if (prevBtn) {
    prevBtn.addEventListener('click', async () => {
      studentResumeOffset = Math.max(0, studentResumeOffset - studentResumeLimit);
      await renderStudentDashboard(currentUser, 'resume');
    });
  }

  const nextBtn = document.getElementById('resumeNextPageBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', async () => {
      studentResumeOffset += studentResumeLimit;
      await renderStudentDashboard(currentUser, 'resume');
    });
  }

  document.querySelectorAll('[data-my-resume-view]').forEach((button) => {
    button.addEventListener('click', async () => {
      const resumeId = button.dataset.myResumeView;
      const response = await getMyResumeById(resumeId);

      if (!response.ok) {
        showToast('Не удалось открыть резюме', 'error');
        return;
      }

      const resume = await response.json();
      dashboardContent.innerHTML = studentResumeDetail(resume);

      document.getElementById('backToMyResumesBtn').addEventListener('click', async () => {
        await renderStudentDashboard(currentUser, 'resume');
      });

      bindStudentResumeActions();
    });
  });

  document.querySelectorAll('[data-my-resume-edit]').forEach((button) => {
    button.addEventListener('click', async () => {
      const resumeId = button.dataset.myResumeEdit;
      const response = await getMyResumeById(resumeId);

      if (!response.ok) {
        showToast('Не удалось загрузить резюме', 'error');
        return;
      }

      const resume = await response.json();
      renderResumeFormScreen(resume);
    });
  });

  document.querySelectorAll('[data-my-resume-archive]').forEach((button) => {
    button.addEventListener('click', async () => {
      const resumeId = button.dataset.myResumeArchive;

      const confirmed = await showConfirmModal({
        title: 'Перенести резюме в архив?',
        message: 'Резюме пропадет из публичного списка работодателей, но останется у вас.',
        confirmText: 'В архив',
      });

      if (!confirmed) return;

      const response = await archiveMyResume(resumeId);

      if (!response.ok) {
        showToast('Не удалось архивировать резюме', 'error');
        return;
      }

      showToast('Резюме перенесено в архив');
      await renderStudentDashboard(currentUser, 'resume');
    });
  });

  document.querySelectorAll('[data-my-resume-restore]').forEach((button) => {
    button.addEventListener('click', async () => {
      const resumeId = button.dataset.myResumeRestore;

      const confirmed = await showConfirmModal({
        title: 'Вернуть резюме из архива?',
        message: 'Резюме снова сможет быть публичным для работодателей.',
        confirmText: 'Вернуть',
      });

      if (!confirmed) return;

      const response = await restoreMyResume(resumeId);

      if (!response.ok) {
        showToast('Не удалось восстановить резюме', 'error');
        return;
      }

      showToast('Резюме восстановлено');
      await renderStudentDashboard(currentUser, 'resume');
    });
  });

  document.querySelectorAll('[data-my-resume-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      const resumeId = button.dataset.myResumeDelete;

      const confirmed = await showConfirmModal({
        title: 'Удалить резюме?',
        message: 'Резюме будет скрыто, но сохранится в истории системы. Это мягкое удаление.',
        confirmText: 'Удалить',
        danger: true,
      });

      if (!confirmed) return;

      const response = await deleteMyResume(resumeId);

      if (!response.ok) {
        showToast('Не удалось удалить резюме', 'error');
        return;
      }

      showToast('Резюме удалено');
      await renderStudentDashboard(currentUser, 'resume');
    });
  });
}

function bindStudentResumeForm(resumeId = null) {
  const form = document.getElementById('resumeForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const result = document.getElementById('resumeResult');
    result.className = 'mt-4 text-sm text-slate-600 whitespace-pre-wrap';
    result.textContent = resumeId ? 'Сохраняем изменения...' : 'Создаем резюме...';

    const payload = {
      title: document.getElementById('resumeTitle').value.trim(),
      about: document.getElementById('resumeAbout').value.trim() || null,
      city: document.getElementById('resumeCity').value.trim(),
      direction: document.getElementById('resumeDirection').value,
      skills: getSkillsPickerValue('resume'),
      experience: document.getElementById('resumeExperience').value.trim() || null,
      education: document.getElementById('resumeEducation').value.trim() || null,
      contacts: document.getElementById('resumeContacts').value.trim() || null,
      is_public: document.getElementById('resumeIsPublic').checked,
    };

    if (payload.title.length < 2) {
      showMessage(result, 'Желаемая должность должна содержать минимум 2 символа.', true);
      return;
    }

    if (!validateCatalogCity(payload.city)) {
      showMessage(result, 'Выберите город из списка.', true);
      return;
    }

    if (!validateCatalogDirection(payload.direction)) {
      showMessage(result, 'Выберите направление.', true);
      return;
    }

    if (!validateCatalogSkills(payload.skills)) {
      showMessage(result, 'Выберите хотя бы один навык из списка.', true);
      return;
    }

    try {
      const response = resumeId
        ? await updateMyResume(resumeId, payload)
        : await createMyResume(payload);

      const data = await response.json();

      if (!response.ok) {
        showMessage(
          result,
          getApiErrorMessage(data, 'Ошибка сохранения резюме.'),
          true
        );
        return;
      }

      showToast(resumeId ? 'Резюме обновлено' : 'Резюме создано');
      await renderStudentDashboard(currentUser, 'resume');
    } catch {
      showMessage(result, 'Сервер недоступен или возникла ошибка сети.', true);
    }
  });
}