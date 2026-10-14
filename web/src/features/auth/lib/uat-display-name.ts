type IdentityProfile = Record<string, unknown>;

export function uatDisplayName(profile: IdentityProfile): string | null {
  const value = profile.uat_display_name;
  if (typeof value !== "string") return null;
  const name = value.normalize("NFC").trim();
  return name.length <= 125 && /^(?:[\p{L}][\p{L}\p{M}'’\-]*|[\p{L}][\p{L}\p{M}'’\-]*(?: [\p{L}][\p{L}\p{M}'’\-]*)* [\p{L}]\.)$/u.test(name)
    ? name : null;
}

export function uatPrivateName(profile: IdentityProfile): string | null {
  const value = profile.uat_private_name;
  if (typeof value !== "string") return null;
  const name = value.normalize("NFC").trim();
  return name.length <= 180 && /^[\p{L}][\p{L}\p{M}'’\-]*(?: [\p{L}][\p{L}\p{M}'’\-]*)*$/u.test(name)
    ? name : null;
}
