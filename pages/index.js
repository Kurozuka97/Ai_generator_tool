import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

const CATEGORIES = [
  'Writing & Content',
  'Coding & Technical',
  'Creative & Art',
  'Analysis & Research',
  'Business & Marketing',
  'Education & Learning',
  'Roleplay & Character',
  'Data & Summarization',
];

const TONES = ['Neutral', 'Formal', 'Casual', 'Persuasive', 'Humorous', 'Empathetic', 'Authoritative', 'Concise'];

const OUTPUT_LENGTHS = ['Short', 'Medium', 'Long', 'Detailed'];

const LANGUAGES = ['English', 'Bahasa Malaysia', 'Mandarin', 'Japanese', 'Spanish', 'French', 'Arabic', 'Hindi'];

export default function Home() {
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState(null);
  const [modelSearch, setModelSearch] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);

  const [intent, setIntent] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [outputLength, setOutputLength] = useState(OUTPUT_LENGTHS[1]);
  const [language, setLanguage] = useState(LANGUAGES[0]);

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const dropdownRef = useRef(null);
  const resultRef = useRef(null);

  // Fetch models on mount
  useEffect(() => {
    fetch('/api/models')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setModels(data.models);
        if (data.models.length > 0) {
          // Default: try to find a good free model
          const preferred = data.models.find((m) =>
            m.id.includes('gemini') || m.id.includes('deepseek') || m.id.includes('llama')
          );
          setSelectedModel(preferred || data.models[0]);
        }
      })
      .catch((err) => setModelsError(err.message))
      .finally(() => setModelsLoading(false));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowModelDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
    m.id.toLowerCase().includes(modelSearch.toLowerCase())
  );

  const handleGenerate = async () => {
    if (!intent.trim()) return;
    if (!selectedModel) return;

    setGenerating(true);
    setError(null);
    setResult(null);
    setCopied(false);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          category,
          tone,
          outputLength,
          language,
          model: selectedModel.id,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result?.prompt) return;
    navigator.clipboard.writeText(result.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setIntent('');
    setResult(null);
    setError(null);
    setCharCount(0);
    setCopied(false);
  };

  const formatPrice = (pricing) => {
    if (!pricing) return '';
    const prompt = parseFloat(pricing.prompt);
    if (prompt === 0) return '✦ free';
    return `$${(prompt * 1_000_000).toFixed(2)}/M`;
  };

  return (
    <>
      <Head>
        <title>PromptCraft — AI Prompt Generator</title>
      </Head>

      <div style={styles.page}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerInner}>
            <div style={styles.logo}>
              <span style={styles.logoMark}>⚡</span>
              <span style={styles.logoText}>PromptCraft</span>
            </div>
            <p style={styles.tagline}>Craft better prompts. Get better results.</p>
          </div>
          <div style={styles.headerLine} />
        </header>

        <main style={styles.main}>
          {/* Left Column — Inputs */}
          <section style={styles.inputSection}>

            {/* Intent */}
            <div style={styles.field}>
              <label style={styles.label}>
                <span style={styles.labelNum}>01</span>
                What do you want to do?
              </label>
              <div style={styles.textareaWrapper}>
                <textarea
                  style={styles.textarea}
                  placeholder="e.g. Write a persuasive email to convince my manager to approve a budget increase for our team..."
                  value={intent}
                  onChange={(e) => {
                    setIntent(e.target.value);
                    setCharCount(e.target.value.length);
                  }}
                  rows={5}
                  maxLength={1000}
                />
                <span style={styles.charCount}>{charCount}/1000</span>
              </div>
            </div>

            {/* Category + Tone */}
            <div style={styles.row}>
              <div style={{ ...styles.field, flex: 1 }}>
                <label style={styles.label}>
                  <span style={styles.labelNum}>02</span>
                  Category
                </label>
                <select
                  style={styles.select}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ ...styles.field, flex: 1 }}>
                <label style={styles.label}>
                  <span style={styles.labelNum}>03</span>
                  Tone
                </label>
                <select
                  style={styles.select}
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Output Length + Language */}
            <div style={styles.row}>
              <div style={{ ...styles.field, flex: 1 }}>
                <label style={styles.label}>
                  <span style={styles.labelNum}>04</span>
                  Output Length
                </label>
                <div style={styles.pills}>
                  {OUTPUT_LENGTHS.map((l) => (
                    <button
                      key={l}
                      style={{
                        ...styles.pill,
                        ...(outputLength === l ? styles.pillActive : {}),
                      }}
                      onClick={() => setOutputLength(l)}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ ...styles.field, flex: 1 }}>
                <label style={styles.label}>
                  <span style={styles.labelNum}>05</span>
                  Language
                </label>
                <select
                  style={styles.select}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Model Picker */}
            <div style={styles.field} ref={dropdownRef}>
              <label style={styles.label}>
                <span style={styles.labelNum}>06</span>
                Model
              </label>

              {modelsLoading && (
                <div style={styles.modelLoading}>
                  <span style={styles.spinner} />
                  Loading models from OpenRouter...
                </div>
              )}

              {modelsError && (
                <div style={styles.errorInline}>⚠ {modelsError}</div>
              )}

              {!modelsLoading && !modelsError && (
                <div style={styles.modelPickerWrapper}>
                  <button
                    style={styles.modelPickerBtn}
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                  >
                    <span style={styles.modelSelected}>
                      {selectedModel ? (
                        <>
                          <span style={styles.modelName}>{selectedModel.name}</span>
                          <span style={styles.modelPrice}>{formatPrice(selectedModel.pricing)}</span>
                        </>
                      ) : 'Select a model'}
                    </span>
                    <span style={styles.chevron}>{showModelDropdown ? '▲' : '▼'}</span>
                  </button>

                  {showModelDropdown && (
                    <div style={styles.modelDropdown}>
                      <input
                        style={styles.modelSearch}
                        placeholder="Search models..."
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        autoFocus
                      />
                      <div style={styles.modelList}>
                        {filteredModels.length === 0 && (
                          <div style={styles.modelEmpty}>No models found</div>
                        )}
                        {filteredModels.map((m) => (
                          <button
                            key={m.id}
                            style={{
                              ...styles.modelOption,
                              ...(selectedModel?.id === m.id ? styles.modelOptionActive : {}),
                            }}
                            onClick={() => {
                              setSelectedModel(m);
                              setShowModelDropdown(false);
                              setModelSearch('');
                            }}
                          >
                            <span style={styles.modelOptionName}>{m.name}</span>
                            <span style={styles.modelOptionMeta}>
                              {formatPrice(m.pricing)}
                              {m.context && (
                                <span style={styles.modelCtx}>
                                  {(m.context / 1000).toFixed(0)}k ctx
                                </span>
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={styles.actions}>
              <button
                style={{
                  ...styles.generateBtn,
                  ...(generating || !intent.trim() || !selectedModel
                    ? styles.generateBtnDisabled
                    : {}),
                }}
                onClick={handleGenerate}
                disabled={generating || !intent.trim() || !selectedModel}
              >
                {generating ? (
                  <>
                    <span style={styles.spinner} />
                    Generating...
                  </>
                ) : (
                  <>⚡ Generate Prompt</>
                )}
              </button>

              {(intent || result) && (
                <button style={styles.clearBtn} onClick={handleClear}>
                  Clear
                </button>
              )}
            </div>
          </section>

          {/* Right Column — Output */}
          <section style={styles.outputSection} ref={resultRef}>
            {!result && !error && !generating && (
              <div style={styles.outputEmpty}>
                <div style={styles.emptyIcon}>✦</div>
                <p style={styles.emptyText}>Your generated prompt will appear here</p>
                <p style={styles.emptySubtext}>Fill in the details and hit Generate</p>
              </div>
            )}

            {generating && (
              <div style={styles.outputEmpty}>
                <div style={styles.generatingDots}>
                  <span style={{ ...styles.dot, animationDelay: '0s' }} />
                  <span style={{ ...styles.dot, animationDelay: '0.2s' }} />
                  <span style={{ ...styles.dot, animationDelay: '0.4s' }} />
                </div>
                <p style={styles.emptyText}>Crafting your prompt...</p>
                <p style={styles.emptySubtext}>using {selectedModel?.name}</p>
              </div>
            )}

            {error && (
              <div style={styles.errorBox}>
                <p style={styles.errorTitle}>⚠ Generation failed</p>
                <p style={styles.errorMsg}>{error}</p>
              </div>
            )}

            {result && !generating && (
              <div style={styles.resultBox}>
                <div style={styles.resultHeader}>
                  <div style={styles.resultMeta}>
                    <span style={styles.resultBadge}>{category}</span>
                    <span style={styles.resultBadge}>{tone}</span>
                    <span style={styles.resultBadge}>{outputLength}</span>
                  </div>
                  <div style={styles.resultActions}>
                    {result.usage && (
                      <span style={styles.tokenCount}>
                        {result.usage.total_tokens} tokens
                      </span>
                    )}
                    <button style={styles.copyBtn} onClick={handleCopy}>
                      {copied ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div style={styles.resultContent}>
                  <pre style={styles.promptText}>{result.prompt}</pre>
                </div>

                <div style={styles.resultFooter}>
                  <span style={styles.modelUsed}>
                    via {result.model || selectedModel?.name}
                  </span>
                  <button
                    style={styles.regenerateBtn}
                    onClick={handleGenerate}
                  >
                    ↺ Regenerate
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>

        <footer style={styles.footer}>
          <span>PromptCraft</span>
          <span style={styles.footerDivider}>·</span>
          <span>Powered by OpenRouter</span>
        </footer>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        select option {
          background: #1c1c21;
          color: #e8e8f0;
        }
      `}</style>
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },

  // Header
  header: {
    padding: '40px 48px 0',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  headerInner: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '20px',
    marginBottom: '28px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoMark: {
    fontSize: '22px',
    filter: 'hue-rotate(40deg) brightness(1.3)',
  },
  logoText: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 700,
    fontSize: '28px',
    color: '#e8e8f0',
    letterSpacing: '-0.5px',
  },
  tagline: {
    fontFamily: "'DM Sans', sans-serif",
    color: '#7a7a90',
    fontSize: '14px',
    fontWeight: 300,
  },
  headerLine: {
    height: '1px',
    background: 'linear-gradient(to right, #2a2a32 0%, #3d3d4a 30%, #2a2a32 100%)',
    maxWidth: '1200px',
    margin: '0 auto',
    width: 'calc(100% - 96px)',
  },

  // Main layout
  main: {
    display: 'flex',
    gap: '32px',
    padding: '40px 48px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    flex: 1,
    alignItems: 'flex-start',
  },

  inputSection: {
    flex: '0 0 480px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },

  outputSection: {
    flex: 1,
    minHeight: '500px',
    position: 'sticky',
    top: '24px',
  },

  // Fields
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  label: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    color: '#7a7a90',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  labelNum: {
    color: '#b5f23a',
    fontWeight: 700,
  },

  row: {
    display: 'flex',
    gap: '16px',
  },

  textareaWrapper: {
    position: 'relative',
  },
  textarea: {
    width: '100%',
    background: '#131316',
    border: '1px solid #2a2a32',
    borderRadius: '6px',
    color: '#e8e8f0',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 300,
    fontSize: '14px',
    lineHeight: '1.6',
    padding: '14px 16px 28px',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.15s',
    ':focus': { borderColor: '#b5f23a' },
  },
  charCount: {
    position: 'absolute',
    bottom: '10px',
    right: '14px',
    fontFamily: "'Space Mono', monospace",
    fontSize: '10px',
    color: '#3a3a48',
  },

  select: {
    background: '#131316',
    border: '1px solid #2a2a32',
    borderRadius: '6px',
    color: '#e8e8f0',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px',
    padding: '10px 14px',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%237a7a90'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '32px',
  },

  pills: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  pill: {
    background: 'transparent',
    border: '1px solid #2a2a32',
    borderRadius: '4px',
    color: '#7a7a90',
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    padding: '6px 12px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  pillActive: {
    background: 'rgba(181, 242, 58, 0.1)',
    borderColor: '#b5f23a',
    color: '#b5f23a',
  },

  // Model picker
  modelPickerWrapper: {
    position: 'relative',
  },
  modelPickerBtn: {
    width: '100%',
    background: '#131316',
    border: '1px solid #2a2a32',
    borderRadius: '6px',
    color: '#e8e8f0',
    padding: '10px 14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px',
    textAlign: 'left',
  },
  modelSelected: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  modelName: {
    color: '#e8e8f0',
  },
  modelPrice: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    color: '#b5f23a',
    padding: '2px 6px',
    background: 'rgba(181, 242, 58, 0.08)',
    borderRadius: '3px',
  },
  chevron: {
    color: '#7a7a90',
    fontSize: '10px',
  },
  modelDropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    background: '#1c1c21',
    border: '1px solid #2a2a32',
    borderRadius: '6px',
    zIndex: 100,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    overflow: 'hidden',
  },
  modelSearch: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #2a2a32',
    color: '#e8e8f0',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '13px',
    padding: '10px 14px',
    outline: 'none',
  },
  modelList: {
    maxHeight: '220px',
    overflowY: 'auto',
  },
  modelOption: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    color: '#e8e8f0',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '13px',
    padding: '10px 14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    textAlign: 'left',
    transition: 'background 0.1s',
  },
  modelOptionActive: {
    background: 'rgba(181, 242, 58, 0.08)',
    color: '#b5f23a',
  },
  modelOptionName: {},
  modelOptionMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: "'Space Mono', monospace",
    fontSize: '10px',
    color: '#b5f23a',
  },
  modelCtx: {
    color: '#7a7a90',
  },
  modelEmpty: {
    padding: '16px 14px',
    color: '#7a7a90',
    fontSize: '13px',
    fontFamily: "'DM Sans', sans-serif",
  },
  modelLoading: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#7a7a90',
    fontSize: '13px',
    fontFamily: "'DM Sans', sans-serif",
    padding: '10px 0',
  },

  // Actions
  actions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    paddingTop: '4px',
  },
  generateBtn: {
    flex: 1,
    background: '#b5f23a',
    border: 'none',
    borderRadius: '6px',
    color: '#000',
    fontFamily: "'Space Mono', monospace",
    fontWeight: 700,
    fontSize: '13px',
    padding: '14px 24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.15s',
    letterSpacing: '0.02em',
  },
  generateBtnDisabled: {
    background: '#2a2a32',
    color: '#7a7a90',
    cursor: 'not-allowed',
  },
  clearBtn: {
    background: 'transparent',
    border: '1px solid #2a2a32',
    borderRadius: '6px',
    color: '#7a7a90',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '13px',
    padding: '13px 20px',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },

  // Spinner
  spinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(0,0,0,0.2)',
    borderTopColor: '#000',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },

  // Output
  outputEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '500px',
    gap: '10px',
    border: '1px dashed #2a2a32',
    borderRadius: '8px',
  },
  emptyIcon: {
    fontSize: '32px',
    color: '#3a3a48',
    marginBottom: '8px',
  },
  emptyText: {
    color: '#7a7a90',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '15px',
  },
  emptySubtext: {
    color: '#3a3a48',
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
  },

  generatingDots: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  dot: {
    width: '10px',
    height: '10px',
    background: '#b5f23a',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'pulse 1.4s ease-in-out infinite',
  },

  // Error
  errorBox: {
    border: '1px solid rgba(255, 71, 87, 0.3)',
    background: 'rgba(255, 71, 87, 0.05)',
    borderRadius: '8px',
    padding: '24px',
  },
  errorInline: {
    color: '#ff4757',
    fontFamily: "'Space Mono', monospace",
    fontSize: '12px',
  },
  errorTitle: {
    color: '#ff4757',
    fontFamily: "'Space Mono', monospace",
    fontSize: '13px',
    marginBottom: '8px',
  },
  errorMsg: {
    color: '#7a7a90',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px',
  },

  // Result
  resultBox: {
    border: '1px solid #2a2a32',
    borderRadius: '8px',
    overflow: 'hidden',
    background: '#0c0c0e',
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '1px solid #2a2a32',
    background: '#131316',
  },
  resultMeta: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  resultBadge: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '10px',
    color: '#7a7a90',
    border: '1px solid #2a2a32',
    padding: '3px 8px',
    borderRadius: '3px',
  },
  resultActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  tokenCount: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    color: '#3a3a48',
  },
  copyBtn: {
    background: 'rgba(181, 242, 58, 0.1)',
    border: '1px solid rgba(181, 242, 58, 0.3)',
    borderRadius: '4px',
    color: '#b5f23a',
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    padding: '5px 12px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  resultContent: {
    padding: '24px',
    minHeight: '300px',
  },
  promptText: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '13px',
    lineHeight: '1.8',
    color: '#e8e8f0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  resultFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderTop: '1px solid #2a2a32',
    background: '#131316',
  },
  modelUsed: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '10px',
    color: '#3a3a48',
  },
  regenerateBtn: {
    background: 'transparent',
    border: '1px solid #2a2a32',
    borderRadius: '4px',
    color: '#7a7a90',
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    padding: '5px 12px',
    cursor: 'pointer',
  },

  // Footer
  footer: {
    padding: '20px 48px',
    borderTop: '1px solid #2a2a32',
    display: 'flex',
    gap: '10px',
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    color: '#3a3a48',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  footerDivider: {
    color: '#2a2a32',
  },
};
