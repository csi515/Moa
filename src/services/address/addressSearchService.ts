import { supabase } from '@/lib/supabase';

export interface AddressSearchResult {
  roadAddr: string;
  jibunAddr: string;
  zipNo: string;
  fullAddress: string;
  region: string;
}

export interface AddressSearchResponse {
  results: AddressSearchResult[];
  totalCount: number;
  currentPage: number;
  countPerPage: number;
}

export interface AddressSearchOptions {
  keyword: string;
  currentPage?: number;
  countPerPage?: number;
}

export async function searchKoreanAddress(
  options: AddressSearchOptions
): Promise<AddressSearchResponse> {
  const { data, error } = await supabase.functions.invoke<AddressSearchResponse>(
    'search-address',
    {
      body: {
        keyword: options.keyword,
        currentPage: options.currentPage || 1,
        countPerPage: options.countPerPage || 20,
      },
    }
  );

  if (error) {
    throw new Error(error.message || '주소 검색에 실패했습니다.');
  }

  if (!data) {
    throw new Error('주소 검색 결과가 없습니다.');
  }

  return data;
}
