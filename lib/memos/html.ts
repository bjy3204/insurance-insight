import { escapeMemoText } from "./model";

// Rich memo HTML is treated as untrusted, including data loaded from the server.
export function sanitizeMemoHtml(html: string): string {
  if (typeof DOMParser === "undefined") return escapeMemoText(html);
  const document = new DOMParser().parseFromString(html, "text/html");
  const allowed = new Set(["P", "DIV", "SPAN", "STRONG", "B", "U", "EM", "I", "BR", "UL", "OL", "LI", "S"]);
  for (const element of Array.from(document.body.querySelectorAll("*"))) {
    if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "SVG", "MATH", "IMG"].includes(element.tagName)) { element.remove(); continue; }
    if (!allowed.has(element.tagName)) { element.replaceWith(...Array.from(element.childNodes)); continue; }
    const color = (element as HTMLElement).style.color;
    const classes = element.className.split(/\s+/).filter(name => /^(ql-ui|ql-indent-\d|ql-align-(center|right|justify))$/.test(name));
    const list = element.getAttribute("data-list");
    for (const attribute of Array.from(element.attributes)) element.removeAttribute(attribute.name);
    if (color && /^(#[\da-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i.test(color)) (element as HTMLElement).style.color = color;
    if (classes.length) element.className = classes.join(" ");
    if (element.tagName === "LI" && ["checked", "unchecked", "bullet", "ordered"].includes(list || "")) element.setAttribute("data-list", list!);
  }
  return document.body.innerHTML;
}
export function memoHtmlText(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  for (const line of Array.from(document.body.querySelectorAll("p,div,li,br"))) line.append("\n");
  return (document.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}
