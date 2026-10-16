const fs=require('fs');let s=fs.readFileSync('crm-calendar.gs','utf8');const a=s.indexOf("  sheet.getRange('B7:H36')"),b=s.indexOf("  PropertiesService.getDocumentProperties()",a);
s=s.slice(0,a)+`
  sheet.getRange('B5:H36').breakApart().clearContent().clearNote().setBackground('#ffffff').setFontColor('#202124').setBorder(false,false,false,false,false,false);
  sheet.getRange('B6:H6').setValues([['일','월','화','수','목','금','토']]).setFontWeight('bold').setHorizontalAlignment('center');
  sheet.setRowHeights(6,31,28);
  const map={},values=Array.from({length:30},()=>Array(7).fill(''));
  for(let week=0;week<6;week++)for(let day=0;day<7;day++){
    const date=model.start+week*7+day,row=7+week*5,col=2+day,inMonth=date>=model.first&&date<=model.end;
    values[week*5][day]=date;
    if(!inMonth)continue;
    const holiday=(model.holidays||{})[date],events=model.events.filter(e=>e.date===date&&e.type!=='개인일정');
    const labels=(holiday?[holiday]:[]).concat(events.map(e=>e.type+' · '+e.text));
    for(let k=0;k<3;k++){values[week*5+1+k][day]=literalText(labels[k]||'');map[(row+1+k)+':'+col]=date;}
    if(labels.length>3)values[week*5+3][day]=literalText(labels[2]+' · 외 '+(labels.length-3)+'건');
    values[week*5+4][day]=literalText(model.personal[date]||'');map[row+':'+col]=date;
  }
  sheet.getRange('B7:H36').setNumberFormat('@').setValues(values).setFontWeight('normal');
  for(let week=0;week<6;week++){
    const row=7+week*5;
    sheet.getRange(row,2,5,7).setBorder(true,true,true,true,true,false,'#b7b7b7',SpreadsheetApp.BorderStyle.SOLID);
    sheet.getRange(row,2,1,7).setNumberFormat('d').setHorizontalAlignment('right').setFontWeight('bold');
    for(let day=0;day<7;day++){
      const date=model.start+week*7+day,inMonth=date>=model.first&&date<=model.end,holiday=(model.holidays||{})[date];
      if(!inMonth||day===0||day===6||holiday)sheet.getRange(row,2+day).setFontColor(!inMonth?'#b7b7b7':day===0||holiday?'#d93025':'#1a73e8');
    }
  }
`+s.slice(b);fs.writeFileSync('crm-calendar.gs',s);
