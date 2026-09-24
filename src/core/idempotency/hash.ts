/** 요청 본문 정규 문자열. SQL core.idempotency_request_hash 입력과 같아야 한다. */

export function bookingIdempotencyCanonical(input: {
  organizationId: string;
  bookingId: string;
  status: string;
  consumeOnNoShow: boolean;
}): string {
  return `${input.organizationId}:${input.bookingId}:${input.status}:${input.consumeOnNoShow}`;
}

export function paymentIdempotencyCanonical(input: {
  organizationId: string;
  invoiceId: string;
  amount: string | number;
  method: string;
  paidAt: string;
}): string {
  return `${input.organizationId}:${input.invoiceId}:${input.amount}:${input.method}:${input.paidAt}`;
}

export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
