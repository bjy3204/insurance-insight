const fs=require('fs'),vm=require('vm');let s=fs.readFileSync('Code-CRM-calendar-cache-parameter-fixed.txt','utf8');
const a=s.indexOf('const CRM_CALENDAR_VIEWS');let tail=s.slice(a);
tail=tail.replaceAll("'T3'","'AO3'").replaceAll("'Q4:U4'","'AL4:AP4'").replaceAll("'AK1'","'AY1'").replaceAll("'AK2'","'AY2'").replaceAll("'AK3'","'AY3'").replaceAll("'AK4'","'AY4'");
tail=tail.replaceAll('5,31,','5,45,').replaceAll('dest+5,31,','dest+5,45,').replaceAll('i+5,31,','i+5,45,').replaceAll('5,35,','5,49,').replaceAll('5,38,','5,52,').replaceAll('5,17,','5,38,').replaceAll('i+5,21','i+5,42').replaceAll('5+i,17,','5+i,38,').replaceAll('row,18,','row,39,').replaceAll('getRow(),18,','getRow(),39,');
tail=tail.replace('getColumn()===21','getColumn()===42').replace('col===18||col===19','col===39||col===40').replace('getColumn()>=20&&e.range.getColumn()<=21','getColumn()>=41&&e.range.getColumn()<=42');
tail=tail.replace('sheet.showColumns(22);sheet.hideColumns(23,sheet.getMaxColumns()-22);','sheet.showColumns(43);sheet.hideColumns(44,sheet.getMaxColumns()-43);');
tail=tail.replace("name+' 생일');","'생일',name,birth);");
let x=tail.indexOf('function ensureCrmCalendarStorage_'),y=tail.indexOf('function renderCrmCalendarDetails_',x);
tail=tail.slice(0,x)+`function ensureCrmCalendarStorage_(sheet) {
  if(sheet.getMaxColumns()<58)sheet.insertColumnsAfter(sheet.getMaxColumns(),58-sheet.getMaxColumns());
  if(sheet.getRange('AY5').getValue()==='v3')return;
  if(sheet.getRange('AK5').getValue()==='v2'){
    sheet.getRange(5,31,sheet.getMaxRows()-4,4).copyTo(sheet.getRange(5,45),{contentsOnly:true});
    sheet.getRange(5,35,sheet.getMaxRows()-4,2).copyTo(sheet.getRange(5,49),{contentsOnly:true});
  }
  sheet.getRange('AY5').setValue('v3');
}
function crmCalendarIcons_(events) {
  const types=new Set(events.map(e=>e.type)),icons=[];
  if(types.has('고객생일'))icons.push('🎂');
  if(types.has('카드수납'))icons.push('💳');
  if(types.has('자동차보험 갱신'))icons.push('🚗');
  if(types.has('면책 종료')||types.has('감액 종료'))icons.push('🔒');
  return Array(4-icons.length).fill('').concat(icons);
}
function renderCrmCalendar_(sheet,model) {
  sheet.getRange('B1').clearContent();
  const values=Array.from({length:30},()=>Array(35).fill('')),colors=Array.from({length:30},()=>Array(35).fill('#202124')),targets={};
  for(let week=0;week<6;week++)for(let day=0;day<7;day++){
    const date=model.start+week*7+day,row=5+week*5,col=2+day*5,inMonth=date>=model.first&&date<=model.end;
    values[week*5][day*5]=crmCalendarDate_(date).getUTCDate();
    values[week*5][day*5+1]=(model.holidays||{})[date]||'';
    colors[week*5][day*5]=!inMonth?'#b7b7b7':day===0||(model.holidays||{})[date]?'#d93025':day===6?'#1a73e8':'#202124';
    for(let k=0;k<5;k++)for(let c=0;c<5;c++)targets[(row+k)+':'+(col+c)]=date;
    if(!inMonth)continue;
    const lines=String(model.personal[date]||'').split('\\n');
    for(let k=0;k<3;k++)values[week*5+1+k][day*5]=literalText(k===2?lines.slice(k).join('\\n'):(lines[k]||''));
    const icons=crmCalendarIcons_(model.events.filter(e=>e.date===date));
    for(let k=0;k<4;k++)values[week*5+4][day*5+1+k]=icons[k];
  }
  sheet.getRange('B5:AJ34').setValues(values).setFontColors(colors);
  PropertiesService.getDocumentProperties().setProperty('CRM_CALENDAR_DATE_MAP',JSON.stringify(targets));
  sheet.getRange(5,52,sheet.getMaxRows()-4,7).clearContent();
  if(model.events.length)sheet.getRange(5,52,model.events.length,7).setValues(model.events.map(e=>[e.date,e.type,literalText(e.name),literalText(e.birth),literalText(e.text),e.view,'']));
  let selected;try{selected=crmCalendarInputDate_(sheet.getRange('AO3').getValue(),sheet.getParent());}catch(error){}
  if(!selected||selected<model.first||selected>model.end)selected=model.today>=model.first&&model.today<=model.end?model.today:model.first;
  sheet.getRange('AO3').setValue(selected).setNumberFormat('yyyy-mm-dd');renderCrmCalendarDetails_(sheet,selected);
}

`+tail.slice(y);
// category merge remains at AL; detail borders and checkboxes remain dynamic.
tail=tail.replace('sheet.hideColumns(22,','sheet.hideColumns(44,').replace('sheet.getMaxColumns()-21','sheet.getMaxColumns()-43');
tail=tail.replace('col<=15','col<=36').replace('getNumColumns()<=2','getNumColumns()<=5').replace('Math.floor((col-2)/2)','Math.floor((col-2)/5)');
tail=tail.replace('first=header+1,last=header+4','first=header+1,last=header+3').replace('col<=Math.min(15,','col<=Math.min(36,').replace('const inputCol=col%2===0?col:col-1','const inputCol=2+Math.floor((col-2)/5)*5').replace('getRange(first,inputCol,4,1)','getRange(first,inputCol,3,1)');
s=s.slice(0,a)+tail;new vm.Script(s);fs.writeFileSync('Code-CRM-calendar-icons.txt',s);console.log('PASS: full script syntax');
