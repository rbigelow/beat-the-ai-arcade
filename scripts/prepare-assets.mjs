// Copies MediaPipe WASM files from node_modules into public/ so they are served locally (offline friendly),
// and tries to download the gesture model once if it is not already present. Never fails the install.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'

const WASM_SOURCE = 'node_modules/@mediapipe/tasks-vision/wasm'
const WASM_TARGET = 'public/mediapipe/wasm'
const MODEL_PATH = 'public/models/gesture_recognizer.task'
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task'

if (existsSync(WASM_SOURCE)) {
  mkdirSync(WASM_TARGET, { recursive: true })
  cpSync(WASM_SOURCE, WASM_TARGET, { recursive: true })
  console.log('MediaPipe WASM copied to', WASM_TARGET)
}

if (!existsSync(MODEL_PATH)) {
  try {
    const response = await fetch(MODEL_URL, { signal: AbortSignal.timeout(20000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    mkdirSync('public/models', { recursive: true })
    writeFileSync(MODEL_PATH, Buffer.from(await response.arrayBuffer()))
    console.log('Gesture model downloaded to', MODEL_PATH)
  } catch (error) {
    console.warn(`Could not download the gesture model (${error.message}).`)
    console.warn(`Download it manually from ${MODEL_URL} and save it as ${MODEL_PATH}.`)
  }
}
