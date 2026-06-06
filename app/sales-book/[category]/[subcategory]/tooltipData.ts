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
    tooltipX?: string;
    tooltipY?: string;
    shape?: "square" | "pill";
  }[]
> = {
  // 10페이지
  9: [
    {
      x: 36.5,
      y: 80,
      w: 7.5,
      h: 5.3,
      type: "image",
      shape: "square",
      image: "/sales-book/운전자보험/설명/기소.png",
      tooltipX: "left-[39.2%] -translate-x-[50%]",
      tooltipY: "bottom-[29]",
    },
    {
      x: 65.34,
      y: 56,
      w: 7.65,
      h: 6,
      type: "image",
      shape: "square",
      image: "/sales-book/운전자보험/설명/기소.png",
      tooltipX: "left-[69%] -translate-x-[48%]",
      tooltipY: "top-[61.8%]",
    },
    {
      x: 57.16,
      y: 56,
      w: 7.65,
      h: 6,
      type: "image",
      shape: "square",
      image: "/sales-book/운전자보험/설명/불기소.png",
      tooltipX: "left-[61%] -translate-x-[50%]",
      tooltipY: "top-[61.8%]",
    },
    {
      x: 73.56,
      y: 56,
      w: 7.65,
      h: 6,
      type: "image",
      shape: "square",
      image: "/sales-book/운전자보험/설명/약식기소.png",
      tooltipX: "left-[77%] -translate-x-[48%]",
      tooltipY: "top-[61.8%]",
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
};