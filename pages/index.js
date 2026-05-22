import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

const CATEGORIES = [
  'Writing & Content', 'Coding & Technical', 'Creative & Art',
  'Analysis & Research', 'Business & Marketing', 'Education & Learning',
  'Roleplay & Character', 'Data & Summarization',
];
const TONES = ['Neutral', 'Formal', 'Casual', 'Persuasive', 'Humorous', 'Empathetic', 'Authoritative', 'Concise'];
const OUTPUT_LENGTHS = ['Short', 'Medium', 'Long', 'Detailed'];
const LANGUAGES = ['English', 'Bahasa Malaysia', 'Mandarin', 'Japanese', 'Spanish', 'French', 'Arabic', 'Hindi'];

export default function Home() {
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState(null);

  // Generate tab
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
  const [genError, setGenError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);

  // Extract tab
  const [activeTab, setActiveTab] = useState('generate');
  const [extractModelSearch, setExtractModelSearch] = useState('');
  const [showExtractModelDropdown, setShowExtractModelDropdown] = useState(false);
  const [selectedExtractModel, setSelectedExtractModel] = useState(null);
  const [extractMode, setExtractMode] = useState('describe');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState(null);
  const [extractError, setExtractError] = useState(null);
  const [extractCopied, setExtractCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const dropdownRef = useRef(null);
  const extractDropdownRef = useRef(null);
  const resultRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch('/api/models')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setModels(data.models);
        if (data.models.length > 0) {
          const preferred = data.models.find((m) =>
            m.id.includes('gemini') || m.id.includes('deepseek') || m.id.includes('llama')
          );
          setSelectedModel(preferred || data.models[0]);
          const visionPreferred = data.models.find((m) =>
            m.vision && (m.id.includes('gemini') || m.id.includes('gpt-4o') || m.id.includes('claude'))
          );
          setSelectedExtractModel(visionPreferred || data.models.find((m) => m.vision) || null);
        }
      })
      .catch((err) => setModelsError(err.message))
      .finally(() => setModelsLoading(false));
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowModelDropdown(false);
      if (extractDropdownRef.current && !extractDropdownRef.current.contains(e.target)) setShowExtractModelDropdown(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const visionModels = models.filter((m) => m.vision);
  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
    m.id.toLowerCase().includes(modelSearch.toLowerCase())
  );
  const filteredExtractModels = visionModels.filter((m) =>
    m.name.toLowerCase().includes(extractModelSearch.toLowerCase()) ||
    m.id.toLowerCase().includes(extractModelSearch.toLowerCase())
  );

  const formatPrice = (pricing) => {
    if (!pricing) return '';
    const prompt = parseFloat(pricing.prompt);
    if (prompt === 0) return '✦ free';
    return `$${(prompt * 1_000_000).toFixed(2)}/M`;
  };

  // Generate
  const handleGenerate = async () => {
    if (!intent.trim() || !selectedModel) return;
    setGenerating(true); setGenError(null); setResult(null); setCopied(false);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, category, tone, outputLength, language, model: selectedModel.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) { setGenError(err.message); }
    finally { setGenerating(false); }
  };

  const handleCopy = () => {
    if (!result?.prompt) return;
    navigator.clipboard.writeText(result.prompt);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setIntent(''); setResult(null); setGenError(null); setCharCount(0); setCopied(false);
  };

  // Image
  const processImage = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImageFile(file);
    setExtractResult(null);
    setExtractError(null);
    setExtractCopied(false);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processImage(e.dataTransfer.files?.[0]);
  };

  const handleExtract = async () => {
    if (!imageFile || !selectedExtractModel) return;
    setExtracting(true); setExtractError(null); setExtractResult(null); setExtractCopied(false);
    try {
      const base64 = imagePreview.split(',')[1];
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: imageFile.type,
          model: selectedExtractModel.id,
          mode: extractMode,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setExtractResult(data);
    } catch (err) { setExtractError(err.message); }
    finally { setExtracting(false); }
  };

  const handleExtractCopy = () => {
    if (!extractResult?.prompt) return;
    navigator.clipboard.writeText(extractResult.prompt);
    setExtractCopied(true); setTimeout(() => setExtractCopied(false), 2000);
  };

  const handleUseAsIntent = () => {
    if (!extractResult?.prompt) return;
    setIntent(extractResult.prompt);
    setCharCount(extractResult.prompt.length);
    setActiveTab('generate');
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExtractResult(null);
    setExtractError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Shared model picker component logic
  const ModelPicker = ({ ref_, models_, filtered_, selected_, onSelect, search_, onSearch, show_, onToggle, loading, error_ }) => (
    <div style={S.field} ref={ref_}>
      <label style={S.label}><span style={S.labelNum}>
        {activeTab === 'extract' ? '03' : '06'}
      </span>Model {activeTab === 'extract' && <span style={S.visionBadge}>👁 Vision only</span>}</label>
      {loading && <div style={S.modelLoading}><span style={S.spinner} />Loading models...</div>}
      {error_ && <div style={S.errorInline}>⚠ {error_}</div>}
      {!loading && !error_ && (
        <div style={S.modelPickerWrapper}>
          <button style={S.modelPickerBtn} onClick={onToggle}>
            <span style={S.modelSelected}>
              {selected_ ? (
                <>
                  <span>{selected_.name}</span>
                  <span style={S.modelPrice}>{formatPrice(selected_.pricing)}</span>
                </>
              ) : filtered_.length === 0 ? 'No vision models available' : 'Select a model'}
            </span>
            <span style={S.chevron}>{show_ ? '▲' : '▼'}</span>
          </button>
          {show_ && (
            <div style={S.modelDropdown}>
              <input style={S.modelSearch} placeholder="Search models..." value={search_} onChange={(e) => onSearch(e.target.value)} autoFocus />
              <div style={S.modelList}>
                {filtered_.length === 0 && <div style={S.modelEmpty}>No models found</div>}
                {filtered_.map((m) => (
                  <button key={m.id} style={{ ...S.modelOption, ...(selected_?.id === m.id ? S.modelOptionActive : {}) }}
                    onClick={() => { onSelect(m); onSearch(''); }}>
                    <span>{m.name}</span>
                    <span style={S.modelOptionMeta}>
                      {formatPrice(m.pricing)}
                      {m.context && <span style={S.modelCtx}>{(m.context / 1000).toFixed(0)}k</span>}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Head><title>PromptCraft — AI Prompt Generator</title></Head>
      <div style={S.page}>

        {/* Header */}
        <header style={S.header}>
          <div style={S.headerInner}>
            <div style={S.logo}>
              <span>⚡</span>
              <span style={S.logoText}>PromptCraft</span>
            </div>
            <p style={S.tagline}>Craft better prompts. Get better results.</p>
          </div>
          <div style={S.headerLine} />
        </header>

        <main style={S.main}>
          {/* Left panel */}
          <section style={S.inputSection}>

            {/* Tabs */}
            <div style={S.tabs}>
              <button style={{ ...S.tab, ...(activeTab === 'generate' ? S.tabActive : {}) }} onClick={() => setActiveTab('generate')}>
                ✦ Generate
              </button>
              <button style={{ ...S.tab, ...(activeTab === 'extract' ? S.tabActive : {}) }} onClick={() => setActiveTab('extract')}>
                🖼 Extract from Image
              </button>
            </div>

            {/* ── GENERATE TAB ── */}
            {activeTab === 'generate' && (
              <>
                <div style={S.field}>
                  <label style={S.label}><span style={S.labelNum}>01</span>What do you want to do?</label>
                  <div style={S.textareaWrapper}>
                    <textarea style={S.textarea}
                      placeholder="e.g. Write a persuasive email to convince my manager to approve a budget increase..."
                      value={intent}
                      onChange={(e) => { setIntent(e.target.value); setCharCount(e.target.value.length); }}
                      rows={5} maxLength={1000} />
                    <span style={S.charCount}>{charCount}/1000</span>
                  </div>
                </div>

                <div style={S.row}>
                  <div style={{ ...S.field, flex: 1 }}>
                    <label style={S.label}><span style={S.labelNum}>02</span>Category</label>
                    <select style={S.select} value={category} onChange={(e) => setCategory(e.target.value)}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ ...S.field, flex: 1 }}>
                    <label style={S.label}><span style={S.labelNum}>03</span>Tone</label>
                    <select style={S.select} value={tone} onChange={(e) => setTone(e.target.value)}>
                      {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div style={S.row}>
                  <div style={{ ...S.field, flex: 1 }}>
                    <label style={S.label}><span style={S.labelNum}>04</span>Output Length</label>
                    <div style={S.pills}>
                      {OUTPUT_LENGTHS.map((l) => (
                        <button key={l} style={{ ...S.pill, ...(outputLength === l ? S.pillActive : {}) }} onClick={() => setOutputLength(l)}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ ...S.field, flex: 1 }}>
                    <label style={S.label}><span style={S.labelNum}>05</span>Language</label>
                    <select style={S.select} value={language} onChange={(e) => setLanguage(e.target.value)}>
                      {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <ModelPicker
                  ref_={dropdownRef}
                  models_={models} filtered_={filteredModels}
                  selected_={selectedModel} onSelect={(m) => { setSelectedModel(m); setShowModelDropdown(false); }}
                  search_={modelSearch} onSearch={setModelSearch}
                  show_={showModelDropdown} onToggle={() => setShowModelDropdown(!showModelDropdown)}
                  loading={modelsLoading} error_={modelsError}
                />

                <div style={S.actions}>
                  <button
                    style={{ ...S.generateBtn, ...(generating || !intent.trim() || !selectedModel ? S.generateBtnDisabled : {}) }}
                    onClick={handleGenerate} disabled={generating || !intent.trim() || !selectedModel}>
                    {generating ? <><span style={S.spinnerDark} />Generating...</> : <>⚡ Generate Prompt</>}
                  </button>
                  {(intent || result) && <button style={S.clearBtn} onClick={handleClear}>Clear</button>}
                </div>
              </>
            )}

            {/* ── EXTRACT TAB ── */}
            {activeTab === 'extract' && (
              <>
                {/* Mode toggle */}
                <div style={S.field}>
                  <label style={S.label}><span style={S.labelNum}>01</span>Extraction Mode</label>
                  <div style={S.pills}>
                    <button style={{ ...S.pill, ...(extractMode === 'describe' ? S.pillActive : {}) }} onClick={() => setExtractMode('describe')}>
                      📝 Describe Image
                    </button>
                    <button style={{ ...S.pill, ...(extractMode === 'recreate' ? S.pillActive : {}) }} onClick={() => setExtractMode('recreate')}>
                      🎨 Recreate Prompt
                    </button>
                  </div>
                  <p style={S.modeHint}>
                    {extractMode === 'describe'
                      ? 'Generate a descriptive prompt capturing what\'s in the image.'
                      : 'Generate an AI image generation prompt to recreate this image (Midjourney/SD/DALL-E style).'}
                  </p>
                </div>

                {/* Upload zone */}
                <div style={S.field}>
                  <label style={S.label}><span style={S.labelNum}>02</span>Image</label>

                  {!imagePreview ? (
                    <div
                      style={{ ...S.dropZone, ...(dragOver ? S.dropZoneActive : {}) }}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span style={S.dropIcon}>🖼</span>
                      <p style={S.dropText}>Drop image here or click to upload</p>
                      <p style={S.dropSubtext}>PNG, JPG, WEBP — max 10MB</p>
                      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileInput} />
                    </div>
                  ) : (
                    <div style={S.imagePreviewWrapper}>
                      <img src={imagePreview} alt="Preview" style={S.imagePreview} />
                      <div style={S.imageOverlay}>
                        <span style={S.imageName}>{imageFile?.name}</span>
                        <button style={S.removeBtn} onClick={handleRemoveImage}>✕ Remove</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vision model picker */}
                <ModelPicker
                  ref_={extractDropdownRef}
                  models_={visionModels} filtered_={filteredExtractModels}
                  selected_={selectedExtractModel} onSelect={(m) => { setSelectedExtractModel(m); setShowExtractModelDropdown(false); }}
                  search_={extractModelSearch} onSearch={setExtractModelSearch}
                  show_={showExtractModelDropdown} onToggle={() => setShowExtractModelDropdown(!showExtractModelDropdown)}
                  loading={modelsLoading} error_={modelsError}
                />

                <div style={S.actions}>
                  <button
                    style={{ ...S.generateBtn, ...(extracting || !imageFile || !selectedExtractModel ? S.generateBtnDisabled : {}) }}
                    onClick={handleExtract} disabled={extracting || !imageFile || !selectedExtractModel}>
                    {extracting ? <><span style={S.spinnerDark} />Extracting...</> : <>🔍 Extract Prompt</>}
                  </button>
                  {imageFile && <button style={S.clearBtn} onClick={handleRemoveImage}>Clear</button>}
                </div>
              </>
            )}
          </section>

          {/* Right panel — Output */}
          <section style={S.outputSection} ref={resultRef}>

            {/* Generate output */}
            {activeTab === 'generate' && (
              <>
                {!result && !genError && !generating && (
                  <div style={S.outputEmpty}>
                    <div style={S.emptyIcon}>✦</div>
                    <p style={S.emptyText}>Your generated prompt will appear here</p>
                    <p style={S.emptySubtext}>Fill in the details and hit Generate</p>
                  </div>
                )}
                {generating && (
                  <div style={S.outputEmpty}>
                    <div style={S.generatingDots}>
                      {[0, 0.2, 0.4].map((d, i) => <span key={i} style={{ ...S.dot, animationDelay: `${d}s` }} />)}
                    </div>
                    <p style={S.emptyText}>Crafting your prompt...</p>
                    <p style={S.emptySubtext}>using {selectedModel?.name}</p>
                  </div>
                )}
                {genError && (
                  <div style={S.errorBox}>
                    <p style={S.errorTitle}>⚠ Generation failed</p>
                    <p style={S.errorMsg}>{genError}</p>
                  </div>
                )}
                {result && !generating && (
                  <ResultBox
                    prompt={result.prompt}
                    modelName={result.model || selectedModel?.name}
                    usage={result.usage}
                    badges={[category, tone, outputLength]}
                    copied={copied}
                    onCopy={handleCopy}
                    onRegenerate={handleGenerate}
                  />
                )}
              </>
            )}

            {/* Extract output */}
            {activeTab === 'extract' && (
              <>
                {!extractResult && !extractError && !extracting && (
                  <div style={S.outputEmpty}>
                    <div style={S.emptyIcon}>🖼</div>
                    <p style={S.emptyText}>Extracted prompt will appear here</p>
                    <p style={S.emptySubtext}>Upload an image and hit Extract</p>
                  </div>
                )}
                {extracting && (
                  <div style={S.outputEmpty}>
                    <div style={S.generatingDots}>
                      {[0, 0.2, 0.4].map((d, i) => <span key={i} style={{ ...S.dot, animationDelay: `${d}s` }} />)}
                    </div>
                    <p style={S.emptyText}>Analyzing image...</p>
                    <p style={S.emptySubtext}>using {selectedExtractModel?.name}</p>
                  </div>
                )}
                {extractError && (
                  <div style={S.errorBox}>
                    <p style={S.errorTitle}>⚠ Extraction failed</p>
                    <p style={S.errorMsg}>{extractError}</p>
                  </div>
                )}
                {extractResult && !extracting && (
                  <ResultBox
                    prompt={extractResult.prompt}
                    modelName={extractResult.model || selectedExtractModel?.name}
                    usage={extractResult.usage}
                    badges={[extractMode === 'describe' ? 'Describe' : 'Recreate']}
                    copied={extractCopied}
                    onCopy={handleExtractCopy}
                    onRegenerate={handleExtract}
                    extraAction={
                      <button style={S.useAsIntentBtn} onClick={handleUseAsIntent}>
                        → Use as Intent
                      </button>
                    }
                  />
                )}
              </>
            )}
          </section>
        </main>

        <footer style={S.footer}>
          <span>PromptCraft</span>
          <span style={S.footerDivider}>·</span>
          <span>Powered by OpenRouter</span>
        </footer>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,80%,100%{opacity:0.2;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
        textarea:focus { border-color: #b5f23a !important; outline: none; }
        select option { background: #1c1c21; color: #e8e8f0; }
        button:hover { opacity: 0.85; }
      `}</style>
    </>
  );
}

function ResultBox({ prompt, modelName, usage, badges, copied, onCopy, onRegenerate, extraAction }) {
  return (
    <div style={S.resultBox}>
      <div style={S.resultHeader}>
        <div style={S.resultMeta}>
          {badges.map((b) => <span key={b} style={S.resultBadge}>{b}</span>)}
        </div>
        <div style={S.resultActions}>
          {usage && <span style={S.tokenCount}>{usage.total_tokens} tokens</span>}
          <button style={S.copyBtn} onClick={onCopy}>{copied ? '✓ Copied!' : 'Copy'}</button>
        </div>
      </div>
      <div style={S.resultContent}>
        <pre style={S.promptText}>{prompt}</pre>
      </div>
      <div style={S.resultFooter}>
        <span style={S.modelUsed}>via {modelName}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {extraAction}
          <button style={S.regenerateBtn} onClick={onRegenerate}>↺ Regenerate</button>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { padding: '40px 48px 0', maxWidth: '1200px', margin: '0 auto', width: '100%' },
  headerInner: { display: 'flex', alignItems: 'baseline', gap: '20px', marginBottom: '28px' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px' },
  logoText: { fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: '28px', color: '#e8e8f0', letterSpacing: '-0.5px' },
  tagline: { color: '#7a7a90', fontSize: '14px', fontWeight: 300 },
  headerLine: { height: '1px', background: 'linear-gradient(to right, #2a2a32 0%, #3d3d4a 30%, #2a2a32 100%)', maxWidth: '1200px', margin: '0 auto', width: 'calc(100% - 96px)' },
  main: { display: 'flex', gap: '32px', padding: '40px 48px', maxWidth: '1200px', margin: '0 auto', width: '100%', flex: 1, alignItems: 'flex-start' },
  inputSection: { flex: '0 0 480px', display: 'flex', flexDirection: 'column', gap: '24px' },
  outputSection: { flex: 1, minHeight: '500px', position: 'sticky', top: '24px' },

  // Tabs
  tabs: { display: 'flex', gap: '0', border: '1px solid #2a2a32', borderRadius: '6px', overflow: 'hidden' },
  tab: { flex: 1, background: 'transparent', border: 'none', color: '#7a7a90', fontFamily: "'Space Mono', monospace", fontSize: '11px', padding: '10px 16px', cursor: 'pointer', letterSpacing: '0.04em' },
  tabActive: { background: 'rgba(181,242,58,0.08)', color: '#b5f23a', borderBottom: '2px solid #b5f23a' },

  field: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#7a7a90', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' },
  labelNum: { color: '#b5f23a', fontWeight: 700 },
  visionBadge: { background: 'rgba(181,242,58,0.08)', color: '#b5f23a', border: '1px solid rgba(181,242,58,0.2)', borderRadius: '3px', padding: '2px 7px', fontSize: '10px', textTransform: 'none' },
  row: { display: 'flex', gap: '16px' },

  textareaWrapper: { position: 'relative' },
  textarea: { width: '100%', background: '#131316', border: '1px solid #2a2a32', borderRadius: '6px', color: '#e8e8f0', fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: '14px', lineHeight: '1.6', padding: '14px 16px 28px', resize: 'vertical', outline: 'none', transition: 'border-color 0.15s' },
  charCount: { position: 'absolute', bottom: '10px', right: '14px', fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#3a3a48' },

  select: { background: '#131316', border: '1px solid #2a2a32', borderRadius: '6px', color: '#e8e8f0', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', padding: '10px 32px 10px 14px', outline: 'none', cursor: 'pointer', width: '100%', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%237a7a90'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' },

  pills: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  pill: { background: 'transparent', border: '1px solid #2a2a32', borderRadius: '4px', color: '#7a7a90', fontFamily: "'Space Mono', monospace", fontSize: '11px', padding: '6px 12px', cursor: 'pointer', transition: 'all 0.15s' },
  pillActive: { background: 'rgba(181,242,58,0.1)', borderColor: '#b5f23a', color: '#b5f23a' },

  modeHint: { fontSize: '12px', color: '#7a7a90', fontFamily: "'DM Sans', sans-serif", lineHeight: '1.5', padding: '0 2px' },

  // Drop zone
  dropZone: { border: '2px dashed #2a2a32', borderRadius: '8px', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', background: '#0c0c0e' },
  dropZoneActive: { borderColor: '#b5f23a', background: 'rgba(181,242,58,0.04)' },
  dropIcon: { fontSize: '32px', marginBottom: '4px' },
  dropText: { color: '#e8e8f0', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' },
  dropSubtext: { color: '#7a7a90', fontFamily: "'Space Mono', monospace", fontSize: '11px' },

  imagePreviewWrapper: { position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2a2a32' },
  imagePreview: { width: '100%', maxHeight: '260px', objectFit: 'cover', display: 'block' },
  imageOverlay: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#131316', borderTop: '1px solid #2a2a32' },
  imageName: { fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#7a7a90', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' },
  removeBtn: { background: 'transparent', border: '1px solid #2a2a32', borderRadius: '4px', color: '#7a7a90', fontFamily: "'Space Mono', monospace", fontSize: '11px', padding: '4px 10px', cursor: 'pointer' },

  // Model picker
  modelPickerWrapper: { position: 'relative' },
  modelPickerBtn: { width: '100%', background: '#131316', border: '1px solid #2a2a32', borderRadius: '6px', color: '#e8e8f0', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', textAlign: 'left' },
  modelSelected: { display: 'flex', alignItems: 'center', gap: '10px' },
  modelPrice: { fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#b5f23a', padding: '2px 6px', background: 'rgba(181,242,58,0.08)', borderRadius: '3px' },
  chevron: { color: '#7a7a90', fontSize: '10px' },
  modelDropdown: { position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#1c1c21', border: '1px solid #2a2a32', borderRadius: '6px', zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden' },
  modelSearch: { width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #2a2a32', color: '#e8e8f0', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', padding: '10px 14px', outline: 'none' },
  modelList: { maxHeight: '220px', overflowY: 'auto' },
  modelOption: { width: '100%', background: 'transparent', border: 'none', color: '#e8e8f0', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' },
  modelOptionActive: { background: 'rgba(181,242,58,0.08)', color: '#b5f23a' },
  modelOptionMeta: { display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#b5f23a' },
  modelCtx: { color: '#7a7a90' },
  modelEmpty: { padding: '16px 14px', color: '#7a7a90', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" },
  modelLoading: { display: 'flex', alignItems: 'center', gap: '10px', color: '#7a7a90', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", padding: '10px 0' },

  // Actions
  actions: { display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '4px' },
  generateBtn: { flex: 1, background: '#b5f23a', border: 'none', borderRadius: '6px', color: '#000', fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: '13px', padding: '14px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s' },
  generateBtnDisabled: { background: '#2a2a32', color: '#7a7a90', cursor: 'not-allowed' },
  clearBtn: { background: 'transparent', border: '1px solid #2a2a32', borderRadius: '6px', color: '#7a7a90', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', padding: '13px 20px', cursor: 'pointer' },

  spinner: { display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(181,242,58,0.2)', borderTopColor: '#b5f23a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  spinnerDark: { display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  errorInline: { color: '#ff4757', fontFamily: "'Space Mono', monospace", fontSize: '12px' },

  // Output
  outputEmpty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '500px', gap: '10px', border: '1px dashed #2a2a32', borderRadius: '8px' },
  emptyIcon: { fontSize: '32px', color: '#3a3a48', marginBottom: '8px' },
  emptyText: { color: '#7a7a90', fontFamily: "'DM Sans', sans-serif", fontSize: '15px' },
  emptySubtext: { color: '#3a3a48', fontFamily: "'Space Mono', monospace", fontSize: '11px' },
  generatingDots: { display: 'flex', gap: '8px', marginBottom: '12px' },
  dot: { width: '10px', height: '10px', background: '#b5f23a', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.4s ease-in-out infinite' },

  errorBox: { border: '1px solid rgba(255,71,87,0.3)', background: 'rgba(255,71,87,0.05)', borderRadius: '8px', padding: '24px' },
  errorTitle: { color: '#ff4757', fontFamily: "'Space Mono', monospace", fontSize: '13px', marginBottom: '8px' },
  errorMsg: { color: '#7a7a90', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' },

  resultBox: { border: '1px solid #2a2a32', borderRadius: '8px', overflow: 'hidden', background: '#0c0c0e' },
  resultHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #2a2a32', background: '#131316' },
  resultMeta: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  resultBadge: { fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#7a7a90', border: '1px solid #2a2a32', padding: '3px 8px', borderRadius: '3px' },
  resultActions: { display: 'flex', alignItems: 'center', gap: '12px' },
  tokenCount: { fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#3a3a48' },
  copyBtn: { background: 'rgba(181,242,58,0.1)', border: '1px solid rgba(181,242,58,0.3)', borderRadius: '4px', color: '#b5f23a', fontFamily: "'Space Mono', monospace", fontSize: '11px', padding: '5px 12px', cursor: 'pointer' },
  resultContent: { padding: '24px', minHeight: '300px' },
  promptText: { fontFamily: "'Space Mono', monospace", fontSize: '13px', lineHeight: '1.8', color: '#e8e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  resultFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #2a2a32', background: '#131316' },
  modelUsed: { fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#3a3a48' },
  regenerateBtn: { background: 'transparent', border: '1px solid #2a2a32', borderRadius: '4px', color: '#7a7a90', fontFamily: "'Space Mono', monospace", fontSize: '11px', padding: '5px 12px', cursor: 'pointer' },
  useAsIntentBtn: { background: 'rgba(181,242,58,0.08)', border: '1px solid rgba(181,242,58,0.3)', borderRadius: '4px', color: '#b5f23a', fontFamily: "'Space Mono', monospace", fontSize: '11px', padding: '5px 12px', cursor: 'pointer' },

  footer: { padding: '20px 48px', borderTop: '1px solid #2a2a32', display: 'flex', gap: '10px', fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#3a3a48', maxWidth: '1200px', margin: '0 auto', width: '100%' },
  footerDivider: { color: '#2a2a32' },
};