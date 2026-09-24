/**
 * Core → Industry 의존 방향 검사.
 * 허용: Industry → Capability → Core
 * 금지: src/core → src/modules, Core의 industry schema 직접 참조
 *
 * 기존 위반은 allowlist로 기록만 하고, 새로운 위반은 실패한다.
 * 실행: npm run check:architecture
 */
import { readdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const coreRoot = join(root, 'src', 'core');

const INDUSTRY_SCHEMAS = [
  'piano',
  'pilates',
  'gym',
  'daycare',
  'skin',
  'skin_clinic',
  'retail',
  'bath',
  'sauna_jjimjbang',
];

const IMPORT_RE =
  /(?:import|export)\s+(?:type\s+)?(?:[^'"\n]+from\s+)?['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const SCHEMA_RE = new RegExp(
  `['"\`](?:${INDUSTRY_SCHEMAS.join('|')})\\.[A-Za-z_][A-Za-z0-9_]*['"\`]`,
  'g'
);

/** 이미 존재하는 위반. 대규모 리팩터 없이 위치만 고정한다. */
const ALLOWLIST = {
  'src/core/industry/registry.ts': ['modules_import'],
  'src/core/industry/IndustryAppRouter.tsx': ['modules_import'],
  'src/core/academy/components/students/StudentDetailModal.tsx': ['modules_import'],
  'src/core/academy/components/students/StudentFormModal.tsx': ['modules_import'],
  'src/core/academy/components/parents/ParentManagementView.tsx': ['modules_import'],
  'src/core/academy/components/settings/AcademySettingsView.tsx': ['modules_import'],
  'src/core/public/ReservationModal.tsx': ['modules_import'],
  'src/core/schedules/domainRoles.ts': ['industry_schema'],
};

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function toPosix(filePath) {
  return relative(root, filePath).replace(/\\/g, '/');
}

function isModulesSpecifier(spec) {
  if (!spec) return false;
  if (spec === '@/modules' || spec.startsWith('@/modules/')) return true;
  const normalized = spec.replace(/\\/g, '/');
  return /(^|\/)modules\//.test(normalized) && !normalized.includes('/src/core/');
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

function scanFile(filePath) {
  const source = readFileSync(filePath, 'utf8');
  const kinds = new Set();
  const details = [];
  for (const match of source.matchAll(IMPORT_RE)) {
    const spec = match[1] ?? match[2];
    if (isModulesSpecifier(spec)) {
      kinds.add('modules_import');
      details.push(`import ${spec}`);
    }
  }
  if (filePath.endsWith('.test.ts') || filePath.endsWith('.test.tsx')) {
    return { kinds, details };
  }
  const code = stripComments(source);
  for (const match of code.matchAll(SCHEMA_RE)) {
    kinds.add('industry_schema');
    details.push(`schema ${match[0]}`);
  }
  return { kinds, details };
}

function isAllowed(rel, kind) {
  return (ALLOWLIST[rel] ?? []).includes(kind);
}

function collectViolations(files = walk(coreRoot)) {
  const next = [];
  const known = [];
  for (const file of files) {
    const rel = toPosix(file);
    const { kinds, details } = scanFile(file);
    for (const kind of kinds) {
      const row = { file: rel, kind, details };
      if (isAllowed(rel, kind)) known.push(row);
      else next.push(row);
    }
  }
  return { next, known };
}

function printInventory(known) {
  if (known.length === 0) return;
  console.log('기존 Core → Industry 위반 (allowlist, 이번 작업에서 수정하지 않음):');
  for (const row of known) {
    console.log(`  - ${row.file} [${row.kind}] ${row.details.join('; ')}`);
  }
}

function selfTest() {
  const probe = join(coreRoot, '_architecture_probe.tmp.ts');
  writeFileSync(probe, "import { x } from '@/modules/piano/plugin';\n", 'utf8');
  try {
    const { next } = collectViolations([probe]);
    const hit = next.some(
      (row) => row.kind === 'modules_import' && row.details.some((line) => line.includes('@/modules/piano'))
    );
    if (!hit) {
      console.error('architecture self-test: 잘못된 import를 잡지 못했습니다.');
      process.exit(1);
    }
    console.log('architecture self-test: src/core → @/modules/piano import 탐지 ok');
  } finally {
    unlinkSync(probe);
  }
}

function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has('--self-test')) {
    selfTest();
    return;
  }

  const { next, known } = collectViolations();
  printInventory(known);

  if (next.length > 0) {
    console.error('\n새로운 Core → Industry 의존이 있습니다:');
    for (const row of next) {
      console.error(`  - ${row.file} [${row.kind}] ${row.details.join('; ')}`);
    }
    process.exit(1);
  }

  console.log('check-architecture-dependencies: ok');
}

main();
