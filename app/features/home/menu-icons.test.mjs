import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
const require=createRequire(import.meta.url),ts=require('typescript'),module={exports:{}};
const iconModule={exports:{}};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../../components/PolicyInsertsIcon.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:iconModule,exports:iconModule.exports,require});
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./data.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:name=>name==="@/app/components/PolicyInsertsIcon"?iconModule.exports:require(name)});
test('every default main menu uses a distinct icon',()=>{
 const icons=new Map();
 for(const menu of module.exports.defaultMenus){assert.ok(menu.icon,`${menu.title} 아이콘 누락`);assert.ok(!icons.has(menu.icon),`${menu.title}: ${icons.get(menu.icon)}와 아이콘 중복`);icons.set(menu.icon,menu.title);}
});
test('policy inserts menu is visible to all visitors',()=>{
 const menu=module.exports.defaultMenus.find(item=>item.id==='policy-inserts');
 assert.equal(menu.title,'보험 증권 속지');
 assert.equal(menu.link,'/policy-inserts');
 assert.ok(!menu.approvedOnly);
});
