import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import XLSX from 'xlsx';

const root = fileURLToPath(new URL('../',import.meta.url));
const [file=path.join(root,'app/pension-calculator/data/예상연금월액표.xlsx'),inputMonth,sourceUrl='https://m.nps.or.kr/pnsinfo/databbs/getOHAF0272M0List.do'] = process.argv.slice(2);
let month=inputMonth;
if (!month) {
  try {
    const workbook=XLSX.read(fs.readFileSync(path.resolve(file)),{type:'buffer',bookSheets:true});
    const periods=workbook.SheetNames.map(name=>name.match(/(20\d{2})년\s*(\d{1,2})월/)).filter(Boolean).map(match=>match[1]+'-'+match[2].padStart(2,'0'));
    if(periods.length<3 || new Set(periods).size!==1) throw new Error('엑셀 시트에서 공통 기준 연월을 확인할 수 없습니다.');
    month=periods[0];
  } catch(error) { console.error('기존 표 유지: '+error.message); process.exit(1); }
}
if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)) {
  console.error('기준 연월은 YYYY-MM 형식으로 입력하세요.'); process.exit(1);
}
const exports={};
const code=ts.transpileModule(fs.readFileSync(path.join(root,'lib/nps-table-parser.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
vm.runInNewContext(code,{exports,require:createRequire(import.meta.url),Buffer,URL,Date});
try {
  const source={effectiveMonth:month,sourceTitle:`${month.slice(0,4)}년 ${Number(month.slice(5))}월 예상연금월액표`,sourceUrl};
  const data=exports.parseNpsWorkbook(fs.readFileSync(path.resolve(file)),source,sourceUrl);
  // Validation completes before replacing the application data.
  const target=path.join(root,'app/pension-calculator/data/nps-tables.json');
  fs.writeFileSync(target,JSON.stringify(data,null,2)+'\n');
  console.log(`${month} 국민연금표 저장 완료: 각 ${data.oldAge.length}행\n${target}\n사이트에 반영하려면 재배포하세요.`);
} catch (error) {
  console.error(`변환 실패, 기존 표 유지: ${error.message}`);
  process.exit(1);
}
