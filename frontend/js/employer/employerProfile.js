function normalizePhoneInput(phone) {
  return phone.replace(/[\s\-()]/g, '');
}

function isValidEmployerPhone(phone) {
  const cleaned = normalizePhoneInput(phone);

  return (
    /^\+7\d{10}$/.test(cleaned) ||
    /^8\d{10}$/.test(cleaned) ||
    /^7\d{10}$/.test(cleaned)
  );
}

function employerProfileStatusHint(profile) {
  if (!profile) {
    return {
      title: 'Профиль не заполнен',
      text: 'Заполните данные компании. После сохранения профиль отправится на проверку.',
      className: 'app-alert-warning',
    };
  }

  if (profile.status === 'approved') {
    return {
      title: 'Компания проверена',
      text: 'Вы можете публиковать вакансии, приглашать студентов и пользоваться откликами.',
      className: 'app-alert-success',
    };
  }

  if (profile.status === 'rejected') {
    return {
      title: 'Профиль компании отклонён',
      text: profile.rejection_reason || 'Администратор не указал причину. Исправьте данные и отправьте профиль повторно.',
      className: 'app-alert-danger',
    };
  }

  return {
    title: 'Профиль на проверке',
    text: 'Администратор проверяет данные компании. После подтверждения станут доступны все возможности.',
    className: 'app-alert-warning',
  };
}

function employerCompanyLogo(profile) {
  if (profile && profile.avatar_url) {
    return `
      <img
        src="${profile.avatar_url}"
        alt="Логотип компании"
        class="w-24 h-24 rounded-3xl object-cover border border-slate-200"
      />
    `;
  }

  const letter = profile && profile.company_name ? profile.company_name[0] : 'К';

  return `
    <div class="w-24 h-24 rounded-3xl bg-blue-100 text-blue-700 flex items-center justify-center text-3xl font-black">
      ${safe(letter)}
    </div>
  `;
}

function employerProfileOverview(profile) {
  const statusHint = employerProfileStatusHint(profile);

  if (!profile) {
    return `
      <section class="app-card">
        <div class="${statusHint.className}">
          <div class="font-black">${statusHint.title}</div>
          <p class="mt-2 text-sm leading-6">${statusHint.text}</p>
        </div>

        <div class="mt-5 app-card-soft">
          <div class="font-black text-slate-900">Что нужно заполнить</div>
          <div class="mt-3 grid gap-2 text-sm text-slate-600">
            <div>• название компании</div>
            <div>• ИНН</div>
            <div>• телефон</div>
            <div>• описание компании</div>
            <div>• логотип компании, если есть</div>
          </div>
        </div>
      </section>
    `;
  }

  return `
    <section class="app-card">
      <div class="flex items-start justify-between gap-5 flex-wrap">
        <div class="flex items-start gap-4">
          ${employerCompanyLogo(profile)}

          <div class="min-w-0">
            <h3 class="text-2xl font-black text-slate-900 break-words">${safe(profile.company_name)}</h3>
            <p class="text-slate-500 mt-1">Профиль компании</p>

            <div class="mt-3 flex gap-2 flex-wrap">
              ${statusBadge(profile.status)}
              <span class="app-badge">ИНН ${safe(profile.inn)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 ${statusHint.className}">
        <div class="font-black">${statusHint.title}</div>
        <p class="mt-2 text-sm leading-6 whitespace-pre-wrap">${statusHint.text}</p>

        ${
          profile.status === 'rejected'
            ? `
              <p class="mt-3 text-sm leading-6">
                Исправьте данные в форме справа и сохраните профиль. После сохранения профиль снова уйдёт на проверку.
              </p>
            `
            : ''
        }
      </div>

      <div class="app-grid-2 mt-6">
        ${card('Название компании', profile.company_name)}
        ${card('ИНН', profile.inn)}
        ${card('Телефон', profile.phone)}
        ${card('Статус проверки', statusLabel(profile.status))}
      </div>

      <div class="mt-5 app-card-soft">
        <div class="text-sm text-slate-500">Описание</div>
        <div class="mt-2 whitespace-pre-wrap leading-7">${safe(profile.description)}</div>
      </div>
    </section>
  `;
}

