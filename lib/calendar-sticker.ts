export type StickerGeometry={x:number;y:number;width:number;height:number};
export const CALENDAR_STICKER_OPEN='open-calendar-sticker';
export function fitCalendarSticker(value:StickerGeometry,viewport:{width:number;height:number}):StickerGeometry{
 const maxWidth=Math.max(1,viewport.width-24),maxHeight=Math.max(1,viewport.height-24);
 const width=Math.min(maxWidth,Math.max(Math.min(280,maxWidth),Number.isFinite(value.width)?value.width:380));
 const height=Math.min(maxHeight,Math.max(Math.min(320,maxHeight),Number.isFinite(value.height)?value.height:520));
 return {width,height,x:Math.max(0,Math.min(viewport.width-width,Number.isFinite(value.x)?value.x:24)),y:Math.max(0,Math.min(viewport.height-height,Number.isFinite(value.y)?value.y:100))};
}
