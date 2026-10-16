const fs=require('node:fs'),vm=require('node:vm'),a=require('node:assert/strict');
const c={Date};vm.createContext(c);vm.runInContext(fs.readFileSync('Code-calendar-holidays-complete.txt','utf8'),c);
const ics='BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20260817\r\nSUMMARY:대체공휴일\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20260508\r\nSUMMARY:어버이날\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20260501\r\nSUMMARY:노동절\r\nEND:VEVENT\r\nEND:VCALENDAR';
const rows=c.parseCrmHolidayIcs_(ics,false);a.equal(rows.length,2);a.equal(rows[0][0],c.crmCalendarSerial_(2026,8,17));
const holidays=c.crmCalendarHolidays_({getLastRow:()=>4,getRange:()=>({getValues:()=>[]})});
a.equal(holidays[c.crmCalendarSerial_(2026,7,17)],'제헌절');a.equal(holidays[c.crmCalendarSerial_(2026,5,1)],'노동절');a.equal(holidays[c.crmCalendarSerial_(2026,10,5)],'대체공휴일');
// Render a past month with substitute holidays and verify faint outside dates and weekday colors.
const model=c.buildCrmCalendarModel_(2026,8,c.crmCalendarSerial_(2026,10,15),[],[],[],Array.from({length:6},()=>({count:0,amount:0})));model.holidays=holidays;
const colors={},texts={};const chain={setValue(){return this;},setBackground(){return this;},setNumberFormat(){return this;},setValues(){return this;},setNotes(){return this;}};
const sheet={showColumns(){},hideColumns(){},getMaxRows:()=>1000,hideRows(){},getRange(row,col,h,w){return {...chain,setFontColor(color){colors[row+':'+col]=color;return this;},setValues(values){texts[row+':'+col]=values;return this;}};}};
c.renderCrmCalendar_(sheet,model,'캘린더',Array.from({length:6},()=>({count:0,amount:0})));
a.equal(colors['8:2'],'#b7b7b7'); // July 26, previous month
a.equal(colors['8:8'],'#1a73e8'); // August 1, Saturday
a.equal(colors['14:8'],'#d93025'); // August 15, holiday takes precedence over Saturday
a.equal(colors['17:3'],'#d93025'); // August 17, substitute holiday
a(texts['18:2'][0].includes('대체공휴일'));
console.log('PASS: public ICS filtering, updated 2026 holidays, substitute holiday display, Sunday/holiday red, Saturday blue, adjacent month faint');