function employerProfileForm(profile) {
  const hasProfile = Boolean(profile);

  return `
    <aside class="app-card">
      <div class="mb-5">
        <h3 class="text-xl font-black text-slate-900">
          ${hasProfile ? 'Редактировать компанию' : 'Заполнить компанию'}
        </h3>

        <p class="text-sm text-slate-500 mt-1">
          Данные проверяет администратор. После изменения статус снова станет “На проверке”.
        </p>
      </div>

      <form id="employerProfileForm" class="space-y-4">
        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">
            Название компании *
          </label>

          <input
            id="companyName"
            type="text"
            required
            value="${hasProfile ? inputValue(profile.company_name) : ''}"
            placeholder="Например: IT TOP Partners"
            class="app-input"
          />

          <p class="text-xs text-slate-500 mt-1">
            Минимум 2 символа.
          </p>
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">
            ИНН *
          </label>

          <input
            id="companyInn"
            type="text"
            required
            value="${hasProfile ? inputValue(profile.inn) : ''}"
            placeholder="10 или 12 цифр"
            class="app-input"
          />

          <p class="text-xs text-slate-500 mt-1">
            Только цифры, 10 или 12 символов.
          </p>
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">
            Телефон *
          </label>

          <input
            id="companyPhone"
            type="tel"
            required
            value="${hasProfile && profile.phone ? inputValue(profile.phone) : ''}"
            placeholder="+79991234567 или 89991234567"
            class="app-input"
          />

          <p class="text-xs text-slate-500 mt-1">
            Можно вводить с пробелами, скобками и дефисами.
          </p>
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">
            Логотип компании
          </label>

          <input
            id="companyAvatarFile"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="app-input"
          />

          <input
            id="companyAvatarUrl"
            type="hidden"
            value="${hasProfile && profile.avatar_url ? inputValue(profile.avatar_url) : ''}"
          />

          ${
            hasProfile && profile.avatar_url
              ? `
                <div class="mt-3 flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-3">
                  <img
                    src="${profile.avatar_url}"
                    alt="Логотип компании"
                    class="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                  />

                  <div>
                    <div class="font-bold text-sm">Текущий логотип</div>
                    <div class="text-xs text-slate-500 mt-1">Загрузите новый файл, чтобы заменить.</div>
                  </div>
                </div>
              `
              : `
                <p class="text-xs text-slate-500 mt-1">
                  JPG, PNG или WEBP до 5 МБ.
                </p>
              `
          }
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">
            Описание компании *
          </label>

          <textarea
            id="companyDescription"
            rows="6"
            required
            placeholder="Кратко расскажите о компании, сфере деятельности, команде и кого ищете"
            class="app-textarea"
          >${hasProfile && profile.description ? safe(profile.description) : ''}</textarea>

          <p class="text-xs text-slate-500 mt-1">
            Минимум 10 символов.
          </p>
        </div>

        <button type="submit" class="app-button app-button-primary w-full">
          Сохранить профиль
        </button>
      </form>

      <div id="employerProfileResult" class="mt-4 text-sm whitespace-pre-wrap"></div>
    </aside>
  `;
}

async function renderEmployerCompanyTab(user) {
  let profile = null;
  let error = null;

  try {
    const response = await getEmployerProfile();

    if (response.ok) {
      profile = await response.json();
    } else {
      error = 'Не удалось загрузить профиль компании.';
    }
  } catch {
    error = 'Сервер недоступен.';
  }

  if (error) {
    return placeholderBlock('Профиль компании', error);
  }

  return `
    <div class="grid lg:grid-cols-[minmax(0,1fr)_420px] gap-6">
      ${employerProfileOverview(profile)}
      ${employerProfileForm(profile)}
    </div>
  `;
}

function bindEmployerProfileForm() {
  const form = document.getElementById('employerProfileForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const result = document.getElementById('employerProfileResult');
    result.className = 'mt-4 text-sm text-slate-600 whitespace-pre-wrap';
    result.textContent = 'Проверяем данные...';

    const companyName = document.getElementById('companyName').value.trim();
    const inn = document.getElementById('companyInn').value.trim();
    const phone = document.getElementById('companyPhone').value.trim();
    const description = document.getElementById('companyDescription').value.trim();

    if (companyName.length < 2) {
      showMessage(result, 'Введите название компании минимум 2 символа.', true);
      return;
    }

    if (!/^\d{10}$|^\d{12}$/.test(inn)) {
      showMessage(result, 'ИНН должен содержать только 10 или 12 цифр.', true);
      return;
    }

    if (!phone || !isValidEmployerPhone(phone)) {
      showMessage(result, 'Введите корректный телефон: +79991234567 или 89991234567.', true);
      return;
    }

    if (description.length < 10) {
      showMessage(result, 'Описание компании должно содержать минимум 10 символов.', true);
      return;
    }

    result.textContent = 'Сохраняем профиль...';

    let avatarUrl = document.getElementById('companyAvatarUrl').value.trim() || null;
    const avatarFile = document.getElementById('companyAvatarFile').files[0];

    if (avatarFile) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

      if (!allowedTypes.includes(avatarFile.type)) {
        showMessage(result, 'Можно загрузить только JPG, PNG или WEBP изображение.', true);
        return;
      }

      const maxSizeMb = 5;

      if (avatarFile.size > maxSizeMb * 1024 * 1024) {
        showMessage(result, `Размер изображения не должен превышать ${maxSizeMb} МБ.`, true);
        return;
      }

      try {
        result.textContent = 'Загружаем логотип...';

        const uploadResponse = await uploadEmployerAvatar(avatarFile);
        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          showMessage(result, getApiErrorMessage(uploadData, 'Ошибка загрузки изображения.'), true);
          return;
        }

        avatarUrl = uploadData.avatar_url;
      } catch {
        showMessage(result, 'Не удалось загрузить изображение. Проверьте сервер.', true);
        return;
      }
    }

    const payload = {
      company_name: companyName,
      inn,
      phone,
      avatar_url: avatarUrl,
      description,
    };

    try {
      result.textContent = 'Сохраняем профиль...';

      const response = await updateEmployerProfile(payload);
      const data = await response.json();

      if (!response.ok) {
        showMessage(result, getApiErrorMessage(data, 'Ошибка сохранения профиля'), true);
        return;
      }

      showToast('Профиль компании сохранен и отправлен на проверку');
      await renderEmployerDashboard(currentUser, 'company');
    } catch {
      showMessage(result, 'Сервер недоступен или возникла ошибка сети.', true);
    }
  });
}