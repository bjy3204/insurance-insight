import { getGenerationDetails, type GenerationDetail } from './medicalGenerationData';
import styles from './MedicalHistoryModal.module.css';
import MedicalCoverageText from './MedicalCoverageText';

function DetailText({ text, emphasize = true, coverageOnly = false }: { text: string; emphasize?: boolean; coverageOnly?: boolean }) {
  return <>{text.split('\n').map((line, index) => <span key={index} className={/^\s*[(（*※]/.test(line) ? styles.finePrint : styles.textLine}>{emphasize ? <MedicalCoverageText text={line} coverageOnly={coverageOnly}/> : line}</span>)}</>;
}
function DetailTable({ rows, column }: { rows: GenerationDetail[]; column: number }) {
  return <table className={styles.detailTable}>
    <tbody>{rows.map((row, index) => <tr key={index} className={row.label === '구분' ? styles.categoryRow : undefined}>
      {row.section && rows[index - 1]?.section !== row.section && <th className={styles.sectionCell} scope="rowgroup" rowSpan={rows.slice(index).findIndex(next => next.section !== row.section) === -1 ? rows.length - index : rows.slice(index).findIndex(next => next.section !== row.section)}>{row.section}</th>}
      <th scope="row" className={styles.detailLabel} colSpan={row.section ? 1 : 2}><DetailText text={row.label} /></th>
      {!row.coveredByPrevious && <td rowSpan={row.rowSpan}><DetailText text={row.text} emphasize={row.label !== '담보구성'} coverageOnly={column === 6 && ['본인부담 한도', '보장비율'].includes(row.label)} /></td>}
    </tr>)}</tbody>
  </table>;
}
export default function MedicalGenerationContent({ column }: { column: number }) {
  const details = getGenerationDetails(column);
  return <section className={styles.detailSection}><DetailTable rows={details.coverage} column={column} /></section>;
}
