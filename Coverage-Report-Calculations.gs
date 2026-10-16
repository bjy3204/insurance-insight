/** @OnlyCurrentDoc */
// 이 파일 전체를 새 Apps Script 파일에 넣고 setupCoverageReport를 한 번 실행하세요.
function setupCoverageReport() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = coverageReportSheet_(book);
  if (sheet.getMaxColumns() < 105) {
    const last = sheet.getMaxColumns();
    sheet.insertColumnsAfter(last, 105 - last);
    sheet.getRange('G1:G63').copyFormatToRange(sheet, last + 1, 105, 1, 63);
  }
  const props = PropertiesService.getDocumentProperties();
  if (!props.getProperty('COVERAGE_REPORT_INITIALIZED')) {
    const range = sheet.getRange('E9:E63');
    const values = range.getValues(), formulas = range.getFormulas();
    values.forEach(function(row, i) {
      if (!formulas[i][0] && row[0] !== '' && !coverageManualOnlyRow_(i + 9)) {
        props.setProperty('COVERAGE_D_' + (i + 9), JSON.stringify(row[0]));
        const sources = sheet.getRange(i + 9, 6, 1, Math.min(100, sheet.getMaxColumns() - 5)).getValues()[0];
        props.setProperty('COVERAGE_D_SOURCE_' + (i + 9), sources.every(v => v === '') ? 'EMPTY' : 'FILLED');
      }
    });
  }
  const handlers = ['coverageReportEdit', 'coverageReportOpen', 'coverageReportDaily'];
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (handlers.includes(trigger.getHandlerFunction())) ScriptApp.deleteTrigger(trigger);
  });
  const editTrigger = ScriptApp.newTrigger('coverageReportEdit');
  const editSource = editTrigger.forSpreadsheet(book);
  const editEvent = editSource.onEdit();
  editEvent.create();
  const openTrigger = ScriptApp.newTrigger('coverageReportOpen');
  const openSource = openTrigger.forSpreadsheet(book);
  const openEvent = openSource.onOpen();
  openEvent.create();
  const dailyTrigger = ScriptApp.newTrigger('coverageReportDaily');
  const dailyClock = dailyTrigger.timeBased();
  dailyClock.everyDays(1);
  dailyClock.atHour(0);
  dailyClock.inTimezone('Asia/Seoul');
  dailyClock.create();
  props.setProperty('COVERAGE_REPORT_BOOK', book.getId());
  props.setProperty('COVERAGE_REPORT_INITIALIZED', '1');
  coverageSummarySetup_(book);
  coverageNormalizeYears_(sheet, 6, Math.min(105, sheet.getMaxColumns()));
  coverageNormalizePremiums_(sheet, 6, Math.min(105, sheet.getMaxColumns()));
  coverageNormalizeDates_(book, sheet, 4, 5, 6, Math.min(105, sheet.getMaxColumns()));
  coverageNormalizeAmounts_(sheet, 9, 63, 6, Math.min(105, sheet.getMaxColumns()));
  coverageReportRefresh_(book);
  coverageUpdateVisibleColumns_(sheet, null, true);
  if (sheet.getMaxRows() > 63) sheet.hideRows(64, sheet.getMaxRows() - 63);
  book.toast('자동 계산 설정이 완료되었습니다.', '보장분석');
}

function coverageReportSheet_(book) {
  const sheet = book.getSheets().find(function(s) { return s.getSheetId() === 1547742226; });
  if (!sheet) throw new Error('보장분석 시트를 찾지 못했습니다.');
  return sheet;
}

function coverageManualOnlyRow_(row) { return [40, 41, 43].includes(row); }

function coverageReportEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getSheetId() === 1430086215) { coverageSummaryEdit_(e); return; }
  if (sheet.getSheetId() !== 1547742226) return;
  const first = e.range.getRow(), last = e.range.getLastRow();
  const left = e.range.getColumn(), right = e.range.getLastColumn();
  if (first > 63) return;
  const lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try {
    const book = e.source || sheet.getParent();
    if (first <= 3 && last >= 3 && right >= 6 && left <= 105) {
      coverageNormalizeYears_(sheet, Math.max(6, left), Math.min(105, right));
    }
    if (first <= 8 && last >= 8 && right >= 6 && left <= 105) {
      coverageNormalizePremiums_(sheet, Math.max(6, left), Math.min(105, right));
    }
    if (first <= 5 && last >= 4 && right >= 6 && left <= 105) {
      coverageNormalizeDates_(book, sheet, Math.max(4, first), Math.min(5, last),
        Math.max(6, left), Math.min(105, right), e);
    }
    if (last >= 9 && first <= 63 && right >= 6 && left <= 105) {
      coverageNormalizeAmounts_(sheet, Math.max(9, first), Math.min(63, last),
        Math.max(6, left), Math.min(105, right));
    }
    // 원래 D열은 맨 앞 열 추가 후 E열로 이동했다.
    if (left <= 5 && right >= 5 && last >= 9) {
      const start = Math.max(9, first), end = Math.min(63, last);
      const values = sheet.getRange(start, 5, end - start + 1, 1).getValues();
      const props = PropertiesService.getDocumentProperties();
      values.forEach(function(row, i) {
        const number = start + i;
        if (coverageManualOnlyRow_(number)) return;
        const key = 'COVERAGE_D_' + number;
        if (row[0] === '') {
          props.deleteProperty(key);
          props.deleteProperty('COVERAGE_D_SOURCE_' + number);
        } else {
          props.setProperty(key, JSON.stringify(row[0]));
          const sources = sheet.getRange(number, 6, 1, Math.min(100, sheet.getMaxColumns() - 5)).getValues()[0];
          props.setProperty('COVERAGE_D_SOURCE_' + number, sources.every(v => v === '') ? 'EMPTY' : 'FILLED');
        }
      });
    }
    // 보험 입력을 지워 한 행이 비면 그 행의 기존 수동 합계도 해제한다.
    if (right >= 6 && left <= 105 && last >= 9 && first <= 63) {
      const props = PropertiesService.getDocumentProperties();
      const start = Math.max(9, first), end = Math.min(63, last);
      const rows = sheet.getRange(start, 6, end - start + 1, Math.min(100, sheet.getMaxColumns() - 5)).getValues();
      rows.forEach(function(values, i) {
        const number = start + i;
        if (!coverageManualOnlyRow_(number) && values.every(v => v === '') && !(left <= 5 && right >= 5)) {
          props.deleteProperty('COVERAGE_D_' + number);
          props.deleteProperty('COVERAGE_D_SOURCE_' + number);
        }
      });
    }
    coverageReportRefresh_(e.source || sheet.getParent());
  } finally { lock.releaseLock(); }
}

function coverageDateText_(value, year, timezone) {
  if (value === '' || value === null || value === undefined) return '';
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) return null;
    value = Utilities.formatDate(value, timezone, 'yyyy-MM-dd');
  }
  const text = String(value).trim();
  let y = year, month, day;
  let match = text.match(/^(\d{4}|\d{2})\s*(?:년|[-./])\s*(\d{1,2})\s*(?:월|[-./,])\s*(\d{1,2})\s*일?\s*\.?$/);
  if (match) {
    y = Number(match[1]); if (match[1].length === 2) y += 2000;
    month = Number(match[2]); day = Number(match[3]);
  } else if ((match = text.match(/^(\d{1,2})\s*(?:월|[-./])\s*(\d{1,2})\s*일?\s*\.?$/))) {
    month = Number(match[1]); day = Number(match[2]);
  } else if (/^\d{8}$/.test(text)) {
    y = Number(text.slice(0, 4)); month = Number(text.slice(4, 6)); day = Number(text.slice(6));
  } else if (/^\d{6}$/.test(text)) {
    y = 2000 + Number(text.slice(0, 2)); month = Number(text.slice(2, 4)); day = Number(text.slice(4));
  } else if (/^\d{3,4}$/.test(text)) {
    const digits = text.padStart(4, '0'); month = Number(digits.slice(0, 2)); day = Number(digits.slice(2));
  } else if (/^\d{5}(?:\.\d+)?$/.test(text) && Number(text) >= 1 && Number(text) < 100000) {
    return new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(text)) * 86400000).toISOString().slice(0, 10);
  } else return null;
  const check = new Date(Date.UTC(y, month - 1, day));
  if (y < 1900 || y > 9999 || check.getUTCFullYear() !== y ||
      check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return y + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}

