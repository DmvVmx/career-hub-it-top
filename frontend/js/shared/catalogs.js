const CATALOG_CITIES = [
  'Сочи',
  'Адлер',
  'Москва',
  'Санкт-Петербург',
  'Краснодар',
  'Ростов-на-Дону',
  'Казань',
  'Екатеринбург',
  'Новосибирск',
  'Нижний Новгород',
  'Самара',
  'Уфа',
  'Пермь',
  'Воронеж',
  'Волгоград',
  'Челябинск',
  'Красноярск',
  'Омск',
  'Тюмень',
  'Иркутск',
  'Ставрополь',
  'Пятигорск',
  'Минеральные Воды',
  'Новороссийск',
  'Анапа',
  'Геленджик',
  'Туапсе',
  'Армавир',
  'Майкоп',
  'Симферополь',
  'Севастополь',
];

const CATALOG_DIRECTIONS = [
  { value: 'programmer', label: 'Программист' },
  { value: 'designer', label: 'Дизайнер' },
  { value: 'marketer', label: 'Маркетолог' },
];

const CATALOG_WORK_FORMATS = [
  { value: 'office', label: 'Офис' },
  { value: 'remote', label: 'Удаленно' },
  { value: 'hybrid', label: 'Гибрид' },
];

const CATALOG_EMPLOYMENT_TYPES = [
  { value: 'internship', label: 'Стажировка' },
  { value: 'part_time', label: 'Частичная занятость' },
  { value: 'full_time', label: 'Полная занятость' },
  { value: 'project', label: 'Проектная работа' },
  { value: 'volunteer', label: 'Волонтерский проект' },
];

const CATALOG_SKILL_GROUPS = [
  {
    id: 'programming',
    label: 'Программирование',
    items: [
      'Python',
      'JavaScript',
      'TypeScript',
      'Java',
      'C#',
      'C++',
      'PHP',
      'Go',
      'HTML',
      'CSS',
      'SCSS',
      'React',
      'Vue',
      'Angular',
      'Node.js',
      'Express.js',
      'FastAPI',
      'Django',
      'Flask',
      'Laravel',
      'Spring Boot',
      'ASP.NET',
      'PostgreSQL',
      'MySQL',
      'SQLite',
      'MongoDB',
      'Redis',
      'SQL',
      'Docker',
      'Docker Compose',
      'Git',
      'GitHub',
      'GitLab',
      'REST API',
      'WebSocket',
      'JWT',
      'Linux',
      'Nginx',
      'Alembic',
      'SQLAlchemy',
      'Pydantic',
      'Unit Testing',
      'CI/CD',
      'Tailwind CSS',
      'Bootstrap',
    ],
  },
  {
    id: 'design',
    label: 'Дизайн',
    items: [
      'Figma',
      'Adobe Photoshop',
      'Adobe Illustrator',
      'Adobe After Effects',
      'Adobe Premiere Pro',
      'UI Design',
      'UX Design',
      'Web Design',
      'Mobile Design',
      'Product Design',
      'Graphic Design',
      'Brand Design',
      'Typography',
      'Color Theory',
      'Composition',
      'Wireframes',
      'Prototyping',
      'Design Systems',
      'User Flow',
      'Customer Journey Map',
      'Landing Page Design',
      'Adaptive Design',
      'Responsive Design',
      'Icon Design',
      'Logo Design',
      'Presentation Design',
      'Tilda',
      'Readymag',
      'Canva',
      'Blender',
      'Motion Design',
      'UX Research',
      'Usability Testing',
      'HTML/CSS Basics',
    ],
  },
  {
    id: 'marketing',
    label: 'Маркетинг',
    items: [
      'SMM',
      'Target Ads',
      'Context Ads',
      'SEO',
      'Email Marketing',
      'Content Marketing',
      'Copywriting',
      'Marketing Analytics',
      'Google Analytics',
      'Яндекс Метрика',
      'VK Ads',
      'Telegram Ads',
      'Яндекс Директ',
      'Google Ads',
      'CRM',
      'A/B Testing',
      'Brand Strategy',
      'Market Research',
      'Competitor Analysis',
      'Customer Development',
      'Lead Generation',
      'Sales Funnel',
      'Landing Page',
      'Performance Marketing',
      'Influencer Marketing',
      'Community Management',
      'PR',
      'Event Marketing',
    ],
  },
  {
    id: 'ai',
    label: 'Искусственный интеллект',
    items: [
      'ChatGPT',
      'Prompt Engineering',
      'AI Tools',
      'Midjourney',
      'Stable Diffusion',
      'DALL-E',
      'Claude',
      'Gemini',
      'Copilot',
      'AI для текста',
      'AI для дизайна',
      'AI для аналитики',
      'AI для маркетинга',
      'Автоматизация через AI',
      'Нейросети',
    ],
  },
  {
    id: 'tools',
    label: 'Инструменты',
    items: [
      'Excel',
      'Google Sheets',
      'PowerPoint',
      'Google Slides',
      'Notion',
      'Trello',
      'Jira',
      'Miro',
      'Slack',
      'Discord',
      'WordPress',
      'Tilda',
      'Bitrix24',
      'AmoCRM',
      'Google Docs',
    ],
  },
  {
    id: 'soft_skills',
    label: 'Soft skills',
    items: [
      'Коммуникация',
      'Командная работа',
      'Ответственность',
      'Критическое мышление',
      'Самоорганизация',
      'Обучаемость',
      'Публичные выступления',
      'Презентации',
      'Работа с клиентами',
      'Тайм-менеджмент',
      'Креативность',
      'Аналитическое мышление',
    ],
  },
];

