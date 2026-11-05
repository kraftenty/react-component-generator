import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

// useState와 같은 인터페이스에 localStorage 영속화를 더한다.
// 읽은 값은 parse로 검증하고, 실패하면 initial로 되돌아간다.
export function usePersistentState<T>(
  key: string,
  initial: T,
  parse?: (raw: unknown) => T | undefined,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => loadFromStorage(key, initial, parse));

  useEffect(() => {
    saveToStorage(key, value);
  }, [key, value]);

  return [value, setValue];
}
