const fs=require('fs'),vm=require('vm');let s=fs.readFileSync('Code-CRM-calendar-validation-fixed.txt','utf8');
s=s.replaceAll("'B5:H36'","'B4:H34'").replaceAll("'B6:H6'","'B4:H4'").replaceAll("'B7:H36'","'B5:H34'");
s=s.replace('row=7+week*5','row=5+week*5').replace('const row=7+week*5','const row=5+week*5').replace('Math.max(36,4+rows.length)','Math.max(34,4+rows.length)');
const a=s.indexOf('    const holiday=(model.holidays||{})[date],events='),b=s.indexOf("calendarDateTargets[row+':'+col]=date;",a);
if(a<0||b<0)throw Error('Calendar block missing');
s=s.slice(0,a)+`    const lines=String(model.personal[date]||'').split('\\n');
    for(let k=0;k<4;k++){
      values[week*5+1+k][day]=literalText(k===3?lines.slice(k).join('\\n'):(lines[k]||''));
      calendarDateTargets[(row+1+k)+':'+col]=date;
    }
    `+s.slice(b);
const x=s.indexOf('    for(let w=0;w<6;w++){',s.indexOf('function handleCrmCalendarEdit')),y=s.indexOf('    refreshCrmCalendar(ss);',x);
s=s.slice(0,x)+`    const targets=JSON.parse(PropertiesService.getDocumentProperties().getProperty('CRM_CALENDAR_DATE_MAP')||'{}');
    for(let w=0;w<6;w++){
      const header=5+w*5,first=header+1,last=header+4;
      if(e.range.getRow()>last||e.range.getLastRow()<first)continue;
      for(let col=Math.max(2,e.range.getColumn());col<=Math.min(8,e.range.getLastColumn());col++){
        const date=targets[header+':'+col];if(!date)continue;
        const text=sheet.getRange(first,col,4,1).getDisplayValues().map(r=>r[0]).filter(t=>t.trim()).join('\\n');
        saveCalendarPersonalDay_(sheet,date,text);
      }
    }
`+s.slice(y);
// Keep the user's calendar frame; only refresh its contents and date colors.
new vm.Script(s);fs.writeFileSync('Code-CRM-calendar-personal-only.txt',s);const start=s.indexOf('const CRM_CALENDAR_VIEWS'),end=s.indexOf('// 한국천문연구원',start);fs.writeFileSync('crm-calendar.gs',s.slice(start,end));console.log('PASS: full script syntax');
