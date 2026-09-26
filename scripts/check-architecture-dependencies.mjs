/**
 * 계층 의존 방향 검사.
 *
 * 허용: core→core, capability→core, industry→capability|core,
 *       composition→industry|capability|core
 * 금지: core→industry|modules|composition|capability,
 *       capability→industry|modules
 *
 * 기존 위반은 LEGACY allowlist. 신규 위반은 즉시 실패.
 * 실행: npm run check:architecture
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const srcRoot = join(root, 'src');

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

/**
 * 현재 코드 위치의 LEGACY 위반. 새로 넣지 않는다. 고치면 이 목록에서 뺀다.
 * kind: modules_import | industry_schema | layer_import
 */
export const LEGACY_ALLOWLIST = {
  'src/capabilities/attendance/domain/pinAttendanceValidation.ts': {
    kinds: ['storage_service_import'],
    reason: 'LEGACY StorageService — 신규는 attendanceStorage facade',
  },
  'src/capabilities/attendance/ui/AttendanceManagementView.tsx': {
    kinds: ['storage_service_import'],
    reason: 'LEGACY StorageService — 신규는 attendanceStorage facade',
  },
  'src/capabilities/attendance/ui/CustomerPinPanel.tsx': {
    kinds: ['storage_service_import'],
    reason: 'LEGACY StorageService — 신규는 attendanceStorage facade',
  },
  'src/capabilities/attendance/ui/PinCheckInKioskView.tsx': {
    kinds: ['storage_service_import'],
    reason: 'LEGACY StorageService — 신규는 attendanceStorage facade',
  },
  'src/capabilities/billing/finance/billingLinkageValidation.ts': {
    kinds: ['storage_service_import'],
    reason: 'LEGACY StorageService — 신규는 billingStorage facade',
  },
  'src/capabilities/billing/finance/combinedPaymentAtomic.ts': {
    kinds: ['storage_service_import'],
    reason: 'LEGACY StorageService — 신규는 billingStorage facade',
  },
  'src/capabilities/billing/finance/combinedPaymentLocal.ts': {
    kinds: ['storage_service_import'],
    reason: 'LEGACY StorageService — 신규는 billingStorage facade',
  },
  'src/capabilities/billing/finance/tuitionPaymentAtomic.ts': {
    kinds: ['storage_service_import'],
    reason: 'LEGACY StorageService — 신규는 billingStorage facade',
  },
  'src/capabilities/billing/finance/components/ExpenseManagementView.tsx': {
    kinds: ['storage_service_import'],
    reason: 'LEGACY StorageService — 신규는 billingStorage facade',
  },
  'src/capabilities/billing/finance/components/FinanceOverviewView.tsx': {
    kinds: ['storage_service_import'],
    reason: 'LEGACY StorageService — 신규는 billingStorage facade',
  },
  'src/capabilities/billing/finance/components/IncomeManagementView.tsx': {
    kinds: ['storage_service_import'],
    reason: 'LEGACY StorageService — 신규는 billingStorage facade',
  },
  'src/capabilities/billing/finance/components/useTeacherPayroll.ts': {
    kinds: ['storage_service_import'],
    reason: 'LEGACY StorageService — 신규는 billingStorage facade',
  },
  'src/capabilities/billing/finance/services/tuitionService.ts': {
    kinds: ['storage_service_import'],
    reason: 'LEGACY StorageService — 신규는 billingStorage facade',
  },
  'src/services/storage/textbookStorage.ts': {
    kinds: ['layer_import'],
    reason: 'LEGACY textbook factory → piano sale service',
  },
  'src/services/storage/textbookSalesStorage.ts': {
    kinds: ['layer_import'],
    reason: 'LEGACY textbook sales persist → piano db/legacy',
  },
  'src/services/storage/textbookCatalogStorage.ts': {
    kinds: ['layer_import'],
    reason: 'LEGACY textbook catalog → piano stock/persist',
  },
  'src/services/adapters/sync/daycareEntitySync.ts': {
    kinds: ['layer_import'],
    reason: 'LEGACY daycare sync mapper types',
  },
  'src/services/adapters/sync/daycareEntityMappers.ts': {
    kinds: ['layer_import'],
    reason: 'LEGACY daycare sync mapper types',
  },
  'src/services/adapters/sync/daycareOpsMappers.ts': {
    kinds: ['layer_import'],
    reason: 'LEGACY daycare ops mapper types',
  },
  'src/services/adapters/sync/pianoEntitySync.ts': {
    kinds: ['layer_import'],
    reason: 'LEGACY piano textbook sale merge in sync',
  },
  'src/services/storage/eventsStorage.ts': {
    kinds: ['layer_import'],
    reason: 'LEGACY events labels → piano eventLabels',
  },
};

