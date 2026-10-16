/** @OnlyCurrentDoc */
// 이 스프레드시트의 확장 프로그램 > Apps Script에 추가하고 저장하세요.
// 기존 onEdit/onOpen 함수가 있다면 아래 핸들러 호출을 기존 함수에 합쳐야 합니다.
const CUSTOMER_FIELDS = {
  C6:2, F6:3, I6:4, C8:5, C10:6, F8:7, C12:8,
  C16:10, F16:11, I16:12, C18:13, F18:14, I18:15,
  C22:17, F22:18, I22:19, C24:20,
  C28:22, F28:23, I28:24, C30:25, F30:26, I30:27, I8:28
};

function onOpen(e) {
  refreshCrmCalendar();
  refreshMobileRegistrationNotes_();
  SpreadsheetApp.getUi().createMenu('고객 관리')
    .addItem('고객 등록', 'registerCustomer')
    .addItem('등록 기능 연결 완료', 'setupCustomerRegistration')
    .addToUi();
  refreshCustomerCard();
  refreshAllContractCustomerInfo();
  refreshCustomerListLayout();
  refreshOperationalViews();
}

function onEdit(e) {
  refreshMobileRegistrationNotes_(e && e.source);
  if(handleCrmCalendarEdit(e))return;
  if(handleContractEdit(e))return;
  if(e && e.range && crmSheetRole_(e.range.getSheet())==='고객 관리 카드') {
    refreshCustomerCard(e.source);
    return;
  }
  if(e && e.range && crmSheetRole_(e.range.getSheet())==='고객 등록' && e.range.getA1Notation()==='E32' && e.value==='TRUE') {
    try { registerCustomer(e.source); }
    finally { e.range.setValue(false); }
    return;
  }
  handleContactFormatEdit(e);
  handleRenewalEdit(e);
  handleCustomerEdit(e);
  if(e && e.range && crmSheetRole_(e.range.getSheet())==='고객 LIST'){
    refreshCustomerListLayout(e.source);
    refreshCustomerCard(e.source);
    refreshAllContractCustomerInfo(e.source);
    refreshOperationalViews(e.source);
    refreshCrmCalendar(e.source);
  }
}

function selectCustomerCardRows(rows,name,birth) {
  const key=String(name).trim();
  const dob=String(birth).replace(/\D/g,'').slice(-6).padStart(6,'0');
  if(!key)return [];
  return rows.map((row,index)=>({row,index})).filter(item=>
    String(item.row[2]).trim()===key && (!birth || String(item.row[3]).replace(/\D/g,'').slice(0,6)===dob));
}

