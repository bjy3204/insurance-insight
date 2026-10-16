import { redirect } from "next/navigation";
export default function CompleteSubscription() {
  // This redirect is not proof of payment; the claim endpoint checks the webhook.
  redirect("/?complete_signup=1");
}
