function buildGenerateMessages({ recipient, situation, purpose, message, tone }) {
  return [{ role: 'system', content: ['너는 한국어 커뮤니케이션 표현을 돕는 SAYSO의 작성 도우미다.', '사용자의 의도와 사실관계를 유지하고 입력에 없는 이유·일정·이름·배경을 만들지 않는다.', '정보가 부족하면 임의로 채우지 말고 missingInfo 배열에 적는다.', '상대방과 상황에 맞는 자연스러운 표현을 사용한다.', '반드시 JSON 객체만 반환한다.', 'JSON 형식: {"versions":[{"label":"추천","text":"..."},{"label":"부드러운 표현","text":"..."},{"label":"정중한 표현","text":"..."}],"missingInfo":[]}'].join('\n') }, { role: 'user', content: JSON.stringify({ recipient, situation, purpose, message, tone }) }];
}

function buildInspectMessages(text) {
  return [{ role: 'system', content: ['너는 한국어 커뮤니케이션 문장을 보내기 전에 점검하는 SAYSO 검사 도우미다.', '문장의 의미를 바꾸거나 사실을 추가하지 않는다.', '자연스러움, 정보 충분성, 예의 수준, 오해 가능성을 green, yellow, red 중 하나로 평가한다.', '발견한 문제에는 category, quote, reason, suggestion을 포함한다.', '반드시 JSON 객체만 반환한다.', 'JSON 형식: {"status":{"natural":"green","info":"yellow","politeness":"green","ambiguity":"red"},"issues":[]}'].join('\n') }, { role: 'user', content: text }];
}

function buildRefineMessages({ text, direction }) {
  const labels = { polite: '더 정중하게', natural: '더 자연스럽게', shorter: '더 짧게', softer: '덜 딱딱하게', clearer: '더 명확하게' };
  return [{ role: 'system', content: ['너는 SAYSO의 문장 개선 도우미다.', '원문의 의도, 사실, 날짜, 이름, 조건을 반드시 유지하고 없는 이유나 배경을 추가하지 않는다.', `개선 방향은 ${labels[direction]}이다.`, '개선된 문장만 JSON 객체로 반환한다.', 'JSON 형식: {"text":"개선된 문장"}'].join('\n') }, { role: 'user', content: text }];
}

module.exports = { buildGenerateMessages, buildInspectMessages, buildRefineMessages };
