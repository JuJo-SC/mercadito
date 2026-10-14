type IdentityProfile = Record<string, unknown>;

// The dedicated session claim contains an already reduced, portal-derived name.
export function uatDisplayName(profile: IdentityProfile): string | null {
  const value = profile.uat_display_name;
  if (typeof value !== "string") return null;
  const name = value.normalize("NFC").trim();
  return /^[\p{L}][\p{L}\p{M}'’\-]{0,39}(?: [\p{L}]\.)?$/u.test(name)
    ? name
    : null;
}
