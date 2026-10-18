import QRCode from 'qrcode';
export type QrDesign={text:string;color:string;background:string;shape:'square'|'rounded'|'dots';heart:boolean;frame:boolean};
const hex=(value:string)=>/^#[0-9a-f]{6}$/i.test(value);
export function buildQrSvg(input:QrDesign){
 if(!input.text.trim())throw Error('QR에 넣을 주소나 문구를 입력해 주세요');
 if(new TextEncoder().encode(input.text).length>1200)throw Error('내용이 너무 깁니다 1200바이트 이하로 줄여 주세요');
 if(!hex(input.color)||!hex(input.background))throw Error('색상을 확인해 주세요');
 const qr=QRCode.create(input.text,{errorCorrectionLevel:'H'}),n=qr.modules.size;
 const width=600,height=input.frame?680:600,side=input.frame?320:520,x=(width-side)/2,y=input.frame?110:40,cell=side/(n+8),left=x+cell*4,top=y+cell*4;
 let body=`<rect width="${width}" height="${height}" fill="${input.background}"/>`;
 if(input.frame)body+=`<path d="M300 85C213 -13 22 44 22 193C22 368 179 518 300 630C421 518 578 368 578 193C578 44 387 -13 300 85Z" fill="none" stroke="${input.color}" stroke-width="7"/>`;
 for(let row=0;row<n;row++)for(let col=0;col<n;col++){if(!qr.modules.get(row,col))continue;const px=left+col*cell,py=top+row*cell;const reserved=!!qr.modules.isReserved(row,col);
 if(input.shape==='dots'&&!reserved)body+=`<circle cx="${px+cell/2}" cy="${py+cell/2}" r="${cell*.5}" fill="${input.color}"/>`;
 else body+=`<rect x="${px}" y="${py}" width="${cell+.02}" height="${cell+.02}" rx="${input.shape==='rounded'&&!reserved?cell*.25:0}" fill="${input.color}"/>`;}
 if(input.heart){const size=Math.min(5,n*.15)*cell,cx=width/2,cy=top+n*cell/2;body+=`<rect x="${cx-size/2}" y="${cy-size/2}" width="${size}" height="${size}" rx="${cell*.5}" fill="${input.background}"/><path d="M12 21S2 14.5 2 7.5C2 1.5 9 0 12 5C15 0 22 1.5 22 7.5C22 14.5 12 21 12 21Z" transform="translate(${cx-size*.4} ${cy-size*.4}) scale(${size*.8/24})" fill="${input.color}"/>`;}
 return {svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`,width,height};
}
export function qrContrast(color:string,background:string){const lum=(hex:string)=>{const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};return (lum(background)+.05)/(lum(color)+.05);}