const CATALOG_ALL_SKILLS = CATALOG_SKILL_GROUPS.flatMap((group) => group.items);

function inputValue(value) {
  if (value === null || value === undefined) return '';

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function directionLabel(value) {
  const item = CATALOG_DIRECTIONS.find((direction) => direction.value === value);
  return item ? item.label : value || 'Не указано';
}

function catalogWorkFormatLabel(value) {
  const item = CATALOG_WORK_FORMATS.find((format) => format.value === value);
  return item ? item.label : value || 'Не указано';
}

function catalogEmploymentTypeLabel(value) {
  const item = CATALOG_EMPLOYMENT_TYPES.find((type) => type.value === value);
  return item ? item.label : value || 'Не указано';
}

function skillsToArray(value) {
  if (!value) return [];

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function skillsToString(skills) {
  const unique = [];

  skills.forEach((skill) => {
    if (skill && !unique.includes(skill)) {
      unique.push(skill);
    }
  });

  return unique.join(', ');
}

function renderCityInput(id, value = '') {
  return `
    <input
      id="${id}"
      type="text"
      list="${id}List"
      required
      value="${inputValue(value)}"
      placeholder="Начните вводить город"
      class="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
    />

    <datalist id="${id}List">
      ${CATALOG_CITIES.map((city) => `<option value="${inputValue(city)}"></option>`).join('')}
    </datalist>

    <p class="text-xs text-slate-500 mt-1">Выберите город из списка. Сочи и Адлер находятся первыми.</p>
  `;
}

function renderDirectionSelect(id, value = '') {
  return `
    <select
      id="${id}"
      required
      class="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
    >
      <option value="" disabled ${!value ? 'selected' : ''}>Выберите направление</option>
      ${CATALOG_DIRECTIONS.map((direction) => `
        <option value="${direction.value}" ${direction.value === value ? 'selected' : ''}>
          ${direction.label}
        </option>
      `).join('')}
    </select>
  `;
}

function renderWorkFormatSelect(id, value = '') {
  return `
    <select
      id="${id}"
      required
      class="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
    >
      <option value="" disabled ${!value ? 'selected' : ''}>Выберите формат</option>
      ${CATALOG_WORK_FORMATS.map((format) => `
        <option value="${format.value}" ${format.value === value ? 'selected' : ''}>
          ${format.label}
        </option>
      `).join('')}
    </select>
  `;
}

function renderEmploymentTypeSelect(id, value = '') {
  return `
    <select
      id="${id}"
      required
      class="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
    >
      <option value="" disabled ${!value ? 'selected' : ''}>Выберите тип занятости</option>
      ${CATALOG_EMPLOYMENT_TYPES.map((type) => `
        <option value="${type.value}" ${type.value === value ? 'selected' : ''}>
          ${type.label}
        </option>
      `).join('')}
    </select>
  `;
}

function renderSkillTags(skills) {
  if (!skills.length) {
    return '<div class="text-sm text-slate-500">Навыки пока не выбраны</div>';
  }

  return `
    <div class="flex gap-2 flex-wrap">
      ${skills.map((skill) => `
        <span class="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-sm font-medium">
          ${safe(skill)}
        </span>
      `).join('')}
    </div>
  `;
}

function renderSkillsBadges(skillsValue) {
  const skills = skillsToArray(skillsValue);

  if (!skills.length) {
    return '—';
  }

  return `
    <div class="flex gap-2 flex-wrap">
      ${skills.map((skill) => `
        <span class="rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-sm font-medium">
          ${safe(skill)}
        </span>
      `).join('')}
    </div>
  `;
}

function renderSkillsPicker(prefix, selectedValue = '') {
  const selectedSkills = skillsToArray(selectedValue);
  const hiddenValue = skillsToString(selectedSkills);

  return `
    <div class="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <label class="block text-sm font-medium text-slate-700">Навыки *</label>
          <p class="text-xs text-slate-500 mt-1">
            Можно выбрать навыки из разных областей: программирование, дизайн, маркетинг, AI и soft skills.
          </p>
        </div>

        <span class="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs text-slate-500">
          Поиск + мультивыбор
        </span>
      </div>

      <input
        id="${prefix}SkillSearch"
        type="text"
        placeholder="Поиск навыка: Python, Figma, SEO, ChatGPT..."
        class="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
      />

      <input id="${prefix}SkillsValue" type="hidden" value="${inputValue(hiddenValue)}" />

      <div id="${prefix}SelectedSkills" class="mt-4">
        ${renderSkillTags(selectedSkills)}
      </div>

      <div id="${prefix}SkillsList" class="mt-4 max-h-80 overflow-y-auto space-y-4 pr-2"></div>
    </div>
  `;
}

function bindSkillsPicker(prefix) {
  const searchInput = document.getElementById(`${prefix}SkillSearch`);
  const hiddenInput = document.getElementById(`${prefix}SkillsValue`);
  const selectedBlock = document.getElementById(`${prefix}SelectedSkills`);
  const listBlock = document.getElementById(`${prefix}SkillsList`);

  if (!searchInput || !hiddenInput || !selectedBlock || !listBlock) return;

  let selectedSkills = skillsToArray(hiddenInput.value);

  function syncHidden() {
    hiddenInput.value = skillsToString(selectedSkills);
    selectedBlock.innerHTML = renderSkillTags(selectedSkills);
  }

  function toggleSkill(skill) {
    if (selectedSkills.includes(skill)) {
      selectedSkills = selectedSkills.filter((item) => item !== skill);
    } else {
      selectedSkills.push(skill);
    }

    syncHidden();
    renderList();
  }

  function renderList() {
    const query = searchInput.value.trim().toLowerCase();

    listBlock.innerHTML = CATALOG_SKILL_GROUPS.map((group) => {
      const filteredItems = group.items.filter((skill) => (
        !query || skill.toLowerCase().includes(query)
      ));

      if (!filteredItems.length) return '';

      return `
        <div class="rounded-2xl bg-white border border-slate-200 p-4">
          <div class="font-semibold text-slate-900 mb-3">${group.label}</div>

          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            ${filteredItems.map((skill) => {
              const checked = selectedSkills.includes(skill);

              return `
                <label class="flex items-center gap-2 rounded-xl border ${checked ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'} px-3 py-2 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    data-skill="${inputValue(skill)}"
                    ${checked ? 'checked' : ''}
                    class="w-4 h-4"
                  />
                  <span class="text-sm">${safe(skill)}</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    listBlock.querySelectorAll('[data-skill]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        toggleSkill(checkbox.dataset.skill);
      });
    });
  }

  searchInput.addEventListener('input', renderList);

  syncHidden();
  renderList();
}

function getSkillsPickerValue(prefix) {
  const input = document.getElementById(`${prefix}SkillsValue`);
  return input ? input.value.trim() : '';
}

function validateCatalogCity(city) {
  return CATALOG_CITIES.includes(city);
}

function validateCatalogDirection(direction) {
  return CATALOG_DIRECTIONS.some((item) => item.value === direction);
}

function validateCatalogSkills(skillsValue) {
  const skills = skillsToArray(skillsValue);

  if (!skills.length) return false;

  return skills.every((skill) => CATALOG_ALL_SKILLS.includes(skill));
}