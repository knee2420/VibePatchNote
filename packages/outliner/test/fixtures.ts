/**
 * @file fixtures.ts
 * @description 테스트용 견본 보관함(sample-vault)을 "경로 -> 글자" 묶음으로 읽는다.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_VAULT = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'sample-vault');

export function readSampleVault(): Record<string, string> {
  const files: Record<string, string> = {};
  const walk = (dir: string, prefix: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = `${prefix}${entry.name}`;
      if (entry.isDirectory()) walk(join(dir, entry.name), `${path}/`);
      else files[path] = readFileSync(join(dir, entry.name), 'utf8');
    }
  };
  walk(SAMPLE_VAULT, '');
  return files;
}
