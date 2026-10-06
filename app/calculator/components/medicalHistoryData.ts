// 첨부된 두 자료의 표를 전사한 데이터. 계산 로직과는 별도로 관리합니다.
export type HistoryCell = { text: string; span?: number; rowSpan?: number };
export type HistoryRow = { section?: string; label: string; cells: HistoryCell[]; note?: string; noteRowSpan?: number };
const cell = (text: string, span = 1, rowSpan = 1): HistoryCell => ({ text, span, rowSpan });
const repeat = (text: string, count: number) => Array.from({ length: count }, () => cell(text));
export const historyColumns = [
  { generation: '1세대', subtitle: '표준화 이전', period: '~0504' },
  { generation: '1세대', subtitle: '표준화 이전', period: '0505 ~ 0903' },
  { generation: '1세대', subtitle: '표준화 이전', period: '0904~0907' },
  { generation: '2세대', subtitle: '표준화', period: '0908~1303' },
  { generation: '2세대', subtitle: '1차개정', period: '1304~1508' },
  { generation: '2세대', subtitle: '2차개정', period: '1509~1512' },
  { generation: '2세대', subtitle: '3차개정', period: '1601~1703' },
  { generation: '3세대', subtitle: '착한실손\n(1804부터 단독)', period: '1704~2106' },
  { generation: '4세대', subtitle: '비급여할증제', period: '2107~2603' },
  { generation: '5세대', subtitle: '비급여 중증/비중증', period: '2604~' },
];
export const medicalHistoryRows: HistoryRow[] = [
  { section: '공통사항', label: '판매시기', cells: historyColumns.map(c => cell(c.period)) },
  { section: '공통사항', label: '담보구성', cells: [cell('상해입원, 상해통원, 질병입원,\n질병통원, 일반상해의료비', 3), cell('상해입원, 상해통원, 질병입원, 질병통원', 5), cell('상해급여, 상해비급여,\n질병급여, 질병비급여'), cell('상해급여, 질병급여\n상해비급여(중증/비중증)\n질병비급여(중증/비중증)')] },
  { section: '공통사항', label: '가입금액', cells: [cell('입원:3천,5천,1억 (0809부터)\n통원:10~30만', 3), cell('입원 : 5천\n통원 30만(25만/5만,20만/10만)', 5), cell('급여,비급여 각 5천\n(통원 회당 20만 포함)'), cell('급여, 비급여 각 5천\n(통원 회당 20만 포함)\n*비급여 비중증 1천\n(통원 일당 20만 포함)')] },
  { section: '공통사항', label: '보장기간', cells: [cell('사고일로부터 365일\n(통원30회한, 일반상해의료비 180일)', 3), cell('입원 : 입원일부터 365일\n통원 : 계약일기준 연간 180회', 3), cell('입원 : 가입금액 소진시까지\n입원가능, 기간 무관\n통원 : 계약일기준 연간 180회', 2), cell('계약일 기준\n매년 가입금액 한도', 2)] },
  { section: '공통사항', label: '면책기간', cells: [cell('상해 : 재보장 없음\n질병 : 180일', 3), cell('입원 : 90일 면책기간 경과 후 재 보장\n(1404부터 퇴원후 180일 지나면 다시 365일)', 3), cell('입원기간 275일 이상시 90일 면책\n입원기간 275일 미만시 365일까지 면책', 2), cell('한도 소진시 다음 계약일', 2)] },
  { section: '공통사항', label: '만기/갱신주기', cells: [cell('80세 / 5년 (0809부터100세)', 3), cell('3년'), cell('(1년갱신 15년만기) - 만기시 재가입의사 필수', 4), cell('1년갱신 5년만기', 2)] },
  { section: '입원', label: '보상비율', cells: [cell('100%', 3), cell('90%'), cell('표준형 80%\n선택형 90%'), cell('표준형 : 80%\n선택형Ⅱ: 급여90% / 비급여80%', 2), cell('표준형 :\n급여80% / 비급여80%\n선택형Ⅱ:\n급여90% / 비급여80%'), cell('급여 80%,\n비급여 70%'), cell('급여 80% / 비급여\n(중증 70%/비중증 50%)\n* 비중증 병·의원 회당 300만원')] },
  { section: '입원', label: '본인부담한도', cells: [cell('-', 3), cell('200만원', 5), cell('급여 200만원'), cell('급여 200만원\n비급여(중증) 종합/상급종합\n500만원')] },
  { section: '통원', label: '외래공제', cells: [cell('5천원', 2, 2), cell('5천원/1만원', 1, 2), cell('1만,1.5만,2만원\n중 공제'), cell('표준형 : MAX\n(1,1.5,2만 OR 20%)\n선택형:1만~2만'), cell('표준형: MAX(1,1.5,2만OR 20%)\n선택형: MAX (1,1.5,2만OR 급여10%, 비급여20%)', 3), cell('외래+처방 합산적용\n급여 : MAX (1~2만 OR 20%)\n비급여: MAX (3만 OR 30%)', 1, 2), cell('급여 : MAX(건보본인부담률,\n20%, 1~2만원)\n비급여 (중증) :\nMAX (30%, 3만)\n비급여 (비중증) :\nMAX (50%, 5만)', 1, 2)] },
  { section: '통원', label: '처방조제비 공제', cells: [cell('8천원 공제'), cell('표준형 : MAX\n(8천원OR20%)\n선택형 :8천원'), cell('표준형: MAX(1,1.5,2만OR 20%)\n선택형: MAX (1,1.5,2만OR 급여10%, 비급여20%)', 3)] },
  { label: '3대비급여\n*도수/증식치료/체외충격파\n350만(50회), 주사제 250만\n(50회), MRI/MRA 300만', cells: [cell('부책', 7), cell('공제 :\nMAX (2만 OR 30%)'), cell('공제 :\nMAX (3만 OR 30%)'), cell('공제 : MAX (3만 OR 30%)\n*면책: (비중증 비급여) 근골격계\n이학요법, 체외충격파치료,주사제')] },
];
const covered = 'O [급여]';
export const exemptionColumns = historyColumns.map((c, i) => ({ ...c,
  subtitle: i === 7 ? '新실손\n(착한실손)(1804부터 단독)' : i === 9 ? '중증/비중증' : c.subtitle,
  period: ['~0504', '0505~', '0904~0907', '0908~', '1304~1508', '1509~', '1601~', '1704~2106', '2107~2603', '2604~'][i],
}));
export const exemptionHistoryRows: HistoryRow[] = [
  { label: '질병구분', cells: exemptionColumns.map(c => cell(c.period)) },
  { section: '한방', label: '입원', cells: [...repeat('O', 3), ...repeat(covered, 7)], note: '보신용한약재 면책' },
  { section: '한방', label: '통원', cells: [...repeat('X', 3), ...repeat(covered, 7)], note: '1세대 한방통원치료 면책' },
  { section: '치과치료', label: '치과치료(상해)', cells: [...repeat('O', 3), ...repeat(covered, 7)], noteRowSpan: 2, note: '안면골절시 비급여 보상(치과치료제외)\n구강, 혀, 턱의 질환(K09~K14)보상\n(1601 명확화)\n씹는장애, 발음장애 없는 턱관절질환 제외' },
  { section: '치과치료', label: '치주질환\n(입원+통원)(K00~K08)', cells: [...repeat('X', 3), ...repeat(covered, 7)] },
  { label: '디스크,신경계질환(질병)', cells: [cell('X'), ...repeat('O', 9)], note: '※ 대상포진후신경통(G53) 포함' },
  { section: '정신질환', label: '치매 (F00~F03)', cells: [cell('O'), cell('X'), ...repeat('O', 8)] },
  { section: '정신질환', label: '정신질환(F04~F99)', cells: [...repeat('X', 6), cell('▲ 일부 정신질환 : 조현병, 공황장애, 틱장애, 비기질적수면장애, 조울증, 우울증,\n주의력행동결핍장애 등 - [급여] 보상', 4)], note: '1601 신규가입(1901 수면장애 추가보장)' },
  { label: '선천성기형, 변형 및 염색체 이상\n(뇌질환제외)', cells: [cell('X'), ...repeat('O', 9)], note: '0505이전:Q00~Q99 면책\n0505이후: 선천성뇌질환(Q00~Q04)면책' },
  { label: '선천성 뇌질환 (Q00~Q04)(급여)', cells: [...repeat('X', 8), ...repeat(covered, 2)], note: '태아가입시(출생후가입자는 면책)' },
  { label: '직장 또는 항문질환', cells: [...repeat('X', 3), ...repeat(covered, 7)], note: '치질(I84, K60~K62, K64) 면책' },
  { label: '임신·출산관련', cells: [...repeat('X', 9), cell(covered)] },
  { section: '비뇨기', label: '요실금', cells: repeat('X', 10), note: '질병코드 : N39.3, N39.4, R32' },
  { section: '비뇨기', label: '요로감염', cells: [...repeat('X', 3), ...repeat('O', 7)] },
  { section: '안과', label: '안검하수/안검내반', cells: [...repeat('O', 6), cell('O[단, 성형외과 수술면책,비급여수술주의!]', 2), ...repeat('O', 2)] },
  { section: '안과', label: '백내장 (비급여)', cells: [...repeat('O', 6), ...repeat('X', 4)], note: '1601 신규 가입건\n(비급여수술,비급여재료대 면책)' },
  { label: '자동차/산재 본인부담금', cells: [cell('40% 보상', 3), ...repeat('40%', 3), cell('급여 90% 비급여 80%', 2), ...repeat('급여 80% 비급여 70%', 2)], note: '1601 신규 가입건' },
  { label: '건강검진관련비용', cells: [...repeat('X', 3), ...repeat('O', 7)], note: '이상소견에 따른 추가검사, 치료비용' },
  { label: '해외병원 치료비', cells: [cell('40% 보상', 3), cell('면책', 7)], note: '(1910) 3개월이상 장기체류시\n사후환급, 납입중지신청' },
  { label: '천재지변, 핵연료, 방사능', cells: [...repeat('X', 3), cell('O*'), ...repeat('O', 6)], note: '*1004(가입)부터 약관변경' },
  { label: '수면무호흡증, 편두통, 뇌전증', cells: [cell('X'), ...repeat('O', 9)], note: '신경계질환 코드면책' },
  { label: '선천성 비신생물성 모반 (Q82.5)', cells: [...repeat('X', 6), cell('▲ 태아 가입자 부책', 4)], note: '1601 명확화(표준화 이후 가입건)' },
  { label: '하지정맥류레이저수술', cells: [...repeat('O', 6), cell('▲'), ...repeat('O', 3)], note: '1601 신규가입자 비급여수술 면책이나\n치료의 목적이면 서류 심사 후 보상 가능' },
  { label: '습관성유산, 불임, 인공수정\n합병증 (급여)', cells: [...repeat('X', 8), ...repeat('O[급여] 전액본인부담제외', 2)], note: '실손가입 2년 이후 보장' },
  { label: '여드름 피부질환(급여)', cells: [...repeat('X', 8), ...repeat(covered, 2)], note: '여드름의 심한 피부염등 (급여)' },
  { label: '비응급환자의응급실이용료', cells: [...repeat('O', 6), ...repeat('X', 4)], note: '상급종합병원, 권역응급센터 해당' },
  { label: '성장호르몬치료', cells: [...repeat('O', 6), cell(covered, 2), ...repeat('O[급여] 전액본인부담제외', 2)], note: '1601 명확화' },
  { label: '중증도여성형유방증 (지방흡입)\n장기이식수술 기증자수술비보장', cells: [...repeat('X', 3), ...repeat('O', 7)], note: '1901 명확화\n표준화 이후 가입건 적용' },
];
