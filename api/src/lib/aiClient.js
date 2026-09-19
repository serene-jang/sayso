const { AzureOpenAI, OpenAI } = require('openai');

let client;

function getClient() {
  const settings = {
    key: process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION,
  };
  const missing = Object.entries(settings)
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    const error = new Error(`Azure OpenAI 환경변수가 없습니다: ${missing.join(', ')}`);
    error.code = 'MISSING_AZURE_OPENAI_CONFIG';
    throw error;
  }

  const endpoint = settings.endpoint.replace(/\/+$/, '');
  if (/\/openai\/v1(?:\/responses)?$/i.test(endpoint)) {
    client = new OpenAI({
      apiKey: settings.key,
      baseURL: `${endpoint.replace(/\/responses$/i, '')}/`,
    });
  } else {
    client = new AzureOpenAI({
      apiKey: settings.key,
      endpoint,
      deployment: settings.deployment,
      apiVersion: settings.apiVersion,
    });
  }
  return client;
}

async function requestJson(messages) {
  const response = await getClient().chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT,
    messages,
    response_format: { type: 'json_object' },
  });
  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI 응답이 비어 있습니다.');
  return JSON.parse(content);
}

module.exports = { requestJson };
