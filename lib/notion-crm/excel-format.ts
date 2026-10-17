/** Apply the shared download style after SheetJS has written cell values. */
export async function formatExportWorkbook(bytes: ArrayBuffer): Promise<Uint8Array> {
 const {default:JSZip}=await import('jszip');
 const zip=await JSZip.loadAsync(bytes);
 let styles=await zip.file('xl/styles.xml')!.async('string');
 const append=(tag:string,xml:string)=>{
  let index=0;
  styles=styles.replace(new RegExp(`<${tag} count="(\\d+)"([^>]*)>([\\s\\S]*?)</${tag}>`),(_,count,attrs,body)=>{
   index=Number(count);return `<${tag} count="${index+1}"${attrs}>${body}${xml}</${tag}>`;
  });
  return index;
 };
 const font=append('fonts','<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Malgun Gothic"/></font>');
 const fill=append('fills','<fill><patternFill patternType="solid"><fgColor rgb="FF195DFF"/><bgColor indexed="64"/></patternFill></fill>');
 const header=append('cellXfs',`<xf numFmtId="0" fontId="${font}" fillId="${fill}" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>`);
 styles=styles.replace(/<cellXfs\b([^>]*)>([\s\S]*?)<\/cellXfs>/,(_,attrs,body)=>`<cellXfs${attrs}>${body.replace(/<xf\b([^>]*?)(?:\/>|>([\s\S]*?)<\/xf>)/g,(_:string,xfAttrs:string,contents:string|undefined)=>`<xf${xfAttrs.replace(/\sapplyAlignment="[^"]*"/g,'')} applyAlignment="1">${(contents||'').replace(/<alignment\b[^>]*(?:\/>|>[\s\S]*?<\/alignment>)/g,'')}<alignment horizontal="center" vertical="center"/></xf>`)}</cellXfs>`);
 zip.file('xl/styles.xml',styles);
 for(const path of Object.keys(zip.files).filter(path=>/^xl\/worksheets\/sheet\d+\.xml$/.test(path))){
  let xml=await zip.file(path)!.async('string');
  xml=xml.replace(/<row\b([^>]*)>/g,(_,attrs)=>`<row${attrs.replace(/\s(?:ht|customHeight)="[^"]*"/g,'')} ht="20" customHeight="1">`);
  xml=xml.replace(/<row\b[^>]*\br="1"[^>]*>[\s\S]*?<\/row>/,row=>row.replace(/<c\b([^>]*)>/g,(_,attrs)=>`<c${attrs.replace(/\ss="[^"]*"/g,'')} s="${header}">`));
  zip.file(path,xml);
 }
 return zip.generateAsync({type:'uint8array',compression:'DEFLATE'});
}
