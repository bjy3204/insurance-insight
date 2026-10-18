const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const compiled=ts.transpileModule(fs.readFileSync('app/my-page/coverage-customer-registration.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};vm.runInThisContext('(function(exports){'+compiled+'\n})')(mod.exports);
const {ensureCoverageCustomer}=mod.exports;
test('connected stores register missing customers and reuse matching identities',async()=>{
 for(const provider of ['notion','sheets']){
  const calls=[];const existing={id:'existing',values:{'이름':'홍길동','주민번호':'960901-1234567'}};
  for(const rows of [[],[existing]]){
   calls.length=0;global.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,status:200,json:async()=>url.endsWith('?status=1')?{connected:true,ready:true}:url.endsWith('?source=customers')?{data:{customers:rows}}:{record:{id:'new',values:{}}}};};
   const result=await ensureCoverageCustomer(provider,'token','홍길동','960901');
   assert.equal(result.id,rows.length?'existing':'new');assert.equal(calls.filter(c=>c.options.method==='POST').length,rows.length?0:1);
   assert.equal(calls[0].url,provider==='sheets'?'/api/my-page/sheets?status=1':'/api/my-page?status=1');
   if(!rows.length)assert.deepEqual(JSON.parse(calls[2].options.body).values,{'이름':'홍길동','주민번호':'960901'});
  }
 }
});
test('disconnected storage stays personal; setup and server errors are not silently saved as personal',async()=>{
 global.fetch=async()=>({ok:true,json:async()=>({connected:false})});assert.equal(await ensureCoverageCustomer('notion','t','홍길동','960901'),null);
 global.fetch=async()=>({ok:true,json:async()=>({connected:true,ready:false})});await assert.rejects(ensureCoverageCustomer('notion','t','홍길동','960901'),/설정/);
 global.fetch=async()=>({ok:false,status:503,json:async()=>({error:'연결 실패'})});await assert.rejects(ensureCoverageCustomer('sheets','t','홍길동','960901'),/연결 실패/);
});
