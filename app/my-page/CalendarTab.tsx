"use client";
import Calendar from "@/app/components/calendar/Calendar";
export default function CalendarTab({ active = true }: { active?: boolean }) {
  return <Calendar active={active} />;
}
