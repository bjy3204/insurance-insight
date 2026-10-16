import { notFound } from "next/navigation";
import { PAYAPP_SUBSCRIPTION } from "@/lib/payapp/plans";
import SubscriptionCheckout from "../SubscriptionCheckout";
import { payappEnabled } from "@/lib/payapp/server";

export default async function SubscriptionPage({ params }: { params: Promise<{ amount: string }> }) {
  const { amount } = await params;
  if (!PAYAPP_SUBSCRIPTION.amounts.some(value => String(value) === amount)) notFound();
  return <SubscriptionCheckout amount={Number(amount)} enabled={payappEnabled()} />;
}
