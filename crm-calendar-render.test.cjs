const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');let saved={},grid;
const c={Date,PropertiesService:{getDocumentProperties:()=>({setProperty:(k,v)=>saved[k]=v})},SpreadsheetApp:{BorderStyle:{SOLID:'SOLID'}},literalText:x=>x,contractExpirySerial_:()=>0,birthFromResidentNumber:()=>'',crmCalendarInputDate_:()=>0};
vm.createContext(c);vm.runInContext(fs.readFileSync('crm-calendar.gs','utf8'),c);
const sheet=new Proxy({getMaxColumns:()=>44,getMaxRows:()=>998,getLastRow:()=>5,getParent:()=>({})},{get:(o,k)=>o[k]||(()=>{})});
sheet.getRange=(...args)=>{let proxy;const methods={getValue:()=>'',getValues:()=>[],setValues:v=>{if(args[0]==='B5:H34')grid=v;return proxy;}};proxy=new Proxy(methods,{get:(o,k)=>o[k]||(()=>proxy)});return proxy;};
const m=c.buildCrmCalendarModel_(2026,10,c.crmCalendarSerial_(2026,10,15),[],[],[]);m.holidays={};c.renderCrmCalendar_(sheet,m);
assert.equal(grid.length,30);assert.deepEqual(Array.from(grid[0]),[27,28,29,30,1,2,3]);assert.deepEqual(Array.from(grid[25]),[1,2,3,4,5,6,7]);assert.equal(Object.keys(JSON.parse(saved.CRM_CALENDAR_DATE_MAP)).length,155);console.log('PASS: six-week renderer, 30 rows, day numbers, clickable date mapping');

