const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const baseDir = process.cwd();

const hospitalFile = path.join(
  baseDir,
  "data/hospital/1.병원정보서비스(2026.3.).xlsx"
);

const deptFile = path.join(
  baseDir,
  "data/hospital/5.의료기관별상세정보서비스_03_진료과목정보(2026.3.).xlsx"
);

const trafficFile = path.join(
  baseDir,
  "data/hospital/6.의료기관별상세정보서비스_04_교통정보(2026.3.).xlsx"
);

const outputFile = path.join(
  baseDir,
  "app/claim-docs/hospital-data.ts"
);

function readExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  return XLSX.utils.sheet_to_json(sheet, {
    defval: "",
  });
}

function getValue(row, names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== "") {
      return String(row[name]).trim();
    }
  }

  return "";
}

function normalizeType(typeName) {
  const name = String(typeName || "").trim();

  if (name.includes("상급")) return "상급종합병원";

  if (
    name.includes("종합병원") ||
    name.includes("요양병원") ||
    name.includes("정신병원") ||
    name.includes("치과병원") ||
    name.includes("한방병원") ||
    name === "병원"
  ) {
    return "종합병원";
  }

  if (
    name.includes("의원") ||
    name.includes("치과의원") ||
    name.includes("한의원")
  ) {
    return "의원";
  }

  return "기타";
}

function naverSearchUrl(name) {
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(
    name
  )}`;
}

const hospitals = readExcel(hospitalFile);
const departments = readExcel(deptFile);
const traffics = readExcel(trafficFile);

const deptMap = new Map();
const trafficMap = new Map();

departments.forEach((row) => {
  const key = getValue(row, [
    "암호화요양기호",
    "요양기호",
    "ykiho",
  ]);

  const dept = getValue(row, [
    "진료과목코드명",
    "진료과목명",
    "진료과목",
    "dgsbjtCdNm",
  ]);

  if (!key || !dept) return;

  if (!deptMap.has(key)) {
    deptMap.set(key, new Set());
  }

  deptMap.get(key).add(dept);
});

traffics.forEach((row) => {
  const key = getValue(row, [
    "암호화요양기호",
    "요양기호",
    "ykiho",
  ]);

  const traffic = [
    getValue(row, ["교통편명", "교통수단", "trnsitTyNm"]),
    getValue(row, ["노선번호", "lineNo"]),
    getValue(row, ["하차지점", "도착방법", "arivWay"]),
  ]
    .filter(Boolean)
    .join(" ");

  if (!key || !traffic) return;

  if (!trafficMap.has(key)) {
    trafficMap.set(key, new Set());
  }

  trafficMap.get(key).add(traffic);
});

const result = hospitals
  .map((row) => {
    const key = getValue(row, [
      "암호화요양기호",
      "요양기호",
      "ykiho",
    ]);

    const name = getValue(row, [
      "요양기관명",
      "병원명",
      "기관명",
      "yadmNm",
    ]);

    const originalType = getValue(row, [
      "종별코드명",
      "종별명",
      "종별",
      "의료기관종별",
      "요양기관종별",
      "clCdNm",
      "clCd",
    ]);

    const type = normalizeType(originalType);

    const sido = getValue(row, [
      "시도코드명",
      "시도명",
      "sidoCdNm",
    ]);

    const sigungu = getValue(row, [
      "시군구코드명",
      "시군구명",
      "sgguCdNm",
    ]);

    const dong = getValue(row, [
      "읍면동",
      "읍면동명",
      "emdongNm",
    ]);

    const address = getValue(row, [
      "주소",
      "addr",
    ]);

    const tel = getValue(row, [
      "전화번호",
      "telno",
    ]);

    const doctorCount = getValue(row, [
      "총의사수",
      "drTotCnt",
    ]);

    if (!key || !name || !address) return null;
    if (type === "기타") return null;

    const deptList = Array.from(deptMap.get(key) || []);
    const trafficList = Array.from(trafficMap.get(key) || []);

    return {
      type,
      originalType: originalType || type,
      name,
      sido,
      sigungu,
      dong,
      address,
      tel: tel || "-",
      doctorCount: doctorCount
        ? `${Number(doctorCount).toLocaleString()}명`
        : "-",
      departments: deptList.length ? deptList.join(", ") : "-",
      traffic: trafficList.length ? trafficList.join("\n") : "-",
      homepage: getValue(row, [
  "병원홈페이지",
  "홈페이지",
]) || naverSearchUrl(name),
    };
  })
  .filter(Boolean);

const fileContent = `export const hospitalData = ${JSON.stringify(
  result,
  null,
  2
)} as const;
`;

fs.writeFileSync(outputFile, fileContent, "utf8");

console.log(`hospital-data.ts 생성 완료: ${result.length}개`);
console.log(
  "상급종합병원:",
  result.filter((item) => item.type === "상급종합병원").length
);
console.log(
  "종합병원:",
  result.filter((item) => item.type === "종합병원").length
);
console.log(
  "의원:",
  result.filter((item) => item.type === "의원").length
);