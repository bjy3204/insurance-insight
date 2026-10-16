// 고객카드 M:T: 계약일, 피보험자, 보험사, 상품명, 보험료, 면책만료, 감액만료, 계약 메모
function clearCustomerCardContracts_(card) {
  card.getRange(5,13,Math.max(1,card.getMaxRows()-4),9).clearContent()
    .setBorder(false,false,false,false,false,false).setBackground(null);
}

function customerContractBirthKey_(value) {
  let digits=String(value==null?'':value).replace(/\D/g,'');
  if(!digits)return '';
  if(digits.length===13)return digits.slice(0,6);
  if(digits.length===8)return digits.slice(-6);
  return digits.length<6?digits.padStart(6,'0'):digits;
}

function selectCustomerContractRows_(rows,name,birth) {
  const key=String(name||'').trim(),dob=customerContractBirthKey_(birth);
  if(!key||!dob)return [];
  return rows.map((row,index)=>({row,index})).filter(item=>
    String(item.row[3]||'').trim()===key&&customerContractBirthKey_(item.row[4])===dob);
}

function refreshCustomerCardContracts_(ss,card,name,birth) {
  const list=crmSheet_(ss,'계약 목록');if(!list)return;
  const range=list.getRange(5,1,Math.max(1,list.getLastRow()-4),14);
  const display=range.getDisplayValues(),raw=range.getValues();
  const found=selectCustomerContractRows_(display,name,birth);
  if(!found.length)return;
  const output=found.map(item=>{
    const r=raw[item.index],d=item.row;
    return [r[2],literalText(d[6]),literalText(d[8]),literalText(d[9]),r[10],contractExpirySerial_(r[2],r[11]),contractExpirySerial_(r[2],r[12]),literalText(d[13])];
  });
  if(output.length+4>card.getMaxRows())card.insertRowsAfter(card.getMaxRows(),output.length+4-card.getMaxRows());
  const formats=['yyyy-mm-dd','@','@','@','#,##0"원"','yyyy-mm-dd','yyyy-mm-dd','@'];
  const target=card.getRange(5,13,output.length,8);
  target.setNumberFormats(output.map(()=>formats.slice())).setValues(output);
  target.setBackground(null)
    .setBorder(true,true,true,true,null,true,'#b7b7b7',SpreadsheetApp.BorderStyle.SOLID)
    .setBorder(null,null,null,null,true,null,'#b7b7b7',SpreadsheetApp.BorderStyle.DOTTED);
}

function contractExpirySerial_(date,months) {
  if(date===''||date==null||months===''||months==null||Number(months)===0)return '';
  const count=parseContractMonths(months);
  const serial=typeof date==='number'?date:parseContractDate(date);
  const epoch=Date.UTC(1899,11,30),base=new Date(epoch+serial*86400000);
  const target=new Date(Date.UTC(base.getUTCFullYear(),base.getUTCMonth()+count,1));
  const last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
  target.setUTCDate(Math.min(base.getUTCDate(),last));
  return Math.round((target.getTime()-epoch)/86400000);
}
