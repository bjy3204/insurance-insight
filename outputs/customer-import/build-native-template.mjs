// Reference generator only. The live template is user-approved-template.xlsx, edited by the user.
import fs from 'node:fs/promises';
import {Workbook,SpreadsheetFile} from 'file:///C:/Users/bjy32/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const headers=['유입경로', '이름', '생년월일', '연락처', '주소', '회사', '직업', '메모', 'E-Mail', '예금주', '예금주 생년월일', '은행', '계좌번호', '실손 보험사', '실손 가입일', '실손 세대', '실손 만기일', '차량번호', '차종', '갱신일', '자동차 보험사', '운전자지정', '할인'];
const wb=Workbook.create(),s=wb.worksheets.add('고객정보');s.showGridLines=false;
s.getRange('A1:W1').values=[headers];s.getRange('A1:W201').format.font={name:'Malgun Gothic',size:11};
s.getRange('A1:W201').format.columnWidth=20;s.getRange('A1:W201').format.rowHeight=25;s.getRange('A2:W201').format.numberFormat='@';
s.getRange('A1:W1').format={fill:'#195DFF',font:{name:'Malgun Gothic',bold:true,color:'#FFFFFF'},rowHeight:32};s.freezePanes.freezeRows(1);s.freezePanes.freezeColumns(1);
const c=wb.worksheets.add('계약정보');c.showGridLines=false;c.getRange('A1:L1').values=[['계약일','계약자','계약자 생년월일','피보험자','피보험자 생년월일','보험사','보험료','상품명','메모','만기','면책기간(개월)','감액기간(개월)']];c.getRange('A1:L501').format.font={name:'Malgun Gothic',size:11};c.getRange('A1:L501').format.columnWidth=22;c.getRange('A1:L501').format.rowHeight=25;c.getRange('A2:L501').format.numberFormat='@';c.getRange('A1:L1').format={fill:'#195DFF',font:{bold:true,color:'#FFFFFF'},rowHeight:32};c.freezePanes.freezeRows(1);c.freezePanes.freezeColumns(1);
const guide=wb.worksheets.add('작성안내');guide.showGridLines=false;
guide.getRange('A1:B9').values=[['연결 없이 사용하기 양식','작성 방법'],['필수 항목','고객정보: 이름, 생년월일 7자리 / 계약정보: 계약자, 계약자 생년월일, 계약일, 상품명'],['주민번호','앞 6자리+뒷자리 첫 숫자(7자리) 또는 전체 13자리'],['날짜','YYYY-MM-DD 형식 (예: 2026-10-17)'],['연락처·계좌번호','앞자리 0이 사라지지 않도록 텍스트로 입력'],['등록 한도','파일당 고객 200명·계약 500건 / 5MB 이하'],['중복 처리','기존 고객은 이름+생년월일 7자리로 연결하고 기존 정보를 유지'],['입력 범위','고객과 계약은 계약자 이름+생년월일로 자동 연결'],['주의 사항','첫 행 제목을 유지해 주세요. 수식은 입력하지 마세요.']];
guide.getRange('A1:B9').format.font={name:'Malgun Gothic',size:11};guide.getRange('A:A').format.columnWidth=22;guide.getRange('B:B').format.columnWidth=100;guide.getRange('A1:B9').format.rowHeight=28;guide.getRange('A1:B1').format={fill:'#195DFF',font:{bold:true,color:'#FFFFFF'}};
for(const [sheet,range,cols] of [[s,'A1:W201',headers],[c,'A1:L501',['계약일','계약자','계약자 생년월일','피보험자','피보험자 생년월일','보험사','보험료','상품명','메모','만기','면책기간(개월)','감액기간(개월)']]]){
 const area=sheet.getRange(range);area.format.horizontalAlignment='center';area.format.verticalAlignment='center';area.format.rowHeight=28;area.format.borders={preset:'all',style:'thin',color:'#DFE5EF'};
 cols.forEach((name,index)=>{const col=index<26?String.fromCharCode(65+index):'A'+String.fromCharCode(65+index-26);sheet.getRange(col+':'+col).format.columnWidth=name==='주소'?44:name==='메모'?40:['상품명','카드번호','계좌번호'].includes(name)?28:name.includes('생년월일')?20:['주민번호','연락처'].includes(name)?22:16;});sheet.getRange('1:1').format.rowHeight=32;
}
guide.getRange('A3:B3').values=[['생년월일','앞 6자리+뒷자리 첫 숫자까지 7자리만 입력. 전체 주민번호·카드수납 등록 불가']];guide.getRange('A5:B5').values=[['연락처·생년월일','텍스트 형식으로 앞자리 0 유지. 연락처는 하이픈(-)·점(.)·공백 사용 가능']];
wb.recalculate();console.log(await wb.inspect({kind:'table',range:'고객정보!A1:H3',include:'values',tableMaxRows:3,tableMaxCols:8}));
const png=await wb.render({sheetName:'작성안내',range:'A1:B9',scale:1.5});await fs.writeFile('outputs/customer-import/native-template-preview.png',new Uint8Array(await png.arrayBuffer()));
await (await SpreadsheetFile.exportXlsx(wb)).save('public/templates/고객 일괄 등록_연결없이.xlsx');



for(const [sheetName,range,file]of [['고객정보','A1:J4','native-customer-order'],['고객정보','Q1:W4','native-claim-car-order'],['계약정보','A1:J4','native-contract-order']]){const preview=await wb.render({sheetName,range,scale:1});await fs.writeFile('outputs/customer-import/'+file+'.png',new Uint8Array(await preview.arrayBuffer()));}
