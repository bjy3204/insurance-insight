// 계약 입력: C4 계약일, C6 계약자, G6 생년월일, C8 피보험자, G8 생년월일
// C10 보험사, G10 보험료, C12 상품명, C14 메모, C16 면책, G16 감액, F18 등록
function contractTodayText(ss) {
  return Utilities.formatDate(new Date(),ss.getSpreadsheetTimeZone(),'yyyy-MM-dd');
}

function parseContractDate(value,todayText) {
  const today=(todayText||contractTodayText(SpreadsheetApp.getActiveSpreadsheet())).split('-').map(Number);
  let text=value instanceof Date?Utilities.formatDate(value,SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(),'yyyy-MM-dd'):String(value==null?'':value).trim();
  let year=today[0],month,day,match;
  if(!text){month=today[1];day=today[2];}
  else if(/^\d{8}$/.test(text)){year=Number(text.slice(0,4));month=Number(text.slice(4,6));day=Number(text.slice(6));}
  else if(/^\d{6}$/.test(text)){year=2000+Number(text.slice(0,2));month=Number(text.slice(2,4));day=Number(text.slice(4));}
  else if(/^\d{3,4}$/.test(text)){month=Number(text.slice(0,-2));day=Number(text.slice(-2));}
  else if((match=/^(\d{2}|\d{4})\s*[-./,]\s*(\d{1,2})\s*[-./,]\s*(\d{1,2})$/.exec(text))){year=match[1].length===2?2000+Number(match[1]):Number(match[1]);month=Number(match[2]);day=Number(match[3]);}
  else if((match=/^(?:(\d{2}|\d{4})\s*년\s*)?(\d{1,2})\s*월\s*(\d{1,2})\s*일?$/.exec(text))){if(match[1])year=match[1].length===2?2000+Number(match[1]):Number(match[1]);month=Number(match[2]);day=Number(match[3]);}
  else if((match=/^(\d{1,2})\s*[-./,]\s*(\d{1,2})$/.exec(text))){month=Number(match[1]);day=Number(match[2]);}
  else throw new Error('계약일을 확인하세요. 예: 20260901, 260901, 9월1일, 09-01');
  const date=new Date(Date.UTC(year,month-1,day));
  if(year<1900||year>2199||date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)throw new Error('계약일의 월·일을 확인하세요.');
  return Math.round((date.getTime()-Date.UTC(1899,11,30))/86400000);
}

function normalizeContractBirth(value) {
  let text=String(value==null?'':value).trim();
  if(!text)return '';
  let digits=text.replace(/\D/g,'');
  if(typeof value==='number'&&digits.length<6)digits=digits.padStart(6,'0');
  if(digits.length===13)digits=digits.slice(0,6);
  else if(digits.length===8)digits=digits.slice(-6);
  if(digits.length!==6||!birthFromResidentNumber(digits))throw new Error('생년월일을 6자리로 확인하세요. 예: 000101');
  return digits;
}

function parseContractMonths(value,label) {
  if(value===''||value==null)return 0;
  if(typeof value==='boolean')throw new Error('면책·감액은 숫자(개월 수)로 입력해 주세요');
  const text=String(value).trim().replace(/\s*개월$/,'');
  if(!/^\d+$/.test(text))throw new Error('면책·감액은 숫자(개월 수)로 입력해 주세요');
  const months=Number(text);
  if(!Number.isSafeInteger(months))throw new Error('면책·감액은 숫자(개월 수)로 입력해 주세요');
  return months;
}

function contractFindCustomer(customers,name,birth,label) {
  const key=String(name||'').trim();
  if(!key)throw new Error(label+' 이름을 입력하세요.');
  const dob=normalizeContractBirth(birth);
  const found=customers.filter(row=>String(row[1]||'').trim()===key&&(!dob||String(row[2]||'').replace(/\D/g,'').slice(0,6)===dob));
  if(!found.length)throw new Error(label+'을 고객 LIST에서 찾지 못했습니다. 이름·생년월일을 확인하세요.');
  if(found.length>1)throw new Error(label+' 동명이인이 있습니다. 생년월일도 입력하세요.');
  const row=found[0];
  return {name:key,birth:normalizeContractBirth(String(row[2]).replace(/\D/g,'').slice(0,6)),category:String(row[0]||''),phone:formatPhoneNumber(String(row[3]||''))};
}

function contractCustomerRows(ss) {
  const sheet=crmSheet_(ss,'고객 LIST');
  if(!sheet)throw new Error('고객 LIST 시트를 찾지 못했습니다.');
  return sheet.getRange(6,2,Math.max(1,sheet.getLastRow()-5),4).getDisplayValues();
}

