const { app } = require('@azure/functions');
const { requestJson } = require('../lib/aiClient');
const { buildInspectMessages } = require('../lib/prompts');
const { json, errorResponse } = require('./_helpers');

app.http('inspect', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'inspect',
  handler: async (request) => {
    const body = await request.json().catch(() => ({}));
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (text.length < 10) return json(400, { error: '검사할 문장을 10자 이상 입력해주세요.' });

    try {
      const result = await requestJson(buildInspectMessages(text));
      const keys = ['natural', 'info', 'politeness', 'ambiguity'];
      const status = Object.fromEntries(keys.map((key) => [key, ['green', 'yellow', 'red'].includes(result.status?.[key]) ? result.status[key] : 'yellow']));
      const issues = Array.isArray(result.issues) ? result.issues.filter((issue) => issue && typeof issue.reason === 'string').map((issue) => ({ category: typeof issue.category === 'string' ? issue.category : '확인할 점', quote: typeof issue.quote === 'string' ? issue.quote : '', reason: issue.reason, suggestion: typeof issue.suggestion === 'string' ? issue.suggestion : '' })) : [];
      return json(200, { status, issues });
    } catch (error) {
      return errorResponse(error, '문장을 검사하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  },
});