function coverageNormalizeDates_(book, sheet, first, last, left, right, event) {
  const timezone = 'Asia/Seoul';
  const year = Number(Utilities.formatDate(new Date(), timezone, 'yyyy'));
  const range = sheet.getRange(first, left, last - first + 1, right - left + 1);
  const values = range.getValues(), formulas = range.getFormulas();
  let invalid = false;
  values.forEach(function(row, r) {
    row.forEach(function(value, c) {
      if (formulas[r][c]) return;
      const cell = sheet.getRange(first + r, left + c);
      // 단일 입력은 Sheets가 날짜/숫자로 바꾸기 전의 원래 입력을 우선한다.
      const raw = event && event.range.getNumRows() === 1 && event.range.getNumColumns() === 1 &&
        event.value !== undefined ? event.value : value;
      const text = coverageDateText_(raw, year, timezone);
      if (text === null) {
        invalid = true;
        cell.setNumberFormat('@').setValue(String(raw));
      } else if (text === '') {
        cell.setNumberFormat('yyyy-mm-dd');
      } else {
        cell.setValue(Utilities.parseDate(text, timezone, 'yyyy-MM-dd')).setNumberFormat('yyyy-mm-dd');
      }
    });
  });
  if (invalid) book.toast('날짜의 연·월·일을 확인하세요. 예: 260101, 2026-01-01, 1월1일', '날짜 확인');
}

function coverageReportOpen(e) {
  coverageReportRunLocked_(e && e.source ? e.source : SpreadsheetApp.getActiveSpreadsheet());
}

function coverageReportDaily() {
  const id = PropertiesService.getDocumentProperties().getProperty('COVERAGE_REPORT_BOOK');
  if (id) coverageReportRunLocked_(SpreadsheetApp.openById(id));
}

function coverageReportRunLocked_(book) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try { coverageReportRefresh_(book); } finally { lock.releaseLock(); }
}

function coverageReportRefresh_(book) {
  const sheet = coverageReportSheet_(book);
  // 보험 100개: F:DA. 각 보험 열의 납입예정·납입완료도 계산한다.
  const columns = Math.min(105, sheet.getMaxColumns()) - 5;
  if (columns < 1) throw new Error('보험 입력 열이 없습니다.');
  const input = sheet.getRange(3, 6, 61, columns).getValues();
  const today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  const payment = coveragePaymentValues_(input, today, 'Asia/Seoul');
  sheet.getRange('B5').setValue(input[5].reduce(function(sum, value) {
    return sum + (coveragePremiumWon_(value) || 0);
  }, 0));
  sheet.getRange(6, 6, 2, columns).setValues(payment);
  const propertyStore = PropertiesService.getDocumentProperties();
  const props = propertyStore.getProperties();
  const existing = sheet.getRange('E9:E63').getValues();
  const output = existing.map(function(row, i) {
    const number = i + 9;
    if (coverageManualOnlyRow_(number)) return row;
    const key = 'COVERAGE_D_' + number;
    if (Object.prototype.hasOwnProperty.call(props, key)) {
      const empty = input[number - 3].every(v => v === '');
      if (!empty || props['COVERAGE_D_SOURCE_' + number] === 'EMPTY') return [JSON.parse(props[key])];
      propertyStore.deleteProperty(key);
      propertyStore.deleteProperty('COVERAGE_D_SOURCE_' + number);
    }
    const total = coverageNumericSum_(input[number - 3]);
    // 59행의 입력 단위는 원래부터 '억'. 나머지는 '만원'.
    return [coverageAmountText_(total, number === 59 ? 10000 : 1)];
  });
  sheet.getRange('E9:E63').setValues(output);
  coverageUpdateVisibleColumns_(sheet, input, false);
  coverageSummaryRefresh_(book);
}

