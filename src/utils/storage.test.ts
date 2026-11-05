import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadFromStorage, saveToStorage } from './storage';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('saveToStorage / loadFromStorage', () => {
  it('저장한 값을 JSON으로 읽어온다', () => {
    saveToStorage('k', { a: 1 });
    expect(loadFromStorage('k', null)).toEqual({ a: 1 });
  });

  it('키가 없으면 fallback을 돌려준다', () => {
    expect(loadFromStorage('missing', 'fb')).toBe('fb');
  });

  it('JSON이 깨져 있으면 fallback을 돌려준다', () => {
    localStorage.setItem('k', '{broken');
    expect(loadFromStorage('k', 'fb')).toBe('fb');
  });

  it('parse가 undefined를 돌려주면(검증 실패) fallback을 돌려준다', () => {
    saveToStorage('k', 123);
    expect(loadFromStorage('k', 'fb', () => undefined)).toBe('fb');
  });

  it('parse가 값을 돌려주면 그 값을 쓴다', () => {
    saveToStorage('k', 2);
    expect(loadFromStorage('k', 0, (raw) => (raw as number) * 10)).toBe(20);
  });

  it('localStorage 읽기가 예외를 던지면 fallback을 돌려준다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(loadFromStorage('k', 'fb')).toBe('fb');
  });

  it('localStorage 쓰기가 예외를 던져도 save는 예외를 전파하지 않는다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => saveToStorage('k', 'v')).not.toThrow();
  });
});
