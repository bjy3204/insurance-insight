const fs=require('node:fs'),vm=require('node:vm'),a=require('node:assert/strict');
const c={Date,SpreadsheetApp:{getActiveSpreadsheet:()=>({getSpreadsheetTimeZone:()=> 'Asia/Seoul'})},Utilities:{formatDate:()=> '2026-10-15'}};
vm.createContext(c);for(const f of ['customer-registration.gs','contracts.gs','customer-card-contracts.gs','crm-calendar.gs'])vm.runInContext(fs.readFileSync(f,'utf8'),c);
const date=c.crmCalendarSerial_,today=date(2026,10,15);
for(const input of ['202610',202610,'2026년10월','2026년 10월','2026-10','20261015'])a.equal(c.parseCrmCalendarPeriod_(input).label,'2026년10월');
a.throws(()=>c.parseCrmCalendarPeriod_('202613'));
const customer=(name,birth,payday,renewal)=>{const r=Array(27).fill('');r[1]=name;r[2]=birth;r[8]=payday;r[11]='카드사';r[20]='차량';r[22]=renewal;return r;};
const contract=(day,premium,immunity=0,reduction=0)=>{const r=Array(14).fill('');r[2]=day;r[3]='계약자';r[9]='상품';r[10]=premium;r[11]=immunity;r[12]=reduction;return r;};
const goals=Array.from({length:6},()=>({count:0,amount:0}));goals[2]={count:3,amount:300000};
const customers=[customer('고객','961001',15,date(2027,10,18)),customer('지난 결제','960901',14,date(2027,10,14))];
const contracts=[contract(date(2026,10,15),100000),contract(date(2026,10,17),200000),contract(date(2026,10,18),50000),contract(date(2026,9,30),900000),contract(date(2026,7,18),0,3,6)];
let model=c.buildCrmCalendarModel_(2026,10,today,customers,contracts,[[date(2026,10,1),'개인일정','지난 개인일정','완료']],goals);
a.equal(model.personal[date(2026,10,1)],'✓ 지난 개인일정');
a(model.events.some(e=>e.type==='고객생일'&&e.date===date(2026,10,1)));
a(!model.events.some(e=>e.type==='목표'));
a(!model.events.some(e=>e.view==='카드수납'&&e.date<today));
a(model.events.some(e=>e.view==='자동차보험 갱신'&&e.date===date(2026,10,18)));
a(model.events.some(e=>e.type==='면책 종료'&&e.date===date(2026,10,18)));
model=c.buildCrmCalendarModel_(2026,8,today,customers,contracts,[],goals);a.equal(model.weeks.filter(w=>w.valid).length,6);
a(!model.events.some(e=>e.view!=='캘린더'));
// Calendar entry updates only its own date and retains entries in prior months.
const personalRows=[[date(2026,9,1),'개인일정','지난달 일정','예정'],[date(2026,10,15),'개인일정','수정 전','예정']];
const personalSheet={getParent:()=>({getSpreadsheetTimeZone:()=> 'Asia/Seoul'}),getLastRow:()=>30,getMaxRows:()=>6,getRange(row,col,height,width){if(row===5&&height===2)return {getValues:()=>personalRows};return {clearContent(){personalRows[row-5]=['','','',''];},setValues(v){personalRows[row-5]=v[0];return this;},setNumberFormat(){return this;}};}};
c.saveCalendarPersonalDay_(personalSheet,today,'새 개인일정');
a.equal(personalRows[0][2],'지난달 일정');a.equal(personalRows[1][2],'새 개인일정');
c.saveCalendarPersonalDay_(personalSheet,today,'');
a.equal(personalRows[0][2],'지난달 일정');a.equal(personalRows[1][2],'');
console.log('PASS: calendar weeks, partial-month totals, historical personal/birthdays, future-only business views, expiry dates, dated personal persistence and removal of goals');

