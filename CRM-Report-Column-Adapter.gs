// 새 B열은 리포트 전용이다. 기존 CRM 함수에는 원래 열 좌표를 제공한다.
const CRM_REPORT_NATIVE_ = new WeakMap();
const CRM_REPORT_SHEET_CACHE_ = new WeakMap();
let CRM_REPORT_LAYOUT_STATE_;
let CRM_REPORT_SPACER_STATE_=false;

function crmReportHasColumn_(sheet) {
  if(CRM_REPORT_LAYOUT_STATE_!==undefined)return CRM_REPORT_LAYOUT_STATE_;
  const flag=PropertiesService.getDocumentProperties().getProperty('CRM_REPORT_LAYOUT_BOOK');
  CRM_REPORT_LAYOUT_STATE_=flag===sheet.getParent().getId() || sheet.getRange('B5').getDisplayValue()==='보장분석';
  CRM_REPORT_SPACER_STATE_=CRM_REPORT_LAYOUT_STATE_ && sheet.getRange('W5').getDisplayValue()==='' && sheet.getRange('X5').getDisplayValue()!=='';
  return CRM_REPORT_LAYOUT_STATE_;
}

function crmReportUnwrap_(value) { return CRM_REPORT_NATIVE_.get(value) || value; }
function crmReportColumn_(column) { return column+(column>=2?1:0)+(CRM_REPORT_SPACER_STATE_&&column>=22?1:0); }
function crmReportLogicalColumn_(column) { return column-(column>=3?1:0)-(CRM_REPORT_SPACER_STATE_&&column>=24?1:0); }

function crmReportShiftVehicleFormula_(formula) {
  function shift(letters) {
    let n=0;for(const char of letters)n=n*26+char.charCodeAt(0)-64;
    if(n<23)return letters;
    n++;let result='';while(n){result=String.fromCharCode(65+(n-1)%26)+result;n=Math.floor((n-1)/26);}return result;
  }
  return formula.replace(/\b([A-Z]+)(6)?:([A-Z]+)\b/g,(_,left,row,right)=>shift(left)+(row||'')+':'+shift(right));
}

function crmReportA1Shift_(a1, direction) {
  return String(a1).replace(/(\$?)([A-Z]+)(\$?\d*)/g, function(full, dollar, letters, suffix) {
    let column = 0;
    for (const char of letters) column = column * 26 + char.charCodeAt(0) - 64;
    column = direction > 0 ? crmReportColumn_(column) : crmReportLogicalColumn_(column);
    let result = '';
    while (column) { result = String.fromCharCode(65 + (column - 1) % 26) + result; column = Math.floor((column - 1) / 26); }
    return dollar + result + suffix;
  });
}

function crmReportRangeAdapter_(raw, sheet) {
  if (CRM_REPORT_NATIVE_.has(raw)) return raw;
  const gaps=[2].concat(CRM_REPORT_SPACER_STATE_?[23]:[]).filter(c=>c>=raw.getColumn()&&c<=raw.getLastColumn()).map(c=>c-raw.getColumn());
  const gap = gaps.length>0;
  let proxy;
  proxy = new Proxy(raw, {get:function(target, key) {
    if (key === 'getSheet') return function() { return sheet; };
    if (key === 'getColumn') return function() { return crmReportLogicalColumn_(target.getColumn()); };
    if (key === 'getLastColumn') return function() { return crmReportLogicalColumn_(target.getLastColumn()); };
    if (key === 'getNumColumns') return function() { return target.getNumColumns() - gaps.length; };
    if (key === 'getA1Notation') return function() { return crmReportA1Shift_(target.getA1Notation(), -1); };
    const method = target[key];
    if (typeof method !== 'function') return method;
    return function() {
      const args = Array.from(arguments).map(crmReportUnwrap_);
      if (gap && /^set(?:Values|Formulas|NumberFormats|DataValidations|Notes|FontColors|Backgrounds)$/.test(key)) {
        const getter='get'+key.slice(3);
        const current=target[getter]();
        args[0] = args[0].map(function(row,i) { const copy=row.slice();gaps.forEach(index=>copy.splice(index,0,current[i][index]));return copy; });
      }
      const result = method.apply(target, args);
      if (gap && /^(getValues|getDisplayValues|getFormulas|getNumberFormats|getDataValidations|getNotes)$/.test(key)) {
        return result.map(row=>row.filter((value,index)=>!gaps.includes(index)));
      }
      return result === target ? proxy : result;
    };
  }});
  CRM_REPORT_NATIVE_.set(proxy, raw);
  return proxy;
}

function crmReportSheetAdapter_(raw) {
  if (!raw || CRM_REPORT_NATIVE_.has(raw)) return raw;
  if (!crmReportHasColumn_(raw)) return raw;
  if (CRM_REPORT_SHEET_CACHE_.has(raw)) return CRM_REPORT_SHEET_CACHE_.get(raw);
  let proxy;
  proxy = new Proxy(raw, {get:function(target,key) {
    if (key === 'getRange') return function() {
      const args = Array.from(arguments);
      if (typeof args[0] === 'string') args[0] = crmReportA1Shift_(args[0],1);
      else {
        if (args.length >= 4) args[3]=crmReportColumn_(args[1]+args[3]-1)-crmReportColumn_(args[1])+1;
        args[1] = crmReportColumn_(args[1]);
      }
      return crmReportRangeAdapter_(target.getRange.apply(target,args),proxy);
    };
    if (key === 'getRangeList') return function(addresses) { return target.getRangeList(addresses.map(a=>crmReportA1Shift_(a,1))); };
    if (key === 'getMaxColumns' || key === 'getLastColumn') return function() { return target[key]() - 1-(CRM_REPORT_SPACER_STATE_?1:0); };
    if (key === 'getColumnWidth' || key === 'setColumnWidth' || key === 'setColumnWidths' || key === 'hideColumns' || key === 'showColumns' || key === 'insertColumnsAfter') return function() {
      const args=Array.from(arguments);args[0]=crmReportColumn_(args[0]);const result=target[key].apply(target,args);return result===target?proxy:result;
    };
    const method=target[key];
    if(typeof method!=='function')return method;
    return function() { const result=method.apply(target,Array.from(arguments).map(crmReportUnwrap_));return result===target?proxy:result; };
  }});
  CRM_REPORT_NATIVE_.set(proxy,raw);
  CRM_REPORT_SHEET_CACHE_.set(raw,proxy);
  return proxy;
}

function crmReportAdaptEvent_(e) {
  if(!e || !e.range || e.range.getSheet().getSheetId()!==254139861 || CRM_REPORT_NATIVE_.has(e.range))return e;
  if(!crmReportHasColumn_(e.range.getSheet()))return e;
  const result=Object.assign({},e);
  let range=e.range;
  if(range.getColumn()===2 && range.getNumColumns()>1) {
    range=range.getSheet().getRange(range.getRow(),3,range.getNumRows(),range.getNumColumns()-1);
  }
  result.range=crmReportRangeAdapter_(range,crmReportSheetAdapter_(range.getSheet()));
  return result;
}
