import { buildSheetCalendar, type SheetCalendarRows } from "./google/sheet-calendar-model";
import { customerVehicles, shortCustomerBirth } from "@/app/my-page/customer-form-fields";
import type { StoredCustomer, StoredContract } from "./customer-records";
// Reuse the same date rules for the legacy sheet and the encrypted customer directory.
export function buildCustomerCalendar(customers:StoredCustomer[],contracts:StoredContract[],from:string,to:string,identify:(value:string)=>string){
 const rows:SheetCalendarRows={customers:[],vehicles:[],contracts:[],products:[],terms:[]};
 for(const customer of customers){
  const vehicles=customerVehicles(customer);
  for(const vehicle of vehicles.length?vehicles:[null]){
   rows.customers.push([customer.id,customer.name,customer.birth]);
   rows.vehicles.push(vehicle?[vehicle.vehicleNumber,vehicle.vehicleType,vehicle.renewal,vehicle.insurer]:[]);
  }
 }
 for(const contract of contracts){
  rows.contracts.push([contract.customerId,contract.date,contract.insured||contract.owner,contract.insuredBirth||contract.ownerBirth]);
  rows.products.push([contract.product]);rows.terms.push([contract.immunity,contract.reduction]);
 }
 return buildSheetCalendar(rows,from,to,value=>`crm_${identify(value)}`).map(event=>({...event,birth:shortCustomerBirth(event.birth),icon:event.kind==="immunity"?"🛡️":event.kind==="reduction"?"⏳":event.icon}));
}
