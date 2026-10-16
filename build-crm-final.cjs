const fs=require('fs');
let p='crm-calendar.gs',s=fs.readFileSync(p,'utf8');
s=s.slice(0,s.indexOf('function renderCrmCalendar_'));
s=s.replace("const todayText=contractTodayText(ss);", "ensureCrmCalendarStorage_(sheet);\n  const todayText=contractTodayText(ss);");
s=s.replaceAll("'S1'","'AK1'").replaceAll("'S2'","'AK2'");
s=s.replace('sheet.getRange(29,10,Math.max(1,sheet.getLastRow()-28),4)', 'sheet.getRange(5,31,Math.max(1,sheet.getLastRow()-4),4)');
s=s.replace("const view=sheet.getRange('B2').getDisplayValue()||CRM_CALENDAR_VIEWS[0],key=year+'-'+month;", "const view=CRM_CALENDAR_VIEWS[0],key=year+'-'+month;");
s+=`
function ensureCrmCalendarStorage_(sheet) {
  if(sheet.getMaxColumns()<44)sheet.insertColumnsAfter(sheet.getMaxColumns(),44-sheet.getMaxColumns());
  if(sheet.getRange('AK5').getValue()==='v2')return;
  const old=sheet.getRange(28,10,sheet.getMaxRows()-27,4).getValues().filter(r=>r[0]&&r[2]);
  if(old.length)sheet.getRange(5,31,old.length,4).setValues(old);
  const holidays=sheet.getRange(4,15,sheet.getMaxRows()-3,2).getValues().filter(r=>r[0]&&r[1]);
  if(holidays.length)sheet.getRange(5,35,holidays.length,2).setValues(holidays);
  sheet.getRange('AK5').setValue('v2');
}
function renderCrmCalendar_(sheet,model) {
  sheet.getRange('B1').clearContent();
  sheet.getRange('B2').clearDataValidations().setValue('캘린더');
  sheet.getRange('D2:E2').clearDataValidations();
  sheet.getRange('G4:H5').clearContent().clearDataValidations();
  sheet.showColumns(10,6);sheet.hideColumns(16,sheet.getMaxColumns()-15);
  sheet.getRange('B7:H36').breakApart().clearContent().clearNote().setBackground('#ffffff').setFontColor('#202124');
  sheet.setRowHeights(6,31,28);
  const map={};
  for(let week=0;week<6;week++)for(let day=0;day<7;day++){
    const date=model.start+week*7+day,row=7+week*5,col=2+day,inMonth=date>=model.first&&date<=model.end;
    const holiday=(model.holidays||{})[date];
    sheet.getRange(row,col).setValue(date).setNumberFormat('d').setHorizontalAlignment('right').setFontWeight('bold')
      .setFontColor(!inMonth?'#b7b7b7':day===0||holiday?'#d93025':day===6?'#1a73e8':'#202124');
    sheet.getRange(row,col,5,1).setBorder(true,true,true,true,false,false,'#b7b7b7',SpreadsheetApp.BorderStyle.SOLID);
    if(!inMonth)continue;
    const events=model.events.filter(e=>e.date===date&&e.type!=='개인일정');
    const labels=(holiday?[holiday]:[]).concat(events.map(e=>e.type+' · '+e.text));
    for(let k=0;k<3;k++){
      const cell=sheet.getRange(row+1+k,col);cell.setNumberFormat('@').setValue(literalText(labels[k]||''));
      map[(row+1+k)+':'+col]=date;
    }
    if(labels.length>3)sheet.getRange(row+3,col).setValue(literalText(labels[2]+' · 외 '+(labels.length-3)+'건'));
    sheet.getRange(row+4,col).setNumberFormat('@').setValue(literalText(model.personal[date]||''));
    map[row+':'+col]=date;
  }
  PropertiesService.getDocumentProperties().setProperty('CRM_CALENDAR_DATE_MAP',JSON.stringify(map));
  sheet.getRange(5,38,sheet.getMaxRows()-4,7).clearContent();
  if(model.events.length)sheet.getRange(5,38,model.events.length,7).setValues(model.events.map(e=>[e.date,e.type,literalText(e.name),literalText(e.birth),literalText(e.text),e.view,'']));
  let selected;try{selected=crmCalendarInputDate_(sheet.getRange('K3').getValue(),sheet.getParent());}catch(error){}
  if(!selected||selected<model.first||selected>model.end)selected=model.today>=model.first&&model.today<=model.end?model.today:model.first;
  sheet.getRange('K3').setValue(selected).setNumberFormat('yyyy-mm-dd');
  renderCrmCalendarDetails_(sheet,selected);
}
function renderCrmCalendarDetails_(sheet,date) {
  const rows=sheet.getRange(5,38,Math.max(1,sheet.getLastRow()-4),7).getValues().filter(r=>Number(r[0])===date);
  sheet.getRange('J4:O4').setValues([['날짜','고객이름','생년월일','구분','내용','고객카드']]);
  sheet.getRange(5,10,sheet.getMaxRows()-4,6).clearContent().clearDataValidations();
  if(rows.length){
    sheet.getRange(5,10,rows.length,6).setValues(rows.map(r=>[date,literalText(r[2]),literalText(r[3]),r[1],literalText(r[4]),false]));
    sheet.getRange(5,10,rows.length,1).setNumberFormat('m월 d일');
    sheet.getRange(5,12,rows.length,1).setNumberFormat('@');
    rows.forEach((r,i)=>{if(r[2])sheet.getRange(i+5,15).insertCheckboxes();});
    sheet.getRange(5,10,rows.length,6).setBorder(true,true,true,true,true,true,'#b7b7b7',SpreadsheetApp.BorderStyle.SOLID);
  }
  const end=Math.max(36,4+rows.length);sheet.showRows(1,end);
  if(end<sheet.getMaxRows())sheet.hideRows(end+1,sheet.getMaxRows()-end);
}
function saveCalendarPersonalDay_(sheet,date,text) {
  const data=sheet.getRange(5,31,sheet.getMaxRows()-4,4).getValues();let empty=-1;const matches=[];
  data.forEach((r,i)=>{if(!r[0]&&empty<0)empty=i;if(Number(r[0])===date)matches.push(i);});
  matches.forEach(i=>sheet.getRange(i+5,31,1,4).clearContent());
  if(!String(text||'').trim())return;
  const dest=matches.length?matches[0]:empty;
  if(dest<0)throw new Error('개인일정 저장 공간이 부족합니다.');
  sheet.getRange(dest+5,31,1,4).setValues([[date,'개인일정',literalText(String(text).trim()),'예정']]);
}
function openCalendarCustomer_(ss,name,birth) {
  if(!name)return;const card=crmSheet_(ss,'고객 관리 카드');
  card.getRange('C4').setValue(name);card.getRange('C5').setNumberFormat('@').setValue(String(birth));
  refreshCustomerCard(ss);ss.setActiveSheet(card);card.getRange('C4').activate();
}
function onSelectionChange(e) {
  if(!e||!e.range||crmSheetRole_(e.range.getSheet())!=='캘린더'||e.range.getNumRows()!==1||e.range.getNumColumns()!==1)return;
  const sheet=e.range.getSheet(),row=e.range.getRow(),col=e.range.getColumn();
  const map=JSON.parse(PropertiesService.getDocumentProperties().getProperty('CRM_CALENDAR_DATE_MAP')||'{}');
  const date=map[row+':'+col];
  if(date){sheet.getRange('K3').setValue(date).setNumberFormat('yyyy-mm-dd');renderCrmCalendarDetails_(sheet,date);}
  else if(row>=5&&(col===11||col===12)){const r=sheet.getRange(row,11,1,2).getDisplayValues()[0];openCalendarCustomer_(e.source,r[0],r[1]);}
}
function handleCrmCalendarEdit(e) {
  if(!e||!e.range||crmSheetRole_(e.range.getSheet())!=='캘린더')return false;
  const sheet=e.range.getSheet(),ss=e.source;
  try{
    if(e.range.getColumn()===15&&e.range.getRow()>=5&&e.value==='TRUE'){
      const r=sheet.getRange(e.range.getRow(),11,1,2).getDisplayValues()[0];e.range.setValue(false);openCalendarCustomer_(ss,r[0],r[1]);return true;
    }
    if(e.range.getA1Notation()==='K3'){const date=crmCalendarInputDate_(e.range.getValue(),ss);e.range.setValue(date).setNumberFormat('yyyy-mm-dd');renderCrmCalendarDetails_(sheet,date);return true;}
    for(let w=0;w<6;w++){
      const row=11+w*5;if(e.range.getRow()>row||e.range.getLastRow()<row)continue;
      for(let col=Math.max(2,e.range.getColumn());col<=Math.min(8,e.range.getLastColumn());col++){
        const date=crmCalendarInputDate_(sheet.getRange(row-4,col).getValue(),ss);saveCalendarPersonalDay_(sheet,date,sheet.getRange(row,col).getDisplayValue());
      }
    }
    refreshCrmCalendar(ss);
  }catch(error){sheet.getRange('B1').setValue(error.message);}
  return true;
}
`;
fs.writeFileSync(p,s);
p='crm-calendar-holidays.gs';s=fs.readFileSync(p,'utf8').replaceAll('5,15','5,35').replaceAll("'S3'","'AK3'").replaceAll("'S4'","'AK4'");s=s.replace('try{updateCrmHolidayData_(ss);}',"ensureCrmCalendarStorage_(crmSheet_(ss,'캘린더'));\n  try{updateCrmHolidayData_(ss);}");fs.writeFileSync(p,s);
let all=fs.readFileSync('customer-registration.gs','utf8').replace(".addItem('고객 등록', 'registerCustomer')",".addItem('고객등록', 'openCustomerRegistration')").replace(".addItem('등록 기능 연결 완료', 'setupCustomerRegistration')",".addItem('계약추가', 'activateContractInput')");
all+='\nfunction customerDialogHtml2_(){return '+JSON.stringify(fs.readFileSync('customer-dialog2.html','utf8'))+';}\n';
all+=fs.readFileSync('customer-dialog2-server.gs','utf8').replace('HtmlService.createHtmlOutput(CUSTOMER_DIALOG_HTML_2)','HtmlService.createHtmlOutput(customerDialogHtml2_())');
for(const file of ['contracts.gs','customer-list-layout.gs','crm-sheet-links.gs','operational-views.gs','customer-card-contracts.gs','crm-calendar.gs','crm-calendar-holidays.gs'])all+='\n'+fs.readFileSync(file,'utf8');
new(require('vm').Script)(all);fs.writeFileSync('Code-CRM-calendar-final.txt',all);console.log('Full script syntax OK');
