// Serialize one sheet instead of cloning the entire editor for every image.
export async function renderReportImage(page:HTMLElement,css:string){
 await document.fonts.ready;
 const copy=page.cloneNode(true) as HTMLElement;
 const computed=getComputedStyle(page);
 const sources=[page,...page.querySelectorAll<HTMLElement|SVGElement>('*')];
 const copies=[copy,...copy.querySelectorAll<HTMLElement|SVGElement>('*')];
 for(let i=0;i<sources.length;i++){
  const sourceStyle=i===0?computed:getComputedStyle(sources[i]);
  for(const property of Array.from(sourceStyle))copies[i].style.setProperty(property,sourceStyle.getPropertyValue(property));
  copies[i].style.visibility='visible';
  if(i%100===99)await new Promise(resolve=>window.setTimeout(resolve,0));
 }
 Object.assign(copy.style,{position:'relative',inset:'auto',margin:'0',transform:'none',zoom:'1',visibility:'visible'});
 const originals=page.querySelectorAll('img'),images=copy.querySelectorAll('img');
 for(let i=0;i<originals.length;i++){
  const original=originals[i];await original.decode();
  const imageCanvas=document.createElement('canvas');
  imageCanvas.width=original.naturalWidth;imageCanvas.height=original.naturalHeight;
  const context=imageCanvas.getContext('2d');
  if(!context)throw new Error('이미지를 생성할 수 없습니다');
  context.drawImage(original,0,0);
  images[i].removeAttribute('srcset');images[i].setAttribute('src',imageCanvas.toDataURL('image/png'));
  imageCanvas.width=imageCanvas.height=0;
 }
 const root=document.createElementNS('http://www.w3.org/1999/xhtml','div');
 const style=document.createElement('style');style.textContent=css;
 // Keep the sheet's CSS scope (.cr-book / .cr-reference), without its editor layout.
 let content:HTMLElement=copy;
 for(let parent=page.parentElement;parent&&!parent.hasAttribute('data-coverage-capture')&&!parent.hasAttribute('data-consultation-capture');parent=parent.parentElement){
  const wrapper=document.createElement('div');wrapper.className=parent.className;
  wrapper.append(content);content=wrapper;
  if(parent.classList.contains('cr-book'))break;
 }
 root.append(style,content);
 const html=new XMLSerializer().serializeToString(root);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1588" height="2246" viewBox="0 0 794 1123"><foreignObject width="794" height="1123">${html}</foreignObject></svg>`;
 const image=new Image();
 await new Promise<void>((resolve,reject)=>{
  const timer=window.setTimeout(()=>{image.src='';reject(new Error('이미지 생성 시간이 초과되었습니다 다시 시도해 주세요'));},20000);
  image.onload=()=>{window.clearTimeout(timer);resolve();};
  image.onerror=()=>{window.clearTimeout(timer);reject(new Error('이미지를 생성하지 못했습니다 다시 시도해 주세요'));};
  image.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
 });
 const canvas=document.createElement('canvas');canvas.width=1588;canvas.height=2246;
 const context=canvas.getContext('2d');if(!context)throw new Error('이미지를 생성할 수 없습니다');
 context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0);
 return canvas;
}