function buildContractRecord(data,customers,todayText) {
  if(!String(data.ownerBirth||'').trim())throw new Error('계약자 생년월일을 입력하세요.');
  if(!String(data.insuredBirth||'').trim())throw new Error('피보험자 생년월일을 입력하세요.');
  const owner=contractFindCustomer(customers,data.owner,data.ownerBirth,'계약자');
  const insured=contractFindCustomer(customers,data.insured,data.insuredBirth,'피보험자');
  const premiumText=String(data.premium==null?'':data.premium).replace(/[\s,원]/g,'');
  const premium=premiumText===''?'':Number(premiumText);
  if(premium!==''&&(!Number.isFinite(premium)||premium<0))throw new Error('보험료는 0 이상의 숫자로 입력하세요.');
  return ['',literalText(owner.category),parseContractDate(data.date,todayText),literalText(owner.name),owner.birth,literalText(owner.phone),literalText(insured.name),insured.birth,literalText(String(data.insurer||'').trim()),literalText(String(data.product||'').trim()),premium,parseContractMonths(data.immunity,'면책'),parseContractMonths(data.reduction,'감액'),literalText(String(data.memo||'').trim()),literalText(insured.category),literalText(insured.phone)];
}

function registerContract(source) {
  const ss=source&&typeof source.getSheetByName==='function'?source:SpreadsheetApp.getActiveSpreadsheet();
  const form=crmSheet_(ss,'계약 입력'),list=crmSheet_(ss,'계약 목록');
  if(!form||!list)throw new Error('계약 입력 또는 계약 목록 시트를 찾지 못했습니다.');
  const lock=LockService.getDocumentLock();
  if(!lock.tryLock(5000)){form.getRange('B1').setValue('다른 등록 작업 중입니다. 잠시 후 다시 등록하세요.');return;}
  let saved=false;
  try {
    form.getRange('B1').clearContent();
    const addresses={date:'C4',owner:'C6',ownerBirth:'G6',insured:'C8',insuredBirth:'G8',insurer:'C10',premium:'G10',product:'C12',memo:'C14',immunity:'C16',reduction:'G16'};
    const data={};Object.entries(addresses).forEach(([key,address])=>{data[key]=form.getRange(address).getValue();});
    const record=buildContractRecord(data,contractCustomerRows(ss),contractTodayText(ss));
    const rows=list.getRange(5,1,Math.max(1,list.getLastRow()-4),16).getDisplayValues();
    let destination=5;
    rows.forEach((row,index)=>{if([2,3,6,8,9,10,11,12,13].some(col=>String(row[col]||'').trim()))destination=index+6;});
    if(destination>list.getMaxRows())list.insertRowsAfter(list.getMaxRows(),destination-list.getMaxRows());
    const target=list.getRange(destination,2,1,15);
    if(destination!==5){const base=list.getRange(5,2,1,15);base.copyTo(target,SpreadsheetApp.CopyPasteType.PASTE_FORMAT,false);base.copyTo(target,SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION,false);}
    [4,5,6,7,8,9,10,14,15,16].forEach(col=>list.getRange(destination,col).setNumberFormat('@'));
    list.getRange(destination,3).setNumberFormat('yyyy-mm-dd');
    list.getRange(destination,11).setNumberFormat('#,##0"원"');
    list.getRange(destination,12,1,2).setNumberFormat('0"개월"');
    target.setValues([record.slice(1)]);saved=true;
    form.getRangeList(Object.values(addresses)).clearContent();
    ss.toast('계약 목록 '+destination+'행에 등록했습니다.','계약 추가');
  } catch(error){form.getRange('B1').setValue(saved?'저장은 완료됐습니다. 입력칸을 정리하기 전에 계약 목록을 확인하세요.':error.message);}
  finally{form.getRange('F18').setValue(false);lock.releaseLock();}
}

function refreshContractRowCustomers(ss,sheet,row,customers) {
  const values=sheet.getRange(row,1,1,16).getDisplayValues()[0];
  [{name:4,birth:5,category:2,phone:6,label:'계약자'},{name:7,birth:8,category:15,phone:16,label:'피보험자'}].forEach(role=>{
    const cell=sheet.getRange(row,role.name);
    if(!values[role.name-1].trim()){sheet.getRange(row,role.category).clearContent();sheet.getRange(row,role.phone).clearContent();cell.clearNote();return;}
    try {
      const person=contractFindCustomer(customers,values[role.name-1],values[role.birth-1],role.label);
      sheet.getRange(row,role.birth).setNumberFormat('@').setValue(person.birth);
      sheet.getRange(row,role.category).setNumberFormat('@').setValue(literalText(person.category));
      sheet.getRange(row,role.phone).setNumberFormat('@').setValue(literalText(person.phone));cell.clearNote();
    } catch(error){sheet.getRange(row,role.category).clearContent();sheet.getRange(row,role.phone).clearContent();cell.setNote(error.message);}
  });
}

