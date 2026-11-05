// Drawing classifier architecture: preprocessing is real; the classifier is pluggable.
// - DEMO MODE (default) uses a clearly-labelled simulated classifier. Its output is NOT real recognition.
// - With demo mode off, a TensorFlow.js model is loaded for the chosen input size (28 or 256):
//   1. local:  public/models/drawing/<size>/ (model.json + metadata.json), 28 also checks public/models/drawing/
//   2. remote: VITE_QUICKDRAW_MODEL_URL_<size> (URL of a model.json; metadata.json must sit beside it)
//   If neither works, loading fails with a clear error. It never silently simulates.
import { loadTensorFlow } from './audioClassifier.js'
import { DRAWING_PROMPTS } from '../data/drawingPrompts.js'

export const DRAWING_INPUT_SIZE = 28
export const DRAWING_INPUT_SIZES = [28, 256]

const MODEL_URL = 'https://raw.githubusercontent.com/yining1023/doodleNet/master/demo/DoodleClassifier_345/model/model.json'
const LABELS_URL = 'https://raw.githubusercontent.com/yining1023/doodleNet/master/demo/DoodleClassifier_345/model/class_names.txt'

export const DRAWING_MODEL_DOWNLOADS = {
  28: {
    localPath: 'public/models/drawing/28/',
    remoteEnv: 'VITE_QUICKDRAW_MODEL_URL_28',
    remoteUrl: import.meta.env.VITE_QUICKDRAW_MODEL_URL_28 || MODEL_URL,
    remoteLabelsUrl: LABELS_URL,
  },
  256: {
    localPath: 'public/models/drawing/256/',
    remoteEnv: 'VITE_QUICKDRAW_MODEL_URL_256',
    remoteUrl: import.meta.env.VITE_QUICKDRAW_MODEL_URL_256,
  },
}

export const QUICKDRAW_DATASET_URL = 'https://github.com/googlecreativelab/quickdraw-dataset'
export const QUICKDRAW_BITMAP_URL = 'https://console.cloud.google.com/storage/browser/quickdraw_dataset/full/numpy_bitmap'

export function isCanvasEmpty(canvas) {
  const ctx = canvas.getContext('2d')
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return false
  return true
}

/** Resize drawing to 28x28 and normalise ink to 0..1 (1 = ink). Returns Float32Array. */
export function preprocessDrawing(canvas, size = DRAWING_INPUT_SIZE) {
  const small = document.createElement('canvas')
  small.width = size
  small.height = size
  const ctx = small.getContext('2d', { willReadFrequently: true })
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, small.width, small.height)
  ctx.drawImage(canvas, 0, 0, small.width, small.height)
  const { data } = ctx.getImageData(0, 0, small.width, small.height)
  const pixels = new Float32Array(size * size)
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

async function tryLoadModel(base, size, labelsUrl) {
  let classes
  if (labelsUrl) {
    const labelsResponse = await fetch(labelsUrl)
    if (!labelsResponse.ok) throw new Error('could not load class labels')
    classes = (await labelsResponse.text()).split(/\r?\n/).map((label) => label.trim()).filter(Boolean)
  } else {
    const meta = await fetch(`${base}/metadata.json`)
    if (!meta.ok) throw new Error('no metadata')
    ;({ classes } = await meta.json())
  }
  if (!Array.isArray(classes) || classes.length === 0) throw new Error('metadata has no classes')
  const tf = await loadTensorFlow()
  const model = await tf.loadLayersModel(`${base}/model.json`)
  const shape = model.inputs[0].shape
  if (shape[1] !== size || shape[2] !== size) {
    model.dispose()
    throw new Error(`model expects ${shape[1]}x${shape[2]} input, not ${size}x${size}`)
  }
  return {
    mode: 'model',
    inputSize: size,
    classify(pixels) {
      return tf.tidy(() => {
        const out = model.predict(tf.tensor4d(Array.from(pixels), [1, size, size, 1]))
        const probs = Array.from(out.dataSync())
        return classes.map((id, i) => ({ id, label: id, probability: probs[i] ?? 0 }))
          .sort((a, b) => b.probability - a.probability)
      })
    },
    dispose() { model.dispose() },
  }
}

/** Loads a real model for `size`. Resolves { classifier, source } or rejects with an Error (never simulates). */
export async function loadDrawingClassifier(size = DRAWING_INPUT_SIZE) {
  const root = `${import.meta.env.BASE_URL}models/drawing`
  const candidates = [{ base: `${root}/${size}`, source: 'local' }]
  if (size === 28) candidates.push({ base: root, source: 'local' })
  const remote = DRAWING_MODEL_DOWNLOADS[size]?.remoteUrl
  if (remote) candidates.push({
    base: remote.replace(/\/model\.json$/, ''),
    source: 'remote',
    labelsUrl: DRAWING_MODEL_DOWNLOADS[size]?.remoteLabelsUrl,
  })
  const failures = []
  for (const { base, source, labelsUrl } of candidates) {
    try {
      return { classifier: await tryLoadModel(base, size, labelsUrl), source }
    } catch (error) {
      failures.push(`${base}: ${error.message}`)
    }
  }
  throw new Error(`No ${size}×${size} drawing model could be loaded. Tried ${failures.join('; ')}`)
}
