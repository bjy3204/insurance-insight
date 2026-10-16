const CRM_COVERAGE_TEMPLATE_ID = '1p8HXXkmDQ1z2BWhrEftwgCGnl1xFiOWlgtQmCni6VjU';
const CRM_COVERAGE_LIST_ID = 254139861;

function crmCreateCustomerMenu_() {
  SpreadsheetApp.getUi().createMenu('고객 관리')
    .addItem('보장분석 생성', 'createCoverageReportForSelectedCustomer')
    .addToUi();
}

function createCoverageReportForSelectedCustomer() {
  const book=SpreadsheetApp.getActiveSpreadsheet();
  const active=book.getActiveSheet(),selection=book.getActiveRange();
  const isCard=active.getSheetId()===284886991;
  if(!isCard && (active.getSheetId()!==CRM_COVERAGE_LIST_ID || !selection || selection.getRow()<6)) {
    SpreadsheetApp.getUi().alert('고객 관리 LIST에서 고객 행을 선택하거나 고객관리카드에서 고객을 검색한 뒤 눌러주세요.');
    return;
  }
  const selectedRow=isCard?null:selection.getRow();
  const connected=ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='crmCoverageRequestEdit');
  if(!connected || !crmReportHasColumn_(crmCoverageList_(book)))setupCrmCoverageReports();
  const row=isCard?crmCoverageCardRow_(book,active):selectedRow;
  crmCoverageCreate_(book,row);
  if(isCard)refreshCustomerCard(book);
  SpreadsheetApp.getUi().alert('보장분석 준비 완료',
    isCard?'J16의 보장분석 링크를 눌러 열어주세요.':'선택한 고객 행의 B열에 있는 보장분석 링크를 눌러 열어주세요.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}

function setupCrmFirstUse() {
  setupCrmCoverageReports();
  SpreadsheetApp.getUi().alert('처음 사용 설정 완료',
    '이제 고객 관리 LIST의 B열 또는 고객관리카드의 J16에서 체크박스를 체크하세요.\n이미 생성한 고객은 같은 보장분석 파일이 열립니다.\n설정 후에는 PC·모바일에서 사용할 수 있습니다.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}

function crmCoverageList_(book) {
  return book.getSheets().find(s=>s.getSheetId()===CRM_COVERAGE_LIST_ID);
}

function setupCrmCoverageButton() {
  const book=SpreadsheetApp.getActiveSpreadsheet(),sheet=crmCoverageList_(book);
  if(!sheet)throw new Error('고객 관리 LIST를 찾지 못했습니다.');
  let image=sheet.getImages().find(image=>image.getAltTextTitle()==='CRM_COVERAGE_CREATE_BUTTON');
  if(!image) {
    const blob=Utilities.newBlob(Utilities.base64Decode(CRM_COVERAGE_BUTTON_PNG),'image/png','coverage-create.png');
    image=sheet.insertImage(blob,11,2);
    image.setAltTextTitle('CRM_COVERAGE_CREATE_BUTTON');
  }
  image.assignScript('createCoverageReportForSelectedCustomer');
  image.setWidth(210).setHeight(44);
}

function crmReportIsActionEdit_(e) {
  if(!e||!e.range)return false;
  if(e.range.getSheet().getSheetId()===284886991 && e.range.getA1Notation()==='J16')return true;
  return e.range.getSheet().getSheetId()===CRM_COVERAGE_LIST_ID &&
    crmReportHasColumn_(e.range.getSheet()) &&
    e.range.getColumn()===2 && e.range.getNumColumns()===1 && e.range.getLastRow()>=6;
}

function setupCrmCoverageReports() {
  const book=SpreadsheetApp.getActiveSpreadsheet();
  const sheet=crmCoverageList_(book);
  if(!sheet)throw new Error('고객 관리 LIST 시트를 찾지 못했습니다.');
  // 복사하지 않고 원본 접근 권한만 확인한다.
  DriveApp.getFileById(CRM_COVERAGE_TEMPLATE_ID).getName();
  if(!crmReportHasColumn_(sheet)) {
    sheet.insertColumnBefore(2);
    sheet.getRange('C5').copyTo(sheet.getRange('B5'),{formatOnly:true});
    sheet.getRange('B5').setValue('보장분석');
    sheet.setColumnWidth(2,120);
  }
  PropertiesService.getDocumentProperties().setProperty('CRM_REPORT_LAYOUT_BOOK',book.getId());
  CRM_REPORT_LAYOUT_STATE_=true;
  if(!CRM_REPORT_SPACER_STATE_) {
    sheet.insertColumnBefore(23);
    CRM_REPORT_SPACER_STATE_=true;
    sheet.getRange(4,17,sheet.getMaxRows()-3,1).copyTo(sheet.getRange(4,23,sheet.getMaxRows()-3,1),{formatOnly:true});
    sheet.setColumnWidth(23,sheet.getColumnWidth(17));
  }
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='crmCoverageRequestEdit')
    .forEach(t=>ScriptApp.deleteTrigger(t));
  const trigger=ScriptApp.newTrigger('crmCoverageRequestEdit');
  const source=trigger.forSpreadsheet(book);
  const edit=source.onEdit();
  edit.create();
  sheet.setFrozenColumns(4);
  const logical=crmReportSheetAdapter_(sheet);
  logical.getRange('U5').setValue('실손의료비');
  logical.setColumnWidth(21,140);
  refreshCustomerListLayout(book);
  refreshOperationalViews(book);
  refreshCrmCoverageReportCells_(book);
  refreshCustomerCard(book);
  book.toast('B열의 체크박스를 체크하세요. PC·모바일 동일합니다.','보장분석 연결 완료');
}

function refreshCrmCoverageReportCells_(book) {
  const sheet=crmCoverageList_(book);
  if(!sheet)return;
  if(!crmReportHasColumn_(sheet))return;
  const count=Math.min(sheet.getMaxRows()-5,Math.max(2,sheet.getLastRow()-4));
  const rows=sheet.getRange(6,2,count,4).getDisplayValues();
  const rich=sheet.getRange(6,2,count,1).getRichTextValues();
  const rule=SpreadsheetApp.newDataValidation().requireCheckbox().setAllowInvalid(false).build();
  const styles=SpreadsheetApp.newTextStyle().setForegroundColor('#1a73e8').setUnderline(true).build();
  let lastCustomer=-1;
  rows.forEach((row,i)=>{if(row.slice(1).some(value=>String(value).trim()))lastCustomer=i;});
  rows.forEach(function(row,i) {
    const cell=sheet.getRange(i+6,2);
    const name=String(row[2]).trim();
    const url=rich[i][0]&&rich[i][0].getLinkUrl();
    if(!name && i>lastCustomer+1) {
      if(row[0])cell.clearContent();
      cell.clearDataValidations();
      return;
    }
    if(url) {
      cell.clearDataValidations();
      if(row[0]!=='보장분석')cell.setRichTextValue(SpreadsheetApp.newRichTextValue().setText('보장분석').setLinkUrl(url).setTextStyle(styles).build());
    } else {
      cell.setDataValidation(rule);
      if(!crmCoverageIsChecked_(row[0]))cell.setValue(false);
    }
    cell.setHorizontalAlignment('center');
  });
}

function crmCoverageRestoreEditedCell_(e) {
  const values=e.range.getDisplayValues();
  if(values.some(row=>crmCoverageIsChecked_(row[0])))return;
  const book=e.source||e.range.getSheet().getParent();
  if(e.range.getSheet().getSheetId()===CRM_COVERAGE_LIST_ID)refreshCrmCoverageReportCells_(book);
  else refreshCustomerCard(book);
}

function crmCoverageIsChecked_(value) { return value===true || String(value).trim().toUpperCase()==='TRUE'; }

function crmCoveragePerson_(sheet,row) {
  const values=sheet.getRange(row,4,1,2).getDisplayValues()[0];
  const name=String(values[0]).trim();
  const birth=String(values[1]).replace(/\D/g,'').slice(0,6);
  if(!name)throw new Error('같은 행에 고객 이름을 먼저 입력하세요.');
  return {name:name,birth:birth};
}

function crmCoverageIdentity_(book,person) {
  const digest=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
    JSON.stringify([book.getId(),person.name,person.birth]),Utilities.Charset.UTF_8);
  return digest.map(n=>('0'+((n+256)%256).toString(16)).slice(-2)).join('');
}

function crmCoverageResolveRow_(sheet,originalRow,person) {
  const same=function(values) { return String(values[0]).trim()===person.name && String(values[1]).replace(/\D/g,'').slice(0,6)===person.birth; };
  if(same(sheet.getRange(originalRow,4,1,2).getDisplayValues()[0]))return originalRow;
  const found=[];
  sheet.getRange(6,4,Math.max(1,sheet.getLastRow()-5),2).getDisplayValues().forEach((v,i)=>{if(same(v))found.push(i+6);});
  if(found.length!==1)throw new Error('생성 중 고객 행이 변경되었습니다. 해당 고객 행에서 다시 체크해 주세요.');
  return found[0];
}

function crmCoverageRequestEdit(e) {
  if(!crmReportIsActionEdit_(e))return;
  const book=e.source||e.range.getSheet().getParent();
  if(e.range.getSheet().getSheetId()===284886991) {
    if(!crmCoverageIsChecked_(e.range.getValue()))return;
    try {
      const card=e.range.getSheet(),row=crmCoverageCardRow_(book,card);
      crmCoverageCreate_(book,row);
      refreshCustomerCard(book);
    } catch(error) {
      e.range.setValue(false);
      book.toast(error.message,'보장분석 생성 실패',8);
    }
    return;
  }
  const values=e.range.getDisplayValues();
  for(let i=0;i<values.length;i++) {
    const row=e.range.getRow()+i;
    if(row<6||!crmCoverageIsChecked_(values[i][0]))continue;
    try { crmCoverageCreate_(book,row); }
    catch(error) {
      const cell=e.range.getSheet().getRange(row,2);
      cell.setValue(false);
      book.toast(error.message,'보장분석 생성 실패',8);
    }
  }
}

function crmCoverageCardRow_(book,card) {
  const name=card.getRange('C4').getDisplayValue().trim();
  const birth=card.getRange('E4').getDisplayValue().replace(/\D/g,'').slice(-6);
  const list=crmCoverageList_(book),matches=[];
  list.getRange(6,4,Math.max(1,list.getLastRow()-5),2).getDisplayValues().forEach(function(values,i) {
    if(name && String(values[0]).trim()===name && (!birth || String(values[1]).replace(/\D/g,'').slice(0,6)===birth))matches.push(i+6);
  });
  if(matches.length!==1)throw new Error(matches.length?'동명이인이 있습니다. 생년월일도 입력하세요.':'고객 이름·생년월일을 확인하세요.');
  return matches[0];
}

function refreshCrmCoverageCard_(book,card,row) {
  const list=crmCoverageList_(book);
  if(!crmReportHasColumn_(list))return;
  const rich=list.getRange(row,2).getRichTextValue(),url=rich&&rich.getLinkUrl();
  const target=card.getRange('J16');
  target.clearContent().clearDataValidations().clearNote();
  if(url) {
    const style=SpreadsheetApp.newTextStyle().setForegroundColor('#1a73e8').setUnderline(true).build();
    target.setRichTextValue(SpreadsheetApp.newRichTextValue().setText('보장분석').setLinkUrl(url).setTextStyle(style).build());
  } else {
    target.setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().setAllowInvalid(false).build()).setValue(false);
  }
  target.setHorizontalAlignment('center');
}

