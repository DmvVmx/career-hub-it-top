const PASSWORD_RULE_MESSAGE =
  'Пароль должен содержать минимум 8 символов, одну заглавную английскую букву, одну цифру и один спецсимвол. Русские буквы использовать нельзя.';

function validateStrongPassword(password) {
  const allowedChars = /^[A-Za-z0-9!@#$%^&*()_\-+=[\]{};:,.?/\\|`~]+$/;
  const hasUppercase = /[A-Z]/;
  const hasDigit = /\d/;
  const hasSpecial = /[!@#$%^&*()_\-+=[\]{};:,.?/\\|`~]/;

  return (
    password &&
    password.length >= 8 &&
    allowedChars.test(password) &&
    hasUppercase.test(password) &&
    hasDigit.test(password) &&
    hasSpecial.test(password)
  );
}

function updatePasswordStrength(inputId, targetId) {
  const input = document.getElementById(inputId);
  const target = document.getElementById(targetId);

  if (!input || !target) return;

  target.innerHTML = renderPasswordStrength(input.value);
}

function setupPasswordStrengthMeters() {
  const pairs = [
    ['registerPassword', 'registerPasswordStrength'],
    ['resetNewPassword', 'resetPasswordStrength'],
  ];

  pairs.forEach(([inputId, targetId]) => {
    const input = document.getElementById(inputId);
    const target = document.getElementById(targetId);

    if (!input || !target) return;

    target.innerHTML = renderPasswordStrength(input.value);

    input.addEventListener('input', () => {
      updatePasswordStrength(inputId, targetId);
    });
  });
}

function setAuthMainTab(activeTab) {
  const panels = {
    student: document.getElementById('studentAuthPanel'),
    employer: document.getElementById('employerAuthPanel'),
  };

  const tabs = {
    student: document.getElementById('authStudentTab'),
    employer: document.getElementById('authEmployerTab'),
  };

  Object.keys(panels).forEach((key) => {
    if (panels[key]) {
      panels[key].classList.toggle('hidden', key !== activeTab);
    }

    if (tabs[key]) {
      tabs[key].className = key === activeTab
        ? 'rounded-2xl bg-white text-slate-950 py-3 text-sm font-black shadow-sm'
        : 'rounded-2xl text-slate-600 py-3 text-sm font-black hover:bg-white/70 transition';
    }
  });

  const resultIds = ['studentResult', 'employerResult'];
  resultIds.forEach((id) => {
    const result = document.getElementById(id);
    if (result) {
      result.textContent = '';
      result.className = 'mt-4 text-sm';
    }
  });
}

function setEmployerAuthMode(mode) {
  const loginBlock = document.getElementById('employerLoginBlock');
  const registerBlock = document.getElementById('employerRegisterBlock');

  if (loginBlock) {
    loginBlock.classList.toggle('hidden', mode !== 'login');
  }

  if (registerBlock) {
    registerBlock.classList.toggle('hidden', mode !== 'register');
  }

  employerLoginTab.className = mode === 'login'
    ? 'rounded-xl bg-white py-2.5 text-sm font-bold shadow-sm'
    : 'rounded-xl py-2.5 text-sm font-bold text-slate-600 hover:bg-white/70 transition';

  employerRegisterTab.className = mode === 'register'
    ? 'rounded-xl bg-white py-2.5 text-sm font-bold shadow-sm'
    : 'rounded-xl py-2.5 text-sm font-bold text-slate-600 hover:bg-white/70 transition';

  employerResult.textContent = '';
  employerResult.className = 'mt-4 text-sm';
}

function setupEmployerTabs() {
  const studentTab = document.getElementById('authStudentTab');
  const employerTab = document.getElementById('authEmployerTab');

  if (studentTab) {
    studentTab.addEventListener('click', () => setAuthMainTab('student'));
  }

  if (employerTab) {
    employerTab.addEventListener('click', () => setAuthMainTab('employer'));
  }

  employerRegisterTab.addEventListener('click', () => {
    setEmployerAuthMode('register');
  });

  employerLoginTab.addEventListener('click', () => {
    setEmployerAuthMode('login');
  });

  setAuthMainTab('student');
  setEmployerAuthMode('login');
}

async function tryAdminLogin(username, password) {
  try {
    const response = await loginAdmin({ username, password });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    setTokens(data);

    const user = await fetchCurrentUser();

    if (user && user.role === 'admin') {
      await renderDashboard(user);
      return true;
    }

    clearTokens();
    return false;
  } catch {
    return false;
  }
}

function setupEmployerRegister() {
  document.getElementById('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    employerResult.className = 'mt-4 text-sm text-slate-600 whitespace-pre-wrap';
    employerResult.textContent = 'Проверяем данные...';

    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordRepeat = document.getElementById('registerPasswordRepeat').value;

    if (!email) {
      showMessage(employerResult, 'Введите email.', true);
      return;
    }

    if (!password) {
      showMessage(employerResult, 'Введите пароль.', true);
      return;
    }

    if (!validateStrongPassword(password)) {
      showMessage(employerResult, PASSWORD_RULE_MESSAGE, true);
      return;
    }

    if (!passwordRepeat) {
      showMessage(employerResult, 'Повторите пароль.', true);
      return;
    }

    if (password !== passwordRepeat) {
      showMessage(employerResult, 'Пароли не совпадают.', true);
      return;
    }

    employerResult.textContent = 'Отправляем код на email...';

    try {
      const response = await registerEmployer({ email, password });
      const data = await response.json();

      if (!response.ok) {
        showMessage(employerResult, getApiErrorMessage(data, 'Ошибка регистрации'), true);
        return;
      }

      showMessage(employerResult, data.message || 'Код отправлен на email');
    } catch {
      showMessage(employerResult, 'Сервер недоступен или возникла ошибка сети', true);
    }
  });
}

function setupEmployerVerifyCode() {
  document.getElementById('verifyCodeBtn').addEventListener('click', async () => {
    employerResult.className = 'mt-4 text-sm text-slate-600 whitespace-pre-wrap';
    employerResult.textContent = 'Проверяем код...';

    const payload = {
      email: document.getElementById('registerEmail').value.trim(),
      code: document.getElementById('verifyCode').value.trim(),
    };

    if (!payload.email) {
      showMessage(employerResult, 'Введите email.', true);
      return;
    }

    if (!/^\d{6}$/.test(payload.code)) {
      showMessage(employerResult, 'Введите 6-значный код.', true);
      return;
    }

    try {
      const response = await verifyEmployerCode(payload);
      const data = await response.json();

      if (!response.ok) {
        showMessage(employerResult, getApiErrorMessage(data, 'Ошибка подтверждения кода'), true);
        return;
      }

      showMessage(employerResult, 'Email подтвержден. Теперь войдите в аккаунт.');
      setEmployerAuthMode('login');
      document.getElementById('loginEmail').value = payload.email;
      document.getElementById('loginPassword').focus();
    } catch {
      showMessage(employerResult, 'Сервер недоступен или возникла ошибка сети', true);
    }
  });
}

function setupEmployerLogin() {
  document.getElementById('employerLoginBlock').addEventListener('submit', async (event) => {
    event.preventDefault();

    employerResult.className = 'mt-4 text-sm text-slate-600 whitespace-pre-wrap';
    employerResult.textContent = 'Выполняем вход...';

    const payload = {
      email: document.getElementById('loginEmail').value.trim(),
      password: document.getElementById('loginPassword').value,
    };

    if (!payload.email) {
      showMessage(employerResult, 'Введите email.', true);
      return;
    }

    if (!payload.password) {
      showMessage(employerResult, 'Введите пароль.', true);
      return;
    }

    try {
      const response = await loginEmployer(payload);
      const data = await response.json();

      if (!response.ok) {
        showMessage(employerResult, getApiErrorMessage(data, 'Ошибка входа'), true);
        return;
      }

      setTokens(data);
      await refreshUI();
    } catch {
      showMessage(employerResult, 'Сервер недоступен или возникла ошибка сети', true);
    }
  });
}

function setupStudentLogin() {
  document.getElementById('studentLoginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    studentResult.className = 'mt-4 text-sm text-slate-600 whitespace-pre-wrap';
    studentResult.textContent = 'Проверяем данные...';

    const login = document.getElementById('studentLogin').value.trim();
    const password = document.getElementById('studentPassword').value;

    if (!login) {
      showMessage(studentResult, 'Введите логин.', true);
      return;
    }

    if (!password) {
      showMessage(studentResult, 'Введите пароль.', true);
      return;
    }

    const isAdminLoggedIn = await tryAdminLogin(login, password);

    if (isAdminLoggedIn) {
      showToast('Вход выполнен');
      return;
    }

    studentResult.textContent = 'Проверяем данные в журнале...';

    try {
      const response = await loginStudent({ login, password });
      const data = await response.json();

      if (!response.ok) {
        showMessage(studentResult, getApiErrorMessage(data, 'Ошибка входа'), true);
        return;
      }

      setTokens(data);
      await refreshUI();
    } catch {
      showMessage(studentResult, 'Сервер недоступен или возникла ошибка сети', true);
    }
  });
}

