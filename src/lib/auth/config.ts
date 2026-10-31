export const SESSION_COOKIE = 'ads_admin_session';
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export function getAdminPassword(): string | undefined {
  const value = process.env.ADMIN_PASSWORD?.trim();
  return value || undefined;
}

export function getSessionSecret(): string | undefined {
  const secret = process.env.SESSION_SECRET?.trim() || process.env.ADMIN_PASSWORD?.trim();
  return secret || undefined;
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(getAdminPassword() && getSessionSecret());
}
