import type { GeneratedComponent, Provider } from '../types';

const PROVIDERS: readonly Provider[] = ['anthropic', 'google'];

export function parseString(raw: unknown): string | undefined {
  return typeof raw === 'string' ? raw : undefined;
}

export function parseProvider(raw: unknown): Provider | undefined {
  return PROVIDERS.find((provider) => provider === raw);
}

export function parseStringArray(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw) || !raw.every((item) => typeof item === 'string')) {
    return undefined;
  }
  return raw;
}

// JSON에는 Date가 없어 createdAt이 문자열로 저장된다. 읽을 때 Date로 복원한다.
export function parseComponents(raw: unknown): GeneratedComponent[] | undefined {
  if (!Array.isArray(raw)) return undefined;

  const result: GeneratedComponent[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) return undefined;
    const { id, prompt, code, createdAt } = item as Record<string, unknown>;
    if (typeof id !== 'string' || typeof prompt !== 'string' || typeof code !== 'string') {
      return undefined;
    }
    if (typeof createdAt !== 'string') return undefined;
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return undefined;
    result.push({ id, prompt, code, createdAt: date });
  }
  return result;
}