function setupPasswordToggles() {
  document.querySelectorAll('[data-toggle-password]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.togglePassword);

      if (!input) {
        return;
      }

      input.type = input.type === 'password' ? 'text' : 'password';
      button.textContent = input.type === 'password' ? '👁' : '🙈';
    });
  });

  setupPasswordStrengthMeters();
}

function setupEmployerForgotPassword() {
  const forgotBtn = document.getElementById('forgotEmployerPasswordBtn');
  const modal = document.getElementById('employerForgotPasswordModal');
  const closeBtn = document.getElementById('closeForgotPasswordModalBtn');
  const sendCodeBtn = document.getElementById('sendResetPasswordCodeBtn');
  const resetBtn = document.getElementById('resetEmployerPasswordBtn');
  const result = document.getElementById('forgotPasswordResult');

  const stepText = document.getElementById('forgotPasswordStepText');
  const stepEmail = document.getElementById('forgotPasswordStepEmail');
  const stepCode = document.getElementById('forgotPasswordStepCode');
  const stepPassword = document.getElementById('forgotPasswordStepNewPassword');

  const step1Bar = document.getElementById('forgotStep1');
  const step2Bar = document.getElementById('forgotStep2');
  const step3Bar = document.getElementById('forgotStep3');

  const backToEmailBtn = document.getElementById('forgotBackToEmailBtn');
  const goToPasswordBtn = document.getElementById('forgotGoToPasswordBtn');
  const backToCodeBtn = document.getElementById('forgotBackToCodeBtn');

  if (
    !forgotBtn ||
    !modal ||
    !closeBtn ||
    !sendCodeBtn ||
    !resetBtn ||
    !result ||
    !stepEmail ||
    !stepCode ||
    !stepPassword
  ) {
    return;
  }

  function clearResult() {
    result.textContent = '';
    result.className = 'mt-4 text-sm whitespace-pre-wrap';
  }

  function setStep(step) {
    clearResult();

    stepEmail.classList.add('hidden');
    stepCode.classList.add('hidden');
    stepPassword.classList.add('hidden');

    step1Bar.className = 'h-2 rounded-full bg-slate-200';
    step2Bar.className = 'h-2 rounded-full bg-slate-200';
    step3Bar.className = 'h-2 rounded-full bg-slate-200';

    if (step === 1) {
      stepEmail.classList.remove('hidden');
      step1Bar.className = 'h-2 rounded-full bg-teal-600';
      stepText.textContent = 'Введите email работодателя. Мы отправим код подтверждения.';

      setTimeout(() => {
        document.getElementById('forgotPasswordEmail')?.focus();
      }, 50);

      return;
    }

    if (step === 2) {
      stepCode.classList.remove('hidden');
      step1Bar.className = 'h-2 rounded-full bg-emerald-500';
      step2Bar.className = 'h-2 rounded-full bg-teal-600';
      stepText.textContent = 'Введите код из письма. После этого задайте новый пароль.';

      setTimeout(() => {
        document.getElementById('resetPasswordCode')?.focus();
      }, 50);

      return;
    }

    if (step === 3) {
      stepPassword.classList.remove('hidden');
      step1Bar.className = 'h-2 rounded-full bg-emerald-500';
      step2Bar.className = 'h-2 rounded-full bg-emerald-500';
      step3Bar.className = 'h-2 rounded-full bg-teal-600';
      stepText.textContent = 'Придумайте новый надёжный пароль и повторите его.';

      updatePasswordStrength('resetNewPassword', 'resetPasswordStrength');

      setTimeout(() => {
        document.getElementById('resetNewPassword')?.focus();
      }, 50);
    }
  }

  function clearResetFields() {
    const codeInput = document.getElementById('resetPasswordCode');
    const newPasswordInput = document.getElementById('resetNewPassword');
    const repeatInput = document.getElementById('resetNewPasswordRepeat');

    if (codeInput) codeInput.value = '';
    if (newPasswordInput) newPasswordInput.value = '';
    if (repeatInput) repeatInput.value = '';

    updatePasswordStrength('resetNewPassword', 'resetPasswordStrength');
  }

  function openModal() {
    const loginEmail = document.getElementById('loginEmail')?.value.trim() || '';

    document.getElementById('forgotPasswordEmail').value = loginEmail;

    clearResetFields();
    clearResult();

    document.body.style.overflow = 'hidden';
    modal.classList.remove('hidden');

    setStep(1);
  }

  function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    clearResult();
  }

  forgotBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  if (backToEmailBtn) {
    backToEmailBtn.addEventListener('click', () => {
      setStep(1);
    });
  }

  if (backToCodeBtn) {
    backToCodeBtn.addEventListener('click', () => {
      setStep(2);
    });
  }

  if (goToPasswordBtn) {
    goToPasswordBtn.addEventListener('click', () => {
      const code = document.getElementById('resetPasswordCode').value.trim();

      if (!/^\d{6}$/.test(code)) {
        showMessage(result, 'Введите 6-значный код из email.', true);
        return;
      }

      setStep(3);
    });
  }

  sendCodeBtn.addEventListener('click', async () => {
    const email = document.getElementById('forgotPasswordEmail').value.trim();

    if (!email) {
      showMessage(result, 'Введите email работодателя.', true);
      return;
    }

    result.className = 'mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 whitespace-pre-wrap';
    result.textContent = 'Отправляем код восстановления...';

    try {
      const response = await forgotEmployerPassword({ email });
      const data = await response.json();

      if (!response.ok) {
        showMessage(result, getApiErrorMessage(data, 'Не удалось отправить код.'), true);
        return;
      }

      showToast(data.message || 'Код отправлен на email.');
      setStep(2);
    } catch {
      showMessage(result, 'Сервер недоступен или возникла ошибка сети.', true);
    }
  });

  resetBtn.addEventListener('click', async () => {
    const email = document.getElementById('forgotPasswordEmail').value.trim();
    const code = document.getElementById('resetPasswordCode').value.trim();
    const newPassword = document.getElementById('resetNewPassword').value;
    const newPasswordRepeat = document.getElementById('resetNewPasswordRepeat').value;

    if (!email) {
      setStep(1);
      showMessage(result, 'Введите email работодателя.', true);
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setStep(2);
      showMessage(result, 'Введите 6-значный код из email.', true);
      return;
    }

    if (!newPassword) {
      showMessage(result, 'Введите новый пароль.', true);
      return;
    }

    if (!validateStrongPassword(newPassword)) {
      showMessage(result, PASSWORD_RULE_MESSAGE, true);
      return;
    }

    if (!newPasswordRepeat) {
      showMessage(result, 'Повторите новый пароль.', true);
      return;
    }

    if (newPassword !== newPasswordRepeat) {
      showMessage(result, 'Пароли не совпадают.', true);
      return;
    }

    result.className = 'mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 whitespace-pre-wrap';
    result.textContent = 'Меняем пароль...';

    try {
      const response = await resetEmployerPassword({
        email,
        code,
        new_password: newPassword,
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(result, getApiErrorMessage(data, 'Не удалось сменить пароль.'), true);
        return;
      }

      showToast(data.message || 'Пароль успешно изменен. Теперь войдите.');

      document.getElementById('loginEmail').value = email;
      document.getElementById('loginPassword').value = '';

      setTimeout(() => {
        closeModal();
        setAuthMainTab('employer');
        setEmployerAuthMode('login');
      }, 900);
    } catch {
      showMessage(result, 'Сервер недоступен или возникла ошибка сети.', true);
    }
  });
}


function setupLogout() {
  if (!logoutBtn) {
    return;
  }

  logoutBtn.addEventListener('click', () => {
    clearTokens();
    renderAuth();
  });
}