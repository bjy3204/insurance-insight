import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function compile(name,dependencies,globals={}) {
  const exports={};
  const source=ts.transpileModule(fs.readFileSync(new URL(`./${name}.ts`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(source,{exports,require:name=>dependencies[name],Date,Event,...globals});
  return exports;
}
const utils=compile('reminder-utils',{});
const event={id:'test-event',title:'테스트',date:'2026-10-01',time:null,place:null,memo:null,content:'',icon:'📅',color:'blue'};
const reminder={event_id:event.id,lead_days:0,notification_date:event.date,acknowledged_at:null};
test('Korean date, month/year boundaries and leap day',()=>{
 assert.equal(utils.koreaDate(new Date('2026-09-30T15:00:00Z')),'2026-10-01');
 assert.equal(utils.reminderDate('2026-10-01',3),'2026-09-28');
 assert.equal(utils.reminderDate('2027-01-01',7),'2026-12-25');
 assert.equal(utils.reminderDate('2028-03-01',1),'2028-02-29');
});
test('Only the configured date is due; confirmed, expired, missing and stale events are excluded',()=>{
 assert.equal(utils.dueReminders([event],[reminder],event.date).length,1);
 assert.equal(utils.dueReminders([event],[reminder],'2026-10-02').length,0);
 assert.equal(utils.dueReminders([event],[{...reminder,acknowledged_at:'confirmed'}],event.date).length,0);
 assert.equal(utils.dueReminders([],[reminder],event.date).length,0);
 assert.equal(utils.dueReminders([{...event,date:'2026-10-02'}],[reminder],event.date).length,0);
});
function storageFixture(failCloud=false) {
 const data=new Map(); let dispatches=0; let failNextReminderWrite=false;
 const localStorage={getItem:key=>data.get(key)??null,setItem:(key,value)=>{if(key===utils.LOCAL_REMINDERS_KEY&&failNextReminderWrite){failNextReminderWrite=false;throw Error('Quota');} data.set(key,value);},removeItem:key=>data.delete(key)};
 const result={data:[],error:failCloud?Error('Cloud unavailable'):null};
 const query={select:()=>query,eq:()=>query,upsert:()=>Promise.resolve(result),delete:()=>query,update:()=>query,then:(resolve,reject)=>Promise.resolve(result).then(resolve,reject)};
 const storage=compile('calendar-storage',{'@/lib/supabase':{supabase:{from:()=>query}},'./reminder-utils':utils},{localStorage,window:{dispatchEvent:()=>dispatches++}});
 return {storage,data,localStorage,failNext:()=>{failNextReminderWrite=true;},dispatches:()=>dispatches};
}
test('Approved account errors never write to local storage',async()=>{
 const f=storageFixture(true);
 await assert.rejects(f.storage.saveReminder(reminder,'approved-user'));
 await assert.rejects(f.storage.loadReminders('approved-user'));
 await assert.rejects(f.storage.acknowledgeReminders([reminder],'approved-user'));
 assert.equal(f.data.size,0);
});
test('Local confirmation persists and only acknowledges the exact configuration',async()=>{
 const f=storageFixture();
 await f.storage.saveReminder(reminder,null);
 await f.storage.acknowledgeReminders([{...reminder,lead_days:1}],null);
 assert.equal(f.storage.readLocalReminders()[0].acknowledged_at,null);
 await f.storage.acknowledgeReminders([reminder],null);
 assert.ok(f.storage.readLocalReminders()[0].acknowledged_at);
 assert.equal(utils.dueReminders([event],f.storage.readLocalReminders(),event.date).length,0);
});
test('Failed local event/reminder write rolls both values back',()=>{
 const f=storageFixture();
 f.localStorage.setItem(utils.LOCAL_EVENTS_KEY,JSON.stringify([event]));
 f.localStorage.setItem(utils.LOCAL_REMINDERS_KEY,JSON.stringify([reminder]));
 const before=JSON.stringify([...f.data]);
 f.failNext();
 assert.throws(()=>f.storage.saveLocalEvents([]));
 assert.equal(JSON.stringify([...f.data]),before);
 assert.equal(f.dispatches(),0);
});
test('Deleting an event removes its local reminder',()=>{
 const f=storageFixture();
 f.localStorage.setItem(utils.LOCAL_EVENTS_KEY,JSON.stringify([event]));
 f.localStorage.setItem(utils.LOCAL_REMINDERS_KEY,JSON.stringify([reminder]));
 f.storage.saveLocalEvents([]);
 assert.equal(f.storage.readLocalReminders().length,0);
});
