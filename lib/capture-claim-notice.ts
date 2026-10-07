// 청구 안내장은 이미지 없이 HTML과 SVG로 구성되어 있어 브라우저가 그린
// 글자와 줄 간격을 그대로 SVG foreignObject를 통해 PNG로 옮길 수 있습니다.
export async function captureClaimNotice(element: HTMLElement): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  const clone = element.cloneNode(true) as HTMLElement;
  const sources = [element, ...element.querySelectorAll<HTMLElement | SVGElement>("*")];
  const targets = [clone, ...clone.querySelectorAll<HTMLElement | SVGElement>("*")];
  for (let index = 0; index < sources.length; index++) {
    const computed = getComputedStyle(sources[index]);
    const target = targets[index];
    for (const property of computed) target.style.setProperty(property, computed.getPropertyValue(property));
  }
  Object.assign(clone.style, { transform: "none", position: "relative", left: "0", top: "0", margin: "0", width: "720px", height: "720px" });
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  const markup = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720"><foreignObject width="720" height="720">${markup}</foreignObject></svg>`;
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("안내장 이미지를 준비하지 못했습니다."));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 1440; canvas.height = 1440;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("안내장 이미지를 저장하지 못했습니다.");
  context.drawImage(image, 0, 0, 1440, 1440);
  return canvas;
}