function coverageSummaryMap_() {
  return [[8,2,9,3],[8,4,9,5],[8,6,12,3],[8,8,12,5],[8,10,16,3],[8,12,16,5],[9,2,10,3],[9,4,10,5],[9,6,13,3],[9,8,13,5],[9,10,17,3],[9,12,17,5],[10,2,11,3],[10,4,11,5],[10,6,14,3],[10,8,14,5],[10,10,18,3],[10,12,18,5],[11,4,12,5],[11,6,15,3],[11,8,15,5],[11,10,19,3],[11,12,19,5],[12,4,13,5],[12,8,16,5],[12,10,20,3],[12,12,20,5],[16,2,21,3],[16,4,21,5],[16,6,27,3],[16,8,27,5],[16,10,33,3],[16,12,33,5],[17,2,22,3],[17,4,22,5],[17,6,28,3],[17,8,28,5],[17,10,34,3],[17,12,34,5],[18,2,23,3],[18,4,23,5],[18,6,29,3],[18,8,29,5],[18,10,35,3],[18,12,35,5],[19,2,24,3],[19,4,24,5],[19,6,30,3],[19,8,30,5],[19,10,36,3],[19,12,36,5],[20,2,25,3],[20,4,25,5],[20,6,31,3],[20,8,31,5],[20,10,37,3],[20,12,37,5],[21,2,26,3],[21,4,26,5],[21,6,32,3],[21,8,32,5],[21,10,38,3],[21,12,38,5],[25,2,39,3],[25,4,39,5],[25,6,44,3],[25,8,44,5],[25,10,50,3],[25,12,50,5],[26,2,40,3],[26,4,40,5],[26,6,45,3],[26,8,45,5],[26,10,51,3],[26,12,51,5],[27,2,41,3],[27,4,41,5],[27,6,46,3],[27,8,46,5],[27,10,52,3],[27,12,52,5],[28,2,42,3],[28,4,42,5],[28,6,47,3],[28,8,47,5],[28,10,53,3],[28,12,53,5],[29,2,43,3],[29,4,43,5],[29,6,48,3],[29,8,48,5],[30,6,49,3],[30,8,49,5],[34,2,54,3],[34,4,54,5],[34,6,60,3],[34,8,60,5],[34,10,59,3],[34,12,59,5],[35,2,55,3],[35,4,55,5],[35,6,61,3],[35,8,61,5],[36,2,56,3],[36,4,56,5],[36,6,62,3],[36,8,62,5],[37,2,57,3],[37,4,57,5],[37,6,63,3],[37,8,63,5],[38,2,58,3],[38,4,58,5],[41,9,5,2],[42,8,6,6,158]];
}

function coverageSummarySheet_(book) {
  return book.getSheets().find(function(s) { return s.getSheetId() === 1430086215; });
}

function coverageSummarySourceValue_(mapping, source) {
  if (mapping.length === 5) {
    const row = source[mapping[2] - 1] || [];
    return row.slice(mapping[3] - 1, mapping[4]).reduce(function(total, value) {
      return total + (typeof value === 'number' ? value : 0);
    }, 0);
  }
  const value = (source[mapping[2] - 1] || [])[mapping[3] - 1];
  return value === undefined || value === null ? '' : value;
}

function coverageSummarySetup_(book) {
  const sheet = coverageSummarySheet_(book);
  if (!sheet) return;
  const props = PropertiesService.getDocumentProperties();
  if (props.getProperty('COVERAGE_SUMMARY_INITIALIZED')) return;
  const values = sheet.getRange('A1:M43').getValues();
  const formulas = sheet.getRange('A1:M43').getFormulas();
  const source = coverageReportSheet_(book).getRange(1, 1, 63, Math.min(158, coverageReportSheet_(book).getMaxColumns())).getValues();
  coverageSummaryMap_().forEach(function(m) {
    const value = values[m[0] - 1][m[1] - 1];
    if (value !== '' && !formulas[m[0] - 1][m[1] - 1]) {
      const key = 'COVERAGE_SUMMARY_' + m[0] + '_' + m[1];
      props.setProperty(key, JSON.stringify(value));
      props.setProperty(key + '_SOURCE', coverageSummarySourceValue_(m, source) === '' ? 'EMPTY' : 'FILLED');
    }
  });
  props.setProperty('COVERAGE_SUMMARY_INITIALIZED', '1');
}

