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
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-700">
          {error}
        </div>
      )}
      {info && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-800">
          {info}
        </div>
      )}
    </>
  );
}
