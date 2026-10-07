"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { ShoppingBasket, X, RotateCcw, Plus, ArrowRight } from "lucide-react";
import { basketProducts, basketTotal, canAddToBasket, futureBasket, type BasketProduct, type BasketProductId } from "@/lib/purchasing-basket";
import styles from "./PurchasingBasket.module.css";

const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;

function ProductCircle({ product, small = false }: { product: BasketProduct; small?: boolean }) {
  return <span className={small ? styles.smallCircle : styles.circle} style={{ background: product.color }}>{product.name}</span>;
}

function Product({ product, add }: { product: BasketProduct; add: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: product.id });
  return <div className={`${styles.product} ${isDragging ? styles.dragging : ""}`}>
    <div ref={setNodeRef} {...attributes} {...listeners} role="img" tabIndex={-1} aria-label={`${product.name} 끌어 담기`} className={styles.dragHandle}><ProductCircle product={product} /></div>
    <span className={styles.unit}>{product.unit}</span><span className={styles.price}>{won(product.price)}</span>
    <button type="button" onClick={add} aria-label={`${product.name} ${product.unit} 담기`} className={styles.add}><Plus size={14} />담기</button>
  </div>;
}

function Basket({ items, remove, future = false, excluded = [] }: { items: BasketProductId[]; remove?: (index: number) => void; future?: boolean; excluded?: BasketProductId[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: future ? "future-basket" : "basket", disabled: future });
  return <div ref={setNodeRef} className={`${styles.basket} ${isOver ? styles.over : ""}`}>
    {items.length === 0 && excluded.length === 0 ? <div className={styles.empty}><ShoppingBasket size={42} strokeWidth={1.3} /><strong>{future ? "미래 장바구니도 함께 채워져요" : "상품을 여기로 끌어 담으세요"}</strong><span>{future ? "오른 가격으로 같은 순서대로 담아 봐요" : "‘담기’ 버튼으로도 담을 수 있어요"}</span></div>
      : <ol className={styles.items}>{[...items, ...excluded].map((id, index) => {
        const product = basketProducts.find(item => item.id === id)!;
        const missing = index >= items.length;
        return <li key={`${index}-${id}`} className={`${styles.item} ${missing ? styles.excluded : ""}`}>
          <span className={styles.order}>{index + 1}</span><ProductCircle product={product} small />
          {!future && <button type="button" onClick={() => remove?.(index)} aria-label={`${index + 1}번째 ${product.name} 빼기`} className={styles.remove}><X size={13} /></button>}
          <span>{missing ? "예산 초과" : product.unit}</span>
        </li>;
      })}</ol>}
    <div className={styles.basketLip}><ShoppingBasket size={18} />{future ? "흐린 상품은 같은 예산으로 담지 못한 상품" : "담은 순서대로 쌓여요"}</div>
  </div>;
}

