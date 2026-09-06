import { useState, useCallback } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import type { AddressSearchResult } from '@/services/address/addressSearchService';
import { searchKoreanAddress } from '@/services/address/addressSearchService';
import { useToast } from '@/shared/hooks/useToast';

interface AddressSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: AddressSearchResult) => void;
}

export function AddressSearchModal({ isOpen, onClose, onSelect }: AddressSearchModalProps) {
  const { showToast } = useToast();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) {
      showToast('검색어를 입력해 주세요.', 'warning');
      return;
    }

    if (keyword.length < 2) {
      showToast('검색어는 2자 이상 입력해 주세요.', 'warning');
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchKoreanAddress({ keyword: keyword.trim(), countPerPage: 50 });
      setResults(response.results);
      setTotalCount(response.totalCount);
      
      if (response.results.length === 0) {
        showToast('검색 결과가 없습니다. 다른 검색어를 입력해 주세요.', 'info');
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : '주소 검색에 실패했습니다.',
        'error'
      );
      setResults([]);
      setTotalCount(0);
    } finally {
      setIsSearching(false);
    }
  }, [keyword, showToast]);

  const handleSelectAddress = (address: AddressSearchResult) => {
    onSelect(address);
    onClose();
    setKeyword('');
    setResults([]);
    setTotalCount(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">주소 검색</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="도로명, 건물명 또는 지번 입력"
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                autoFocus
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !keyword.trim()}
              className="px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              {isSearching ? '검색 중...' : '검색'}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            예: "판교역로 235", "분당구 정자동", "강남대로 123"
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {results.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 mb-3">
                총 <span className="font-bold text-indigo-600">{totalCount.toLocaleString()}</span>건 중{' '}
                <span className="font-bold">{results.length}</span>건 표시
              </p>
              {results.map((address, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectAddress(address)}
                  className="w-full text-left p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded">
                          {address.zipNo}
                        </span>
                        {address.region && (
                          <span className="text-xs text-slate-500">{address.region}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-800 mb-1">{address.roadAddr}</p>
                      {address.jibunAddr && (
                        <p className="text-xs text-slate-500">지번: {address.jibunAddr}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">
                {isSearching ? '검색 중...' : '도로명 또는 지번 주소를 검색해 주세요.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
