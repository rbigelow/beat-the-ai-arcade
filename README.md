
![BEAT THE AI ARCADE logo](https://raw.githubusercontent.com/rbigelow/beat-the-ai-arcade/refs/heads/main/public/logo.png)

# BEAT THE AI ARCADE

> **Can you beat the AI?**

An Applied AI open-house exhibit for Georgian College: a touchscreen-friendly, kiosk-ready arcade of nine short challenges that **make AI visible**. Every game has a **BEHIND THE SCENES** panel showing the input, processing, model/algorithm, decision and result, with live values.

## The nine demos

| # | Game | Category | Honest label |
|---|------|----------|--------------|
| 1 | 🧠 Human or AI? | Generative AI | AI LITERACY ACTIVITY (no model runs) |
| 2 | 🤖 Train Your Own AI | Machine Learning | EDUCATIONAL CLASSIFIER (Naive Bayes word counts trained in the browser, not a neural network) |
| 3 | ❌ Tic-Tac-AI | Search Algorithms | SEARCH ALGORITHM: Minimax (unbeatable) |
| 4 | 🔐 Cyber Detective | AI + Cybersecurity | RULE-BASED DEMO (hand-written rules, not a trained model) |
| 5 | ✋ Rock Paper Scissors AI | Computer Vision | LIVE AI MODEL: MediaPipe Gesture Recognition |
| 6 | 🎨 Drawing Recognition | Computer Vision | DEMO MODE (simulated) until a TensorFlow.js model is added; then LIVE AI MODEL |
| 7 | 🐦 Flappy AI | Evolutionary AI | LIVE LEARNING SIMULATION: Genetic Algorithm / Neuroevolution |
| 8 | 🧩 AI Maze Escape | Search Algorithms | LIVE SEARCH ALGORITHM: BFS / Dijkstra / A* / DFS / Greedy |
| 9 | 🎤 AI Sound Detective | Audio Classification | LIVE AI MODEL: TensorFlow.js Audio Classification (or AUDIO SIGNAL DEMO before a model exists) |

## Technology stack

React · Vite · JavaScript/JSX · Tailwind CSS (v4) · Framer Motion · Lucide React · MediaPipe Tasks Vision · TensorFlow.js · Web Audio API · Canvas API · ESLint. No TypeScript, no backend.

## Requirements

- Node.js 20+ and npm
- A modern browser (Chrome, Edge, Firefox or Safari) with a camera/microphone for the games that use them
- Camera and microphone access requires `https://` or `http://localhost`

## Installation

```bash
npm install
```

`npm install` (and `npm run dev` / `npm run build`) runs `scripts/prepare-assets.mjs`, which copies the MediaPipe WASM files into `public/mediapipe/wasm/` (git-ignored) and tries to download the MediaPipe gesture model to `public/models/gesture_recognizer.task` (also git-ignored). If you are offline, see [Model assets](#model-assets).

## Development

```bash
npm run dev       # start the Vite dev server
npm run lint      # ESLint
npm run build     # production build in dist/
npm run preview   # serve the production build
```

## Testing

```bash
npm test          # unit tests for the AI code (Minimax, mazes, neuroevolution, audio features)
npm run lint
npm run build
```

### Manual test checklist

```text
[ ] Home loads
[ ] Logo/fallback works
[ ] Georgian colours correct
[ ] Nine game cards appear
[ ] All games open
[ ] Back to Arcade works

[ ] Human or AI completes 5 rounds
[ ] Train Your Own AI accepts/trains/tests
[ ] Tic-Tac-AI Minimax cannot be beaten
[ ] Cyber Detective completes 5 rounds

[ ] Camera permission works
[ ] MediaPipe loads
[ ] Rock/Paper/Scissors recognized
[ ] Camera stops on exit

[ ] Drawing works by mouse/touch
[ ] Clear/Next works
[ ] Transparency label correct

[ ] Flappy starts automatically
[ ] Generations advance
[ ] Fitness/statistics calculated live
[ ] Sensors/decisions visualized
[ ] Pause/resume/restart/speed work

[ ] Maze starts automatically
[ ] Generated mazes solvable
[ ] BFS/Dijkstra/A* work
[ ] Frontier/explored/path visualized
[ ] Metrics calculated
[ ] Side-by-side identical maze comparison works

[ ] Microphone permission works
[ ] Audio model loads/training fallback works
[ ] Clap/Whistle/Snap/Voice classification works
[ ] Waveform/spectrogram use real audio
[ ] Probability bars use model output
[ ] Microphone cleanup works

[ ] Behind the Scenes exists in all games
[ ] Idle reset works
[ ] Media devices stop on reset
[ ] Accessibility/focus works
[ ] Reduced motion works
[ ] Desktop/tablet/mobile layouts work

[ ] npm run lint passes
[ ] npm run build passes
```

## Logo

Place the **authorised** Georgian College logo at `public/logo.png`. It is shown in every header and in the footer. If the file is missing a neutral same-size "LOGO" placeholder is shown instead. The logo is never recreated in code.

## Model assets

| Asset | Location | Notes |
|-------|----------|-------|
| MediaPipe WASM | `public/mediapipe/wasm/` | Copied from `node_modules` by `scripts/prepare-assets.mjs` |
| Gesture model | `public/models/gesture_recognizer.task` | Download from <https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task>. If the file is missing the app falls back to that URL online, and shows a clear error offline. |
| Sound model (optional) | `public/models/sound-detective/` | `model.json`, weight `*.bin` files and `metadata.json` (below) |
| Drawing model (optional) | `public/models/drawing/` | `model.json`, `*.bin`, `metadata.json` with `{ "classes": [...] }`; input `[1, 28, 28, 1]` ink values 0..1 |
| Audio samples | `public/audio/` | Reserved for licensed recorded samples. The built-in Sample Sound Mode synthesises its own original sounds, so no third-party audio is needed |

**Sound model contract.** A TensorFlow.js layers model with input shape `[null, 512]` (a 16-frame × 32-band log-magnitude spectrogram produced by `src/ai/audioFeatures.js`, `extractFeatures`) and a softmax output with one value per class listed in `metadata.json`:

```json
{ "classes": ["clap", "whistle", "snap", "voice", "background"], "inputSize": 512 }
```

If no valid model is found, **Guided Training Mode** records about 8 examples per sound from the microphone (or generates sample sounds in Sample Sound Mode) and trains a small TensorFlow.js model in the browser. The standard Speech Commands model is **not** claimed to recognise claps, whistles or snaps. Nothing ever falls back to random predictions: without a model, only the real waveform/spectrogram are shown, labelled **AUDIO SIGNAL DEMO**.

### Drawing Recognition: demo mode, model size and Quick, Draw! models

The game starts with **DEMO MODE ON** (simulated predictions, clearly labelled). Use the **DEMO MODE** switch on the screen to turn it off, and the **Model input size** dropdown to choose **28×28** or **256×256**.

With demo mode off, the game loads a real TensorFlow.js model, in this order:

1. **Local:** `public/models/drawing/<size>/` (`model.json`, `*.bin`, `metadata.json`). For 28×28, `public/models/drawing/` is also checked.
2. **Remote (optional):** the URL of a hosted `model.json` set in `.env.local` as `VITE_QUICKDRAW_MODEL_URL_28` or `VITE_QUICKDRAW_MODEL_URL_256`, with `metadata.json` beside it. Rebuild after changing it.

If neither works, the game shows *what happened / how to fix it*, **RETRY**, and download links. It **never** silently falls back to simulated output.

`metadata.json` must list the class names in output order, e.g. `{ "classes": ["cat", "car", "house"] }`. The model input must be `[null, size, size, 1]` with ink = 1 on a blank = 0 background (the same convention as Quick, Draw! bitmaps). Models trained on the official [Quick, Draw! dataset](https://github.com/googlecreativelab/quickdraw-dataset) ([28×28 bitmaps](https://console.cloud.google.com/storage/browser/quickdraw_dataset/full/numpy_bitmap)) and converted with `tensorflowjs_converter` fit this contract. Google does not publish an official pretrained TF.js Quick, Draw! model, so no model is bundled or auto-downloaded; supply your own or a community one that you have checked for licence and format.

To change the program QR code placeholder, set `VITE_PROGRAM_URL` (for example in `.env.local`) to an authorised URL; nothing is invented by default.

## Camera and microphone permissions

A privacy explanation is shown **before** any permission prompt. If permission is denied or no device exists, a screen explains what happened, how to fix it, and offers **RETRY** and **BACK TO ARCADE** (the Sound Detective also offers Sample Sound Mode).

## Privacy

- Camera frames and audio are processed live in the browser. They are not saved, uploaded, or screenshotted. No face recognition or demographics.
- Camera tracks, microphone tracks, MediaPipe, and AudioContexts are stopped/closed when you leave a game, when the page unmounts, and on idle reset. Temporary training samples are discarded on reset.
- No names, emails, faces, voices or other personal data are collected. Session stats (games played, best score) live only in memory.
- Flappy AI and Maze Escape collect no visitor information.

## Offline / open-house considerations

- Everything runs client-side; use `npm run build` then `npm run preview` (or serve `dist/`) on the exhibit machine.
- Run `npm install` once while online so the MediaPipe WASM and gesture model are stored locally.
- **KIOSK MODE** (default on, toggle on the home screen): after 90 s without pointer, touch or keyboard activity a "STILL THERE?" dialog appears for 10 s, then the app returns home, resets session stats, stops webcam/microphone, closes AudioContexts and cancels simulations.
- Sound effects are **off** by default (🔇/🔊 toggle) and are disabled automatically while the Sound Detective listens.
- `prefers-reduced-motion` is respected.

## AI transparency

Each game labels what is really happening: algorithm, simulation, rule-based demo or real model. There are no fabricated predictions or metrics: Minimax node counts, A* costs, Flappy fitness values, probabilities and audio levels are all computed live. The drawing demo explicitly says its recognition is simulated until a real model is supplied.

## Project structure

```text
src/components   shared UI (header, Behind the Scenes, pipeline, confidence bars, complete screen, idle dialog...)
src/games        the nine games
src/ai           Minimax, neural network, genetic algorithm, Flappy environment, maze algorithms, audio features/classifier
src/hooks        useIdleReset, useMicrophone, useWebAudioAnalyser, useReducedMotion
src/data         game registry and game content
```

Adding a game: create a component in `src/games/`, then add an entry (`id`, `title`, `icon`, `category`, `tagline`, `component`) to `src/data/gameRegistry.js`.

## Troubleshooting

- **Camera/mic blocked**: allow access in the browser address bar; use `localhost` or HTTPS.
- **Gesture model failed to load**: save `gesture_recognizer.task` in `public/models/` (see above) and retry.
- **Sound model mismatch**: the model input must be `[null, 512]` with a matching `metadata.json`; otherwise Guided Training Mode is used.
- **Blank logo**: add `public/logo.png`.
- **Audio too quiet/loud**: the Sound Detective shows signal quality; move closer or back from the microphone.
