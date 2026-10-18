import {validateCoverageDraft,type CoverageDraft} from './coverage-draft';
const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
// Reapply only locally changed fields to the latest server version.
export function mergeCoverageDraft(base:CoverageDraft,local:CoverageDraft,remote:CoverageDraft):CoverageDraft{
 function merge(previous:unknown,current:unknown,incoming:unknown):unknown{
  if(equal(previous,current))return incoming;
  if(equal(previous,incoming)||equal(current,incoming))return current;
  if(Array.isArray(previous)&&Array.isArray(current)&&Array.isArray(incoming)&&[...previous,...current,...incoming].every(item=>object(item)&&typeof item.id==='string')){
   const old=new Map(previous.map(item=>[item.id,item])),mine=new Map(current.map(item=>[item.id,item])),theirs=new Map(incoming.map(item=>[item.id,item]));
   const ids=[...current.map(item=>item.id),...incoming.filter(item=>!mine.has(item.id)&&!old.has(item.id)).map(item=>item.id)];
   return ids.flatMap(id=>{if(old.has(id)&&!theirs.has(id)&&equal(old.get(id),mine.get(id)))return [];const value=merge(old.get(id),mine.get(id),theirs.get(id));return value===undefined?[]:[value];});
  }
  if(object(current)&&object(incoming)){
   const result:Record<string,unknown>=Object.create(null),old=object(previous)?previous:{};
   for(const key of new Set([...Object.keys(old),...Object.keys(current),...Object.keys(incoming)])){
    if(['__proto__','constructor','prototype'].includes(key))continue;
    const value=merge(old[key],current[key],incoming[key]);if(value!==undefined)result[key]=value;
   }
   return result;
  }
  return current;
 }
 return validateCoverageDraft(merge(base,local,remote));
}
