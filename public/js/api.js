const SAYSO_API_BASE = (window.SAYSO_API_BASE || '').replace(/\/$/, '');

function apiUrl(path) {
  return `${SAYSO_API_BASE}${path}`;
}

async function generateMessage(payload) {
  const response = await fetch(apiUrl('/api/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || '문장을 만드는 중 문제가 발생했습니다.');
  }

  return data;
}

async function inspectMessage(text) {
  const response = await fetch(apiUrl('/api/inspect'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || '문장을 검사하는 중 문제가 발생했습니다.');
  }

  return data;
}

async function refineMessage(text, direction) {
  const response = await fetch(apiUrl('/api/refine'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, direction }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || '문장을 개선하는 중 문제가 발생했습니다.');
  }

  return data;
}
