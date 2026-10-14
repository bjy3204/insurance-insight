import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire('C:/Users/bjy32/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {FileBlob,SpreadsheetFile}=await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load('C:/Users/bjy32/Music/insurance-insight/outputs/customer-xlsx-20261015/source.xlsx'));
console.log((await wb.inspect({kind:'sheet',include:'id,name',maxChars:1200})).ndjson);
await fs.writeFile('C:/Users/bjy32/Music/insurance-insight/outputs/customer-xlsx-20261015/before.png',new Uint8Array(await (await wb.render({sheetName:'고객정보 조회',range:'B2:K21',scale:1.5})).arrayBuffer()));
