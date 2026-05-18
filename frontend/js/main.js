let currentUser = null;
let currentRole = null;

const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const dashboardContent = document.getElementById('dashboardContent');
const logoutBtn = document.getElementById('logoutBtn');

const employerResult = document.getElementById('employerResult');
const studentResult = document.getElementById('studentResult');

const employerRegisterTab = document.getElementById('employerRegisterTab');
const employerLoginTab = document.getElementById('employerLoginTab');
const employerRegisterBlock = document.getElementById('employerRegisterBlock');
const employerLoginBlock = document.getElementById('employerLoginBlock');

function getThemeLabel(theme) {
  const labels = {
    light: 'Светлая',
    graphite: 'Графит',
    ocean: 'Океан',
    purple: 'Фиолетовая',
    emerald: 'Изумруд',
    rose: 'Розовая',
    amber: 'Янтарная',
  };

  return labels[theme] || 'Светлая';
}

function applyAppTheme(theme = 'light') {
  const allowedThemes = ['light', 'graphite', 'ocean', 'purple', 'emerald', 'rose', 'amber'];
  const finalTheme = allowedThemes.includes(theme) ? theme : 'light';

  document.documentElement.setAttribute('data-theme', finalTheme);
  document.body.setAttribute('data-theme', finalTheme);

  localStorage.setItem('career_hub_theme', finalTheme);

  const label = document.getElementById('themePickerLabel');
  if (label) {
    label.textContent = getThemeLabel(finalTheme);
  }

  document.querySelectorAll('[data-theme-option]').forEach((button) => {
    button.classList.toggle('active', button.dataset.themeOption === finalTheme);
  });
}

function setupThemePicker() {
  const savedTheme = localStorage.getItem('career_hub_theme') || 'light';
  applyAppTheme(savedTheme);

  const toggle = document.getElementById('themePickerToggle');
  const menu = document.getElementById('themePickerMenu');
  const picker = document.getElementById('themePicker');

  if (!toggle || !menu || !picker) {
    return;
  }

  function closeMenu() {
    menu.classList.add('hidden');
  }

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    menu.classList.toggle('hidden');
  });

  document.querySelectorAll('[data-theme-option]').forEach((button) => {
    button.addEventListener('click', () => {
      applyAppTheme(button.dataset.themeOption);
      closeMenu();
    });
  });

  document.addEventListener('click', (event) => {
    if (!picker.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });
}

function bindDashboardTabs(role) {
  document.querySelectorAll('.dashboard-tab').forEach((button) => {
    button.addEventListener('click', async () => {
      const tab = button.dataset.tab;

      if (role === 'student') {
        await renderStudentDashboard(currentUser, tab);
      }

      if (role === 'employer') {
        await renderEmployerDashboard(currentUser, tab);
      }

      if (role === 'admin') {
        await renderAdminDashboard(currentUser, tab);
      }
    });
  });
}

async function renderDashboard(user) {
  currentUser = user;
  currentRole = user.role;

  authSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');

  if (logoutBtn) {
    logoutBtn.classList.remove('hidden');
  }

  if (user.role === 'student') {
    await renderStudentDashboard(user, 'profile');
  } else if (user.role === 'employer') {
    await renderEmployerDashboard(user, 'company');
  } else if (user.role === 'admin') {
    await renderAdminDashboard(user, 'stats');
  } else {
    dashboardContent.innerHTML = `<div class="app-card">Неизвестная роль: ${user.role}</div>`;
  }
}

function renderAuth() {
  dashboardSection.classList.add('hidden');
  authSection.classList.remove('hidden');

  if (logoutBtn) {
    logoutBtn.classList.add('hidden');
  }

  currentUser = null;
  currentRole = null;
}

async function refreshUI() {
  const user = await fetchCurrentUser();

  if (user) {
    await renderDashboard(user);
  } else {
    renderAuth();
  }
}

function initApp() {
  setupThemePicker();

  setupEmployerTabs();
  setupEmployerRegister();
  setupEmployerVerifyCode();
  setupEmployerLogin();
  setupStudentLogin();
  setupLogout();
  setupPasswordToggles();
  setupEmployerForgotPassword();

  refreshUI();
}

document.addEventListener('DOMContentLoaded', initApp);