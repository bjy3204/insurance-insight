// 한국천문연구원의 2026 월력요항을 기본 자료로 사용하고 Google 공개 공휴일 달력으로 갱신합니다.
const CRM_KOREAN_HOLIDAYS_2026=[
 ['20260101','신정'],['20260216','설날 연휴'],['20260217','설날'],['20260218','설날 연휴'],
 ['20260301','삼일절'],['20260302','대체공휴일'],['20260501','노동절'],['20260505','어린이날'],
 ['20260524','부처님오신날'],['20260525','대체공휴일'],['20260603','전국동시지방선거'],['20260606','현충일'],
 ['20260717','제헌절'],['20260815','광복절'],['20260817','대체공휴일'],['20260924','추석 연휴'],['20260925','추석'],['20260926','추석 연휴'],
 ['20261003','개천절'],['20261005','대체공휴일'],['20261009','한글날'],['20261225','성탄절']
];
function parseCrmHolidayIcs_(text,official) {
  const unfolded=String(text).replace(/\r?\n[ \t]/g,'');
  const events=[],blocks=unfolded.split('BEGIN:VEVENT').slice(1);
  blocks.forEach(block=>{
    const date=/^DTSTART(?:;[^:\r\n]*)?:(\d{8})/m.exec(block),name=/^SUMMARY(?:;[^:\r\n]*)?:(.+)$/m.exec(block);
    if(!date||!name)return;
    const label=name[1].trim().replace(/\\n/g,' ').replace(/\\,/g,',').replace(/\\;/g,';');
    const newHoliday=Number(date[1].slice(0,4))>=2026&&/노동절|근로자의날|근로자의 날|제헌절/.test(label);
    if(!official&&!newHoliday&&!/신정|새해|설날|설연휴|삼일절|3[·.\s]*1절|어린이날|부처님|석가탄신일|현충일|광복절|추석|개천절|한글날|성탄절|기독탄신일|크리스마스|대체.*공휴일|임시.*공휴일|선거/.test(label))return;
    events.push([crmCalendarSerial_(Number(date[1].slice(0,4)),Number(date[1].slice(4,6)),Number(date[1].slice(6))),label]);
  });
  return events;
}
function crmCalendarHolidays_(sheet) {
  const result={};
  CRM_KOREAN_HOLIDAYS_2026.forEach(([date,label])=>{result[crmCalendarSerial_(Number(date.slice(0,4)),Number(date.slice(4,6)),Number(date.slice(6)))]=label;});
  const rows=sheet.getRange(5,35,Math.max(1,sheet.getLastRow()-4),2).getValues();
  rows.forEach(row=>{if(row[0]&&row[1]){
    const date=row[0] instanceof Date?crmCalendarInputDate_(row[0],sheet.getParent()):Number(row[0]);
    result[date]=String(row[1]);
  }});
  return result;
}
function updateCrmHolidayData_(ss) {
  const sheet=crmSheet_(ss,'캘린더');if(!sheet)return;
  let events=[];
  for(const official of [true,false]){
    const calendar=official?'ko.south_korea.official':'ko.south_korea';
    try{
      const response=UrlFetchApp.fetch('https://calendar.google.com/calendar/ical/'+calendar+'%23holiday%40group.v.calendar.google.com/public/basic.ics',{muteHttpExceptions:true});
      if(response.getResponseCode()===200){events=parseCrmHolidayIcs_(response.getContentText(),official);if(events.length)break;}
    }catch(error){}
  }
  if(!events.length)throw new Error('공휴일 자료를 불러오지 못했습니다. 2026년 기본 공휴일 자료는 유지됩니다.');
  const unique={};events.forEach(([date,name])=>{unique[date]=name;});
  const rows=Object.keys(unique).map(Number).sort((a,b)=>a-b).map(date=>[date,unique[date]]);
  if(rows.length+4>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),rows.length+4-sheet.getMaxRows());
  sheet.getRange(5,35,sheet.getMaxRows()-4,2).clearContent();
  sheet.getRange(5,35,rows.length,2).setValues(rows);
  sheet.getRange('AK3').setNumberFormat('@').setValue(contractTodayText(ss));
}
function setupCrmCalendar() {
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  ensureCrmCalendarStorage_(crmSheet_(ss,'캘린더'));
  try{updateCrmHolidayData_(ss);}catch(error){ss.toast(error.message,'공휴일 자료');}
  refreshCrmCalendar(ss);
  setupViewAutoRefresh();
}

function refreshCrmHolidayDataIfNeeded_(ss) {
  const sheet=crmSheet_(ss,'캘린더');if(!sheet)return;
  const todayText=contractTodayText(ss),last=sheet.getRange('AK3').getDisplayValue(),attempt=sheet.getRange('AK4').getDisplayValue();
  if(attempt===todayText)return;
  if(last&&parseContractDate(todayText)-parseContractDate(last)<30)return;
  sheet.getRange('AK4').setNumberFormat('@').setValue(todayText);
  try{updateCrmHolidayData_(ss);}catch(error){}
}
