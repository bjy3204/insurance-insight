const fs=require('fs'),vm=require('vm');let s=fs.readFileSync('Code-CRM-calendar-fast-click.txt','utf8');s=s.replace('const total=1+dates.length*height;', 'const total=(1+dates.length)*height;').replace('const start=2+i*height,rows=groups[date];','const start=1+(i+1)*height,rows=groups[date];');
s=s.replace("previous=Number(props.getProperty('CRM_DETAIL_COPY_HEIGHT'))||1;", "previous=Number(cache.get('CRM_DETAIL_COPY_HEIGHT'))||Number(props.getProperty('CRM_DETAIL_COPY_HEIGHT'))||Number(props.getProperty('CRM_CALENDAR_DETAIL_COUNT'))||Math.max(1,sheet.getLastRow()-4);");
const a=s.indexOf('  const plan=meta.plans[date];',s.indexOf('function renderCrmCalendarDetails_')),b=s.indexOf("  sheet.getRange('AO3')",a);
s=s.slice(0,a)+`  const plan=meta.plans[date];
  template.getRange(plan?plan.row:1,1,meta.height,5).copyTo(sheet.getRange(5,38,meta.height,5),SpreadsheetApp.CopyPasteType.PASTE_NORMAL,false);
`+s.slice(b);
s=s.replace("  if(previous!==meta.height)props.setProperty('CRM_DETAIL_COPY_HEIGHT',String(meta.height));", "  if(previous!==meta.height)props.setProperty('CRM_DETAIL_COPY_HEIGHT',String(meta.height));cache.put('CRM_DETAIL_COPY_HEIGHT',String(meta.height),21600);");
new vm.Script(s);fs.writeFileSync('Code-CRM-calendar-fast-click.txt',s);console.log('PASS full syntax');
