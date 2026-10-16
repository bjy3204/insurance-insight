export function normalizeInstagramId(value: string | null | undefined) {
  return (value || "").trim().replace(/^@/, "").toLowerCase();
}
export function subscriberLinkCandidates(member: { instagram_id: string | null; nickname?: string | null }, subscribers: { id: string; subscriber_id: string; name?: string | null }[]) {
  const id = normalizeInstagramId(member.instagram_id);
  const compact = (value: string) => value.replace(/[_.+\-]/g, "");
  const name = (value?: string | null) => (value || "").trim().replace(/\s+/g, "").toLowerCase();
  return subscribers.flatMap(subscriber => {
    const other = normalizeInstagramId(subscriber.subscriber_id);
    const nameMatches = name(member.nickname).length >= 2 && name(member.nickname) === name(subscriber.name);
    const reason = id && id === other ? "아이디 일치" : id && compact(id).length >= 3 && compact(id) === compact(other) ? "기호·언더바 차이" : nameMatches ? "이름 일치" : null;
    if (!reason) return [];
    return [{ id: subscriber.id, reason, nameMatches, score: (reason === "아이디 일치" ? 100 : reason === "기호·언더바 차이" ? 80 : 40) + (nameMatches ? 10 : 0) }];
  }).sort((a, b) => b.score - a.score);
}
type Member = { id: string; instagram_id: string | null; linked_subscriber_id: string | null };
type SubscriberIdentity = { id: string; subscriber_id: string };
export function findSubscriberLinks(members: Member[], subscribers: SubscriberIdentity[]) {
  const occupied = new Set(members.map(member => member.linked_subscriber_id).filter(Boolean));
  const memberGroups = new Map<string, Member[]>(), subscriberGroups = new Map<string, SubscriberIdentity[]>();
  for (const member of members) {
    const key = normalizeInstagramId(member.instagram_id);
    if (key) memberGroups.set(key, [...(memberGroups.get(key) || []), member]);
  }
  for (const subscriber of subscribers) {
    const key = normalizeInstagramId(subscriber.subscriber_id);
    if (key) subscriberGroups.set(key, [...(subscriberGroups.get(key) || []), subscriber]);
  }
  return subscribers.flatMap(subscriber => {
    const key = normalizeInstagramId(subscriber.subscriber_id), matches = memberGroups.get(key) || [];
    if (!key || matches.length !== 1 || subscriberGroups.get(key)?.length !== 1 || matches[0].linked_subscriber_id || occupied.has(subscriber.id)) return [];
    return [{ profileId: matches[0].id, instagramId: matches[0].instagram_id!, subscriberId: subscriber.id }];
  });
}
