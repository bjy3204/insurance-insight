import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync(new URL('./image-cache.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const saved=new Map();let calls=0,fail=false;
function load(){const module={exports:{}};vm.runInNewContext(source,{module,exports:module.exports,URL,Response,window:{location:{origin:'https://example.com'}},caches:{open:async()=>({match:async key=>saved.get(key)?.clone(),put:async(key,response)=>saved.set(key,response)})},fetch:async()=>{calls++;return fail?new Response('',{status:503}):new Response(new Blob(['image'],{type:'image/png'}),{headers:{'Content-Type':'image/png'}})}});return module.exports.policyInsertImage;}
test('images survive remounts/token changes, deduplicate fetches and isolate accounts',async()=>{const image=load();await Promise.all([image('a','family','1','token'),image('a','family','1','token')]);assert.equal(calls,1);await load()('a','family','1','new-token');assert.equal(calls,1);await image('b','family','1','token');assert.equal(calls,2);fail=true;await assert.rejects(image('a','family','2','token'));fail=false;await image('a','family','2','token');assert.equal(calls,4);});
