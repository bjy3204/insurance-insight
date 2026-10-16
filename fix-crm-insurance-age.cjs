const fs=require('fs'),assert=require('assert'),vm=require('vm');
let code=fs.readFileSync('C:/Users/bjy32/.codex/attachments/c16999ec-14c5-4e95-9b7b-633cee4e6409/붙여넣은 텍스트.txt','utf8').replace(/\r\n/g,'\n');
const start=code.indexOf('  function shifted(y,m,d,offset)'),end=code.indexOf('\n}',start);
assert(start>=0&&end>start);
code=code.slice(0,start)+`  const insurance=crmInsuranceAgeInfo_(year,month,day,today);
  card.getRange('J4').setValue(insurance.serial).setNumberFormat('yyyy-mm-dd');
  card.getRange('H4').setValue(insurance.days===0?'D-Day':'D-'+insurance.days);
  card.getRange('AH1').setValue(insurance.age);`+code.slice(end);
code+=`
// 첨부 기준: 6개월 뒤 31일이 없으면 말일, 2월 일수 초과는 3월 1일.
function crmInsuranceAgeDate_(birthdayYear,month,day) {
  const target=new Date(Date.UTC(birthdayYear,month-1+6,1));
  const y=target.getUTCFullYear(),m=target.getUTCMonth();
  const last=new Date(Date.UTC(y,m+1,0)).getUTCDate();
  return new Date(Date.UTC(y,m,m===1&&day>last?last+1:Math.min(day,last)));
}
function crmInsuranceAgeInfo_(birthYear,month,day,today) {
  const year=today.getUTCFullYear();
  const birthdayThisYear=new Date(Date.UTC(year,month-1,day));
  const lastBirthdayYear=today>=birthdayThisYear?year:year-1;
  const age=lastBirthdayYear-birthYear+(today>=crmInsuranceAgeDate_(lastBirthdayYear,month,day)?1:0);
  const candidates=[year-1,year,year+1].map(y=>crmInsuranceAgeDate_(y,month,day)).filter(d=>d>=today).sort((a,b)=>a-b);
  const next=candidates[0];
  return {age:age,date:next,serial:Math.round((next-Date.UTC(1899,11,30))/86400000),days:Math.round((next-today)/86400000)};
}
`;
// 유지 요청: V열 이후 보조 열 숨김, 20행 이상 보이기와 자동 테두리.
code=code.replace('  clearCustomerCardContracts_(card);', '  card.hideColumns(22,card.getMaxColumns()-21);\n  clearCustomerCardContracts_(card);');
if(!code.includes('const visibleBody='))code=code.replace('    sheet.showRows(1,last);',`    const width=role==='자동차보험'?12:9;
    const visibleBody=sheet.getRange(5,2,last-4,width);
    visibleBody.setBorder(null,false,true,false,false,true,'#cccccc',SpreadsheetApp.BorderStyle.SOLID);
    visibleBody.setBorder(null,null,null,null,true,null,'#cccccc',SpreadsheetApp.BorderStyle.DOTTED);
    sheet.showRows(1,last);`);
new Function(code);
const context={};vm.createContext(context);vm.runInContext(code,context);
const date=s=>new Date(s+'T00:00:00Z');
const iso=d=>d.toISOString().slice(0,10);
const cases=[
 [2026,8,30,'2027-03-01'],[2026,8,31,'2027-03-01'],
 [2027,8,29,'2028-02-29'],[2026,8,29,'2027-03-01'],
 [2026,3,31,'2026-09-30'],[2026,9,1,'2027-03-01']
];
cases.forEach(([y,m,d,want])=>assert.equal(iso(context.crmInsuranceAgeDate_(y,m,d)),want));
let result=context.crmInsuranceAgeInfo_(1987,9,1,date('2022-10-01'));
assert.equal(result.age,35);assert.equal(iso(result.date),'2023-03-01');
assert.equal(context.crmInsuranceAgeInfo_(1987,9,1,date('2023-02-28')).age,35);
result=context.crmInsuranceAgeInfo_(1987,9,1,date('2023-03-01'));assert.equal(result.age,36);assert.equal(result.days,0);
result=context.crmInsuranceAgeInfo_(1990,8,30,date('2027-02-28'));assert.equal(result.age,36);assert.equal(result.days,1);
assert.equal(context.crmInsuranceAgeInfo_(1990,8,30,date('2027-03-01')).age,37);
assert.equal(iso(context.crmInsuranceAgeInfo_(1990,8,29,date('2027-03-02')).date),'2028-02-29');
fs.writeFileSync('Code-CRM-Insurance-Age-Fixed-Full.txt',code);
console.log('PASS: attached example, threshold day, February overflow, leap years, 31st-day adjustment, annual recalculation; complete script parses.');
