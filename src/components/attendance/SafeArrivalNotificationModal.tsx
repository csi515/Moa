import React, { useState } from 'react';
import { Student } from '../../types';
import { StorageService } from '../../services/storage';
import { formatPhone } from '../../utils/formatters';
import { X, Check, Copy, Send, BellRing, Smartphone, Music } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SafeArrivalNotificationModalProps {
  isOpen: boolean;
  student: Student | null;
  type: 'arrival' | 'departure';
  onClose: () => void;
}

export const SafeArrivalNotificationModal: React.FC<SafeArrivalNotificationModalProps> = ({
  isOpen,
  student,
  type,
  onClose
}) => {
  const { showToast } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !student) return null;

  const settings = StorageService.getSettings();
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const defaultMessage = type === 'arrival'
    ? `[${settings.name}] 안심 등원 알림 🎹
${student.parentName || '학부모'}님 안녕하세요.
${student.name} 원생이 오늘 ${timeStr}에 안전하게 음악학원에 도착(등원)하여 즐겁게 피아노 수업을 시작했습니다. 😊`
    : `[${settings.name}] 안심 하원 알림 🎹
${student.parentName || '학부모'}님 안녕하세요.
${student.name} 원생이 오늘 피아노 레슨과 연습을 성실히 마치고 ${timeStr}에 안전하게 하원하였습니다. 조심히 귀가하도록 지도했습니다. 🎶`;

  const [message, setMessage] = useState(defaultMessage);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    showToast('알림 메시지가 복사되었습니다.', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendSms = () => {
    if (!student.parentPhone) {
      showToast('학부모 연락처가 없습니다.', 'error');
      return;
    }
    const cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
    const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                학부모 안심 {type === 'arrival' ? '등원' : '하원'} 알림
              </h3>
              <p className="text-xs text-slate-500">
                {student.name} ({formatPhone(student.parentPhone)})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed text-slate-800"
          />

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '복사됨' : '카톡 내용 복사'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendSms}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>문자(SMS) 발송</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