function refreshCustomerCard(source) {
  const ss=source && typeof source.getSheetByName==='function'?source:SpreadsheetApp.getActiveSpreadsheet();
  const card=crmSheet_(ss,'고객 관리 카드'),list=crmSheet_(ss,'고객 LIST');
  if(!card||!list)return;
  clearCustomerCardContracts_(card);
  const mapping={E6:2,C8:4,C9:5,E10:28,C10:7,C11:6,C12:8,H8:22,J8:23,H9:25,J9:24,H10:26,J10:27,C15:10,E15:11,H15:17,J15:18,C16:13,E16:12,H16:19,J16:20,C17:14,E17:15};
  const targets=Object.keys(mapping).concat(['B1','E5','E8','E9','J4','H4','AH1','AH2','AH3']);
  card.getRangeList(targets).clearContent();
  const name=card.getRange('C4').getDisplayValue().trim();
  if(!name)return;
  const birth=card.getRange('C5').getDisplayValue().trim();
  const range=list.getRange(6,1,Math.max(1,list.getLastRow()-5),28);
  const display=range.getDisplayValues(),raw=range.getValues();
  const found=selectCustomerCardRows(display,name,birth);
  card.getRange('AH2').setValue(found.length);
  if(found.length!==1){
    card.getRange('B1').setValue(found.length===0?'검색 결과가 없습니다. 이름·생년월일을 확인하세요.':birth?'이름과 생년월일이 같은 고객이 여러 명입니다. 고객 LIST를 확인하세요.':'동명이인이 있습니다. 생년월일도 입력하세요.');
    return;
  }
  const item=found[0],row=item.row;
  refreshCustomerCardContracts_(ss,card,name,row[3]);
  Object.entries(mapping).forEach(([address,col])=>{
    const cell=card.getRange(address);
    if(address==='J9')cell.setNumberFormat('m"월 "d"일"').setValue(raw[item.index][col-1]);
    else if(address==='C15')cell.setNumberFormat('0"일"').setValue(raw[item.index][col-1]);
    else cell.setNumberFormat('@').setValue(literalText(row[col-1]));
  });
  card.getRange('AH3').setValue(item.index+6);
  const digits=row[3].replace(/\D/g,'');
  if(!birthFromResidentNumber(digits))return;
  const todayText=Utilities.formatDate(new Date(),ss.getSpreadsheetTimeZone(),'yyyy-MM-dd');
  const parts=todayText.split('-').map(Number),today=new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));
  const yy=Number(digits.slice(0,2)),month=Number(digits.slice(2,4)),day=Number(digits.slice(4,6));
  const century=digits.length===6?(yy<=parts[0]%100?2000:1900):'3478'.includes(digits[6])?2000:'1256'.includes(digits[6])?1900:1800;
  const year=century+yy;
  const age=parts[0]-year-((parts[1]<month||(parts[1]===month&&parts[2]<day))?1:0);
  card.getRange('E8').setValue(age).setNumberFormat('0"세"');
  card.getRange('E9').setValue(digits.length===13?(/[13579]/.test(digits[6])?'남':'여'):'');
  card.getRange('J8').setNumberFormat('@');
  card.getRange('J9').setNumberFormat('m"월 "d"일"');
  card.getRange('C15').setNumberFormat('0"일"');
  function shifted(y,m,d,offset){const base=new Date(Date.UTC(y,m-1+offset,1));const last=new Date(Date.UTC(base.getUTCFullYear(),base.getUTCMonth()+1,0)).getUTCDate();base.setUTCDate(Math.min(d,last));return base;}
  const base=shifted(year,month,day,6);
  let upper=new Date(Date.UTC(parts[0],base.getUTCMonth(),base.getUTCDate()));
  if(upper<today)upper=new Date(Date.UTC(parts[0]+1,base.getUTCMonth(),base.getUTCDate()));
  const serial=Math.round((upper.getTime()-Date.UTC(1899,11,30))/86400000),distance=Math.round((upper-today)/86400000);
  card.getRange('J4').setValue(serial).setNumberFormat('yyyy-mm-dd');
  card.getRange('H4').setValue(distance===0?'D-Day':'D-'+distance);
  card.getRange('AH1').setValue(age+(today>=shifted(year+age,month,day,6)?1:0));
}

function formatPhoneNumber(value) {
  const original=String(value).trim();
  if(!/^[0-9\s-]+$/.test(original))return original;
  const s=original.replace(/\D/g,'');
  if(/^02\d{7,8}$/.test(s))return s.slice(0,2)+'-'+s.slice(2,-4)+'-'+s.slice(-4);
  if(/^050[0-9]\d{8}$/.test(s))return s.slice(0,4)+'-'+s.slice(4,8)+'-'+s.slice(8);
  if(/^0\d{9,10}$/.test(s))return s.slice(0,3)+'-'+s.slice(3,-4)+'-'+s.slice(-4);
  if(/^1\d{7}$/.test(s))return s.slice(0,4)+'-'+s.slice(4);
  return original;
}

function formatCardExpiry(value) {
  const s=String(value).trim();
  if(!s)return '';
  if(!/^\d{2}\/?(0[1-9]|1[0-2])$/.test(s))throw new Error('유효기간은 YYMM 숫자 4자리로 입력하세요. 예: 2801 → 28/01');
  const digits=s.replace('/','');
  return digits.slice(0,2)+'/'+digits.slice(2);
}

