import { syncAuthProvidersOnLogin } from '../auth/services/authProviderService';
import { connectParentOnLogin } from '../parent/services/parentAccountService';
import { connectStaffOnLogin } from '../staff/services/staffAccountService';

/** 로그인 시 계정 연결 RPC를 일관된 순서로 실행 */
export async function runLoginAccountSync(): Promise<void> {
  await connectStaffOnLogin();
  await syncAuthProvidersOnLogin();
  await connectParentOnLogin();
}
