const CRM_CALENDAR_VIEWS=['캘린더','카드수납','자동차보험 갱신','면책·감액 종료'];
function parseCrmCalendarPeriod_(value) {
  const text=String(value==null?'':value).trim();let year,month,match;
  if((match=/^(\d{4})\s*년\s*(\d{1,2})\s*월$/.exec(text))){year=Number(match[1]);month=Number(match[2]);}
  else if((match=/^(\d{4})\s*[-./]\s*(\d{1,2})$/.exec(text))){year=Number(match[1]);month=Number(match[2]);}
  else if(/^\d{5,6}$/.test(text)){year=Number(text.slice(0,4));month=Number(text.slice(4));}
  else if(/^\d{8}$/.test(text)){year=Number(text.slice(0,4));month=Number(text.slice(4,6));}
  else if(/^\d{4}$/.test(text)){year=2000+Number(text.slice(0,2));month=Number(text.slice(2));}
  else throw new Error('월을 확인하세요. 예: 2026년 10월, 202610');
  if(year<1900||year>2199||month<1||month>12)throw new Error('월을 확인하세요. 예: 2026년 10월, 202610');
  return {year,month,label:year+'년'+month+'월'};
}
function crmCalendarSerial_(year,month,day) {return Math.round((Date.UTC(year,month-1,day)-Date.UTC(1899,11,30))/86400000);}
function crmCalendarDate_(serial) {return new Date(Date.UTC(1899,11,30)+Number(serial)*86400000);}
function crmCalendarInputDate_(value,ss) {
  if(value===''||value==null)return '';
  if(value instanceof Date){
    const formatted=Utilities.formatDate(value,ss.getSpreadsheetTimeZone(),'yyyy-MM-dd');
    value=Number(formatted.split('-')[0])>2199?Math.round((value.getTime()-Date.UTC(1899,11,30))/86400000):formatted;
  }
  if(typeof value==='number'&&value>0&&value<110000)return Math.floor(value);
  return parseContractDate(value,contractTodayText(ss));
}

function buildCrmCalendarModel_(year,month,today,customers,contracts,personal) {
  const first=crmCalendarSerial_(year,month,1),next=crmCalendarSerial_(year,month+1,1);
  const start=first-crmCalendarDate_(first).getUTCDay(),end=next-1;
  const events=[],texts={};
  const add=(date,view,type,text,name,birth)=>{if(date>=first&&date<=end&&(view===CRM_CALENDAR_VIEWS[0]||date>=today))events.push({date,view,type,text,name:name||'',birth:birth||''});};
  const clamp=(m,d)=>crmCalendarSerial_(year,m,Math.min(d,crmCalendarDate_(crmCalendarSerial_(year,m+1,1)-1).getUTCDate()));
  personal.forEach(row=>{const date=Number(row[0]),text=String(row[2]||'').trim();if(!date||!text||date<first||date>end)return;
    const displayed=(row[3]==='완료'?'✓ ':'')+text;
    texts[date]=(texts[date]?texts[date]+'\n':'')+displayed;
    add(date,CRM_CALENDAR_VIEWS[0],'개인일정',displayed);
  });
  const todayYear=crmCalendarDate_(today).getUTCFullYear();
  customers.forEach(row=>{
    const name=String(row[1]||'').trim();if(!name)return;
    let rrn=String(row[2]||'').replace(/\D/g,'');if(rrn.length<6&&rrn)rrn=rrn.padStart(6,'0');
    const birth=birthFromResidentNumber(rrn);
    if(birth){const yy=Number(birth.slice(0,2)),bm=Number(birth.slice(2,4)),bd=Number(birth.slice(4));
      const century=rrn.length===13?('3478'.includes(rrn[6])?2000:'1256'.includes(rrn[6])?1900:1800):(yy<=todayYear%100?2000:1900);
      if(year>=century+yy)add(clamp(bm,bd),CRM_CALENDAR_VIEWS[0],'고객생일',name+' 생일');
    }
    const payday=Number(String(row[8]||'').replace(/일$/,''));
    const lastDay=crmCalendarDate_(end).getUTCDate();
    if(Number.isInteger(payday)&&payday>=1&&payday<=lastDay)add(crmCalendarSerial_(year,month,payday),CRM_CALENDAR_VIEWS[1],'카드수납',name+' '+birth+(row[11]?' · '+row[11]:''),name,birth);
    const renewal=Number(row[22]);if(renewal>0){const date=crmCalendarDate_(renewal),day=clamp(date.getUTCMonth()+1,date.getUTCDate());add(day,CRM_CALENDAR_VIEWS[2],'자동차보험 갱신',name+' '+birth+(row[20]?' · '+row[20]:''),name,birth);}
  });
  contracts.forEach(row=>{
    const date=Number(row[2]),name=String(row[3]||'').trim();if(!date||!name)return;
    [[11,'면책 종료'],[12,'감액 종료']].forEach(([col,type])=>{const months=Number(row[col]);if(Number.isInteger(months)&&months>0){const expiry=contractExpirySerial_(date,months);const birth=String(row[4]||'').replace(/\D/g,'').padStart(6,'0');add(expiry,CRM_CALENDAR_VIEWS[3],type,name+' '+birth+(row[9]?' · '+row[9]:''),name,birth);}});
  });
  const weeks=Array.from({length:6},(_,index)=>{const a=Math.max(first,start+index*7),b=Math.min(end,start+index*7+6);return {start:a,end:b,valid:a<=b};});
  events.sort((a,b)=>a.date-b.date||a.type.localeCompare(b.type,'ko'));
  return {first,end,start,today,weeks,events,personal:texts};
}

