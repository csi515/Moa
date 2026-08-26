import { useMemo, useState, type FC, type FormEvent } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { useStaffScope, useStorageRefresh } from '@/hooks';
import { StorageService } from '@/services/storage';
import { PageHeader, FilterBar, SearchField, EmptyState, Modal } from '@/shared/components';
import { FormField, FORM_CONTROL_CLASS, FilterTabs, SegmentedControl } from '@/shared/components/ui';
import { Megaphone, Plus, Trash2, Send, Save, CheckCircle2, FileText } from 'lucide-react';
import type { AppNotification } from '@/types';
import { useModuleLabels } from '@/core/labels';
import { getIndustryAccent, usesClassBasedSchedule } from '@/core/industry/industryUi';
import {
  PARENT_NOTICE_KIND_LABEL,
  encodeNoticeTarget,
  parseNoticeTarget,
  getNoticeTargetModeLabel,
  noticeAccentClasses,
  type ParentNoticeKind,
  type NoticeTargetMode,
} from './types';
import { filterParentNotices, resolveNoticeRecipients } from './noticeHelpers';

type StatusFilter = 'ALL' | 'pending' | 'sent';

function buildTemplates(placeWord: string, feeWord: string) {
  return [
    {
      id: 'prepare',
      label: '준비물 안내',
      kind: 'announcement' as ParentNoticeKind,
      title: '준비물 안내',
      message: `안녕하세요. 아래 준비물을 챙겨 주세요.\n· (준비물 입력)\n협조해 주셔서 감사합니다.`,
    },
    {
      id: 'holiday',
      label: '휴강·일정 안내',
      kind: 'notice' as ParentNoticeKind,
      title: '휴강 일정 안내',
      message: `안녕하세요. 아래 일정에 ${placeWord}이(가) 쉽니다.\n· 휴강일: (날짜 입력)\n· 사유: (사유 입력)\n문의는 ${placeWord}으로 연락 부탁드립니다.`,
    },
    {
      id: 'event',
      label: '행사 안내',
      kind: 'announcement' as ParentNoticeKind,
      title: '행사 안내장',
      message: `안녕하세요. ${placeWord} 행사 일정을 안내드립니다.\n· 일시: (날짜·시간)\n· 장소: (장소)\n많은 관심 부탁드립니다.`,
    },
    {
      id: 'tuition',
      label: `${feeWord} 안내`,
      kind: 'notice' as ParentNoticeKind,
      title: `${feeWord} 납부 안내`,
      message: `안녕하세요. 이번 달 ${feeWord} 납부 안내드립니다.\n납부 기한 내 수납 부탁드리며, 문의는 ${placeWord}으로 연락 주세요.`,
    },
  ];
}

