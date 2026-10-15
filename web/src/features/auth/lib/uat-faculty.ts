export function uatFaculty(profile: Record<string, unknown>): string | null {
  const raw = profile.uat_faculty_name;
  if (typeof raw !== "string") return null;
  const value = raw.normalize("NFC").trim();
  return value.length <= 180 && /\p{L}/u.test(value) && /^[\p{L}\p{M}\p{N} .,()&'’/\-]+$/u.test(value)
    ? value : null;
}