function handleContactFormatEdit(e) {
  if(!e||!e.range)return;
  const sheet=e.range.getSheet(),name=crmSheetRole_(sheet);
  const configs=name==='고객 등록'?[{row:8,col:3,fn:formatPhoneNumber},{row:18,col:9,fn:formatCardExpiry}]:name==='고객 LIST'?[{row:null,col:5,fn:formatPhoneNumber},{row:null,col:15,fn:formatCardExpiry}]:[];
  configs.forEach(config=>{
    if(e.range.getColumn()>config.col||e.range.getLastColumn()<config.col)return;
    if(config.row!==null&&(e.range.getRow()>config.row||e.range.getLastRow()<config.row))return;
    const start=config.row===null?Math.max(6,e.range.getRow()):config.row,end=config.row===null?e.range.getLastRow():config.row;
    if(start>end)return;
    const range=sheet.getRange(start,config.col,end-start+1,1),values=range.getDisplayValues(),formulas=range.getFormulas();
    values.forEach((row,i)=>{
      if(!row[0]||formulas[i][0])return;
      const cell=sheet.getRange(start+i,config.col);
      try{cell.setNumberFormat('@').setValue(config.fn(row[0])).clearNote();}
      catch(error){cell.setNote(error.message);if(name==='고객 등록')sheet.getRange('B1').setValue(error.message);else e.source.toast(error.message,'유효기간',8);}
    });
  });
}

function handleRenewalEdit(e) {
  if (!e || !e.range) return;
  const sheet=e.range.getSheet(),name=crmSheetRole_(sheet);
  let column,start,end;
  if(name==='고객 등록' && e.range.getRow()<=28 && e.range.getLastRow()>=28 && e.range.getColumn()<=9 && e.range.getLastColumn()>=9){column=9;start=end=28;}
  else if(name==='고객 LIST' && e.range.getColumn()<=24 && e.range.getLastColumn()>=24 && e.range.getLastRow()>=6){column=24;start=Math.max(6,e.range.getRow());end=e.range.getLastRow();}
  else return;
  const range=sheet.getRange(start,column,end-start+1,1);
  const values=range.getValues(),formulas=range.getFormulas();
  values.forEach((row,i)=>{
    if(formulas[i][0] || row[0]==='' || row[0]===null)return;
    const cell=sheet.getRange(start+i,column);
    try {
      const value=row[0] instanceof Date
        ? Utilities.formatDate(row[0],e.source.getSpreadsheetTimeZone(),'yyyy-MM-dd')
        : row[0];
      cell.setValue(parseRenewalDate(value)).setNumberFormat('m"월 "d"일"');
      if(name==='고객 등록')cell.setNote('갱신일의 월·일을 확인하세요.\n예시 : 260901, 20260901, 26-09-01');
      else cell.clearNote();
    } catch(error) {
      cell.setNumberFormat('@').setNote(name==='고객 등록'
        ? error.message+'\n예시 : 260901, 20260901, 26-09-01'
        : error.message);
      if(name==='고객 등록')sheet.getRange('B1').setValue(error.message);
      else e.source.toast(error.message,'갱신일',8);
    }
  });
}

function handleCustomerEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (crmSheetRole_(sheet) === '고객 등록' && e.range.getRow() <= 6 && e.range.getLastRow() >= 6 && e.range.getColumn() <= 9 && e.range.getLastColumn() >= 9) {
    const cell = sheet.getRange('I6');
    if (!cell.getFormula()) {
      const current = cell.getDisplayValue();
      const formatted = formatResidentNumber(current);
      if (formatted !== current) cell.setNumberFormat('@').setValue(formatted);
    }
    return;
  }
  if (crmSheetRole_(sheet) !== '고객 LIST' || e.range.getLastRow() < 6) return;
  // 이름/주민번호/카드 및 청구 생년월일 입력·붙여넣기·지우기 모두 지원.
  const startCol = e.range.getColumn(), endCol = e.range.getLastColumn();
  if (![3,4,12,18].some(col => startCol <= col && col <= endCol)) return;
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(5000)) {
    e.source.toast('다른 등록 작업 중입니다. 주민번호 셀을 다시 편집해 주세요.', '고객 관리');
    return;
  }
  try {
    const start = Math.max(6, e.range.getRow()), end = e.range.getLastRow();
    const values = sheet.getRange(start,3,end-start+1,16).getDisplayValues();
    const formulas = sheet.getRange(start,3,end-start+1,16).getFormulas();
    values.forEach((row,i) => {
      if (startCol <= 4 && endCol >= 4 && !formulas[i][1]) {
        const formatted = formatResidentNumber(row[1]);
        if (formatted !== row[1]) sheet.getRange(start+i,4).setNumberFormat('@').setValue(formatted);
      }
      if (!row[0].trim()) return;
      const dob = birthFromResidentNumber(row[1]);
      if (!dob) return;
      [12,18].forEach(col => {
        const idx = col-3;
        // 직접 입력한 값이나 기존 수식을 덮어쓰지 않습니다.
        if (!row[idx].trim() && !formulas[i][idx])
          sheet.getRange(start+i,col).setNumberFormat('@').setValue(dob);
      });
    });
  } finally { lock.releaseLock(); }
}

