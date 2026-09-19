import { formatCurrency } from '@/utils/formatters';

/** 청구서 카톡/공유용 문구 (알림톡 API 아님 — Web Share) */
export async function shareInvoiceNotice(params: {
  studentName: string;
  amount: number;
  yearMonth: string;
  title?: string;
}): Promise<'shared' | 'copied' | 'unsupported'> {
  const [y, m] = params.yearMonth.split('-');
  const monthLabel = y && m ? `${y}년 ${Number(m)}월` : params.yearMonth;
  const title = params.title?.trim() || `${monthLabel} 수강료 청구서`;
  const text = [
    `[모두의 아카데미 모아] ${params.studentName} 학생 ${title}`,
    `미납 금액: ${formatCurrency(params.amount)}`,
    '',
    '앱에서 확인·결제해 주세요. 감사합니다.',
  ].join('\n');

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch {
      /* cancel / fail → clipboard */
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'unsupported';
  }
}
