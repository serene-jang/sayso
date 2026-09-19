const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('[data-view]');
const composeForm = document.querySelector('#compose-form');
const inspectForm = document.querySelector('#inspect-form');
const contactForm = document.querySelector('#contact-form');

function showView(viewName) {
  views.forEach((view) => {
    view.classList.toggle('is-visible', view.id === `${viewName}-view`);
  });

  navItems.forEach((item) => {
    item.classList.toggle('is-active', item.dataset.view === viewName);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-view]').forEach((item) => {
  item.addEventListener('click', () => showView(item.dataset.view));
});

function setFieldError(field, message) {
  const errorElement = document.querySelector(`#${field.id}-error`);

  field.classList.toggle('is-invalid', Boolean(message));
  field.setAttribute('aria-invalid', String(Boolean(message)));
  if (errorElement) {
    errorElement.textContent = message;
  }
}

function renderResults(versions, missingInfo) {
  const resultList = document.querySelector('#result-list');
  resultList.textContent = '';

  versions.forEach((version, index) => {
    const card = document.createElement('article');
    card.className = 'card result-card';
    card.dataset.resultIndex = String(index);

    const label = document.createElement('span');
    label.className = 'result-label';
    label.textContent = version.label;

    const text = document.createElement('p');
    text.className = 'result-text';
    text.textContent = version.text;

    const actions = document.createElement('div');
    actions.className = 'result-actions';
    actions.innerHTML = '<button type="button" data-result-action="copy">복사</button><button type="button" data-result-action="edit">수정</button><button type="button" data-result-action="regenerate">다시 생성</button><button type="button" data-result-action="inspect">검사하기</button><button type="button" data-result-action="save">대화에 저장</button>';

    card.append(label, text, actions);
    resultList.append(card);
  });

  const resultStatus = document.querySelector('#result-status');
  resultStatus.textContent = missingInfo.length > 0
    ? `확인이 필요한 정보: ${missingInfo.join(', ')}`
    : '';
}

function renderInspection(result) {
  const labels = {
    natural: '자연스러움',
    info: '정보 충분성',
    politeness: '예의 수준',
    ambiguity: '오해 가능성',
  };
  const statusList = document.querySelector('#inspection-status-list');
  statusList.textContent = '';

  Object.entries(labels).forEach(([key, label]) => {
    const row = document.createElement('div');
    row.className = 'status-row';
    const name = document.createElement('span');
    name.textContent = label;
    const dot = document.createElement('span');
    dot.className = `status-dot ${result.status[key]}`;
    dot.setAttribute('aria-label', result.status[key]);
    row.append(name, dot);
    statusList.append(row);
  });

  const issuesPanel = document.querySelector('#inspection-issues');
  issuesPanel.textContent = '';
  const heading = document.createElement('h3');
  heading.textContent = result.issues.length > 0 ? '확인할 점' : '확인할 점이 없습니다';
  issuesPanel.append(heading);

  if (result.issues.length === 0) {
    const message = document.createElement('p');
    message.className = 'muted';
    message.textContent = '현재 문장은 큰 문제 없이 전달할 수 있어요.';
    issuesPanel.append(message);
    return;
  }

  const issueList = document.createElement('div');
  issueList.className = 'issue-list';
  result.issues.forEach((issue) => {
    const issueCard = document.createElement('article');
    issueCard.className = 'issue-item';
    const category = document.createElement('strong');
    category.textContent = issue.category;
    const quote = document.createElement('p');
    quote.className = 'issue-quote';
    quote.textContent = issue.quote ? `“${issue.quote}”` : '';
    const reason = document.createElement('p');
    reason.textContent = issue.reason;
    issueCard.append(category, quote, reason);
    if (issue.suggestion) {
      const suggestion = document.createElement('p');
      suggestion.className = 'issue-suggestion';
      suggestion.textContent = `개선 방법: ${issue.suggestion}`;
      issueCard.append(suggestion);
    }
    issueList.append(issueCard);
  });
  issuesPanel.append(issueList);
}