function setupCustomerRegistration() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const form = crmSheet_(ss,'고객 등록');
  if (!form || !crmSheet_(ss,'고객 LIST')) throw new Error('고객등록 또는 고객 LIST 시트를 찾지 못했습니다.');
  setupCustomerButton();
  const list = crmSheet_(ss,'고객 LIST');
  if (list.getLastRow() >= 6) {
    handleCustomerEdit({source:ss,range:list.getRange(6,3,list.getLastRow()-5,16)});
  }
  form.getRange('I6').setNumberFormat('@');
  list.getRange(6,4,list.getMaxRows()-5,1).setNumberFormat('@');
  form.getRangeList(['B1','K4','K6','B36']).clearContent();
  ss.toast('등록 기능 연결 완료', '고객 관리');
}

function registerCustomer(source) {
  const ss = source && typeof source.getSheetByName === 'function'
    ? source : SpreadsheetApp.getActiveSpreadsheet();
  const form = crmSheet_(ss,'고객 등록');
  const list = crmSheet_(ss,'고객 LIST');
  if (!form || !list) throw new Error('고객등록 또는 고객 LIST 시트를 찾지 못했습니다.');
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(5000)) {
    form.getRange('B1').setValue('다른 등록 작업 중입니다. 잠시 후 다시 등록하세요.');
    return;
  }
  let committed = false;
  try {
    form.getRangeList(['B1','K4','K6','B36']).clearContent();
    const grid = form.getRange('A1:J32').getDisplayValues();
    const input = {};
    Object.keys(CUSTOMER_FIELDS).forEach(a => {
      const m = /^([A-Z])(\d+)$/.exec(a);
      input[a] = grid[Number(m[2])-1][m[1].charCodeAt(0)-65].trim();
    });
    const digits = input.I6.replace(/\D/g,'');
    const missingName = !input.F6;
    const invalidBirth = ![6,13].includes(digits.length) || !birthFromResidentNumber(digits);
    if (missingName) throw new Error('고객 이름을 입력하세요.');
    if (invalidBirth) throw new Error('주민번호와 생년월일을 확인하세요.');
    input.I6 = digits.length === 6 ? digits : digits.slice(0,6)+'-'+digits.slice(6);
    const dob = birthFromResidentNumber(digits);
    input.F16 = input.F16 || input.F6;
    input.C22 = input.C22 || input.F6;
    input.I16 = input.I16 ? normalizeBirth(input.I16) : dob;
    input.F22 = input.F22 ? normalizeBirth(input.F22) : dob;
    input.C8 = formatPhoneNumber(input.C8);
    input.I18 = formatCardExpiry(input.I18);
    const last = Math.max(6,list.getLastRow());
    const existing = list.getRange(6,3,last-5,2).getDisplayValues();
    if (existing.some(row => row[0].trim() === input.F6 && row[1].replace(/\D/g,'').slice(0,6) === dob))
      throw new Error('같은 이름·생년월일의 고객이 있습니다. 고객 LIST에서 확인하고 수정하세요.');
    let rowNumber = 6;
    existing.forEach((row,i) => { if (row.some(value => value.trim())) rowNumber = i+7; });
    // 다른 열에만 입력된 미완성 행도 덮어쓰지 않습니다.
    while (rowNumber <= list.getMaxRows() && list.getRange(rowNumber,2,1,27).getDisplayValues()[0].some(v => v.trim())) rowNumber++;
    if (rowNumber > list.getMaxRows()) list.insertRowsAfter(list.getMaxRows(),rowNumber-list.getMaxRows());
    const output = Array(27).fill('');
    Object.entries(CUSTOMER_FIELDS).forEach(([address,col]) => {
      output[col-2] = literalText(input[address]);
    });
    if (input.C16) {
      const day = parseCustomerPayday(input.C16);
      output[8] = day;
    }
    if (input.I28) {
      const renewalRaw=form.getRange('I28').getValue();
      output[22]=parseRenewalDate(renewalRaw instanceof Date
        ? Utilities.formatDate(renewalRaw,ss.getSpreadsheetTimeZone(),'yyyy-MM-dd')
        : renewalRaw);
    }
    [[2,'C6'],[13,'C18'],[19,'I22'],[25,'C30']].forEach(([col,address]) => {
      assertDropdownValue(list.getRange(6,col).getDataValidation(), input[address]);
    });
    if (rowNumber !== 6) {
      const template = list.getRange(6,2,1,27), target = list.getRange(rowNumber,2,1,27);
      template.copyTo(target,SpreadsheetApp.CopyPasteType.PASTE_FORMAT,false);
      template.copyTo(target,SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION,false);
    }
    [4,5,12,14,15,18,20,22,28].forEach(col => list.getRange(rowNumber,col).setNumberFormat('@'));
    list.getRange(rowNumber,10).setNumberFormat('0"일"');
    list.getRange(rowNumber,24).setNumberFormat('m"월 "d"일"');
    list.getRange(rowNumber,2,1,27).setValues([output]);
    committed = true;
    refreshCustomerListLayout(ss);
    refreshOperationalViews(ss);
    refreshCrmCalendar(ss);
    form.getRangeList(['B1','K4','K6','B36']).clearContent();
    form.getRangeList(Object.keys(CUSTOMER_FIELDS)).clearContent();
    ss.toast('고객 LIST에 등록했습니다.', '고객 등록');
  } catch (err) {
    const message = committed ? '저장은 완료됐으나 입력칸 정리에 실패했습니다. LIST를 먼저 확인하세요.' : err.message;
    // 먼저 발견한 오류 하나만 B1에 표시합니다.
    form.getRange('B1').setValue(message);
  } finally {
    lock.releaseLock();
  }
}

