const express = require('express');
const { requestJson } = require('../lib/aiClient');
const { buildRefineMessages } = require('../lib/prompts');

const router = express.Router();
const directions = new Set(['polite', 'natural', 'shorter', 'softer', 'clearer']);

router.post('/', async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  const direction = typeof req.body?.direction === 'string' ? req.body.direction : '';

  if (text.length < 10 || !directions.has(direction)) {
    return res.status(400).json({ error: '문장과 개선 방향을 확인해주세요.' });
  }

  try {
    const result = await requestJson(buildRefineMessages({ text, direction }));
    if (typeof result.text !== 'string' || !result.text.trim()) {
      throw new Error('AI 개선 결과가 비어 있습니다.');
    }

    return res.json({ text: result.text.trim() });
  } catch (error) {
    if (error.code === 'MISSING_AZURE_OPENAI_CONFIG') {
      return res.status(503).json({ error: 'Azure OpenAI 환경변수를 설정해주세요.' });
    }

    console.error('Refine request failed:', error.message);
    return res.status(502).json({ error: '문장을 개선하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.' });
  }
});

module.exports = router;
