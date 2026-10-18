/* Files and passwords stay in this disposable browser worker. */
importScripts('/vendor/qpdf/qpdf.js');
self.onmessage=async(event)=>{
 let pdf;
 try{
  const {buffer,password}=event.data;
  if(!(buffer instanceof ArrayBuffer)||typeof password!=='string')throw Error('invalid');
  let diagnostics='';
  pdf=await Module({locateFile:()=>'/vendor/qpdf/qpdf.wasm',noInitialRun:true,noFSInit:true,noExitRuntime:true,print:()=>{},printErr:line=>{diagnostics+=String(line)+'\n';}});
  pdf.FS.init(()=>null,()=>{},byte=>{diagnostics+=String.fromCharCode(byte);});
  pdf.FS.writeFile('/input.pdf',new Uint8Array(buffer));
  let code;
  try{code=pdf.callMain(['--password='+password,'--decrypt','/input.pdf','/output.pdf']);}catch(error){code=error&&typeof error.status==='number'?error.status:2;}
  if(code!==0&&code!==3){self.postMessage({ok:false,reason:/invalid password|incorrect password/i.test(diagnostics)?'password':'pdf'});return;}
  const bytes=pdf.FS.readFile('/output.pdf');
  if(!bytes.length)throw Error('empty');
  const output=bytes.slice().buffer;
  self.postMessage({ok:true,buffer:output,warning:code===3},[output]);
 }catch{self.postMessage({ok:false,reason:'pdf'});}
 finally{if(pdf){for(const file of ['/input.pdf','/output.pdf'])try{pdf.FS.unlink(file);}catch{}}self.close();}
};