function parseCustomerPayday(value) {
  const text=String(value).trim();
  const day=Number(text);
  if(!/^[0-9]{1,2}$/.test(text)||!Number.isInteger(day)||day<1||day>31)
    throw new Error('카드 결제일은 1~31 사이의 숫자로 입력해 주세요.');
  return day;
}

function literalText(value) {
  // 사용자 텍스트가 수식으로 실행되지 않도록 처리합니다.
  return /^[=+\-@]/.test(value) ? "'"+value : value;
}

function setupCustomerButton() {
  const sheet = crmSheet_(SpreadsheetApp.getActiveSpreadsheet(),'고객 등록');
  const drawings = sheet.getDrawings();
  const assigned = drawings.filter(d => d.getOnAction() === 'registerCustomer');
  const button = assigned.length === 1 ? assigned[0] : drawings.length === 1 ? drawings[0] : null;
  if (!button) throw new Error('고객등록 그림이 하나인지 확인하거나 등록 그림에 registerCustomer를 할당해주세요.');
  button.setPosition(31,5,0,0).setWidth(220).setHeight(46).setOnAction('registerCustomer');
}

function formatResidentNumber(value) {
  const original = String(value);
  const s = original.trim();
  // 잘못된 문자나 길이를 조용히 삭제하지 않고 그대로 남깁니다.
  if (!/^\d{6}(?:-?\d{0,7})$/.test(s)) return original;
  const digits = s.replace('-','');
  return digits.slice(0,6)+'-'+digits.slice(6);
}

