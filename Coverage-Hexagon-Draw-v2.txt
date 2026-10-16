/** @OnlyCurrentDoc */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('리포트')
    .addItem('그래프 갱신', 'makeCoverageHexagon').addToUi();
}

function finishHexagonChart() { makeCoverageHexagon(); }

function makeCoverageHexagon() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const source = book.getSheets().find(s => s.getSheetId() === 483554277);
  if (!source) throw new Error('표지 그래프 시트를 찾지 못했습니다.');
  const rows = source.getRange('A2:D7').getValues();
  const payload = rows.map(r => ({name: String(r[0]), score: Number(r[3])}));
  if (payload.some(r => !Number.isFinite(r.score))) {
    throw new Error('표지 그래프 시트 D2:D7의 점수를 확인하세요.');
  }
  const token = Utilities.getUuid();
  CacheService.getUserCache().put('COVERAGE_DRAW_' + token, book.getId(), 600);
  const json = JSON.stringify({items: payload, token: token}).replace(/</g, '\\u003c');
  const html = '<!doctype html><html><head><meta charset="UTF-8"></head>' +
    '<body style="margin:12px;font-family:Arial,sans-serif">' +
    '<p id="state">그래프를 그리고 있습니다…</p>' +
    '<canvas id="plot" width="900" height="660" style="width:360px;height:264px"></canvas>' +
    '<script>(' + coverageCanvasClient_.toString() + ')(' + json + ');</script></body></html>';
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(400).setHeight(340), '보장분석 그래프 갱신'
  );
}

function coverageCanvasClient_(payload) {
  const canvas = document.getElementById('plot');
  canvas.width = 900;
  canvas.height = 660;
  const ctx = canvas.getContext('2d');
  ctx.scale(0.5, 0.5);
  const cx = 900, cy = 650, radius = 430;
  const max = Math.max(1, ...payload.items.map(r => r.score));
  const point = function(i, ratio) {
    const angle = i * Math.PI / 3;
    return [cx + Math.sin(angle) * radius * ratio, cy - Math.cos(angle) * radius * ratio];
  };
  const polygon = function(ratios) {
    ctx.beginPath();
    ratios.forEach(function(r, i) {
      const p = point(i, r);
      if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
    });
    ctx.closePath();
  };
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#cfd3d8';
  ctx.lineWidth = 5;
  [0.25, 0.5, 0.75, 1].forEach(function(r) { polygon(Array(6).fill(r)); ctx.stroke(); });
  ctx.lineWidth = 4;
  for (let i = 0; i < 6; i++) {
    const p = point(i, 1);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p[0], p[1]); ctx.stroke();
  }
  polygon(payload.items.map(r => Math.max(0, Math.min(1, r.score / max))));
  ctx.fillStyle = 'rgba(255,145,28,0.22)'; ctx.fill();
  ctx.strokeStyle = '#ff911c'; ctx.lineWidth = 12; ctx.stroke();
  payload.items.forEach(function(r, i) {
    const p = point(i, Math.max(0, Math.min(1, r.score / max)));
    ctx.beginPath(); ctx.arc(p[0], p[1], 11, 0, Math.PI * 2);
    ctx.fillStyle = '#ff911c'; ctx.fill();
  });
  ctx.font = '500 66px "Malgun Gothic", "Noto Sans KR", sans-serif';
  ctx.fillStyle = '#30343b'; ctx.textBaseline = 'middle';
  payload.items.forEach(function(r, i) {
    const p = point(i, 1.18);
    ctx.textAlign = i === 0 || i === 3 ? 'center' : i < 3 ? 'left' : 'right';
    ctx.fillText(r.name, p[0], p[1]);
  });
  document.getElementById('state').textContent = '표지에 넣고 있습니다…';
  google.script.run.withSuccessHandler(function() {
    google.script.host.close();
  }).withFailureHandler(function(error) {
    document.getElementById('state').textContent = '저장 실패: ' + error.message;
  }).saveCoverageHexagonImage(coverageExportPng_(canvas), payload.token);

  function coverageExportPng_(source) {
    const output = document.createElement('canvas');
    output.width = 600;
    output.height = 440;
    output.getContext('2d').drawImage(source, 0, 0, 600, 440);
    return output.toDataURL('image/png');
  }
}

function saveCoverageHexagonImage(png, token) {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const cache = CacheService.getUserCache();
  const key = 'COVERAGE_DRAW_' + String(token);
  if (cache.get(key) !== book.getId()) throw new Error('그래프 갱신을 다시 실행하세요.');
  if (typeof png !== 'string' || !png.startsWith('data:image/png;base64,')) {
    throw new Error('이미지 형식이 올바르지 않습니다.');
  }
  const bytes = Utilities.base64Decode(png.split(',')[1]);
  if (bytes.length > 2000000) throw new Error('이미지 용량이 너무 큽니다.');
  const dimension = function(offset) {
    return (bytes[offset] & 255) * 16777216 + (bytes[offset + 1] & 255) * 65536 +
      (bytes[offset + 2] & 255) * 256 + (bytes[offset + 3] & 255);
  };
  const width = dimension(16), height = dimension(20);
  if (width !== 600 || height !== 440) {
    throw new Error('이전 코드가 실행 중입니다. 최신 코드 전체를 저장한 뒤 팝업을 다시 여세요. PNG: ' + width + '×' + height);
  }
  const cover = book.getSheets().find(s => s.getSheetId() === 1325894710);
  if (!cover) throw new Error('표지 시트를 찾지 못했습니다.');
  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);
  try {
    const marker = 'COVERAGE_HEXAGON_DRAW_V1';
    const oldImages = cover.getImages().filter(i => i.getAltTextTitle() === marker);
    const oldCharts = cover.getCharts().filter(c => [1328469023, 903618021].includes(c.getChartId()));
    const image = cover.insertImage(Utilities.newBlob(bytes, 'image/png', 'coverage-hexagon.png'), 7, 12);
    image.setWidth(300).setHeight(220).setAltTextTitle(marker)
      .setAltTextDescription('보장 수준: 후유장해, 암, 심장, 뇌, 수술, 입원');
    image.assignScript('makeCoverageHexagon');
    oldCharts.forEach(c => cover.removeChart(c));
    oldImages.forEach(i => i.remove());
    cache.remove(key);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
}
