// 고객 LIST 변경은 배열 수식의 참조를 통해 즉시 반영됩니다.
// 스프레드시트 계산 설정은 매분 재계산이며, 자정 이후 TODAY()가 갱신됩니다.
function operationalViewFormulas_(sourceName) {
  const q="'"+sourceName.replace(/'/g,"''")+"'!";
  return {
    auto:'=IFNA(SORT(FILTER({'+q+'X6:X,'+q+'C6:G,'+q+'V6:W,'+q+'Y6:AB},'+q+'C6:C<>"",ISNUMBER('+q+'X6:X),'+q+'X6:X>=TODAY(),'+q+'X6:X<=TODAY()+30),1,TRUE),"")',
    card:'=IFNA(FILTER({'+q+'J6:J,'+q+'C6:E,'+q+'K6:O},'+q+'C6:C<>"",IFERROR(VALUE('+q+'J6:J),0)=DAY(TODAY())),"")'
  };
}

function refreshOperationalViews(source) {
  const ss=source&&typeof source.getSheetByName==='function'?source:SpreadsheetApp.getActiveSpreadsheet();
  const list=crmSheet_(ss,'고객 LIST');if(!list)return;
  const formulas=operationalViewFormulas_(list.getName());
  [['자동차보험',formulas.auto],['카드수납',formulas.card]].forEach(([role,formula])=>{
    const sheet=crmSheet_(ss,role);if(!sheet)return;
    const filter=sheet.getFilter();if(filter)filter.remove();
    const cell=sheet.getRange('B5');if(cell.getFormula()!==formula)cell.setFormula(formula);
  });
  SpreadsheetApp.flush();
  updateOperationalVisibility_(ss);
}

function operationalLastVisibleRow_(rows) {
  let last=4;
  rows.forEach((row,index)=>{if(row.some(value=>String(value==null?'':value).trim()))last=index+5;});
  return last;
}

function updateOperationalVisibility_(ss) {
  ['자동차보험','카드수납'].forEach(role=>{
    const sheet=crmSheet_(ss,role);if(!sheet)return;
    const count=Math.max(1,sheet.getLastRow()-4);
    const rows=sheet.getRange(5,2,count,role==='자동차보험'?12:9).getDisplayValues();
    const last=operationalLastVisibleRow_(rows),max=sheet.getMaxRows();
    sheet.showRows(1,last);
    if(last<max)sheet.hideRows(last+1,max-last);
  });
}

// Apps Script에서 한 번 실행하면, 시트가 닫혀 있을 때도 분 단위로 보이는 행 수를 갱신합니다.
function setupViewAutoRefresh() {
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty('CRM_VIEW_SPREADSHEET_ID',ss.getId());
  ScriptApp.getProjectTriggers().filter(trigger=>trigger.getHandlerFunction()==='scheduledViewAutoRefresh')
    .forEach(trigger=>ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('scheduledViewAutoRefresh').timeBased().everyMinutes(1).create();
  refreshOperationalViews(ss);
  ss.toast('자동차보험·카드수납의 보이는 행 수를 자동으로 맞춥니다.','자동 갱신 설정 완료');
}

function scheduledViewAutoRefresh() {
  const id=PropertiesService.getScriptProperties().getProperty('CRM_VIEW_SPREADSHEET_ID');
  if(!id)return;
  const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
  try{const ss=SpreadsheetApp.openById(id);refreshOperationalViews(ss);refreshCrmHolidayDataIfNeeded_(ss);refreshCrmCalendar(ss,true);}
  finally{lock.releaseLock();}
}
