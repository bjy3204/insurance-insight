export type MessageType =
  | "daily_check"
  | "morning"
  | "longtime"
  | "family_health"
  | "birthday"
  | "birth_congrats"
  | "marriage"
  | "moving"
  | "newyear_holiday"
  | "chuseok"
  | "childrens_day"
  | "parents_day"
  | "christmas"
  | "yearend"
  | "newyear"
  | "boknal"
  | "heatwave"
  | "rainy"
  | "storm"
  | "first_snow"
  | "dust"
  | "spring"
  | "summer"
  | "autumn"
  | "winter"
  | "travel"
  | "vacation_return"
  | "cancer_check"
  | "tax"
  | "policy_check"
  | "car_renewal"
  | "surgery"
  | "after_hospital"
  | "after_discharge"
 | "snow"
  | "season_change"
  | "after_accident";

export const MESSAGE_TYPES: { id: MessageType; label: string }[] = [
  { id: "daily_check", label: "일상" },
  { id: "morning", label: "아침 인사" },
  { id: "longtime", label: "오랜만" },
  { id: "family_health", label: "가족 건강" },
  { id: "birthday", label: "생일" },
  { id: "birth_congrats", label: "출산" },
  { id: "marriage", label: "결혼" },
  { id: "moving", label: "이사" },
  { id: "newyear_holiday", label: "설날" },
  { id: "chuseok", label: "추석" },
  { id: "christmas", label: "크리스마스" },
  { id: "yearend", label: "연말" },
  { id: "newyear", label: "새해" },
  { id: "boknal", label: "복날" },
  { id: "heatwave", label: "폭염" },
  { id: "rainy", label: "장마" },
  { id: "storm", label: "태풍" },
  { id: "snow", label: "폭설" },
{ id: "season_change", label: "환절기" },
  { id: "first_snow", label: "첫눈" },
  { id: "dust", label: "미세먼지" },
  { id: "spring", label: "봄" },
  { id: "summer", label: "여름" },
  { id: "autumn", label: "가을" },
  { id: "winter", label: "겨울" },
  { id: "travel", label: "휴가" },
  { id: "vacation_return", label: "휴가 복귀" },
  { id: "cancer_check", label: "암검진" },
  { id: "tax", label: "독감" },
  { id: "policy_check", label: "증권 정리" },
  { id: "car_renewal", label: "자동차 갱신" },
  { id: "surgery", label: "수술" },
  { id: "after_hospital", label: "입원" },
  { id: "after_discharge", label: "퇴원" },
  { id: "after_accident", label: "사고" },
];

