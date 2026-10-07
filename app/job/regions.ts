const regions: [string, RegExp][] = [
  ["서울", /서울/], ["부산", /부산/], ["인천", /인천/], ["대구", /대구/],
  ["대전", /대전/], ["광주", /광주/], ["울산", /울산/], ["세종", /세종/],
  ["경기", /경기|수원|성남|고양|용인|부천|안양|안산|화성|평택|의정부|남양주|파주|김포|광명|시흥|군포|의왕|양주|오산|이천|포천|구리|과천|하남|여주|가평|양평|연천/],
  ["강원", /강원|춘천|원주|강릉|속초|동해|삼척|태백/],
  ["충북", /충북|충청북|청주|충주|제천/], ["충남", /충남|충청남|천안|아산|공주|보령|서산|논산|당진/],
  ["전북", /전북|전라북|전주|군산|익산|정읍|남원|김제/], ["전남", /전남|전라남|목포|여수|순천|나주|광양/],
  ["경북", /경북|경상북|포항|경주|구미|안동|김천|영주|영천|상주|문경|경산/],
  ["경남", /경남|경상남|창원|진주|김해|양산|거제|통영|사천|밀양/], ["제주", /제주|서귀포/],
];

export function regionsFor(value: string): string[] {
  const found = regions.filter(([, pattern]) => pattern.test(value)).map(([name]) => name);
  if (/경기(?:도)?\s*광주|광주(?:시)?\s*[,·/]?\s*경기/.test(value) && !value.includes("광주광역")) {
    return found.filter(name => name !== "광주");
  }
  return found;
}

export function availableRegions(values: string[]): string[] {
  const found = new Set(values.flatMap(regionsFor));
  return regions.map(([name]) => name).filter(name => found.has(name)).slice(0, 8);
}
