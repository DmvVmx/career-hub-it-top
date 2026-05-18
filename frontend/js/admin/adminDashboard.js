
let adminLimit = 20;
let adminOffset = 0;

function adminStatusText(status) {
  const labels = {
    pending: 'На проверке',
    approved: 'Проверен',
    rejected: 'Отклонён',
    active: 'Активен',
    banned: 'Забанен',
    deleted: 'Удалён',
    published: 'Опубликовано',
    archived: 'Архив',
    sent: 'Новый отклик',
    viewed: 'Просмотрен',
    invited: 'Приглашён',
    accepted: 'Принят',
  };

  return labels[status] || status || '—';
}

function adminStatusBadge(status) {
  const classes = {
    approved: 'app-badge app-badge-success',
    active: 'app-badge app-badge-success',
    pending: 'app-badge app-badge-warning',
    rejected: 'app-badge app-badge-danger',
    banned: 'app-badge app-badge-danger',
    deleted: 'app-badge app-badge-danger',
    archived: 'app-badge',
    published: 'app-badge app-badge-success',
    invited: 'app-badge app-badge-success',
    accepted: 'app-badge app-badge-success',
    sent: 'app-badge app-badge-warning',
    viewed: 'app-badge',
  };

  return `
    <span class="${classes[status] || 'app-badge'}">
      ${adminStatusText(status)}
    </span>
  `;
}

function adminDateLabel(value) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

function adminWorkFormatLabel(value) {
  if (typeof catalogWorkFormatLabel === 'function') {
    return catalogWorkFormatLabel(value);
  }

  return workFormatLabel(value);
}

function adminEmploymentTypeLabel(value) {
  if (typeof catalogEmploymentTypeLabel === 'function') {
    return catalogEmploymentTypeLabel(value);
  }

  return employmentTypeLabel(value);
}

function adminDirectionText(value) {
  if (typeof directionLabel === 'function') {
    return directionLabel(value);
  }

  return value || 'Не указано';
}

function adminAvatar(src, fallback, colorClass = 'bg-blue-100 text-blue-700', size = 'normal') {
  const sizeClass = size === 'large'
    ? 'w-24 h-24 text-3xl rounded-3xl'
    : 'w-16 h-16 text-xl rounded-2xl';

  if (src) {
    return `
      <img
        src="${src}"
        class="${sizeClass} object-cover border border-slate-200 shadow-sm"
        alt="${inputValue(fallback || 'Аватар')}"
      />
    `;
  }

  return `
    <div class="${sizeClass} ${colorClass} flex items-center justify-center font-black shadow-sm">
      ${safe((fallback || '?')[0])}
    </div>
  `;
}

function adminStatCard(title, value, hint = '', tone = 'default') {
  const toneClass = {
    default: 'bg-white',
    blue: 'bg-blue-50 border-blue-100',
    purple: 'bg-purple-50 border-purple-100',
    green: 'bg-green-50 border-green-100',
    yellow: 'bg-yellow-50 border-yellow-100',
    red: 'bg-red-50 border-red-100',
  };

  return `
    <div class="rounded-3xl ${toneClass[tone] || toneClass.default} border border-slate-200 shadow-sm p-6">
      <div class="text-sm font-bold text-slate-500">${safe(title)}</div>
      <div class="mt-2 text-4xl font-black text-slate-900">${value ?? 0}</div>
      ${hint ? `<div class="mt-2 text-xs leading-5 text-slate-500">${safe(hint)}</div>` : ''}
    </div>
  `;
}

function adminEmpty(title, text) {
  return `
    <div class="app-card text-center py-12">
      <div class="mx-auto w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-2xl">
        —
      </div>
      <h3 class="mt-4 text-xl font-black text-slate-900">${safe(title)}</h3>
      <p class="mt-2 text-slate-600">${safe(text)}</p>
    </div>
  `;
}

function adminPagination(data, tab) {
  const hasPrev = data.offset > 0;
  const hasNext = data.offset + data.limit < data.total;

  return `
    <div class="app-card flex items-center justify-between gap-4 flex-wrap">
      <div class="text-sm text-slate-600">
        Показано ${data.items.length} из ${data.total}
      </div>

      <div class="flex gap-3">
        <button
          data-admin-page="prev"
          data-tab="${tab}"
          ${!hasPrev ? 'disabled' : ''}
          class="app-button"
        >
          Назад
        </button>

        <button
          data-admin-page="next"
          data-tab="${tab}"
          ${!hasNext ? 'disabled' : ''}
          class="app-button"
        >
          Ещё
        </button>
      </div>
    </div>
  `;
}

function adminActionButton(attrs, text, variant = 'default') {
  const classes = {
    default: 'app-button',
    primary: 'app-button app-button-primary',
    success: 'app-button app-button-primary',
    danger: 'app-button app-button-danger',
    blue: 'app-button app-button-blue',
    purple: 'app-button app-button-purple',
  };

  return `
    <button ${attrs} class="${classes[variant] || classes.default}">
      ${safe(text)}
    </button>
  `;
}

function adminInfoTile(title, value) {
  return `
    <div class="rounded-2xl bg-slate-50 border border-slate-200 p-4">
      <div class="text-xs font-bold text-slate-500">${safe(title)}</div>
      <div class="mt-1 font-black text-slate-900 break-words">${safe(value)}</div>
    </div>
  `;
}

