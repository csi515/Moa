import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { NotificationItem, NotificationType } from '@/types';
import {
  Bell,
  Send,
  MessageSquare,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  PhoneCall,
  Calendar
} from 'lucide-react';

export const NotificationManagementView: React.FC = () => {
  const { showToast, currentUser } = useApp();

  const notifications = StorageService.getNotifications();
  const students = StorageService.getStudents();
  const parents = StorageService.getParents();

  const [targetType, setTargetType] = useState<'all' | 'unpaid' | 'custom'>('all');
  const [notiType, setNotiType] = useState<NotificationType>('notice');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  // Quick preset templates
  const applyTemplate = (type: string) => {
    if (type === 'tuition') {
      setTitle('[선율 피아노] 8월분 수강료 납부 안내');
      setMessage(
        '안녕하세요, 선율피아노학원입니다. 늘 학원을 신뢰해 주셔서 감사드립니다. 8월분 정규 수강료 납부 기한을 안내해 드립니다. 원활한 학원 운영을 위해 납부 기한(매월 10일) 내 수납 부탁드립니다. 감사합니다.'
      );
      setNotiType('tuition_due');
    } else if (type === 'vacation') {
      setTitle('[선율 피아노] 여름방학 집중 레슨 및 휴원 안내');
      setMessage(
        '안녕하세요! 선율피아노학원입니다. 8월 14일~16일 3일간 여름방학 휴원 및 특강이 진행됩니다. 재충전 후 더욱 즐겁고 유익한 레슨으로 찾아뵙겠습니다. 즐거운 여름방학 되세요!'
      );
      setNotiType('notice');
    } else if (type === 'attendance') {
      setTitle('[선율 피아노] 원생 등원 알림');
      setMessage(
        '학부모님, 자녀가 선율피아노학원에 안전하게 등원하여 피아노 레슨을 시작하였습니다.'
      );
      setNotiType('attendance');
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      showToast('제목과 메시지 내용을 입력해주세요.', 'warning');
      return;
    }

    const recipientsCount =
      targetType === 'all'
        ? students.length
        : targetType === 'unpaid'
        ? 3
        : 1;

    StorageService.saveNotification({
      type: notiType,
      title: title.trim(),
      message: message.trim(),
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      recipientCount: recipientsCount,
      targetGroup: targetType === 'all' ? '전체 원생 학부모' : targetType === 'unpaid' ? '미납 학부모' : '개별 원생'
    });

    showToast(`${recipientsCount}명의 학부모님께 문자/알림 발송이 완료되었습니다.`, 'success');
    setTitle('');
    setMessage('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            알림톡 및 학부모 문자 발송
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            등하원 알림, 수강료 납부 안내, 학원 공지사항 일괄 문자 발송
          </p>
        </div>
      </div>

      {/* Main Grid: Send Form + Quick Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-600" />
            새 알림 메시지 작성
          </h3>

          <form onSubmit={handleSend} className="space-y-4">
            {/* Target Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">발송 대상</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: `전체 학부모 (${parents.length}명)` },
                  { id: 'unpaid', label: '수강료 미납 학부모' },
                  { id: 'custom', label: '선택 원생 학부모' }
                ].map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTargetType(t.id as any)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      targetType === t.id
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                알림 제목 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="예: [선율피아노] 8월 정기 연주회 안내"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                메시지 본문 <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                required
                placeholder="학부모님께 전달할 알림 내용을 입력하세요..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none resize-none leading-relaxed"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                <span>SMS / 카카오 알림톡 양식 지원</span>
                <span>{message.length}자</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                문자 / 알림톡 즉시 발송
              </button>
            </div>
          </form>
        </div>

        {/* Quick Templates Panel */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            자주 쓰는 추천 템플릿
          </h3>

          <div className="space-y-2.5">
            <button
              onClick={() => applyTemplate('tuition')}
              className="w-full p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-2xl text-left transition-colors cursor-pointer"
            >
              <p className="font-bold text-xs text-slate-900">💳 수강료 납부 안내문</p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                매월 정기 수강료 납부 안내 및 계좌번호 알림
              </p>
            </button>

            <button
              onClick={() => applyTemplate('vacation')}
              className="w-full p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-2xl text-left transition-colors cursor-pointer"
            >
              <p className="font-bold text-xs text-slate-900">🏖️ 방학 및 휴원 공지문</p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                여름/겨울방학 휴원 일정 및 특강 안내
              </p>
            </button>

            <button
              onClick={() => applyTemplate('attendance')}
              className="w-full p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-2xl text-left transition-colors cursor-pointer"
            >
              <p className="font-bold text-xs text-slate-900">🔔 등원 / 하원 안심 알림</p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                원생 안전 등하원 실시간 안심 문자
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Sent Notifications History */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          최근 발송 이력 ({notifications.length}건)
        </h3>

        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{n.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-indigo-100 text-indigo-700">
                    {n.targetGroup} ({n.recipientCount}명)
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {n.message}
                </p>
              </div>

              <div className="text-right shrink-0 text-xs font-mono text-slate-400">
                <span>{n.sentAt}</span>
                <div className="flex items-center gap-1 text-emerald-600 font-bold text-[11px] mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  발송 완료
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
