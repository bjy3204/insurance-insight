const fontData = new Map<string, Promise<string>>();

async function embeddedFonts(element: HTMLElement): Promise<string> {
  const used = new Set<string>();
  const nodes = [element, ...element.querySelectorAll("*")];
  for (const node of nodes) for (const family of getComputedStyle(node).fontFamily.split(",")) used.add(family.trim().replace(/["']/g, ""));
  const loaded = [...document.fonts].filter(face => face.status === "loaded" && used.has(face.family.replace(/["']/g, "")));
  if (!loaded.length) return "";
  const chars = [...new Set([...(element.textContent ?? "")].map(char => char.codePointAt(0)!))];
  const css: string[] = [];
  const visit = async (sheet: CSSStyleSheet): Promise<void> => {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.type === CSSRule.FONT_FACE_RULE) css.push(rule.cssText);
        else if (rule.type === CSSRule.IMPORT_RULE && (rule as CSSImportRule).styleSheet) await visit((rule as CSSImportRule).styleSheet!);
      }
    } catch {
      if (sheet.href) {
        const response = await fetch(sheet.href);
        if (!response.ok) throw new Error("안내장 폰트를 불러오지 못했습니다.");
        css.push(...((await response.text()).match(/@font-face\s*\{[^}]*\}/g) ?? []));
      }
    }
  };
  await Promise.all([...document.styleSheets].map(visit));
  const matches = css.filter(rule => {
    const family = rule.match(/font-family\s*:\s*([^;}]*)/)?.[1].trim().replace(/["']/g, "");
    if (!family || !loaded.some(face => face.family.replace(/["']/g, "") === family)) return false;
    const ranges = rule.match(/unicode-range\s*:\s*([^;}]*)/)?.[1];
    return !ranges || ranges.split(",").some(range => {
      const parts = range.trim().replace(/^U\+/i, "").split("-");
      const low = parseInt(parts[0].replace(/\?/g, "0"), 16);
      const high = parseInt((parts[1] ?? parts[0]).replace(/\?/g, "F"), 16);
      return chars.some(char => char >= low && char <= high);
    });
  });
  return (await Promise.all(matches.map(async rule => {
    const replacements = await Promise.all([...rule.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)].map(async match => {
      const url = new URL(match[1], location.href).href;
      if (!fontData.has(url)) fontData.set(url, fetch(url).then(async response => {
        if (!response.ok) throw new Error("안내장 폰트를 불러오지 못했습니다.");
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(blob); });
      }).catch(error => { fontData.delete(url); throw error; }));
      return [match[0], `url("${await fontData.get(url)}")`] as const;
    }));
    for (const [source, data] of replacements) rule = rule.replace(source, data);
    return rule;
  }))).join("\n");
}

// 배경 사진까지 포함해 브라우저가 표시한 글자와 간격을 PNG로 옮깁니다.
export async function captureNoticeImage(element: HTMLElement): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  const fonts = await embeddedFonts(element);
  const photos = [...element.querySelectorAll("img")];
  await Promise.all(photos.map(photo => photo.decode()));
  const clone = element.cloneNode(true) as HTMLElement;
  const sources = [element, ...element.querySelectorAll<HTMLElement | SVGElement>("*")];
  const targets = [clone, ...clone.querySelectorAll<HTMLElement | SVGElement>("*")];
  for (let index = 0; index < sources.length; index++) {
    const computed = getComputedStyle(sources[index]);
    const target = targets[index];
    for (const property of computed) target.style.setProperty(property, computed.getPropertyValue(property));
  }
  // 모바일에서도 배경 사진이 빠지지 않도록 사진은 PNG 캔버스에 직접 그립니다.
  const clonedPhotos = [...clone.querySelectorAll("img")];
  const backgroundLayers = photos.map((photo, index) => {
    const raster = document.createElement("canvas");
    raster.width = photo.naturalWidth; raster.height = photo.naturalHeight;
    const context = raster.getContext("2d");
    if (!context) throw new Error("배경 이미지를 준비하지 못했습니다.");
    context.drawImage(photo, 0, 0);
    clonedPhotos[index].remove();
    return raster;
  });
  Object.assign(clone.style, { transform: "none", position: "relative", left: "0", top: "0", margin: "0", width: "720px", height: "720px" });
  if (backgroundLayers.length) clone.style.background = "transparent";
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  if (fonts) { const style = document.createElement("style"); style.textContent = fonts; clone.prepend(style); }
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
  for (const background of backgroundLayers) context.drawImage(background, 0, 0, 1440, 1440);
  context.drawImage(image, 0, 0, 1440, 1440);
  return canvas;
}

export const captureClaimNotice = captureNoticeImage;
