-- core/piano 스키마에 이후 추가된 테이블에 authenticated GRANT 누락 보완
-- (초기 ALL TABLES GRANT 이후 생성된 테이블)

-- Core
GRANT SELECT, INSERT, UPDATE, DELETE ON core.expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.income_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.attendance_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.guardian_link_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.org_parent_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.parent_student_guardians TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.parent_student_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.parents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.student_enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.students TO authenticated;

-- Piano (education/events 등 후속 마이그레이션 테이블)
GRANT SELECT, INSERT, UPDATE, DELETE ON piano.events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON piano.expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON piano.performance_videos TO authenticated;
