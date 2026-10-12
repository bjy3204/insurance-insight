import { uncompensatedHistoryRows, historyColumns, medicalHistoryRows, type HistoryRow } from './medicalHistoryData';

export const medicalGenerations = ['1세대', '2세대', '3세대', '4세대', '5세대'].map((name, index) => ({
  id: `gen${index + 1}`, name,
  periods: historyColumns.flatMap((column, columnIndex) => column.generation === name ? [{ column: columnIndex, title: column.period }] : []),
}));
export type GenerationDetail = { section?: string; label: string; text: string; note?: string; rowSpan: number; coveredByPrevious: boolean };
// 병합된 비교표의 칸을 펼쳐 선택한 가입 시기의 내용을 가져옵니다.
export function selectHistoryColumn(rows: HistoryRow[], column: number): GenerationDetail[] {
  const carried = Array.from({ length: historyColumns.length }, () => ({ text: '', remaining: 0 }));
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
    const rowSpans = Array(historyColumns.length).fill(1);
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
    coverage: selectHistoryColumn(medicalHistoryRows, column).filter(row => row.label !== '적용기간'),
    exemptions: selectHistoryColumn(uncompensatedHistoryRows, column),
  };
}
