const fs=require('fs'),vm=require('vm'),a=require('assert/strict');let s=fs.readFileSync('Code-CRM-calendar-centered-details.txt','utf8');let start=s.indexOf('function clearCustomerCardContracts_(card)'),end=s.indexOf('\n}',start);s=s.slice(0,end)+"\n  updateCustomerCardVisibleRows_(card,0);"+s.slice(end);
start=s.indexOf('function refreshCustomerCardContracts_(ss,card,name,birth)');end=s.indexOf('\n}',start);s=s.slice(0,end)+"\n  updateCustomerCardVisibleRows_(card,output.length);"+s.slice(end);
const insert=s.indexOf('function clearCustomerCardContracts_');s=s.slice(0,insert)+`function updateCustomerCardVisibleRows_(card,contractCount) {
  const last=Math.max(18,4+Number(contractCount||0));
  if(last>card.getMaxRows())card.insertRowsAfter(card.getMaxRows(),last-card.getMaxRows());
  card.showRows(1,last);
  if(last<card.getMaxRows())card.hideRows(last+1,card.getMaxRows()-last);
}

`+s.slice(insert);new vm.Script(s);fs.writeFileSync('Code-CRM-customer-card-visible-rows.txt',s);const c={};vm.createContext(c);vm.runInContext(s,c);for(const [count,last]of[[0,18],[1,18],[14,18],[15,19],[20,24]]){let shown,hidden;const card={getMaxRows:()=>999,showRows:(start,n)=>shown=[start,n],hideRows:(start,n)=>hidden=[start,n]};c.updateCustomerCardVisibleRows_(card,count);a.deepEqual(shown,[1,last]);a.deepEqual(hidden,[last+1,999-last]);}console.log('PASS full syntax; minimum 18 rows and exact expansion to final contract row');
