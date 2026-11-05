import { describe, it, expect } from 'vitest';
import { validatePromptLength, MAX_PROMPT_LENGTH } from './validatePrompt';

describe('validatePromptLength', () => {
  it('500자 이하의 프롬프트는 유효하다', () => {
    const result = validatePromptLength('a'.repeat(MAX_PROMPT_LENGTH));
    expect(result).toEqual({ valid: true, length: 500 });
  });

  it('500자를 초과하면 유효하지 않고 에러 메시지를 돌려준다', () => {
    const result = validatePromptLength('a'.repeat(MAX_PROMPT_LENGTH + 1));
    expect(result).toEqual({
      valid: false,
      length: 501,
      error: '프롬프트는 500자 이하로 입력해주세요.',
    });
  });

  it('앞뒤 공백은 길이에 포함하지 않는다', () => {
    const result = validatePromptLength(`  ${'a'.repeat(MAX_PROMPT_LENGTH)}  \n`);
    expect(result).toEqual({ valid: true, length: 500 });
  });
});