function crmCoverageCreate_(book,row) {
  const sheet=crmCoverageList_(book);
  const lock=LockService.getDocumentLock();
  lock.waitLock(25000);
  try {
    const person=crmCoveragePerson_(sheet,row);
    const key='CRM_COVERAGE_FILE_'+crmCoverageIdentity_(book,person);
    const props=PropertiesService.getDocumentProperties();
    let state=JSON.parse(props.getProperty(key)||'null');
    const cell=sheet.getRange(row,2);
    const rich=cell.getRichTextValue(),existing=rich&&rich.getLinkUrl();
    if(existing) {
      const match=existing.match(/\/spreadsheets\/d\/([^/]+)/);
      if(!match || !DriveApp.getFileById(match[1]).isTrashed())return existing;
      if(!state)state={fileId:match[1],ready:true};
    }
    if(state&&state.fileId&&DriveApp.getFileById(state.fileId).isTrashed())state=null;
    if(!state||!state.fileId) {
      const file=DriveApp.getFileById(CRM_COVERAGE_TEMPLATE_ID).makeCopy(person.name+'님의 보장분석');
      state={fileId:file.getId(),ready:false};
      // 즉시 저장하므로 뒤 단계 실패 후 재시도해도 같은 사본을 이어서 쓴다.
      props.setProperty(key,JSON.stringify(state));
    }
    const file=DriveApp.getFileById(state.fileId);
    if(file.isTrashed())throw new Error('생성된 사본이 휴지통으로 이동되었습니다. 다시 체크해 주세요.');
    if(!state.ready) {
      const report=SpreadsheetApp.openById(state.fileId);
      crmCoveragePersonalize_(report,person.name);
      file.setName(person.name+'님의 보장분석');
      state.ready=true;
      props.setProperty(key,JSON.stringify(state));
    }
    const destination=sheet.getRange(crmCoverageResolveRow_(sheet,row,person),2);
    const url=file.getUrl();
    const style=SpreadsheetApp.newTextStyle().setForegroundColor('#1a73e8').setUnderline(true).build();
    destination.clearDataValidations().clearNote();
    destination.setRichTextValue(SpreadsheetApp.newRichTextValue().setText('보장분석').setLinkUrl(url).setTextStyle(style).build());
    destination.setHorizontalAlignment('center');
    book.toast(person.name+'님의 보장분석을 만들었습니다. B열의 보장분석 링크를 누르세요.','생성 완료');
    return url;
  } finally { lock.releaseLock(); }
}

function crmCoveragePersonalize_(report,name) {
  report.getSheets().forEach(function(sheet) {
    const range=sheet.getDataRange(),values=range.getValues(),formulas=range.getFormulas();
    values.forEach(function(row,r) { row.forEach(function(value,c) {
      if(!formulas[r][c]&&typeof value==='string'&&value.includes('홍길동')) {
        sheet.getRange(r+1,c+1).setValue(literalText(value.split('홍길동').join(name)));
      }
    }); });
  });
  const sheet=report.getSheets().find(s=>s.getSheetId()===1547742226);
  if(!sheet)throw new Error('사본에서 보장분석 시트를 찾지 못했습니다.');
  const title=sheet.getRange('B2');
  const merged=title.getMergedRanges();
  if(merged.length) {
    const old=merged[0],left=old.getColumn(),width=old.getNumColumns();
    old.breakApart();
    sheet.getRange(2,left,1,width).merge();
  }
  title.setValue(literalText(name+'님의\n보장분석리포트'));
  title.setWrap(true).setHorizontalAlignment('center').setVerticalAlignment('middle').setFontSize(16).setFontWeight('bold');
  sheet.setRowHeight(2,58);
  SpreadsheetApp.flush();
}