const FORBIDDEN_FROM = {
  core: new Set(['industry', 'capability', 'composition']),
  capability: new Set(['industry', 'composition']),
  infrastructure: new Set(['industry']),
};

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name) && !/\.tmp\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function toPosix(filePath) {
  return relative(root, filePath).replace(/\\/g, '/');
}

function layerOfRel(rel) {
  if (rel.startsWith('src/core/')) return 'core';
  if (rel.startsWith('src/capabilities/')) return 'capability';
  if (rel.startsWith('src/industries/') || rel.startsWith('src/modules/')) return 'industry';
  if (rel.startsWith('src/app/')) return 'composition';
  if (rel.startsWith('src/services/')) return 'infrastructure';
  return null;
}

function isModulesSpecifier(spec) {
  if (!spec) return false;
  if (spec === '@/modules' || spec.startsWith('@/modules/')) return true;
  const normalized = spec.replace(/\\/g, '/');
  return /(^|\/)modules\//.test(normalized) && !normalized.includes('/src/core/');
}

function specifierLayer(spec) {
  if (!spec || spec.startsWith('.') ) {
    return null;
  }
  if (spec === '@/core' || spec.startsWith('@/core/')) return 'core';
  if (spec === '@/capabilities' || spec.startsWith('@/capabilities/')) return 'capability';
  if (spec === '@/industries' || spec.startsWith('@/industries/')) return 'industry';
  if (spec === '@/app' || spec.startsWith('@/app/')) return 'composition';
  if (isModulesSpecifier(spec)) return 'industry';
  return null;
}

function relativeSpecifierLayer(fromRel, spec) {
  if (!spec || !spec.startsWith('.')) return null;
  const fromDir = dirname(join(root, fromRel));
  const resolved = toPosix(join(fromDir, spec));
  return layerOfRel(resolved);
}

function isCapabilityCompatShim(source) {
  return source.includes('@deprecated 신규 코드는') && /from ['"]@\/capabilities\//.test(source);
}

function isLegacyAttendanceSpec(spec) {
  return spec === '@/core/attendance' || (typeof spec === 'string' && spec.startsWith('@/core/attendance/'));
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

function isTestFile(filePath) {
  return /\.test\.(ts|tsx)$/.test(filePath);
}

function scanFile(filePath) {
  const kinds = new Set();
  const details = [];
  if (isTestFile(filePath)) {
    return { kinds, details };
  }

  const rel = toPosix(filePath);
  const fromLayer = layerOfRel(rel);
  const source = readFileSync(filePath, 'utf8');

  const specs = new Set();
  for (const match of source.matchAll(IMPORT_RE)) {
    const spec = match[1] ?? match[2];
    if (spec) specs.add(spec);
  }
  for (const match of source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)) {
    specs.add(match[1]);
  }

  for (const spec of specs) {
    if (isModulesSpecifier(spec) && (fromLayer === 'core' || fromLayer === 'capability')) {
      kinds.add('modules_import');
      details.push(`import ${spec}`);
      continue;
    }
    if (
      (fromLayer === 'industry' || fromLayer === 'composition' || fromLayer === 'capability') &&
      isLegacyAttendanceSpec(spec)
    ) {
      kinds.add('legacy_core_attendance');
      details.push(`legacy ${spec}`);
    }
    if (fromLayer === 'capability' && spec === '@/services/storage') {
      kinds.add('storage_service_import');
      details.push(`legacy StorageService (${spec})`);
    }
    const toLayer = specifierLayer(spec) ?? relativeSpecifierLayer(rel, spec);
    if (fromLayer && toLayer && FORBIDDEN_FROM[fromLayer]?.has(toLayer)) {
      if (fromLayer === 'core' && toLayer === 'capability' && isCapabilityCompatShim(source)) {
        continue;
      }
      kinds.add('layer_import');
      details.push(`layer ${fromLayer} → ${toLayer} (${spec})`);
    }
  }

  if (fromLayer === 'core') {
    const code = stripComments(source);
    for (const match of code.matchAll(SCHEMA_RE)) {
      kinds.add('industry_schema');
      details.push(`schema ${match[0]}`);
    }
  }

  return { kinds, details };
}

function isAllowed(rel, kind) {
  return (LEGACY_ALLOWLIST[rel]?.kinds ?? []).includes(kind);
}

function collectRoots() {
  const files = [];
  walk(join(srcRoot, 'core'), files);
  walk(join(srcRoot, 'capabilities'), files);
  walk(join(srcRoot, 'industries'), files);
  walk(join(srcRoot, 'app'), files);
  walk(join(srcRoot, 'services'), files);
  return files;
}

function collectViolations(files = collectRoots()) {
  const next = [];
  const known = [];
  for (const file of files) {
    const rel = toPosix(file);
    const { kinds, details } = scanFile(file);
    for (const kind of kinds) {
      const row = { file: rel, kind, details, legacy: isAllowed(rel, kind) };
      if (row.legacy) known.push(row);
      else next.push(row);
    }
  }
  return { next, known };
}

function legacyKey(file, kind) {
  return `${file}::${kind}`;
}

function expectedLegacyKeys() {
  const keys = [];
  for (const [file, meta] of Object.entries(LEGACY_ALLOWLIST)) {
    for (const kind of meta.kinds) keys.push(legacyKey(file, kind));
  }
  return keys.sort();
}

function assertLegacyFrozen(known) {
  const actual = [...new Set(known.map((row) => legacyKey(row.file, row.kind)))].sort();
  const expected = expectedLegacyKeys();
  const missing = expected.filter((key) => !actual.includes(key));
  const extra = actual.filter((key) => !expected.includes(key));
  if (missing.length > 0) {
    console.error('LEGACY allowlist에 있으나 실제 위반이 없습니다. 항목을 제거하세요:');
    for (const key of missing) console.error(`  - ${key}`);
    process.exit(1);
  }
  if (extra.length > 0) {
    console.error('LEGACY 스냅샷에 없는 기존 위반이 있습니다. allowlist를 갱신하지 말고 신규로 처리하세요:');
    for (const key of extra) console.error(`  - ${key}`);
    process.exit(1);
  }
}

function printInventory(known) {
  if (known.length === 0) return;
  console.log('LEGACY Core/계층 위반 (신규 추가 금지, 수정 시 allowlist에서 제거):');
  for (const row of known) {
    const reason = LEGACY_ALLOWLIST[row.file]?.reason ?? '';
    console.log(`  - ${row.file} [${row.kind}] ${reason}`);
  }
}

function writeProbe(dir, name, source) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const probe = join(dir, name);
  writeFileSync(probe, source, 'utf8');
  return probe;
}

