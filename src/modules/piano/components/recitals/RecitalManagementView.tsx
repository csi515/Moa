import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { AcademyEvent } from '@/types';
import { formatPhone } from '@/utils/formatters';
import { getYouTubeWatchUrl } from '@/utils/youtube';
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Music2,
  Phone,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  Video,
  X,
} from 'lucide-react';

type EventFilter = 'upcoming' | 'past' | 'all';

const EVENT_TYPE_LABEL: Record<AcademyEvent['type'], string> = {
  concert: '연주회',
  competition: '콩쿠르',
  special_lesson: '특강',
  tuning: '조율',
  vacation: '방학',
  other: '기타',
};

export const RecitalManagementView: React.FC = () => {
  const {
    showToast,
    openConfirmDialog,
    setSelectedStudentId,
    setSelectedStudentDetailTab,
    setActiveTab,
  } = useApp();

  const [refreshKey, setRefreshKey] = useState(0);
  const [filter, setFilter] = useState<EventFilter>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');

  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formType, setFormType] = useState<'concert' | 'competition'>('concert');
  const [formDescription, setFormDescription] = useState('');

  useEffect(() => {
    const unsub = StorageService.subscribe(() => setRefreshKey((k) => k + 1));
    return unsub;
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const events = StorageService.getRecitalEvents();
  const students = StorageService.getStudents().filter((s) => s.status === 'active');

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filter === 'upcoming' && ev.startDate < today) return false;
      if (filter === 'past' && ev.startDate >= today) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return ev.title.toLowerCase().includes(q) || (ev.description || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [events, filter, searchQuery, today, refreshKey]);

  const selectedEvent = selectedEventId ? events.find((e) => e.id === selectedEventId) : null;
  const participants = selectedEvent ? StorageService.getEventParticipantSummaries(selectedEvent.id) : [];
  const eventVideos = selectedEvent ? StorageService.getPerformanceVideosByEventId(selectedEvent.id) : [];

  const stats = useMemo(() => {
    const upcoming = events.filter((e) => e.startDate >= today).length;
    const totalParticipants = events.reduce((sum, e) => sum + (e.participantIds?.length || 0), 0);
    const withVideos = StorageService.getPerformanceVideos().filter((v) => v.eventId).length;
    return { upcoming, totalParticipants, withVideos };
  }, [events, today, refreshKey]);

  const availableStudents = useMemo(() => {
    const selectedIds = new Set(selectedEvent?.participantIds || []);
    return students.filter((s) => {
      if (selectedIds.has(s.id)) return false;
      if (!participantSearch.trim()) return true;
      const q = participantSearch.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.parentName.toLowerCase().includes(q);
    });
  }, [students, selectedEvent, participantSearch]);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const saved = StorageService.saveEvent({
      title: formTitle.trim(),
      startDate: formDate,
      type: formType,
      description: formDescription.trim() || undefined,
      color: formType === 'concert' ? '#4f46e5' : '#d97706',
      participantIds: [],
    });

    showToast(`'${saved.title}' 일정이 등록되었습니다.`, 'success');
    setSelectedEventId(saved.id);
    setIsCreateOpen(false);
    setFormTitle('');
    setFormDescription('');
  };

  const handleDeleteEvent = (event: AcademyEvent) => {
    openConfirmDialog({
      title: '일정 삭제',
      message: `'${event.title}' 일정을 삭제하시겠습니까?\n참가자·영상 연결 정보는 유지되지만 일정에서 제거됩니다.`,
      isDestructive: true,
      confirmText: '삭제하기',
      onConfirm: () => {
        StorageService.deleteEvent(event.id);
        if (selectedEventId === event.id) setSelectedEventId(null);
        showToast('일정이 삭제되었습니다.', 'info');
      },
    });
  };

  const handleAddParticipant = (studentId: string) => {
    if (!selectedEvent) return;
    StorageService.addEventParticipant(selectedEvent.id, studentId);
    showToast('참가 원생이 추가되었습니다.', 'success');
    setParticipantSearch('');
  };

  const handleRemoveParticipant = (studentId: string, studentName: string) => {
    if (!selectedEvent) return;
    openConfirmDialog({
      title: '참가자 제외',
      message: `${studentName} 원생을 참가 명단에서 제외하시겠습니까?`,
      isDestructive: true,
      confirmText: '제외하기',
      onConfirm: () => {
        StorageService.removeEventParticipant(selectedEvent.id, studentId);
        showToast('참가 명단에서 제외되었습니다.', 'info');
      },
    });
  };

  const openStudentVideos = (studentId: string) => {
    setSelectedStudentDetailTab('videos');
    setSelectedStudentId(studentId);
    setActiveTab('students');
  };

  const videoCompletionRate =
    participants.length > 0
      ? Math.round((participants.filter((p) => p.hasVideo).length / participants.length) * 100)
      : 0;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-600" />
            연주회·콩쿠르 관리
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            행사 일정, 참가 원생 명단, 연주 영상 등록 현황을 한곳에서 관리합니다
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          행사 등록
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
          <p className="text-xs text-purple-700 font-semibold">예정 행사</p>
          <p className="text-2xl font-black text-purple-900">{stats.upcoming}건</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500">총 참가 등록</p>
          <p className="text-2xl font-black text-slate-900">{stats.totalParticipants}명</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
          <p className="text-xs text-emerald-700 font-semibold">행사 연결 영상</p>
          <p className="text-2xl font-black text-emerald-900">{stats.withVideos}개</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-wrap gap-2">
              {(['upcoming', 'past', 'all'] as EventFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                    filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {f === 'upcoming' ? '예정' : f === 'past' ? '지난 행사' : '전체'}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="행사명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <Music2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-600 text-sm">등록된 행사가 없습니다</p>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const count = ev.participantIds?.length || 0;
              const videos = StorageService.getPerformanceVideosByEventId(ev.id);
              const isSelected = selectedEventId === ev.id;
              return (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  className={`w-full text-left bg-white rounded-2xl border p-4 transition-all ${
                    isSelected
                      ? 'border-indigo-400 ring-2 ring-indigo-100 shadow-sm'
                      : 'border-slate-200/80 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            ev.type === 'concert'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {EVENT_TYPE_LABEL[ev.type]}
                        </span>
                        {ev.startDate >= today && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                            D-day
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-900 mt-1 text-sm">{ev.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {ev.startDate}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`} />
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {count}명
                    </span>
                    <span className="flex items-center gap-1">
                      <Video className="w-3.5 h-3.5" /> {videos.length}개 영상
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="lg:col-span-3">
          {!selectedEvent ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 h-full flex flex-col items-center justify-center">
              <Award className="w-12 h-12 text-slate-300 mb-4" />
              <p className="font-bold text-slate-600">왼쪽에서 행사를 선택하세요</p>
              <p className="text-xs text-slate-400 mt-1">참가 원생 명단과 영상 등록 현황을 확인할 수 있습니다</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        selectedEvent.type === 'concert'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {EVENT_TYPE_LABEL[selectedEvent.type]}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-2">{selectedEvent.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{selectedEvent.startDate}</p>
                    {selectedEvent.description && (
                      <p className="text-xs text-slate-600 mt-2">{selectedEvent.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                    title="일정 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-700">영상 등록률</span>
                    <span className="font-black text-indigo-700">{videoCompletionRate}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${videoCompletionRate}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {participants.filter((p) => p.hasVideo).length}/{participants.length}명 영상 등록
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      참가 원생 ({participants.length}명)
                    </h4>
                  </div>

                  {participants.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-xl">
                      아직 참가 원생이 없습니다. 아래에서 추가하세요.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {participants.map((p) => (
                        <div
                          key={p.studentId}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50/50"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{p.studentName}</span>
                              {p.level && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500">
                                  {p.level}
                                </span>
                              )}
                              {p.hasVideo ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3" /> 영상 등록
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                                  영상 미등록
                                </span>
                              )}
                            </div>
                            {p.parentPhone && (
                              <a
                                href={`tel:${p.parentPhone}`}
                                className="text-[11px] text-indigo-600 font-semibold mt-0.5 inline-flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" /> {formatPhone(p.parentPhone)}
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {p.hasVideo && p.videoId && (
                              <a
                                href={getYouTubeWatchUrl(
                                  eventVideos.find((v) => v.id === p.videoId)?.youtubeUrl || ''
                                ) || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 text-[11px] font-bold bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" /> 영상
                              </a>
                            )}
                            <button
                              onClick={() => openStudentVideos(p.studentId)}
                              className="px-2.5 py-1.5 text-[11px] font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                              {p.hasVideo ? '원생 보기' : '영상 등록'}
                            </button>
                            <button
                              onClick={() => handleRemoveParticipant(p.studentId, p.studentName)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    참가 원생 추가
                  </h4>
                  <input
                    type="text"
                    placeholder="원생명 검색..."
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl mb-2 focus:bg-white focus:outline-none"
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {availableStudents.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">추가 가능한 원생이 없습니다</p>
                    ) : (
                      availableStudents.slice(0, 8).map((st) => (
                        <button
                          key={st.id}
                          onClick={() => handleAddParticipant(st.id)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100"
                        >
                          <span className="font-semibold text-slate-800">{st.name}</span>
                          <Plus className="w-3.5 h-3.5 text-indigo-600" />
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {eventVideos.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                      <Video className="w-4 h-4 text-purple-600" />
                      등록된 연주 영상 ({eventVideos.length})
                    </h4>
                    <div className="space-y-2">
                      {eventVideos.map((video) => (
                        <div
                          key={video.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{video.studentName}</p>
                            <p className="text-slate-600 mt-0.5">{video.title}</p>
                            {video.songTitle && (
                              <p className="text-indigo-700 font-semibold mt-0.5">🎵 {video.songTitle}</p>
                            )}
                          </div>
                          <a
                            href={getYouTubeWatchUrl(video.youtubeUrl) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-indigo-600 hover:bg-white rounded-lg"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">연주회·콩쿠르 등록</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">행사명 *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="예: 2025 가을 정기 연주회"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">일정 *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">유형 *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as 'concert' | 'competition')}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="concert">연주회</option>
                    <option value="competition">콩쿠르</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">설명</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  placeholder="장소, 프로그램, 준비 사항 등"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
              >
                등록
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
