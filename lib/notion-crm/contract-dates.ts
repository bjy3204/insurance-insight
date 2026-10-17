export function contractExpiry(contractDate:string,period:unknown){
 const months=Number(period);if(!/^\d{4}-\d{2}-\d{2}$/.test(contractDate)||!String(period??'').trim()||!Number.isSafeInteger(months)||months<0||months>1200)return '';
 const base=new Date(contractDate+'T00:00:00Z');if(!Number.isFinite(base.getTime())||base.toISOString().slice(0,10)!==contractDate)return '';
 const end=new Date(Date.UTC(base.getUTCFullYear(),base.getUTCMonth()+months,1));end.setUTCDate(Math.min(base.getUTCDate(),new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()+1,0)).getUTCDate()));return end.toISOString().slice(0,10);
}
