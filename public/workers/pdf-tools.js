importScripts('/vendor/qpdf/qpdf.js');
self.onmessage=async({data})=>{let pdf;try{
 let diagnostics='',stdout='';pdf=await Module({locateFile:()=>'/vendor/qpdf/qpdf.wasm',noInitialRun:true,noFSInit:true,noExitRuntime:true});pdf.FS.init(()=>null,byte=>{stdout+=String.fromCharCode(byte);},byte=>{diagnostics+=String.fromCharCode(byte);});pdf.FS.writeFile('/input.pdf',new Uint8Array(data.buffer));
 const password=typeof data.password==='string'?data.password:'';
 const call=args=>{let code;try{code=pdf.callMain(args);}catch(error){code=typeof error.status==='number'?error.status:2;}if(code!==0&&code!==3)throw Error(/invalid password/i.test(diagnostics)?'password':'pdf');return code;};
 call(['--password='+password,'--show-npages','/input.pdf']);const count=Number(stdout.trim().split(/\s+/).pop());if(!Number.isSafeInteger(count)||count<1)throw Error('pages');
 if(data.action==='inspect'){self.postMessage({ok:true,count});return;}
 let args;
 if(data.action==='encrypt'){if(typeof data.newPassword!=='string'||!data.newPassword||data.newPassword.length>128)throw Error('new-password');const bytes=new Uint8Array(24);crypto.getRandomValues(bytes);const owner=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');args=['--password='+password,'--encrypt',data.newPassword,owner,'256','--','/input.pdf','/output.pdf'];}
 else if(data.action==='extract'||data.action==='delete'){
  const requested=new Set();for(const token of String(data.pages||'').replace(/\s/g,'').split(',')){if(!/^\d+(-\d+)?$/.test(token))throw Error('range');const [a,b=a]=token.split('-').map(Number);if(a<1||b<a||b>count)throw Error('range');for(let n=a;n<=b;n++)requested.add(n);}
  const pages=data.action==='delete'?Array.from({length:count},(_,i)=>i+1).filter(n=>!requested.has(n)):[...requested];if(!pages.length)throw Error('empty');args=['--password='+password,'--decrypt','/input.pdf','--pages','.',pages.join(','),'--','/output.pdf'];
 }else throw Error('action');
 const code=call(args),output=pdf.FS.readFile('/output.pdf').slice().buffer;self.postMessage({ok:true,buffer:output,count,warning:code===3},[output]);
 }catch(error){self.postMessage({ok:false,reason:error.message||'pdf'});}finally{if(pdf)for(const file of ['/input.pdf','/output.pdf'])try{pdf.FS.unlink(file);}catch{}self.close();}};
