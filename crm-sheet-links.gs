// 이름 대신 고유 ID로 시트를 연결합니다. 탭 이름과 열 제목 문구는 변경할 수 있습니다.
const CRM_SHEET_IDS = Object.freeze({
  '고객 등록':1922160955,
  '고객 LIST':254139861,
  '고객 관리 카드':284886991,
  '계약 입력':1724999388,
  '계약 목록':1396871157,
  '메뉴 추가':1057313260,
  '자동차보험':681395888,
  '카드수납':862162969
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
