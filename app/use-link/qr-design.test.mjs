import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript'),sharp=require('sharp'),jsQR=require('jsqr');
const module={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('./qr-design.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{module,exports:module.exports,require,TextEncoder});
const {buildQrSvg,qrContrast}=module.exports;
test('all dot/heart/frame combinations remain decodable, including Korean content',async()=>{
 for(const text of ['https://www.bohuminsight.com/','보험인사이트 고객 안내'])for(const shape of ['square','rounded','dots'])for(const heart of [false,true])for(const frame of [false,true]){
  const {svg}=buildQrSvg({text,color:'#b52e63',background:'#ffffff',shape,heart,frame});
  const {data,info}=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const result=jsQR(new Uint8ClampedArray(data),info.width,info.height,{inversionAttempts:'dontInvert'});
  assert.equal(result?.data,text,`${shape} heart=${heart} frame=${frame}`);
 }
});
test('empty, oversized and unsafe colors are rejected; contrast distinguishes poor combinations',()=>{
 const base={text:'test',color:'#243957',background:'#ffffff',shape:'square',heart:false,frame:false};
 assert.throws(()=>buildQrSvg({...base,text:''}));assert.throws(()=>buildQrSvg({...base,text:'가'.repeat(500)}));assert.throws(()=>buildQrSvg({...base,color:'red" onload="alert(1)'}));
 assert.ok(qrContrast('#243957','#ffffff')>4.5);assert.ok(qrContrast('#dddddd','#ffffff')<4.5);
});
