// 고객 LIST 변경은 배열 수식의 참조를 통해 즉시 반영됩니다.
// 스프레드시트 계산 설정은 매분 재계산이며, 자정 이후 TODAY()가 갱신됩니다.
function operationalViewFormulas_(sourceName) {
  const q="'"+sourceName.replace(/'/g,"''")+"'!";
  return {
    auto:'=IFNA(SORT(FILTER({'+q+'X6:X,'+q+'B6:H,'+q+'V6:W,'+q+'Y6:AB},'+q+'C6:C<>"",ISNUMBER('+q+'X6:X),'+q+'X6:X>=TODAY(),'+q+'X6:X<=TODAY()+30),1,TRUE),"")',
    card:'=IFNA(FILTER({'+q+'J6:J,'+q+'B6:E,'+q+'H6:H,'+q+'K6:O},'+q+'C6:C<>"",IFERROR(VALUE('+q+'J6:J),0)=DAY(TODAY())),"")'
  };
}

function refreshOperationalViews(source) {
  const ss=source&&typeof source.getSheetByName==='function'?source:SpreadsheetApp.getActiveSpreadsheet();
  const list=crmSheet_(ss,'고객 LIST');if(!list)return;
  const formulas=operationalViewFormulas_(list.getName());
  [['자동차보험',formulas.auto],['카드수납',formulas.card]].forEach(([role,formula])=>{
    const sheet=crmSheet_(ss,role);if(!sheet)return;
    const filter=sheet.getFilter();if(filter)filter.remove();
    const cell=sheet.getRange('B6');if(cell.getFormula()!==formula)cell.setFormula(formula);
  });
}
