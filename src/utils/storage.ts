export const STORAGE_KEYS = {
  apiKey: 'rcg:apiKey',
  provider: 'rcg:provider',
  promptHistory: 'rcg:promptHistory',
  components: 'rcg:components',
} as const;

// localStorage는 비공개 모드, 용량 초과, 손상된 값 등으로 언제든 실패할 수 있다.
// 저장소 문제로 앱이 깨지지 않도록 모든 접근을 보호하고 실패하면 fallback을 쓴다.
export function loadFromStorage<T>(
  key: string,
  fallback: T,
  parse?: (raw: unknown) => T | undefined,
): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    const raw: unknown = JSON.parse(stored);
    if (!parse) return raw as T;
    const parsed = parse(raw);
    return parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 실패는 무시한다. 상태는 메모리에서 계속 유지된다.
  }
}
