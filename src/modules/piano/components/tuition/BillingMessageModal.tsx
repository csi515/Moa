import React, { useState } from 'react';
import { StorageService } from '@/services/storage';
import { TuitionInvoice, Student } from '@/types';
import { formatCurrency, formatPhone } from '@/utils/formatters';
import { X, Copy, Check, MessageSquare, Send, Share2, Smartphone } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface BillingMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: TuitionInvoice | null;
}

export const BillingMessageModal: React.FC<BillingMessageModalProps> = ({
  isOpen,
  onClose,
  invoice
}) => {
  const { showToast } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !invoice) return null;

  const settings = StorageService.getSettings();
  const students = StorageService.getStudents();
  const student = students.find((s) => s.id === invoice.studentId);

  const bankInfo = typeof settings.bankAccount === 'object' && settings.bankAccount !== null
    ? `${settings.bankAccount.bank || ''} ${settings.bankAccount.accountNumber || ''} (예금주: ${settings.bankAccount.holder || ''})`.trim()
    : typeof settings.bankAccount === 'string' && settings.bankAccount
    ? settings.bankAccount
    : '국민은행 123-4567-890123 (예금주: 피아노학원)';

  const defaultMessage = `[${settings.name}] 수강료 청구 안내

안녕하세요, ${student?.parentName || '학부모'}님!
${invoice.studentName} 학생의 ${invoice.yearMonth} 수강료 납부 안내드립니다.

- 원생명: ${invoice.studentName}
- 청구월: ${invoice.yearMonth}
- 청구금액: ${formatCurrency(invoice.unpaidAmount)} (납부기한: ${invoice.dueDate})
- 입금계좌: ${bankInfo}

항상 아이의 성장을 응원해주셔서 감사드립니다.
궁금하신 점은 언제든 원으로 문의 바랍니다. 🎹
- ${settings.name} 드림 (${settings.phone})`;

  const [message, setMessage] = useState(defaultMessage);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    showToast('안내문이 클립보드에 복사되었습니다. 카카오톡이나 문자에 붙여넣기 하세요.', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendSms = () => {
    if (!invoice.parentPhone) {
      showToast('학부모 연락처가 등록되어 있지 않습니다.', 'error');
      return;
    }
    const cleanPhone = invoice.parentPhone.replace(/[^0-9]/g, '');
    const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                수강료 청구 안내문 발송
              </h3>
              <p className="text-xs text-slate-500">
                {invoice.studentName} ({formatPhone(invoice.parentPhone)})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>발송 메시지 내용 (수정 가능)</span>
              <span className="text-[11px] text-indigo-600 font-normal">카카오톡 / SMS 맞춤 서식</span>
            </label>
            <textarea
              rows={9}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed font-sans text-slate-800"
            />
          </div>

          <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
            <Smartphone className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              모바일 스마트폰에서는 <strong>[문자 앱 열기]</strong>를 누르면 문자 메시지 작성창에 내용이 자동으로 입력되어 바로 발송할 수 있습니다.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className={`w-full sm:flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '복사 완료!' : '안내문 복사 (카톡 발송)'}</span>
          </button>

          <button
            type="button"
            onClick={handleSendSms}
            className="w-full sm:w-auto py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 text-indigo-600" />
            <span>문자(SMS) 앱 열기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