function birthFromResidentNumber(value) {
  const s = String(value).replace(/\D/g,'');
  if (![6,13].includes(s.length)) return '';
  const g = s[6];
  const century = s.length === 6
    ? (Number(s.slice(0,2)) <= new Date().getFullYear()%100 ? 2000 : 1900)
    : '3478'.includes(g) ? 2000 : '1256'.includes(g) ? 1900 : 1800;
  const year = century+Number(s.slice(0,2)), month = Number(s.slice(2,4)), day = Number(s.slice(4,6));
  const date = new Date(year,month-1,day);
  if (date.getFullYear() !== year || date.getMonth() !== month-1 || date.getDate() !== day || date > new Date()) return '';
  return s.slice(0,6);
}

function normalizeBirth(value) {
  const s = String(value).replace(/\D/g,'');
  if (s.length !== 6 && s.length !== 8) throw new Error('생년월일은 YYMMDD 6자리 또는 YYYYMMDD 8자리로 입력하세요.');
  const ymd = s.slice(-6), month = Number(ymd.slice(2,4)), day = Number(ymd.slice(4,6));
  const year = s.length === 8 ? Number(s.slice(0,4)) : 2000+Number(ymd.slice(0,2));
  const date = new Date(year,month-1,day);
  if (date.getFullYear() !== year || date.getMonth() !== month-1 || date.getDate() !== day)
    throw new Error('생년월일의 월·일을 확인하세요.');
  return ymd;
}

function parseRenewalDate(value) {
  let text;
  if(value instanceof Date){
    text=Utilities.formatDate(value,SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(),'yyyy-MM-dd');
  } else {
    text=String(value).trim();
  }
  let month,day,m;
  if(/^\d{8}$/.test(text)){month=Number(text.slice(4,6));day=Number(text.slice(6));}
  else if(/^\d{6}$/.test(text)){month=Number(text.slice(2,4));day=Number(text.slice(4));}
  else if(/^\d{3,4}$/.test(text)){month=Number(text.slice(0,-2));day=Number(text.slice(-2));}
  else if((m=/^(?:\d{2}|\d{4})\s*[-./]\s*(\d{1,2})\s*[-./]\s*(\d{1,2})$/.exec(text))){month=Number(m[1]);day=Number(m[2]);}
  else if((m=/^(?:\d{2,4}\s*년\s*)?(\d{1,2})\s*월\s*(\d{1,2})\s*일?$/.exec(text))){month=Number(m[1]);day=Number(m[2]);}
  else if((m=/^(\d{1,2})\s*[-./]\s*(\d{1,2})$/.exec(text))){month=Number(m[1]);day=Number(m[2]);}
  else throw new Error('갱신일의 월·일을 확인하세요. 예: 9월1일, 09-01, 20260901');
  const date=new Date(Date.UTC(2000,month-1,day));
  if(date.getUTCMonth()!==month-1||date.getUTCDate()!==day)throw new Error('갱신일의 월·일을 확인하세요.');
  return renewalDateFormula(month,day);
}

function renewalDateFormula(month,day) {
  return '=DATE(YEAR(TODAY())+IF(DATE(YEAR(TODAY()),'+month+','+day+')<TODAY(),1,0),'+month+','+day+')';
}

function nextRenewalSerial(month,day,todayText) {
  if(!todayText){
    const timezone=SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    todayText=Utilities.formatDate(new Date(),timezone,'yyyy-MM-dd');
  }
  const parts=todayText.split('-').map(Number);
  const passed=month<parts[1] || (month===parts[1] && day<parts[2]);
  const year=parts[0]+(passed?1:0);
  const next=new Date(Date.UTC(year,month-1,day));
  if(next.getUTCMonth()!==month-1 || next.getUTCDate()!==day)
    throw new Error('다음 갱신 연도에 존재하지 않는 날짜입니다. 월·일을 확인하세요.');
  return Math.round((next.getTime()-Date.UTC(1899,11,30))/86400000);
}

function assertDropdownValue(rule,value) {
  if (!value || !rule || rule.getAllowInvalid()) return;
  const type = rule.getCriteriaType(), args = rule.getCriteriaValues();
  let allowed = null;
  if (type === SpreadsheetApp.DataValidationCriteria.VALUE_IN_RANGE)
    allowed = args[0].getDisplayValues().flat().filter(Boolean);
  else if (type === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) allowed = args[0];
  if (allowed && !allowed.includes(value)) throw new Error('목록에서 카드사·은행·보험사를 선택하세요.');
}

