const fs=require('fs'),vm=require('vm');
let all=fs.readFileSync('customer-registration.gs','utf8').replace(".addItem('고객 등록', 'registerCustomer')",".addItem('고객등록', 'openCustomerRegistration')").replace(".addItem('등록 기능 연결 완료', 'setupCustomerRegistration')",".addItem('계약추가', 'activateContractInput')");
all+='\nfunction customerDialogHtml2_(){return '+JSON.stringify(fs.readFileSync('customer-dialog2.html','utf8'))+';}\n';
all+=fs.readFileSync('customer-dialog2-server.gs','utf8').replace('HtmlService.createHtmlOutput(CUSTOMER_DIALOG_HTML_2)','HtmlService.createHtmlOutput(customerDialogHtml2_())');
for(const file of ['contracts.gs','customer-list-layout.gs','crm-sheet-links.gs','operational-views.gs','customer-card-contracts.gs','crm-calendar.gs','crm-calendar-holidays.gs'])all+='\n'+fs.readFileSync(file,'utf8');
new vm.Script(all);fs.writeFileSync('Code-CRM-calendar-final.txt',all);console.log('PASS: entire Code.gs syntax');
