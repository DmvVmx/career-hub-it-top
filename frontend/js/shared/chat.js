let chatLimit = 50;
let chatOffset = 0;
let messageLimit = 50;
let messageOffset = 0;

let activeChatSocket = null;
let activeChatId = null;
let cachedChats = [];
let chatSearchQuery = '';

function getWebSocketUrl(chatId) {
  const token = getAccessToken();
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/ws/chats/${chatId}?token=${encodeURIComponent(token)}`;
}

function closeActiveChatSocket() {
  if (activeChatSocket) {
    activeChatSocket.close();
    activeChatSocket = null;
    activeChatId = null;
  }
}

function chatCompanionName(chat) {
  const companion = chat.companion || {};

  if (companion.role === 'employer') {
    return companion.company_name || 'Работодатель';
  }

  if (companion.role === 'student') {
    return companion.full_name || 'Студент';
  }

  return 'Собеседник';
}

function chatCompanionAvatar(chat) {
  const companion = chat.companion || {};
  const image = companion.avatar_url || companion.photo_url;

  if (image) {
    return `
      <img
        src="${image}"
        class="w-12 h-12 rounded-2xl object-cover border border-slate-200"
        alt="Аватар"
      />
    `;
  }

  return `
    <div class="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-lg font-black text-blue-700">
      ${safe(chatCompanionName(chat)[0] || 'Ч')}
    </div>
  `;
}

function chatVacancyTitle(chat) {
  return chat.vacancy && chat.vacancy.title
    ? chat.vacancy.title
    : 'Вакансия не указана';
}

function chatVacancyMeta(chat) {
  if (!chat.vacancy) return '';

  const items = [
    chat.vacancy.city,
    directionLabel(chat.vacancy.direction),
    catalogWorkFormatLabel(chat.vacancy.work_format),
    catalogEmploymentTypeLabel(chat.vacancy.employment_type),
  ].filter(Boolean);

  return items.map((item) => safe(item)).join(' · ');
}

function chatLastMessageText(chat) {
  if (chat.is_closed) {
    return 'Чат закрыт';
  }

  return chat.last_message || 'Сообщений пока нет';
}

function chatClosedLabel(chat) {
  if (!chat.is_closed) return '';

  return `
    <span class="app-badge app-badge-danger">
      Закрыт
    </span>
  `;
}

function chatMatchesSearch(chat, query) {
  if (!query) return true;

  const text = [
    chatCompanionName(chat),
    chatVacancyTitle(chat),
    chatVacancyMeta(chat),
    chat.last_message,
    chat.is_closed ? 'закрыт закрытый' : 'открыт открытый',
    chat.resume ? chat.resume.title : '',
    chat.resume ? chat.resume.skills : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return text.includes(query.toLowerCase());
}

function getFilteredChats() {
  return cachedChats.filter((chat) => chatMatchesSearch(chat, chatSearchQuery));
}

function chatCard(chat) {
  const isActive = Number(activeChatId) === Number(chat.id);

  return `
    <button
      type="button"
      data-open-chat-inline="${chat.id}"
      class="w-full text-left rounded-3xl border p-4 transition ${
        isActive
          ? 'bg-blue-50 border-blue-200 shadow-sm'
          : 'bg-white border-slate-200 hover:bg-slate-50'
      }"
    >
      <div class="flex items-start gap-3">
        ${chatCompanionAvatar(chat)}

        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="font-black text-slate-900 truncate">
                ${safe(chatCompanionName(chat))}
              </div>

              <div class="mt-1 text-xs font-bold text-blue-700 truncate">
                ${safe(chatVacancyTitle(chat))}
              </div>
            </div>

            <div class="text-[11px] text-slate-400 whitespace-nowrap">
              ${formatDateTime(chat.updated_at)}
            </div>
          </div>

          <div class="mt-2 flex items-center gap-2">
            ${chat.is_closed ? '<span class="w-2 h-2 rounded-full bg-red-500"></span>' : ''}
            <div class="text-sm text-slate-600 truncate">
              ${safe(chatLastMessageText(chat))}
            </div>
          </div>
        </div>
      </div>
    </button>
  `;
}

function chatMessageBubble(message) {
  const isMine = currentUser && Number(message.sender_user_id) === Number(currentUser.id);

  return `
    <div class="flex ${isMine ? 'justify-end' : 'justify-start'}">
      <div class="max-w-[82%] rounded-3xl px-4 py-3 ${
        isMine
          ? 'bg-blue-600 text-white'
          : 'bg-white border border-slate-200 text-slate-900'
      }">
        ${
          message.text
            ? `<div class="whitespace-pre-wrap leading-6">${safe(message.text)}</div>`
            : ''
        }

        ${
          message.file_url
            ? `
              <a
                href="${API_BASE}${message.file_url}"
                target="_blank"
                class="mt-2 inline-flex items-center gap-2 rounded-2xl ${
                  isMine ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-900'
                } px-3 py-2 text-sm font-bold"
              >
                <span>📎</span>
                <span class="break-all">${safe(message.file_name || 'Файл')}</span>
              </a>
            `
            : ''
        }

        <div class="mt-2 text-[11px] ${isMine ? 'text-white/70' : 'text-slate-500'}">
          ${formatDateTime(message.created_at)}
        </div>
      </div>
    </div>
  `;
}

function appendChatMessage(message) {
  const list = document.getElementById('chatMessagesList');
  if (!list) return;

  const empty = list.querySelector('[data-empty-chat]');
  if (empty) {
    empty.remove();
  }

  list.insertAdjacentHTML('beforeend', chatMessageBubble(message));
  list.scrollTop = list.scrollHeight;
}

function updateCachedChat(updatedChat) {
  cachedChats = cachedChats.map((chat) => {
    if (Number(chat.id) === Number(updatedChat.id)) {
      return {
        ...chat,
        ...updatedChat,
      };
    }

    return chat;
  });
}

function showChatSocketError(message) {
  const result = document.getElementById('chatMessageResult');

  if (result) {
    showMessage(result, message || 'Не удалось отправить сообщение.', true);
    return;
  }

  showToast(message || 'Не удалось отправить сообщение.', 'error');
}

function rerenderActiveChatFromSocket(updatedChat, role) {
  updateCachedChat(updatedChat);
  refreshChatCards(role);

  if (Number(activeChatId) !== Number(updatedChat.id)) {
    return;
  }

  const panel = document.getElementById('chatConversationPanel');
  const messagesList = document.getElementById('chatMessagesList');

  if (panel && messagesList) {
    const currentMessagesHtml = messagesList.innerHTML;
    panel.innerHTML = renderChatConversation(updatedChat, []);
    const newMessagesList = document.getElementById('chatMessagesList');

    if (newMessagesList) {
      newMessagesList.innerHTML = currentMessagesHtml;
      newMessagesList.scrollTop = newMessagesList.scrollHeight;
    }

    if (!updatedChat.is_closed) {
      bindChatMessageForm(updatedChat.id);
      bindCloseChatAction(updatedChat.id, role);
      bindChatHeaderActions(updatedChat, role);
    } else {
      bindReopenChatAction(updatedChat.id, role);
      bindChatHeaderActions(updatedChat, role);
    }
  }
}

function connectChatSocket(chatId, role) {
  closeActiveChatSocket();

  activeChatId = Number(chatId);
  activeChatSocket = new WebSocket(getWebSocketUrl(chatId));

  activeChatSocket.onopen = () => {
    console.log('Chat WebSocket connected');
  };

  activeChatSocket.onmessage = (event) => {
    const payload = JSON.parse(event.data);

    if (payload.type === 'message' && payload.message) {
      appendChatMessage(payload.message);

      cachedChats = cachedChats.map((chat) => {
        if (Number(chat.id) === Number(payload.message.chat_id)) {
          return {
            ...chat,
            last_message: payload.message.text || payload.message.file_name || 'Файл',
            updated_at: payload.message.created_at,
          };
        }

        return chat;
      });

      refreshChatCards(role);
      return;
    }

    if (payload.type === 'chat_closed' && payload.chat) {
      rerenderActiveChatFromSocket(payload.chat, role);
      showToast('Чат закрыт');
      return;
    }

    if (payload.type === 'chat_reopened' && payload.chat) {
      rerenderActiveChatFromSocket(payload.chat, role);
      showToast('Чат снова открыт');
      return;
    }

    if (payload.type === 'error') {
      showChatSocketError(payload.message);
    }
  };

  activeChatSocket.onclose = () => {
    console.log('Chat WebSocket closed');
  };

  activeChatSocket.onerror = () => {
    console.log('Chat WebSocket error');
  };
}

function renderChatEmptyState() {
  return `
    <div class="h-full min-h-[520px] app-card flex items-center justify-center text-center">
      <div>
        <div class="w-16 h-16 mx-auto rounded-3xl bg-slate-100 flex items-center justify-center text-2xl">
          💬
        </div>

        <h3 class="mt-4 text-xl font-black text-slate-900">
          Выберите чат
        </h3>

        <p class="mt-2 text-slate-600 max-w-sm">
          Слева отображаются все доступные чаты. Чат появляется только после принятого приглашения.
        </p>
      </div>
    </div>
  `;
}

function renderChatShell(chats, role) {
  return `
    <div class="grid lg:grid-cols-[360px_minmax(0,1fr)] gap-6 h-[calc(100vh-190px)] min-h-[620px]">
      <aside class="app-card p-0 overflow-hidden flex flex-col min-h-[520px]">
        <div class="p-5 border-b border-slate-200">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-xl font-black text-slate-900">Чаты</h3>
              <p class="text-sm text-slate-500 mt-1">
                Переписки по принятым откликам
              </p>
            </div>

            <span class="app-badge">${chats.length}</span>
          </div>

          <div class="mt-4">
            <input
              id="chatSearchInput"
              type="text"
              value="${inputValue(chatSearchQuery)}"
              placeholder="Поиск по чатам, вакансии, сообщению..."
              class="app-input"
            />
          </div>
        </div>

        <div id="chatsList" class="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/60">
          ${
            chats.length
              ? chats.map(chatCard).join('')
              : `
                <div class="text-center text-slate-500 py-10">
                  У вас пока нет доступных чатов.
                </div>
              `
          }
        </div>
      </aside>

      <section id="chatConversationPanel" class="min-h-[520px]">
        ${renderChatEmptyState()}
      </section>
    </div>
  `;
}

async function renderChatsTab(role) {
  closeActiveChatSocket();

  try {
    const response = await getChats(chatLimit, chatOffset);

    if (!response.ok) {
      return placeholderBlock('Чаты', 'Не удалось загрузить чаты.');
    }

    const data = await response.json();
    cachedChats = data.items || [];
    activeChatId = null;

    return renderChatShell(getFilteredChats(), role);
  } catch {
    return placeholderBlock('Чаты', 'Сервер недоступен.');
  }
}

function refreshChatCards(role) {
  const list = document.getElementById('chatsList');
  if (!list) return;

  const chats = getFilteredChats();

  list.innerHTML = chats.length
    ? chats.map(chatCard).join('')
    : `
      <div class="text-center text-slate-500 py-10">
        По вашему поиску чаты не найдены.
      </div>
    `;

  bindChatListActions(role);
}

function renderChatHeader(chat, role) {
  return `
    <div class="p-5 border-b border-slate-200 bg-white rounded-t-3xl">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div class="flex items-start gap-4 min-w-0">
          ${chatCompanionAvatar(chat)}

          <div class="min-w-0">
            <div class="flex gap-2 flex-wrap mb-2">
              ${chat.is_closed ? chatClosedLabel(chat) : '<span class="app-badge app-badge-success">Чат открыт</span>'}
            </div>

            <h3 class="text-xl font-black text-slate-900 truncate">
              ${safe(chatCompanionName(chat))}
            </h3>

            <div class="mt-1 text-sm font-bold text-blue-700 break-words">
              ${safe(chatVacancyTitle(chat))}
            </div>

            ${
              chatVacancyMeta(chat)
                ? `
                  <div class="mt-1 text-xs text-slate-500 break-words">
                    ${chatVacancyMeta(chat)}
                  </div>
                `
                : ''
            }

            <div class="mt-3 flex gap-2 flex-wrap">
              ${
                chat.vacancy
                  ? `
                    <button
                      type="button"
                      data-chat-open-vacancy="${chat.id}"
                      class="app-button"
                    >
                      Открыть вакансию
                    </button>
                  `
                  : ''
              }

              ${
                role === 'employer' && chat.resume
                  ? `
                    <button
                      type="button"
                      data-chat-open-resume="${chat.id}"
                      class="app-button app-button-purple"
                    >
                      Открыть резюме
                    </button>
                  `
                  : ''
              }
            </div>
          </div>
        </div>

        ${
          !chat.is_closed
            ? `
              <button
                id="closeChatBtn"
                type="button"
                class="app-button app-button-danger"
              >
                Закрыть чат
              </button>
            `
            : ''
        }
      </div>

      ${
        chat.is_closed
          ? `
            <div class="mt-4 rounded-3xl bg-red-50 border border-red-100 p-4">
              <div class="font-black text-red-800">Чат закрыт</div>
              <p class="mt-1 text-sm text-red-700 leading-6">
                Новые сообщения отправлять нельзя.
                ${
                  chat.close_reason
                    ? `Причина: ${safe(chat.close_reason)}`
                    : ''
                }
              </p>
            </div>
          `
          : ''
      }
    </div>
  `;
}

function renderClosedChatFooter() {
  return `
    <div class="p-4 border-t border-slate-200 bg-white rounded-b-3xl">
      <div class="rounded-3xl bg-slate-50 border border-slate-200 p-4 text-center">
        <div class="font-black text-slate-900">Переписка закрыта</div>
        <p class="mt-1 text-sm text-slate-600">
          История сообщений доступна для просмотра, но отправка новых сообщений отключена.
        </p>

        <button
          type="button"
          id="reopenChatBtn"
          class="app-button app-button-primary mt-4"
        >
          Открыть чат снова
        </button>
      </div>
    </div>
  `;
}

function renderOpenChatFooter() {
  return `
    <div class="p-4 border-t border-slate-200 bg-white rounded-b-3xl">
      <form id="chatMessageForm" class="flex items-end gap-3">
        <button
          type="button"
          id="chatAttachFileBtn"
          class="w-12 h-12 shrink-0 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-xl transition"
          title="Прикрепить файл"
        >
          📎
        </button>

        <input id="chatMessageFile" type="file" class="hidden" />

        <div class="flex-1 min-w-0">
          <textarea
            id="chatMessageText"
            rows="1"
            placeholder="Напишите сообщение..."
            class="app-textarea min-h-[48px] max-h-32 resize-none"
          ></textarea>

          <div id="chatSelectedFileName" class="hidden mt-2 text-xs text-slate-500"></div>
        </div>

        <button
          type="submit"
          class="w-12 h-12 shrink-0 rounded-2xl bg-blue-600 text-white hover:bg-blue-500 flex items-center justify-center text-xl transition"
          title="Отправить"
        >
          ➤
        </button>
      </form>

      <div id="chatMessageResult" class="mt-3 text-sm whitespace-pre-wrap"></div>
    </div>
  `;
}

function renderChatConversation(chat, messages, role) {
  return `
    <div class="app-card p-0 overflow-hidden h-full min-h-[620px] flex flex-col">
      ${renderChatHeader(chat, role)}

      <div id="chatMessagesList" class="flex-1 overflow-y-auto bg-slate-50 p-5 space-y-3">
        ${
          messages.length
            ? messages.map(chatMessageBubble).join('')
            : `<div data-empty-chat class="text-center text-slate-500 py-10">Сообщений пока нет</div>`
        }
      </div>

      ${chat.is_closed ? renderClosedChatFooter() : renderOpenChatFooter()}
    </div>
  `;
}

async function openChatInline(chatId, role) {
  closeActiveChatSocket();

  const chat = cachedChats.find((item) => Number(item.id) === Number(chatId));

  if (!chat) {
    showToast('Чат не найден в списке', 'error');
    return;
  }

  const panel = document.getElementById('chatConversationPanel');
  if (!panel) return;

  panel.innerHTML = `
    <div class="app-card min-h-[520px] flex items-center justify-center">
      <div class="text-slate-500">Загружаем сообщения...</div>
    </div>
  `;

  try {
    const messagesResponse = await getChatMessages(chatId, messageLimit, messageOffset);

    if (!messagesResponse.ok) {
      const data = await messagesResponse.json();
      showToast(getApiErrorMessage(data, 'Не удалось открыть чат'), 'error');
      panel.innerHTML = renderChatEmptyState();
      return;
    }

    const data = await messagesResponse.json();
    const messages = data.items || [];

    activeChatId = Number(chatId);
    panel.innerHTML = renderChatConversation(chat, messages, role);

    refreshChatCards(role);
    bindChatHeaderActions(chat, role);

    if (!chat.is_closed) {
      bindChatMessageForm(chatId);
      bindCloseChatAction(chatId, role);
      connectChatSocket(chatId, role);
    } else {
      bindReopenChatAction(chatId, role);
    }

    const list = document.getElementById('chatMessagesList');
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  } catch {
    showToast('Сервер недоступен или возникла ошибка сети', 'error');
    panel.innerHTML = renderChatEmptyState();
  }
}

function bindChatHeaderActions(chat, role) {
  document.querySelectorAll('[data-chat-open-vacancy]').forEach((button) => {
    button.addEventListener('click', async () => {
      await openChatVacancyDetail(chat, role);
    });
  });

  document.querySelectorAll('[data-chat-open-resume]').forEach((button) => {
    button.addEventListener('click', async () => {
      await openChatResumeDetail(chat, role);
    });
  });
}

async function openChatVacancyDetail(chat, role) {
  if (!chat.vacancy) {
    showToast('Вакансия не найдена', 'error');
    return;
  }

  dashboardContent.innerHTML = `
    <div class="space-y-5">
      <button id="backToChatsFromVacancyBtn" class="app-button">
        ← Назад к чатам
      </button>

      <article class="app-card">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div class="app-badge app-badge-success">Вакансия из чата</div>

            <h2 class="mt-4 text-3xl font-black text-slate-900">
              ${safe(chat.vacancy.title)}
            </h2>

            <p class="mt-2 text-slate-600">
              ${chatVacancyMeta(chat)}
            </p>
          </div>
        </div>

        <div class="mt-6 grid md:grid-cols-2 gap-3">
          ${card('Город', chat.vacancy.city)}
          ${card('Направление', directionLabel(chat.vacancy.direction))}
          ${card('Формат', catalogWorkFormatLabel(chat.vacancy.work_format))}
          ${card('Занятость', catalogEmploymentTypeLabel(chat.vacancy.employment_type))}
        </div>

        <div class="mt-6 rounded-3xl bg-slate-50 border border-slate-200 p-5">
          <div class="font-black text-slate-900">Описание</div>
          <p class="mt-2 text-sm text-slate-600 leading-7">
            Подробное описание вакансии здесь не загружено в ответе чата. Для полной карточки позже можно добавить расширенный ответ backend.
          </p>
        </div>
      </article>
    </div>
  `;

  document.getElementById('backToChatsFromVacancyBtn').addEventListener('click', async () => {
    if (role === 'student') {
      await renderStudentDashboard(currentUser, 'chats');
    } else {
      await renderEmployerDashboard(currentUser, 'chats');
    }
  });
}

async function openChatResumeDetail(chat, role) {
  if (!chat.resume) {
    showToast('Резюме не найдено', 'error');
    return;
  }

  const resume = {
    ...chat.resume,
    student: chat.companion && chat.companion.role === 'student'
      ? {
          full_name: chat.companion.full_name,
          group_name: null,
          photo_url: chat.companion.photo_url,
        }
      : null,
    status: 'published',
    is_public: chat.resume.is_public,
  };

  dashboardContent.innerHTML = publicResumeDetail(resume);

  const backBtn = document.getElementById('backToPublicResumesBtn');
  if (backBtn) {
    backBtn.addEventListener('click', async () => {
      await renderEmployerDashboard(currentUser, 'chats');
    });
  }

  bindEmployerPublicResumeCardActions();
}

function bindCloseChatAction(chatId, role) {
  const closeBtn = document.getElementById('closeChatBtn');
  if (!closeBtn) return;

  closeBtn.addEventListener('click', async () => {
    const confirmed = await showConfirmModal({
      title: 'Закрыть чат?',
      message: 'После закрытия чата новые сообщения отправлять будет нельзя. История переписки останется доступна.',
      confirmText: 'Закрыть чат',
      danger: true,
    });

    if (!confirmed) return;

    try {
      const response = await closeChat(chatId, 'Чат закрыт пользователем');
      const data = await response.json();

      if (!response.ok) {
        showToast(
          getApiErrorMessage(data, 'Не удалось закрыть чат'),
          'error'
        );
        return;
      }

      updateCachedChat(data);
      refreshChatCards(role);

      const panel = document.getElementById('chatConversationPanel');
      const messagesList = document.getElementById('chatMessagesList');

      if (panel && messagesList) {
        const currentMessagesHtml = messagesList.innerHTML;
        panel.innerHTML = renderChatConversation(data, [], role);
        const newMessagesList = document.getElementById('chatMessagesList');

        if (newMessagesList) {
          newMessagesList.innerHTML = currentMessagesHtml;
          newMessagesList.scrollTop = newMessagesList.scrollHeight;
        }
      }

      bindReopenChatAction(chatId, role);
      bindChatHeaderActions(data, role);
      closeActiveChatSocket();
      showToast('Чат закрыт');
    } catch {
      showToast('Сервер недоступен или возникла ошибка сети', 'error');
    }
  });
}

function bindReopenChatAction(chatId, role) {
  const reopenBtn = document.getElementById('reopenChatBtn');
  if (!reopenBtn) return;

  reopenBtn.addEventListener('click', async () => {
    const confirmed = await showConfirmModal({
      title: 'Открыть чат снова?',
      message: 'После открытия обе стороны снова смогут отправлять сообщения.',
      confirmText: 'Открыть',
    });

    if (!confirmed) return;

    try {
      const response = await reopenChat(chatId);
      const data = await response.json();

      if (!response.ok) {
        showToast(
          getApiErrorMessage(data, 'Не удалось открыть чат'),
          'error'
        );
        return;
      }

      updateCachedChat(data);
      refreshChatCards(role);

      const panel = document.getElementById('chatConversationPanel');
      const messagesList = document.getElementById('chatMessagesList');

      if (panel && messagesList) {
        const currentMessagesHtml = messagesList.innerHTML;
        panel.innerHTML = renderChatConversation(data, [], role);
        const newMessagesList = document.getElementById('chatMessagesList');

        if (newMessagesList) {
          newMessagesList.innerHTML = currentMessagesHtml;
          newMessagesList.scrollTop = newMessagesList.scrollHeight;
        }
      }

      bindChatMessageForm(chatId);
      bindCloseChatAction(chatId, role);
      bindChatHeaderActions(data, role);
      connectChatSocket(chatId, role);
      showToast('Чат снова открыт');
    } catch {
      showToast('Сервер недоступен или возникла ошибка сети', 'error');
    }
  });
}

function bindChatMessageForm(chatId) {
  const form = document.getElementById('chatMessageForm');
  const textInput = document.getElementById('chatMessageText');
  const fileInput = document.getElementById('chatMessageFile');
  const attachBtn = document.getElementById('chatAttachFileBtn');
  const selectedFileName = document.getElementById('chatSelectedFileName');

  if (!form || !textInput || !fileInput || !attachBtn) return;

  attachBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];

    if (!selectedFileName) return;

    if (file) {
      selectedFileName.classList.remove('hidden');
      selectedFileName.textContent = `Прикреплён файл: ${file.name}`;
    } else {
      selectedFileName.classList.add('hidden');
      selectedFileName.textContent = '';
    }
  });

  textInput.addEventListener('input', () => {
    textInput.style.height = 'auto';
    textInput.style.height = `${Math.min(textInput.scrollHeight, 128)}px`;
  });

  textInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const result = document.getElementById('chatMessageResult');
    result.className = 'mt-3 text-sm text-slate-600';
    result.textContent = 'Отправляем...';

    const text = textInput.value.trim();
    const file = fileInput.files[0];

    if (!text && !file) {
      showMessage(result, 'Введите сообщение или выберите файл.', true);
      return;
    }

    if (file) {
      try {
        const response = await sendChatFile(chatId, text, file);
        const data = await response.json();

        if (!response.ok) {
          showMessage(
            result,
            getApiErrorMessage(data, 'Не удалось отправить файл.'),
            true
          );
          return;
        }

        textInput.value = '';
        textInput.style.height = 'auto';
        fileInput.value = '';

        if (selectedFileName) {
          selectedFileName.classList.add('hidden');
          selectedFileName.textContent = '';
        }

        result.textContent = '';
      } catch {
        showMessage(result, 'Сервер недоступен или возникла ошибка сети.', true);
      }

      return;
    }

    if (!activeChatSocket || activeChatSocket.readyState !== WebSocket.OPEN) {
      showMessage(result, 'Соединение с чатом потеряно. Откройте чат заново.', true);
      return;
    }

    activeChatSocket.send(JSON.stringify({ text }));

    textInput.value = '';
    textInput.style.height = 'auto';
    result.textContent = '';
  });
}

function bindChatSearch(role) {
  const input = document.getElementById('chatSearchInput');
  if (!input) return;

  input.addEventListener('input', () => {
    chatSearchQuery = input.value.trim();
    refreshChatCards(role);
  });
}

function bindChatListActions(role) {
  document.querySelectorAll('[data-open-chat-inline]').forEach((button) => {
    button.addEventListener('click', async () => {
      await openChatInline(button.dataset.openChatInline, role);
    });
  });
}

function bindChatActions(role) {
  bindChatSearch(role);
  bindChatListActions(role);
}