export default function PurchasingBasket() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BasketProductId[]>([]);
  const [budget, setBudget] = useState(10000);
  const [years, setYears] = useState(10);
  const [inflation, setInflation] = useState(3);
  const [message, setMessage] = useState("");
  const [dragged, setDragged] = useState<BasketProductId | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("open-purchasing-basket", show);
    return () => window.removeEventListener("open-purchasing-basket", show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const elements = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex="0"]');
      if (!elements?.length) return;
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", onKey); if (previousFocus?.isConnected) previousFocus.focus(); };
  }, [open]);

  if (!open) return null;
  const total = basketTotal(items, 0, inflation);
  const future = futureBasket(items, budget, years, inflation);
  const fullFutureTotal = basketTotal(items, years, inflation);
  const add = (id: BasketProductId) => {
    const product = basketProducts.find(item => item.id === id)!;
    setItems(previous => canAddToBasket(previous, product, budget, 0, inflation) ? [...previous, id] : previous);
    setMessage(canAddToBasket(items, product, budget, 0, inflation) ? `${product.name}을 담았어요` : `남은 ${won(budget - total)}으로는 ${product.name}을 담을 수 없어요`);
  };
  const drop = (event: DragEndEvent) => { setDragged(null); if (event.over?.id === "basket") add(event.active.id as BasketProductId); };

  return createPortal(<div className={styles.backdrop} onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="basket-title" tabIndex={-1} className={styles.dialog}>
      <header data-popup-header="true" className={styles.header}><div data-popup-title="true"><h2 id="basket-title"><ShoppingBasket size={25} />물가 장바구니</h2></div><button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="물가 장바구니 닫기"><X size={22} /></button></header>
      <div className={styles.body}>
        <div className={styles.settings}>
          <div><span className={styles.label}>장보기 예산</span><div className={styles.presets}>{[10000, 20000, 30000].map(value => <button type="button" key={value} aria-pressed={budget === value} onClick={() => { setBudget(value); setItems([]); setMessage(""); }}>{value / 10000}만원</button>)}</div></div>
          <label><span className={styles.label}>몇 년 뒤인가요?</span><div className={styles.field}><input data-ui-field="true" aria-label="비교 기간" type="number" min={1} max={50} value={years} onChange={event => setYears(Math.max(1, Math.min(50, Number(event.target.value) || 1)))} /><span>년 뒤</span></div></label>
          <label><span className={styles.label}>연 물가상승률</span><div className={styles.field}><input data-ui-field="true" aria-label="연 물가상승률" type="number" min={0} max={20} step={0.5} value={inflation} onChange={event => setInflation(Math.max(0, Math.min(20, Number(event.target.value) || 0)))} /><span>%</span></div></label>
        </div>
        <DndContext sensors={sensors} onDragStart={event => setDragged(event.active.id as BasketProductId)} onDragEnd={drop} onDragCancel={() => setDragged(null)}>
          <div className={styles.shelfHeading}><strong>어떤 상품을 담아 볼까요?</strong><span>상품을 끌어 지금 장바구니에 놓아 주세요</span></div>
          <div className={styles.shop}>{basketProducts.map(product => <Product key={product.id} product={product} add={() => add(product.id)} />)}</div>
          <div className={styles.cartGrid}>
            <section><div className={styles.receipt}><div><span>지금</span><strong>{won(total)}</strong></div><div className={styles.remaining}><span>남은 금액</span><strong>{won(budget - total)}</strong></div></div><div className={styles.progress} role="progressbar" aria-label="현재 사용한 예산" aria-valuemin={0} aria-valuemax={budget} aria-valuenow={total}><span style={{ width: `${total / budget * 100}%` }} /></div><Basket items={items} remove={index => { setItems(previous => previous.filter((_, position) => position !== index)); setMessage("상품을 뺐어요"); }} /></section>
            <section><div className={styles.receipt}><div><span>{years}년 뒤</span><strong>{won(future.total)}</strong></div><div className={styles.remaining}><span>남은 금액</span><strong>{won(budget - future.total)}</strong></div></div><div className={styles.progress} role="progressbar" aria-label="미래 사용한 예산" aria-valuemin={0} aria-valuemax={budget} aria-valuenow={future.total}><span style={{ width: `${future.total / budget * 100}%` }} /></div><Basket items={future.items} excluded={future.excluded} future /></section>
          </div>
          <DragOverlay dropAnimation={null}>{dragged && <div className={styles.floating}><ProductCircle product={basketProducts.find(item => item.id === dragged)!} /></div>}</DragOverlay>
        </DndContext>
        <div className={styles.statusRow}><p role="status" aria-live="polite" className={styles.message}>{message || `${budget / 10000}만원을 넘으면 담을 수 없어요`}</p><button type="button" className={styles.reset} onClick={() => { setItems([]); setMessage(""); }}><RotateCcw size={16} />다시 담기</button></div>
        {items.length > 0 && <div className={styles.comparison}><span>지금 담은 상품을 모두 사려면</span><div><strong>지금 {won(total)}</strong><ArrowRight size={18} /><strong>{years}년 뒤 {won(fullFutureTotal)}</strong></div><p>{future.excluded.length > 0 ? `같은 ${budget / 10000}만원으로는 ${future.excluded.length}개를 덜 담게 돼요` : "아직은 미래에도 모두 담을 수 있어요"}</p></div>}
        <p className={styles.note}>지금은 구조 확인용 화면이에요 · 원 안의 이름은 이후 상품 이미지로 바뀝니다 · 예산을 바꾸면 장바구니가 비워져요<br />상품 가격은 체험용 예시이며 실제 판매 가격과 다를 수 있어요 · 미래 가격은 입력한 물가상승률이 매년 같다고 가정해 계산해요<br />미래 장바구니는 담은 순서를 유지하며, 예산을 넘는 상품부터 담지 않습니다</p>
      </div>
    </div>
  </div>, document.body);
}
