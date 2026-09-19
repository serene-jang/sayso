const express = require('express');
const { requestJson } = require('../lib/aiClient');
const { buildGenerateMessages } = require('../lib/prompts');

const router = express.Router();

router.post('/', async (req, res) => {
  const { recipient, situation, purpose, message, tone } = req.body || {};
  const fields = { recipient, situation, purpose, message, tone };
  const missingFields = Object.entries(fields)
    .filter(([, value]) => typeof value !== 'string' || !value.trim())
    .map(([field]) => field);

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: '상대방, 상황, 전달 내용, 말투를 모두 입력해주세요.',
      fields: missingFields,
    });
  }

  try {
    const result = await requestJson(buildGenerateMessages({
      recipient: recipient.trim(),
      situation: situation.trim(),
      purpose: purpose.trim(),
      message: message.trim(),
      tone: tone.trim(),
    }));

    if (!Array.isArray(result.versions) || result.versions.length < 3) {
      throw new Error('AI 응답 형식이 올바르지 않습니다.');
    }

    const versions = result.versions.slice(0, 3).map((version) => ({
      label: typeof version.label === 'string' ? version.label : '표현',
      text: typeof version.text === 'string' ? version.text : '',
    }));

    if (versions.some((version) => !version.text.trim())) {
      throw new Error('AI 응답에 문장이 없습니다.');
    }

    return res.json({
      versions,
      missingInfo: Array.isArray(result.missingInfo) ? result.missingInfo : [],
    });
  } catch (error) {
    if (error.code === 'MISSING_AZURE_OPENAI_CONFIG') {
      return res.status(503).json({ error: 'Azure OpenAI 환경변수를 설정해주세요.' });
    }

    console.error('Generate request failed:', error.message);
    return res.status(502).json({ error: '문장을 만드는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.' });
  }
});

module.exports = router;
