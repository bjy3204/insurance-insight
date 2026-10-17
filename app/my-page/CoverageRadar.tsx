import {reportChartValues,type CoverageReport} from "./coverage-report-model";

export default function CoverageRadar({report}:{report:CoverageReport}){
  const rows=reportChartValues(report);
  const values=["disability-0","cancer-0","heart-0","brain-0","surgery-0","hospital-0"].map(id=>rows.find(item=>item.id===id)!);
  const labels=["후유장해","암","심장","뇌","수술","입원"];
  const point=(index:number,ratio:number)=>{const angle=(-90+index*60)*Math.PI/180;return [140+Math.cos(angle)*69*ratio,112+Math.sin(angle)*69*ratio];};
  const polygon=(ratios:number[])=>ratios.map((ratio,index)=>point(index,ratio).join(",")).join(" ");
  return <section className="cr-coverage-radar" aria-label="설정 기준 대비 보장 현황">
    <svg viewBox="0 0 280 224" role="img" aria-label={values.map(item=>`${item.label} ${item.percent===null?'계산 제외':item.percent+'%'}`).join(', ')}>
      {[.25,.5,.75,1].map(ratio=><polygon key={ratio} points={polygon(values.map(()=>ratio))} fill="none" stroke="#d1d5db" strokeWidth=".8"/>)}
      {values.map((item,index)=><line key={item.id} x1="140" y1="112" x2={point(index,1)[0]} y2={point(index,1)[1]} stroke="#e5e7eb" strokeWidth=".6"/>)}
      <polygon points={polygon(values.map(item=>Math.min(1,(item.percent??0)/100)))} fill="var(--cr-accent)" fillOpacity=".08" stroke="var(--cr-accent)" strokeWidth="1.2"/>
      {values.map((item,index)=>{const [x,y]=point(index,1.4);return <text key={item.id} x={x} y={y+4} textAnchor="middle" fontSize="15" fill="#303030">{labels[index]}</text>;})}
    </svg>
  </section>;
}
