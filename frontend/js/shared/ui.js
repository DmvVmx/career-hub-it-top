function renderPasswordStrength(password) {
  const value = password || '';

  const checks = [
    {
      ok: value.length >= 8,
      text: 'Минимум 8 символов',
    },
    {
      ok: /[A-Z]/.test(value),
      text: 'Заглавная английская буква',
    },
    {
      ok: /\d/.test(value),
      text: 'Цифра',
    },
    {
      ok: /[!@#$%^&*()_\-+=[\]{};:,.?/\\|`~]/.test(value),
      text: 'Спецсимвол',
    },
    {
      ok: /^[A-Za-z0-9!@#$%^&*()_\-+=[\]{};:,.?/\\|`~]*$/.test(value),
      text: 'Без русских букв',
    },
  ];

  const passed = checks.filter((item) => item.ok).length;

  let label = 'Слабый пароль';
  let barClass = 'bg-red-500';
  let textClass = 'text-red-600';
  let width = '20%';

  if (!value) {
    label = 'Введите пароль';
    barClass = 'bg-slate-300';
    textClass = 'text-slate-500';
    width = '0%';
  } else if (passed >= 3 && passed < 5) {
    label = 'Средний пароль';
    barClass = 'bg-yellow-500';
    textClass = 'text-yellow-700';
    width = '65%';
  } else if (passed === 5) {
    label = 'Надёжный пароль';
    barClass = 'bg-green-600';
    textClass = 'text-green-700';
    width = '100%';
  }

  return `
    <div class="rounded-2xl bg-slate-50 border border-slate-200 p-3">
      <div class="flex items-center justify-between gap-3">
        <div class="text-xs font-bold ${textClass}">${label}</div>
        <div class="text-xs text-slate-500">${passed}/5</div>
      </div>

      <div class="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
        <div class="h-full rounded-full ${barClass}" style="width: ${width};"></div>
      </div>

      <div class="mt-3 grid gap-1">
        ${checks.map((item) => `
          <div class="text-xs ${item.ok ? 'text-green-700' : 'text-slate-500'}">
            ${item.ok ? '✓' : '•'} ${item.text}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}


function showMessage(element, message, isError = false) {
  if (!element) return;

  element.className = `
    mt-4 rounded-2xl border px-4 py-3 text-sm whitespace-pre-wrap
    ${isError
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
    }
  `;

  element.textContent = message;
}

function showToast(message, type = 'success') {
  const oldToast = document.getElementById('appToast');
  if (oldToast) oldToast.remove();

  const styles = {
    success: {
      wrapper: 'bg-emerald-600',
      icon: '✓',
      title: 'Готово',
    },
    error: {
      wrapper: 'bg-red-600',
      icon: '!',
      title: 'Ошибка',
    },
    info: {
      wrapper: 'bg-slate-900',
      icon: 'i',
      title: 'Сообщение',
    },
    warning: {
      wrapper: 'bg-yellow-600',
      icon: '!',
      title: 'Внимание',
    },
  };

  const current = styles[type] || styles.info;

  const toast = document.createElement('div');
  toast.id = 'appToast';
  toast.className = `
    fixed right-6 top-6 z-[9999] max-w-md rounded-3xl ${current.wrapper}
    text-white shadow-2xl px-5 py-4 animate-[fadeIn_.18s_ease-out]
  `;

  toast.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="mt-0.5 w-7 h-7 rounded-2xl bg-white/20 flex items-center justify-center font-black">
        ${current.icon}
      </div>

      <div class="min-w-0">
        <div class="font-black">${current.title}</div>
        <div class="text-sm text-white/90 mt-0.5 whitespace-pre-wrap">${safe(message)}</div>
      </div>

      <button id="closeToastBtn" type="button" class="ml-2 text-white/70 hover:text-white text-xl leading-none">
        ×
      </button>
    </div>
  `;

  document.body.appendChild(toast);

  const closeBtn = document.getElementById('closeToastBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => toast.remove());
  }

  setTimeout(() => {
    if (toast && toast.parentNode) {
      toast.remove();
    }
  }, 3500);
}

function showConfirmModal({
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  danger = false,
}) {
  return new Promise((resolve) => {
    const oldModal = document.getElementById('confirmModal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'confirmModal';
    modal.className = 'fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm';

    modal.innerHTML = `
      <div class="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl border border-slate-200">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-2xl ${
            danger ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-900'
          } flex items-center justify-center font-black text-xl">
            ${danger ? '!' : '?'}
          </div>

          <div class="flex-1">
            <h3 class="text-xl font-black text-slate-900">${safe(title)}</h3>
            <p class="mt-2 text-slate-600 whitespace-pre-wrap">${safe(message)}</p>
          </div>
        </div>

        <div class="mt-6 flex gap-3 justify-end">
          <button id="confirmCancelBtn" class="rounded-2xl border border-slate-300 px-5 py-2.5 text-sm font-bold hover:bg-slate-50">
            ${safe(cancelText)}
          </button>

          <button id="confirmOkBtn" class="rounded-2xl ${
            danger ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-900 hover:bg-slate-800'
          } text-white px-5 py-2.5 text-sm font-bold transition">
            ${safe(confirmText)}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('confirmCancelBtn').addEventListener('click', () => {
      modal.remove();
      resolve(false);
    });

    document.getElementById('confirmOkBtn').addEventListener('click', () => {
      modal.remove();
      resolve(true);
    });

    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.remove();
        resolve(false);
      }
    });
  });
}

