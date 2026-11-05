// Drawing classifier architecture: preprocessing is real; the classifier is pluggable.
// - A TensorFlow.js model placed at public/models/drawing/ (model.json + metadata.json) is used if present.
// - Otherwise a clearly-labelled DEMO classifier is used. Its output is simulated, NOT real recognition.
import { loadTensorFlow } from './audioClassifier.js'
import { DRAWING_PROMPTS } from '../data/drawingPrompts.js'

export const DRAWING_INPUT_SIZE = 28

export function isCanvasEmpty(canvas) {
  const ctx = canvas.getContext('2d')
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return false
  return true
}

/** Resize drawing to 28x28 and normalise ink to 0..1 (1 = ink). Returns Float32Array. */
export function preprocessDrawing(canvas) {
  const small = document.createElement('canvas')
  small.width = DRAWING_INPUT_SIZE
  small.height = DRAWING_INPUT_SIZE
  const ctx = small.getContext('2d', { willReadFrequently: true })
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, small.width, small.height)
  ctx.drawImage(canvas, 0, 0, small.width, small.height)
  const { data } = ctx.getImageData(0, 0, small.width, small.height)
  const pixels = new Float32Array(DRAWING_INPUT_SIZE * DRAWING_INPUT_SIZE)
  for (let i = 0; i < pixels.length; i += 1) pixels[i] = 1 - data[i * 4] / 255
  return { pixels, preview: small }
}

function softmax(values) {
  const max = Math.max(...values)
  const exps = values.map((v) => Math.exp(v - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((v) => v / sum)
}

/** DEMO ONLY: deterministic pseudo-scores derived from the pixels. Not a trained model. */
export function createDemoClassifier() {
  return {
    mode: 'demo',
    classify(pixels) {
      const scores = DRAWING_PROMPTS.map((prompt, classIndex) => {
        let hash = 2166136261 ^ classIndex
        for (let i = 0; i < pixels.length; i += 7) {
          hash = Math.imul(hash ^ Math.round(pixels[i] * 10), 16777619)
        }
        return ((hash >>> 0) % 1000) / 250
      })
      const probabilities = softmax(scores)
      return DRAWING_PROMPTS.map((p, i) => ({ id: p.id, label: p.label, probability: probabilities[i] }))
        .sort((a, b) => b.probability - a.probability)
    },
  }
}

export async function loadDrawingClassifier() {
  const base = `${import.meta.env.BASE_URL}models/drawing`
  try {
    const meta = await fetch(`${base}/metadata.json`)
    if (!meta.ok) throw new Error('no metadata')
    const { classes } = await meta.json()
    const tf = await loadTensorFlow()
    const model = await tf.loadLayersModel(`${base}/model.json`)
    return {
      mode: 'model',
      classify(pixels) {
        return tf.tidy(() => {
          const out = model.predict(tf.tensor4d(Array.from(pixels), [1, DRAWING_INPUT_SIZE, DRAWING_INPUT_SIZE, 1]))
          const probs = Array.from(out.dataSync())
          return classes.map((id, i) => ({ id, label: id, probability: probs[i] ?? 0 }))
            .sort((a, b) => b.probability - a.probability)
        })
      },
      dispose() { model.dispose() },
    }
  } catch {
    return createDemoClassifier()
  }
}
