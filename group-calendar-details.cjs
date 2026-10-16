const fs=require('fs'),vm=require('vm');let s=fs.readFileSync('Code-CRM-calendar-weekdays-fixed.txt','utf8');
// Only calendar year/month references change; registration and contract cells retain their roles.
let a=s.indexOf('const CRM_CALENDAR_VIEWS');s=s.slice(0,a)+s.slice(a).replaceAll("'D2'","'G2'").replaceAll("'E2'","'I2'").replaceAll("'D2:E2'","'G2'");
s=s.replace("sheet.getRange('G2').clearDataValidations();","sheet.getRange('G2').clearDataValidations();sheet.getRange('I2').clearDataValidations();");
a=s.indexOf('function renderCrmCalendarDetails_');let b=s.indexOf('function saveCalendarPersonalDay_',a);
s=s.slice(0,a)+`function renderCrmCalendarDetails_(sheet,date) {
  const order=['개인일정','고객생일','카드수납','자동차보험 갱신','면책 종료','감액 종료'];
  const rows=sheet.getRange(5,38,Math.max(1,sheet.getLastRow()-4),7).getValues().filter(r=>Number(r[0])===date)
    .sort((a,b)=>order.indexOf(a[1])-order.indexOf(b[1])||String(a[2]).localeCompare(String(b[2]),'ko'));
  sheet.getRange('Q4:U4').setValues([['구분','고객이름','생년월일','내용','고객카드']]);
  sheet.getRange(5,17,sheet.getMaxRows()-4,6).breakApart().clearContent().clearDataValidations().setBorder(false,false,false,false,false,false);
  if(rows.length){
    const output=rows.map(r=>[r[1],literalText(r[2]),literalText(r[3]),literalText(r[4]),false]);
    for(let i=1;i<rows.length;i++)if(rows[i][1]===rows[i-1][1])output[i][0]='';
    sheet.getRange(5,17,rows.length,5).setNumberFormat('@').setValues(output);
    rows.forEach((r,i)=>{if(r[2])sheet.getRange(i+5,21).insertCheckboxes();});
    sheet.getRange(5,17,rows.length,5).setBorder(true,true,true,true,true,true,'#b7b7b7',SpreadsheetApp.BorderStyle.SOLID);
    for(let i=0;i<rows.length;){let end=i+1;while(end<rows.length&&rows[end][1]===rows[i][1])end++;
      if(end-i>1)sheet.getRange(5+i,17,end-i,1).merge();i=end;}
    sheet.getRange(5,17,rows.length,1).setVerticalAlignment('middle');
  }
  sheet.hideColumns(22,sheet.getMaxColumns()-21);
  const end=Math.max(34,4+rows.length);sheet.showRows(1,end);
  if(end<sheet.getMaxRows())sheet.hideRows(end+1,sheet.getMaxRows()-end);
}

`+s.slice(b);
s=s.replace('getColumn()===22','getColumn()===21');
new vm.Script(s);fs.writeFileSync('Code-CRM-calendar-grouped.txt',s);console.log('PASS full script syntax');
