const express = require('express');
const { requestJson } = require('../lib/aiClient');
const { buildInspectMessages } = require('../lib/prompts');

const router = express.Router();

router.post('/', async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';

  if (text.length < 10) {
    return res.status(400).json({ error: '검사할 문장을 10자 이상 입력해주세요.' });
  }

  try {
    const result = await requestJson(buildInspectMessages(text));
    const requiredStatuses = ['natural', 'info', 'politeness', 'ambiguity'];
    const status = Object.fromEntries(requiredStatuses.map((key) => [
      key,
      ['green', 'yellow', 'red'].includes(result.status?.[key]) ? result.status[key] : 'yellow',
    ]));
    const issues = Array.isArray(result.issues)
      ? result.issues.filter((issue) => issue && typeof issue.reason === 'string').map((issue) => ({
        category: typeof issue.category === 'string' ? issue.category : '확인할 점',
        quote: typeof issue.quote === 'string' ? issue.quote : '',
        reason: issue.reason,
        suggestion: typeof issue.suggestion === 'string' ? issue.suggestion : '',
      }))
      : [];

    return res.json({ status, issues });
  } catch (error) {
    if (error.code === 'MISSING_AZURE_OPENAI_CONFIG') {
      return res.status(503).json({ error: 'Azure OpenAI 환경변수를 설정해주세요.' });
    }

    console.error('Inspect request failed:', error.message);
    return res.status(502).json({ error: '문장을 검사하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.' });
  }
});

module.exports = router;