function selfTest() {
  const coreProbe = writeProbe(
    join(srcRoot, 'core'),
    '_architecture_probe.tmp.ts',
    "import { x } from '@/industries/piano/plugin';\n"
  );
  const capDir = join(srcRoot, 'capabilities', '_shared');
  const capProbe = writeProbe(
    capDir,
    '_architecture_probe.tmp.ts',
    "import { x } from '@/industries/piano/plugin';\n"
  );
  const capToIndustry = writeProbe(
    capDir,
    '_architecture_probe_ind.tmp.ts',
    "import { x } from '@/industries/piano/plugin';\n"
  );
  const industryDir = join(srcRoot, 'industries', 'piano');
  const legacyAttProbe = writeProbe(
    industryDir,
    '_architecture_probe.tmp.ts',
    "import { x } from '@/core/attendance';\n"
  );
  const servicesDir = join(srcRoot, 'services');
  const servicesProbe = writeProbe(
    servicesDir,
    '_architecture_probe.tmp.ts',
    "import { x } from '@/industries/daycare/care/careStorage';\n"
  );
  const capStorageProbe = writeProbe(
    capDir,
    '_architecture_probe_storage.tmp.ts',
    "import { StorageService } from '@/services/storage';\n"
  );
  try {
    const { next } = collectViolations([
      coreProbe,
      capProbe,
      capToIndustry,
      legacyAttProbe,
      servicesProbe,
      capStorageProbe,
    ]);
    const coreHit = next.some(
      (row) =>
        row.kind === 'layer_import' &&
        row.details.some((line) => line.includes('@/industries/piano'))
    );
    const capHit = next.some(
      (row) =>
        row.file.includes('capabilities') &&
        (row.kind === 'modules_import' || row.kind === 'layer_import')
    );
    const legacyAttHit = next.some((row) => row.kind === 'legacy_core_attendance');
    const servicesHit = next.some(
      (row) =>
        row.kind === 'layer_import' &&
        row.details.some((line) => line.includes('@/industries/daycare'))
    );
    const storageHit = next.some((row) => row.kind === 'storage_service_import');
    if (!coreHit || !capHit || !legacyAttHit || !servicesHit || !storageHit) {
      console.error('architecture self-test: 계층 위반을 잡지 못했습니다.');
      process.exit(1);
    }
    console.log(
      'architecture self-test: core→industry / capability→industry / services→industry / StorageService / legacy attendance 탐지 ok'
    );
  } finally {
    unlinkSync(coreProbe);
    unlinkSync(capProbe);
    unlinkSync(capToIndustry);
    unlinkSync(legacyAttProbe);
    unlinkSync(servicesProbe);
    unlinkSync(capStorageProbe);
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
  assertLegacyFrozen(known);

  if (next.length > 0) {
    console.error('\n새로운 계층 의존 위반이 있습니다:');
    for (const row of next) {
      console.error(`  - ${row.file} [${row.kind}] ${row.details.join('; ')}`);
    }
    process.exit(1);
  }

  console.log('check-architecture-dependencies: ok');
}

main();
