// 이름 대신 고유 ID로 시트를 연결합니다. 탭 이름과 열 제목 문구는 변경할 수 있습니다.
const CRM_SHEET_IDS = Object.freeze({
  '고객 등록':1922160955,
  '고객 LIST':254139861,
  '고객 관리 카드':284886991,
  '계약 입력':1724999388,
  '계약 목록':1396871157,
  '메뉴 추가':1057313260,
  '자동차보험':681395888,
  '카드수납':862162969,
  '캘린더':1276771145
});

function crmSheet_(ss,role) {
  const sheets=typeof ss.getSheets==='function'?ss.getSheets():[];
  const found=sheets.find(sheet=>sheet.getSheetId()===CRM_SHEET_IDS[role]);
  return found||ss.getSheetByName(role);
}

function crmSheetRole_(sheet) {
  if(typeof sheet.getSheetId==='function'){
    const id=sheet.getSheetId();
    const role=Object.keys(CRM_SHEET_IDS).find(key=>CRM_SHEET_IDS[key]===id);
    if(role)return role;
  }
  return sheet.getName();
}

// 실제 탭 이름으로 모바일 등록 안내를 갱신합니다.
function refreshMobileRegistrationNotes_(source) {
  const ss=source||SpreadsheetApp.getActiveSpreadsheet();
  [['고객 등록','고객 LIST','E32','F32','고객 등록'],['계약 입력','계약 목록','F18','D18','계약 추가']].forEach(function(item){
    const form=crmSheet_(ss,item[0]),list=crmSheet_(ss,item[1]);
    if(!form||!list)return;
    const note='모바일에서는 상단 '+item[4]+' 버튼이 작동하지 않습니다.\n이 체크박스를 선택하면 ‘'+list.getName()+'’ 시트에 추가됩니다.\nPC에서도 체크박스로 등록할 수 있습니다.';
    form.getRange(item[2]).setNote(note);
    form.getRange(item[3]).setNote(note);
  });
}

