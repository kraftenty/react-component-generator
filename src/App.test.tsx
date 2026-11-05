import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { STORAGE_KEYS } from './utils/storage';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ envKeys: { anthropic: false, google: false } }),
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App 영속화', () => {
  it('저장된 provider와 API 키를 복원한다', () => {
    localStorage.setItem(STORAGE_KEYS.provider, JSON.stringify('anthropic'));
    localStorage.setItem(STORAGE_KEYS.apiKey, JSON.stringify('sk-ant-saved'));

    render(<App />);

    expect(screen.getByLabelText('Provider')).toHaveValue('anthropic');
    expect(screen.getByLabelText('API Key')).toHaveValue('sk-ant-saved');
  });

  it('API 키를 입력하면 localStorage에 저장한다', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('API Key'), { target: { value: 'AIza-new' } });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.apiKey)!)).toBe('AIza-new');
  });

  it('Provider를 바꾸면 선택값을 저장한다', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Provider'), { target: { value: 'anthropic' } });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.provider)!)).toBe('anthropic');
  });

  it('저장된 프롬프트 히스토리를 최근 프롬프트로 보여준다', () => {
    localStorage.setItem(STORAGE_KEYS.promptHistory, JSON.stringify(['저장된 요청']));
    render(<App />);
    expect(screen.getByRole('button', { name: '저장된 요청' })).toBeInTheDocument();
  });
});
