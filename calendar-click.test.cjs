const fs=require('fs'),vm=require('vm'),a=require('assert/strict');let chosen,rendered;
const c={Date};vm.createContext(c);vm.runInContext(fs.readFileSync('Code-CRM-calendar-merged-query-fixed.txt','utf8'),c);c.crmSheetRole_=()=> '캘린더';c.renderCrmCalendarDetails_=(sheet,date)=>rendered=date;
const sheet={getRange(addr){return {getValue:()=>addr==='G2'?2026:10,setValue:v=>{chosen=v;return {setNumberFormat(){}}}}}};
const click=(row,col,width)=>c.onSelectionChange({source:{},range:{getSheet:()=>sheet,getRow:()=>row,getColumn:()=>col,getNumRows:()=>1,getNumColumns:()=>width}});
click(17,8,2);a.equal(chosen,c.crmCalendarSerial_(2026,10,14));a.equal(rendered,chosen);click(23,12,2);a.equal(chosen,c.crmCalendarSerial_(2026,10,23));click(10,2,1);a.equal(chosen,c.crmCalendarSerial_(2026,10,4));console.log('PASS: merged day input cells and date cells select the correct date');

