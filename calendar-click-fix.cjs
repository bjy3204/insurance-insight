const fs=require('fs'),vm=require('vm');let s=fs.readFileSync('Code-CRM-calendar-performance-fixed.txt','utf8');const a=s.indexOf('function onSelectionChange(e)'),b=s.indexOf('function handleCrmCalendarEdit(e)',a);if(a<0||b<0)throw Error('Selection function missing');
s=s.slice(0,a)+`function onSelectionChange(e) {
  if(!e||!e.range||crmSheetRole_(e.range.getSheet())!=='캘린더')return;
  const sheet=e.range.getSheet(),row=e.range.getRow(),col=e.range.getColumn();
  if(row>=5&&row<=34&&col>=2&&col<=15&&e.range.getNumRows()===1&&e.range.getNumColumns()<=2){
    const year=Number(sheet.getRange('G2').getValue()),month=Number(sheet.getRange('I2').getValue());
    if(!Number.isInteger(year)||!Number.isInteger(month)||month<1||month>12)return;
    const first=crmCalendarSerial_(year,month,1),start=first-crmCalendarDate_(first).getUTCDay();
    const week=Math.floor((row-5)/5),day=Math.floor((col-2)/2),date=start+week*7+day;
    sheet.getRange('U3').setValue(date).setNumberFormat('yyyy-mm-dd');
    renderCrmCalendarDetails_(sheet,date);
  }else if(row>=5&&(col===18||col===19)&&e.range.getNumRows()===1){
    const r=sheet.getRange(row,18,1,2).getDisplayValues()[0];openCalendarCustomer_(e.source,r[0],r[1]);
  }
}

`+s.slice(b);new vm.Script(s);fs.writeFileSync('Code-CRM-calendar-click-fixed.txt',s);console.log('PASS full script syntax');
