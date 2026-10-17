import {google,headers,readSheet,type GoogleConnection} from './sheets';
import {sourceNames,type Source} from './model';
import {saveConnection} from './connections';
import {CrmError} from './server';
const sources=Object.keys(sourceNames) as Source[];
export async function prepareSpreadsheet(c:GoogleConnection,hint?:string) {
 if(c.spreadsheet)return;
 if(hint){const candidate={...c,spreadsheet:hint};const metadata=await google<{properties:{title:string;timeZone:string}}>(candidate,hint+'?fields=properties(title,timeZone)');if(metadata.properties.timeZone!=='Asia/Seoul')throw new CrmError('스프레드시트 시간대는 Asia/Seoul이어야 합니다');for(const source of sources)await readSheet(candidate,source);c.spreadsheet=hint;c.title=metadata.properties.title;await saveConnection('sheets',c);return;}
 const result=await google<{spreadsheetId:string}>(c,'','POST',{properties:{title:'고객 관리 노트',locale:'ko_KR',timeZone:'Asia/Seoul'},sheets:sources.map((source,index)=>({properties:{sheetId:index,title:sourceNames[source],gridProperties:{rowCount:1000,columnCount:Math.max(26,headers(source).length),frozenRowCount:1}},data:[{startRow:0,startColumn:0,rowData:[{values:headers(source).map(name=>({userEnteredValue:{stringValue:name},userEnteredFormat:{backgroundColor:{red:.94,green:.96,blue:1},textFormat:{bold:true},numberFormat:{type:'TEXT'}}}))}]}]}))});
 c.spreadsheet=result.spreadsheetId;c.title='고객 관리 노트';
 await saveConnection('sheets',c);
}
