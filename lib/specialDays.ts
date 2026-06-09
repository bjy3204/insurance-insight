import KoreanLunarCalendar from "korean-lunar-calendar";

export type SpecialDay = {
  label: string;
  type: "holiday" | "season" | "anniversary";
  emoji: string;
};

export function getTodaySpecialDays(date: Date): SpecialDay[] {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const results: SpecialDay[] = [];

  const holidays: Record<string, SpecialDay> = {
"1-1": { label: "신정", type: "anniversary", emoji: "🎍" },

"3-1": { label: "삼일절", type: "anniversary", emoji: "🇰🇷" },
"5-5": { label: "어린이날", type: "anniversary", emoji: "🎈" },
"6-6": { label: "현충일", type: "anniversary", emoji: "🇰🇷" },
"8-15": { label: "광복절", type: "anniversary", emoji: "🇰🇷" },
"10-3": { label: "개천절", type: "anniversary", emoji: "☀️" },
"10-9": { label: "한글날", type: "anniversary", emoji: "📝" },
"12-25": { label: "크리스마스", type: "anniversary", emoji: "🎄" },
  };

  const lunarDays: Record<string, SpecialDay> = {};

const addLunarDay = (
  lunarMonth: number,
  lunarDay: number,
  label: string,
  emoji: string
) => {
  const calendar = new KoreanLunarCalendar();

  calendar.setLunarDate(
    year,
    lunarMonth,
    lunarDay,
    false
  );

  const solar = calendar.getSolarCalendar();

  lunarDays[`${solar.month}-${solar.day}`] = {
    label,
    type: "anniversary",
    emoji,
  };
};

addLunarDay(1, 1, "설날", "🧧");
addLunarDay(1, 15, "정월대보름", "🌕");
addLunarDay(4, 8, "부처님오신날", "🪷");
addLunarDay(5, 5, "단오", "🎏");
addLunarDay(7, 7, "칠석", "⭐");
addLunarDay(7, 15, "백중", "🌾");
addLunarDay(8, 15, "추석", "🌕");
addLunarDay(9, 9, "중양절", "🍁");

const addSolarDay = (month: number, day: number, label: string, emoji: string) => {
  lunarDays[`${month}-${day}`] = {
    label,
    type: "anniversary",
    emoji,
  };
};

const isGengDay = (target: Date) => {
  const base = new Date(1970, 0, 1);
  const diff = Math.floor((target.getTime() - base.getTime()) / 86400000);
  return diff % 10 === 9;
};

const getBokDays = (year: number) => {
  const gengDaysAfterHaji: Date[] = [];

  let d = new Date(year, 5, 21); // 하지 기준 6월 21일

  while (gengDaysAfterHaji.length < 4) {
    if (isGengDay(d)) gengDaysAfterHaji.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  let malbok = new Date(year, 7, 7); // 입추 기준 8월 7일

  while (!isGengDay(malbok)) {
    malbok.setDate(malbok.getDate() + 1);
  }

  return {
    chobok: gengDaysAfterHaji[2],
    jungbok: gengDaysAfterHaji[3],
    malbok,
  };
};

const bok = getBokDays(year);



addSolarDay(bok.chobok.getMonth() + 1, bok.chobok.getDate(), "초복", "☀️🐔");
addSolarDay(bok.jungbok.getMonth() + 1, bok.jungbok.getDate(), "중복", "☀️🐔");
addSolarDay(bok.malbok.getMonth() + 1, bok.malbok.getDate(), "말복", "☀️🐔");


  const key = `${month}-${day}`;
  if (holidays[key]) results.push(holidays[key]);

  const seasons: Record<string, SpecialDay> = {
    "1-5": { label: "소한", type: "season", emoji: "❄️" },
    "1-20": { label: "대한", type: "season", emoji: "❄️" },
    "2-4": { label: "입춘", type: "season", emoji: "🌱" },
    "2-19": { label: "우수", type: "season", emoji: "🌧️" },
    "3-6": { label: "경칩", type: "season", emoji: "🐸" },
    "3-21": { label: "춘분", type: "season", emoji: "🌸" },
    "4-5": { label: "청명", type: "season", emoji: "🌤️" },
    "4-20": { label: "곡우", type: "season", emoji: "🌧️" },
    "5-6": { label: "입하", type: "season", emoji: "☀️" },
    "5-21": { label: "소만", type: "season", emoji: "🌿" },
    "6-6": { label: "망종", type: "season", emoji: "🌾" },
    "6-21": { label: "하지", type: "season", emoji: "☀️" },
    "7-7": { label: "소서", type: "season", emoji: "🌊" },
    "7-23": { label: "대서", type: "season", emoji: "🔥" },
    "8-7": { label: "입추", type: "season", emoji: "🍂" },
    "8-23": { label: "처서", type: "season", emoji: "🌬️" },
    "9-8": { label: "백로", type: "season", emoji: "🌫️" },
    "9-23": { label: "추분", type: "season", emoji: "🍁" },
    "10-8": { label: "한로", type: "season", emoji: "🍂" },
    "10-23": { label: "상강", type: "season", emoji: "🌨️" },
    "11-7": { label: "입동", type: "season", emoji: "🍃" },
    "11-22": { label: "소설", type: "season", emoji: "❄️" },
    "12-7": { label: "대설", type: "season", emoji: "⛄" },
    "12-22": { label: "동지", type: "season", emoji: "🌙" },
  };

  if (seasons[key]) results.push(seasons[key]);

const anniversaries: Record<string, SpecialDay> = {
 
  "1-14": { label: "다이어리데이", type: "anniversary", emoji: "📔" },
  "1-27": { label: "초콜릿케이크데이", type: "anniversary", emoji: "🍰" },

  "2-2": { label: "세계습지의날", type: "anniversary", emoji: "🌿" },
  "2-14": { label: "발렌타인데이", type: "anniversary", emoji: "🍫" },
  "2-22": { label: "고양이의날", type: "anniversary", emoji: "🐈‍⬛" },

 
  "3-3": { label: "삼겹살데이", type: "anniversary", emoji: "🥓" },
  "3-7": { label: "참치데이", type: "anniversary", emoji: "🐟" },
  "3-8": { label: "세계여성의날", type: "anniversary", emoji: "👧🏻" },
  "3-14": { label: "화이트데이", type: "anniversary", emoji: "🍬" },
  "3-15": { label: "3·15의거기념일", type: "anniversary", emoji: "🇰🇷"},
  "3-22": { label: "세계물의날", type: "anniversary", emoji: "💧" },
  "3-23": { label: "세계기상의날", type: "anniversary", emoji: "☁️" },
  "3-24": { label: "결핵예방의 날", type: "anniversary", emoji: "😷" },

  "4-1": { label: "만우절", type: "anniversary", emoji: "🤡" },
  "4-2": { label: "세계자폐인의날", type: "anniversary", emoji: "💙" },
  "4-5": { label: "식목일", type: "anniversary", emoji: "🌳" },
  "4-7": { label: "보건의 날", type: "anniversary", emoji: "🏥" },
  "4-11": { label: "대한민국임시정부수립일", type: "anniversary", emoji: "🇰🇷" },
  "4-14": { label: "블랙데이", type: "anniversary", emoji: "🍜" },
  "4-19": { label: "4·19혁명기념일", type: "anniversary", emoji: "🇰🇷" },
  "4-20": { label: "장애인의 날", type: "anniversary", emoji: "♿" },
  "4-21": { label: "과학의날", type: "anniversary", emoji: "👨🏻‍🔬" },
  "4-22": { label: "지구의날", type: "anniversary", emoji: "🌎" },
  "4-25": { label: "법의날", type: "anniversary", emoji: "⚖️" },

  "5-1": { label: "근로자의 날", type: "anniversary", emoji: "👩🏻‍💻" },
  "5-2": { label: "오리데이", type: "anniversary", emoji: "🦆" },
  "5-8": { label: "어버이날", type: "anniversary", emoji: "💐" },
  "5-10": { label: "유권자의날", type: "anniversary", emoji: "🗳️" },
  "5-11": { label: "입양의날", type: "anniversary", emoji: "🤱🏻" },
  "5-14": { label: "로즈데이", type: "anniversary", emoji: "🌹" },
  "5-15": { label: "스승의날", type: "anniversary", emoji: "👩🏻‍🏫" },
  "5-18": { label: "5·18민주화운동기념일", type: "anniversary", emoji: "🇰🇷" },
  "5-19": { label: "발명의날", type: "anniversary", emoji: "🔬" },
  "5-20": { label: "세계인의날", type: "anniversary", emoji: "👥" },
  "5-21": { label: "부부의날", type: "anniversary", emoji: "💑" },
  "5-31": { label: "바다의날", type: "anniversary", emoji: "🌊" },

  "6-1": { label: "의병의날", type: "anniversary", emoji: "🌿" },
  "6-5": { label: "환경의날", type: "anniversary", emoji: "🌱" },
  "6-6": { label: "고기데이", type: "anniversary", emoji: "🥩" },
  "6-10": { label: "6·10만세운동기념일", type: "anniversary", emoji: "🇰🇷" },
  "6-14": { label: "키스데이", type: "anniversary", emoji: "😘" },
  "6-25": { label: "6·25전쟁기념일", type: "anniversary", emoji: "🇰🇷" },
  "6-28": { label: "철도의 날", type: "anniversary", emoji: "🚆" },  

  "7-9": { label: "친구데이", type: "anniversary", emoji: "🧑‍🤝‍🧑" },
  "7-11": { label: "인구의날", type: "anniversary", emoji: "👨‍👩‍👧‍👦" },
  "7-14": { label: "실버데이", type: "anniversary", emoji: "👨‍👩💍" },
  "7-17": { label: "제헌절", type: "anniversary", emoji: "📜" },
  "7-27": { label: "유엔군참전의날", type: "anniversary", emoji: "🕊️" },

  "8-8": { label: "세계고양이의날", type: "anniversary", emoji: "😺"},
  "8-14": { label: "뮤직데이", type: "anniversary", emoji: "🎵" }, 
  "8-22": { label: "에너지의날", type: "anniversary", emoji: "⚡" },

  "9-2": { label: "구이데이", type: "anniversary", emoji: "🍖" },
  "9-4": { label: "태권도의날", type: "anniversary", emoji: "🥋" },
  "9-7": { label: "사회복지의날", type: "anniversary", emoji: "🏙️" },
  "9-9": { label: "구구데이", type: "anniversary", emoji: "🐔" },
  "9-14": { label: "포토데이", type: "anniversary", emoji: "📷" },
  "9-10": { label: "세계자살예방의날", type: "anniversary", emoji: "❤️‍🩹" },
  "9-17": { label: "고백데이", type: "anniversary", emoji: "💝" },
  "9-21": { label: "치매극복의날", type: "anniversary", emoji: "🧓🏻" }, 
  "9-28": { label: "세계광견병의날", type: "anniversary", emoji: "🐕" },

  "10-1": { label: "국군의날", type: "anniversary", emoji: "🪖" },
  "10-2": { label: "노인의날", type: "anniversary", emoji: "👴🏻" },
  "10-5": { label: "세계한인의날", type: "anniversary", emoji: "🇰🇷"  },
  "10-8": { label: "재향군인의날", type: "anniversary", emoji: "🪖" },
  "10-10": { label: "임산부의날", type: "anniversary", emoji: "🤰🏻" },
  "10-14": { label: "와인데이", type: "anniversary", emoji: "🍷" },
  "10-15": { label: "세계손씻기의날", type: "anniversary", emoji: "🧼" },
  "10-16": { label: "세계식량의날", type: "anniversary", emoji: "🌾" },
  "10-21": { label: "경찰의날", type: "anniversary", emoji: "🚔" },
  "10-24": { label: "사과데이", type: "anniversary", emoji: "🍎" },
  "10-29": { label: "지방자치의날", type: "anniversary", emoji: "🏘️" },
  "10-31": { label: "할로윈데이", type: "anniversary", emoji: "👻" },

  "11-9": { label: "소방의날", type: "anniversary", emoji: "🚒" },
  "11-11": { label: "빼빼로데이 · 농업인의날", type: "anniversary", emoji: "🍫🌾" },
  "11-14": { label: "무비 데이", type: "anniversary", emoji: "🎞️" },
  "11-17": { label: "순국선열의날", type: "anniversary", emoji: "🇰🇷" },

  "12-5": { label: "자원봉사자의날", type: "anniversary", emoji: "🙋" },
  "12-14": { label: "허그데이", type: "anniversary", emoji: "🫂" },
  "12-31": { label: "한해 마지막날", type: "anniversary", emoji: "🎆" },
};

if (anniversaries[key]) results.push(anniversaries[key]);
if (lunarDays[key]) results.push(lunarDays[key]);

return results;
}