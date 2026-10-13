// Server-side release gate: a real login needs the operator-approved notice.
export function getUatPrivacyUrl(): string | null {
  try {
    const url = new URL(process.env.UAT_PRIVACY_URL ?? "");
    return url.protocol === "https:" && !url.username && !url.password
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function isUatLoginEnabled(): boolean {
  return process.env.UAT_LOGIN_ENABLED === "true" && Boolean(getUatPrivacyUrl());
}
