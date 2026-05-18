const API_BASE = '';

function getAccessToken() {
  return localStorage.getItem('access_token');
}

function getRefreshToken() {
  return localStorage.getItem('refresh_token');
}

function setTokens(data) {
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
}

function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

async function apiFetch(path, options = {}) {
  const token = getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
}

async function fetchCurrentUser() {
  const token = getAccessToken();

  if (!token) {
    return null;
  }

  const response = await apiFetch('/auth/me', {
    method: 'GET',
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  return response.json();
}

async function registerEmployer(payload) {
  return apiFetch('/auth/employer/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function verifyEmployerCode(payload) {
  return apiFetch('/auth/employer/verify-code', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function loginEmployer(payload) {
  return apiFetch('/auth/employer/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function loginStudent(payload) {
  return apiFetch('/auth/student/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function loginAdmin(payload) {
  return apiFetch('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function getEmployerProfile() {
  return apiFetch('/employer/profile', {
    method: 'GET',
  });
}

async function updateEmployerProfile(payload) {
  return apiFetch('/employer/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

async function uploadEmployerAvatar(file) {
  const token = getAccessToken();

  const formData = new FormData();
  formData.append('file', file);

  return fetch(`${API_BASE}/employer/profile/avatar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
}

async function createEmployerVacancy(payload) {
  return apiFetch('/employer/vacancies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function getEmployerVacancies() {
  return apiFetch('/employer/vacancies', {
    method: 'GET',
  });
}

async function updateEmployerVacancy(vacancyId, payload) {
  return apiFetch(`/employer/vacancies/${vacancyId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

async function archiveEmployerVacancy(vacancyId) {
  return apiFetch(`/employer/vacancies/${vacancyId}/archive`, {
    method: 'PATCH',
  });
}

async function restoreEmployerVacancy(vacancyId) {
  return apiFetch(`/employer/vacancies/${vacancyId}/restore`, {
    method: 'PATCH',
  });
}

async function deleteEmployerVacancy(vacancyId) {
  return apiFetch(`/employer/vacancies/${vacancyId}`, {
    method: 'DELETE',
  });
}

async function getPublicVacancies() {
  return apiFetch('/vacancies', {
    method: 'GET',
  });
}

async function getPublicVacancyById(vacancyId) {
  return apiFetch(`/vacancies/${vacancyId}`, {
    method: 'GET',
  });
}

async function getCompanyById(companyId) {
  return apiFetch(`/companies/${companyId}`, {
    method: 'GET',
  });
}

async function getMyResume() {
  return apiFetch('/student/resume', {
    method: 'GET',
  });
}

async function saveMyResume(payload) {
  return apiFetch('/student/resume', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

async function createMyResume(payload) {
  return apiFetch('/student/resumes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function getMyResumes(limit = 10, offset = 0) {
  return apiFetch(`/student/resumes?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
}

async function getMyResumeById(resumeId) {
  return apiFetch(`/student/resumes/${resumeId}`, {
    method: 'GET',
  });
}

async function updateMyResume(resumeId, payload) {
  return apiFetch(`/student/resumes/${resumeId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

async function archiveMyResume(resumeId) {
  return apiFetch(`/student/resumes/${resumeId}/archive`, {
    method: 'PATCH',
  });
}

async function restoreMyResume(resumeId) {
  return apiFetch(`/student/resumes/${resumeId}/restore`, {
    method: 'PATCH',
  });
}

async function deleteMyResume(resumeId) {
  return apiFetch(`/student/resumes/${resumeId}`, {
    method: 'DELETE',
  });
}

async function downloadMyResumePdf(resumeId) {
  return apiFetch(`/student/resumes/${resumeId}/pdf`, {
    method: 'GET',
  });
}

async function downloadPublicResumePdf(resumeId) {
  return apiFetch(`/resumes/public/${resumeId}/pdf`, {
    method: 'GET',
  });
}


async function getPublicResumes(limit = 10, offset = 0) {
  return apiFetch(`/resumes/public?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
}

async function getPublicResumeById(resumeId) {
  return apiFetch(`/resumes/public/${resumeId}`, {
    method: 'GET',
  });
}

async function createApplication(payload) {
  return apiFetch('/student/applications', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function getMyApplications(limit = 10, offset = 0) {
  return apiFetch(`/student/applications?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
}

async function updateStudentApplicationStatus(applicationId, status) {
  return apiFetch(`/student/applications/${applicationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

async function getEmployerApplications(limit = 10, offset = 0) {
  return apiFetch(`/employer/applications?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
}

async function updateApplicationStatus(applicationId, status) {
  return apiFetch(`/employer/applications/${applicationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

async function inviteStudentByResume(resumeId, payload) {
  return apiFetch(`/employer/applications/resumes/${resumeId}/invite`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function createChatFromApplication(applicationId) {
  return apiFetch(`/chats/from-application/${applicationId}`, {
    method: 'POST',
  });
}

async function getChats(limit = 10, offset = 0) {
  return apiFetch(`/chats?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
}

async function getChatMessages(chatId, limit = 50, offset = 0) {
  return apiFetch(`/chats/${chatId}/messages?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
}

async function closeChat(chatId, reason = null) {
  return apiFetch(`/chats/${chatId}/close`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

async function reopenChat(chatId) {
  return apiFetch(`/chats/${chatId}/reopen`, {
    method: 'PATCH',
  });
}

async function sendChatMessage(chatId, payload) {
  return apiFetch(`/chats/${chatId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function sendChatFile(chatId, text, file) {
  const token = getAccessToken();

  const formData = new FormData();

  if (text) {
    formData.append('text', text);
  }

  formData.append('file', file);

  return fetch(`${API_BASE}/chats/${chatId}/messages/file`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
}

async function getAdminStats() {
  return apiFetch('/admin/stats', {
    method: 'GET',
  });
}

async function getAdminUsers(limit = 20, offset = 0) {
  return apiFetch(`/admin/users?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
}

async function adminBanUser(userId) {
  return apiFetch(`/admin/users/${userId}/ban`, {
    method: 'PATCH',
  });
}

async function adminUnbanUser(userId) {
  return apiFetch(`/admin/users/${userId}/unban`, {
    method: 'PATCH',
  });
}

async function getAdminEmployers(limit = 20, offset = 0) {
  return apiFetch(`/admin/employers?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
}

async function getAdminStudents(limit = 20, offset = 0) {
  return apiFetch(`/admin/students?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
}

async function approveAdminEmployer(id) {
  return apiFetch(`/admin/employers/${id}/approve`, {
    method: 'PATCH',
  });
}

async function unapproveAdminEmployer(id) {
  return apiFetch(`/admin/employers/${id}/unapprove`, {
    method: 'PATCH',
  });
}

async function rejectAdminEmployer(id, reason) {
  return apiFetch(`/admin/employers/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

async function approveAdminStudent(id) {
  return apiFetch(`/admin/students/${id}/approve`, {
    method: 'PATCH',
  });
}

async function unapproveAdminStudent(id) {
  return apiFetch(`/admin/students/${id}/unapprove`, {
    method: 'PATCH',
  });
}

async function rejectAdminStudent(id, reason) {
  return apiFetch(`/admin/students/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

async function getAdminVacancies(limit = 20, offset = 0) {
  return apiFetch(`/admin/vacancies?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
}

async function adminArchiveVacancy(vacancyId) {
  return apiFetch(`/admin/vacancies/${vacancyId}/archive`, {
    method: 'PATCH',
  });
}

async function adminRestoreVacancy(vacancyId) {
  return apiFetch(`/admin/vacancies/${vacancyId}/restore`, {
    method: 'PATCH',
  });
}

async function adminDeleteVacancy(vacancyId) {
  return apiFetch(`/admin/vacancies/${vacancyId}`, {
    method: 'DELETE',
  });
}

async function getAdminResumes(limit = 20, offset = 0) {
  return apiFetch(`/admin/resumes?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
}

async function adminArchiveResume(resumeId) {
  return apiFetch(`/admin/resumes/${resumeId}/archive`, {
    method: 'PATCH',
  });
}

async function adminRestoreResume(resumeId) {
  return apiFetch(`/admin/resumes/${resumeId}/restore`, {
    method: 'PATCH',
  });
}

async function adminDeleteResume(resumeId) {
  return apiFetch(`/admin/resumes/${resumeId}`, {
    method: 'DELETE',
  });
}

async function getAdminApplications(limit = 20, offset = 0) {
  return apiFetch(`/admin/applications?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
}

async function forgotEmployerPassword(payload) {
  return apiFetch('/auth/employer/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function resetEmployerPassword(payload) {
  return apiFetch('/auth/employer/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}


async function getPixelBattleClans() {
  return apiFetch('/pixel-battle/clans', {
    method: 'GET',
  });
}

async function joinPixelBattleClan(clanId) {
  return apiFetch('/pixel-battle/clans/join', {
    method: 'POST',
    body: JSON.stringify({
      clan_id: Number(clanId),
    }),
  });
}

async function getPixelBattleMyState() {
  return apiFetch('/pixel-battle/me', {
    method: 'GET',
  });
}

async function getPixelBattleCurrentSeason() {
  return apiFetch('/pixel-battle/season/current', {
    method: 'GET',
  });
}

async function getPixelBattleCanvas() {
  return apiFetch('/pixel-battle/season/current/canvas', {
    method: 'GET',
  });
}

async function placePixelBattlePixel(payload) {
  return apiFetch('/pixel-battle/season/current/pixels', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function getPixelBattleLeaderboard() {
  return apiFetch('/pixel-battle/season/current/leaderboard', {
    method: 'GET',
  });
}