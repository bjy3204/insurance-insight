const fs=require('fs');const path=require('path');const ts=require('typescript');const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
for(const ext of ['.ts','.tsx']) require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
const Paper=require(path.resolve('app/my-page/ClaimNoticePaper.tsx')).default;
const {claimNotices}=require(path.resolve('app/my-page/claim-notices.ts'));
const {chromium}=require('C:/Users/bjy32/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:720,height:720},deviceScaleFactor:1.5});const results=[];
for(const n of claimNotices){
const markup=renderToStaticMarkup(React.createElement(Paper,{kind:n.id,customerName:'홍길동',content:n.content,signature:'든든한 설계사',fontFamily:'sans-serif',textColor:'#4a4a4a',signatureColor:'#4a4a4a'}));
const html=`<!DOCTYPE html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0}#card{position:relative;width:720px;height:720px}</style><div id="card">${markup}</div>`;
fs.writeFileSync(`output/notice-review/claim-${n.id}.html`,html);
await page.setContent(html);await page.evaluate(()=>document.fonts.ready);
const result=await page.evaluate(()=>{const paper=document.querySelector('article');const r=paper.getBoundingClientRect();return {white:getComputedStyle(paper).backgroundColor,overflow:[...paper.querySelectorAll('*')].filter(el=>{const b=el.getBoundingClientRect();return b.bottom>r.bottom+1||b.right>r.right+1||el.scrollWidth>el.clientWidth+1}).map(el=>el.tagName+':'+el.textContent)}});
await page.locator('#card').screenshot({path:`output/notice-review/claim-${n.id}.png`});
await page.addScriptTag({path:path.resolve('node_modules/html2canvas/dist/html2canvas.min.js')});
const capture=await page.evaluate(async()=>{const c=await html2canvas(document.querySelector('#card'),{scale:1.5,width:720,height:720,backgroundColor:null});return {width:c.width,height:c.height,url:c.toDataURL('image/png')}});
fs.writeFileSync(`output/notice-review/claim-${n.id}-saved.png`,Buffer.from(capture.url.split(',')[1],'base64'));
results.push({kind:n.label,...result,capture:[capture.width,capture.height]});}
console.log(JSON.stringify(results));await browser.close();})().catch(e=>{console.error(e);process.exitCode=1});
