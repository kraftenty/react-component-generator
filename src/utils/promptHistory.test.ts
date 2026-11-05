import { describe, it, expect } from 'vitest';
import { addToPromptHistory, MAX_HISTORY } from './promptHistory';

describe('addToPromptHistory', () => {
  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addToPromptHistory(['a'], 'b')).toEqual(['b', 'a']);
  });
  it('이미 있는 프롬프트는 중복 없이 맨 앞으로 옮긴다', () => {
    expect(addToPromptHistory(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b']);
  });
  it('최대 개수를 넘으면 가장 오래된 항목을 버린다', () => {
    const full = Array.from({ length: MAX_HISTORY }, (_, i) => `p${i}`);
    const result = addToPromptHistory(full, 'new');
    expect(result).toHaveLength(MAX_HISTORY);
    expect(result[0]).toBe('new');
    expect(result).not.toContain(`p${MAX_HISTORY - 1}`);
  });
  it('공백뿐인 프롬프트는 무시한다', () => {
    expect(addToPromptHistory(['a'], '   ')).toEqual(['a']);
  });
  it('원본 배열을 변경하지 않는다', () => {
    const original = ['a'];
    addToPromptHistory(original, 'b');
    expect(original).toEqual(['a']);
  });
});
