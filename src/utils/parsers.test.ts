import { describe, it, expect } from 'vitest';
import { parseString, parseProvider, parseStringArray, parseComponents } from './parsers';

describe('parseString', () => {
  it('문자열이면 그대로 돌려준다', () => {
    expect(parseString('abc')).toBe('abc');
  });
  it('문자열이 아니면 undefined', () => {
    expect(parseString(1)).toBeUndefined();
  });
});

describe('parseProvider', () => {
  it('허용된 provider 값만 돌려준다', () => {
    expect(parseProvider('anthropic')).toBe('anthropic');
    expect(parseProvider('google')).toBe('google');
  });
  it('알 수 없는 값이면 undefined', () => {
    expect(parseProvider('openai')).toBeUndefined();
  });
});

describe('parseStringArray', () => {
  it('문자열 배열이면 그대로 돌려준다', () => {
    expect(parseStringArray(['a', 'b'])).toEqual(['a', 'b']);
  });
  it('문자열이 아닌 요소가 섞이면 undefined', () => {
    expect(parseStringArray(['a', 1])).toBeUndefined();
  });
  it('배열이 아니면 undefined', () => {
    expect(parseStringArray('a')).toBeUndefined();
  });
});

describe('parseComponents', () => {
  const raw = [{ id: '1', prompt: 'p', code: 'c', createdAt: '2026-11-05T01:02:03.000Z' }];

  it('createdAt 문자열을 Date로 복원한다', () => {
    const result = parseComponents(raw);
    expect(result?.[0].createdAt).toBeInstanceOf(Date);
    expect(result?.[0].createdAt.toISOString()).toBe('2026-11-05T01:02:03.000Z');
    expect(result?.[0]).toMatchObject({ id: '1', prompt: 'p', code: 'c' });
  });
  it('필수 필드가 빠진 항목이 있으면 undefined', () => {
    expect(parseComponents([{ id: '1', prompt: 'p' }])).toBeUndefined();
  });
  it('날짜가 올바르지 않으면 undefined', () => {
    expect(parseComponents([{ ...raw[0], createdAt: 'not-a-date' }])).toBeUndefined();
  });
  it('배열이 아니면 undefined', () => {
    expect(parseComponents({})).toBeUndefined();
  });
});