function coverageSummaryRefresh_(book) {
  const sheet = coverageSummarySheet_(book);
  if (!sheet) return;
  const sourceSheet = coverageReportSheet_(book);
  const source = sourceSheet.getRange(1, 1, 63, Math.min(158, sourceSheet.getMaxColumns())).getValues();
  const props = PropertiesService.getDocumentProperties();
  const saved = props.getProperties();
  const groups = {};
  coverageSummaryMap_().forEach(function(m) {
    const key = 'COVERAGE_SUMMARY_' + m[0] + '_' + m[1];
    let value = coverageSummarySourceValue_(m, source);
    if (Object.prototype.hasOwnProperty.call(saved, key)) {
      if (value !== '' || saved[key + '_SOURCE'] === 'EMPTY') value = JSON.parse(saved[key]);
      else { props.deleteProperty(key); props.deleteProperty(key + '_SOURCE'); }
    }
    if (!groups[m[1]]) groups[m[1]] = [];
    groups[m[1]].push({row:m[0], value:value});
  });
  // 대상 셀끼리 이어진 구간만 쓴다. 제목·병합된 빈칸·직접 작성 영역은 건드리지 않는다.
  Object.keys(groups).forEach(function(column) {
    const cells = groups[column].sort(function(a,b) { return a.row-b.row; });
    let first = 0;
    for (let i = 1; i <= cells.length; i++) {
      if (i < cells.length && cells[i].row === cells[i-1].row + 1) continue;
      const target = sheet.getRange(cells[first].row, Number(column), i-first, 1);
      target.setValues(cells.slice(first,i).map(function(c) { return [c.value]; }));
      first = i;
    }
  });
}

function coverageSummaryEdit_(e) {
  const book = e.source || e.range.getSheet().getParent();
  const lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try {
    const sheet = e.range.getSheet();
    const props = PropertiesService.getDocumentProperties();
    const sourceSheet = coverageReportSheet_(book);
    const source = sourceSheet.getRange(1,1,63,Math.min(158,sourceSheet.getMaxColumns())).getValues();
    const values = e.range.getValues();
    coverageSummaryMap_().forEach(function(m) {
      if (m[0] < e.range.getRow() || m[0] > e.range.getLastRow() ||
          m[1] < e.range.getColumn() || m[1] > e.range.getLastColumn()) return;
      const key = 'COVERAGE_SUMMARY_' + m[0] + '_' + m[1];
      const value = values[m[0]-e.range.getRow()][m[1]-e.range.getColumn()];
      if (value === '') { props.deleteProperty(key); props.deleteProperty(key + '_SOURCE'); }
      else {
        props.setProperty(key, JSON.stringify(value));
        props.setProperty(key + '_SOURCE', coverageSummarySourceValue_(m,source) === '' ? 'EMPTY' : 'FILLED');
      }
    });
    coverageSummaryRefresh_(book);
  } finally { lock.releaseLock(); }
}

function coverageVisibleEnd_(lastUsed, maxColumns) {
  const end = lastUsed < 11 ? 11 : 11 + 3 * (Math.floor((lastUsed - 11) / 3) + 1);
  return Math.min(maxColumns, end);
}

function coverageUpdateVisibleColumns_(sheet, input, force) {
  const max = sheet.getMaxColumns();
  const columns = Math.min(105, max) - 5;
  const headers = sheet.getRange(1, 6, 2, columns).getValues();
  if (!input) input = sheet.getRange(3, 6, 61, columns).getValues();
  let lastUsed = 0;
  for (let c = 0; c < columns; c++) {
    const headerUsed = headers.some(row => row[c] !== '' && row[c] !== null);
    // 6·7행은 자동 계산 결과이므로 새 열을 여는 입력으로 세지 않는다.
    const inputUsed = input.some((row, r) => r !== 3 && r !== 4 && row[c] !== '' && row[c] !== null);
    if (headerUsed || inputUsed) lastUsed = c + 6;
  }
  const end = coverageVisibleEnd_(lastUsed, max);
  const props = PropertiesService.getDocumentProperties();
  const key = 'COVERAGE_VISIBLE_END';
  if (!force && props.getProperty(key) === String(end)) return;
  sheet.showColumns(1, end);
  if (end < max) sheet.hideColumns(end + 1, max - end);
  props.setProperty(key, String(end));
}

function coverageNumericSum_(values) {
  return values.reduce(function(sum, value) {
    const number = coverageAmountNumber_(value);
    return sum + (typeof number === 'number' ? number : 0);
  }, 0);
}

function coverageAmountNumber_(value) {
  if (value === '') return '';
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const digits = String(value).replace(/[^0-9.+-]/g, '');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(digits)) return null;
  const number = Number(digits);
  return Number.isFinite(number) ? number : null;
}

function coverageNormalizeYears_(sheet, left, right) {
  const range = sheet.getRange(3, left, 1, right - left + 1);
  const values = range.getValues()[0], formulas = range.getFormulas()[0];
  const formats = values.map(function(value, i) {
    if (!formulas[i] && typeof value === 'string' && /[가-힣]/.test(value)) return '@';
    return '#,##0.########"년납"';
  });
  range.setNumberFormats([formats]);
}

