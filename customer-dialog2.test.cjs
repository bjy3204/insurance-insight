const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements={};let focused='';
function element(tag){const el={tagName:tag.toUpperCase(),children:[],events:{},style:{},append(...children){this.children.push(...children);children.forEach(c=>c.parentElement=this);},addEventListener(name,fn){this.events[name]=fn;},focus(){focused=this.id;}};Object.defineProperty(el,'id',{get(){return this._id;},set(id){this._id=id;elements[id]=this;}});return el;}
['form','status','submit','close','sections'].forEach(id=>{const el=element(id==='form'?'form':id==='submit'||id==='close'?'button':'div');el.id=id;});
const context={document:{getElementById:id=>elements[id],createElement:element},window:{},console};vm.createContext(context);
const html=fs.readFileSync('customer-dialog2.html','utf8');vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
function key(id,key,shift=false){let prevented=false;elements.form.events.keydown({target:elements[id],key,shiftKey:shift,isComposing:false,preventDefault(){prevented=true;}});assert(prevented);return focused;}
assert.equal(key('category','Tab'),'name');assert.equal(key('category','Enter'),'phone');assert.equal(key('name','Enter'),'job');assert.equal(key('resident','Enter'),'email');assert.equal(key('name','Tab',true),'category');assert.equal(key('discount','Tab'),'submit');
const context2={Date,console,SpreadsheetApp:{getActiveSpreadsheet:()=>({getSpreadsheetTimeZone:()=> 'Asia/Seoul'})},Utilities:{formatDate:()=> '2026-10-15'}};vm.createContext(context2);vm.runInContext(fs.readFileSync('Code-customer-registration2.gs','utf8'),context2);
assert.throws(()=>context2.submitCustomerDialog2({name:'',resident:'960601'}),/고객 이름/);
assert.throws(()=>context2.submitCustomerDialog2({name:'테스트',resident:'001332'}),/생년월일/);
assert.equal(context.formatRenewalInput2('20260901'),'2026-09-01');
assert.equal(context.formatRenewalInput2('2026-09-01'),'2026-09-01');
assert.equal(context2.normalizeRenewalDialog2('20260901'),'2026-09-01');
assert.equal(context2.parseRenewalDate(context2.normalizeRenewalDialog2('20260901')),context2.renewalDateFormula(9,1));
assert.throws(()=>context2.parseRenewalDate(context2.normalizeRenewalDialog2('20260230')));
console.log('PASS: combined script syntax, Tab/Shift+Tab, Enter vertical navigation, missing name, invalid birth');
