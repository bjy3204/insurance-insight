const fs=require('fs'),vm=require('vm');let s=fs.readFileSync('Code-CRM-contract-category-dropdowns.txt','utf8');const a=s.indexOf('function refreshContractCategoryDropdowns_'),b=s.indexOf('function handleContractEdit',a);s=s.slice(0,a)+`function progressiveCategoryDropdownCount_(values) {
  let last=-1;values.forEach((row,i)=>{if(String(row[0]||'').trim())last=i;});
  return Math.max(1,last+2);
}
function refreshContractCategoryDropdowns_(source) {
  const ss=source||SpreadsheetApp.getActiveSpreadsheet(),sheet=crmSheet_(ss,'계약 목록');if(!sheet)return;
  const values=sheet.getRange(5,2,sheet.getMaxRows()-4,1).getDisplayValues(),count=progressiveCategoryDropdownCount_(values);
  if(count>values.length){sheet.insertRowsAfter(sheet.getMaxRows(),count-values.length);while(values.length<count)values.push(['']);}
  const rule=SpreadsheetApp.newDataValidation().requireValueInList(['지인','소개','가족','DB','인하우스','산모교실'],true).setAllowInvalid(false).build();
  sheet.getRange(5,2,values.length,1).setDataValidations(values.map((row,i)=>[i<count?rule:null]));
}

`+s.slice(b);
s=s.replace('    plan.segments.forEach(segment=>list.getRange(segment.start,column,segment.end-segment.start+1,1).setDataValidation(rule));', "    if(column===2){const count=progressiveCategoryDropdownCount_(rows.map(row=>[row[0]]));list.getRange(6,2,Math.min(height,count),1).setDataValidation(rule);}\n    else plan.segments.forEach(segment=>list.getRange(segment.start,column,segment.end-segment.start+1,1).setDataValidation(rule));");
new vm.Script(s);fs.writeFileSync('Code-CRM-category-dropdown-next-row.txt',s);console.log('PASS entire script syntax');
