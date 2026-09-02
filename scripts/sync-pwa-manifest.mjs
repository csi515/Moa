#!/usr/bin/env node
/**
 * @capacitor/assets가 manifest.json을 덮어쓰지 않도록 PWA manifest를 고정합니다.
 * Usage: node scripts/sync-pwa-manifest.mjs
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'public', 'manifest.json');

const manifest = {
  name: 'Moa — 학원·체육관·어린이집 통합 관리',
  short_name: 'Moa',
  description: '원생·출결·수납·강사·학부모 포털을 한곳에서 관리하는 올인원 SaaS',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'portrait-primary',
  background_color: '#4f46e5',
  theme_color: '#4f46e5',
  icons: [
    {
      src: 'icons/icon-192.png',
      type: 'image/png',
      sizes: '192x192',
      purpose: 'maskable',
    },
    {
      src: 'icons/icon-512.png',
      type: 'image/png',
      sizes: '512x512',
      purpose: 'maskable',
    },
    {
      src: 'icons/icon-512.png',
      type: 'image/png',
      sizes: '512x512',
      purpose: 'any',
    },
  ],
};

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('synced', manifestPath);
