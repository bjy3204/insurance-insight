import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('./place-label.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {labelPlace,addressPlaces}=exports;
test('Same neighborhood name displays its city and district',()=>{
 assert.equal(labelPlace({city:'울산광역시',district:'남구',name:'삼산동'}).name,'울산광역시 남구 삼산동');
 assert.equal(labelPlace({city:'울산광역시',district:'남구',name:'삼산동'}).displayName,'울산광역시 삼산동');
 assert.equal(labelPlace({city:'인천광역시',name:'삼산동'}).displayName,'인천광역시 삼산동');
});
test('Province and city are retained without duplicated names',()=>{
 assert.equal(labelPlace({state:'경상북도',city:'안동시',name:'삼산동'}).displayName,'경상북도 안동시 삼산동');
 assert.equal(labelPlace({city:'서울특별시',name:'서울특별시'}).displayName,'서울특별시');
});
test('Buildings, foreign places and duplicate results are excluded',()=>{
 const feature={properties:{name:'삼산동',city:'울산광역시',countrycode:'KR',type:'locality',osm_key:'place'},geometry:{coordinates:[129.34388,35.54126]}};
 const results=addressPlaces([feature,feature,{...feature,properties:{...feature.properties,osm_key:'landuse'}},{...feature,properties:{...feature.properties,countrycode:'US'}}]);
 assert.equal(results.length,1);
 assert.equal(results[0].displayName,'울산광역시 삼산동');
});