function showPromptModal({
  title,
  message,
  label = 'Причина',
  placeholder = '',
  confirmText = 'Сохранить',
  cancelText = 'Отмена',
  danger = false,
  required = true,
  maxLength = 1000,
}) {
  return new Promise((resolve) => {
    const oldModal = document.getElementById('promptModal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'promptModal';
    modal.className = 'fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm';

    modal.innerHTML = `
      <div class="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl border border-slate-200">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="text-xl font-black text-slate-900">${safe(title)}</h3>
            <p class="mt-2 text-slate-600">${safe(message)}</p>
          </div>

          <button id="promptCloseBtn" type="button" class="text-2xl leading-none text-slate-400 hover:text-slate-900">
            ×
          </button>
        </div>

        <div class="mt-5">
          <label class="block text-sm font-bold text-slate-700 mb-1">${safe(label)}</label>
          <textarea
            id="promptValue"
            rows="5"
            maxlength="${maxLength}"
            placeholder="${inputValue(placeholder)}"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 ${
              danger ? 'focus:ring-red-400' : 'focus:ring-blue-400'
            }"
          ></textarea>

          <div class="mt-2 flex items-center justify-between gap-3">
            <div id="promptError" class="text-sm text-red-600"></div>
            <div id="promptCounter" class="text-xs text-slate-500">0 / ${maxLength}</div>
          </div>
        </div>

        <div class="mt-6 flex gap-3 justify-end">
          <button id="promptCancelBtn" class="rounded-2xl border border-slate-300 px-5 py-2.5 text-sm font-bold hover:bg-slate-50">
            ${safe(cancelText)}
          </button>

          <button id="promptOkBtn" class="rounded-2xl ${
            danger ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-900 hover:bg-slate-800'
          } text-white px-5 py-2.5 text-sm font-bold transition">
            ${safe(confirmText)}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const textarea = document.getElementById('promptValue');
    const counter = document.getElementById('promptCounter');
    const error = document.getElementById('promptError');

    function close(value) {
      modal.remove();
      resolve(value);
    }

    function submit() {
      const value = textarea.value.trim();

      if (required && !value) {
        error.textContent = 'Заполните поле.';
        return;
      }

      close(value);
    }

    textarea.addEventListener('input', () => {
      counter.textContent = `${textarea.value.length} / ${maxLength}`;
      error.textContent = '';
    });

    document.getElementById('promptCloseBtn').addEventListener('click', () => close(null));
    document.getElementById('promptCancelBtn').addEventListener('click', () => close(null));
    document.getElementById('promptOkBtn').addEventListener('click', submit);

    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        close(null);
      }
    });

    textarea.focus();
  });
}