function coverageNormalizePremiums_(sheet, left, right) {
  const range = sheet.getRange(8, left, 1, right - left + 1);
  const values = range.getValues()[0], formulas = range.getFormulas()[0];
  const formats = values.map(function(value, i) {
    if (!formulas[i] && typeof value === 'string' && /[가-힣]/.test(value)) return '@';
    return '#,##0.########"원"';
  });
  range.setNumberFormats([formats]);
}

// 보험료 입력은 단위를 해석해 원으로 환산한다. 가입금액의 숫자 추출 규칙과 별개다.
function coveragePremiumWon_(value) {
  if (value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  let text = String(value).replace(/[,\s₩]/g, '');
  if (!text) return 0;
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:원)?$/.test(text)) {
    return Number(text.replace(/원$/, ''));
  }
  let total = 0, matched = false;
  text = text.replace(/(\d+(?:\.\d+)?)(억|만|천|백|십)(?:원)?/g, function(full, number, unit) {
    const factor = {억:100000000, 만:10000, 천:1000, 백:100, 십:10}[unit];
    total += Number(number) * factor;
    matched = true;
    return '';
  });
  if (!matched) return null;
  if (text && !/^\d+(?:\.\d+)?원?$/.test(text)) return null;
  if (text) total += Number(text.replace(/원$/, ''));
  return Number.isFinite(total) ? total : null;
}

function coverageInputAmountFormat_(value, row) {
  if (coverageManualOnlyRow_(row)) return 'General';
  if (row === 59) return '#,##0.########"억"';
  if (typeof value !== 'number' || value < 10000) return '#,##0.########"만원"';
  // 숫자 자체는 만원 단위로 유지하고 표시 형식만 바꾼다.
  return '"' + coverageAmountText_(value, 1) + '"';
}

function coverageNormalizeAmounts_(sheet, first, last, left, right) {
  const range = sheet.getRange(first, left, last - first + 1, right - left + 1);
  const values = range.getValues(), formulas = range.getFormulas();
  const formats = values.map(function(row, r) {
    return row.map(function(value) {
      if (typeof value === 'string' && /[가-힣]/.test(value)) return '@';
      return coverageInputAmountFormat_(coverageAmountNumber_(value), first + r);
    });
  });
  values.forEach(function(row, r) {
    row.forEach(function(value, c) {
      if (formulas[r][c]) return;
      if (coverageManualOnlyRow_(first + r)) return;
      if (typeof value === 'string' && /[가-힣]/.test(value)) return;
      const number = coverageAmountNumber_(value);
      if (number !== null && number !== value) sheet.getRange(first + r, left + c).setValue(number);
    });
  });
  range.setNumberFormats(formats);
}

function coverageAmountText_(sum, multiplier) {
  const value = sum * multiplier;
  if (value === 0) return '';
  const billion = Math.floor(value / 10000);
  const rest = Math.round(value - billion * 10000);
  const grouped = function(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  if (value < 10000) return grouped(Math.round(value)) + '만원';
  if (rest === 10000) return (billion + 1) + '억';
  return billion + '억' + (rest ? ' ' + grouped(rest) + '만원' : '');
}

function coveragePaymentValues_(input, today, timezone) {
  const remaining = [], paid = [];
  const now = today.split('-').map(Number);
  for (let c = 0; c < input[0].length; c++) {
    const startValue = input[1][c];
    if (startValue === '') { remaining.push(''); paid.push(''); continue; }
    const startText = coverageDateText_(startValue, now[0], timezone);
    if (!startText) { remaining.push(''); paid.push(''); continue; }
    const start = startText.split('-').map(Number);
    const parsedYears = coverageAmountNumber_(input[0][c]);
    if (typeof parsedYears !== 'number' || parsedYears < 0) {
      remaining.push(''); paid.push(''); continue;
    }
    const years = parsedYears;
    const premium = coveragePremiumWon_(input[5][c]) || 0;
    const months = Math.max(0, years * 12);
    const elapsed = Math.max(0, (now[0] - start[0]) * 12 + now[1] - start[1] - (now[2] < start[2] ? 1 : 0));
    const complete = Math.min(months, elapsed);
    remaining.push((months - complete) * premium);
    paid.push(complete * premium);
  }
  return [remaining, paid];
}
