"use client";
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useId } from "react";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { customerDirectory, type CustomerRecord } from "./customer-lookup-model";
import { shortCustomerBirth, formatCustomerPhone } from "./customer-form-fields";
import styles from "./CustomerLookup.module.css";

function Row({ customer, selected, disabled, onSelect }: { customer: CustomerRecord; selected: boolean; disabled: boolean; onSelect: (customer: CustomerRecord) => void }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: customer.id, disabled });
  return <button ref={setNodeRef} type="button" className={styles.directoryRow} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? .5 : 1 }} {...attributes} {...listeners} aria-pressed={selected} onClick={() => onSelect(customer)}>
    <strong>{customer.name}</strong><span>{shortCustomerBirth(customer.birth)}</span><span className={styles.directoryPhone}>{customer.phone ? formatCustomerPhone(customer.phone) : ""}</span>
  </button>;
}

export default function CustomerDirectory({ customers, query, selectedId, onSelect, onReorder, disabled = false }: { customers: readonly CustomerRecord[]; query: string; selectedId?: string; onSelect: (customer: CustomerRecord) => void; onReorder?: (ids: string[]) => void; disabled?: boolean }) {
  const dndId = useId();
  const rows = customerDirectory(customers, query);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const move = ({ active, over }: DragEndEvent) => {
    if (!onReorder || !over || disabled || active.id === over.id) return;
    const before = rows.findIndex(row => row.id === active.id), after = rows.findIndex(row => row.id === over.id);
    if (before < 0 || after < 0) return;
    const moved = arrayMove(rows, before, after), visible = new Set(rows.map(row => row.id));
    let index = 0;
    onReorder(customerDirectory(customers, "").map(row => visible.has(row.id) ? moved[index++].id : row.id));
  };
  return <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={move}><SortableContext items={rows.map(row => row.id)} strategy={verticalListSortingStrategy}>{rows.map(customer => <Row key={customer.id} customer={customer} selected={selectedId === customer.id} disabled={disabled || !onReorder} onSelect={onSelect} />)}</SortableContext></DndContext>;
}
