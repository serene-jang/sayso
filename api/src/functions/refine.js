const { app } = require('@azure/functions');
const { requestJson } = require('../lib/aiClient');
const { buildRefineMessages } = require('../lib/prompts');
const { json, errorResponse } = require('./_helpers');

const directions = new Set(['polite', 'natural', 'shorter', 'softer', 'clearer']);

app.http('refine', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'refine',
  handler: async (request) => {
    const body = await request.json().catch(() => ({}));
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const direction = typeof body.direction === 'string' ? body.direction : '';
    if (text.length < 10 || !directions.has(direction)) return json(400, { error: '문장과 개선 방향을 확인해주세요.' });

    try {
      const result = await requestJson(buildRefineMessages({ text, direction }));
      if (typeof result.text !== 'string' || !result.text.trim()) throw new Error('AI 개선 결과가 비어 있습니다.');
      return json(200, { text: result.text.trim() });
    } catch (error) {
      return errorResponse(error, '문장을 개선하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  },
});