function adminTextBlock(title, value) {
  return `
    <div class="app-card">
      <div class="text-sm font-bold text-slate-500">${safe(title)}</div>
      <div class="mt-2 whitespace-pre-wrap leading-7 text-slate-900">${safe(value || '—')}</div>
    </div>
  `;
}

function adminSkillsBlock(skills) {
  if (typeof renderSkillsBadges === 'function') {
    return renderSkillsBadges(skills);
  }

  if (!skills) return '—';

  return `
    <div class="flex flex-wrap gap-2">
      ${String(skills).split(',').map((skill) => skill.trim()).filter(Boolean).map((skill) => `
        <span class="app-tag">${safe(skill)}</span>
      `).join('')}
    </div>
  `;
}

async function renderAdminStatsTab() {
  const response = await getAdminStats();

  if (!response.ok) {
    return placeholderBlock('Статистика', 'Не удалось загрузить статистику.');
  }

  const stats = await response.json();

  return `
    <div class="space-y-6">
      <div class="grid md:grid-cols-3 gap-4">
        ${adminStatCard('Всего пользователей', stats.users_total, '', 'blue')}
        ${adminStatCard('Студентов', stats.students_total, `На проверке: ${stats.student_profiles_pending || 0}`, 'purple')}
        ${adminStatCard('Работодателей', stats.employers_total, `Компаний на проверке: ${stats.employer_profiles_pending || 0}`, 'green')}
        ${adminStatCard('Профилей компаний', stats.employer_profiles_total)}
        ${adminStatCard('Вакансий', stats.vacancies_total)}
        ${adminStatCard('Резюме', stats.resumes_total)}
        ${adminStatCard('Откликов', stats.applications_total, '', 'yellow')}
        ${adminStatCard('Чатов', stats.chats_total, '', 'blue')}
      </div>

      <div class="app-card">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-3xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
            i
          </div>

          <div>
            <div class="text-xl font-black text-slate-900">Главное для модерации</div>
            <p class="mt-2 text-slate-600 leading-7">
              Проверяйте работодателей, студентов, вакансии и резюме. Бан аккаунта полностью запрещает доступ,
              а проверка профиля управляет возможностями внутри платформы.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function adminEmployerCard(profile) {
  const isApproved = profile.status === 'approved';

  return `
    <article class="app-card hover:shadow-lg transition">
      <div class="flex items-start justify-between gap-5 flex-wrap">
        <div class="flex items-start gap-4 min-w-0">
          ${adminAvatar(profile.avatar_url, profile.company_name, 'bg-blue-100 text-blue-700')}

          <div class="min-w-0">
            <div class="flex gap-2 flex-wrap mb-3">
              ${adminStatusBadge(profile.status)}
              ${adminStatusBadge(profile.user_status)}
            </div>

            <h3 class="text-2xl font-black text-slate-900 break-words">
              ${safe(profile.company_name)}
            </h3>

            <p class="mt-1 text-slate-600">
              ${safe(profile.email || 'Email не указан')}
            </p>
          </div>
        </div>

        <div class="text-left md:text-right">
          <div class="text-xs text-slate-500 font-bold">ИНН</div>
          <div class="mt-1 font-black text-slate-900">${safe(profile.inn)}</div>
        </div>
      </div>

      <div class="mt-6 grid md:grid-cols-3 gap-3">
        ${adminInfoTile('Телефон', profile.phone || '—')}
        ${adminInfoTile('Создан', adminDateLabel(profile.created_at))}
        ${adminInfoTile('Обновлён', adminDateLabel(profile.updated_at))}
      </div>

      ${
        profile.rejection_reason
          ? `
            <div class="mt-5 rounded-3xl bg-red-50 border border-red-100 p-5">
              <div class="font-black text-red-800">Причина отклонения</div>
              <p class="mt-2 text-sm text-red-700 leading-6 whitespace-pre-wrap">
                ${safe(profile.rejection_reason)}
              </p>
            </div>
          `
          : ''
      }

      <div class="mt-6 flex gap-3 flex-wrap">
        ${adminActionButton(`data-admin-employer-open="${profile.id}"`, 'Открыть')}

        ${
          isApproved
            ? adminActionButton(`data-admin-employer-unapprove="${profile.id}"`, 'Снять проверку')
            : adminActionButton(`data-admin-employer-approve="${profile.id}"`, 'Проверен', 'primary')
        }

        ${adminActionButton(`data-admin-employer-reject="${profile.id}"`, 'Отклонить', 'danger')}

        ${
          profile.user_status === 'banned'
            ? adminActionButton(`data-admin-user-unban="${profile.user_id}" data-return-tab="employers"`, 'Разбанить', 'blue')
            : adminActionButton(`data-admin-user-ban="${profile.user_id}" data-return-tab="employers"`, 'Бан', 'danger')
        }
      </div>
    </article>
  `;
}

async function renderAdminEmployersTab() {
  const response = await getAdminEmployers(adminLimit, adminOffset);

  if (!response.ok) {
    return placeholderBlock('Работодатели', 'Не удалось загрузить работодателей.');
  }

  const data = await response.json();

  return `
    <div class="space-y-4">
      ${
        data.items.length
          ? data.items.map(adminEmployerCard).join('')
          : adminEmpty('Работодателей пока нет', 'Когда работодатели заполнят профиль, они появятся здесь.')
      }

      ${adminPagination(data, 'employers')}
    </div>
  `;
}

function adminStudentCard(student) {
  const isApproved = student.status === 'approved';

  return `
    <article class="app-card hover:shadow-lg transition">
      <div class="flex items-start justify-between gap-5 flex-wrap">
        <div class="flex items-start gap-4 min-w-0">
          ${adminAvatar(student.photo_url, student.full_name, 'bg-purple-100 text-purple-700')}

          <div class="min-w-0">
            <div class="flex gap-2 flex-wrap mb-3">
              ${adminStatusBadge(student.status)}
              ${adminStatusBadge(student.user_status)}
            </div>

            <h3 class="text-2xl font-black text-slate-900 break-words">
              ${safe(student.full_name)}
            </h3>

            <p class="mt-1 text-slate-600">
              ${safe(student.group_name || 'Группа не указана')}
            </p>
          </div>
        </div>

        <div class="text-left md:text-right">
          <div class="text-xs text-slate-500 font-bold">Email</div>
          <div class="mt-1 font-black text-slate-900 break-words">${safe(student.email || '—')}</div>
        </div>
      </div>

      <div class="mt-6 grid md:grid-cols-3 gap-3">
        ${adminInfoTile('Уровень', student.level || '—')}
        ${adminInfoTile('Дата рождения', student.birthday ? adminDateLabel(student.birthday) : '—')}
        ${adminInfoTile('Профиль', `#${student.id}`)}
      </div>

      ${
        student.rejection_reason
          ? `
            <div class="mt-5 rounded-3xl bg-red-50 border border-red-100 p-5">
              <div class="font-black text-red-800">Причина отклонения</div>
              <p class="mt-2 text-sm text-red-700 leading-6 whitespace-pre-wrap">
                ${safe(student.rejection_reason)}
              </p>
            </div>
          `
          : ''
      }

      <div class="mt-6 flex gap-3 flex-wrap">
        ${adminActionButton(`data-admin-student-open="${student.id}"`, 'Открыть')}

        ${
          isApproved
            ? adminActionButton(`data-admin-student-unapprove="${student.id}"`, 'Снять проверку')
            : adminActionButton(`data-admin-student-approve="${student.id}"`, 'Проверен', 'primary')
        }

        ${adminActionButton(`data-admin-student-reject="${student.id}"`, 'Отклонить', 'danger')}

        ${
          student.user_status === 'banned'
            ? adminActionButton(`data-admin-user-unban="${student.user_id}" data-return-tab="students"`, 'Разбанить', 'blue')
            : adminActionButton(`data-admin-user-ban="${student.user_id}" data-return-tab="students"`, 'Бан', 'danger')
        }
      </div>
    </article>
  `;
}

async function renderAdminStudentsTab() {
  const response = await getAdminStudents(adminLimit, adminOffset);

  if (!response.ok) {
    return placeholderBlock('Студенты', 'Не удалось загрузить студентов.');
  }

  const data = await response.json();

  return `
    <div class="space-y-4">
      ${
        data.items.length
          ? data.items.map(adminStudentCard).join('')
          : adminEmpty('Студентов пока нет', 'Когда студенты войдут через журнал, они появятся здесь.')
      }

      ${adminPagination(data, 'students')}
    </div>
  `;
}

function adminVacancyCard(vacancy) {
  return `
    <article class="app-card hover:shadow-lg transition">
      <div class="flex items-start justify-between gap-5 flex-wrap">
        <div class="min-w-0">
          <div class="flex gap-2 flex-wrap mb-3">
            ${adminStatusBadge(vacancy.status)}
            <span class="app-tag">${adminDateLabel(vacancy.created_at)}</span>
          </div>

          <h3 class="text-2xl font-black text-slate-900 break-words">
            ${safe(vacancy.title)}
          </h3>

          <p class="mt-1 text-slate-600">
            ${safe(vacancy.company_name || 'Компания не указана')}
          </p>
        </div>
      </div>

      <div class="mt-6 grid md:grid-cols-4 gap-3">
        ${adminInfoTile('Город', vacancy.city || '—')}
        ${adminInfoTile('Формат', adminWorkFormatLabel(vacancy.work_format))}
        ${adminInfoTile('Занятость', adminEmploymentTypeLabel(vacancy.employment_type))}
        ${adminInfoTile('Дата', adminDateLabel(vacancy.created_at))}
      </div>

      <p class="mt-5 text-slate-700 leading-7">
        ${shortText(vacancy.description || vacancy.requirements || 'Описание не указано', 260)}
      </p>

      ${
        vacancy.rejection_reason
          ? `
            <div class="mt-5 rounded-3xl bg-red-50 border border-red-100 p-5">
              <div class="font-black text-red-800">Причина отклонения</div>
              <p class="mt-2 text-sm text-red-700 leading-6 whitespace-pre-wrap">
                ${safe(vacancy.rejection_reason)}
              </p>
            </div>
          `
          : ''
      }

      <div class="mt-6 flex gap-3 flex-wrap">
        ${adminActionButton(`data-admin-vacancy-open="${vacancy.id}"`, 'Открыть')}
        ${adminActionButton(`data-admin-vacancy-reject="${vacancy.id}"`, 'Отклонить', 'danger')}

        ${
          vacancy.status === 'archived'
            ? adminActionButton(`data-admin-vacancy-restore="${vacancy.id}"`, 'Восстановить', 'primary')
            : adminActionButton(`data-admin-vacancy-archive="${vacancy.id}"`, 'В архив')
        }

        ${
          vacancy.status !== 'deleted'
            ? adminActionButton(`data-admin-vacancy-delete="${vacancy.id}"`, 'Удалить', 'danger')
            : ''
        }
      </div>
    </article>
  `;
}

async function renderAdminVacanciesTab() {
  const response = await getAdminVacancies(adminLimit, adminOffset);

  if (!response.ok) {
    return placeholderBlock('Вакансии', 'Не удалось загрузить вакансии.');
  }

  const data = await response.json();

  return `
    <div class="space-y-4">
      ${
        data.items.length
          ? data.items.map(adminVacancyCard).join('')
          : adminEmpty('Вакансий пока нет', 'Когда работодатели создадут вакансии, они появятся здесь.')
      }

      ${adminPagination(data, 'vacancies')}
    </div>
  `;
}

function adminResumeCard(resume) {
  return `
    <article class="app-card hover:shadow-lg transition">
      <div class="flex items-start justify-between gap-5 flex-wrap">
        <div class="min-w-0">
          <div class="flex gap-2 flex-wrap mb-3">
            ${adminStatusBadge(resume.status)}
            ${
              resume.is_public
                ? '<span class="app-badge app-badge-success">Публичное</span>'
                : '<span class="app-badge">Скрытое</span>'
            }
            <span class="app-tag">${adminDateLabel(resume.created_at)}</span>
          </div>

          <h3 class="text-2xl font-black text-slate-900 break-words">
            ${safe(resume.title)}
          </h3>

          <p class="mt-1 text-slate-600">
            ${safe(resume.student_name || 'Студент не указан')} · ${safe(resume.group_name || '—')}
          </p>
        </div>
      </div>

      <div class="mt-6 grid md:grid-cols-3 gap-3">
        ${adminInfoTile('Навыки', shortText(resume.skills || '—', 90))}
        ${adminInfoTile('Создано', adminDateLabel(resume.created_at))}
        ${adminInfoTile('Обновлено', adminDateLabel(resume.updated_at))}
      </div>

      <p class="mt-5 text-slate-700 leading-7">
        ${shortText(resume.about || resume.experience || resume.skills || 'Описание не указано', 260)}
      </p>

      ${
        resume.rejection_reason
          ? `
            <div class="mt-5 rounded-3xl bg-red-50 border border-red-100 p-5">
              <div class="font-black text-red-800">Причина отклонения</div>
              <p class="mt-2 text-sm text-red-700 leading-6 whitespace-pre-wrap">
                ${safe(resume.rejection_reason)}
              </p>
            </div>
          `
          : ''
      }

      <div class="mt-6 flex gap-3 flex-wrap">
        ${adminActionButton(`data-admin-resume-open="${resume.id}"`, 'Открыть')}
        ${adminActionButton(`data-admin-resume-reject="${resume.id}"`, 'Отклонить', 'danger')}

        ${
          resume.status === 'archived'
            ? adminActionButton(`data-admin-resume-restore="${resume.id}"`, 'Восстановить', 'primary')
            : adminActionButton(`data-admin-resume-archive="${resume.id}"`, 'В архив')
        }

        ${
          resume.status !== 'deleted'
            ? adminActionButton(`data-admin-resume-delete="${resume.id}"`, 'Удалить', 'danger')
            : ''
        }
      </div>
    </article>
  `;
}

async function renderAdminResumesTab() {
  const response = await getAdminResumes(adminLimit, adminOffset);

  if (!response.ok) {
    return placeholderBlock('Резюме', 'Не удалось загрузить резюме.');
  }

  const data = await response.json();

  return `
    <div class="space-y-4">
      ${
        data.items.length
          ? data.items.map(adminResumeCard).join('')
          : adminEmpty('Резюме пока нет', 'Когда студенты создадут резюме, они появятся здесь.')
      }

      ${adminPagination(data, 'resumes')}
    </div>
  `;
}

function adminApplicationCard(application) {
  return `
    <article class="app-card hover:shadow-lg transition">
      <div class="flex items-start justify-between gap-5 flex-wrap">
        <div class="min-w-0">
          <div class="flex gap-2 flex-wrap mb-3">
            ${adminStatusBadge(application.status)}
            <span class="app-tag">${adminDateLabel(application.created_at)}</span>
          </div>

          <h3 class="text-2xl font-black text-slate-900 break-words">
            ${safe(application.vacancy_title || 'Вакансия не указана')}
          </h3>

          <p class="mt-1 text-slate-600">
            ${safe(application.student_name || 'Студент')} → ${safe(application.company_name || 'Компания')}
          </p>
        </div>
      </div>

      <div class="mt-6 grid md:grid-cols-3 gap-3">
        ${adminInfoTile('Резюме', application.resume_title || '—')}
        ${adminInfoTile('Создан', adminDateLabel(application.created_at))}
        ${adminInfoTile('Отклик', `#${application.id}`)}
      </div>

      ${
        application.message
          ? `
            <div class="mt-5 rounded-3xl bg-slate-50 border border-slate-200 p-5">
              <div class="text-sm font-bold text-slate-500">Сообщение студента</div>
              <div class="mt-2 whitespace-pre-wrap leading-7 text-slate-900">
                ${safe(application.message)}
              </div>
            </div>
          `
          : `
            <div class="mt-5 rounded-3xl bg-slate-50 border border-slate-200 p-5">
              <div class="text-sm text-slate-500">Сообщение не указано.</div>
            </div>
          `
      }
    </article>
  `;
}

async function renderAdminApplicationsTab() {
  const response = await getAdminApplications(adminLimit, adminOffset);

  if (!response.ok) {
    return placeholderBlock('Отклики', 'Не удалось загрузить отклики.');
  }

  const data = await response.json();

  return `
    <div class="space-y-4">
      ${
        data.items.length
          ? data.items.map(adminApplicationCard).join('')
          : adminEmpty('Откликов пока нет', 'Когда студенты и работодатели начнут взаимодействовать, отклики появятся здесь.')
      }

      ${adminPagination(data, 'applications')}
    </div>
  `;
}

async function renderAdminDetailScreen(title, blocks, backTab) {
  dashboardContent.innerHTML = `
    <div class="space-y-6">
      <button id="backToAdminTabBtn" class="app-button">
        ← Назад
      </button>

      <div class="app-dashboard-header">
        <h2 class="app-title">${safe(title)}</h2>
        <p class="app-subtitle">Детальный просмотр объекта админ-панели.</p>
      </div>

      ${blocks}
    </div>
  `;

  document.getElementById('backToAdminTabBtn').addEventListener('click', async () => {
    await renderAdminDashboard(currentUser, backTab);
  });
}

async function openAdminEmployer(profileId) {
  const profileResponse = await apiFetch(`/admin/employers/${profileId}`);
  const vacanciesResponse = await apiFetch(`/admin/employers/${profileId}/vacancies?limit=100&offset=0`);

  if (!profileResponse.ok) {
    showToast('Не удалось открыть работодателя', 'error');
    return;
  }

  const profile = await profileResponse.json();
  const vacanciesData = vacanciesResponse.ok ? await vacanciesResponse.json() : { items: [] };

  await renderAdminDetailScreen(
    safe(profile.company_name),
    `
      <div class="app-card">
        <div class="flex items-start gap-5 flex-wrap">
          ${adminAvatar(profile.avatar_url, profile.company_name, 'bg-blue-100 text-blue-700', 'large')}

          <div class="min-w-0 flex-1">
            <div class="flex gap-2 flex-wrap">
              ${adminStatusBadge(profile.status)}
              ${adminStatusBadge(profile.user_status)}
            </div>

            <h3 class="mt-3 text-3xl font-black text-slate-900 break-words">
              ${safe(profile.company_name)}
            </h3>

            <p class="mt-2 text-slate-600">${safe(profile.email || 'Email не указан')}</p>
          </div>
        </div>

        <div class="mt-6 grid md:grid-cols-4 gap-3">
          ${adminInfoTile('ИНН', profile.inn)}
          ${adminInfoTile('Телефон', profile.phone)}
          ${adminInfoTile('Email', profile.email)}
          ${adminInfoTile('Статус', adminStatusText(profile.status))}
        </div>
      </div>

      ${adminTextBlock('Описание компании', profile.description)}
      ${profile.rejection_reason ? adminTextBlock('Причина отклонения', profile.rejection_reason) : ''}

      <div class="space-y-4">
        <h3 class="text-xl font-black text-slate-900">Вакансии работодателя</h3>
        ${vacanciesData.items.length ? vacanciesData.items.map(adminVacancyCard).join('') : adminEmpty('Вакансий нет', 'Работодатель пока не создал вакансии.')}
      </div>
    `,
    'employers'
  );

  bindAdminActions();
}

async function openAdminStudent(profileId) {
  const profileResponse = await apiFetch(`/admin/students/${profileId}`);
  const resumesResponse = await apiFetch(`/admin/students/${profileId}/resumes?limit=100&offset=0`);

  if (!profileResponse.ok) {
    showToast('Не удалось открыть студента', 'error');
    return;
  }

  const profile = await profileResponse.json();
  const resumesData = resumesResponse.ok ? await resumesResponse.json() : { items: [] };

  await renderAdminDetailScreen(
    safe(profile.full_name),
    `
      <div class="app-card">
        <div class="flex items-start gap-5 flex-wrap">
          ${adminAvatar(profile.photo_url, profile.full_name, 'bg-purple-100 text-purple-700', 'large')}

          <div class="min-w-0 flex-1">
            <div class="flex gap-2 flex-wrap">
              ${adminStatusBadge(profile.status)}
              ${adminStatusBadge(profile.user_status)}
            </div>

            <h3 class="mt-3 text-3xl font-black text-slate-900 break-words">
              ${safe(profile.full_name)}
            </h3>

            <p class="mt-2 text-slate-600">${safe(profile.group_name || 'Группа не указана')}</p>
          </div>
        </div>

        <div class="mt-6 grid md:grid-cols-4 gap-3">
          ${adminInfoTile('Группа', profile.group_name)}
          ${adminInfoTile('Email', profile.email)}
          ${adminInfoTile('Уровень', profile.level)}
          ${adminInfoTile('Статус', adminStatusText(profile.status))}
        </div>
      </div>

      ${profile.rejection_reason ? adminTextBlock('Причина отклонения', profile.rejection_reason) : ''}

      <div class="space-y-4">
        <h3 class="text-xl font-black text-slate-900">Резюме студента</h3>
        ${resumesData.items.length ? resumesData.items.map(adminResumeCard).join('') : adminEmpty('Резюме нет', 'Студент пока не создал резюме.')}
      </div>
    `,
    'students'
  );

  bindAdminActions();
}

async function openAdminVacancy(vacancyId) {
  const response = await apiFetch(`/admin/vacancies/${vacancyId}`);

  if (!response.ok) {
    showToast('Не удалось открыть вакансию', 'error');
    return;
  }

  const vacancy = await response.json();

  await renderAdminDetailScreen(
    safe(vacancy.title),
    `
      <div class="app-card">
        <div class="flex gap-2 flex-wrap mb-4">
          ${adminStatusBadge(vacancy.status)}
          <span class="app-tag">${adminDateLabel(vacancy.created_at)}</span>
        </div>

        <h3 class="text-3xl font-black text-slate-900 break-words">
          ${safe(vacancy.title)}
        </h3>

        <p class="mt-2 text-slate-600">${safe(vacancy.company_name || 'Компания не указана')}</p>

        <div class="mt-6 grid md:grid-cols-3 gap-3">
          ${adminInfoTile('Компания', vacancy.company_name)}
          ${adminInfoTile('Город', vacancy.city)}
          ${adminInfoTile('Формат', adminWorkFormatLabel(vacancy.work_format))}
          ${adminInfoTile('Занятость', adminEmploymentTypeLabel(vacancy.employment_type))}
          ${adminInfoTile('Зарплата от', vacancy.salary_from)}
          ${adminInfoTile('Зарплата до', vacancy.salary_to)}
        </div>
      </div>

      ${adminTextBlock('Описание', vacancy.description)}
      ${adminTextBlock('Требования', vacancy.requirements)}
      ${vacancy.rejection_reason ? adminTextBlock('Причина отклонения', vacancy.rejection_reason) : ''}
    `,
    'vacancies'
  );
}

async function openAdminResume(resumeId) {
  const response = await apiFetch(`/admin/resumes/${resumeId}`);

  if (!response.ok) {
    showToast('Не удалось открыть резюме', 'error');
    return;
  }

  const resume = await response.json();

  await renderAdminDetailScreen(
    safe(resume.title),
    `
      <div class="app-card">
        <div class="flex gap-2 flex-wrap mb-4">
          ${adminStatusBadge(resume.status)}
          ${
            resume.is_public
              ? '<span class="app-badge app-badge-success">Публичное</span>'
              : '<span class="app-badge">Скрытое</span>'
          }
          <span class="app-tag">${adminDateLabel(resume.created_at)}</span>
        </div>

        <h3 class="text-3xl font-black text-slate-900 break-words">
          ${safe(resume.title)}
        </h3>

        <p class="mt-2 text-slate-600">
          ${safe(resume.student_name || 'Студент не указан')} · ${safe(resume.group_name || '—')}
        </p>

        <div class="mt-6 grid md:grid-cols-4 gap-3">
          ${adminInfoTile('Студент', resume.student_name)}
          ${adminInfoTile('Группа', resume.group_name)}
          ${adminInfoTile('Публичное', resume.is_public ? 'Да' : 'Нет')}
          ${adminInfoTile('Статус', adminStatusText(resume.status))}
        </div>
      </div>

      <div class="app-card">
        <div class="text-sm font-bold text-slate-500 mb-3">Навыки</div>
        ${adminSkillsBlock(resume.skills)}
      </div>

      ${adminTextBlock('О себе', resume.about)}
      ${adminTextBlock('Опыт / проекты', resume.experience)}
      ${adminTextBlock('Образование', resume.education)}
      ${adminTextBlock('Контакты', resume.contacts)}
      ${resume.rejection_reason ? adminTextBlock('Причина отклонения', resume.rejection_reason) : ''}
    `,
    'resumes'
  );
}

async function renderAdminDashboard(user, activeTab = 'stats') {
  adminOffset = adminOffset || 0;

  const tabs = [
    { id: 'stats', label: 'Обзор' },
    { id: 'employers', label: 'Работодатели' },
    { id: 'students', label: 'Студенты' },
    { id: 'vacancies', label: 'Вакансии' },
    { id: 'resumes', label: 'Резюме' },
    { id: 'applications', label: 'Отклики' },
  ];

  let content = '';

  if (activeTab === 'stats') content = await renderAdminStatsTab();
  if (activeTab === 'employers') content = await renderAdminEmployersTab();
  if (activeTab === 'students') content = await renderAdminStudentsTab();
  if (activeTab === 'vacancies') content = await renderAdminVacanciesTab();
  if (activeTab === 'resumes') content = await renderAdminResumesTab();
  if (activeTab === 'applications') content = await renderAdminApplicationsTab();

  dashboardContent.innerHTML = `
    <div class="app-layout">
      <aside class="app-sidebar">
        <div class="mb-5 px-2">
          <div class="font-black text-slate-900">Администратор</div>
          <div class="text-sm text-slate-500">${safe(user.username)}</div>
        </div>

        ${createTabs(tabs, activeTab)}
      </aside>

      <main class="app-main">
        <div class="app-dashboard-header">
          <div class="app-dashboard-header-row">
            <div>
              <h2 class="app-title">Админ-панель</h2>
              <p class="app-subtitle">
                Проверка пользователей, модерация вакансий, резюме и откликов.
              </p>
            </div>
          </div>
        </div>

        ${content}
      </main>
    </div>
  `;

  bindDashboardTabs('admin');
  bindAdminActions();
}

async function askRejectReason(title) {
  if (typeof showPromptModal === 'function') {
    const reason = await showPromptModal({
      title: title || 'Укажите причину отклонения',
      message: 'Эта причина будет показана пользователю.',
      label: 'Причина',
      placeholder: 'Например: не хватает данных, некорректное описание...',
      confirmText: 'Отклонить',
      danger: true,
      required: true,
      maxLength: 1000,
    });

    if (!reason || reason.trim().length < 3) {
      showToast('Причина должна содержать минимум 3 символа', 'error');
      return null;
    }

    return reason.trim();
  }

  const reason = prompt(title || 'Укажите причину отклонения');

  if (!reason || reason.trim().length < 3) {
    showToast('Причина должна содержать минимум 3 символа', 'error');
    return null;
  }

  return reason.trim();
}

function getReturnTab(button, fallback) {
  return button.dataset.returnTab || fallback;
}

function bindAdminActions() {
  document.querySelectorAll('[data-admin-page]').forEach((button) => {
    button.addEventListener('click', async () => {
      const tab = button.dataset.tab;
      const direction = button.dataset.adminPage;

      if (direction === 'prev') {
        adminOffset = Math.max(0, adminOffset - adminLimit);
      } else {
        adminOffset += adminLimit;
      }

      await renderAdminDashboard(currentUser, tab);
    });
  });

  document.querySelectorAll('[data-admin-employer-open]').forEach((button) => {
    button.addEventListener('click', async () => {
      await openAdminEmployer(button.dataset.adminEmployerOpen);
    });
  });

  document.querySelectorAll('[data-admin-student-open]').forEach((button) => {
    button.addEventListener('click', async () => {
      await openAdminStudent(button.dataset.adminStudentOpen);
    });
  });

  document.querySelectorAll('[data-admin-vacancy-open]').forEach((button) => {
    button.addEventListener('click', async () => {
      await openAdminVacancy(button.dataset.adminVacancyOpen);
    });
  });

  document.querySelectorAll('[data-admin-resume-open]').forEach((button) => {
    button.addEventListener('click', async () => {
      await openAdminResume(button.dataset.adminResumeOpen);
    });
  });

  document.querySelectorAll('[data-admin-employer-approve]').forEach((button) => {
    button.addEventListener('click', async () => {
      const response = await approveAdminEmployer(button.dataset.adminEmployerApprove);
      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || 'Не удалось подтвердить работодателя', 'error');
        return;
      }

      showToast('Работодатель подтверждён');
      await renderAdminDashboard(currentUser, 'employers');
    });
  });

  document.querySelectorAll('[data-admin-employer-unapprove]').forEach((button) => {
    button.addEventListener('click', async () => {
      const response = await unapproveAdminEmployer(button.dataset.adminEmployerUnapprove);
      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || 'Не удалось снять подтверждение', 'error');
        return;
      }

      showToast('Работодатель отправлен на проверку');
      await renderAdminDashboard(currentUser, 'employers');
    });
  });

  document.querySelectorAll('[data-admin-employer-reject]').forEach((button) => {
    button.addEventListener('click', async () => {
      const reason = await askRejectReason('Почему отклоняем работодателя?');
      if (!reason) return;

      const response = await rejectAdminEmployer(button.dataset.adminEmployerReject, reason);
      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || 'Не удалось отклонить работодателя', 'error');
        return;
      }

      showToast('Работодатель отклонён');
      await renderAdminDashboard(currentUser, 'employers');
    });
  });

  document.querySelectorAll('[data-admin-student-approve]').forEach((button) => {
    button.addEventListener('click', async () => {
      const response = await approveAdminStudent(button.dataset.adminStudentApprove);
      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || 'Не удалось подтвердить студента', 'error');
        return;
      }

      showToast('Студент подтверждён');
      await renderAdminDashboard(currentUser, 'students');
    });
  });

  document.querySelectorAll('[data-admin-student-unapprove]').forEach((button) => {
    button.addEventListener('click', async () => {
      const response = await unapproveAdminStudent(button.dataset.adminStudentUnapprove);
      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || 'Не удалось снять подтверждение', 'error');
        return;
      }

      showToast('Студент отправлен на проверку');
      await renderAdminDashboard(currentUser, 'students');
    });
  });

  document.querySelectorAll('[data-admin-student-reject]').forEach((button) => {
    button.addEventListener('click', async () => {
      const reason = await askRejectReason('Почему отклоняем студента?');
      if (!reason) return;

      const response = await rejectAdminStudent(button.dataset.adminStudentReject, reason);
      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || 'Не удалось отклонить студента', 'error');
        return;
      }

      showToast('Студент отклонён');
      await renderAdminDashboard(currentUser, 'students');
    });
  });

  document.querySelectorAll('[data-admin-user-ban]').forEach((button) => {
    button.addEventListener('click', async () => {
      const userId = button.dataset.adminUserBan;
      const returnTab = getReturnTab(button, 'employers');

      const confirmed = await showConfirmModal({
        title: 'Заблокировать аккаунт?',
        message: 'Пользователь не сможет войти и пользоваться платформой.',
        confirmText: 'Заблокировать',
        danger: true,
      });

      if (!confirmed) return;

      const response = await adminBanUser(userId);
      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || 'Не удалось заблокировать аккаунт', 'error');
        return;
      }

      showToast('Аккаунт заблокирован');
      await renderAdminDashboard(currentUser, returnTab);
    });
  });

  document.querySelectorAll('[data-admin-user-unban]').forEach((button) => {
    button.addEventListener('click', async () => {
      const userId = button.dataset.adminUserUnban;
      const returnTab = getReturnTab(button, 'employers');

      const response = await adminUnbanUser(userId);
      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || 'Не удалось разблокировать аккаунт', 'error');
        return;
      }

      showToast('Аккаунт разблокирован');
      await renderAdminDashboard(currentUser, returnTab);
    });
  });

  document.querySelectorAll('[data-admin-vacancy-reject]').forEach((button) => {
    button.addEventListener('click', async () => {
      const reason = await askRejectReason('Почему отклоняем вакансию?');
      if (!reason) return;

      const response = await apiFetch(`/admin/vacancies/${button.dataset.adminVacancyReject}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || 'Не удалось отклонить вакансию', 'error');
        return;
      }

      showToast('Вакансия отклонена');
      await renderAdminDashboard(currentUser, 'vacancies');
    });
  });

  document.querySelectorAll('[data-admin-resume-reject]').forEach((button) => {
    button.addEventListener('click', async () => {
      const reason = await askRejectReason('Почему отклоняем резюме?');
      if (!reason) return;

      const response = await apiFetch(`/admin/resumes/${button.dataset.adminResumeReject}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || 'Не удалось отклонить резюме', 'error');
        return;
      }

      showToast('Резюме отклонено');
      await renderAdminDashboard(currentUser, 'resumes');
    });
  });

  document.querySelectorAll('[data-admin-resume-archive]').forEach((button) => {
    button.addEventListener('click', async () => {
      const response = await adminArchiveResume(button.dataset.adminResumeArchive);
      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || 'Не удалось архивировать резюме', 'error');
        return;
      }

      showToast('Резюме отправлено в архив');
      await renderAdminDashboard(currentUser, 'resumes');
    });
  });

  document.querySelectorAll('[data-admin-resume-restore]').forEach((button) => {
    button.addEventListener('click', async () => {
      const response = await adminRestoreResume(button.dataset.adminResumeRestore);
      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || 'Не удалось восстановить резюме', 'error');
        return;
      }

      showToast('Резюме восстановлено');
      await renderAdminDashboard(currentUser, 'resumes');
    });
  });

  document.querySelectorAll('[data-admin-resume-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      const confirmed = await showConfirmModal({
        title: 'Удалить резюме?',
        message: 'Резюме будет мягко удалено и скрыто из публичных списков.',
        confirmText: 'Удалить',
        danger: true,
      });

      if (!confirmed) return;

      const response = await adminDeleteResume(button.dataset.adminResumeDelete);
      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || 'Не удалось удалить резюме', 'error');
        return;
      }

      showToast('Резюме удалено');
      await renderAdminDashboard(currentUser, 'resumes');
    });
  });

  document.querySelectorAll('[data-admin-vacancy-archive]').forEach((button) => {
    button.addEventListener('click', async () => {
      const response = await adminArchiveVacancy(button.dataset.adminVacancyArchive);
      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || 'Не удалось архивировать вакансию', 'error');
        return;
      }

      showToast('Вакансия отправлена в архив');
      await renderAdminDashboard(currentUser, 'vacancies');
    });
  });

  document.querySelectorAll('[data-admin-vacancy-restore]').forEach((button) => {
    button.addEventListener('click', async () => {
      const response = await adminRestoreVacancy(button.dataset.adminVacancyRestore);
      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || 'Не удалось восстановить вакансию', 'error');
        return;
      }

      showToast('Вакансия восстановлена');
      await renderAdminDashboard(currentUser, 'vacancies');
    });
  });

  document.querySelectorAll('[data-admin-vacancy-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      const confirmed = await showConfirmModal({
        title: 'Удалить вакансию?',
        message: 'Вакансия будет мягко удалена и скрыта из публичных списков.',
        confirmText: 'Удалить',
        danger: true,
      });

      if (!confirmed) return;

      const response = await adminDeleteVacancy(button.dataset.adminVacancyDelete);
      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || 'Не удалось удалить вакансию', 'error');
        return;
      }

      showToast('Вакансия удалена');
      await renderAdminDashboard(currentUser, 'vacancies');
    });
  });
}
