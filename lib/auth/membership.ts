type MembershipProfile = { nickname?: string | null; instagram_id?: string | null; role?: string | null };

export function hasCompletedMembership(profile: MembershipProfile | null | undefined): boolean {
  return !!profile && (profile.role === 'admin' || (!!profile.nickname?.trim() && !!profile.instagram_id?.trim()));
}
