const fs=require('fs'),vm=require('vm');let s=fs.readFileSync('Code-CRM-calendar-U3.txt','utf8');
s=s.replace('  refreshMobileRegistrationNotes_(e && e.source);\r\n  if(handleCrmCalendarEdit(e))return;', '  if(handleCrmCalendarEdit(e))return;\n  refreshMobileRegistrationNotes_(e && e.source);');
s=s.replace('function refreshCrmCalendar(source,dailyOnly)', 'function refreshCrmCalendar(source,dailyOnly,useCached)').replace('refreshCrmCalendarUnlocked_(source,dailyOnly)', 'refreshCrmCalendarUnlocked_(source,dailyOnly,useCached)');
const a=s.indexOf("  const list=crmSheet_(ss,'고객 LIST'),contractsSheet="),b=s.indexOf('  const personal=',a);
s=s.slice(0,a)+`  const sourceData=crmCalendarSourceData_(ss,useCached);
  const customers=sourceData.customers,contracts=sourceData.contracts;
`+s.slice(b);
const insert=s.indexOf('function ensureCrmCalendarStorage_');
s=s.slice(0,insert)+`function crmCalendarSourceData_(ss,useCached) {
  const cache=CacheService.getDocumentCache(),key='CRM_CALENDAR_SOURCE_V1';
  if(useCached){const saved=cache.get(key);if(saved){try{return JSON.parse(saved);}catch(error){}}}
  else cache.remove(key);
  const list=crmSheet_(ss,'고객 LIST'),contractsSheet=crmSheet_(ss,'계약 목록');
  const customers=list?list.getRange(6,2,Math.max(1,list.getLastRow()-5),27).getValues().filter(r=>String(r[1]||'').trim()):[];
  const contracts=contractsSheet?contractsSheet.getRange(5,1,Math.max(1,contractsSheet.getLastRow()-4),14).getValues().filter(r=>String(r[3]||'').trim()):[];
  customers.forEach(r=>{if(r[22] instanceof Date)r[22]=crmCalendarInputDate_(r[22],ss);});
  contracts.forEach(r=>{if(r[2] instanceof Date)r[2]=crmCalendarInputDate_(r[2],ss);});
  const data={customers,contracts},encoded=JSON.stringify(data);if(encoded.length<30000)cache.put(key,encoded,600);
  return data;
}

`+s.slice(insert);
s=s.replace('    refreshCrmCalendar(ss);\r\n  }catch(error)', '    refreshCrmCalendar(ss,false,true);\n  }catch(error)');
s=s.replace("  sheet.getRange(5,17,sheet.getMaxRows()-4,6).breakApart()", "  const detailProps=PropertiesService.getDocumentProperties(),previousCount=Number(detailProps.getProperty('CRM_CALENDAR_DETAIL_COUNT'))||sheet.getMaxRows()-4;\n  const clearCount=Math.max(1,rows.length,previousCount);\n  sheet.getRange(5,17,clearCount,6).breakApart()");
s=s.replace("  sheet.showColumns(22);sheet.hideColumns(23,sheet.getMaxColumns()-22);", "  sheet.getRange('Q4:U4').setBorder(null,null,true,null,null,null,'#b7b7b7',SpreadsheetApp.BorderStyle.SOLID);\n  detailProps.setProperty('CRM_CALENDAR_DETAIL_COUNT',String(rows.length));");
s=s.replace("  const end=Math.max(34,4+rows.length);sheet.showRows(1,end);\n  if(end<sheet.getMaxRows())sheet.hideRows(end+1,sheet.getMaxRows()-end);", "  const end=Math.max(34,4+rows.length);\n  if(detailProps.getProperty('CRM_CALENDAR_VISIBLE_END')!==String(end)){sheet.showRows(1,end);if(end<sheet.getMaxRows())sheet.hideRows(end+1,sheet.getMaxRows()-end);detailProps.setProperty('CRM_CALENDAR_VISIBLE_END',String(end));}");
// Correct outdated combined-file instructions.
s=s.replace('// 기존 onEdit/onOpen 함수가 있다면 아래 핸들러 호출을 기존 함수에 합쳐야 합니다.','// 기존 Code.gs 전체를 이 파일로 교체하세요.');
new vm.Script(s);fs.writeFileSync('Code-CRM-calendar-performance-fixed.txt',s);console.log('PASS: full script syntax');
