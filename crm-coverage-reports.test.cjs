const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const props={};let copyCount=0;const files={};
function col(s){let n=0;for(const c of s)n=n*26+c.charCodeAt(0)-64;return n;}
class Range {
  constructor(sheet,r,c,h=1,w=1){Object.assign(this,{sheet,r,c,h,w});}
  getSheet(){return this.sheet;}getRow(){return this.r;}getColumn(){return this.c;}
  getLastRow(){return this.r+this.h-1;}getLastColumn(){return this.c+this.w-1;}
  getNumRows(){return this.h;}getNumColumns(){return this.w;}
  getA1Notation(){const letter=n=>{let s='';while(n){s=String.fromCharCode(65+(n-1)%26)+s;n=Math.floor((n-1)/26);}return s;};return letter(this.c)+this.r+(this.w>1||this.h>1?':'+letter(this.getLastColumn())+this.getLastRow():'');}
  getValues(){return Array.from({length:this.h},(_,i)=>Array.from({length:this.w},(_,j)=>this.sheet.grid[this.r+i-1]?.[this.c+j-1]??''));}
  getDisplayValues(){return this.getValues().map(r=>r.map(String));}getDisplayValue(){return String(this.getValues()[0][0]);}
  getFormulas(){return this.getValues().map(r=>r.map(()=>''));}
  setValues(v){assert.equal(v.length,this.h);for(let i=0;i<this.h;i++){assert.equal(v[i].length,this.w);for(let j=0;j<this.w;j++)this.sheet.grid[this.r+i-1][this.c+j-1]=v[i][j];}return this;}
  setValue(v){this.sheet.grid[this.r-1][this.c-1]=v;return this;}
  copyTo(target,options){assert(target instanceof Range);if(!options?.formatOnly&&options==='VALUES')target.setValues(this.getValues());return this;}
  clearContent(){return this.setValue('');}clearDataValidations(){return this;}clearNote(){return this;}
  setDataValidation(){return this;}setHorizontalAlignment(){return this;}setNumberFormat(){return this;}
  setWrap(){return this;}setVerticalAlignment(){return this;}setFontSize(){return this;}setFontWeight(){return this;}
  getMergedRanges(){return [];}merge(){return this;}
  getRichTextValue(){return this.sheet.rich[this.r+','+this.c]||null;}
  getRichTextValues(){return Array.from({length:this.h},(_,i)=>[this.sheet.rich[(this.r+i)+','+this.c]||null]);}
  setRichTextValue(v){this.sheet.rich[this.r+','+this.c]=v;return this.setValue(v.text);}
}
class Sheet {
  constructor(id,name,w=30,h=10){this.id=id;this.name=name;this.w=w;this.h=h;this.grid=Array.from({length:h},()=>Array(w).fill(''));this.rich={};}
  getSheetId(){return this.id;}getName(){return this.name;}getParent(){return this.book;}
  getMaxColumns(){return this.w;}getLastColumn(){return this.w;}getMaxRows(){return this.h;}
  getLastRow(){let last=1;this.grid.forEach((r,i)=>{if(r.some(v=>v!==''))last=i+1;});return last;}
  getRange(r,c,h,w){if(typeof r==='string'){const match=r.match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/);assert(match,r);return new Range(this,Number(match[2]),col(match[1]),match[4]?Number(match[4])-Number(match[2])+1:1,match[3]?col(match[3])-col(match[1])+1:1);}return new Range(this,r,c,h,w);}
  getDataRange(){return new Range(this,1,1,this.getLastRow(),this.w);}
  insertColumnBefore(c){this.grid.forEach(r=>r.splice(c-1,0,''));this.w++;return this;}
  getColumnWidth(c){return 100+c;}setColumnWidth(){return this;}setFrozenColumns(n){this.frozen=n;return this;}setRowHeight(){return this;}
}
function book(id,sheets){const b={getId:()=>id,getSheets:()=>sheets,getSheetByName:n=>sheets.find(s=>s.name===n),toast(){}};sheets.forEach(s=>s.book=b);return b;}
const list=new Sheet(254139861,'고객 관리 LIST');const crm=book('CRM',[list]);
list.grid[4][1]='보장분석';list.grid[5][1]='+';list.grid[5][2]='소개';list.grid[5][3]='홍길동';list.grid[5][4]='960901-1111111';list.grid[5][5]='01012345678';
props.CRM_REPORT_LAYOUT_BOOK='CRM';
const reportMain=new Sheet(1547742226,'보장분석',105,63),reportSummary=new Sheet(1430086215,'담보별 가입금액',13,43);
reportSummary.grid[1][4]='홍길동';reportSummary.grid[40][2]='홍길동';
const report=book('COPY',[reportMain,reportSummary]);
const chain=()=>new Proxy({}, {get:(o,k)=>k==='build'?()=>({}):()=>chain()});
function richBuilder(){let text='',url='',style;return {setText(v){text=v;return this;},setLinkUrl(v){url=v;return this;},setTextStyle(v){style=v;return this;},build(){return {text,url,style,getLinkUrl:()=>url};}};}
const file={getId:()=> 'COPY',getUrl:()=> 'https://docs.google.com/spreadsheets/d/COPY/edit',isTrashed:()=>false,setName:n=>file.name=n};
files.COPY=file;
const env={Date,PropertiesService:{getDocumentProperties:()=>({getProperty:k=>props[k]||null,setProperty(k,v){props[k]=v;return this;},getProperties:()=>props})},
Utilities:{DigestAlgorithm:{SHA_256:1},Charset:{UTF_8:1},computeDigest:(alg,s)=>Array.from(crypto.createHash('sha256').update(s).digest())},
LockService:{getDocumentLock:()=>({waitLock(){},releaseLock(){},tryLock:()=>true})},
DriveApp:{getFileById:id=>id==='1p8HXXkmDQ1z2BWhrEftwgCGnl1xFiOWlgtQmCni6VjU'?{getName:()=> 'Template',makeCopy(){copyCount++;return file;}}:files[id]},
SpreadsheetApp:{getActiveSpreadsheet:()=>crm,openById:id=>{assert.equal(id,'COPY');return report;},newDataValidation:chain,newTextStyle:chain,newRichTextValue:richBuilder,flush(){}},
ScriptApp:{getProjectTriggers:()=>[],newTrigger:chain}};
vm.createContext(env);vm.runInContext(fs.readFileSync('Code-CRM-Coverage-Reports-Full.txt','utf8'),env);
const adapted=env.crmReportSheetAdapter_(list);
assert.equal(adapted.getRange(6,2,1,27).getDisplayValues()[0][0],'소개');
assert.equal(adapted.getRange(6,2,1,27).getDisplayValues()[0][1],'홍길동');
const whole=adapted.getRange(6,1,1,28).getDisplayValues()[0];assert.equal(whole.length,28);assert.equal(whole[2],'홍길동');
assert.equal(env.selectCustomerCardRows([whole],'홍길동','960901').length,1);
const event=env.crmReportAdaptEvent_({range:list.getRange('F6'),source:crm});assert.equal(event.range.getColumn(),5);
env.handleContactFormatEdit(event);assert.equal(list.grid[5][5],'010-1234-5678');assert.equal(list.grid[5][1],'+');
const output=Array(27).fill('');output[0]='지인';output[1]='다른고객';adapted.getRange(7,2,1,27).setValues([output]);assert.equal(list.grid[6][2],'지인');assert.equal(list.grid[6][3],'다른고객');assert.equal(list.grid[6][1],'');
adapted.getRange(6,2,1,27).copyTo(adapted.getRange(7,2,1,27),{formatOnly:true});
const views=env.operationalViewFormulas_('고객 관리 LIST');assert(views.auto.includes('Y6:Y'));assert(views.auto.includes('D6:H'));assert(views.card.includes('K6:K'));
env.refreshCrmCoverageReportCells_(crm);assert.equal(copyCount,0);
const url=env.crmCoverageCreate_(crm,6);assert.equal(copyCount,1);assert.equal(file.name,'홍길동님의 보장분석');assert.equal(list.grid[5][1],'보장분석');assert.equal(reportMain.grid[1][1],'홍길동님의\n보장분석리포트');
assert.equal(env.crmCoverageCreate_(crm,6),url);assert.equal(copyCount,1);
// 고객 행에서 이름을 다르게 하면 사본 내부의 샘플 이름도 바뀌는지 별도 확인한다.
env.crmCoveragePersonalize_(report,'김테스트');assert.equal(reportSummary.grid[1][4],'김테스트');assert.equal(reportSummary.grid[40][2],'김테스트');
// 이미 생성한 리포트 링크가 포함된 전체 행을 써도 링크 열을 보존한다.
const values=adapted.getRange(6,1,1,28).getValues();adapted.getRange(6,1,1,28).setValues(values);assert.equal(list.grid[5][1],'보장분석');
console.log('PASS: legacy coordinate reads/writes, card search, phone edit event, customer insertion, native range copy, operational formulas, no eager copy, single lazy copy, duplicate prevention, link label, two-line title, sample-name replacement, report-column preservation.');
assert.equal(vm.runInContext('CUSTOMER_FIELDS.I24',env),21);
adapted.getRange(6,21).setValue('4세대 실손');
assert.equal(list.grid[5][21],'4세대 실손');
assert.equal(adapted.getRange(6,21).getDisplayValue(),'4세대 실손');
const card=new Sheet(284886991,'고객 관리 카드',34,18);card.book=crm;
card.getRange('C4').setValue('홍길동');card.getRange('E4').setValue('960901');
assert.equal(env.crmCoverageCardRow_(crm,card),6);
assert(env.crmReportIsActionEdit_({range:card.getRange('J16')}));
env.refreshCrmCoverageCard_(crm,card,6);
assert.equal(card.getRange('J16').getDisplayValue(),'보장분석');
assert.equal(card.getRange('J16').getRichTextValue().getLinkUrl(),url);
assert.equal(copyCount,1);
card.getRange('C4').setValue('없는고객');
assert.throws(()=>env.crmCoverageCardRow_(crm,card),/확인/);
console.log('PASS: I24 medical mapping, shifted medical storage, card identity lookup, J16 action routing and reuse of the same report URL.');
list.insertColumnBefore(23);
vm.runInContext('CRM_REPORT_SPACER_STATE_=true',env);
const physicalBefore=list.grid[5][23];
adapted.getRange(6,22).setValue('12가3456');
assert.equal(list.grid[5][23],'12가3456');assert.equal(list.grid[5][22],'');
const record=adapted.getRange(6,2,1,27).getValues();
assert.equal(record[0].length,27);assert.equal(record[0][20],'12가3456');
adapted.getRange(7,2,1,27).setValues(record);
assert.equal(list.grid[6][22],'');assert.equal(list.grid[6][23],'12가3456');
const entire=adapted.getRange(6,1,1,28).getValues();assert.equal(entire[0].length,28);
adapted.getRange(6,1,1,28).setValues(entire);
assert.equal(list.grid[5][1],'보장분석');assert.equal(list.grid[5][22],'');
assert(env.crmReportShiftVehicleFormula_(views.auto).includes('Z6:Z'));
assert.equal(env.crmReportAdaptEvent_({range:list.getRange('Z6'),source:crm}).range.getColumn(),24);
console.log('PASS: W spacer preserved through 27-column and whole-row writes, vehicle shifts to X, renewal shifts to Z, event and operational formula coordinates match.');
