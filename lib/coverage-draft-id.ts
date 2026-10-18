import {createHash} from 'node:crypto';
export function coverageDraftId(owner:string,scope:string){const hash=createHash('sha256').update('coverage-draft:'+owner+scope).digest('hex');return `${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20,32)}`;}
export function coverageIdentityScope(name:string,birth:string){return ':'+JSON.stringify([name.trim().normalize('NFC').replace(/\s/g,''),birth]);}
