export const tooltipData: Record<
  number,
  {
    x: number;
    y: number;
    w: number;
    h: number;
    type?: "image" | "text";
    image?: string;
    text?: string;
    image2?: string;
tooltipX2?: string;
tooltipY2?: string;
tooltipWidth2?: string;
    tooltipX?: string;
    tooltipY?: string;
    shape?: "square" | "pill";
    borderless?: boolean;
    tooltipWidth?: string;
    highlight?: boolean;
  }[]
> = {
  // 10페이지
  9: [
    {
      x: 34.65,
      y: 81.5,
      w: 5.25,
      h: 5.1,
      type: "image",
      shape: "square",
      image: "/sales-book/운전자보험/설명/기소.png",
      tooltipX: "left-[37.2%] -translate-x-[50%]",
      tooltipY: "bottom-[15]",
    },
    {
      x: 67,
      y: 73.8,
      w: 8,
      h: 4.8,
      type: "image",
      shape: "square",
      image: "/sales-book/운전자보험/설명/기소.png",
      tooltipX: "left-[70.5%] -translate-x-[48%]",
      tooltipY: "top-[79%]",
    },
    {
      x: 58.3,
      y: 73.8,
      w: 8,
      h: 4.8,
      type: "image",
      shape: "square",
      image: "/sales-book/운전자보험/설명/불기소.png",
      tooltipX: "left-[62%] -translate-x-[50%]",
      tooltipY: "top-[79%]",
    },
    {
      x: 75.4,
      y: 73.8,
      w: 8,
      h: 4.8,
      type: "image",
      shape: "square",
      image: "/sales-book/운전자보험/설명/약식기소.png",
      tooltipX: "left-[79.2%] -translate-x-[48%]",
      tooltipY: "top-[79%]",
    },
   {
  x: 66.9,
  y: 81.5,
  w: 16.5,
  h: 5,
  type: "image",
  shape: "square",

  image: "/sales-book/운전자보험/설명/재판결과.png",
  tooltipX: "left-[75%] -translate-x-[50%]",
  tooltipY: "top-[86.7%]",
  tooltipWidth: "!w-[400px]",

  image2: "/sales-book/운전자보험/설명/판결.png",
  tooltipX2: "left-[75.2%] -translate-x-[50%]",
  tooltipY2: "top-[82.1%]",
  tooltipWidth2: "!w-[210px]",

  borderless: true,
},
  ],
  

  // 14페이지
  13: [
    {
      x: 57,
      y: 37,
      w: 31,
      h: 8,
      type: "text",
      shape: "pill",
      text: "교통사고로 인한 타인의 사망 또는 상해를 보상",
      tooltipX: "left-[72%] -translate-x-1/2",
      tooltipY: "top-[45.3%]",
    },
    {
      x: 57,
      y: 48,
      w: 31,
      h: 8,
      type: "text",
      shape: "pill",
      text: "교통사고로 타인의 차량과 재물의 손해를 보상",
      tooltipX: "left-[72%] -translate-x-1/2",
      tooltipY: "top-[55.8%]",
    },
    {
      x: 57,
      y: 58,
      w: 31,
      h: 8,
      type: "text",
      shape: "pill",
      text: "피보험자동차에 직접적으로 생긴 손해를 보상",
      tooltipX: "left-[72%] -translate-x-1/2",
      tooltipY: "top-[66.5%]",
    },
    {
      x: 57,
      y: 69,
      w: 31,
      h: 8,
      type: "text",
      shape: "pill",
      text: "교통사고로 인한 본인 또는 동승자의 사망 또는 상해를 보상",
      tooltipX: "left-[72%] -translate-x-1/2",
      tooltipY: "top-[77%]",
    },
    {
      x: 57,
      y: 80,
      w: 31,
      h: 8,
      type: "text",
      shape: "pill",
      text: "무보험차·뺑소니로 인한 사망 또는 상해를 보상",
      tooltipX: "left-[72%] -translate-x-1/2",
      tooltipY: "top-[87.65%]",
    },
  ],

  // 15페이지
  14: [
    {
      x: 57,
      y: 37,
      w: 31,
      h: 8,
      type: "text",
      shape: "pill",
      text: "자동차사고로 구속 또는 공소제기 시 변호사선임비용 보장",
      tooltipX: "left-[72%] -translate-x-1/2",
      tooltipY: "top-[45.3%]",
    },
    {
      x: 57,
      y: 48,
      w: 31,
      h: 8,
      type: "text",
      shape: "pill",
      text: "피해자에게 지급한 형사합의금을 위한 교통사고처리지원금 보장",
      tooltipX: "left-[72%] -translate-x-1/2",
      tooltipY: "top-[55.8%]",
    },
    {
      x: 57,
      y: 58,
      w: 31,
      h: 8,
      type: "text",
      shape: "pill",
      text: "자동차사고로 타인의 신체에 피해를 입혀 벌금형이 확정된 경우 보장",
      tooltipX: "left-[72%] -translate-x-1/2",
      tooltipY: "top-[66.5%]",
    },
    {
      x: 57,
      y: 69,
      w: 31,
      h: 8,
      type: "text",
      shape: "pill",
      text: "자동차사고로 타인의 재물에 피해를 입혀 벌금형이 확정된 경우 보장",
      tooltipX: "left-[72%] -translate-x-1/2",
      tooltipY: "top-[77%]",
    },
    {
      x: 57,
      y: 80,
      w: 31,
      h: 8,
      type: "text",
      shape: "pill",
      text: "자동차사고로 인한 본인의 부상 치료비를 보장",
      tooltipX: "left-[72%] -translate-x-1/2",
      tooltipY: "top-[87.65%]",
    },
  ],

  // 17페이지
16: [
 {
    x: 7,
    y: 65.33,
    w: 8.5,
    h: 3.45,
    type: "image",
    shape: "square",
    image: "/sales-book/운전자보험/설명/교통사고발생.png",
    tooltipX: "left-[11.3%] -translate-x-[50%]",
    tooltipY: "top-[69.12%]",
    tooltipWidth: "!w-[250px]",
  },
  {
    x: 23.2,
    y: 52.8,
    w: 7.3,
    h: 3.4,
    type: "image",
    shape: "square",
    image: "/sales-book/운전자보험/설명/피해자배상.png",
    tooltipX: "left-[27%] -translate-x-[50%]",
    tooltipY: "top-[56.5%]",
    tooltipWidth: "!w-[250px]",
  },
  {
    x: 39.45,
    y: 77.5,
    w: 5.7,
    h: 3.25,
    type: "image",
    shape: "square",
    image: "/sales-book/운전자보험/설명/형사입건.png",
    tooltipX: "left-[42.5%] -translate-x-[50%]",
    tooltipY: "top-[81.2%]",
    tooltipWidth: "!w-[250px]",
  },
  {
    x: 53.2,
    y: 57.2,
    w: 5.7,
    h: 3.27,
    type: "image",
    shape: "square",
    image: "/sales-book/운전자보험/설명/형사합의.png",
    tooltipX: "left-[56.3%] -translate-x-[50%]",
    tooltipY: "top-[60.9%]",
    tooltipWidth: "!w-[250px]",
  },
  {
    x: 69.7,
    y: 81.2,
    w: 7.5,
    h: 3.3,
    type: "image",
    shape: "square",
    image: "/sales-book/운전자보험/설명/변호사선임.png",
    tooltipX: "left-[73.4%] -translate-x-[50%]",
    tooltipY: "top-[84.9%]",
    tooltipWidth: "!w-[250px]",
  },
   {
    x: 86.5,
    y: 69.2,
    w: 5.7,
    h: 3.3,
    type: "image",
    shape: "square",
    image: "/sales-book/운전자보험/설명/정식재판.png",
    tooltipX: "left-[89.5%] -translate-x-[50%]",
    tooltipY: "top-[72.85%]",
    tooltipWidth: "!w-[250px]",
  },
],
};