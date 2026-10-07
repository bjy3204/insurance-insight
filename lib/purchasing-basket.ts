export const basketProducts = [
  { id: "eggs", name: "계란", unit: "1판", price: 7000, color: "#fff2df" },
  { id: "milk", name: "우유", unit: "1팩", price: 1500, color: "#eaf3ff" },
  { id: "gimbap", name: "김밥", unit: "1줄", price: 3500, color: "#edf5e9" },
  { id: "jajangmyeon", name: "짜장면", unit: "1그릇", price: 7000, color: "#f2ebdf" },
  { id: "ramen", name: "봉지라면", unit: "1봉", price: 1000, color: "#ffebe6" },
  { id: "cup-ramen", name: "컵라면", unit: "1개", price: 1800, color: "#fff0e5" },
  { id: "snack", name: "과자", unit: "1봉", price: 1500, color: "#fff4d9" },
  { id: "water", name: "생수", unit: "1병", price: 800, color: "#e6f6fb" },
  { id: "tofu", name: "두부", unit: "1모", price: 2000, color: "#f0eee8" },
  { id: "bread", name: "빵", unit: "1개", price: 1500, color: "#f8eddf" },
  { id: "icecream", name: "아이스크림", unit: "1개", price: 1000, color: "#fceaf3" },
  { id: "fishcake", name: "어묵", unit: "1개", price: 1000, color: "#f2efe1" },
] as const;

export type BasketProduct = (typeof basketProducts)[number];
export type BasketProductId = BasketProduct["id"];

export function basketPrice(product: BasketProduct, years: number, inflation: number) {
  return Math.round(product.price * Math.pow(1 + inflation / 100, years));
}

export function basketTotal(items: BasketProductId[], years: number, inflation: number) {
  return items.reduce((sum, id) => {
    const product = basketProducts.find(item => item.id === id);
    return sum + (product ? basketPrice(product, years, inflation) : 0);
  }, 0);
}

export function canAddToBasket(items: BasketProductId[], product: BasketProduct, budget: number, years: number, inflation: number) {
  return basketTotal(items, years, inflation) + basketPrice(product, years, inflation) <= budget;
}

// Keep the customer's shopping order: once the next item exceeds the budget,
// the remaining items stay outside the future basket.
export function futureBasket(items: BasketProductId[], budget: number, years: number, inflation: number) {
  let total = 0;
  const kept: BasketProductId[] = [];
  for (const id of items) {
    const product = basketProducts.find(item => item.id === id);
    if (!product) continue;
    const price = basketPrice(product, years, inflation);
    if (total + price > budget) break;
    total += price;
    kept.push(id);
  }
  return { items: kept, total, excluded: items.slice(kept.length) };
}
