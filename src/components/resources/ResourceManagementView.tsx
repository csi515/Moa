import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { StudentLevel } from '../../types';
import { getLevelColor } from '../../utils/formatters';
import {
  Music2,
  Plus,
  Search,
  BookOpen,
  Trophy,
  Sparkles,
  ExternalLink,
  Trash2,
  X,
  Save,
  CheckCircle2
} from 'lucide-react';

interface PianoResource {
  id: string;
  title: string;
  composer?: string;
  publisher?: string;
  level: StudentLevel;
  type: 'textbook' | 'repertoire' | 'competition' | 'theory';
  description?: string;
  difficultyStars: number;
}

const DEFAULT_RESOURCES: PianoResource[] = [
  {
    id: 'res-1',
    title: '어린이 바이엘 상/하권',
    composer: 'Ferdinand Beyer',
    publisher: '세광음악출판사',
    level: '바이엘 상',
    type: 'textbook',
    description: '초보 피아노 입문자를 위한 양손 기초 교재',
    difficultyStars: 1
  },
  {
    id: 'res-2',
    title: '체르니 100번 연습곡 (Op.599)',
    composer: 'Carl Czerny',
    publisher: '삼호뮤직',
    level: '체르니 100',
    type: 'textbook',
    description: '기초 테크닉과 손가락 독립을 위한 100개의 연습곡',
    difficultyStars: 2
  },
  {
    id: 'res-3',
    title: '체르니 30번 (Op.849)',
    composer: 'Carl Czerny',
    publisher: '음악춘추',
    level: '체르니 30',
    type: 'textbook',
    description: '중급 피아노 기교와 속도 연습을 위한 30곡',
    difficultyStars: 3
  },
  {
    id: 'res-4',
    title: '소나티네 앨범 1권',
    composer: 'Kuhlau, Clementi 외',
    publisher: '세광음악',
    level: '소나티네/명곡',
    type: 'repertoire',
    description: '클래식 소나타 형식 입문 및 리듬감 훈련',
    difficultyStars: 3
  },
  {
    id: 'res-5',
    title: '엘리제를 위하여 (Für Elise)',
    composer: 'L. v. Beethoven',
    publisher: '명곡집',
    level: '소나티네/명곡',
    type: 'repertoire',
    description: '학예회 및 정기연주회 인기 레퍼토리',
    difficultyStars: 2
  },
  {
    id: 'res-6',
    title: '쇼팽 즉흥환상곡 Op.66',
    composer: 'Frédéric Chopin',
    publisher: 'Paderewski Edition',
    level: '작품집/쇼팽',
    type: 'competition',
    description: '폴리리듬 4:3 훈련 및 콩쿠르 자유곡',
    difficultyStars: 5
  },
  {
    id: 'res-7',
    title: '부르크뮐러 25개 연습곡 (Op.100)',
    composer: 'J. F. Burgmüller',
    publisher: '음악세계',
    level: '체르니 100',
    type: 'textbook',
    description: '아라베스크, 목가, 귀부인의 승마 등 표제 음악 연습',
    difficultyStars: 2
  }
];

export const ResourceManagementView: React.FC = () => {
  const { showToast } = useApp();

  const [resources, setResources] = useState<PianoResource[]>(() => {
    const saved = localStorage.getItem('piano_app_resources');
    return saved ? JSON.parse(saved) : DEFAULT_RESOURCES;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<PianoResource, 'id'>>({
    title: '',
    composer: '',
    publisher: '',
    level: '체르니 100',
    type: 'textbook',
    description: '',
    difficultyStars: 3
  });

  const saveToStorage = (updated: PianoResource[]) => {
    setResources(updated);
    localStorage.setItem('piano_app_resources', JSON.stringify(updated));
  };

  const filtered = resources.filter((r) => {
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
    if (levelFilter !== 'ALL' && r.level !== levelFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!r.title.toLowerCase().includes(q) && !(r.composer && r.composer.toLowerCase().includes(q))) {
        return false;
      }
    }
    return true;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const newRes: PianoResource = {
      id: `res-${Date.now()}`,
      ...formData
    };
    saveToStorage([newRes, ...resources]);
    showToast(`'${formData.title}' 교재/곡이 등록되었습니다.`, 'success');
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    saveToStorage(resources.filter((r) => r.id !== id));
    showToast('삭제되었습니다.', 'info');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Music2 className="w-6 h-6 text-indigo-600" />
            교재 및 피아노 곡 관리
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            레벨별 추천 교재, 연주회 레퍼토리, 콩쿠르 지정곡 아카이브
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          교재/곡 추가
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
          >
            <option value="ALL">전체 구분</option>
            <option value="textbook">정규 교재</option>
            <option value="repertoire">명곡/레퍼토리</option>
            <option value="competition">콩쿠르/연주곡</option>
            <option value="theory">음악이론</option>
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          >
            <option value="ALL">전체 레벨</option>
            <option value="바이엘 상">바이엘 상</option>
            <option value="바이엘 하">바이엘 하</option>
            <option value="체르니 100">체르니 100</option>
            <option value="체르니 30">체르니 30</option>
            <option value="소나티네/명곡">소나티네/명곡</option>
            <option value="작품집/쇼팽">작품집/쇼팽</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="교재명, 작곡가, 출판사 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          등록된 자료: <strong className="text-indigo-600 font-bold">{filtered.length}개</strong>
        </span>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${getLevelColor(item.level)}`}>
                  {item.level}
                </span>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 text-slate-300 hover:text-rose-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-3">
                <h3 className="font-bold text-base text-slate-900 leading-snug">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  작곡: <strong>{item.composer || '미상'}</strong> {item.publisher && `| 출판: ${item.publisher}`}
                </p>
              </div>

              {item.description && (
                <p className="text-xs text-slate-600 mt-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">
                난이도: {'⭐'.repeat(item.difficultyStars)}
              </span>
              <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                {item.type === 'textbook' ? '정규교재' : item.type === 'competition' ? '콩쿠르곡' : '명곡'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">교재 / 악보 추가</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  교재 / 곡명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 하농 60개 연습곡"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">작곡가</label>
                  <input
                    type="text"
                    placeholder="예: C. L. Hanon"
                    value={formData.composer}
                    onChange={(e) => setFormData({ ...formData, composer: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">출판사</label>
                  <input
                    type="text"
                    placeholder="예: 삼호뮤직"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">권장 레벨</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="바이엘 상">바이엘 상</option>
                    <option value="바이엘 하">바이엘 하</option>
                    <option value="체르니 100">체르니 100</option>
                    <option value="체르니 30">체르니 30</option>
                    <option value="체르니 40">체르니 40</option>
                    <option value="소나티네/명곡">소나티네/명곡</option>
                    <option value="작품집/쇼팽">작품집/쇼팽</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">자료 분류</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="textbook">정규 교재</option>
                    <option value="repertoire">명곡집</option>
                    <option value="competition">콩쿠르곡</option>
                    <option value="theory">이론교재</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">설명 및 특징</label>
                <textarea
                  rows={2}
                  placeholder="교재의 특징이나 추천 이유..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md"
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
