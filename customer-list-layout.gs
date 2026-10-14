// 행 높이는 최초 시트 정리 때만 적용하며, 자동 서식에서는 사용자가 바꾼 높이를 유지합니다.
function customerListDropdownRules_(ss) {
  const menu=crmSheet_(ss,'메뉴 추가');
  const rules=[{column:2,rule:SpreadsheetApp.newDataValidation()
    .requireValueInList(['지인','소개','가족','DB','인하우스','산모교실'],true)
    .setAllowInvalid(false).build()}];
  if(menu)[[13,2],[19,3],[25,4]].forEach(([column,sourceColumn])=>{
    rules.push({column,rule:SpreadsheetApp.newDataValidation()
      .requireValueInRange(menu.getRange(3,sourceColumn,Math.max(1,menu.getMaxRows()-2),1),true)
      .setAllowInvalid(false).build()});
  });
  return rules;
}

function customerListLayoutPlan_(rows) {
  const used=[];
  rows.forEach((row,index)=>{if(row.some(value=>String(value==null?'':value).trim()))used.push(index+6);});
  const segments=[];
  used.forEach(row=>{
    const segment=segments[segments.length-1];
    if(segment&&segment.end===row-1)segment.end=row;
    else segments.push({start:row,end:row});
  });
  return {endRow:used.length?used[used.length-1]+1:6,segments};
}

function refreshCustomerListLayout(source) {
  const ss=source&&typeof source.getSheetByName==='function'?source:SpreadsheetApp.getActiveSpreadsheet();
  const list=crmSheet_(ss,'고객 LIST');if(!list)return;
  const rows=list.getRange(6,2,Math.max(1,list.getLastRow()-5),27).getDisplayValues();
  const plan=customerListLayoutPlan_(rows);
  if(plan.endRow>list.getMaxRows()){
    list.insertRowsAfter(list.getMaxRows(),plan.endRow-list.getMaxRows());
    list.setRowHeight(plan.endRow,28);
  }
  const height=list.getMaxRows()-5;
  // 기존 선은 그대로 유지합니다. 양옆 테두리를 추가하거나 선을 다시 그리지 않습니다.
  customerListDropdownRules_(ss).forEach(({column,rule})=>{
    list.getRange(6,column,height,1).clearDataValidations();
    plan.segments.forEach(segment=>list.getRange(segment.start,column,segment.end-segment.start+1,1).setDataValidation(rule));
  });
}
