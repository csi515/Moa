/**
 * E2E 인증 자격 증명.
 * 설정: E2E_EMAIL, E2E_PASSWORD (선택: E2E_ORG_NAME — 사업장 이름 부분 일치)
 */
export function getE2ECredentials(): {
  email: string;
  password: string;
  orgNameHint: string | null;
} | null {
  const email = (process.env.E2E_EMAIL || '').trim();
  const password = (process.env.E2E_PASSWORD || '').trim();
  if (!email || !password) return null;
  const orgNameHint = (process.env.E2E_ORG_NAME || '').trim() || null;
  return { email, password, orgNameHint };
}

export function hasE2ECredentials(): boolean {
  return getE2ECredentials() !== null;
}