function renderContacts() {
  const list = document.querySelector('#contacts-list');
  const contacts = loadContacts();
  list.textContent = '';

  if (contacts.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'muted';
    empty.textContent = '저장된 상대방이 없습니다.';
    list.append(empty);
    return;
  }

  contacts.forEach((contact) => {
    const item = document.createElement('li');
    item.className = 'list-item contact-item';
    item.dataset.contactId = contact.id;
    const details = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = contact.name;
    const topic = document.createElement('span');
    topic.textContent = `${contact.topic || '주제 없음'} · 최근 연락 ${new Date(contact.updatedAt).toLocaleDateString('ko-KR')}`;
    details.append(name, topic);
    const actions = document.createElement('div');
    actions.className = 'contact-actions';
    actions.innerHTML = '<button class="secondary-button" type="button" data-contact-action="open">열기</button><button class="secondary-button" type="button" data-contact-action="delete">삭제</button>';
    item.append(details, actions);
    list.append(item);
  });
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const temporaryInput = document.createElement('textarea');
  temporaryInput.value = text;
  temporaryInput.style.position = 'fixed';
  temporaryInput.style.opacity = '0';
  document.body.append(temporaryInput);
  temporaryInput.select();
  document.execCommand('copy');
  temporaryInput.remove();
}

async function regenerateResults() {
  const resultStatus = document.querySelector('#result-status');
  resultStatus.textContent = '새로운 표현을 만드는 중입니다.';

  try {
    const { versions, missingInfo = [] } = await generateMessage(window.saysoDraft);
    renderResults(versions, missingInfo);
    resultStatus.textContent = '새로운 표현을 만들었습니다.';
  } catch (error) {
    resultStatus.textContent = error.message;
  }
}

document.querySelector('#result-list')?.addEventListener('click', async (event) => {
  const actionButton = event.target.closest('[data-result-action]');
  if (!actionButton) {
    return;
  }

  const card = actionButton.closest('.result-card');
  const text = card.querySelector('.result-text').textContent;
  const action = actionButton.dataset.resultAction;
  const resultStatus = document.querySelector('#result-status');

  if (action === 'copy') {
    try {
      await copyText(text);
      resultStatus.textContent = '문장을 클립보드에 복사했습니다.';
    } catch {
      resultStatus.textContent = '복사하지 못했습니다. 문장을 직접 선택해 복사해주세요.';
    }
    return;
  }

  if (action === 'edit') {
    composeForm.elements.message.value = text;
    showView('compose');
    document.querySelector('#compose-status').textContent = '문장을 수정한 뒤 다시 작성할 수 있습니다.';
    return;
  }

  if (action === 'inspect') {
    document.querySelector('#inspect-text').value = text;
    showView('inspect');
    return;
  }

  if (action === 'save') {
    if (!window.saysoDraft) {
      resultStatus.textContent = '먼저 메시지를 작성해주세요.';
      return;
    }

    saveContact({
      name: window.saysoDraft.recipient,
      topic: window.saysoDraft.purpose,
      message: text,
    });
    renderContacts();
    resultStatus.textContent = '대화에 저장했습니다.';
    return;
  }

  actionButton.disabled = true;
  await regenerateResults();
  actionButton.disabled = false;
});

composeForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const situation = composeForm.elements.situation;
  const purpose = composeForm.elements.purpose;
  const message = composeForm.elements.message;
  const situationValue = situation.value.trim();
  const purposeValue = purpose.value.trim();
  const messageValue = message.value.trim();
  let isValid = true;

  setFieldError(situation, '');
  setFieldError(purpose, '');
  setFieldError(message, '');

  if (situationValue.length < 5) {
    setFieldError(situation, '상황을 5자 이상 적어주세요.');
    isValid = false;
  }

  if (purposeValue.length < 3) {
    setFieldError(purpose, '전달하려는 목적을 3자 이상 적어주세요.');
    isValid = false;
  }

  if (messageValue.length < 10) {
    setFieldError(message, '전달하고 싶은 내용을 10자 이상 적어주세요.');
    isValid = false;
  }

  const statusElement = document.querySelector('#compose-status');
  if (!isValid) {
    statusElement.textContent = '입력 내용을 확인해주세요.';
    return;
  }

  window.saysoDraft = {
    recipient: composeForm.elements.recipient.value,
    situation: situationValue,
    purpose: purposeValue,
    message: messageValue,
    tone: composeForm.elements.tone.value,
  };
  const submitButton = composeForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = '문장을 만드는 중...';
  statusElement.textContent = '상황에 맞는 표현을 준비하고 있습니다.';

  generateMessage(window.saysoDraft)
    .then(({ versions, missingInfo = [] }) => {
      renderResults(versions, missingInfo);
      statusElement.textContent = '문장을 만들었습니다.';
      showView('result');
    })
    .catch((error) => {
      statusElement.textContent = error.message;
    })
    .finally(() => {
      submitButton.disabled = false;
      submitButton.textContent = 'SAYSO로 작성하기';
    });
});

inspectForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const textField = document.querySelector('#inspect-text');
  const errorElement = document.querySelector('#inspect-error');
  const statusElement = document.querySelector('#inspect-status');
  const submitButton = inspectForm.querySelector('button[type="submit"]');
  const text = textField.value.trim();

  textField.classList.toggle('is-invalid', text.length < 10);
  errorElement.textContent = text.length < 10 ? '검사할 문장을 10자 이상 입력해주세요.' : '';
  if (text.length < 10) {
    statusElement.textContent = '입력 내용을 확인해주세요.';
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = '검사하는 중...';
  statusElement.textContent = '문장의 전달 상태를 살펴보고 있습니다.';

  try {
    const result = await inspectMessage(text);
    renderInspection(result);
    statusElement.textContent = '문장 검사가 완료되었습니다.';
  } catch (error) {
    statusElement.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = '문장 검사하기';
  }
});

document.querySelector('#refine-button')?.addEventListener('click', async () => {
  const text = document.querySelector('#inspect-text').value.trim();
  const direction = document.querySelector('#refine-direction').value;
  const button = document.querySelector('#refine-button');
  const resultElement = document.querySelector('#refined-text');
  const statusElement = document.querySelector('#refine-status');

  if (text.length < 10) {
    statusElement.textContent = '먼저 10자 이상의 문장을 입력해주세요.';
    return;
  }

  button.disabled = true;
  button.textContent = '개선하는 중...';
  statusElement.textContent = '원래 의도를 유지하면서 문장을 다듬고 있습니다.';
  resultElement.textContent = '';

  try {
    const result = await refineMessage(text, direction);
    resultElement.textContent = result.text;
    statusElement.textContent = '개선된 문장을 확인해주세요.';
  } catch (error) {
    statusElement.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = 'AI로 개선하기';
  }
});

contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = contactForm.elements.name.value.trim();
  const topic = contactForm.elements.topic.value.trim();
  const message = contactForm.elements.message.value.trim();
  const errorElement = document.querySelector('#contact-name-error');
  const statusElement = document.querySelector('#contact-status');

  errorElement.textContent = name.length < 2 ? '상대방 이름을 2자 이상 입력해주세요.' : '';
  if (name.length < 2) {
    statusElement.textContent = '입력 내용을 확인해주세요.';
    return;
  }

  saveContact({ name, topic, message });
  renderContacts();
  contactForm.reset();
  statusElement.textContent = '상대방과 대화 내용을 저장했습니다.';
});

document.querySelector('#contact-reset')?.addEventListener('click', () => {
  contactForm.reset();
  document.querySelector('#contact-status').textContent = '';
  document.querySelector('#contact-name-error').textContent = '';
});

document.querySelector('#contacts-list')?.addEventListener('click', (event) => {
  const actionButton = event.target.closest('[data-contact-action]');
  if (!actionButton) {
    return;
  }

  const item = actionButton.closest('.contact-item');
  const contact = loadContacts().find((savedContact) => savedContact.id === item.dataset.contactId);
  if (!contact) {
    return;
  }

  if (actionButton.dataset.contactAction === 'delete') {
    deleteContact(contact.id);
    renderContacts();
    return;
  }

  const recipientSelect = composeForm.elements.recipient;
  if (![...recipientSelect.options].some((option) => option.value === contact.name)) {
    const option = new Option(contact.name, contact.name);
    recipientSelect.add(option);
  }
  recipientSelect.value = contact.name;
  composeForm.elements.situation.value = contact.topic || '';
  composeForm.elements.purpose.value = contact.topic || '';
  composeForm.elements.message.value = contact.message || '';
  document.querySelector('#compose-status').textContent = '저장된 대화 내용을 불러왔습니다.';
  showView('compose');
});

renderContacts();
showView('home');
