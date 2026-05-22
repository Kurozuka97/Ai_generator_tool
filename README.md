# Ai_generator_tool
# ⚡ PromptCraft — AI Prompt Generator

General-purpose prompt generator powered by OpenRouter. Built with Next.js, ready to deploy on Vercel.

## Features

- 🎯 General-purpose prompt generation (writing, coding, creative, analysis, etc.)
- 🤖 Choose any model from OpenRouter (auto-fetched)
- ⚙️ Configure tone, category, output length, language
- 📋 One-click copy
- 🔑 API key stays server-side (never exposed to client)

---

## Setup

### 1. Clone & install

```bash
git clone <your-repo>
cd prompt-generator
npm install
```

### 2. Add environment variable

```bash
cp .env.example .env.local
# Edit .env.local and add your OpenRouter API key
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx
```

Get your key at: https://openrouter.ai/keys

### 3. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repo to Vercel dashboard.

**Add environment variable in Vercel:**
- Go to your project → Settings → Environment Variables
- Add `OPENROUTER_API_KEY` = your key
- Redeploy

---

## Project Structure

```
├── pages/
│   ├── index.js          # Main UI
│   ├── _app.js
│   ├── _document.js
│   └── api/
│       ├── generate.js   # POST — calls OpenRouter to generate prompt
│       └── models.js     # GET  — fetches available models
├── styles/
│   └── globals.css
├── .env.example
└── package.json
```