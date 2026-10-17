import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript'),module={exports:{}};
const compiled=ts.transpileModule(fs.readFileSync('lib/calendar-sticker.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInThisContext('(function(exports){'+compiled+'})')(module.exports);
const {fitCalendarSticker}=module.exports;
test('calendar sticker stays reachable after a desktop-to-mobile viewport change',()=>{
 const result=fitCalendarSticker({x:1400,y:800,width:600,height:700},{width:360,height:640});
 assert.ok(result.x>=0&&result.y>=0);assert.ok(result.x+result.width<=360);assert.ok(result.y+result.height<=640);assert.equal(result.width,336);assert.equal(result.height,616);
});
test('calendar sticker bounds resizing and preserves normal geometry',()=>{
 const valid={x:24,y:100,width:380,height:520};assert.deepEqual(fitCalendarSticker(valid,{width:1200,height:900}),valid);
 const small=fitCalendarSticker({x:-200,y:-300,width:30,height:40},{width:1200,height:900});assert.deepEqual(small,{x:0,y:0,width:280,height:320});
 const tiny=fitCalendarSticker(valid,{width:240,height:280});assert.ok(tiny.width<=216&&tiny.height<=256);
});
test('quick calendar opens the shared sticker instead of navigating away',()=>{
 const quick=fs.readFileSync('app/features/home/components/QuickMenuPanel.tsx','utf8');assert.ok(!quick.includes('window.location.href = "/calendar"'));assert.equal((quick.match(/open-calendar-sticker/g)||[]).length,2);
 const crm=fs.readFileSync('app/notion-crm/NotionCrm.tsx','utf8');assert.match(crm,/<CrmCalendarContext.Provider[^\n]+<CalendarSticker\/>/);
});
