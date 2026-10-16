// 고객 LIST에서 여는 고객등록 입력창입니다.
function openCustomerRegistration() {
  openCustomerDialog2();
}

function openCustomerDialog2() {
  const html = HtmlService.createHtmlOutput(CUSTOMER_DIALOG_HTML_2)
    .setWidth(820).setHeight(720);
  SpreadsheetApp.getUi().showModalDialog(html, '고객등록');
}

function setupCustomerListButton() {
  const sheet = crmSheet_(SpreadsheetApp.getActiveSpreadsheet(),'고객 LIST');
  if (!sheet) throw new Error('고객 LIST 시트를 찾지 못했습니다.');
  const drawings = sheet.getDrawings();
  const assigned = drawings.filter(d => ['openCustomerRegistration','openCustomerDialog2'].includes(d.getOnAction()));
  const button = assigned.length === 1 ? assigned[0] : drawings.length === 1 ? drawings[0] : null;
  if (!button) throw new Error('고객 LIST에 고객등록 그림을 만들고 openCustomerRegistration을 할당해주세요.');
  button.setPosition(2,17,0,0).setWidth(160).setHeight(38).setOnAction('openCustomerRegistration');
}

function getCustomerDialogOptions2() {
  const menu = crmSheet_(SpreadsheetApp.getActiveSpreadsheet(),'메뉴 추가');
  if (!menu) throw new Error('메뉴 추가 시트를 찾지 못했습니다.');
  const rows = menu.getRange(3,2,Math.max(1,menu.getLastRow()-2),3).getDisplayValues();
  const unique = index => [...new Set(rows.map(row=>row[index].trim()).filter(Boolean))];
  return {cards:unique(0),banks:unique(1),insurers:unique(2)};
}

function submitCustomerDialog2(data) {
  if (!data || typeof data !== 'object') throw new Error('입력값을 확인하세요.');
  const fields = {category:2,name:3,resident:4,phone:5,address:6,job:7,memo:8,payday:10,cardOwner:11,cardBirth:12,cardCompany:13,cardNumber:14,cardExpiry:15,accountOwner:17,accountBirth:18,bank:19,accountNumber:20,vehicleNumber:22,vehicleType:23,renewal:24,insurer:25,driver:26,discount:27,email:28};
  const input = {};
  Object.keys(fields).forEach(key=>{ input[key]=String(data[key]||'').trim(); });
  if (!input.name) throw new Error('고객 이름을 입력하세요.');
  const digits=input.resident.replace(/\D/g,'');
  const birth=birthFromResidentNumber(digits);
  if (!birth) throw new Error('주민번호와 생년월일을 확인하세요.');
  input.resident=digits.length===6?digits:digits.slice(0,6)+'-'+digits.slice(6);
  input.cardOwner=input.cardOwner||input.name;
  input.accountOwner=input.accountOwner||input.name;
  input.cardBirth=input.cardBirth?normalizeBirth(input.cardBirth):birth;
  input.accountBirth=input.accountBirth?normalizeBirth(input.accountBirth):birth;
  input.phone=formatPhoneNumber(input.phone);
  input.cardExpiry=formatCardExpiry(input.cardExpiry);
  const opts=getCustomerDialogOptions2();
  const choices={category:['지인','소개','가족','DB','인하우스','산모교실'],cardCompany:opts.cards,bank:opts.banks,insurer:opts.insurers};
  Object.entries(choices).forEach(([key,values])=>{if(input[key]&&!values.includes(input[key]))throw new Error('구분·카드사·은행·보험사 목록을 확인하세요.');});
  const output=Array(27).fill('');
  Object.entries(fields).forEach(([key,col])=>{output[col-2]=literalText(input[key]);});
  if(input.payday)output[8]=parseCustomerPayday(input.payday);
  if(input.renewal)output[22]=parseRenewalDate(normalizeRenewalDialog2(input.renewal));
  const lock=LockService.getDocumentLock();
  if(!lock.tryLock(5000))throw new Error('다른 등록 작업 중입니다. 잠시 후 다시 등록하세요.');
  try {
    const list=crmSheet_(SpreadsheetApp.getActiveSpreadsheet(),'고객 LIST');
    if(!list)throw new Error('고객 LIST 시트를 찾지 못했습니다.');
    const rows=list.getRange(6,2,Math.max(1,list.getLastRow()-5),27).getDisplayValues();
    if(rows.some(row=>row[1].trim()===input.name&&row[2].replace(/\D/g,'').slice(0,6)===birth))throw new Error('같은 이름·생년월일의 고객이 있습니다. 고객 LIST에서 확인하고 수정하세요.');
    let dest=6;rows.forEach((row,i)=>{if(row.some(v=>v.trim()))dest=i+7;});
    if(dest>list.getMaxRows())list.insertRowsAfter(list.getMaxRows(),dest-list.getMaxRows());
    if(dest!==6){const base=list.getRange(6,2,1,27),target=list.getRange(dest,2,1,27);base.copyTo(target,SpreadsheetApp.CopyPasteType.PASTE_FORMAT,false);base.copyTo(target,SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION,false);}
    [4,5,12,14,15,18,20,22,28].forEach(col=>list.getRange(dest,col).setNumberFormat('@'));
    list.getRange(dest,10).setNumberFormat('0"일"');
    list.getRange(dest,24).setNumberFormat('m"월 "d"일"');
    list.getRange(dest,2,1,27).setValues([output]);
    refreshCustomerListLayout();
    refreshOperationalViews();
    refreshCrmCalendar();
    return {message:'등록 완료 · 고객 LIST '+dest+'행'};
  } finally {lock.releaseLock();}
}

function normalizeRenewalDialog2(value) {
  const text=String(value).trim();
  return /^\d{8}$/.test(text)?text.slice(0,4)+'-'+text.slice(4,6)+'-'+text.slice(6):text;
}
