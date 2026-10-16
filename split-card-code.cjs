const fs=require('fs'),vm=require('vm');let s=fs.readFileSync('Code-CRM-customer-card-header-fixed.txt','utf8');
function col(n){let v='';for(;n;n=Math.floor((n-1)/26))v=String.fromCharCode(65+(n-1)%26)+v;return v;}
function addr(a){return a.replace(/([A-Z]+)(\d+)/g,(_,letters,row)=>{let n=0;for(const ch of letters)n=n*26+ch.charCodeAt(0)-64;return col(n+[3,5,8,10].filter(x=>x<n).length)+row;});}
function block(name,next,edit){const a=s.indexOf('function '+name),b=s.indexOf('function '+next,a);if(a<0||b<0)throw Error(name);s=s.slice(0,a)+edit(s.slice(a,b))+s.slice(b);}
block('refreshCustomerCard(source)','formatPhoneNumber',t=>t.replace(/'([A-Z]+\d+(?::[A-Z]+\d+)?)'/g,(_,a)=>"'"+addr(a)+"'").replace(/([A-Z]+\d+):/g,(_,a)=>addr(a)+':'));
block('clearCustomerCardContracts_(card)','customerContractBirthKey_',t=>t.replace('card.getRange(5,13,','card.getRange(5,17,').replace("'M4:T4'","'Q4:X4'"));
block('refreshCustomerCardContracts_(ss,card,name,birth)','contractExpirySerial_',t=>t.replace('card.getRange(5,13,','card.getRange(5,17,'));
const a=s.indexOf('function openCalendarCustomer_'),b=s.indexOf('function onSelectionChange',a);if(a>=0)s=s.slice(0,a)+s.slice(a,b).replace("card.getRange('E4')","card.getRange('F4')")+s.slice(b);
new vm.Script(s);fs.writeFileSync('Code-CRM-customer-card-split-columns.txt',s);console.log('PASS: entire script syntax, split inputs and Q:X contract output');
