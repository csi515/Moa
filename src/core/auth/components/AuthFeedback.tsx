import { AlertCircle, CheckCircle2 } from 'lucide-react';

/** 로그인 폼 성공/오류 메시지 */
export function AuthFeedback({
  error,
  info,
}: {
  error: string | null;
  info: string | null;
}) {
  if (!error && !info) return null;

  return (
    <>
      {error && (
        <div
          role="alert"
          className="flex gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-700 leading-relaxed"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
          <span>{error}</span>
        </div>
      )}
      {info && (
        <div
          role="status"
          className="flex gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-800 leading-relaxed"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
          <span>{info}</span>
        </div>
      )}
    </>
  );
}