function refreshAllContractCustomerInfo(source) {
  const ss=source&&typeof source.getSheetByName==='function'?source:SpreadsheetApp.getActiveSpreadsheet();
  const list=crmSheet_(ss,'계약 목록');if(!list)return;
  const rows=list.getRange(5,4,Math.max(1,list.getLastRow()-4),4).getDisplayValues();
  const customers=contractCustomerRows(ss);
  rows.forEach((row,index)=>{if(row[0].trim()||row[3].trim())refreshContractRowCustomers(ss,list,index+5,customers);});
}

function handleContractEdit(e) {
  if(!e||!e.range)return false;
  const sheet=e.range.getSheet(),name=crmSheetRole_(sheet);
  if(name!=='계약 입력'&&name!=='계약 목록')return false;
  if(name==='계약 입력'&&e.range.getA1Notation()==='F18'&&e.value==='TRUE'){try{registerContract(e.source);}finally{e.range.setValue(false);}return true;}
  const today=contractTodayText(e.source);
  const configs=name==='계약 입력'?[{row:4,col:3,date:true},{row:6,col:7,birth:true},{row:8,col:7,birth:true},{row:16,col:3,label:'면책'},{row:16,col:7,label:'감액'}]:[{row:null,col:3,date:true},{row:null,col:5,birth:true},{row:null,col:8,birth:true},{row:null,col:12,label:'면책'},{row:null,col:13,label:'감액'}];
  configs.forEach(config=>{
    if(e.range.getColumn()>config.col||e.range.getLastColumn()<config.col)return;
    if(config.row!==null&&(e.range.getRow()>config.row||e.range.getLastRow()<config.row))return;
    const start=config.row===null?Math.max(5,e.range.getRow()):config.row,end=config.row===null?e.range.getLastRow():config.row;
    if(start>end)return;
    const range=sheet.getRange(start,config.col,end-start+1,1),values=range.getValues(),formulas=range.getFormulas();
    values.forEach((row,index)=>{
      if(formulas[index][0]||row[0]===''||row[0]===null)return;
      const cell=sheet.getRange(start+index,config.col);
      try {const value=config.date?parseContractDate(row[0],today):config.birth?normalizeContractBirth(row[0]):parseContractMonths(row[0],config.label);cell.setNumberFormat(config.date?'yyyy-mm-dd':config.birth?'@':'0"개월"').setValue(value).clearNote();}
      catch(error){cell.setNote(error.message);if(name==='계약 입력')sheet.getRange('B1').setValue(error.message);else e.source.toast(error.message,'계약 입력',8);}
    });
  });
  if(name==='계약 목록'&&e.range.getLastRow()>=5){
    const start=e.range.getColumn(),end=e.range.getLastColumn();
    if([4,5,7,8].some(col=>start<=col&&col<=end)){
      const customers=contractCustomerRows(e.source);
      for(let row=Math.max(5,e.range.getRow());row<=e.range.getLastRow();row++){
        refreshContractRowCustomers(e.source,sheet,row,customers);
        if(sheet.getRange(row,4).getDisplayValue().trim()&&sheet.getRange(row,3).getValue()==='')sheet.getRange(row,3).setNumberFormat('yyyy-mm-dd').setValue(parseContractDate('',today));
      }
    }
  }
  return true;
}

function activateContractInput() {
  const ss=SpreadsheetApp.getActiveSpreadsheet();ss.setActiveSheet(crmSheet_(ss,'계약 입력'));
}

function setupContractInputButton() {
  const sheet=crmSheet_(SpreadsheetApp.getActiveSpreadsheet(),'계약 입력');
  const drawings=sheet.getDrawings(),assigned=drawings.filter(d=>d.getOnAction()==='registerContract');
  const button=assigned.length===1?assigned[0]:drawings.length===1?drawings[0]:null;
  if(!button)throw new Error('계약 입력에 계약추가 그림을 만들고 registerContract를 할당하세요.');
  button.setPosition(2,8,0,0).setWidth(160).setHeight(38).setOnAction('registerContract');
}
