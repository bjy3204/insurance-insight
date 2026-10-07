"use client";
import Calendar from "@/app/components/calendar/Calendar";
export default function CalendarCard(identity: {
  userId: string | null;
  approved: boolean;
  loading: boolean;
}) {
  return <Calendar mode="compact" identity={identity} />;
}
