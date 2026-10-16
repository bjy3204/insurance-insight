import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
const require=createRequire(import.meta.url),ts=require('typescript');
const module={exports:{}};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./model.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports});
const {customerNames,printJobs,printDocument,overlayHtml,TEMPLATES,isTemplateId,petDecorationHtml,templatePages}=module.exports;
const advisor={name:'담당자',company:'보험나무',phone:'010-1234-5678'};
test('multiple customers print complete sets in customer order, without instruction slide',()=>{
 const names=customerNames('홍길동\r\n\n 김보험 ');
 const jobs=printJobs(names,[9,1,2,1]);
 assert.equal(JSON.stringify(jobs),JSON.stringify([{customer:'홍길동',page:1},{customer:'홍길동',page:2},{customer:'홍길동',page:9},{customer:'김보험',page:1},{customer:'김보험',page:2},{customer:'김보험',page:9}]));
 assert.throws(()=>printJobs(['고객'],[10]));
});
test('single page and 30 customer / 270 page batches are supported, excess rejected',()=>{
 assert.equal(printJobs(['고객'],[4]).length,1);
 assert.equal(printJobs(Array(30).fill('고객'),[1,2,3,4,5,6,7,8,9]).length,270);
 for(const names of [[],Array(31).fill('고객'),['가'.repeat(31)]])assert.throws(()=>printJobs(names,[1]));
 assert.throws(()=>printJobs(['고객'],[]));
});
test('print HTML escapes customer / advisor text and preserves original image with text overlay',()=>{
 const html=printDocument(printJobs(['<script>'],[1]),{1:'blob:original'},{...advisor,name:'<img onerror="x">'});
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img onerror='));
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('blob:original'));assert.ok(html.includes('size:A4 portrait;margin:0'));
 assert.equal((html.match(/<article /g)||[]).length,1);
});
test('all customer / advisor placeholders fill, long names shrink to fit the existing blanks',()=>{
 for(const page of [1,7,9])assert.ok(overlayHtml(page,'홍길동',advisor).includes('홍길동'));
 const expert=overlayHtml(8,'고객',advisor);
 for(const value of Object.values(advisor))assert.ok(expert.includes(value));
 const fontSize=Number(overlayHtml(1,'가'.repeat(30),advisor).match(/font-size:([\d.]+)cqw/)[1]);
 assert.ok(fontSize<1);
});
test('each theme uses its own page count and expert page, including fax and left alignment',()=>{
 for(const [category,template] of Object.entries(TEMPLATES)){
  const pages=template.titles.map((_,index)=>index+1);
  assert.equal(pages.length,category==='care'?10:9);
  assert.equal(printJobs(Array(30).fill('고객'),pages,category).length,pages.length*30);
  assert.throws(()=>printJobs(['고객'],[pages.length+1],category));
  const expert=overlayHtml(template.advisor,'고객',{...advisor,fax:'02-9876-5432'},category);
  assert.ok(expert.includes('02-9876-5432'));assert.ok(expert.includes('justify-content:flex-start'));
  assert.ok(overlayHtml(template.promise,'홍길동',advisor,category).includes('홍길동'));
  if(category==='care')assert.ok(!overlayHtml(8,'고객',{...advisor,fax:'fax-only'},category).includes('fax-only'));
 }
 for(const value of ['../family','constructor','__proto__','missing'])assert.equal(isTemplateId(value),false);
 assert.equal(TEMPLATES.care.advisor,9);
});
test('every configured original PNG is present and print guides are excluded',()=>{
 for(const [category,template] of Object.entries(TEMPLATES)){
  for(let page=1;page<=template.titles.length;page++){
   const bytes=readFileSync(new URL(`../../assets/policy-inserts/${category}/${page}.png`,import.meta.url));
   assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');
   assert.equal(bytes.readUInt32BE(16),1414);assert.equal(bytes.readUInt32BE(20),2000);
  }
  assert.throws(()=>readFileSync(new URL(`../../assets/policy-inserts/${category}/${template.titles.length+1}.png`,import.meta.url)));
 }
});
test('selected cat or dog appears only on the pet information card in every customer set',()=>{
 for(const kind of ['dog','cat']){
  const pet={kind,src:`blob:${kind}`};
  assert.ok(petDecorationHtml(2,'pet',pet).includes(`blob:${kind}`));
  assert.equal(petDecorationHtml(1,'pet',pet),'');
  assert.equal(petDecorationHtml(2,'family',pet),'');
  const jobs=printJobs(['고객1','고객2'],[1,2,8],'pet');
  const html=printDocument(jobs,{1:'blob:cover',2:'blob:card',8:'blob:expert'},advisor,'pet',pet);
  assert.equal((html.match(/class="insert-pet-icon"/g)||[]).length,2);
  assert.equal((html.match(new RegExp(`src="blob:${kind}"`,'g'))||[]).length,2);
 }
});
test('pet preview and print include only the chosen species growth chart',()=>{
 for(const kind of ['dog','cat']){
  const growth=kind==='dog'?3:4,other=kind==='dog'?4:3;
  const pages=templatePages('pet',kind);
  assert.equal(pages.length,8);
  assert.ok(pages.some(item=>item.page===growth));assert.ok(!pages.some(item=>item.page===other));
  assert.match(pages[2].title,kind==='dog'?/^반려견.*나이표$/:/^반려묘.*나이표$/);
  assert.equal(pages[3].page,5);assert.equal(pages[6].page,8);
  const jobs=printJobs(['고객1','고객2'],[1,2,3,4,5,6,7,8,9],'pet',kind);
  assert.equal(jobs.length,16);assert.ok(jobs.every(job=>job.page!==other));
  assert.throws(()=>printJobs(['고객'],[other],'pet',kind));
  assert.equal(printJobs(Array(30).fill('고객'),pages.map(item=>item.page),'pet',kind).length,240);
 }
 assert.equal(templatePages('care','cat').length,10);
});