export const ParentNoticeView: FC = () => {
  const { showToast, openConfirmDialog } = useApp();
  const { industry } = usePermissions();
  const labels = useModuleLabels();
  const accent = getIndustryAccent(industry);
  const tone = noticeAccentClasses(accent.icon);
  const classBased = usesClassBasedSchedule(industry);
  const { scopeStudents } = useStaffScope();
  const refreshKey = useStorageRefresh();

  const placeWord =
    industry === 'daycare'
      ? '어린이집'
      : industry === 'pilates'
        ? '스튜디오'
        : industry === 'gym'
          ? '체육관'
          : '학원';
  const feeWord = industry === 'daycare' ? '보육료' : '수강료';
  const templates = useMemo(() => buildTemplates(placeWord, feeWord), [placeWord, feeWord]);

  const students = useMemo(
    () => scopeStudents(StorageService.getStudents()).filter((s) => s.status === 'active'),
    [scopeStudents, refreshKey]
  );
  const classes = useMemo(() => StorageService.getClasses(), [refreshKey]);
  const notices = useMemo(
    () => filterParentNotices(StorageService.getNotifications()),
    [refreshKey]
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<AppNotification | null>(null);
  const [form, setForm] = useState({
    kind: 'announcement' as ParentNoticeKind,
    title: '',
    message: '',
    targetMode: 'all' as NoticeTargetMode,
    classId: '',
    studentId: '',
  });

  const filtered = useMemo(() => {
    return notices
      .filter((n) => (statusFilter === 'ALL' ? true : (n.status || 'pending') === statusFilter))
      .filter((n) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [notices, statusFilter, searchQuery]);

  const recipientPreview = useMemo(() => {
    const id = form.targetMode === 'class' ? form.classId : form.studentId;
    return resolveNoticeRecipients(students, form.targetMode, id || undefined);
  }, [students, form.targetMode, form.classId, form.studentId]);

  const targetModeOptions = useMemo(() => {
    const opts: { value: NoticeTargetMode; label: string }[] = [
      { value: 'all', label: '전체' },
    ];
    if (classBased) opts.push({ value: 'class', label: labels.service.singular });
    opts.push({ value: 'student', label: '개별' });
    return opts;
  }, [classBased, labels.service.singular]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      kind: 'announcement',
      title: '',
      message: '',
      targetMode: 'all',
      classId: classes[0]?.id || '',
      studentId: students[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: AppNotification) => {
    const parsed = parseNoticeTarget(item.targetGroup);
    const mode =
      parsed.mode === 'class' && !classBased ? 'all' : parsed.mode;
    setEditing(item);
    setForm({
      kind: (item.type === 'announcement' ? 'announcement' : 'notice') as ParentNoticeKind,
      title: item.title,
      message: item.message,
      targetMode: mode,
      classId: parsed.mode === 'class' ? parsed.id || '' : classes[0]?.id || '',
      studentId:
        parsed.mode === 'student'
          ? parsed.id || item.targetStudentId || ''
          : item.targetStudentId || students[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const applyTemplate = (templateId: string) => {
    const t = templates.find((x) => x.id === templateId);
    if (!t) return;
    setForm((prev) => ({
      ...prev,
      kind: t.kind,
      title: t.title,
      message: t.message,
    }));
  };

  const buildPayload = (status: 'pending' | 'sent') => {
    const targetId = form.targetMode === 'class' ? form.classId : form.studentId;
    if (form.targetMode === 'class' && !form.classId) {
      showToast(`${labels.service.singular}을(를) 선택해 주세요.`, 'error');
      return null;
    }
    if (form.targetMode === 'student' && !form.studentId) {
      showToast(`${labels.customer.singular}을(를) 선택해 주세요.`, 'error');
      return null;
    }
    const recipients = resolveNoticeRecipients(students, form.targetMode, targetId || undefined);
    if (recipients.length === 0 && form.targetMode !== 'all') {
      showToast(`발송 대상 ${labels.customer.singular}이(가) 없습니다.`, 'error');
      return null;
    }
    if (!form.title.trim() || !form.message.trim()) {
      showToast('제목과 내용을 입력해 주세요.', 'error');
      return null;
    }

    const student =
      form.targetMode === 'student'
        ? students.find((s) => s.id === form.studentId)
        : undefined;

    return {
      id: editing?.id,
      type: form.kind,
      title: form.title.trim(),
      message: form.message.trim(),
      targetGroup: encodeNoticeTarget(form.targetMode, targetId || undefined),
      recipientCount: recipients.length,
      targetStudentId: student?.id,
      targetStudentName: student?.name,
      status,
      sentAt: status === 'sent' ? new Date().toISOString() : editing?.sentAt,
      createdAt: editing?.createdAt,
    };
  };

  const handleSaveDraft = (e: FormEvent) => {
    e.preventDefault();
    const payload = buildPayload('pending');
    if (!payload) return;
    StorageService.saveNotification(payload);
    showToast(`임시저장되었습니다. 게시하면 ${labels.contact.singular} 포털에 표시됩니다.`, 'success');
    setIsModalOpen(false);
  };

  const handlePublish = (e?: FormEvent) => {
    e?.preventDefault();
    const payload = buildPayload('sent');
    if (!payload) return;
    StorageService.saveNotification(payload);
    showToast(
      `${labels.contact.singular} 포털에 게시되었습니다. (대상 ${payload.recipientCount}명)`,
      'success'
    );
    setIsModalOpen(false);
  };

  const publishExisting = (item: AppNotification) => {
    StorageService.saveNotification({
      ...item,
      status: 'sent',
      sentAt: new Date().toISOString(),
    });
    showToast(`${labels.contact.singular} 포털에 게시되었습니다.`, 'success');
  };

  const handleDelete = (item: AppNotification) => {
    openConfirmDialog({
      title: '안내 삭제',
      message: `"${item.title}"을(를) 삭제할까요?`,
      isDestructive: true,
      confirmText: '삭제',
      onConfirm: () => {
        StorageService.deleteNotification(item.id);
        showToast('삭제되었습니다.', 'info');
      },
    });
  };

  const targetLabel = (item: AppNotification) => {
    const { mode, id } = parseNoticeTarget(item.targetGroup);
    if (mode === 'class' && id) {
      const cls = classes.find((c) => c.id === id);
      return cls
        ? `${labels.service.singular} · ${cls.name}`
        : getNoticeTargetModeLabel('class', labels);
    }
    if (mode === 'student') {
      return item.targetStudentName
        ? `개별 · ${item.targetStudentName}`
        : getNoticeTargetModeLabel('student', labels);
    }
    return getNoticeTargetModeLabel('all', labels);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Megaphone className="w-6 h-6" />}
        iconClassName={accent.icon}
        title="안내장 · 가정통신문"
        description={`${labels.contact.singular} 포털에 안내장·가정통신문을 게시합니다 (앱 내 알림)`}
        actions={
          <button
            type="button"
            onClick={openCreate}
            className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl ${accent.btn} ${accent.btnHover} text-white text-xs font-bold`}
          >
            <Plus className="w-4 h-4" />
            작성
          </button>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <FilterBar className="border-0 shadow-none rounded-none border-b border-slate-100">
          <FilterTabs
            tabs={[
              { id: 'ALL', label: '전체' },
              { id: 'pending', label: '임시저장' },
              { id: 'sent', label: '게시됨' },
            ]}
            active={statusFilter}
            onChange={(id) => setStatusFilter(id)}
            activeClassName={tone.active}
          />
          <SearchField
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="제목·내용 검색"
            className="w-full sm:flex-1 sm:max-w-xs"
          />
        </FilterBar>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="w-10 h-10" />}
            title="등록된 안내가 없습니다"
            description="휴강·행사·준비물 등 안내장이나 가정통신문을 작성해 보세요."
            action={
              <button
                type="button"
                onClick={openCreate}
                className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl ${accent.btn} ${accent.btnHover} text-white text-xs font-bold`}
              >
                <Plus className="w-4 h-4" />
                작성
              </button>
            }
            className="border-0 shadow-none rounded-none"
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => {
              const published = item.status === 'sent';
              return (
                <div key={item.id} className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${tone.soft}`}>
                          {PARENT_NOTICE_KIND_LABEL[item.type as ParentNoticeKind] || '안내'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                            published
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {published ? '게시됨' : '임시저장'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {targetLabel(item)}
                          {item.recipientCount != null ? ` · ${item.recipientCount}명` : ''}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 text-sm mt-1.5">{item.title}</p>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                        {item.message}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-2">
                        {published
                          ? `게시 ${(item.sentAt || '').slice(0, 16).replace('T', ' ')}`
                          : `작성 ${(item.createdAt || '').slice(0, 16).replace('T', ' ')}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!published && (
                      <button
                        type="button"
                        onClick={() => publishExisting(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100"
                      >
                        <Send className="w-4 h-4" />
                        게시
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className={`px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold ${tone.edit}`}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
                      aria-label="안내 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? '안내 수정' : '안내장 · 가정통신문 작성'}
        maxWidth="lg"
      >
        <form onSubmit={handlePublish} className="space-y-4 p-5">
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">유형</p>
            <SegmentedControl
              value={form.kind}
              options={[
                { value: 'announcement', label: '안내장' },
                { value: 'notice', label: '가정통신문' },
              ]}
              onChange={(kind) => setForm({ ...form, kind })}
              activeClassName={tone.active}
              fullWidth
              aria-label="안내 유형"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">빠른 템플릿</p>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t.id)}
                  className={`text-left p-3 min-h-[44px] rounded-xl border border-slate-200 transition-colors ${tone.softHover}`}
                >
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <FileText className={`w-3.5 h-3.5 ${accent.icon}`} />
                    {t.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">대상</p>
            <SegmentedControl
              value={form.targetMode}
              options={targetModeOptions}
              onChange={(targetMode) => setForm({ ...form, targetMode })}
              activeClassName={tone.active}
              fullWidth
              aria-label="발송 대상"
            />
          </div>

          {form.targetMode === 'class' && (
            <FormField label={labels.service.singular} required>
              <select
                required
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                className={FORM_CONTROL_CLASS}
              >
                {classes.length === 0 && (
                  <option value="">등록된 {labels.service.singular} 없음</option>
                )}
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          {form.targetMode === 'student' && (
            <FormField label={labels.customer.singular} required>
              <select
                required
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                className={FORM_CONTROL_CLASS}
              >
                {students.length === 0 && (
                  <option value="">등록된 {labels.customer.singular} 없음</option>
                )}
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <p className="text-[11px] text-slate-500">
            예상 대상 {recipientPreview.length}명 · {labels.contact.singular} 포털에만 표시됩니다
            (문자 발송 없음)
          </p>

          <FormField label="제목" required>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={FORM_CONTROL_CLASS}
              placeholder="예: 봄 행사 준비물 안내"
            />
          </FormField>

          <FormField label="내용" required>
            <textarea
              required
              rows={6}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className={FORM_CONTROL_CLASS}
              placeholder={`${labels.contact.singular}에게 전할 내용을 입력하세요`}
            />
          </FormField>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
            >
              <Save className="w-4 h-4" />
              임시저장
            </button>
            <button
              type="submit"
              className={`inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl ${accent.btn} ${accent.btnHover} text-white text-xs font-bold`}
            >
              <CheckCircle2 className="w-4 h-4" />
              포털에 게시
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
