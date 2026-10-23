# SignBridge / SignText

**Every gesture deserves to be understood.**

A premium, open-source Indian Sign Language (ISL) two-way communication application with an integrated SignText marketing website and demo authentication flow.

---

## Quick Start (Windows PowerShell)

```powershell
# Navigate to project
cd C:\Users\erson\.gemini\antigravity-ide\scratch\signbridge

# Install dependencies (already done if node_modules exists)
npm install

# Start the development server
npm run dev
```

Then open **https://signbridge-one-swart.vercel.app/** in Chrome or Edge.

---

## Application Flow

```
Landing Page (SignText Website)
  ├── "Try SignText for Free" → Workspace (bypasses auth)
  ├── "Sign Up" → Sign Up Page → Workspace
  └── "Log In" → Login Page → Workspace
       └── Workspace has "← SignText Home" button (returns to landing)
```

**Demo Access:** Enter any syntactically valid email (e.g. `name@example.com`) and any non-empty password. No database, no credentials stored, no confirmation email.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start development server at https://signbridge-one-swart.vercel.app/ |
| `npm run build` | Production build to `dist/` |
| `npm run test` | Run Vitest unit tests |
| `npm run audit:colors` | Source + CSSOM no-blue color audit |
| `npm run verify` | Full pipeline: model check + color audit + tests + tsc + build |
| `npm run check:models` | Verify MediaPipe WASM and model assets |

---

## Architecture

### Pages / Routes (client-side state machine, no router library)

| Page | Component | Path |
|---|---|---|
| SignText Landing | `src/features/website/SignTextLanding.tsx` | `/` (initial) |
| Sign Up | `src/features/website/SignUpPage.tsx` | state: `signup` |
| Log In | `src/features/website/LoginPage.tsx` | state: `login` |
| Live Workspace | `src/features/conversation/LiveWorkspace.tsx` | state: `app` |
| Learn Signs (ISL) | `src/features/vocabulary/LearnSignsView.tsx` | tab: `learn` |
| History | `src/features/history/HistoryView.tsx` | tab: `history` |
| Settings | `src/features/settings/SettingsView.tsx` | tab: `settings` |

### Key Feature Modules

```
src/
  features/
    website/         ← SignText landing, login, signup, hero graphic
    camera/          ← useCamera hook, CameraPreview component
    tracking/        ← useHandTracker (MediaPipe HandLandmarker)
    recognition/     ← ISLGeometricClassifier, ManualDemoSource, TemporalBuffer
    conversation/    ← LiveWorkspace, MessageList, ProposalComposer, ReplyComposer
    speech/          ← useSpeech (Web Speech API)
    vocabulary/      ← LearnSignsView, ISL signs data
    history/         ← historyStore (localStorage), HistoryView
    settings/        ← SettingsContext, SettingsView
  styles/
    tokens.css       ← CSS design tokens (warm palette)
    base.css         ← Reset and global styles
    components.css   ← App UI component styles
    website.css      ← Landing page and auth styles
  scripts/
    audit-colors.mjs ← Source-level no-blue color audit
    runtime-style-audit.mjs ← CSSOM color audit
    check-model.mjs  ← MediaPipe local asset check
```

---

## Recognition Status

| Mode | Status | Description |
|---|---|---|
| **ISL Geometric** | ✅ Implemented | Rule-based geometric classifier using 21 hand landmarks for verified static ISL signs |
| **Hand Tracking Only** | ✅ Implemented | MediaPipe HandLandmarker running locally — no sign classification |
| **Demo / Testing Mode** | ✅ Implemented | Manual candidate selection, clearly labelled as demo |
| **Real ML Classifier** | ❌ Not available | No pre-trained ISL neural network model found within time constraints |

### Supported Verified Vocabulary (ISL Geometric)
- Namaste / Hello
- Thank You  
- Please Wait
- Where is Room?
- Fee Counter
- Numbers 1–5

Signs are derived from verified ISL reference descriptions. They are never fabricated. See `docs/SIGNS.md` for sources.

---

## Camera & Privacy

- Camera permission is **explicit** — only requested after clicking "Start Camera"
- All webcam frames processed **locally in-browser** via MediaPipe WebAssembly
- Zero video footage uploaded, recorded, or persisted anywhere
- Active camera indicator always visible while camera is running
- "Stop Camera" accessible at all times
- Transcripts saved to `localStorage` only when user enables "Save Transcripts"
- Full data export and deletion available in Settings

See `docs/PRIVACY.md` for full disclosure.

---

## Camera Lag Fixes Applied

The following changes resolve webcam lag and stutter:

1. **`useHandTracker.ts`** — Throttled inference to ≤30 FPS (32ms floor between frames), eliminating CPU starvation that caused video lag. Removed `fps` from `useCallback` dependency array to prevent unnecessary loop restarts. Added monotonically increasing timestamp guard for MediaPipe.
2. **`useHandTracker.ts`** — Added CPU delegate fallback when GPU delegate fails or is unavailable.
3. **`useCamera.ts`** — Changed `play()` to use `onloadedmetadata` callback ensuring video plays only after metadata is ready, plus immediate play attempt if already loaded.
4. **`CameraPreview.tsx`** — Added `autoPlay` attribute to `<video>` element.
5. **`LiveWorkspace.tsx`** — Functional state comparisons (`prev !== next ? next : prev`) to prevent unnecessary re-renders from unchanged recognition states.

---

## Design System

- **No blue anywhere** — strict warm palette enforced by `npm run audit:colors`
- Main surface: Ivory `#FAF3E8`
- Cards: Cream `#FFF9F1`
- Primary action: Terracotta `#B94E2F`
- Accent: Burnt orange `#C96332`
- Headings/nav: Chocolate `#382116`
- Success: Olive `#65784B`
- Error: Brick `#B84032`
- Typography: Fraunces (display) + DM Sans (body)

---

## License

MIT License — See `LICENSE` file.  
MediaPipe Tasks Vision: Apache 2.0 (Google LLC)  
Lucide React Icons: ISC License

---

## Hackathon Demo Instructions

See `docs/DEMO.md` for step-by-step demo script.

**Quick demo path:**
1. `npm run dev` → open http://localhost:5173
2. Click "Try SignText for Free" (or Sign Up with any email/password)
3. In workspace: click "Start Camera" → hands are tracked live
4. Switch to Demo Mode in recognition settings → tap sample signs from the demo bar
5. Confirm sign → it appears in conversation
6. Type a reply → click Send → use TTS to speak it aloud
7. Show Learn Signs tab, History tab, Settings
8. Click "← SignText Home" to return to landing page
