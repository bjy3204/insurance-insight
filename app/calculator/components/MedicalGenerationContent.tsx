import { getGenerationDetails, type GenerationDetail } from './medicalGenerationData';
import styles from './MedicalHistoryModal.module.css';

function DetailText({ text }: { text: string }) {
  return <>{text.split('\n').map((line, index) => <span key={index} className={/^\s*[(（*※]/.test(line) ? styles.finePrint : styles.textLine}>{line}</span>)}</>;
}
function DetailTable({ rows }: { rows: GenerationDetail[] }) {
  return <table className={styles.detailTable}><thead><tr><th scope="colgroup" colSpan={2}>구분</th><th scope="col">보장내용</th></tr></thead>
    <tbody>{rows.map((row, index) => <tr key={index} className={row.section === '입원' || row.label.startsWith('3대비급여') ? styles.highlightRow : undefined}>
      {row.section && rows[index - 1]?.section !== row.section && <th className={styles.sectionCell} scope="rowgroup" rowSpan={rows.slice(index).findIndex(next => next.section !== row.section) === -1 ? rows.length - index : rows.slice(index).findIndex(next => next.section !== row.section)}>{row.section}</th>}
      <th scope="row" className={styles.detailLabel} colSpan={row.section ? 1 : 2}><DetailText text={row.label} /></th>
      {!row.coveredByPrevious && <td rowSpan={row.rowSpan}><DetailText text={row.text} /></td>}
    </tr>)}</tbody>
  </table>;
}
export default function MedicalGenerationContent({ column }: { column: number }) {
  const details = getGenerationDetails(column);
  return <>
    <section className={styles.detailSection}><h3>실손의료비 보장내용</h3><DetailTable rows={details.coverage} /></section>
  </>;
}
