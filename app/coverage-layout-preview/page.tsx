import { notFound } from "next/navigation";
import CoverageAnalysisTab from "../my-page/CoverageAnalysisTab";
export default function CoverageLayoutPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return <main style={{padding:24,maxWidth:1250,margin:"auto",width:"100%"}}><CoverageAnalysisTab/></main>;
}
