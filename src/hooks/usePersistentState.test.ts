import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistentState } from './usePersistentState';

describe('usePersistentState', () => {
  it('저장된 값이 있으면 초기값으로 복원한다', () => {
    localStorage.setItem('k', JSON.stringify('saved'));
    const { result } = renderHook(() => usePersistentState('k', 'initial'));
    expect(result.current[0]).toBe('saved');
  });

  it('저장된 값이 없으면 initial을 쓴다', () => {
    const { result } = renderHook(() => usePersistentState('k', 'initial'));
    expect(result.current[0]).toBe('initial');
  });

  it('값을 바꾸면 localStorage에 저장한다', () => {
    const { result } = renderHook(() => usePersistentState('k', 'initial'));
    act(() => result.current[1]('next'));
    expect(JSON.parse(localStorage.getItem('k')!)).toBe('next');
  });

  it('함수형 업데이트를 지원한다', () => {
    const { result } = renderHook(() => usePersistentState('k', 1));
    act(() => result.current[1]((prev) => prev + 1));
    expect(result.current[0]).toBe(2);
    expect(JSON.parse(localStorage.getItem('k')!)).toBe(2);
  });

  it('parse 검증에 실패한 저장값은 무시하고 initial을 쓴다', () => {
    localStorage.setItem('k', JSON.stringify(123));
    const { result } = renderHook(() =>
      usePersistentState('k', 'initial', (raw) => (typeof raw === 'string' ? raw : undefined)),
    );
    expect(result.current[0]).toBe('initial');
  });
});
