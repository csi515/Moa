/** 업체 코드 변경 RPC 오류 메시지 */
export const ORGANIZATION_PUBLIC_CODE_ERROR_MESSAGES: Record<string, string> = {
  already_taken: '이미 사용 중인 업체 코드입니다.',
  invalid_format: '업체 코드 형식이 올바르지 않습니다.',
  forbidden: '업체 코드를 변경할 권한이 없습니다.',
  not_found: 'Organization을 찾을 수 없습니다.',
  not_authenticated: '로그인이 필요합니다.',
  request_failed: '업체 코드 변경에 실패했습니다.',
};

export function getOrganizationPublicCodeRpcErrorMessage(errorKey: string): string {
  return ORGANIZATION_PUBLIC_CODE_ERROR_MESSAGES[errorKey] ?? ORGANIZATION_PUBLIC_CODE_ERROR_MESSAGES.request_failed;
}
