const { AzureOpenAI, OpenAI } = require('openai');

let client;

function getClient() {
  const requiredSettings = {
    AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_DEPLOYMENT: process.env.AZURE_OPENAI_DEPLOYMENT,
    AZURE_OPENAI_API_VERSION: process.env.AZURE_OPENAI_API_VERSION,
  };
  const missingSettings = Object.entries(requiredSettings)
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingSettings.length > 0) {
    const error = new Error(`Azure OpenAI 환경변수가 없습니다: ${missingSettings.join(', ')}`);
    error.code = 'MISSING_AZURE_OPENAI_CONFIG';
    throw error;
  }

  const endpoint = requiredSettings.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, '');
  const isV1Endpoint = /\/openai\/v1(?:\/responses)?$/i.test(endpoint);

  if (isV1Endpoint) {
    const baseURL = endpoint.replace(/\/responses$/i, '').replace(/\/?$/, '/');
    client = new OpenAI({
      apiKey: requiredSettings.AZURE_OPENAI_API_KEY,
      baseURL,
    });
  } else {
    client = new AzureOpenAI({
      apiKey: requiredSettings.AZURE_OPENAI_API_KEY,
      endpoint,
      deployment: requiredSettings.AZURE_OPENAI_DEPLOYMENT,
      apiVersion: requiredSettings.AZURE_OPENAI_API_VERSION,
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
  if (!content) {
    throw new Error('AI 응답이 비어 있습니다.');
  }

  return JSON.parse(content);
}

module.exports = { requestJson };
