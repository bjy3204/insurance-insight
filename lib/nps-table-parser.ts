import { load } from 'cheerio';
import { createHash } from 'node:crypto';
import * as XLSX from 'xlsx';
import type { NpsTables } from './nps-table-types';

export const NPS_LIST_URL = 'https://m.nps.or.kr/pnsinfo/databbs/getOHAF0272M0List.do';
export type NpsSource = Pick<NpsTables, 'effectiveMonth' | 'sourceTitle' | 'sourceUrl'>;
const normalize = (value: unknown) => String(value ?? '').replace(/\s/g, '');
export function findLatestNpsSource(html: string, now = new Date()): NpsSource {
  const $ = load(html);
  const currentMonth = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 7);
  const sources: NpsSource[] = [];
  $('a[href*="getOHAF0272M1Detail.do"]').each((_, element) => {
    const sourceTitle = $(element).text().trim();
    const match = sourceTitle.match(/(20\d{2})년\s*(\d{1,2})월\s*예상연금월액표/);
    if (!match || +match[2] < 1 || +match[2] > 12) return;
    const effectiveMonth = `${match[1]}-${match[2].padStart(2, '0')}`;
    const url = new URL($(element).attr('href')!, NPS_LIST_URL);
    if (url.origin !== new URL(NPS_LIST_URL).origin || !url.searchParams.has('pstId') || effectiveMonth > currentMonth) return;
    sources.push({ effectiveMonth, sourceTitle, sourceUrl: url.href });
  });
  const latest = sources.sort((a,b) => b.effectiveMonth.localeCompare(a.effectiveMonth))[0];
  if (!latest) throw new Error('No current official NPS table found');
  return latest;
}
export function findNpsDownload(html: string): string {
  const $ = load(html);
  for (const element of $('a.btn-file-down').toArray()) {
    const title = $(element).attr('title') || '';
    if (!/예상연금월액표.*\.xlsx/i.test(title)) continue;
    const match = ($(element).attr('href') || '').match(/fncAtchFileDownload\('\s*(FL\d+)'\s*,\s*'(\d+)'/);
    if (match) return `https://m.nps.or.kr/fileDown.do?atchFileId=${match[1]}&atchFileSn=${match[2]}`;
  }
  throw new Error('Official XLSX attachment was not found');
}
const specs = {
  oldAge: { sheet: '노령연금', headers: ['10년','15년','20년','25년','30년','35년','40년'], keys: ['no','income','premium','year10','year15','year20','year25','year30','year35','year40'] },
  disability: { sheet: '장애연금', headers: ['1급','2급','3급','장애4급'], keys: ['no','income','premium','grade1','grade2','grade3','grade4Lump'] },
  survivor: { sheet: '유족연금', headers: ['10년미만','10년이상20년미만','20년'], keys: ['no','income','premium','under10','between10And20','year20'] },
};
export function validateNpsTables(value: unknown): asserts value is NpsTables {
  const data = value as NpsTables;
  if (!data || data.version !== 1 || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(data.effectiveMonth) || !/^[a-f0-9]{64}$/.test(data.checksum)) throw new Error('Invalid NPS table metadata');
  for (const key of ['oldAge','disability','survivor'] as const) {
    const rows = data[key];
    if (!Array.isArray(rows) || rows.length < 100 || rows.length > 2000) throw new Error('Unexpected NPS row count');
    for (let i=0; i<rows.length; i++) {
      const row = rows[i] as unknown as Record<string,number>;
      if (specs[key].keys.some(field => !Number.isSafeInteger(row[field]) || row[field] <= 0) || row.no !== i+1 || row.income > 30_000_000 || row.premium >= row.income) throw new Error('Invalid NPS numeric row');
      // The official file also inserts the median-income row between 10,000-won steps.
      if (i && (row.income <= rows[i-1].income || row.income - rows[i-1].income > 10000)) throw new Error('Missing or reordered NPS income row');
      const base = data.oldAge[i];
      if (!base || row.no !== base.no || row.income !== base.income || row.premium !== base.premium) throw new Error('NPS tables do not align');
      const rate = data.oldAge[0].premium / data.oldAge[0].income;
      if (rate < .05 || rate > .2 || Math.abs(row.premium - row.income * rate) > 10) throw new Error('Inconsistent NPS premium rate');
    }
    if (rows.length !== data.oldAge.length) throw new Error('Incomplete NPS tables');
  }
}
export function parseNpsWorkbook(bytes: Buffer, source: NpsSource, downloadUrl: string): NpsTables {
  if (bytes.length > 5_000_000 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error('Invalid NPS workbook file');
  const workbook = XLSX.read(bytes, { type: 'buffer', sheetRows: 2005, cellFormula: false, cellHTML: false });
  const tables: Record<string, Record<string,number>[]> = {};
  for (const key of ['oldAge','disability','survivor'] as const) {
    const spec = specs[key];
    const names = workbook.SheetNames.filter(name => normalize(name).startsWith(spec.sheet));
    if (names.length !== 1) throw new Error('NPS sheet layout changed');
    const sheet = workbook.Sheets[names[0]];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header:1, defval:null });
    const first = rows.findIndex(row => row[0] === 1 && typeof row[1] === 'number');
    if (first < 1 || first > 30) throw new Error('NPS table start not found');
    const headers = rows.slice(0,first).flat().map(normalize).join('|');
    if (!headers.includes('연금보험료') || spec.headers.some(header => !headers.includes(header))) throw new Error('NPS column headings changed');
    if (spec.headers.some((header,index) => !rows.slice(0,first).map(row => normalize(row[index+3])).join('|').includes(header))) throw new Error('NPS column order changed');
    const result: Record<string,number>[] = [];
    for (let i=first; i<rows.length && typeof rows[i][0] === 'number'; i++) {
      const row = rows[i];
      if (row.slice(0,spec.keys.length).some(value => typeof value !== 'number')) throw new Error('Non-numeric NPS data');
      result.push(Object.fromEntries(spec.keys.map((field,index) => [field,row[index] as number])));
    }
    // More numeric rows after an interruption mean a damaged or changed layout.
    if (rows.slice(first+result.length).some(row => typeof row[0] === 'number')) throw new Error('Interrupted NPS data rows');
    tables[key] = result;
  }
  const data = { version:1, ...source, downloadUrl, checksum:createHash('sha256').update(bytes).digest('hex'), updatedAt:new Date().toISOString(), ...tables } as NpsTables;
  validateNpsTables(data);
  return data;
}
