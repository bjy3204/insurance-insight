const fs=require('fs'),vm=require('vm');let s=fs.readFileSync('Code-CRM-customer-card-visible-rows.txt','utf8');s=s.replace('    target.setValues([record.slice(1)]);saved=true;', '    target.setValues([record.slice(1)]);saved=true;\n    refreshContractCategoryDropdowns_(ss,destination,1);');
const a=s.indexOf('function refreshAllContractCustomerInfo'),b=s.indexOf('function handleContractEdit',a);let t=s.slice(a,b);t=t.replace('refreshContractRowCustomers(ss,list,index+5,customers);});','refreshContractRowCustomers(ss,list,index+5,customers);});\n  refreshContractCategoryDropdowns_(ss);');s=s.slice(0,a)+t+s.slice(b);
s=s.replace("  if(name==='계약 목록'){refreshCustomerCard(e.source);refreshCrmCalendar(e.source);}", "  if(name==='계약 목록'){if(e.range.getLastRow()>=5)refreshContractCategoryDropdowns_(e.source,Math.max(5,e.range.getRow()),e.range.getLastRow()-Math.max(5,e.range.getRow())+1);refreshCustomerCard(e.source);refreshCrmCalendar(e.source);}");
const at=s.indexOf('function handleContractEdit');s=s.slice(0,at)+`function refreshContractCategoryDropdowns_(source,start,count) {
  const ss=source||SpreadsheetApp.getActiveSpreadsheet(),sheet=crmSheet_(ss,'계약 목록');if(!sheet)return;
  const first=start||5,height=count||sheet.getMaxRows()-first+1;if(height<1)return;
  const range=sheet.getRange(first,2,height,1),values=range.getDisplayValues();
  const rule=SpreadsheetApp.newDataValidation().requireValueInList(['지인','소개','가족','DB','인하우스','산모교실'],true).setAllowInvalid(false).build();
  range.setDataValidations(values.map(row=>[String(row[0]||'').trim()?rule:null]));
}

`+s.slice(at);new vm.Script(s);fs.writeFileSync('Code-CRM-contract-category-dropdowns.txt',s);console.log('PASS full syntax; dynamic dropdown hooks on registration, edits and opening');
