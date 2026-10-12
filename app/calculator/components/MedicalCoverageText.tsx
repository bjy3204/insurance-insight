const categoryPattern = /^(3대\s*비급여(?:\s*중증)?|비급여\s*비중증|비급여\s*중증|비급여|급여|입·통원|입원|통원|약제|도수치료|주사료|MRI)/;

export default function MedicalCoverageText({ text, coverageOnly = false }: { text: string; coverageOnly?: boolean }) {
  const category = text.match(coverageOnly ? /^(비급여|급여)/ : categoryPattern)?.[0];
  return category
    ? <><strong style={{ fontWeight: 700 }}>{category}</strong>{text.slice(category.length)}</>
    : <>{text}</>;
}
