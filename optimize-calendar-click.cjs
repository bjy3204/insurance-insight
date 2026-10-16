const fs=require('fs'),vm=require('vm');let s=fs.readFileSync('Code-CRM-calendar-O2-S2.txt','utf8');
let a=s.indexOf('function renderCrmCalendarDetails_'),b=s.indexOf('function saveCalendarPersonalDay_',a);
s=s.slice(0,a)+`// 목록은 월 갱신 시 숨겨진 시트에 완성해 둡니다. 클릭 시에는 완성된 범위만 복사합니다.
function calendarDetailHash_(value) {
  const text=JSON.stringify(value);let hash=2166136261;
  for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return text.length+':'+(hash>>>0);
}
function calendarDetailMeta_() {
  const cache=CacheService.getDocumentCache(),saved=cache.get('CRM_DETAIL_TEMPLATE_META')||PropertiesService.getDocumentProperties().getProperty('CRM_DETAIL_TEMPLATE_META');
  if(!saved)return null;try{return JSON.parse(saved);}catch(error){return null;}
}
function prepareCalendarDetailTemplates_(sheet,model) {
  const order=['고객생일','카드수납','자동차보험 갱신','면책 종료','감액 종료'];
  const events=model.events.filter(e=>e.type!=='개인일정').slice().sort((a,b)=>a.date-b.date||order.indexOf(a.type)-order.indexOf(b.type)||String(a.name).localeCompare(String(b.name),'ko'));
  const signature=calendarDetailHash_([model.first,model.end,events]);
  const ss=sheet.getParent(),old=calendarDetailMeta_();
  if(old&&old.signature===signature&&ss.getSheetById(old.sheetId))return old;
  const props=PropertiesService.getDocumentProperties();
  let template=old&&ss.getSheetById(old.sheetId);
  if(!template){template=ss.insertSheet('캘린더_목록캐시_'+Date.now());template.hideSheet();}
  const groups={};events.forEach(e=>{(groups[e.date]||(groups[e.date]=[])).push(e);});
  const dates=Object.keys(groups).map(Number).sort((a,b)=>a-b),height=Math.max(1,...dates.map(d=>groups[d].length));
  const total=1+dates.length*height;
  if(template.getMaxRows()<total)template.insertRowsAfter(template.getMaxRows(),total-template.getMaxRows());
  const range=template.getRange(1,1,total,5);range.breakApart().clear().setNumberFormat('@');
  const values=Array.from({length:total},()=>Array(5).fill('')),validations=Array.from({length:total},()=>Array(5).fill(null)),plans={};
  const rule=SpreadsheetApp.newDataValidation().requireCheckbox().build();
  dates.forEach((date,i)=>{
    const start=2+i*height,rows=groups[date];plans[date]={row:start,count:rows.length};
    rows.forEach((e,k)=>{
      values[start-1+k]=[k&&e.type===rows[k-1].type?'':literalText(e.type),literalText(e.name),literalText(String(e.birth||'')),literalText(e.text),e.name?false:''];
      if(e.name)validations[start-1+k][4]=rule;
    });
  });
  range.setValues(values).setDataValidations(validations);
  template.getRange(1,1,1,5).setBorder(true,false,false,false,false,false,'#b7b7b7',SpreadsheetApp.BorderStyle.SOLID);
  dates.forEach(date=>{
    const plan=plans[date],rows=groups[date];
    template.getRange(plan.row,1,rows.length,5).setBorder(true,true,true,true,true,true,'#b7b7b7',SpreadsheetApp.BorderStyle.SOLID);
    for(let i=0;i<rows.length;){let end=i+1;while(end<rows.length&&rows[end].type===rows[i].type)end++;
      if(end-i>1)template.getRange(plan.row+i,1,end-i,1).merge();i=end;}
    template.getRange(plan.row,1,rows.length,1).setVerticalAlignment('middle');
  });
  const meta={sheetId:template.getSheetId(),signature,height,plans,calendarStart:model.start,first:model.first,end:model.end};
  const encoded=JSON.stringify(meta);props.setProperty('CRM_DETAIL_TEMPLATE_META',encoded);CacheService.getDocumentCache().put('CRM_DETAIL_TEMPLATE_META',encoded,21600);
  CacheService.getDocumentCache().remove('CRM_DETAIL_LAST_SHOWN');
  return meta;
}
function renderCrmCalendarDetails_(sheet,date) {
  let meta=calendarDetailMeta_();
  if(!meta){
    const year=Number(sheet.getRange('O2').getValue()),month=Number(sheet.getRange('S2').getValue());
    const first=crmCalendarSerial_(year,month,1),end=crmCalendarSerial_(year,month+1,1)-1;
    const rows=sheet.getRange(5,52,Math.max(1,sheet.getLastRow()-4),7).getValues();
    meta=prepareCalendarDetailTemplates_(sheet,{first,end,start:first-crmCalendarDate_(first).getUTCDay(),events:rows.filter(r=>r[0]&&r[1]&&r[1]!=='개인일정').map(r=>({date:Number(r[0]),type:r[1],name:r[2],birth:r[3],text:r[4]}))});
  }
  const cache=CacheService.getDocumentCache(),key=meta.signature+':'+date;
  if(cache.get('CRM_DETAIL_LAST_SHOWN')===key)return;
  const template=sheet.getParent().getSheetById(meta.sheetId);if(!template)return;
  const props=PropertiesService.getDocumentProperties(),previous=Number(props.getProperty('CRM_DETAIL_COPY_HEIGHT'))||1;
  const destination=sheet.getRange(5,38,Math.max(meta.height,previous),5);destination.breakApart();
  if(previous>meta.height)destination.clearContent().clearDataValidations().setBorder(false,false,false,false,false,false);
  const plan=meta.plans[date];
  if(plan)template.getRange(plan.row,1,meta.height,5).copyTo(sheet.getRange(5,38,meta.height,5),SpreadsheetApp.CopyPasteType.PASTE_NORMAL,false);
  else {
    destination.clearContent().clearDataValidations().setBorder(false,false,false,false,false,false);
    template.getRange(1,1,1,5).copyTo(sheet.getRange(5,38,1,5),SpreadsheetApp.CopyPasteType.PASTE_NORMAL,false);
  }
  sheet.getRange('AO3').setValue(date);
  if(previous!==meta.height)props.setProperty('CRM_DETAIL_COPY_HEIGHT',String(meta.height));
  const visible=Math.max(34,4+meta.height);
  if(visible>34||Number(props.getProperty('CRM_DETAIL_VISIBLE_END'))>34){sheet.showRows(1,visible);if(visible<sheet.getMaxRows())sheet.hideRows(visible+1,sheet.getMaxRows()-visible);props.setProperty('CRM_DETAIL_VISIBLE_END',String(visible));}
  cache.put('CRM_DETAIL_LAST_SHOWN',key,21600);
}

`+s.slice(b);
s=s.replace("  sheet.getRange('AO3').setValue(selected).setNumberFormat('yyyy-mm-dd');renderCrmCalendarDetails_(sheet,selected);", "  prepareCalendarDetailTemplates_(sheet,model);\n  renderCrmCalendarDetails_(sheet,selected);");
s=s.replace("    const year=Number(sheet.getRange('O2').getValue()),month=Number(sheet.getRange('S2').getValue());\n    if(!Number.isInteger(year)||!Number.isInteger(month)||month<1||month>12)return;\n    const first=crmCalendarSerial_(year,month,1),start=first-crmCalendarDate_(first).getUTCDay();", "    const meta=calendarDetailMeta_();let start;\n    if(meta)start=meta.calendarStart;else{const period=sheet.getRange('O2:S2').getValues()[0],year=Number(period[0]),month=Number(period[4]);if(!Number.isInteger(year)||!Number.isInteger(month)||month<1||month>12)return;const first=crmCalendarSerial_(year,month,1);start=first-crmCalendarDate_(first).getUTCDay();}");
s=s.replace("    sheet.getRange('AO3').setValue(date).setNumberFormat('yyyy-mm-dd');\n    renderCrmCalendarDetails_(sheet,date);", "    renderCrmCalendarDetails_(sheet,date);");
new vm.Script(s);fs.writeFileSync('Code-CRM-calendar-fast-click.txt',s);console.log('PASS: full script syntax');
