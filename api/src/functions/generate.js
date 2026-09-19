const { app } = require('@azure/functions');
const { requestJson } = require('../lib/aiClient');
const { buildGenerateMessages } = require('../lib/prompts');
const { json, errorResponse } = require('./_helpers');

app.http('generate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'generate',
  handler: async (request) => {
    const body = await request.json().catch(() => ({}));
    const fields = { recipient: body.recipient, situation: body.situation, purpose: body.purpose, message: body.message, tone: body.tone };
    const missing = Object.entries(fields).filter(([, value]) => typeof value !== 'string' || !value.trim()).map(([field]) => field);
    if (missing.length) return json(400, { error: '상대방, 상황, 전달 목적, 전달 내용, 말투를 모두 입력해주세요.', fields: missing });

    try {
      const result = await requestJson(buildGenerateMessages(Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.trim()]))));
      if (!Array.isArray(result.versions) || result.versions.length < 3) throw new Error('AI 응답 형식이 올바르지 않습니다.');
      const versions = result.versions.slice(0, 3).map((version) => ({ label: typeof version.label === 'string' ? version.label : '표현', text: typeof version.text === 'string' ? version.text : '' }));
      if (versions.some((version) => !version.text.trim())) throw new Error('AI 응답에 문장이 없습니다.');
      return json(200, { versions, missingInfo: Array.isArray(result.missingInfo) ? result.missingInfo : [] });
    } catch (error) {
      return errorResponse(error, '문장을 만드는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  },
});
