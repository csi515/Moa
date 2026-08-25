/** Organization slug (내부용, 상담 QR과 무관) */
export function buildOrganizationSlug(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || `org-${Date.now()}`
  );
}
