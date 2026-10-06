import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import ts from 'typescript';
import XLSX from 'xlsx';
const exports={};
const source=ts.transpileModule(fs.readFileSync(new URL('./nps-table-parser.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
vm.runInNewContext(source,{exports,require:createRequire(import.meta.url),Buffer,URL,Date});
const {parseNpsWorkbook,validateNpsTables,findLatestNpsSource,findNpsDownload}=exports;
const baseline=JSON.parse(fs.readFileSync(new URL('../app/pension-calculator/data/nps-tables.json',import.meta.url),'utf8'));
function workbook(change=()=>{}) {
 const book=XLSX.utils.book_new();
 for(const [name,key,headers] of [['노령연금','oldAge',['10년','15년','20년','25년','30년','35년','40년']],['장애연금','disability',['1급','2급','3급','장애4급']],['유족연금','survivor',['10년미만','10년이상20년미만','20년']]]) {
  const rows=[['번호','소득','연금보험료',...headers],...baseline[key].map(row=>Object.values(row))];
  change(rows,key);
  XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet(rows),name);
 }
 return XLSX.write(book,{type:'buffer',bookType:'xlsx'});
}
test('All three official tables retain all 620 rows, including inserted median income',()=>{
 const parsed=parseNpsWorkbook(workbook(),baseline,baseline.downloadUrl);
 for(const key of ['oldAge','disability','survivor']) assert.equal(JSON.stringify(parsed[key]),JSON.stringify(baseline[key]));
 assert.ok(parsed.oldAge.some(row=>row.income===1013000));
});
test('Changed column order and interrupted numeric data are rejected',()=>{
 assert.throws(()=>parseNpsWorkbook(workbook((rows,key)=>{if(key==='oldAge') [rows[0][3],rows[0][4]]=[rows[0][4],rows[0][3]];}),baseline,baseline.downloadUrl));
 assert.throws(()=>parseNpsWorkbook(workbook((rows,key)=>{if(key==='survivor') rows[50][0]=null;}),baseline,baseline.downloadUrl));
});
test('Missing income rows, damaged amounts and inconsistent tables are rejected',()=>{
 for(const change of [data=>data.oldAge[50].income+=10001,data=>data.oldAge[50].year10='bad',data=>data.disability.pop()]) {
  const data=structuredClone(baseline);change(data);assert.throws(()=>validateNpsTables(data));
 }
});
test('Discovery excludes future and non-official sources; missing workbook is rejected',()=>{
 const link=(month,host='https://m.nps.or.kr')=>`<a href="${host}/getOHAF0272M1Detail.do?pstId=x">2026년 ${month}월 예상연금월액표</a>`;
 assert.equal(findLatestNpsSource(link(1)+link(7)+link(12)+link(9,'https://example.com'),new Date('2026-10-06')).effectiveMonth,'2026-07');
 assert.throws(()=>findNpsDownload('<a>PDF only</a>'));
});
test('Official downloaded workbook matches the embedded baseline', ()=>{
 const parsed=parseNpsWorkbook(fs.readFileSync(new URL('./fixtures/nps-2026-07.xlsx',import.meta.url)),baseline,baseline.downloadUrl);
 for(const key of ['oldAge','disability','survivor']) assert.equal(JSON.stringify(parsed[key]),JSON.stringify(baseline[key]));
 assert.equal(parsed.checksum,baseline.checksum);
});

test('Shared dialog renders official values and keeps ordinary text on the default cursor',async()=>{
 const nativeRequire=createRequire(import.meta.url);
 const React=nativeRequire('react');const {renderToStaticMarkup}=nativeRequire('react-dom/server');
 const output={};
 const code=ts.transpileModule(fs.readFileSync(new URL('../app/components/NpsTableModal.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{exports:output,require:name=>name.includes('nps-tables.json')?baseline:nativeRequire(name)});
 const html=renderToStaticMarkup(React.createElement(output.default,{onClose:()=>{}}));
 assert.ok(html.includes('2026년 07월'));
 assert.ok(html.includes('2,103,450'));
 assert.equal((html.match(/<tr/g)||[]).length,621);
 assert.ok(html.includes('cursor-default w-full min-w-[900px]'));
 assert.ok(html.includes('cursor-text w-full'));
 for(const path of ['../app/pension-calculator/page.tsx','../app/features/home/HomePage.tsx']) assert.ok(fs.readFileSync(new URL(path,import.meta.url),'utf8').includes('<NpsTableModal'));
});
