"use client";

import { useId, type ReactNode } from "react";
import { closestCenter, DndContext, KeyboardSensor, MouseSensor, pointerWithin, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SortablePersonalMenu({ ids, grid = false, disabled, onReorder, children }: { ids: string[]; grid?: boolean; disabled: boolean; onReorder: (active: string, over: string) => void; children: ReactNode }) {
  const contextId = useId();
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  return <DndContext id={contextId} sensors={sensors} collisionDetection={args => args.pointerCoordinates ? pointerWithin(args) : closestCenter(args)} onDragEnd={({ active, over }) => {
    if (!disabled && over && active.id !== over.id && ids.includes(String(active.id)) && ids.includes(String(over.id))) onReorder(String(active.id), String(over.id));
  }}>
    <SortableContext items={ids} strategy={grid ? rectSortingStrategy : verticalListSortingStrategy}>{children}</SortableContext>
  </DndContext>;
}

export function SortablePersonalMenuButton({ id, label, disabled, className, onClick, children }: { id: string; label: string; disabled: boolean; className: string; onClick: () => void; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  return <button ref={setNodeRef} type="button" {...attributes} {...listeners} title={label} aria-label={label}
    style={{ transform: CSS.Transform.toString(transform), transition, position: "relative", zIndex: isDragging ? 2 : undefined, opacity: isDragging ? .65 : 1, touchAction: "manipulation" }}
    onClick={() => { if (!isDragging) onClick(); }} className={className}>{children}</button>;
}
