function escapeHtml(value) {
  if (value === null || value === undefined) return '';

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safe(value) {
  if (value === null || value === undefined) return '—';

  const text = String(value).trim();

  if (!text) return '—';

  return escapeHtml(text);
}

function inputValue(value) {
  if (value === null || value === undefined) return '';

  return escapeHtml(String(value));
}

function textToHtml(value) {
  if (value === null || value === undefined) return '—';

  const text = String(value).trim();

  if (!text) return '—';

  return escapeHtml(text).replaceAll('\n', '<br>');
}

function statusLabel(status) {
  const labels = {
    pending: 'На проверке',
    approved: 'Проверен',
    rejected: 'Отклонен',
    published: 'Опубликована',
    archived: 'В архиве',
    deleted: 'Удалена',
    unknown: 'Неизвестно',
    active: 'Активен',
    banned: 'Заблокирован',
    sent: 'Отклик отправлен',
    viewed: 'Просмотрено',
    invited: 'Приглашение',
    accepted: 'Принято',
    declined: 'Отклонено',
  };

  return labels[status] || status || '—';
}

function statusBadge(status) {
  const styles = {
    pending: 'app-badge app-badge-warning',
    approved: 'app-badge app-badge-success',
    rejected: 'app-badge app-badge-danger',
    published: 'app-badge app-badge-success',
    archived: 'app-badge',
    deleted: 'app-badge app-badge-danger',
    active: 'app-badge app-badge-success',
    banned: 'app-badge app-badge-danger',
    sent: 'app-badge app-badge-warning',
    viewed: 'app-badge',
    invited: 'app-badge app-badge-success',
    accepted: 'app-badge app-badge-success',
    declined: 'app-badge app-badge-danger',
  };

  return `
    <span class="${styles[status] || 'app-badge'}">
      ${safe(statusLabel(status))}
    </span>
  `;
}

function card(title, value) {
  return `
    <div class="app-card-soft">
      <div class="text-sm text-slate-500">${safe(title)}</div>
      <div class="mt-1 font-semibold break-words">${safe(value)}</div>
    </div>
  `;
}

function placeholderBlock(title, text, buttonText = null) {
  return `
    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <h3 class="text-xl font-black">${safe(title)}</h3>
      <p class="text-slate-600 mt-2">${safe(text)}</p>
      ${
        buttonText
          ? `<button class="mt-5 rounded-2xl bg-slate-900 text-white px-5 py-3 font-bold opacity-60 cursor-not-allowed">${safe(buttonText)}</button>`
          : ''
      }
    </div>
  `;
}

function createTabs(tabs, activeTab) {
  return `
    <nav class="app-nav">
      ${tabs.map((tab) => `
        <button
          data-tab="${tab.id}"
          class="dashboard-tab app-nav-button ${tab.id === activeTab ? 'active' : ''}"
        >
          ${safe(tab.label)}
        </button>
      `).join('')}
    </nav>
  `;
}

function formatSalary(vacancy) {
  if (vacancy.salary_from && vacancy.salary_to) {
    return `${Number(vacancy.salary_from).toLocaleString('ru-RU')} - ${Number(vacancy.salary_to).toLocaleString('ru-RU')} ₽`;
  }

  if (vacancy.salary_from) return `от ${Number(vacancy.salary_from).toLocaleString('ru-RU')} ₽`;
  if (vacancy.salary_to) return `до ${Number(vacancy.salary_to).toLocaleString('ru-RU')} ₽`;

  return 'Зарплата не указана';
}

function workFormatLabel(value) {
  const labels = {
    office: 'Офис',
    remote: 'Удаленно',
    hybrid: 'Гибрид',
  };

  return labels[value] || value || 'Не указано';
}

function employmentTypeLabel(value) {
  const labels = {
    internship: 'Стажировка',
    part_time: 'Частичная занятость',
    full_time: 'Полная занятость',
    project: 'Проектная работа',
    volunteer: 'Волонтёрство',
  };

  return labels[value] || value || 'Не указано';
}

function shortText(text, maxLength = 120) {
  if (!text) return '—';

  const normalized = String(text).replace(/\s+/g, ' ').trim();

  if (!normalized) return '—';
  if (normalized.length <= maxLength) return safe(normalized);

  return `${safe(normalized.slice(0, maxLength).trim())}...`;
}

function formatDateTime(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatHumanDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

function formatHumanDateWithYear(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getApiErrorMessage(data, fallback = 'Произошла ошибка') {
  if (!data) return fallback;

  const fieldNames = {
    email: 'Email',
    password: 'Пароль',
    new_password: 'Новый пароль',
    login: 'Логин',
    username: 'Логин',
    code: 'Код',
    title: 'Название',
    description: 'Описание',
    requirements: 'Требования',
    city: 'Город',
    direction: 'Направление',
    skills: 'Навыки',
    work_format: 'Формат работы',
    employment_type: 'Тип занятости',
    salary_from: 'Зарплата от',
    salary_to: 'Зарплата до',
    phone: 'Телефон',
    inn: 'ИНН',
    company_name: 'Название компании',
    message: 'Сообщение',
    resume_id: 'Резюме',
    vacancy_id: 'Вакансия',
  };

  function translate(msg) {
    return String(msg || fallback)
      .replace('Field required', 'обязательно для заполнения')
      .replace('String should have at least 1 character', 'обязательно для заполнения')
      .replace('String should have at least 2 characters', 'должно содержать минимум 2 символа')
      .replace('String should have at least 6 characters', 'должно содержать минимум 6 символов')
      .replace('String should have at least 8 characters', 'должно содержать минимум 8 символов')
      .replace('String should have at least 10 characters', 'должно содержать минимум 10 символов')
      .replace('String should have at most 6 characters', 'должно содержать максимум 6 символов')
      .replace('Input should be a valid integer', 'должно быть числом')
      .replace('Input should be a valid string', 'должно быть строкой')
      .replace('Input should be greater than or equal to 0', 'не может быть меньше 0')
      .replace('Value error, ', '')
      .replace('value is not a valid email address: An email address must have an @-sign.', 'Введите корректный email')
      .replace('Input should be a valid email address', 'Введите корректный email');
  }

  if (typeof data.detail === 'string') return data.detail;

  if (Array.isArray(data.detail)) {
    return data.detail.map((item) => {
      const field = item.loc ? item.loc[item.loc.length - 1] : '';
      const fieldLabel = fieldNames[field] || field;
      return fieldLabel ? `${fieldLabel}: ${translate(item.msg)}` : translate(item.msg);
    }).join('\n');
  }

  if (data.detail && typeof data.detail === 'object') {
    return Object.values(data.detail).map(translate).join('\n');
  }

  if (typeof data.message === 'string') return data.message;

  return fallback;
}

function passwordStrengthInfo(password) {
  const value = password || '';

  let score = 0;
  const hints = [];

  if (value.length >= 8) {
    score += 1;
  } else {
    hints.push('минимум 8 символов');
  }

  if (/[A-Z]/.test(value)) {
    score += 1;
  } else {
    hints.push('заглавная английская буква');
  }

  if (/\d/.test(value)) {
    score += 1;
  } else {
    hints.push('цифра');
  }

  if (/[!@#$%^&*()_\-+=[\]{};:,.?/\\|`~]/.test(value)) {
    score += 1;
  } else {
    hints.push('спецсимвол');
  }

  if (/^[A-Za-z0-9!@#$%^&*()_\-+=[\]{};:,.?/\\|`~]*$/.test(value)) {
    score += 1;
  } else {
    hints.push('без русских букв');
  }

  if (!value) {
    return {
      score: 0,
      label: 'Введите пароль',
      colorClass: 'bg-slate-200',
      textClass: 'text-slate-500',
      width: '0%',
      hints: ['минимум 8 символов', 'заглавная буква', 'цифра', 'спецсимвол'],
    };
  }

  if (score <= 2) {
    return {
      score,
      label: 'Слабый пароль',
      colorClass: 'bg-red-500',
      textClass: 'text-red-700',
      width: '33%',
      hints,
    };
  }

  if (score <= 4) {
    return {
      score,
      label: 'Средний пароль',
      colorClass: 'bg-yellow-500',
      textClass: 'text-yellow-700',
      width: '66%',
      hints,
    };
  }

  return {
    score,
    label: 'Надёжный пароль',
    colorClass: 'bg-emerald-500',
    textClass: 'text-emerald-700',
    width: '100%',
    hints: [],
  };
}

function renderPasswordStrength(password) {
  const info = passwordStrengthInfo(password);

  return `
    <div>
      <div class="flex items-center justify-between gap-3">
        <div class="text-xs font-bold ${info.textClass}">${safe(info.label)}</div>
        <div class="text-xs text-slate-500">Надёжность пароля</div>
      </div>

      <div class="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
        <div class="h-full rounded-full ${info.colorClass} transition-all" style="width: ${info.width}"></div>
      </div>

      ${
        info.hints.length
          ? `<div class="mt-2 text-xs text-slate-500">Добавьте: ${safe(info.hints.join(', '))}</div>`
          : `<div class="mt-2 text-xs text-emerald-700">Пароль соответствует требованиям.</div>`
      }
    </div>
  `;
}