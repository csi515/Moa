export type AccountType = 'owner' | 'parent';

export function parseAccountType(value: unknown): AccountType | null {
  return value === 'owner' || value === 'parent' ? value : null;
}
