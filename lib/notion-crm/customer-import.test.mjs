import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript'),cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const local=name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):name.startsWith('@/')?load(path.resolve(name.slice(2)+'.ts')):require(name);vm.runInThisContext('(function(require,module,exports){'+compiled+'\n})',{filename:file})(local,module,module.exports);return module.exports;}
const {parseLinkedImport,importHeaders,contractImportHeaders}=load('lib/notion-crm/customer-import.ts');
const people=[['고객번호','이름','주민번호','연락처'],['C001','테스트','0001013','010-1234-5678']];
const contracts=[['고객번호','계약일','상품명','보험료'],['C001','2026-10-17','보험 A','16,000'],['C001','2026-10-18','보험 B','20000']];
test('one customer links multiple contracts and preserves leading zero',()=>{const rows=parseLinkedImport(people,contracts,[]);assert.equal(rows.length,3);assert.ok(rows.every(r=>!r.error));assert.equal(rows[0].values['주민번호'],'0001013');assert.equal(rows[0].values['생년월일'],'2000-01-01');assert.equal(rows[1].customerKey,rows[0].customerKey);assert.equal(rows[1].values['보험료'],'16000');assert.equal(rows[1].values['피보험자'],'테스트');assert.equal(rows[1].values['계약자 생년월일'],'000101');assert.equal(rows[0].values['고객번호'],undefined);});
test('existing customer links without overwrite',()=>{const rows=parseLinkedImport(people,contracts,[{id:'existing',values:{이름:'테스트',주민번호:'0001013123456'},edited:''}]);assert.equal(rows[0].existingId,'existing');assert.ok(rows.every(r=>!r.error));});
test('rejects unknown keys, invalid dates and numbers',()=>{for(const bad of [['missing','2026-10-17','A','1'],['C001','2026-02-30','A','1'],['C001','2026-10-17','A','-1']])assert.ok(parseLinkedImport(people,[contracts[0],bad],[])[1].error);});
test('duplicate customer keys block linked contracts',()=>{const rows=parseLinkedImport([...people,['C001','다른고객','9601011','']],contracts,[]);assert.ok(rows.every(r=>r.error));});
test('duplicate contract rows are excluded',()=>assert.ok(parseLinkedImport(people,[...contracts,contracts[1]],[]).at(-1).error));
test('invalid resident and missing mandatory headers fail',()=>{assert.throws(()=>parseLinkedImport([['이름'],['A']],[],[]));assert.ok(parseLinkedImport([people[0],['C001','A','0002303','']],[],[])[0].error);});
test('over limits fail before saving',()=>{assert.throws(()=>parseLinkedImport([people[0],...Array(201).fill(people[1])],[],[]),/200/);assert.throws(()=>parseLinkedImport(people,[contracts[0],...Array(501).fill(contracts[1])],[]),/500/);});
test('template roundtrip has exact headers and no customer records',()=>{const XLSX=require('xlsx');const wb=XLSX.readFile('public/templates/customer-import.xlsx',{cellNF:true,sheetStubs:true});assert.deepEqual(wb.SheetNames,['고객정보','계약정보','작성안내']);for(const [name,expected]of [['고객정보',importHeaders],['계약정보',contractImportHeaders]]){const sheet=wb.Sheets[name];const matrix=XLSX.utils.sheet_to_json(sheet,{header:1,raw:false,defval:''});assert.deepEqual(matrix[0],expected);assert.ok(matrix.slice(1).every(row=>row.every(v=>!v)));}const archive=XLSX.CFB.read(fs.readFileSync('public/templates/customer-import.xlsx'),{type:'buffer'});const entry=archive.FileIndex[archive.FullPaths.findIndex(p=>p.endsWith('/xl/styles.xml'))];const styles=Buffer.from(entry.content).toString('utf8');assert.match(styles,/formatCode=["']@["']/);if(wb.Sheets['고객정보'].C2?.z!=='@'){assert.match(styles,/AlternateContent/);assert.match(styles,/<(?:\w+:)?xf[^>]*numFmtId=["']164["']/);} });

test('already saved contract is excluded on reupload',()=>{const customer={id:'existing',values:{이름:'테스트',주민번호:'0001013'},edited:''};const rows=parseLinkedImport(people,contracts,[customer]);const existing={id:'contract',edited:'',values:{...rows[1].values,고객:['existing']}};assert.match(parseLinkedImport(people,contracts,[customer],[existing])[1].error,/이미 등록/);});

test('four separate exports retain relations, leading zeros and all rows',()=>{
 const {exportMatrix}=load('lib/notion-crm/customer-export.ts');
 const customer={id:'customer-1',edited:'',values:{이름:'테스트',주민번호:'0001013',연락처:'01012345678',계좌번호:'001234',생년월일:'2000-01-01'}};
 const data={customers:[customer,{id:'customer-2',edited:'',values:{이름:'다른고객'}}],contracts:[{id:'contract',edited:'',values:{고객:['customer-1'],상품명:'=SUM(A1:A2)',보험료:16000}}],cars:[{id:'car',edited:'',values:{고객:['customer-1'],차량번호:'01가1234'}}],cards:[{id:'payment',edited:'',values:{고객:['customer-1'],카드번호:'001234567890',보험사:'보험사 A'}}],events:[]};
 for(const source of ['customers','contracts','cars','cards']){const matrix=exportMatrix(source,data),entry=Object.fromEntries(matrix[0].map((name,index)=>[name,matrix[1][index]]));assert.equal(matrix.length,data[source].length+1);assert.ok(!matrix[0].includes('고객번호'));assert.ok(!matrix.flat().includes('customer-1'));if(source!=='customers')assert.equal(entry['고객명'],'테스트');if(source==='customers'){assert.equal(entry['주민번호'],'0001013');assert.equal(entry['계약건수'],1);assert.equal(entry['계좌번호'],'001234');}if(source==='contracts')assert.equal(entry['상품명'],'=SUM(A1:A2)');if(source==='cars')assert.equal(entry['연락처'],'01012345678');if(source==='cards')assert.equal(entry['카드번호'],'001234567890');}
});

test('calendar schedules roundtrip through CRM without duplicate storage or timezone drift',()=>{
 const {accountEventRow,eventCalendarFields}=load('lib/notion-crm/account-calendar.ts');
 const row=accountEventRow({id:'calendar-id',title:'상담',date:'2026-10-18',time:'09:30:00',content:'상담 내용',memo:'메모',place:'사무실',category:'업무'});
 assert.equal(row.id,'calendar:calendar-id');assert.equal(row.values['일정'],'2026-10-18T09:30:00+09:00');
 const fields=eventCalendarFields(row.values);assert.equal(fields.date,'2026-10-18');assert.equal(fields.time,'09:30');assert.equal(fields.content,'상담 내용');assert.equal(fields.category,'업무');
 assert.equal(eventCalendarFields({...row.values,일정:'2026-10-17T15:30:00.000Z'}).date,'2026-10-18');assert.equal(eventCalendarFields({...row.values,일정:'2026-10-17T15:30:00.000Z'}).time,'00:30');
 assert.equal(eventCalendarFields({...row.values,일정:'2026-10-18'}).time,null);assert.throws(()=>eventCalendarFields({...row.values,일정:'2026-02-30'}));
});
test('schedule consultation rows update once, retain manual notes and migrate reaction to memo',()=>{
 const {consultationEventNotes,linkedAccountRows,calendarCompletionKey}=load('lib/notion-crm/event-consultations.ts');
 const {parseConsultationRecords}=load('app/my-page/customer-consultations.ts');
 const manual={id:'11111111-1111-4111-8111-111111111111',date:'2026-10-10',content:'기존 상담',reaction:'기존 고객 반응',nextContact:'',status:''};
 let customer={id:'customer',edited:'revision',values:{이름:'테스트',주민번호:'0001013','상담일지 데이터':JSON.stringify({version:1,entries:[],records:[manual]})}};
 let event={id:'calendar:event-id',edited:'',values:{제목:'상담',분류:'상담',일정:'2026-10-17T00:30:00Z',고객:['customer'],상담내용:'보장 상담',메모:'추가 안내',완료:false}};
 let raw=consultationEventNotes(customer,event),rows=parseConsultationRecords(raw);assert.equal(rows.length,2);assert.equal(rows[0].memo,'기존 고객 반응');assert.equal(rows[1].memo,'추가 안내');assert.equal(rows[1].content,'보장 상담');assert.equal(rows[1].date,'2026-10-17');const id=rows[1].id;
 customer={...customer,values:{...customer.values,'상담일지 데이터':raw}};
 raw=consultationEventNotes(customer,{...event,values:{...event.values,상담내용:'수정된 상담'}});rows=parseConsultationRecords(raw);assert.equal(rows.length,2);assert.equal(rows[1].id,id);assert.equal(rows[1].content,'수정된 상담');
 assert.equal(linkedAccountRows([event],[customer])[0].values['고객'][0],'customer');
 assert.equal(parseConsultationRecords(consultationEventNotes(customer,event,true)).length,1);
 assert.equal(parseConsultationRecords(consultationEventNotes(customer,{...event,values:{...event.values,고객:['other']}})).length,1);
 assert.equal(calendarCompletionKey(event),'event:event-id');assert.equal(calendarCompletionKey({...event,id:'crm-id'}),'event:crm:crm-id');
 assert.throws(()=>consultationEventNotes(customer,{...event,values:{...event.values,상담내용:'a'.repeat(2001)}}),/2,000/);
});
test('consultation memo and source identity persist with native Notion and spreadsheet representations',()=>{
 const {consultationEventNotes}=load('lib/notion-crm/event-consultations.ts'),{writeProperties,readPage}=load('lib/notion-crm/records.ts'),sheets=load('lib/notion-crm/sheets.ts');
 const customer={id:'customer',edited:'',values:{}},event={id:'event',edited:'',values:{제목:'상담',분류:'상담',일정:'2026-10-17',고객:['customer'],상담내용:'상담 내용',메모:'기록 메모'}};
 const raw=consultationEventNotes(customer,event),values={'상담일지 데이터':raw};
 const props=writeProperties('customers',values,{'상담일지 데이터':{type:'rich_text'}});const restored=readPage({id:'customer',last_edited_time:'v1',properties:{'상담일지 데이터':{type:'rich_text',...props['상담일지 데이터']}}});assert.equal(restored.values['상담일지 데이터'],raw);
 const row=sheets.sheetRow('customers',sheets.rowCells('customers',[],values,'customer'));assert.equal(row.values['상담일지 데이터'],raw);assert.ok(raw.includes('"memo":"기록 메모"'));assert.ok(!raw.includes('"reaction"'));
});
test('reference order preserves company before job, claim then medical then car, and contract memo before expiry',()=>{
 assert.deepEqual(importHeaders.slice(0,8),['유입경로','이름','주민번호','연락처','주소','회사','직업','메모']);
 assert.ok(importHeaders.indexOf('계좌번호')<importHeaders.indexOf('실손 보험사'));assert.ok(importHeaders.indexOf('실손 만기일')<importHeaders.indexOf('차량번호'));
 assert.deepEqual(contractImportHeaders.slice(-4),['메모','만기','면책기간(개월)','감액기간(개월)']);
});
test('customer workbook separates payment and vehicle into related rows and validates child fields',()=>{
 const headers=['고객번호','이름','주민번호','결제일','명의자','수납 보험사','카드사','카드번호','유효기간','차량번호','차종','갱신일','자동차 보험사'];
 const input=[headers,['C001','테스트','0001013','17','다른 명의','수납보험사','카드사','001234','28/03','12가3456','승용차','2026-10-17','자동차보험사']];
 const rows=parseLinkedImport(input,[],[]);assert.equal(rows.length,3);assert.ok(rows.every(row=>!row.error));assert.equal(rows[0].source,'customers');assert.equal(rows[0].values['카드번호'],undefined);assert.equal(rows[1].source,'cards');assert.equal(rows[1].values['카드번호'],'001234');assert.equal(rows[1].values['보험사'],'수납보험사');assert.equal(rows[2].source,'cars');assert.equal(rows[2].values['보험사'],'자동차보험사');assert.ok(rows.every(row=>row.customerKey==='C001'));
 const bad=input.map(row=>[...row]);bad[1][3]='32';assert.ok(parseLinkedImport(bad,[],[])[1].error);
 const customer={id:'existing',edited:'',values:{이름:'테스트',주민번호:'0001013'}};const existing=rows[1];const again=parseLinkedImport(input,[],[customer],[],{cards:[{id:'card',edited:'',values:{...existing.values,고객:['existing']}}],cars:[]});assert.match(again[1].error,/이미 등록/);
});
test('customer numbers are optional, generated without collisions, and contracts link by owner identity',()=>{
 const people=[['고객번호','이름','주민번호'],['','테스트','0001013'],['C001','다른고객','9601011']];
 const contract=[['계약일','계약자','계약자 생년월일','상품명'],['2026-10-17','테스트','000101','상품']];
 const rows=parseLinkedImport(people,contract,[]);assert.ok(rows.every(row=>!row.error));assert.equal(rows[0].customerKey,'C002');assert.equal(rows[1].customerKey,'C001');assert.equal(rows[2].customerKey,'C002');
 const ambiguous=parseLinkedImport([people[0],['','동명이인','0001013'],['','동명이인','0001014']],[contract[0],['2026-10-17','동명이인','000101','상품']],[]);assert.match(ambiguous.at(-1).error,/여러 명/);
});

test('download template and preview omit customer number input',()=>{assert.ok(!importHeaders.includes('고객번호'));assert.ok(!contractImportHeaders.includes('고객번호'));const ui=fs.readFileSync('app/notion-crm/CustomerImportDialog.tsx','utf8');assert.ok(!ui.includes('고객번호'));});

test('resident and phone separators normalize without losing leading zeros',()=>{for(const [resident,phone] of [['000101-3','010-1234-5678'],['000101.3','010.1234.5678'],['000101 3','010 1234 5678']]){const row=parseLinkedImport([['이름','주민번호','연락처'],['테스트',resident,phone]],[],[])[0];assert.equal(row.error,'');assert.equal(row.values['주민번호'],'0001013');assert.equal(row.values['연락처'],'01012345678');}});

test('download formatting sets all row heights and colored header while preserving text',async()=>{
 const XLSX=require('xlsx'),JSZip=require('jszip');const {formatExportWorkbook}=load('lib/notion-crm/excel-format.ts');
 const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([['이름','연락처'],['테스트','01012345678']]),'고객정보');
 const bytes=await formatExportWorkbook(XLSX.write(book,{type:'array',bookType:'xlsx'}));const zip=await JSZip.loadAsync(bytes);const sheet=await zip.file('xl/worksheets/sheet1.xml').async('string'),styles=await zip.file('xl/styles.xml').async('string');
 assert.equal((sheet.match(/ht="20" customHeight="1"/g)||[]).length,2);assert.match(styles,/FF195DFF/);assert.match(styles,/FFFFFFFF/);assert.match(styles,/horizontal="center"/);assert.match(sheet,/<c r="A1"[^>]* s="\d+"/);const read=XLSX.read(bytes,{type:'array'});assert.equal(read.Sheets['고객정보'].B2.v,'01012345678');
});
