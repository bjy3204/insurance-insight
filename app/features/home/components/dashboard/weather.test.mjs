import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function read(name) {
 const exports={};
 const source=ts.transpileModule(fs.readFileSync(new URL(`./${name}.ts`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(source,{exports,Date,Intl}); return exports;
}
const {daylightWeights,layerOpacities,backgroundPath}=read('weather-light');
test('Actual sunrise/sunset anchor gradual light changes with normalized weights',()=>{
 const sunrise=10000,sunset=50000;
 assert.equal(daylightWeights(sunrise-2700,sunrise,sunset).night,1);
 assert.equal(daylightWeights(sunrise,sunrise,sunset).dawn,1);
 assert.equal(daylightWeights(sunrise+2700,sunrise,sunset).day,1);
 assert.equal(daylightWeights(sunset,sunrise,sunset).dusk,1);
 assert.equal(daylightWeights(sunset+2700,sunrise,sunset).night,1);
 for(let now=0;now<60000;now+=37) {
  const weights=daylightWeights(now,sunrise,sunset);
  assert.ok(Math.abs(Object.values(weights).reduce((a,b)=>a+b,0)-1)<1e-10);
  const next=daylightWeights(now+1,sunrise,sunset);
  assert.ok(Object.keys(weights).every(key=>Math.abs(next[key]-weights[key])<.001));
 }
 assert.notDeepEqual({...daylightWeights(10000,10000,50000)},{...daylightWeights(10000,11000,51000)});
});
test('Stacked alpha reproduces requested weights without darker blends',()=>{
 const weights=daylightWeights(11000,10000,50000);
 const opacity=layerOpacities(weights);
 const reconstructedDay=opacity.day*(1-opacity.dusk)*(1-opacity.dawn);
 assert.ok(Math.abs(reconstructedDay-weights.day)<1e-10);
});
test('Every weather/time combination resolves to an existing asset',()=>{
 for(const condition of ['clear','cloudy','rain','snow']) for(const phase of ['night','dawn','day','dusk']) {
  assert.ok(fs.existsSync(new URL('../../../../..'+ '/public'+backgroundPath(condition,phase),import.meta.url)),`${condition}/${phase}`);
 }
});
