import { exemptionHistoryRows, medicalHistoryRows, type HistoryRow } from './medicalHistoryData';

export const medicalGenerations = [
  { id: 'gen1', name: '1세대', periods: [{ column: 0, title: '~2005.04' }, { column: 1, title: '2005.05~2009.03' }, { column: 2, title: '2009.04~2009.07' }] },
  { id: 'gen2', name: '2세대', periods: [{ column: 3, title: '2009.08~2013.03' }, { column: 4, title: '2013.04~2015.08' }, { column: 5, title: '2015.09~2015.12' }, { column: 6, title: '2016.01~2017.03' }] },
  { id: 'gen3', name: '3세대', periods: [{ column: 7, title: '2017.04~2021.06' }] },
  { id: 'gen4', name: '4세대', periods: [{ column: 8, title: '2021.07~2026.03' }] },
  { id: 'gen5', name: '5세대', periods: [{ column: 9, title: '2026.04~' }] },
];
export type GenerationDetail = { section?: string; label: string; text: string; note?: string; rowSpan: number; coveredByPrevious: boolean };
// 병합된 비교표의 칸을 펼쳐 선택한 가입 시기의 내용을 가져옵니다.
export function selectHistoryColumn(rows: HistoryRow[], column: number): GenerationDetail[] {
  const carried = Array.from({ length: 10 }, () => ({ text: '', remaining: 0 }));
  let carriedNote = '';
  let noteRemaining = 0;
  return rows.map(row => {
    const note = row.note ?? (noteRemaining > 0 ? carriedNote : undefined);
    noteRemaining = Math.max(0, noteRemaining - 1);
    if (row.note && (row.noteRowSpan || 1) > 1) {
      carriedNote = row.note;
      noteRemaining = (row.noteRowSpan || 1) - 1;
    }
    const occupied = carried.map(value => value.remaining > 0);
    const values = carried.map(value => value.remaining > 0 ? value.text : '');
    const rowSpans = Array(10).fill(1);
    carried.forEach(value => { value.remaining = Math.max(0, value.remaining - 1); });
    let cursor = 0;
    for (const cell of row.cells) {
      while (occupied[cursor]) cursor++;
      for (let offset = 0; offset < (cell.span || 1); offset++) {
        const index = cursor + offset;
        values[index] = cell.text;
        rowSpans[index] = cell.rowSpan || 1;
        carried[index] = { text: cell.text, remaining: (cell.rowSpan || 1) - 1 };
      }
      cursor += cell.span || 1;
    }
    return { section: row.section, label: row.label, text: values[column], note, rowSpan: rowSpans[column], coveredByPrevious: occupied[column] };
  });
}
export function getGenerationDetails(column: number) {
  return {
    coverage: selectHistoryColumn(medicalHistoryRows, column).filter(row => row.label !== '판매시기'),
    exemptions: selectHistoryColumn(exemptionHistoryRows, column).filter(row => row.label !== '질병구분'),
  };
}
