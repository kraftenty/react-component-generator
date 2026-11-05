import { useState, useEffect } from 'react';
import { PromptInput } from './components/PromptInput';
import { ComponentCard } from './components/ComponentCard';
import { Window } from './components/Window';
import { useComponentGenerator } from './hooks/useComponentGenerator';
import { usePersistentState } from './hooks/usePersistentState';
import type { Provider } from './types';
import { STORAGE_KEYS } from './utils/storage';
import { parseString, parseProvider, parseStringArray } from './utils/parsers';
import { addToPromptHistory } from './utils/promptHistory';
import './App.css';

const PROVIDER_CONFIG = {
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-...' },
  google: { label: 'Google', placeholder: 'AIza...' },
} as const;

function App() {
  const [apiKey, setApiKey] = usePersistentState(STORAGE_KEYS.apiKey, '', parseString);
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = usePersistentState<Provider>(
    STORAGE_KEYS.provider,
    'google',
    parseProvider,
  );
  const [history, setHistory] = usePersistentState<string[]>(
    STORAGE_KEYS.promptHistory,
    [],
    parseStringArray,
  );
  const [envKeys, setEnvKeys] = useState<Record<Provider, boolean>>({
    anthropic: false,
    google: false,
  });
  const { components, isLoading, error, generate, removeComponent, clearAll } =
    useComponentGenerator();

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setEnvKeys(data.envKeys))
      .catch(() => {});
  }, []);

  const hasEnvKey = envKeys[provider];

  const handleGenerate = (prompt: string) => {
    if (!apiKey.trim() && !hasEnvKey) {
      alert(`${PROVIDER_CONFIG[provider].label} API 키를 입력하거나 .env에 설정해주세요.`);
      return;
    }
    setHistory((prev) => addToPromptHistory(prev, prompt));
    generate(prompt, apiKey || undefined, provider);
  };

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
    setApiKey('');
  };

  const activeProvider = PROVIDER_CONFIG[provider].label;
  const keyReady = hasEnvKey || apiKey.trim().length > 0;

  return (
    <>
      <header className="menubar">
        <div className="menubar-brand">
          <BrandMark />
          <span>React 컴포넌트 생성기</span>
        </div>
        <div className="menubar-status" aria-label="현재 작업 상태">
          <span className="status-item">
            <i className={`led ${keyReady ? 'led--on' : ''}`} aria-hidden="true" />
            {activeProvider}
            <span className="sr-only">{keyReady ? ' API 키 준비됨' : ' API 키 없음'}</span>
          </span>
          <span className="status-item">컴포넌트 {components.length}개</span>
        </div>
      </header>

      <div className="app">
        <div className="hero">
          <h1>프롬프트로 만드는 UI 워크벤치</h1>
          <p>요청을 입력하고, 생성된 React 컴포넌트를 바로 미리보고 코드로 확인합니다.</p>
        </div>

        <main className="workspace">
          <Window title="프롬프트" label="컴포넌트 생성" className="win-open">
            <PromptInput onGenerate={handleGenerate} isLoading={isLoading} history={history} />
          </Window>

          <Window
            as="aside"
            title="실행 설정"
            className="win-open"
            style={{ animationDelay: '0.12s' }}
          >
            <div className="provider-select">
              <label htmlFor="provider">Provider</label>
              <select
                id="provider"
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as Provider)}
              >
                {Object.entries(PROVIDER_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="api-key-input">
              <label htmlFor="api-key">API Key</label>
              <div className="api-key-field">
                <input
                  id="api-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    hasEnvKey
                      ? '서버 키 사용 중'
                      : PROVIDER_CONFIG[provider].placeholder
                  }
                />
                <button
                  className="btn-toggle-key"
                  onClick={() => setShowKey(!showKey)}
                  type="button"
                >
                  {showKey ? '숨기기' : '보기'}
                </button>
              </div>
              <p className={`key-status ${hasEnvKey ? 'key-status--ready' : ''}`}>
                <i className={`led ${hasEnvKey ? 'led--on' : ''}`} aria-hidden="true" />
                {hasEnvKey
                  ? '.env 키가 연결되어 있습니다. 직접 입력하면 그 키를 우선 사용합니다.'
                  : '직접 입력하거나 서버 환경변수를 설정하세요.'}
              </p>
            </div>
          </Window>
        </main>

        {error && (
          <Window title="오류" className="error-banner-win" bodyClassName="win-body error-banner">
            <span className="alert-icon" aria-hidden="true">!</span>
            <p role="alert">{error}</p>
          </Window>
        )}

        <section className="results-section" aria-label="생성된 컴포넌트">
          {components.length > 0 && (
            <div className="results-header">
              <h2>생성된 컴포넌트</h2>
              <button className="btn-clear" onClick={clearAll}>
                전체 삭제
              </button>
            </div>
          )}

          {components.length === 0 && !isLoading && (
            <Window title="생성된 컴포넌트" className="empty-state" bodyClassName="win-body">
              <FolderIcon />
              <div className="empty-copy">
                <h2>새 컴포넌트를 생성해보세요.</h2>
                <p>프롬프트를 보내면 결과가 이 창 아래에 새 창으로 열립니다.</p>
              </div>
            </Window>
          )}

          {isLoading && (
            <Window title="생성 중" className="loading-card">
              <div role="status" className="loading-status">
                <p>컴포넌트를 생성하고 있습니다...</p>
              </div>
              <div className="progress" aria-hidden="true" />
            </Window>
          )}

          <div className="results-grid">
            {components.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
                onRemove={removeComponent}
                onRegenerate={handleGenerate}
                isLoading={isLoading}
              />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1" y="2" width="14" height="12" fill="#000" />
      <rect x="2" y="3" width="12" height="3" fill="#ff8800" />
      <rect x="2" y="6" width="12" height="7" fill="#fff" />
      <path
        d="M5 8h1v1H5zM4 9h1v1H4zM5 10h1v1H5zM10 8h1v1h-1zM11 9h1v1h-1zM10 10h1v1h-1zM7 8h2v3H7z"
        fill="#0055aa"
      />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg className="empty-icon" viewBox="0 0 16 14" aria-hidden="true">
      <path d="M1 1h6v2h8v10H1z" fill="#000" />
      <path d="M2 2h4v1H2z" fill="#fff" />
      <path d="M2 4h12v8H2z" fill="#ff8800" />
      <path d="M2 4h12v1H2z" fill="#ffa845" />
      <path d="M3 11h10v1H3z" fill="#cc6c00" />
    </svg>
  );
}

export default App;
