function json(status, body) {
  return {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    jsonBody: body,
  };
}

function errorResponse(error, fallback) {
  if (error.code === 'MISSING_AZURE_OPENAI_CONFIG') {
    return json(503, { error: 'Azure OpenAI 환경변수를 설정해주세요.' });
  }
  console.error(error.message);
  return json(502, { error: fallback });
}

module.exports = { json, errorResponse };