function refreshCrmCalendar(source,dailyOnly) {
  const lock=LockService.getDocumentLock();if(!lock.tryLock(100))return;
  try{return refreshCrmCalendarUnlocked_(source,dailyOnly);}finally{lock.releaseLock();}
}
function refreshCrmCalendarUnlocked_(source,dailyOnly) {
  const ss=source&&typeof source.getSheetByName==='function'?source:SpreadsheetApp.getActiveSpreadsheet();
  const sheet=crmSheet_(ss,'캘린더');if(!sheet)return;
  ensureCrmCalendarStorage_(sheet);
  const todayText=contractTodayText(ss);if(dailyOnly&&sheet.getRange('AK1').getDisplayValue()===todayText)return;
  const current=todayText.split('-').map(Number),year=Number(sheet.getRange('D2').getValue())||current[0],month=Number(sheet.getRange('E2').getValue())||current[1];
  if(!Number.isInteger(year)||year<1900||year>2199||!Number.isInteger(month)||month<1||month>12){sheet.getRange('B1').setValue('연도와 월을 숫자로 확인하세요.');return;}
  sheet.getRange('D2').setNumberFormat('0"년"').setValue(year);sheet.getRange('E2').setNumberFormat('0"월"').setValue(month);
  const view=CRM_CALENDAR_VIEWS[0],key=year+'-'+month;
  const list=crmSheet_(ss,'고객 LIST'),contractsSheet=crmSheet_(ss,'계약 목록');
  const customers=list?list.getRange(6,2,Math.max(1,list.getLastRow()-5),27).getValues():[];
  customers.forEach(row=>{if(row[22] instanceof Date)row[22]=crmCalendarInputDate_(row[22],ss);});
  const contracts=contractsSheet?contractsSheet.getRange(5,1,Math.max(1,contractsSheet.getLastRow()-4),14).getValues():[];
  contracts.forEach(row=>{if(row[2] instanceof Date)row[2]=crmCalendarInputDate_(row[2],ss);});
  const personal=sheet.getRange(5,31,Math.max(1,sheet.getLastRow()-4),4).getValues();
  personal.forEach(row=>{try{row[0]=crmCalendarInputDate_(row[0],ss);}catch(error){row[0]='';}});
  const model=buildCrmCalendarModel_(year,month,parseContractDate(todayText,todayText),customers,contracts,personal);
  model.holidays=crmCalendarHolidays_(sheet);
  renderCrmCalendar_(sheet,model,view);
  if(!Object.keys(model.holidays).some(date=>crmCalendarDate_(Number(date)).getUTCFullYear()===year)){
    const prefix=view===CRM_CALENDAR_VIEWS[0]?'':'오늘 이후 일정만 표시합니다. ';
    sheet.getRange('B1').setValue(prefix+'해당 연도의 공휴일 정보가 아직 없습니다.');
  }
  sheet.getRange('AK1').setNumberFormat('@').setValue(todayText);sheet.getRange('AK2').setNumberFormat('@').setValue(key);
}


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
  sheet.setColumnWidth(10,100);sheet.setColumnWidth(11,100);sheet.setColumnWidth(12,85);sheet.setColumnWidth(13,125);sheet.setColumnWidth(14,260);sheet.setColumnWidth(15,75);
  sheet.getRange('J2:O2').breakApart().merge().setValue('날짜별 일정');sheet.getRange('J3').setValue('조회 날짜');

  // 예전 3행 달력의 유효성 검사만 제거합니다. 달력 틀과 테두리는 유지합니다.
  sheet.getRange('B4:H34').clearDataValidations().clearNote();
  sheet.getRange('B4:H4').setValues([['일','월','화','수','목','금','토']]).setFontWeight('bold').setHorizontalAlignment('center');  const colors=Array.from({length:30},()=>Array(7).fill('#202124'));
  const calendarDateTargets={},values=Array.from({length:30},()=>Array(7).fill(''));
  for(let week=0;week<6;week++)for(let day=0;day<7;day++){
    const date=model.start+week*7+day,row=5+week*5,col=2+day,inMonth=date>=model.first&&date<=model.end;
    values[week*5][day]=crmCalendarDate_(date).getUTCDate();
    colors[week*5][day]=!inMonth?'#b7b7b7':day===0||(model.holidays||{})[date]?'#d93025':day===6?'#1a73e8':'#202124';
    if(!inMonth)continue;
    const lines=String(model.personal[date]||'').split('\n');
    for(let k=0;k<4;k++){
      values[week*5+1+k][day]=literalText(k===3?lines.slice(k).join('\n'):(lines[k]||''));
      calendarDateTargets[(row+1+k)+':'+col]=date;
    }
    calendarDateTargets[row+':'+col]=date;
  }
  sheet.getRange('B5:H34').setNumberFormat('@').setValues(values).setFontColors(colors).setFontWeight('normal');
  for(let week=0;week<6;week++){
    const row=5+week*5;    sheet.getRange(row,2,1,7).setNumberFormat('0').setHorizontalAlignment('right').setFontWeight('bold');
  }

  PropertiesService.getDocumentProperties().setProperty('CRM_CALENDAR_DATE_MAP',JSON.stringify(calendarDateTargets));
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
  sheet.getRange(5,10,sheet.getMaxRows()-4,6).clearContent().clearDataValidations().setBorder(false,false,false,false,false,false);
  if(rows.length){
    sheet.getRange(5,10,rows.length,6).setValues(rows.map(r=>[date,literalText(r[2]),literalText(r[3]),r[1],literalText(r[4]),false]));
    sheet.getRange(5,10,rows.length,1).setNumberFormat('m월 d일');
    sheet.getRange(5,12,rows.length,1).setNumberFormat('@');
    rows.forEach((r,i)=>{if(r[2])sheet.getRange(i+5,15).insertCheckboxes();});
    sheet.getRange(5,10,rows.length,6).setBorder(true,true,true,true,true,true,'#b7b7b7',SpreadsheetApp.BorderStyle.SOLID);
  }
  const end=Math.max(34,4+rows.length);sheet.showRows(1,end);
  if(end<sheet.getMaxRows())sheet.hideRows(end+1,sheet.getMaxRows()-end);
}
function saveCalendarPersonalDay_(sheet,date,text) {
  const data=sheet.getRange(5,31,sheet.getMaxRows()-4,4).getValues();let empty=-1;const matches=[];
  data.forEach((r,i)=>{if(!r[0]&&empty<0)empty=i;try{if(crmCalendarInputDate_(r[0],sheet.getParent())===date)matches.push(i);}catch(error){}});
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
  const selectedDateTargets=JSON.parse(PropertiesService.getDocumentProperties().getProperty('CRM_CALENDAR_DATE_MAP')||'{}');
  const date=selectedDateTargets[row+':'+col];
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
    const targets=JSON.parse(PropertiesService.getDocumentProperties().getProperty('CRM_CALENDAR_DATE_MAP')||'{}');
    for(let w=0;w<6;w++){
      const header=5+w*5,first=header+1,last=header+4;
      if(e.range.getRow()>last||e.range.getLastRow()<first)continue;
      for(let col=Math.max(2,e.range.getColumn());col<=Math.min(8,e.range.getLastColumn());col++){
        const date=targets[header+':'+col];if(!date)continue;
        const text=sheet.getRange(first,col,4,1).getDisplayValues().map(r=>r[0]).filter(t=>t.trim()).join('\n');
        saveCalendarPersonalDay_(sheet,date,text);
      }
    }
    refreshCrmCalendar(ss);
  }catch(error){sheet.getRange('B1').setValue(error.message);}
  return true;
}


