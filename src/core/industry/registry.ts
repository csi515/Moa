import type { IndustryType, IndustryOption } from './types';
import type { IndustryPluginManifest } from './pluginTypes';
import { pianoPluginManifest } from '@/modules/piano/plugin';
import { pilatesPluginManifest } from '@/modules/pilates/plugin';
import { gymPluginManifest } from '@/modules/gym/plugin';
import { daycarePluginManifest } from '@/modules/daycare/plugin';

/** 등록된 업종 플러그인 (추가 시 여기에만 등록) */
export const INDUSTRY_PLUGINS: IndustryPluginManifest[] = [
  pianoPluginManifest,
  pilatesPluginManifest,
  gymPluginManifest,
  daycarePluginManifest,
];

const BY_ID = Object.fromEntries(INDUSTRY_PLUGINS.map((p) => [p.id, p])) as Record<
  IndustryType,
  IndustryPluginManifest
>;

const ALIAS_TO_ID: Record<string, IndustryType> = {};
for (const plugin of INDUSTRY_PLUGINS) {
  for (const alias of plugin.aliases ?? []) {
    ALIAS_TO_ID[alias] = plugin.id;
  }
}

export function getIndustryPlugin(
  industry: IndustryType | string | null | undefined
): IndustryPluginManifest {
  if (!industry) return BY_ID.piano;
  if (industry in BY_ID) return BY_ID[industry as IndustryType];
  if (industry in ALIAS_TO_ID) return BY_ID[ALIAS_TO_ID[industry]];
  return BY_ID.piano;
}

export function listIndustryOptions(): IndustryOption[] {
  return INDUSTRY_PLUGINS.map((p) => p.option);
}

export function listIndustryIds(): IndustryType[] {
  return INDUSTRY_PLUGINS.map((p) => p.id);
}
