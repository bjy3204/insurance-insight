"use client";
import {HoverGuide} from '@/app/my-page/CoverageReportGuide';

export default function CustomerImportGuide(){
 return <HoverGuide title="고객 엑셀 등록 안내" compact width={420} height={540} avoidTrigger>
  <p>양식을 다운로드한 뒤 고객·계약 정보를 작성해 업로드해 주세요</p>
  <section><h3>고객 정보 작성</h3><ul><li>이름과 주민번호는 필수입니다</li><li>주민번호는 <strong>앞 7자리 또는 전체 13자리</strong>로 입력해 주세요</li><li>한 번에 고객 <strong>최대 200명</strong>, 계약 <strong>최대 500건</strong>까지 등록할 수 있습니다</li></ul></section>
  <section><h3>계약 연결 방법</h3><p>계약 시트의 <strong>계약자 이름과 생년월일</strong>을 고객 정보와 동일하게 입력해 주세요<br/>일치하는 고객에게 계약이 연결됩니다</p></section>
  <section><h3>기존 고객 처리</h3><p>이름과 주민번호가 일치하는 기존 고객은 새로 등록하지 않고 연결합니다<br/><strong>기존 고객 정보는 엑셀 내용으로 덮어쓰지 않습니다</strong></p></section>
  <section><h3>업로드 전 확인</h3><p>입력 오류가 있는 행은 등록에서 제외됩니다<br/>업로드 후 오류 내용을 확인하고, 해당 행을 수정해 다시 올려 주세요</p></section>
 </HoverGuide>;
}
