import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire('C:/Users/bjy32/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {FileBlob,SpreadsheetFile,Workbook}=await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);
const dir='C:/Users/bjy32/Music/insurance-insight/outputs/customer-xlsx-20261015';
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(`${dir}/source.xlsx`));
const layout=JSON.parse(await fs.readFile(`${dir}/source-layout.json`,'utf8'));
const changed=[];
const value=(s,cell,v)=>{s.getRange(cell).values=[[v]];changed.push([s.name,cell]);};
const formula=(s,cell,f)=>{s.getRange(cell).formulas=[[f]];changed.push([s.name,cell]);};
const list=wb.worksheets.getItem('고객관리 LIST');
formula(list,'A6',`=IF(D6="","",IF(LEN(D6&"")<=6,TEXT(D6,"000000"),LEFT(D6&"",6)))`);
list.getRange('A6:A999').fillDown();
formula(list,'AC6',`=IF(C6="","",C6&"|"&A6)`);
list.getRange('AC6:AC999').fillDown();
formula(list,'AD6','=ROW(D6)-5');
list.getRange('AD6:AD999').fillDown();
value(list,'D5','생년월일');
value(list,'F1','새 고객은 생년월일 6자리(YYMMDD)를 입력하세요. 목록에 입력한 값은 Ctrl+S로 저장합니다.');
list.getRange('D6:D999').setNumberFormat('@');
list.getRange('E6:E999').setNumberFormat('@');
const birthValidation=cell=>{
  const yy=`INT(VALUE(${cell})/10000)`,month=`MOD(INT(VALUE(${cell})/100),100)`,day=`MOD(VALUE(${cell}),100)`;
  const date=`DATE(IF(${yy}<=MOD(YEAR(TODAY()),100),2000,1900)+${yy},${month},${day})`;
  return `OR(${cell}="",AND(LEN(${cell})=6,ISNUMBER(--${cell}),MONTH(${date})=${month},DAY(${date})=${day},${date}<=TODAY()))`;
};
list.getRange('D6:D999').dataValidation={rule:{type:'custom',formula1:birthValidation('D6')}};
const populated=list.getRange('C6:C999').values;
const lastCustomerRow=Math.max(6,...populated.flatMap((row,index)=>row[0]!==null&&row[0]!==''?[index+6]:[]));
const customerTable=list.tables.add(`B5:H${lastCustomerRow}`,true,'CustomerList');
customerTable.style='TableStyleLight1';
// Keep all existing customer records and other input sections intact.
const input=wb.worksheets.getItem('고객추가');
input.getRange('AH1').clear({applyTo:'contents'});
value(input,'E4','생년월일');
value(input,'B10','구분');
for(const cell of ['C4','F4','I4','C6','I6','C8','C10']) {
  input.getRange(cell).clear({applyTo:'contents'});
  input.getRange(cell).format.fill='#FFF7DB';
  input.getRange(cell).format.borders={preset:'outside',style:'thin',color:'#D1D5DB'};
}
input.getRange('F4').setNumberFormat('@');
input.getRange('I4').setNumberFormat('@');
input.getRange('F4').dataValidation={rule:{type:'custom',formula1:birthValidation('F4')}};
input.getRange('C10').dataValidation={rule:{type:'list',values:['지인','소개','DB','SNS','인하우스','산모교실']}};
input.mergeCells('B12:J12'); value(input,'B12','1. 노란 입력칸 작성 → 2. B15:H15 복사 → 3. 고객관리 LIST의 빈 행 B열에 값 붙여넣기');
input.getRange('B12:J12').format.font={size:11,color:'#475569'};
input.getRange('B12:J12').format.rowHeight=32;
input.mergeCells('B13:J13'); value(input,'B13','값 붙여넣기: Ctrl+Alt+V → V → Enter. 붙여넣은 뒤 입력칸을 비워도 저장된 목록은 유지됩니다.');
input.getRange('B13:J13').format.font={size:11,color:'#475569'};
input.getRange('B13:J13').format.rowHeight=30;
input.getRange('B14:H14').values=[['구분','이름','생년월일','전화번호','주소','직업','메모']];
input.getRange('B14:H14').format.fill='#EEF4FF';
input.getRange('B14:H14').format.font={bold:true,color:'#334155',size:11};
['C10','C4','F4','I4','C6','I6','C8'].forEach((from,i)=>formula(input,`${String.fromCharCode(66+i)}15`,`=IF(${from}="","",${from})`));
input.getRange('B15:H15').format.borders={preset:'all',style:'thin',color:'#DCE5F0'};
input.getRange('B15:H15').format.font={size:11,color:'#1E293B'};
input.getRange('B15:H15').format.rowHeight=30;
input.getRange('B15:H15').format.wrapText=false;
value(input,'B17','저장 위치: 고객관리 LIST');
value(input,'G17','조회: 고객정보 조회');
input.getRange('B17:F17').merge(); input.getRange('G17:J17').merge();
input.mergeCells('B19:J19');value(input,'B19','매크로 없이 사용하는 파일입니다. 입력 화면에서 목록으로 자동 누적 저장되지는 않습니다.');
input.getRange('B19:J19').format.font={size:11,color:'#64748B'};
input.mergeCells('B21:J21');value(input,'B21','기본 데이터 폼: LIST 고객정보 표의 셀 선택 → 빠른 실행 도구 모음에 “폼...” 추가 → 새로 만들기');
input.getRange('B21:J21').format.font={size:11,color:'#64748B'};
for(const row of [12,13,19,21]) { input.getRange(`B${row}:J${row}`).format.wrapText=true; input.getRange(`B${row}:J${row}`).format.rowHeight=44; }
// Both existing query cards accept name-only searches, with an optional birthdate.
for(const [number,name,birthCell,ageCell,genderCell,queryBirth] of [
  ['7','고객정보 조회','C7','E7','E9','E4'],
  ['6','고객정보 조회(이름+생년월일)','C8','E8','E10','C5'],
]) {
  const s=wb.worksheets.getItem(name);
  if(number==='7') {
    s.getRange('D4').copyFrom(s.getRange('B4'),'all');value(s,'D4','생년월일');
    s.getRange('E4').copyFrom(s.getRange('C4'),'all');
  }
  value(s,'C4',''); value(s,queryBirth,'');
  s.getRange(queryBirth).setNumberFormat('@');
  for(const c of ['C4',queryBirth]) s.getRange(c).format.fill='#FFF7DB';
  s.getRange(queryBirth).dataValidation={rule:{type:'custom',formula1:`OR(${queryBirth}="",AND(LEN(${queryBirth})=6,ISNUMBER(--${queryBirth})))`}};
  const names="'고객관리 LIST'!$C$6:$C$999", births="'고객관리 LIST'!$A$6:$A$999";
  const keys="'고객관리 LIST'!$AC$6:$AC$999";
  const escape=text=>`SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(${text},"~","~~"),"*","~*"),"?","~?")`;
  const nameKey=escape('$C$4'),birthKey=escape(`$C$4&"|"&TEXT(${queryBirth},"000000")`);
  formula(s,'AF1',`=IF($C$4="",0,IF(${queryBirth}="",COUNTIF(${names},${nameKey}),COUNTIF(${keys},${birthKey})))`);
  formula(s,'AG1',`=IF(AF1=1,IF(${queryBirth}="",VLOOKUP(${nameKey},'고객관리 LIST'!$C$6:$AD$999,28,FALSE),VLOOKUP(${birthKey},'고객관리 LIST'!$AC$6:$AD$999,2,FALSE)),"")`);
  formula(s,'AG2',`=IF(AG1="","",INDEX('고객관리 LIST'!$D$6:$D$999,AG1)&"")`);
  for(const c of layout[number].cells) {
    const match=c.formula?.match(/INDEX\('고객관리 LIST'!\$([A-Z]+)\$6:/);
    if(!match) continue;
    const col=match[1], range=`'고객관리 LIST'!$${col}$6:$${col}$999`;
    formula(s,c.cell,`=IF($AG$1="","",IF(INDEX(${range},$AG$1)="","",INDEX(${range},$AG$1)))`);
  }
  formula(s,birthCell,`=IF($AG$1="","",TEXT(INDEX(${births},$AG$1),"000000"))`);
  value(s,number==='7'?'B7':'B8','생년월일');
  value(s,number==='7'?'I14':'I15','생년월일');
  formula(s,number==='7'?'J14':'J15',`=IF(${birthCell}="","",${birthCell})`);
  const yy=`INT(VALUE(${birthCell})/10000)`,mm=`MOD(INT(VALUE(${birthCell})/100),100)`,dd=`MOD(VALUE(${birthCell}),100)`;
  const century=`IF(LEN($AG$2)>6,IF(OR(MID($AG$2,IF(MID($AG$2,7,1)="-",8,7),1)="3",MID($AG$2,IF(MID($AG$2,7,1)="-",8,7),1)="4",MID($AG$2,IF(MID($AG$2,7,1)="-",8,7),1)="7",MID($AG$2,IF(MID($AG$2,7,1)="-",8,7),1)="8"),2000,1900),IF(${yy}<=MOD(YEAR(TODAY()),100),2000,1900))`;
  const birthDate=`DATE(${century}+${yy},${mm},${dd})`;
  formula(s,'AH1',`=IF(${birthCell}="","",IF(OR(MONTH(${birthDate})<>${mm},DAY(${birthDate})<>${dd},${birthDate}>TODAY()),"",${birthDate}))`);
  formula(s,ageCell,`=IF($AH$1="","",IF($AH$1>TODAY(),"생년월일 확인",DATEDIF($AH$1,TODAY(),"Y")))`);
  const rawNext=`DATE(YEAR(TODAY())+IF(MONTH($AH$1)>6,1,0),MOD(MONTH($AH$1)+5,12)+1,1)`;
  formula(s,'AI1',`=IF(AH1="","",${rawNext})`);
  formula(s,'AJ1',`=IF(AI1="","",IF(AND(MONTH(AI1)=2,DAY(AH1)>28),DATE(YEAR(AI1),3,1),DATE(YEAR(AI1),MONTH(AI1),MIN(DAY(AH1),DAY(DATE(YEAR(AI1),MONTH(AI1)+1,0))))))`);
  // A birthday in July–December has a six-month anniversary in the following year's January–June.
  // Consider the occurrence in this year before choosing the next one.
  formula(s,'AK1',`=IF(AJ1="","",DATE(YEAR(AJ1)-IF(MONTH(AH1)>6,1,0),MONTH(AJ1),DAY(AJ1)))`);
  formula(s,'J4',`=IF(AK1="","",IF(AK1<TODAY(),DATE(YEAR(AK1)+1,MONTH(AK1),DAY(AK1)),AK1))`);
  s.getRange('J4').setNumberFormat('yyyy-mm-dd');
  formula(s,genderCell,`=IF(LEN($AG$2)<=6,"",IF(OR(MID($AG$2,IF(MID($AG$2,7,1)="-",8,7),1)="1",MID($AG$2,IF(MID($AG$2,7,1)="-",8,7),1)="3",MID($AG$2,IF(MID($AG$2,7,1)="-",8,7),1)="5",MID($AG$2,IF(MID($AG$2,7,1)="-",8,7),1)="7"),"남",IF(OR(MID($AG$2,IF(MID($AG$2,7,1)="-",8,7),1)="2",MID($AG$2,IF(MID($AG$2,7,1)="-",8,7),1)="4",MID($AG$2,IF(MID($AG$2,7,1)="-",8,7),1)="6",MID($AG$2,IF(MID($AG$2,7,1)="-",8,7),1)="8"),"여","")))`);
  s.mergeCells('B18:J18');
  formula(s,'B18',`=IF($C$4="","이름을 입력하세요. 동명이인은 생년월일 6자리를 함께 입력하세요.",IF(AF1=0,"일치하는 고객이 없습니다.",IF(AF1>1,IF(${queryBirth}="","동명이인이 있습니다. 생년월일 6자리를 입력하세요.","이름과 생년월일이 같은 고객이 여러 명입니다. LIST에서 확인하세요."),IF(AH1="","고객 생년월일을 확인하세요.",""))))`);
  s.getRange('B18:J18').format.font={size:11,color:'#B45309'};
  s.getRange('B18:J18').format.rowHeight=28;
}
wb.recalculate();
// Verify the actual authored formulas with disposable, fictitious customer records.
const check=Workbook.create();
const checkList=check.worksheets.add('고객관리 LIST');
const checkQuery=check.worksheets.add('고객정보 조회');
checkList.getRange('B6:H7').values=[['DB','검증고객','900101','010-0000-0001','검증주소','검증직업',''],['소개','검증고객','001010','010-0000-0002','','','']];
checkList.getRange('A6:A7').formulas=list.getRange('A6:A7').formulas;
checkList.getRange('AC6:AC7').formulas=list.getRange('AC6:AC7').formulas;
checkList.getRange('AD6:AD7').values=[[1],[2]];
for(const cell of ['AF1','AG1','AG2','AH1','AI1','AJ1','AK1','C7','E7','C8','J4','H4','B18']) checkQuery.getRange(cell).formulas=wb.worksheets.getItem('고객정보 조회').getRange(cell).formulas;
const read=c=>checkQuery.getRange(c).values[0][0];
checkQuery.getRange('C4').values=[['검증고객']]; checkQuery.getRange('E4').values=[['']];check.recalculate();
if(read('C7')!==''||read('AF1')!==2) throw new Error('Duplicate-name guard failed');
checkQuery.getRange('E4').values=[['001010']];check.recalculate();

if(read('C7')!=='001010'||read('C8')!=='010-0000-0002'||read('E7')!==26) throw new Error(`Name and birth lookup failed: ${JSON.stringify([read('C7'),read('C8'),read('E7')])}`);
checkQuery.getRange('C4').values=[['없는고객']];check.recalculate(); if(read('AF1')!==0||read('C7')!=='') throw new Error('Missing customer failed');
checkList.getRange('C7').values=[['다른고객']]; checkQuery.getRange('C4').values=[['검증고객']]; checkQuery.getRange('E4').values=[['']]; check.recalculate();
if(read('C7')!=='900101'||read('C8')!=='010-0000-0001'||read('E7')!==36) throw new Error('Name-only lookup failed');
console.log('Blank, missing, duplicate-name, optional birthdate and leading-zero birthdate tests passed');
await fs.writeFile(`${dir}/changed.json`,JSON.stringify(changed));
for(const [sheetName,file,range] of [['고객추가','add-preview.png','B2:J21'],['고객정보 조회','query-preview.png','B2:J18']]) {
  await fs.writeFile(`${dir}/${file}`,new Uint8Array(await (await wb.render({sheetName,range,scale:1.3})).arrayBuffer()));
}
console.log((await wb.inspect({kind:'table',range:"'고객정보 조회'!C4:J8",include:'values,formulas',tableMaxRows:5,tableMaxCols:8,maxChars:1000})).ndjson);
await (await SpreadsheetFile.exportXlsx(wb)).save(`${dir}/customer-no-macro.xlsx`);
console.log('Export complete');
