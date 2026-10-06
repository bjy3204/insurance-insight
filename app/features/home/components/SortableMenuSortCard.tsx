"use client";

import { Eye, EyeOff } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableMenuSortCard({
  menu,
  onEdit,
  onContextMenu,
  tempHiddenMenuIds,
  setTempHiddenMenuIds,
  
}: {
  menu: any;
  onEdit: () => void;
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>) => void;
  tempHiddenMenuIds: string[];
  setTempHiddenMenuIds: React.Dispatch<React.SetStateAction<string[]>>;
  
}) {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: menu.id });

  const Icon = menu.icon;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.9 : 1,
  };

  return (
  <div
    data-menu-id={menu.id}
    ref={setNodeRef}
    style={style}
    {...attributes}
    {...listeners}
    onDoubleClick={onEdit}
    onContextMenu={onContextMenu}
    className="
      bg-white
      p-7
      sm:p-8
      rounded-3xl
      shadow
      border
      border-gray-200
      min-h-[190px]
      cursor-default
      transition
      hover:shadow-xl
      hover:-translate-y-1
       "
  >
    <div className="flex justify-between items-start mb-4">
            <Icon className="w-10 h-10 text-blue-600 shrink-0" />
     <button
  onClick={(e) => {
    e.stopPropagation();
    setTempHiddenMenuIds((prev) =>
      prev.includes(menu.id)
        ? prev.filter((id) => id !== menu.id)
        : [...prev, menu.id]
    );
  }}
  className="p-2 rounded-full hover:bg-gray-100 transition"
>
  {tempHiddenMenuIds.includes(menu.id) ? (
    <EyeOff className="w-5 h-5 text-gray-400" />
  ) : (
    <Eye className="w-5 h-5 text-gray-400" />
  )}
</button>

    </div>

    <h2 className="text-lg font-bold text-gray-900">

      {menu.title}
    </h2>

    <p className="text-sm text-gray-500 mt-2 leading-relaxed break-keep">
      {menu.desc}
    </p>
  </div>
);
}
