const fs=require('fs'),vm=require('vm');let s=fs.readFileSync('Code-CRM-calendar-checkbox-fixed.txt','utf8');
s=s.replace("if(sheet.getMaxColumns()<58)sheet.insertColumnsAfter(sheet.getMaxColumns(),58-sheet.getMaxColumns());", "if(sheet.getMaxColumns()<62)sheet.insertColumnsAfter(sheet.getMaxColumns(),62-sheet.getMaxColumns());");
s=s.replace("['boolean-checkbox-v2',model.first,model.end,events]", "['saved-confirmation-v3',model.first,model.end,events]");
s=s.replace("  const groups={};events.forEach(e=>{(groups[e.date]||(groups[e.date]=[])).push(e);});", "  const confirmations=calendarConfirmationMap_(sheet),occurrences={};\n  events.forEach(e=>{const base=JSON.stringify([e.date,e.type,String(e.name||''),String(e.birth||''),String(e.text||'')]);const n=occurrences[base]||0;occurrences[base]=n+1;e.confirmKey=JSON.stringify([base,n]);});\n  const groups={};events.forEach(e=>{(groups[e.date]||(groups[e.date]=[])).push(e);});");
s=s.replace("const values=Array.from({length:total},()=>Array(5).fill('')),validations=", "const confirmationKeys=Array.from({length:total},()=>['']);\n  const values=Array.from({length:total},()=>Array(5).fill('')),validations=");
s=s.replace("literalText(e.text),e.name?false:''];", "literalText(e.text),e.name?confirmations[e.confirmKey]===true:''];\n      confirmationKeys[start-1+k][0]=e.confirmKey;");
s=s.replace('  range.setValues(values).setDataValidations(validations);', "  range.setValues(values).setDataValidations(validations);\n  template.getRange(1,6,total,1).setNumberFormat('@').setValues(confirmationKeys);");
// Calendar entries select their day; names no longer navigate to the customer card.
let a=s.indexOf("  }else if(row>=5&&(col===39||col===40)"),b=s.indexOf('\n}',a);if(a<0||b<0)throw Error('Customer selection branch missing');s=s.slice(0,a)+'  }'+s.slice(b);
a=s.indexOf("    if(e.range.getColumn()===42&&e.range.getRow()>=5"),b=s.indexOf("    if(e.range.getRow()===3",a);if(a<0||b<0)throw Error('Checkbox branch missing');
s=s.slice(0,a)+`    if(e.range.getColumn()===42&&e.range.getRow()>=5){
      saveCalendarConfirmation_(sheet,e.range.getRow(),e.value==='TRUE');return true;
    }
`+s.slice(b);
const insert=s.indexOf('function calendarDetailHash_');s=s.slice(0,insert)+`function calendarConfirmationMap_(sheet) {
  const result={};
  sheet.getRange(5,59,Math.max(1,sheet.getLastRow()-4),4).getValues().forEach(r=>{if(r[0])result[String(r[0])]=r[2]===true||String(r[2]).toUpperCase()==='TRUE';});
  return result;
}
function saveCalendarConfirmation_(sheet,row,checked) {
  const meta=calendarDetailMeta_();if(!meta)return;
  const date=crmCalendarInputDate_(sheet.getRange('AO3').getValue(),sheet.getParent()),plan=meta.plans[date];
  if(!plan||row-5>=plan.count)return;
  const template=sheet.getParent().getSheetById(meta.sheetId),templateRow=plan.row+row-5;
  const key=String(template.getRange(templateRow,6).getValue()||'');if(!key)return;
  ensureCrmCalendarStorage_(sheet);
  const records=sheet.getRange(5,59,sheet.getMaxRows()-4,4).getValues();
  let index=records.findIndex(r=>String(r[0])===key);if(index<0)index=records.findIndex(r=>!r[0]);
  if(index<0){sheet.insertRowsAfter(sheet.getMaxRows(),100);index=records.length;}
  sheet.getRange(index+5,59,1,4).setValues([[key,date,checked,new Date()]]);
  template.getRange(templateRow,5).setValue(checked);
}

`+s.slice(insert);
new vm.Script(s);fs.writeFileSync('Code-CRM-calendar-confirmation-saved.txt',s);console.log('PASS full script syntax');
