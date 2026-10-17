import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript'),cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const local=name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):name.startsWith('@/')?load(path.resolve(name.slice(2)+'.ts')):require(name);vm.runInThisContext('(function(require,module,exports){'+compiled+'\n})',{filename:file})(local,module,module.exports);return module.exports;}
const {parseLinkedImport,importHeaders,contractImportHeaders}=load('lib/notion-crm/customer-import.ts');

const XLSX=require('xlsx'),wb=XLSX.readFile('outputs/customer-import/고객 일괄 등록_테스트20명.xlsx');const matrix=name=>XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,raw:false,defval:''});const rows=parseLinkedImport(matrix('고객정보'),matrix('계약정보'),[]);assert.ok(rows.every(row=>!row.error),JSON.stringify(rows.filter(row=>row.error)));assert.equal(rows.filter(row=>row.source==='customers').length,20);assert.equal(rows.filter(row=>row.source==='contracts').length,20);console.log(JSON.stringify(Object.fromEntries(['customers','contracts','cars','cards'].map(source=>[source,rows.filter(row=>row.source===source).length]))));
