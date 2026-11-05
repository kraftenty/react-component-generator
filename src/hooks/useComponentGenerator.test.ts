import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';
import { STORAGE_KEYS } from '../utils/storage';

afterEach(() => {
  vi.unstubAllGlobals();
});

const stored = [{ id: '1', prompt: 'p', code: 'c', createdAt: '2026-11-05T01:02:03.000Z' }];

describe('useComponentGenerator 영속화', () => {
  it('저장된 컴포넌트 목록을 복원하고 createdAt을 Date로 되살린다', () => {
    localStorage.setItem(STORAGE_KEYS.components, JSON.stringify(stored));
    const { result } = renderHook(() => useComponentGenerator());
    expect(result.current.components).toHaveLength(1);
    expect(result.current.components[0].createdAt).toBeInstanceOf(Date);
  });

  it('컴포넌트를 생성하면 localStorage에 저장한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ code: 'render(<div/>)' }) }),
    );
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('새 요청', undefined, 'google');
    });

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.components)!);
      expect(saved).toHaveLength(1);
      expect(saved[0]).toMatchObject({ prompt: '새 요청', code: 'render(<div/>)' });
    });
  });

  it('전체 삭제하면 저장된 목록도 비운다', () => {
    localStorage.setItem(STORAGE_KEYS.components, JSON.stringify(stored));
    const { result } = renderHook(() => useComponentGenerator());
    act(() => result.current.clearAll());
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.components)!)).toEqual([]);
  });
});
